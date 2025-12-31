import { cn } from '@/lib/cn';

interface TimerDisplayProps {
  minutes: number;
  seconds: number;
  size?: 'md' | 'lg' | 'xl';
  isExpired?: boolean;
}

const sizeStyles = {
  md: 'text-5xl',
  lg: 'text-7xl',
  xl: 'text-[12rem] leading-none',
};

export const TimerDisplay = ({ 
  minutes, 
  seconds, 
  size = 'lg',
  isExpired 
}: TimerDisplayProps) => {
  return (
    <div 
      className={cn(
        'font-mono font-bold tracking-tight',
        sizeStyles[size],
        isExpired ? 'text-danger animate-pulse' : 'timer-gradient'
      )}
    >
      <span>{String(minutes).padStart(2, '0')}</span>
      <span className="opacity-50">:</span>
      <span>{String(seconds).padStart(2, '0')}</span>
    </div>
  );
};

