import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';

// -------------------------------------------------------------
// 1. PASTE YOUR NEW COMPANY FIREBASE CONFIG HERE

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC33x6-2a0J9xZj3c6BSwfy3OmnQ6rNYvs",
  authDomain: "companytestdb.firebaseapp.com",
  projectId: "companytestdb",
  storageBucket: "companytestdb.firebasestorage.app",
  messagingSenderId: "853239586360",
  appId: "1:853239586360:web:7c4b361b7523ae47df50cd"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function seedDatabase() {
  console.log("Connecting to external database...");

  try {
    const customersRef = collection(db, 'customers');
    console.log("Seeding customers...");
    await addDoc(customersRef, { name: 'Alice Smith', email: 'alice@example.com', status: 'VIP', lifetimeValue: 5000 });
    await addDoc(customersRef, { name: 'Bob Johnson', email: 'bob@example.com', status: 'Regular', lifetimeValue: 400 });
    await addDoc(customersRef, { name: 'Charlie Davis', email: 'charlie@example.com', status: 'VIP', lifetimeValue: 8000 });

    const salesRef = collection(db, 'sales');
    console.log("Seeding sales...");
    await addDoc(salesRef, { product: 'Enterprise Software License', amount: 12000, date: '2026-10-01' });
    await addDoc(salesRef, { product: 'Consulting Hours', amount: 3500, date: '2026-10-05' });
    await addDoc(salesRef, { product: 'Server Maintenance', amount: 800, date: '2026-10-08' });

    console.log("✅ Successfully seeded external company database!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
}

seedDatabase();
