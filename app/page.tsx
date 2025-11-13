import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center gap-6 p-8 text-center">
      <p className="text-sm uppercase tracking-[0.35em] text-brand-500">MOOOOD</p>
      <h1 className="text-4xl font-semibold">Visual intelligence for creative teams</h1>
      <p className="text-lg text-slate-200">
        Upload inspiration, tag it collaboratively, and orchestrate moodboards assisted by lightweight AI cues.
      </p>
      <div className="flex gap-4">
        <Link className="rounded-full bg-brand-500 px-6 py-3 font-medium" href="/register">
          Create account
        </Link>
        <Link className="rounded-full border border-white/20 px-6 py-3 font-medium" href="/login">
          Sign in
        </Link>
      </div>
    </main>
  );
}
