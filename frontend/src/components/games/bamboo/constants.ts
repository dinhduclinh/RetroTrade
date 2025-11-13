export type BackgroundType = 'village' | 'zen' | 'modern';

export const BACKGROUND_OPTIONS: Array<{ value: BackgroundType; label: string }> = [
  { value: 'village', label: 'Làng quê' },
  { value: 'zen', label: 'Thiền định' },
  { value: 'modern', label: 'Hiện đại' },
];

export const BACKGROUND_MAP: Record<BackgroundType, string> = {
  village: '/backgrounds/Village.png',
  zen: '/backgrounds/Zen.png',
  modern: '/backgrounds/Modern.png',
};

export function candidateTreeUrls(stage: number): string[] {
  const s = Math.max(0, Math.min(5, stage));
  return [
    `/tree/stage${s}.png`,
    `/tree/stage${s}_preview_rev_1.png`,
    `/tree/stage${s}.webp`,
    `/tree/stage${s}.svg`,
  ];
}

