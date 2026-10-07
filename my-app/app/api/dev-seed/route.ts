import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs, deleteDoc, doc, setDoc } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

const COLLECTIONS = [
  'business_admins',
  'users',
  'api_keys',
  'chat_history',
  'escalations',
  'documents',
  'fleet_nodes',
  'api_logs'
];

export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not allowed in production' }, { status: 403 });
  }

  try {
    // 1. CLEAR ALL COLLECTIONS
    for (const colName of COLLECTIONS) {
      const snap = await getDocs(collection(db, colName));
      const deletePromises = snap.docs.map(d => deleteDoc(doc(db, colName, d.id)));
      await Promise.all(deletePromises);
      console.log(`Cleared collection: ${colName}`);
    }

    // 2. SEED ADMINS & USERS
    const tenantId = 'tnt_sample01';
    
    // Master Admin (Ops)
    await setDoc(doc(db, 'business_admins', 'ops_admin_id'), {
      email: 'admin@agentforge.ai',
      role: 'ops',
      createdAt: new Date().toISOString()
    });

    // Tenant Admin
    await setDoc(doc(db, 'business_admins', 'tenant_admin_id'), {
      email: 'testadmin@company.com',
      tenantId: tenantId,
      companyName: 'Test Company',
      role: 'admin',
      createdAt: new Date().toISOString()
    });

    // End Users
    await setDoc(doc(db, 'users', 'user_jane_id'), {
      email: 'jane@testcorp.com',
      tenantId: tenantId,
      status: 'active',
      role: 'user',
      createdAt: new Date().toISOString()
    });
    
    await setDoc(doc(db, 'users', 'user_bob_id'), {
      email: 'bob@testcorp.com',
      tenantId: tenantId,
      status: 'pending',
      role: 'user',
      createdAt: new Date().toISOString()
    });

    // 3. SEED API KEYS
    await setDoc(doc(db, 'api_keys', uuidv4()), {
      tenantId,
      key: 'af_' + uuidv4().replace(/-/g, ''),
      name: 'Production Environment',
      createdAt: new Date().toISOString(),
      usageCount: 15420
    });
    
    await setDoc(doc(db, 'api_keys', uuidv4()), {
      tenantId,
      key: 'af_' + uuidv4().replace(/-/g, ''),
      name: 'Staging Environment',
      createdAt: new Date().toISOString(),
      usageCount: 3250
    });

    // 4. SEED FLEET NODES
    const regions = ['us-east-1', 'us-west-2', 'eu-central-1', 'ap-northeast-1'];
    for (let i = 0; i < 6; i++) {
      await setDoc(doc(db, 'fleet_nodes', uuidv4()), {
        tenantId,
        nodeId: `node-${i+100}`,
        region: regions[i % regions.length],
        status: i === 5 ? 'offline' : 'healthy',
        load: Math.floor(Math.random() * 80) + 10,
        uptime: Math.floor(Math.random() * 100000),
        lastPing: new Date().toISOString()
      });
    }

    // 5. SEED CHAT HISTORY (Last 7 days)
    const now = new Date();
    const chatPromises = [];
    for (let i = 0; i < 150; i++) {
      const daysAgo = Math.floor(Math.random() * 7);
      const d = new Date(now);
      d.setDate(d.getDate() - daysAgo);
      d.setHours(Math.floor(Math.random() * 24));
      
      chatPromises.push(setDoc(doc(db, 'chat_history', uuidv4()), {
        tenantId,
        userId: 'user_jane_id',
        message: 'How do I reset my password?',
        reply: 'To reset your password, please contact IT support or use the self-service portal.',
        createdAt: d.toISOString()
      }));
    }
    await Promise.all(chatPromises);

    // 6. SEED ESCALATIONS
    const statuses = ['pending', 'resolved', 'investigating'];
    const urgencies = ['low', 'medium', 'high', 'critical'];
    const escalationPromises = [];
    for (let i = 0; i < 15; i++) {
      const d = new Date(now);
      d.setHours(d.getHours() - Math.floor(Math.random() * 72));
      escalationPromises.push(setDoc(doc(db, 'escalations', uuidv4()), {
        tenantId,
        userId: 'user_jane_id',
        reason: 'User requested complex financial policy clarification not in KB.',
        status: statuses[Math.floor(Math.random() * statuses.length)],
        urgency: urgencies[Math.floor(Math.random() * urgencies.length)],
        createdAt: d.toISOString()
      }));
    }
    await Promise.all(escalationPromises);

    return NextResponse.json({ success: true, message: 'Database fully cleared and seeded with rich mock data!' });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
