import { db, storage } from './firebase';
import { collection, addDoc } from 'firebase/firestore';
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
    // 1. Generate PDF
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text(`Report: ${topic}`, 20, 20);
    doc.setFontSize(12);
    
    // Split text to fit page width
    const splitText = doc.splitTextToSize(details, 170);
    doc.text(splitText, 20, 30);
    
    // 2. Save to local public folder instead of Firebase Storage (which was returning 404)
    const fs = await import('fs');
    const path = await import('path');
    
    const reportsDir = path.join(process.cwd(), 'public', 'reports', tenantId, userId);
    fs.mkdirSync(reportsDir, { recursive: true });
    
    const fileName = `report_${Date.now()}.pdf`;
    const filePath = path.join(reportsDir, fileName);
    
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
    fs.writeFileSync(filePath, pdfBuffer);
    
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const downloadUrl = `${appUrl}/reports/${tenantId}/${userId}/${fileName}`;
    
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
