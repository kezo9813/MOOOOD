'use client';

import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setLoading(true);
    const res = await signIn('credentials', {
      email: formData.get('email'),
      password: formData.get('password'),
      redirect: false
    });
    setLoading(false);
    if (res?.error) {
      setError('Invalid credentials');
      return;
    }
    router.push('/dashboard');
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 p-8">
      <h1 className="text-3xl font-semibold">Sign in</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          <span>Email</span>
          <input className="rounded-md bg-white/5 p-3" name="email" type="email" required />
        </label>
        <label className="flex flex-col gap-1">
          <span>Password</span>
          <input className="rounded-md bg-white/5 p-3" name="password" type="password" required />
        </label>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button className="rounded-md bg-brand-500 py-3 font-semibold" disabled={loading} type="submit">
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </main>
  );
}
