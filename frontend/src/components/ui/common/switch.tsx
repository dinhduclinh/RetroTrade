import * as React from "react";

interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label?: string;
}

export const Switch: React.FC<SwitchProps> = ({
  checked,
  onCheckedChange,
  label,
}) => {
  return (
    <label className="flex items-center space-x-2 cursor-pointer">
      <div
        onClick={() => onCheckedChange(!checked)}
        className={`w-10 h-5 flex items-center rounded-full p-1 transition-colors duration-200 ${
          checked ? "bg-green-500" : "bg-gray-400"
        }`}
      >
        <div
          className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        ></div>
      </div>
      {label && <span className="text-sm text-white/90">{label}</span>}
    </label>
  );
};
