'use client';

export function ExportMoodboardButton({ moodboardId }: { moodboardId: number }) {
  async function handleExport() {
    const res = await fetch(`/api/moodboards/${moodboardId}/export`, { method: 'POST' });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `moodboard-${moodboardId}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }
  return (
    <button className="rounded-md border border-white/20 px-4 py-2 text-sm" onClick={handleExport} type="button">
      Export PNG
    </button>
  );
}
