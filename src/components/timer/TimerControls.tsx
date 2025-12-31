import { Minus, Plus, RotateCcw, Pause, Play, Settings } from 'lucide-react';
import { Button } from '@/components/ui';
import { cn } from '@/lib/cn';

interface TimerControlsProps {
  isRunning: boolean;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onAdjust?: (seconds: number) => void;
  showAdjust?: boolean;
  className?: string;
}

export const TimerControls = ({
  isRunning,
  onStart,
  onPause,
  onReset,
  onAdjust,
  showAdjust = true,
  className,
}: TimerControlsProps) => {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      {showAdjust && onAdjust && (
        <div className="flex items-center gap-1 bg-slate rounded-lg p-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onAdjust(-10)}
            title="Remove 10 seconds"
          >
            <Minus className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onAdjust(10)}
            title="Add 10 seconds"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      )}
      
      <Button
        variant="ghost"
        size="icon"
        onClick={onReset}
        title="Reset timer"
      >
        <RotateCcw className="w-4 h-4" />
      </Button>
      
      <Button
        variant="primary"
        onClick={isRunning ? onPause : onStart}
        className="px-6"
      >
        {isRunning ? (
          <>
            <Pause className="w-4 h-4" />
            Pause
          </>
        ) : (
          <>
            <Play className="w-4 h-4" />
            Start
          </>
        )}
      </Button>
      
      <Button variant="ghost" size="icon" title="Settings">
        <Settings className="w-4 h-4" />
      </Button>
    </div>
  );
};

