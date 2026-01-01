import { cn } from '@/lib/cn';

interface PackIndicatorProps {
  currentPack: 1 | 2 | 3;
}

export const PackIndicator = ({ currentPack }: PackIndicatorProps) => {
  return (
    <div 
      data-component="PackIndicator"
      data-current-pack={currentPack}
      className="pack-indicator flex flex-col gap-3"
    >
      <div className="pack-indicator__packs flex items-center gap-2">
        {[1, 2, 3].map((pack) => (
          <div key={pack} className="pack-indicator__pack-item flex items-center gap-2">
            <span
              data-pack={pack}
              data-active={currentPack === pack || undefined}
              className={cn(
                'pack-indicator__pack-label',
                currentPack === pack && 'pack-indicator__pack-label--active',
                'text-sm font-medium',
                currentPack === pack ? 'text-snow' : 'text-mist'
              )}
            >
              Pack {pack}
            </span>
            {pack < 3 && (
              <div
                data-completed={pack < currentPack || undefined}
                className={cn(
                  'pack-indicator__connector w-8 h-0.5 rounded-full',
                  pack < currentPack ? 'bg-arcane' : 'bg-storm'
                )}
              />
            )}
          </div>
        ))}
      </div>
      <div className="pack-indicator__progress-track w-full h-1 rounded-full bg-storm overflow-hidden">
        <div
          className="pack-indicator__progress-bar h-full bg-arcane transition-all duration-300"
          style={{ width: `${(currentPack / 3) * 100}%` }}
        />
      </div>
    </div>
  );
};

