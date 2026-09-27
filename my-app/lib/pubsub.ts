import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';

const sqsClient = process.env.AWS_ACCESS_KEY_ID 
  ? new SQSClient({ region: process.env.AWS_REGION || 'us-east-1' }) 
  : null;

export async function publishEscalation(escalationData: any) {
  if (sqsClient && process.env.SQS_ESCALATION_QUEUE_URL) {
    try {
      const command = new SendMessageCommand({
        QueueUrl: process.env.SQS_ESCALATION_QUEUE_URL,
        MessageBody: JSON.stringify(escalationData),
      });
      const response = await sqsClient.send(command);
      console.log(`[AWS SQS] Escalation published: ${response.MessageId}`);
      return response.MessageId;
    } catch (e) {
      console.error('[AWS SQS] Failed to publish escalation to SQS:', e);
    }
  } else {
    console.log('[AWS SQS] AWS credentials not found. Skipping SQS publish.');
  }
  return null;
}
