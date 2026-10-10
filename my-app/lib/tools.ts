import { db } from './firebase';
import { collection, addDoc, query, where, getDocsFromServer, doc, getDocFromServer, limit, runTransaction } from 'firebase/firestore';
import { companyDatabaseConnection } from './company-database';
import { assertCollectionAllowed, orderCollection } from './database-access';
export { companyDatabase } from './company-database';
import { jsPDF } from 'jspdf';
import nodemailer from 'nodemailer';

export async function sendEmail({ tenantId, userId, to, subject, body }: { tenantId: string; userId: string; to: string; subject: string; body: string }) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) return { success: false, error: 'Walkwave email is not configured yet. Your message has not been sent.' };
  const transporter = nodemailer.createTransport({ host: process.env.SMTP_HOST || 'smtp.gmail.com', port: Number(process.env.SMTP_PORT || 587), secure: process.env.SMTP_SECURE === 'true' || process.env.SMTP_PORT === '465', auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }, connectionTimeout: 10000, socketTimeout: 15000 });
  try {
    const info = await transporter.sendMail({ from: process.env.SMTP_FROM || process.env.SMTP_USER, to, subject, text: body });
    if (info.rejected?.length) throw new Error('The mail server rejected the recipient.');
    try { await addDoc(collection(db, 'agent_actions'), { tenantId, userId, agentType: 'email', actionDetails: { to, subject }, status: 'success', messageId: info.messageId, createdAt: new Date().toISOString() }); } catch { console.error('Email sent, but action logging failed. Do not resend automatically.'); }
    return { success: true, message: 'The mail server accepted your email. Check your inbox or spam folder.' };
  } catch {
    try { await addDoc(collection(db, 'agent_actions'), { tenantId, userId, agentType: 'email', actionDetails: { to, subject }, status: 'error', createdAt: new Date().toISOString() }); } catch { /* preserve send failure */ }
    return { success: false, error: 'Unable to send the email. Check the SMTP configuration and try again.' };
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
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to generate the report.';
    console.error(`[Tool: generateReport] Error:`, error);
    try {
      await addDoc(collection(db, 'agent_actions'), {
        tenantId,
        userId,
        agentType: 'report',
        actionDetails: { topic },
        status: 'error',
        error: message,
        createdAt: new Date().toISOString()
      });
    } catch { /* preserve the original report failure */ }
    return { success: false, error: message };
  }
}

export interface CustomerOrder {
  orderId: string; productName: string; shippingStatus: string; trackingNumber: string | null;
  estimatedDelivery: string | null; currency: string; totalAmount: number;
}

export async function getCustomerOrders(tenantId: string, userId: string, orderId?: string, requestedCollection?: string): Promise<CustomerOrder[]> {
  if (!tenantId || !userId || userId === 'unknown') throw new Error('Sign in to access your orders.');
  const { database: target, config } = await companyDatabaseConnection(tenantId);
  const collectionName = orderCollection(config);
  assertCollectionAllowed(config, collectionName);
  if (requestedCollection && requestedCollection !== collectionName) throw new Error('Only the configured customer order collection is available to this assistant.');
  const user = (await getDocFromServer(doc(db, 'users', userId))).data();
  if (!user || user.tenantId !== tenantId || user.isActive !== true) throw new Error('Customer is not authorized for this company.');
  if (user.externalCustomerId && user.externalProjectId !== target.app.options.projectId) throw new Error('The customer database connection changed. Sync customers again before checking orders.');
  const customerId = typeof user.externalCustomerId === 'string' ? user.externalCustomerId : userId;
  const conditions = [where('tenantId', '==', tenantId), where('customerId', '==', customerId)];
  if (orderId) conditions.push(where('orderId', '==', orderId));
  const result = await getDocsFromServer(query(collection(target, collectionName), ...conditions, limit(10)));
  const orders = result.docs.map(d => {
    const o = d.data();
    return { orderId: String(o.orderId), productName: String(o.productName), shippingStatus: String(o.shippingStatus), trackingNumber: o.trackingNumber || null, estimatedDelivery: o.estimatedDelivery || null, currency: String(o.currency || 'LKR'), totalAmount: Number(o.totalAmount || 0) };
  });
  await addDoc(collection(db, 'agent_actions'), { tenantId, userId, agentType: 'database', actionDetails: { collectionName, resultCount: orders.length }, status: 'success', createdAt: new Date().toISOString() });
  return orders;
}

export async function queryDatabase({ tenantId, userId, collectionName, searchQuery }: { tenantId: string; userId: string; collectionName: string; searchQuery: string }) {
  if (!collectionName) return { success: false, error: 'An order collection name is required.' };
  try { return { success: true, data: await getCustomerOrders(tenantId, userId, searchQuery.match(/(?:WW|NV)-\d{4}/i)?.[0].toUpperCase(), collectionName) }; }
  catch { return { success: false, error: 'Unable to retrieve your orders.' }; }
}

export async function escalateToHuman({ tenantId, userId, reason, urgency, requestId, userMessage, reviewRule }: { tenantId: string; userId?: string; reason: string; urgency: 'low' | 'medium' | 'high'; requestId?: string; userMessage?: string; reviewRule?: string }) {
  const id = requestId ? tenantId + '_' + userId + '_' + requestId : crypto.randomUUID();
  const reference = doc(db, 'escalations', id);
  await runTransaction(db, async transaction => {
    const previous = await transaction.get(reference);
    if (!previous.exists()) transaction.set(reference, { tenantId, userId: userId || null, reason, urgency, userMessage: userMessage || reason, reviewRule: reviewRule || 'The assistant requested human review.', status: 'pending', createdAt: new Date().toISOString() });
  });
  return { success: true, escalationId: id, message: 'Your request is pending manager review. No refund has been issued.' };
}

export async function checkSystemStatus() { return { success: true, status: 'Demo environment', message: 'This is a sample integration, not a production health measurement.' }; }
