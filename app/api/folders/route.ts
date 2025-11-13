import { NextResponse } from 'next/server';
import { authSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { folderCreateSchema } from '@/lib/validators';

async function requireUser() {
  const session = await authSession();
  if (!session?.user?.email) return null;
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  return user;
}

export async function GET() {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const folders = await prisma.folder.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' } });
  return NextResponse.json({ folders });
}

export async function POST(request: Request) {
  const user = await requireUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const payload = await request.json();
  const parsed = folderCreateSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }
  const folder = await prisma.folder.create({ data: { userId: user.id, name: parsed.data.name } });
  return NextResponse.json(folder);
}
