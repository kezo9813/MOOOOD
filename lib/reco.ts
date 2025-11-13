import { prisma } from './prisma';
import { embedText } from './embeddings';
import { HSV, rgbToHsv } from './colors';

export type ImageWithEmbedding = {
  id: number;
  caption: string | null;
  colorDominant: string | null;
  storageUrl: string;
  hsv?: HSV;
  embedding?: number[] | null;
  folders?: { folderId: number }[];
  tags?: { tag: { name: string } }[];
};

export function cosine(a: number[], b: number[]): number {
  const dot = a.reduce((acc, val, i) => acc + val * b[i], 0);
  const magA = Math.sqrt(a.reduce((acc, val) => acc + val ** 2, 0));
  const magB = Math.sqrt(b.reduce((acc, val) => acc + val ** 2, 0));
  if (!magA || !magB) return 0;
  return dot / (magA * magB);
}

export function mmrDiversify(
  candidates: ImageWithEmbedding[],
  queryVec: number[],
  lambda = 0.3,
  k = 20
): ImageWithEmbedding[] {
  const selected: ImageWithEmbedding[] = [];
  const remaining = [...candidates];
  while (selected.length < k && remaining.length) {
    let bestIndex = 0;
    let bestScore = -Infinity;
    remaining.forEach((candidate, idx) => {
      const sim = candidate.embedding ? cosine(candidate.embedding, queryVec) : 0;
      const diversity = selected.reduce((max, img) => {
        if (!img.embedding || !candidate.embedding) return max;
        return Math.max(max, cosine(img.embedding, candidate.embedding));
      }, 0);
      const mmrScore = lambda * sim - (1 - lambda) * diversity;
      if (mmrScore > bestScore) {
        bestScore = mmrScore;
        bestIndex = idx;
      }
    });
    selected.push(remaining.splice(bestIndex, 1)[0]!);
  }
  return selected;
}

export function orderByColor(images: ImageWithEmbedding[]): ImageWithEmbedding[] {
  return [...images].sort((a, b) => {
    const hsvA = a.hsv ?? [0, 0, 0];
    const hsvB = b.hsv ?? [0, 0, 0];
    if (hsvA[0] !== hsvB[0]) return hsvA[0] - hsvB[0];
    if (hsvA[1] !== hsvB[1]) return hsvA[1] - hsvB[1];
    return hsvA[2] - hsvB[2];
  });
}

export async function orderBySemantic(images: ImageWithEmbedding[], prompt: string): Promise<ImageWithEmbedding[]> {
  const query = (await embedText(prompt)) ?? Array(1536).fill(0);
  return [...images].sort((a, b) => {
    const simA = a.embedding ? cosine(a.embedding, query) : -Infinity;
    const simB = b.embedding ? cosine(b.embedding, query) : -Infinity;
    return simB - simA;
  });
}

export async function recommendContext(
  userId: number,
  scope: 'afterUpload' | 'image' | 'folder' | 'moodboard',
  id?: number
) {
  const baseImages = await prisma.imageAsset.findMany({
    where: { userId },
    include: { embedding: true, imageTags: { include: { tag: true } }, imageFolders: true }
  });
  if (!baseImages.length) return [];
  const enriched: ImageWithEmbedding[] = baseImages.map((img) => ({
    id: img.id,
    caption: img.caption,
    storageUrl: img.storageUrl,
    colorDominant: img.colorDominant,
    embedding: (img.embedding?.vector as unknown as number[] | null) ?? null,
    hsv: img.colorDominant
      ? rgbToHsv(
          parseInt(img.colorDominant.slice(1, 3), 16),
          parseInt(img.colorDominant.slice(3, 5), 16),
          parseInt(img.colorDominant.slice(5, 7), 16)
        )
      : undefined,
    tags: img.imageTags,
    folders: img.imageFolders
  }));

  // Anchor recommendations around the most relevant context vector available for the requested scope.
  let queryVec = enriched[0]?.embedding ?? Array(1536).fill(0);

  if (scope === 'image' && id) {
    const focus = enriched.find((img) => img.id === id);
    if (focus?.embedding) {
      queryVec = focus.embedding;
    }
  }
  if (scope === 'folder' && id) {
    const folderMembers = enriched.filter((img) => img.folders?.some((f) => f.folderId === id));
    if (folderMembers[0]?.embedding) {
      queryVec = folderMembers[0].embedding!;
    }
  }
  if (scope === 'moodboard' && id) {
    const moodboard = await prisma.moodboard.findFirst({ where: { id, userId } });
    const firstId = moodboard?.imageIds?.[0];
    const firstImage = enriched.find((img) => img.id === firstId);
    if (firstImage?.embedding) {
      queryVec = firstImage.embedding;
    }
  }

  const candidates = enriched.filter((img) => (scope === 'image' && id ? img.id !== id : true));
  const ranked = mmrDiversify(candidates, queryVec, 0.3, 12);
  return ranked;
}
