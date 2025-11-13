'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useDebouncedSearch } from '@/lib/hooks/useDebouncedSearch';

export function DashboardSearch() {
  const params = useSearchParams();
  const router = useRouter();
  const [value, setValue] = useState(params.get('q') ?? '');
  const debounced = useDebouncedSearch(value, 400);

  useEffect(() => {
    const next = new URLSearchParams(params.toString());
    if (debounced) {
      next.set('q', debounced);
    } else {
      next.delete('q');
    }
    const queryString = next.toString();
    router.replace(queryString ? `/dashboard?${queryString}` : '/dashboard');
  }, [debounced, params, router]);

  return (
    <input
      className="w-full rounded-full bg-white/10 px-4 py-2 text-sm"
      placeholder="Search caption or tags"
      value={value}
      onChange={(event) => setValue(event.target.value)}
    />
  );
}
