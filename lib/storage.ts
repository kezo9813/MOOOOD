import { createClient } from '@supabase/supabase-js';
import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';
import { FEATURE_FLAGS } from '../FEATURE_FLAGS';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const supabaseBucket = process.env.SUPABASE_BUCKET ?? 'images';

const supabase =
  FEATURE_FLAGS.USE_SUPABASE_STORAGE && supabaseUrl && supabaseKey
    ? createClient(supabaseUrl, supabaseKey)
    : null;

export type StoredFile = { url: string; path: string };

export async function storeImageFile(userId: string, mime: string, buffer: Buffer): Promise<StoredFile> {
  const ext = mime.split('/')[1] ?? 'bin';
  const fileName = `${userId}/${Date.now()}-${crypto.randomBytes(6).toString('hex')}.${ext}`;
  if (supabase) {
    const { error } = await supabase.storage.from(supabaseBucket).upload(fileName, buffer, {
      contentType: mime,
      upsert: false
    });
    if (error) {
      throw new Error(error.message);
    }
    const {
      data: { publicUrl }
    } = supabase.storage.from(supabaseBucket).getPublicUrl(fileName);
    return { url: publicUrl, path: fileName };
  }
  const uploadDir = path.join(process.cwd(), 'public', 'uploads');
  // Local fallback keeps development simple while matching the Supabase interface shape.
  await fs.mkdir(uploadDir, { recursive: true });
  const absolutePath = path.join(uploadDir, fileName.replace('/', '-'));
  await fs.writeFile(absolutePath, buffer);
  return { url: `/uploads/${path.basename(absolutePath)}`, path: absolutePath };
}
