import { cn } from '@/lib/cn';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  selected?: boolean;
  onClick?: () => void;
}

export const Card = ({ children, className, selected, onClick }: CardProps) => {
  const isClickable = !!onClick;
  
  return (
    <div
      data-component="Card"
      data-selected={selected || undefined}
      data-clickable={isClickable || undefined}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onClick={onClick}
      onKeyDown={isClickable ? (e) => e.key === 'Enter' && onClick() : undefined}
      className={cn(
        'ui-card',
        selected && 'ui-card--selected',
        isClickable && 'ui-card--clickable',
        'bg-obsidian border rounded-xl p-4 transition-all duration-200',
        selected 
          ? 'border-arcane glow-arcane' 
          : 'border-storm',
        isClickable && 'cursor-pointer hover:border-mist',
        className
      )}
    >
      {children}
    </div>
  );
};

