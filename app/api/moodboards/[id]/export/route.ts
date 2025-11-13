import { NextResponse } from 'next/server';
import sharp from 'sharp';
import { prisma } from '@/lib/prisma';
import { authSession } from '@/lib/auth';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await authSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const moodboard = await prisma.moodboard.findFirst({ where: { id: Number(params.id), userId: user.id } });
  if (!moodboard) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const svg = `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
    <rect width="1200" height="630" fill="#0f172a"/>
    <text x="50" y="120" font-size="48" fill="white" font-family="Inter, sans-serif">${moodboard.title}</text>
    <text x="50" y="190" font-size="24" fill="#94a3b8" font-family="Inter, sans-serif">${moodboard.prompt ?? ''}</text>
  </svg>`;
  const buffer = await sharp(Buffer.from(svg)).png().toBuffer();
  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'image/png',
      'Content-Disposition': `attachment; filename=moodboard-${moodboard.id}.png`
    }
  });
}
