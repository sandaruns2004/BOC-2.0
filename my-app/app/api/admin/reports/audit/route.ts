import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const tenantId = session.tenantId;

    const escQ = query(collection(db, 'escalations'), where('tenantId', '==', tenantId));
    const escSnap = await getDocs(escQ);

    let csvContent = 'Escalation ID,Created At,Urgency,Status,AI Reason\n';
    
    escSnap.forEach(doc => {
      const data = doc.data();
      const date = data.createdAt ? new Date(data.createdAt).toISOString() : 'Unknown Date';
      // wrap reason in quotes to avoid breaking csv format if it contains commas
      const reason = `"${(data.reason || '').replace(/"/g, '""')}"`;
      csvContent += `${doc.id},${date},${data.urgency || data.riskLevel || 'N/A'},${data.status},${reason}\n`;
    });

    return new Response(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="compliance_audit_${tenantId}.csv"`
      }
    });
  } catch (error: any) {
    console.error('Error generating audit report:', error);
    return new Response('Failed to generate report', { status: 500 });
  }
}
