import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export const loginSchema = registerSchema;

export const uploadSchema = z.object({
  folderIds: z.array(z.number().int()).optional(),
  tags: z.array(z.string()).optional()
});

export const bulkTagSchema = z.object({
  imageId: z.number().int(),
  tags: z.array(z.string().min(1)).max(15)
});

export const folderCreateSchema = z.object({
  name: z.string().min(1)
});

export const folderPatchSchema = folderCreateSchema.partial();

export const moodboardSchema = z.object({
  source: z.enum(['folder', 'selection']),
  ids: z.array(z.number().int()),
  prompt: z.string().max(280).optional().default(''),
  strategy: z.enum(['color', 'semantic', 'manual'])
});

export const moodboardLayoutSchema = z.object({
  layoutJson: z.string()
});

export const recommendationSchema = z.object({
  scope: z.enum(['afterUpload', 'image', 'folder', 'moodboard']),
  id: z.coerce.number().optional()
});
