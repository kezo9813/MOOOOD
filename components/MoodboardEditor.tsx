'use client';

import { useEffect, useState } from 'react';
import { MoodboardCanvas, MoodboardTile } from './MoodboardCanvas';

export function MoodboardEditor({ moodboardId, initialTiles }: { moodboardId: number; initialTiles: MoodboardTile[] }) {
  const [tiles, setTiles] = useState(initialTiles);
  const [status, setStatus] = useState('');

  async function persist(nextTiles: MoodboardTile[]) {
    setStatus('Saving...');
    await fetch(`/api/moodboards/${moodboardId}/layout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ layoutJson: JSON.stringify(nextTiles) })
    });
    setStatus('Saved');
  }

  useEffect(() => {
    setTiles(initialTiles);
  }, [initialTiles]);

  return (
    <div className="space-y-4">
      <MoodboardCanvas
        tiles={tiles}
        onChange={(next) => {
          setTiles(next);
          void persist(next);
        }}
      />
      <p className="text-xs text-white/60">{status}</p>
    </div>
  );
}
