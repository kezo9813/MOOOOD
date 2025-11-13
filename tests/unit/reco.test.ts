import { cosine, mmrDiversify } from '../../lib/reco';

test('cosine similarity matches expectations', () => {
  const a = [1, 0, 0];
  const b = [1, 0, 0];
  const c = [0, 1, 0];
  expect(cosine(a, b)).toBeCloseTo(1);
  expect(cosine(a, c)).toBeCloseTo(0);
});

test('mmrDiversify limits to k results', () => {
  const candidates = Array.from({ length: 10 }).map((_, idx) => ({ id: idx, embedding: [idx, idx + 1, idx + 2] }));
  const diversified = mmrDiversify(candidates as any, [1, 0, 0], 0.3, 5);
  expect(diversified).toHaveLength(5);
});
