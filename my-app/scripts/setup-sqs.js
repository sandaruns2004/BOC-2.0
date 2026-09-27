const { SQSClient, CreateQueueCommand } = require('@aws-sdk/client-sqs');

const client = new SQSClient({ region: 'us-east-1' });

async function createQueues() {
  const queues = ['agentforge-escalation', 'agentforge-audit-sink'];

  for (const queueName of queues) {
    try {
      const data = await client.send(new CreateQueueCommand({ QueueName: queueName }));
      console.log(`Queue Created: ${queueName} -> ${data.QueueUrl}`);
    } catch (err) {
      console.error(`Error creating queue ${queueName}:`, err);
    }
  }
}

createQueues();
