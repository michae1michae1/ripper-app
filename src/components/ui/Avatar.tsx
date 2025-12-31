import { cn } from '@/lib/cn';

interface AvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeStyles = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
};

// Generate a consistent color based on name
function getAvatarColor(name: string): string {
  const colors = [
    'bg-arcane',
    'bg-mana-blue',
    'bg-mana-green',
    'bg-mana-red',
    'bg-amber-600',
    'bg-cyan-600',
    'bg-pink-600',
    'bg-indigo-600',
  ];
  
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export const Avatar = ({ name, size = 'md', className }: AvatarProps) => {
  const initials = getInitials(name);
  const bgColor = getAvatarColor(name);
  
  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full font-semibold text-white',
        sizeStyles[size],
        bgColor,
        className
      )}
    >
      {initials}
    </div>
  );
};

