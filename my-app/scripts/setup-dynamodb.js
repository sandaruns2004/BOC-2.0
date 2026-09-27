const { DynamoDBClient, CreateTableCommand } = require('@aws-sdk/client-dynamodb');

const client = new DynamoDBClient({ region: 'us-east-1' });

async function createTable() {
  const params = {
    TableName: 'agentforge-traces',
    KeySchema: [
      { AttributeName: 'trace_id', KeyType: 'HASH' },  // Partition key
      { AttributeName: 'step_order', KeyType: 'RANGE' } // Sort key
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
    console.log("Table Created", data);
  } catch (err) {
    console.error("Error", err);
  }
}

createTable();
