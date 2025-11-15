import { BACKGROUND_OPTIONS, BackgroundType } from './constants';

type BambooBackgroundSelectorProps = {
  value: BackgroundType;
  disabled?: boolean;
  onChange: (value: BackgroundType) => void;
};

export function BambooBackgroundSelector({ value, disabled, onChange }: BambooBackgroundSelectorProps) {
  return (
    <label className="flex items-center gap-2 text-sm text-slate-700">
      <span>Nền:</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as BackgroundType)}
        disabled={disabled}
        className="border rounded px-2 py-1 text-sm bg-white/90 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
      >
        {BACKGROUND_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}

