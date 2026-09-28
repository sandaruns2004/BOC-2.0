const { CloudWatchLogsClient, CreateLogGroupCommand, CreateLogStreamCommand } = require('@aws-sdk/client-cloudwatch-logs');
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
  console.error("❌ Error: AWS credentials missing from .env.local");
  process.exit(1);
}

const client = new CloudWatchLogsClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

async function setupCloudWatch() {
  const logGroupName = process.env.CLOUDWATCH_LOG_GROUP || '/agentforge/decisions';
  
  try {
    await client.send(new CreateLogGroupCommand({ logGroupName }));
    console.log(`✅ Log Group Created: ${logGroupName}`);
  } catch (err) {
    if (err.name === 'ResourceAlreadyExistsException') {
      console.log(`⚠️ Log Group '${logGroupName}' already exists.`);
    } else {
      console.error(`❌ Error creating log group:`, err);
    }
  }

  // Next.js runtime will create the log streams dynamically, so just the group is needed!
}

setupCloudWatch();
