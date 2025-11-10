import { Button } from '@/components/ui/common/button';

import { TreeState } from './useBambooGame';

type BambooControlPanelProps = {
  tree: TreeState;
  notice: string | null;
  pending: boolean;
  onWater: () => void;
  onFertilize: () => void;
};

export function BambooControlPanel({ tree, notice, pending, onWater, onFertilize }: BambooControlPanelProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-emerald-200 bg-white/90 p-4 shadow-sm">
          <div className="text-xs uppercase tracking-wide text-slate-500">Stage</div>
          <div className="text-3xl font-semibold text-slate-900">{tree.stage}</div>
        </div>
        <div className="rounded-lg border border-emerald-200 bg-white/90 p-4 shadow-sm">
          <div className="text-xs uppercase tracking-wide text-slate-500">Growth</div>
          <div className="text-3xl font-semibold text-emerald-600">{tree.growth}%</div>
        </div>
      </div>

      {notice && (
        <div className="rounded-lg border border-amber-200 bg-amber-50/90 p-3 text-sm text-amber-800">
          {notice}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button
          onClick={onWater}
          disabled={pending}
          className="bg-sky-600 hover:bg-sky-700 text-white shadow-sm disabled:opacity-60"
        >
          Water (+10)
        </Button>
        <Button
          onClick={onFertilize}
          disabled={pending}
          className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm disabled:opacity-60"
        >
          Fertilize (+25)
        </Button>
      </div>

      <p className="text-xs text-slate-500">
        Watering cooldown: every 4 hours. Fertilizing cooldown: once per day.
      </p>
    </div>
  );
}

