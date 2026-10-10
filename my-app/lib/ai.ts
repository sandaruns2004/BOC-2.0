import { createProviderRegistry, embed } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';

// Provider-neutral AI access. Switch models with environment variables only:
//   AI_CHAT_MODEL=openai:gpt-5.4-mini        or  google:gemini-flash-lite-latest
//   AI_EMBEDDING_MODEL=openai:text-embedding-3-small  or  google:gemini-embedding-2
// Changing AI_EMBEDDING_MODEL requires re-indexing documents: vectors from different
// embedding models are not comparable, so each vector records the model that made it.
export const registry = createProviderRegistry({
  openai: createOpenAI({ apiKey: process.env.OPENAI_API_KEY }),
  google: createGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY }),
});

type ModelId = `${'openai' | 'google'}:${string}`;
function modelId(value: string | undefined, fallback: ModelId): ModelId {
  const id = value?.trim() || fallback;
  if (!/^(openai|google):.+$/.test(id)) throw new Error(`Invalid AI model "${id}". Use "openai:<model>" or "google:<model>".`);
  return id as ModelId;
}

export const chatModelId = modelId(process.env.AI_CHAT_MODEL, 'openai:gpt-5.4-mini');
export const embeddingModelId = modelId(process.env.AI_EMBEDDING_MODEL, 'openai:text-embedding-3-small');
// Must match the Pinecone index dimension.
export const EMBEDDING_DIMENSIONS = 768;

export function chatModel() { return registry.languageModel(chatModelId); }

export async function embedText(text: string): Promise<number[]> {
  try {
    const { embedding } = await embed({ model: registry.embeddingModel(embeddingModelId), value: text, dimensions: EMBEDDING_DIMENSIONS });
    return embedding;
  } catch (e) {
    console.error('[AI] Failed to embed text:', e);
    return [];
  }
}
