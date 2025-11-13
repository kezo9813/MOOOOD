import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { registerSchema } from '@/lib/validators';
import { hash } from 'bcryptjs';

export async function POST(request: Request) {
  const json = await request.json();
  const parsed = registerSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }
  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) {
    return NextResponse.json({ error: 'User exists' }, { status: 409 });
  }
  const passwordHash = await hash(parsed.data.password, 10);
  const user = await prisma.user.create({ data: { email: parsed.data.email, passwordHash } });
  return NextResponse.json({ id: user.id, email: user.email });
}
