'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

export function UploadDropzone() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [status, setStatus] = useState('');

  async function handleFile(file: File) {
    const payload = { tags: [] };
    const body = new FormData();
    body.append('file', file);
    body.append('payload', JSON.stringify(payload));
    const res = await fetch('/api/upload', { method: 'POST', body });
    if (!res.ok) {
      setStatus('Upload failed');
      return;
    }
    setStatus('Uploaded');
    router.refresh();
  }

  return (
    <div
      className="rounded-2xl border border-dashed border-white/20 p-6 text-center"
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        const file = event.dataTransfer.files?.[0];
        if (file) {
          setPreview(URL.createObjectURL(file));
          void handleFile(file);
        }
      }}
    >
      <input
        className="hidden"
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (!file) return;
          setPreview(URL.createObjectURL(file));
          void handleFile(file);
        }}
      />
      <p className="mb-4 text-sm uppercase tracking-[0.3em] text-brand-500">Upload</p>
      {preview ? (
        <img alt="preview" src={preview} className="mx-auto h-48 w-48 rounded-xl object-cover" />
      ) : (
        <p className="text-white/70">Drag & drop or click to choose a file (15MB max)</p>
      )}
      <button className="mt-4 rounded-md bg-brand-500 px-6 py-2" onClick={() => inputRef.current?.click()} type="button">
        Choose file
      </button>
      {status && <p className="mt-2 text-sm text-white/60">{status}</p>}
    </div>
  );
}
