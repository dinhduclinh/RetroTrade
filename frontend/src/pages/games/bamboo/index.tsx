'use client';

import { BambooGameCard } from '@/components/games/bamboo/BambooGameCard';

export default function BambooGamePage() {
  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="mx-auto max-w-5xl px-4">
        <BambooGameCard />
      </div>
    </div>
  );
}


