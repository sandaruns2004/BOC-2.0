const { Pinecone } = require('@pinecone-database/pinecone');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const envPath = path.join(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf8');
  envConfig.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      process.env[match[1].trim()] = match[2].trim();
    }
  });
}

const { embedText, embeddingModelId } = require('./ai-embed.cjs');
const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
const indexName = process.env.PINECONE_INDEX_NAME || 'agentforge';

const documents = [
  {
    title: "Acme Corp Refund Policy",
    content: "All refunds over $1,000 must be manually approved by a human manager. Refunds under $1,000 can be processed automatically if the item is returned within 30 days. Items damaged in transit are eligible for an immediate full refund."
  },
  {
    title: "Acme Corp Shipping Guidelines",
    content: "Standard shipping takes 3-5 business days. Expedited shipping is 1-2 business days. If a package is lost in transit for more than 7 days, the customer is entitled to a full replacement or refund. Do not charge customers for lost packages."
  },
  {
    title: "Acme Corp Subscription Terms",
    content: "Premium subscriptions cost $99/month. Users can cancel at any time, but partial months are not refunded. If a user downgrades to the free tier, they retain access to premium features until the end of their current billing cycle."
  }
];

async function seedKnowledgeBase() {
  console.log(`Connecting to Pinecone index: ${indexName}...`);
  const index = pc.index(indexName);

  for (const doc of documents) {
    console.log(`\nVectorizing: ${doc.title}...`);
    // 768 dimensions to match Pinecone schema
    const vector = await embedText(doc.content);

    const id = crypto.createHash('md5').update(doc.title).digest('hex');

    console.log(`Uploading to Pinecone...`);
    await index.upsert({
      records: [{
        id,
        values: vector,
        metadata: {
          tenantId: 'acme_corp',
          title: doc.title,
          content: doc.content,
          embeddingModel: embeddingModelId
        }
      }]
    });
    console.log(`✅ Uploaded successfully!`);
  }
  
  console.log(`\n🎉 Knowledge Base seeded successfully! The AI can now answer questions about Acme Corp policies.`);
}

seedKnowledgeBase().catch(console.error);
