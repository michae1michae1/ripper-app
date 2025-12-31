import { cn } from '@/lib/cn';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeStyles = {
  sm: 'w-4 h-4 border-2',
  md: 'w-8 h-8 border-2',
  lg: 'w-12 h-12 border-3',
};

export const LoadingSpinner = ({ size = 'md', className }: LoadingSpinnerProps) => {
  return (
    <div
      className={cn(
        'animate-spin rounded-full border-arcane border-t-transparent',
        sizeStyles[size],
        className
      )}
    />
  );
};

interface LoadingPageProps {
  message?: string;
}

export const LoadingPage = ({ message = 'Loading...' }: LoadingPageProps) => {
  return (
    <div className="min-h-screen bg-midnight flex flex-col items-center justify-center gap-4">
      <LoadingSpinner size="lg" />
      <p className="text-mist text-sm">{message}</p>
    </div>
  );
};

