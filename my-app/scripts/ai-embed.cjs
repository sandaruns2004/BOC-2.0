/* Script-side mirror of lib/ai.ts embedding config. Keep the defaults in sync with lib/ai.ts. */
const EMBEDDING_DIMENSIONS = 768;
const embeddingModelId = process.env.AI_EMBEDDING_MODEL?.trim() || 'openai:text-embedding-3-small';

function requiredKey() {
  const provider = embeddingModelId.split(':')[0];
  if (provider === 'openai') return 'OPENAI_API_KEY';
  if (provider === 'google') return process.env.GOOGLE_GENERATIVE_AI_API_KEY ? 'GOOGLE_GENERATIVE_AI_API_KEY' : 'GEMINI_API_KEY';
  throw new Error(`Invalid AI_EMBEDDING_MODEL "${embeddingModelId}". Use "openai:<model>" or "google:<model>".`);
}

let modelPromise;
async function model() {
  modelPromise ??= (async () => {
    const [{ createProviderRegistry }, { createOpenAI }, { createGoogleGenerativeAI }] = await Promise.all([import('ai'), import('@ai-sdk/openai'), import('@ai-sdk/google')]);
    const registry = createProviderRegistry({
      openai: createOpenAI({ apiKey: process.env.OPENAI_API_KEY }),
      google: createGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY }),
    });
    return registry.embeddingModel(embeddingModelId);
  })();
  return modelPromise;
}

async function embedText(text) {
  const { embed } = await import('ai');
  const { embedding } = await embed({ model: await model(), value: text, dimensions: EMBEDDING_DIMENSIONS });
  return embedding;
}

module.exports = { embedText, embeddingModelId, requiredKey, EMBEDDING_DIMENSIONS };
