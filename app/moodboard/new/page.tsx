import { authSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { CreateMoodboardForm } from '@/components/CreateMoodboardForm';

export default async function NewMoodboardPage() {
  const session = await authSession();
  if (!session?.user?.email) redirect('/login');
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) redirect('/login');
  const folders = await prisma.folder.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' } });
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 p-6">
      <div>
        <p className="text-sm uppercase tracking-[0.3em] text-white/60">Moodboard</p>
        <h1 className="text-3xl font-semibold">Compose a new board</h1>
      </div>
      <CreateMoodboardForm folders={folders} />
    </main>
  );
}
