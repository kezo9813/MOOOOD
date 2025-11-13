'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function CreateMoodboardForm({ folders }: { folders: { id: number; name: string }[] }) {
  const router = useRouter();
  const [prompt, setPrompt] = useState('');
  const [strategy, setStrategy] = useState<'color' | 'semantic' | 'manual'>('semantic');
  const [folderId, setFolderId] = useState<number | null>(folders[0]?.id ?? null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    const res = await fetch('/api/moodboards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source: 'folder',
        ids: folderId ? [folderId] : [],
        prompt,
        strategy
      })
    });
    setLoading(false);
    if (!res.ok) return;
    const json = await res.json();
    router.push(`/moodboard/${json.id}`);
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div>
        <label className="block text-sm text-white/60">Prompt</label>
        <textarea className="w-full rounded-md bg-white/5 p-3" value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="earthy red + brutalist" />
      </div>
      <div>
        <label className="block text-sm text-white/60">Strategy</label>
        <select className="w-full rounded-md bg-white/5 p-3" value={strategy} onChange={(event) => setStrategy(event.target.value as any)}>
          <option value="color">Color</option>
          <option value="semantic">Semantic</option>
          <option value="manual">Manual</option>
        </select>
      </div>
      <div>
        <label className="block text-sm text-white/60">Folder</label>
        <select className="w-full rounded-md bg-white/5 p-3" value={folderId ?? ''} onChange={(event) => setFolderId(Number(event.target.value))}>
          {folders.map((folder) => (
            <option key={folder.id} value={folder.id}>
              {folder.name}
            </option>
          ))}
        </select>
      </div>
      <button className="rounded-md bg-brand-500 px-6 py-3" disabled={loading || !folderId} type="submit">
        {loading ? 'Creating...' : 'Create moodboard'}
      </button>
    </form>
  );
}
