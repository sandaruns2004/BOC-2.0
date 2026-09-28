const { SQSClient, CreateQueueCommand } = require('@aws-sdk/client-sqs');
const fs = require('fs');
const path = require('path');

// Manually load .env.local for this standalone script
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

if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
  console.error("❌ Error: AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY are missing from .env.local");
  process.exit(1);
}

const client = new SQSClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

async function createQueues() {
  const queues = ['agentforge-escalation', 'agentforge-audit-sink'];

  for (const queueName of queues) {
    try {
      const data = await client.send(new CreateQueueCommand({ QueueName: queueName }));
      console.log(`✅ Queue Created: ${queueName}`);
      console.log(`🔗 URL: ${data.QueueUrl}\n`);
    } catch (err) {
      console.error(`❌ Error creating queue ${queueName}:`, err);
    }
  }
}

createQueues();
