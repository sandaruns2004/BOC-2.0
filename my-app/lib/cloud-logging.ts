import { CloudWatchLogsClient, PutLogEventsCommand, DescribeLogStreamsCommand, CreateLogStreamCommand } from '@aws-sdk/client-cloudwatch-logs';

const cwClient = process.env.AWS_ACCESS_KEY_ID 
  ? new CloudWatchLogsClient({ region: process.env.AWS_REGION || 'us-east-1' }) 
  : null;

let nextSequenceTokens: Record<string, string> = {};

export async function logDecisionStep(traceId: string, tenantId: string, step: any) {
  if (!cwClient || !process.env.CLOUDWATCH_LOG_GROUP) {
    console.log('[AWS CloudWatch] Skipped - no credentials. Step:', step.stepType);
    return;
  }

  const logGroupName = process.env.CLOUDWATCH_LOG_GROUP;
  const logStreamName = `tenant-${tenantId}`; 

  try {
    let sequenceToken = nextSequenceTokens[logStreamName];

    if (!sequenceToken) {
      try {
        const describeCommand = new DescribeLogStreamsCommand({
          logGroupName,
          logStreamNamePrefix: logStreamName,
        });
        const streamData = await cwClient.send(describeCommand);
        
        const stream = streamData.logStreams?.find(s => s.logStreamName === logStreamName);
        if (!stream) {
          await cwClient.send(new CreateLogStreamCommand({ logGroupName, logStreamName }));
        } else {
          sequenceToken = stream.uploadSequenceToken as string;
        }
      } catch (e: any) {
        if (e.name === 'ResourceNotFoundException') {
           console.error('[AWS CloudWatch] Log group does not exist. Create it first.');
           return;
        }
      }
    }

    const logEvent = {
      message: JSON.stringify({ traceId, tenantId, ...step }),
      timestamp: Date.now(),
    };

    const command = new PutLogEventsCommand({
      logGroupName,
      logStreamName,
      logEvents: [logEvent],
      sequenceToken,
    });

    const response = await cwClient.send(command);
    nextSequenceTokens[logStreamName] = response.nextSequenceToken as string;
  } catch (e) {
    console.error('[AWS CloudWatch] Failed to put log event:', e);
  }
}
