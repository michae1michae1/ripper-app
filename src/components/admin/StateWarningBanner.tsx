import { AlertTriangle, Unlock } from 'lucide-react';
import { Button } from '@/components/ui';
import { getCurrentStage, useEventStore } from '@/lib/store';
import { getStageName } from '@/lib/sequenceGuards';
import { cn } from '@/lib/cn';
import type { EventSession, EventStage } from '@/types/event';

interface StateWarningBannerProps {
  event: EventSession;
  requiredStage: EventStage;
  className?: string;
}

/**
 * Warning banner shown when admin navigates to a page that requires a different state.
 * Prompts admin to sync the event state before controls become active.
 */
export const StateWarningBanner = ({
  event,
  requiredStage,
  className,
}: StateWarningBannerProps) => {
  const currentStage = getCurrentStage(event);
  const pendingStage = useEventStore(state => state.pendingStage);
  const setPendingStage = useEventStore(state => state.setPendingStage);

  // Don't show banner if we're already at the required stage
  if (currentStage === requiredStage) {
    return null;
  }

  // Check if user has already selected this stage as pending
  const isAlreadyPending = pendingStage === requiredStage;

  const handleSelectStage = () => {
    setPendingStage(requiredStage);
  };

  return (
    <div 
      data-component="StateWarningBanner"
      data-current-stage={currentStage || undefined}
      data-required-stage={requiredStage}
      className={cn(
        'state-warning-banner',
        'bg-warning/10 border border-warning/30 rounded-lg p-4 mb-6',
        className
      )}
    >
      <div className="state-warning-banner__content flex items-start gap-3">
        <AlertTriangle className="state-warning-banner__icon w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
        
        <div className="state-warning-banner__text flex-1">
          <p className="state-warning-banner__title text-sm font-medium text-warning">
            Event State Mismatch
          </p>
          <p className="state-warning-banner__description text-sm text-mist mt-1">
            Event is currently at <span className="text-snow font-medium">{currentStage ? getStageName(currentStage) : 'Unknown'}</span>.
            {' '}This page expects <span className="text-snow font-medium">{getStageName(requiredStage)}</span>.
          </p>
          <p className="state-warning-banner__hint text-xs text-mist mt-2">
            Controls on this page are disabled until you sync the event state.
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={handleSelectStage}
          disabled={isAlreadyPending}
          className="state-warning-banner__action flex-shrink-0"
        >
          {isAlreadyPending ? (
            <>
              <Unlock className="w-4 h-4 mr-1.5" />
              Pending Sync
            </>
          ) : (
            <>
              <Unlock className="w-4 h-4 mr-1.5" />
              Select State
            </>
          )}
        </Button>
      </div>

      {isAlreadyPending && (
        <p className="state-warning-banner__pending-hint text-xs text-warning mt-3 pl-8">
          State selected. Use the Event Sequence panel below to sync.
        </p>
      )}
    </div>
  );
};

