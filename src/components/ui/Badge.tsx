import { cn } from '@/lib/cn';

type BadgeVariant = 'arcane' | 'success' | 'warning' | 'danger' | 'muted';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  arcane: 'bg-arcane/20 text-arcane-bright',
  success: 'bg-success/20 text-success',
  warning: 'bg-warning/20 text-warning',
  danger: 'bg-danger/20 text-danger',
  muted: 'bg-slate text-mist',
};

export const Badge = ({ children, variant = 'muted', className }: BadgeProps) => {
  return (
    <span
      data-component="Badge"
      data-variant={variant}
      className={cn(
        'ui-badge',
        `ui-badge--${variant}`,
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
};

