import Link from 'next/link';

type Image = {
  id: number;
  storageUrl: string;
  caption: string | null;
  colorDominant: string | null;
};

export function ImageGrid({ images }: { images: Image[] }) {
  if (!images.length) {
    return <p className="text-sm text-white/60">No images yet.</p>;
  }
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {images.map((image) => (
        <Link key={image.id} href={`/images/${image.id}`} className="group">
          <div className="aspect-square overflow-hidden rounded-xl border border-white/10">
            <img alt={image.caption ?? 'untitled image'} className="h-full w-full object-cover" src={image.storageUrl} />
          </div>
          <p className="mt-2 text-sm text-white/70">{image.caption ?? 'Untitled image'}</p>
        </Link>
      ))}
    </div>
  );
}
