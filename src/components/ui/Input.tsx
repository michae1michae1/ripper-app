import { forwardRef } from 'react';
import { cn } from '@/lib/cn';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  suffix?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, icon, suffix, ...props }, ref) => {
    return (
      <div 
        data-component="Input"
        data-has-icon={!!icon || undefined}
        data-has-suffix={!!suffix || undefined}
        className="ui-input-wrapper relative flex items-center"
      >
        {icon && (
          <div className="ui-input__icon absolute left-3 text-mist pointer-events-none">
            {icon}
          </div>
        )}
        <input
          ref={ref}
          className={cn(
            'ui-input',
            'w-full bg-slate border border-storm rounded-lg px-4 py-2.5 text-snow placeholder:text-mist',
            'focus:outline-none focus:ring-2 focus:ring-arcane focus:border-transparent',
            'transition-all duration-200',
            icon && 'pl-10',
            suffix && 'pr-16',
            className
          )}
          {...props}
        />
        {suffix && (
          <div className="ui-input__suffix absolute right-3">
            {suffix}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

