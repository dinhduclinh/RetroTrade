import { memo } from 'react';

type BambooTreeDisplayProps = {
  treeUrl: string;
  displayStage: number;
  onError: () => void;
  onLoad: () => void;
  className?: string;
};

function BambooTreeDisplayComponent({ treeUrl, displayStage, onError, onLoad, className }: BambooTreeDisplayProps) {
  const swayDuration = `${4 + Math.max(0, 4 - displayStage) * 0.3}s`;

  return (
    <div className={className}>
      <div className="relative w-[280px] h-[320px] sm:w-[320px] sm:h-[360px] md:w-[360px] md:h-[400px] overflow-visible wind">
        <img
          src={treeUrl}
          alt={`Tree stage ${displayStage}`}
          className="w-full h-full object-contain sway-soft mix-blend-multiply"
          style={{ ['--swayDur' as unknown as string]: swayDuration as unknown as string, objectPosition: 'left bottom' }}
          onError={onError}
          onLoad={onLoad}
        />
      </div>
      <style jsx>{`
        @keyframes swaySoft {
          0% { transform: rotate(0deg) translateY(0px); }
          50% { transform: rotate(0.6deg) translateY(-0.8px); }
          100% { transform: rotate(0deg) translateY(0px); }
        }
        .sway-soft {
          transform-origin: bottom center;
          animation: swaySoft var(--swayDur, 4.5s) ease-in-out infinite;
          filter: drop-shadow(0 2px 2px rgba(0,0,0,0.10))
                  drop-shadow(0 6px 8px rgba(0,0,0,0.08));
          will-change: transform;
        }
        @keyframes gust {
          0%, 100% { transform: translateX(0px) rotate(0deg) scale(1); }
          40% { transform: translateX(2px) rotate(0.25deg) scale(1.002); }
          50% { transform: translateX(3px) rotate(0.35deg) scale(1.004); }
          60% { transform: translateX(1px) rotate(0.15deg) scale(1.002); }
        }
        .wind { animation: gust 9s ease-in-out infinite; will-change: transform; }
      `}</style>
    </div>
  );
}

export const BambooTreeDisplay = memo(BambooTreeDisplayComponent);

