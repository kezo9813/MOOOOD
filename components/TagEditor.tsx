'use client';

import { useState } from 'react';

export function TagEditor({ imageId, tags }: { imageId: number; tags: string[] }) {
  const [current, setCurrent] = useState(tags.join(', '));
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    const nextTags = current
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    await fetch('/api/tags/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageId, tags: nextTags })
    });
    setSaving(false);
  }

  return (
    <div className="space-y-2">
      <label className="text-sm text-white/60">Tags (comma separated)</label>
      <textarea className="min-h-[80px] w-full rounded-md bg-white/5 p-3" value={current} onChange={(event) => setCurrent(event.target.value)} />
      <button className="rounded-md bg-brand-500 px-4 py-2 text-sm" disabled={saving} onClick={save} type="button">
        {saving ? 'Saving...' : 'Save tags'}
      </button>
    </div>
  );
}
