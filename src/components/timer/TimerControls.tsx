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
    <div 
      data-component="TimerControls"
      data-running={isRunning || undefined}
      className={cn('timer-controls flex items-center gap-2', className)}
    >
      {showAdjust && onAdjust && (
        <div className="timer-controls__adjust-group flex items-center gap-1 bg-slate rounded-lg p-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onAdjust(-10)}
            title="Remove 10 seconds"
            className="timer-controls__decrease-btn"
          >
            <Minus className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onAdjust(10)}
            title="Add 10 seconds"
            className="timer-controls__increase-btn"
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
        className="timer-controls__reset-btn"
      >
        <RotateCcw className="w-4 h-4" />
      </Button>
      
      <Button
        variant="primary"
        onClick={isRunning ? onPause : onStart}
        className="timer-controls__toggle-btn px-6"
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
      
      <Button variant="ghost" size="icon" title="Settings" className="timer-controls__settings-btn">
        <Settings className="w-4 h-4" />
      </Button>
    </div>
  );
};

