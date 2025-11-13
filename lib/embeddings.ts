import OpenAI from 'openai';
import crypto from 'crypto';
import { FEATURE_FLAGS } from '../FEATURE_FLAGS';

const apiKey = process.env.OPENAI_API_KEY;
const openai = apiKey ? new OpenAI({ apiKey }) : null;

function pseudoEmbedding(text: string, dimensions = 1536): number[] {
  // Deterministic hash ensures recommendations remain stable offline or without OpenAI access.
  const hash = crypto.createHash('sha256').update(text).digest();
  const result: number[] = [];
  for (let i = 0; i < dimensions; i += 1) {
    result.push(((hash[i % hash.length] ?? 0) / 255) * 2 - 1);
  }
  return result;
}

export async function embedText(text: string): Promise<number[] | null> {
  if (!text.trim()) return null;
  if (!openai) {
    return pseudoEmbedding(text);
  }
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-large',
    input: text
  });
  return response.data[0]?.embedding ?? null;
}

export async function autoCaptionAndTags(imageUrl: string): Promise<{ caption: string | null; tags: string[] }> {
  if (!openai || !FEATURE_FLAGS.USE_VISION) {
    return { caption: null, tags: [] };
  }
  try {
    const result = await openai.responses.create({
      model: 'gpt-4o-mini',
      input: [
        {
          role: 'user',
          content: [
            { type: 'input_text', text: 'Describe the mood of this image in one short sentence and surface 5 concise tags.' },
            { type: 'input_image', image_url: imageUrl }
          ]
        }
      ]
    });
    const text = result.output?.[0]?.content?.[0]?.text ?? '';
    const [captionLine, tagsLine] = text.split('Tags:');
    const caption = captionLine?.trim() || null;
    const tags = tagsLine
      ? tagsLine
          .split(',')
          .map((t) => t.trim().toLowerCase())
          .filter(Boolean)
      : [];
    return { caption, tags };
  } catch (err) {
    console.error('Vision failure', err);
    return { caption: null, tags: [] };
  }
}
