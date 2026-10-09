import { db, storage } from './firebase';
import { collection, addDoc, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { jsPDF } from 'jspdf';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendEmail({ tenantId, userId, to, subject, body }: { tenantId: string, userId: string, to: string, subject: string, body: string }) {
  console.log(`[Tool: sendEmail] Sending email to ${to} with subject: ${subject}`);
  
  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || '"AgentForge" <noreply@agentforge.local>',
      to,
      subject,
      text: body,
      html: `<p>${body.replace(/\n/g, '<br/>')}</p>`
    });
    
    // Log action in Firebase
    await addDoc(collection(db, 'agent_actions'), {
      tenantId,
      userId,
      agentType: 'email',
      actionDetails: { to, subject },
      status: 'success',
      messageId: info.messageId,
      createdAt: new Date().toISOString()
    });

    return { success: true, message: `Email successfully sent to ${to}.` };
  } catch (error: any) {
    console.error(`[Tool: sendEmail] Error:`, error);
    try {
      await addDoc(collection(db, 'agent_actions'), {
        tenantId,
        userId,
        agentType: 'email',
        actionDetails: { to, subject },
        status: 'error',
        error: error.message,
        createdAt: new Date().toISOString()
      });
    } catch (logErr) {
       console.error("Failed to log error to agent_actions", logErr);
    }
    return { success: false, error: error.message };
  }
}

export async function generateReport({ tenantId, userId, topic, details }: { tenantId: string, userId: string, topic: string, details: string }) {
  console.log(`[Tool: generateReport] Generating report on ${topic}`);
  try {
    // 1. Generate PDF in memory
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text(`Report: ${topic}`, 20, 20);
    doc.setFontSize(12);
    
    // Split text to fit page width
    const splitText = doc.splitTextToSize(details, 170);
    doc.text(splitText, 20, 30);
    
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
    const pdfBase64 = pdfBuffer.toString('base64');
    
    // 2. Save base64 to Firestore (bypasses Vercel read-only filesystem & Firebase Storage rules)
    const reportRef = await addDoc(collection(db, 'reports'), {
      tenantId,
      userId,
      topic,
      pdfBase64,
      createdAt: new Date().toISOString()
    });
    
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://agentforgev2.vercel.app';
    const downloadUrl = `${appUrl}/api/report?id=${reportRef.id}`;
    
    // 3. Log Action
    await addDoc(collection(db, 'agent_actions'), {
      tenantId,
      userId,
      agentType: 'report',
      actionDetails: { topic, downloadUrl },
      status: 'success',
      createdAt: new Date().toISOString()
    });
    
    return { 
      success: true, 
      message: `Report generated successfully. You can download it here: ${downloadUrl}`,
      downloadUrl 
    };
  } catch (error: any) {
    console.error(`[Tool: generateReport] Error:`, error);
    try {
      await addDoc(collection(db, 'agent_actions'), {
        tenantId,
        userId,
        agentType: 'report',
        actionDetails: { topic },
        status: 'error',
        error: error.message,
        createdAt: new Date().toISOString()
      });
    } catch (logErr) {}
    return { success: false, error: error.message };
  }
}

export async function queryDatabase({ tenantId, userId, collectionName, searchQuery }: { tenantId: string, userId: string, collectionName: string, searchQuery: string }) {
  console.log(`[Tool: queryDatabase] Querying collection ${collectionName} for ${searchQuery}`);
  try {
    let targetDb = db;
    let targetQuery;

    // 1. Fetch tenant settings to check for external database config
    const settingsRef = doc(db, 'tenant_settings', tenantId);
    const settingsSnap = await getDoc(settingsRef);
    
    if (settingsSnap.exists() && settingsSnap.data().databaseConfig?.firebaseConfig) {
      const fbConfig = settingsSnap.data().databaseConfig.firebaseConfig;
      const appName = `tenant-${tenantId}`;
      let tenantApp;
      if (getApps().find(app => app.name === appName)) {
        tenantApp = getApp(appName);
      } else {
        tenantApp = initializeApp(fbConfig, appName);
      }
      targetDb = getFirestore(tenantApp);
      // Query external DB without tenant isolation (they own the whole DB)
      targetQuery = query(collection(targetDb, collectionName));
      console.log(`[Tool: queryDatabase] Using external Firebase project: ${fbConfig.projectId}`);
    } else {
      // Query platform DB with tenant isolation
      targetQuery = query(collection(targetDb, collectionName), where('tenantId', '==', tenantId));
    }

    const snapshot = await getDocs(targetQuery);
    
    // We only return up to 10 results to not overwhelm the LLM context
    const results = snapshot.docs.slice(0, 10).map(d => ({ id: d.id, ...d.data() }));

    // Log Action to Platform DB (not tenant DB)
    await addDoc(collection(db, 'agent_actions'), {
      tenantId,
      userId,
      agentType: 'database',
      actionDetails: { collectionName, searchQuery, resultCount: results.length, external: targetDb !== db },
      status: 'success',
      createdAt: new Date().toISOString()
    });

    if (results.length === 0) {
      return { success: true, message: `No matching records found in ${collectionName}.`, data: [] };
    }

    return { 
      success: true, 
      message: `Found ${results.length} records.`,
      data: results 
    };
  } catch (error: any) {
    console.error(`[Tool: queryDatabase] Error:`, error);
    try {
      await addDoc(collection(db, 'agent_actions'), {
        tenantId,
        userId,
        agentType: 'database',
        actionDetails: { collectionName, searchQuery },
        status: 'error',
        error: error.message,
        createdAt: new Date().toISOString()
      });
    } catch (logErr) {}
    return { success: false, error: error.message };
  }
}

export async function escalateToHuman({ tenantId, reason, urgency }: { tenantId: string, reason: string, urgency: 'low' | 'medium' | 'high' }) {
  console.log(`[Tool: escalateToHuman] Escalating for tenant ${tenantId}. Reason: ${reason}`);
  try {
    const docRef = await addDoc(collection(db, 'escalations'), {
      tenantId,
      reason,
      urgency,
      status: 'pending',
      createdAt: new Date().toISOString()
    });
    return { success: true, escalationId: docRef.id, message: `Issue escalated to human operators. Reference ID: ${docRef.id}` };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function checkSystemStatus() {
  console.log(`[Tool: checkSystemStatus] Checking status...`);
  // Simulated check
  return { 
    success: true, 
    status: 'Operational',
    uptime: '99.99%',
    latency: '34ms',
    message: 'All systems are currently operational and within SLA limits.'
  };
}
