const { DynamoDBClient, CreateTableCommand } = require('@aws-sdk/client-dynamodb');
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

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

async function createTable() {
  const params = {
    TableName: 'agentforge-traces',
    KeySchema: [
      { AttributeName: 'trace_id', KeyType: 'HASH' },
      { AttributeName: 'step_order', KeyType: 'RANGE' }
    ],
    AttributeDefinitions: [
      { AttributeName: 'trace_id', AttributeType: 'S' },
      { AttributeName: 'step_order', AttributeType: 'N' }
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 5,
      WriteCapacityUnits: 5
    }
  };

  try {
    const data = await client.send(new CreateTableCommand(params));
    console.log("✅ Table Created Successfully:", data.TableDescription.TableName);
  } catch (err) {
    if (err.name === 'ResourceInUseException') {
      console.log("⚠️ Table 'agentforge-traces' already exists. You are good to go!");
    } else {
      console.error("❌ Error creating table:", err);
    }
  }
}

createTable();
