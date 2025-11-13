'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    const form = new FormData(event.currentTarget);
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: form.get('email'), password: form.get('password') })
    });
    setLoading(false);
    if (!response.ok) {
      setError('Unable to register');
      return;
    }
    router.push('/login');
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 p-8">
      <h1 className="text-3xl font-semibold">Create an account</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          <span>Email</span>
          <input className="rounded-md bg-white/5 p-3" name="email" type="email" required />
        </label>
        <label className="flex flex-col gap-1">
          <span>Password</span>
          <input className="rounded-md bg-white/5 p-3" name="password" type="password" minLength={8} required />
        </label>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button className="rounded-md bg-brand-500 py-3 font-semibold" disabled={loading} type="submit">
          {loading ? 'Creating...' : 'Create account'}
        </button>
      </form>
    </main>
  );
}
