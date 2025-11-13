'use client';

import { useEffect, useState } from 'react';
import { DndContext, DragEndEvent, useDraggable } from '@dnd-kit/core';

export type MoodboardTile = {
  imageId: number;
  storageUrl: string;
  x: number;
  y: number;
  scale: number;
  z: number;
};

function Tile({ tile }: { tile: MoodboardTile }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: tile.imageId });
  return (
    <button
      ref={setNodeRef}
      className="absolute cursor-move overflow-hidden rounded-xl shadow-lg"
      style={{
        left: tile.x + (transform?.x ?? 0),
        top: tile.y + (transform?.y ?? 0),
        width: 180 * tile.scale,
        height: 220 * tile.scale,
        zIndex: tile.z
      }}
      type="button"
      {...listeners}
      {...attributes}
    >
      <img alt="tile" className="h-full w-full object-cover" src={tile.storageUrl} />
    </button>
  );
}

export function MoodboardCanvas({ tiles, onChange }: { tiles: MoodboardTile[]; onChange?: (tiles: MoodboardTile[]) => void }) {
  const [state, setState] = useState(tiles);
  useEffect(() => {
    setState(tiles);
  }, [tiles]);

  function handleDragEnd(event: DragEndEvent) {
    if (!event.delta) return;
    setState((current) => {
      const next = current.map((tile) => {
        if (tile.imageId === Number(event.active.id)) {
          return { ...tile, x: tile.x + event.delta.x, y: tile.y + event.delta.y };
        }
        return tile;
      });
      onChange?.(next);
      return next;
    });
  }

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="relative min-h-[480px] w-full rounded-2xl border border-white/10 bg-white/5">
        {state.map((tile) => (
          <Tile key={tile.imageId} tile={tile} />
        ))}
      </div>
    </DndContext>
  );
}
