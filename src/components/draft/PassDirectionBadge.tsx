import { ArrowLeft, ArrowRight } from 'lucide-react';

interface PassDirectionBadgeProps {
  direction: 'left' | 'right';
}

export const PassDirectionBadge = ({ direction }: PassDirectionBadgeProps) => {
  return (
    <div className="inline-flex items-center gap-2 bg-slate rounded-full px-3 py-1.5">
      <span className="text-xs font-medium text-mist uppercase tracking-wide">Passing</span>
      {direction === 'left' ? (
        <ArrowLeft className="w-4 h-4 text-snow" />
      ) : (
        <ArrowRight className="w-4 h-4 text-snow" />
      )}
      <span className="text-sm font-medium text-snow capitalize">{direction}</span>
    </div>
  );
};

