import { ArrowLeft, ArrowRight } from 'lucide-react';

interface PassDirectionBadgeProps {
  direction: 'left' | 'right';
}

export const PassDirectionBadge = ({ direction }: PassDirectionBadgeProps) => {
  return (
    <div 
      data-component="PassDirectionBadge"
      data-direction={direction}
      className="pass-direction-badge inline-flex items-center gap-2 bg-slate rounded-full px-3 py-1.5"
    >
      <span className="pass-direction-badge__label text-xs font-medium text-mist uppercase tracking-wide">Passing</span>
      {direction === 'left' ? (
        <ArrowLeft className="pass-direction-badge__icon w-4 h-4 text-snow" />
      ) : (
        <ArrowRight className="pass-direction-badge__icon w-4 h-4 text-snow" />
      )}
      <span className="pass-direction-badge__direction text-sm font-medium text-snow capitalize">{direction}</span>
    </div>
  );
};

