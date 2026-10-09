import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { db } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized. Please log in as Admin first.' }, { status: 401 });
  }

  const tenantId = session.tenantId;

  try {
    // 1. Seed Customers
    const customersRef = collection(db, 'customers');
    await addDoc(customersRef, { tenantId, name: 'Alice Smith', email: 'alice@example.com', status: 'VIP', lifetimeValue: 5000 });
    await addDoc(customersRef, { tenantId, name: 'Bob Johnson', email: 'bob@example.com', status: 'Regular', lifetimeValue: 400 });
    await addDoc(customersRef, { tenantId, name: 'Charlie Davis', email: 'charlie@example.com', status: 'VIP', lifetimeValue: 8000 });

    // 2. Seed Sales
    const salesRef = collection(db, 'sales');
    await addDoc(salesRef, { tenantId, product: 'Enterprise Software License', amount: 12000, date: '2026-10-01' });
    await addDoc(salesRef, { tenantId, product: 'Consulting Hours', amount: 3500, date: '2026-10-05' });
    await addDoc(salesRef, { tenantId, product: 'Server Maintenance', amount: 800, date: '2026-10-08' });

    return NextResponse.json({ 
      success: true, 
      message: `Successfully seeded mock customers and sales data for tenant: ${tenantId}` 
    });
  } catch (error: any) {
    console.error('Failed to seed data:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
