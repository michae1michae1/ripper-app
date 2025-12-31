import { cn } from '@/lib/cn';

interface PackIndicatorProps {
  currentPack: 1 | 2 | 3;
}

export const PackIndicator = ({ currentPack }: PackIndicatorProps) => {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        {[1, 2, 3].map((pack) => (
          <div key={pack} className="flex items-center gap-2">
            <span
              className={cn(
                'text-sm font-medium',
                currentPack === pack ? 'text-snow' : 'text-mist'
              )}
            >
              {currentPack === pack ? `Pack ${pack}` : `Pack ${pack}`}
            </span>
            {pack < 3 && (
              <div
                className={cn(
                  'w-8 h-0.5 rounded-full',
                  pack < currentPack ? 'bg-arcane' : 'bg-storm'
                )}
              />
            )}
          </div>
        ))}
      </div>
      <div
        className={cn(
          'w-full h-1 rounded-full bg-storm overflow-hidden'
        )}
      >
        <div
          className="h-full bg-arcane transition-all duration-300"
          style={{ width: `${(currentPack / 3) * 100}%` }}
        />
      </div>
    </div>
  );
};

