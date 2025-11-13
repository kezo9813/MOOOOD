'use client';

export type Folder = { id: number; name: string };

export function FolderPicker({ folders, value, onChange }: { folders: Folder[]; value: number | null; onChange: (id: number | null) => void }) {
  return (
    <select
      className="w-full rounded-md bg-white/5 p-3"
      value={value ?? ''}
      onChange={(event) => {
        const next = event.target.value ? Number(event.target.value) : null;
        onChange(next);
      }}
    >
      <option value="">All folders</option>
      {folders.map((folder) => (
        <option key={folder.id} value={folder.id}>
          {folder.name}
        </option>
      ))}
    </select>
  );
}
