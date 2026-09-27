import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';

const dynamoClient = process.env.AWS_ACCESS_KEY_ID 
  ? new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' }) 
  : null;

export async function insertAuditTrace(row: any) {
  if (dynamoClient && process.env.DYNAMODB_TRACES_TABLE) {
    try {
      const item: Record<string, any> = {};
      
      for (const [key, value] of Object.entries(row)) {
        if (value === undefined || value === null) continue;
        if (typeof value === 'string') item[key] = { S: value };
        else if (typeof value === 'number') item[key] = { N: value.toString() };
        else if (typeof value === 'boolean') item[key] = { BOOL: value };
      }
      
      item['timestamp'] = { S: new Date().toISOString() };

      const command = new PutItemCommand({
        TableName: process.env.DYNAMODB_TRACES_TABLE,
        Item: item,
      });

      await dynamoClient.send(command);
      console.log(`[AWS DynamoDB] Trace inserted: ${row.trace_id}`);
    } catch (e) {
      console.error('[AWS DynamoDB] Failed to insert trace:', e);
    }
  } else {
    console.log('[AWS DynamoDB] AWS credentials not found. Skipping DynamoDB insert.');
  }
}
