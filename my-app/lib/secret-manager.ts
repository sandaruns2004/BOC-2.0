import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';

const ssmClient = process.env.AWS_ACCESS_KEY_ID 
  ? new SSMClient({ region: process.env.AWS_REGION || 'us-east-1' }) 
  : null;

export async function getSecret(secretName: string): Promise<string | null> {
  if (!ssmClient) {
    console.warn(`[AWS SSM] AWS credentials not found. Cannot fetch secret: ${secretName}`);
    return process.env[secretName] || null; // Fallback to env var
  }

  try {
    const command = new GetParameterCommand({
      Name: secretName,
      WithDecryption: true,
    });
    const response = await ssmClient.send(command);
    return response.Parameter?.Value || null;
  } catch (e) {
    console.error(`[AWS SSM] Failed to fetch secret ${secretName}:`, e);
    return null;
  }
}

export async function getTenantToolKey(tenantId: string, toolName: string): Promise<string | null> {
  const paramName = `/agentforge/tenants/${tenantId}/tools/${toolName}/apiKey`;
  return getSecret(paramName);
}
