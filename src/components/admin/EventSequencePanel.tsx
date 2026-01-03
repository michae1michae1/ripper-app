import { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Lock, CheckCircle2, Circle, AlertTriangle, Clock } from 'lucide-react';
import { Button } from '@/components/ui';
import { 
  FULL_SEQUENCE,
  canTransitionTo,
  getStageName,
  getGroupDisplayName,
  type SequenceDefinition 
} from '@/lib/sequenceGuards';
import { getCurrentStage, useEventStore } from '@/lib/store';
import { updateEventSession } from '@/lib/api';
import { cn } from '@/lib/cn';
import type { EventSession, EventStage } from '@/types/event';

interface EventSequencePanelProps {
  event: EventSession;
  sequences?: SequenceDefinition[];
  isMasterView?: boolean;
  defaultExpanded?: boolean;
}

export const EventSequencePanel = ({
  event,
  sequences = FULL_SEQUENCE,
  isMasterView = false,
  defaultExpanded = false,
}: EventSequencePanelProps) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [isSyncing, setIsSyncing] = useState(false);

  // Use store for pending stage management
  const pendingStage = useEventStore(state => state.pendingStage);
  const setPendingStage = useEventStore(state => state.setPendingStage);
  const commitPendingStage = useEventStore(state => state.commitPendingStage);

  const currentStage = getCurrentStage(event);
  
  // Auto-expand when pendingStage is set externally
  useEffect(() => {
    if (pendingStage) {
      setIsExpanded(true);
    }
  }, [pendingStage]);

  // Group sequences by their group for master view
  const groupedSequences = isMasterView
    ? sequences.reduce((acc, seq) => {
        if (!acc[seq.group]) {
          acc[seq.group] = [];
        }
        acc[seq.group].push(seq);
        return acc;
      }, {} as Record<string, SequenceDefinition[]>)
    : null;

  // Check if a stage can be transitioned to
  const getStageStatus = (stage: EventStage) => {
    if (!currentStage) return { isCurrent: false, canTransition: false, reason: 'No current stage' };
    
    const isCurrent = stage === currentStage;
    const guard = canTransitionTo(event, currentStage, stage);
    
    return {
      isCurrent,
      canTransition: guard.canTransition,
      reason: guard.reason,
      isBackward: guard.isBackward,
    };
  };

  const handleStageSelect = (stage: EventStage) => {
    const status = getStageStatus(stage);
    if (status.isCurrent) return;
    if (status.canTransition) {
      // Toggle selection - if clicking the same stage, clear it
      setPendingStage(stage === pendingStage ? null : stage);
    }
  };

  const handleSync = async () => {
    if (!pendingStage) return;
    
    setIsSyncing(true);
    try {
      // Commit the pending stage to the store
      commitPendingStage();
      
      // Persist to backend - get the updated event from store after sync
      const updatedEvent = useEventStore.getState().event;
      if (updatedEvent) {
        await updateEventSession(updatedEvent.id, updatedEvent);
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const renderStageItem = (seq: SequenceDefinition) => {
    const status = getStageStatus(seq.stage);
    const isPending = pendingStage === seq.stage;

    return (
      <button
        key={seq.stage}
        onClick={() => handleStageSelect(seq.stage)}
        disabled={!status.canTransition && !status.isCurrent}
        data-stage={seq.stage}
        data-current={status.isCurrent || undefined}
        data-pending={isPending || undefined}
        data-locked={!status.canTransition && !status.isCurrent || undefined}
        className={cn(
          'sequence-panel__stage-item',
          'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all',
          // Current synced state - green
          status.isCurrent && 'bg-arcane/20 border border-arcane',
          // Pending state (selected but not synced) - amber/yellow with pulsing border
          isPending && !status.isCurrent && 'bg-warning/20 border-2 border-warning animate-pulse',
          // Available but not selected
          !status.isCurrent && !isPending && status.canTransition && 'hover:bg-slate cursor-pointer border border-transparent',
          // Locked
          !status.canTransition && !status.isCurrent && 'opacity-50 cursor-not-allowed border border-transparent'
        )}
        title={status.reason || undefined}
      >
        {/* Status Icon */}
        <div className="sequence-panel__stage-icon flex-shrink-0">
          {status.isCurrent ? (
            <CheckCircle2 className="w-4 h-4 text-arcane" />
          ) : !status.canTransition ? (
            <Lock className="w-4 h-4 text-mist" />
          ) : isPending ? (
            <Clock className="w-4 h-4 text-warning" />
          ) : (
            <Circle className="w-4 h-4 text-mist" />
          )}
        </div>

        {/* Label */}
        <span className={cn(
          'sequence-panel__stage-label flex-1 text-sm',
          status.isCurrent ? 'text-arcane font-semibold' : isPending ? 'text-warning font-semibold' : 'text-snow'
        )}>
          {seq.label}
        </span>

        {/* Pending indicator */}
        {isPending && !status.isCurrent && (
          <span className="sequence-panel__pending-badge text-xs text-warning bg-warning/30 px-1.5 py-0.5 rounded">
            Pending
          </span>
        )}

        {/* Backward indicator */}
        {status.isBackward && status.canTransition && !status.isCurrent && !isPending && (
          <span className="sequence-panel__backward-badge text-xs text-warning bg-warning/20 px-1.5 py-0.5 rounded">
            ← Back
          </span>
        )}

        {/* Lock reason on hover shown via title */}
      </button>
    );
  };

  const renderMasterView = () => {
    if (!groupedSequences) return null;

    const groups = ['setup', 'draft', 'deckbuilding', 'rounds', 'complete'];
    
    return (
      <div className="sequence-panel__master-view space-y-4">
        {groups.map(group => {
          const groupSeqs = groupedSequences[group];
          if (!groupSeqs || groupSeqs.length === 0) return null;

          // Skip draft for sealed events
          if (group === 'draft' && event.type === 'sealed') return null;

          return (
            <div 
              key={group}
              data-group={group}
              className="sequence-panel__group"
            >
              <h4 className="sequence-panel__group-title text-xs uppercase tracking-wide text-mist mb-2 px-3">
                {getGroupDisplayName(group)}
              </h4>
              <div className="sequence-panel__group-items space-y-1">
                {groupSeqs.map(renderStageItem)}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderFocusedView = () => {
    return (
      <div className="sequence-panel__focused-view space-y-1">
        {sequences.map(renderStageItem)}
      </div>
    );
  };

  return (
    <div 
      data-component="EventSequencePanel"
      data-expanded={isExpanded || undefined}
      data-master={isMasterView || undefined}
      className={cn(
        'sequence-panel',
        'bg-obsidian border border-storm rounded-xl overflow-hidden mt-8'
      )}
    >
      {/* Header - Always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="sequence-panel__header w-full flex items-center justify-between px-4 py-3 hover:bg-slate/50 transition-colors"
      >
        <div className="sequence-panel__header-left flex items-center gap-3">
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-mist" />
          ) : (
            <ChevronRight className="w-4 h-4 text-mist" />
          )}
          <span className="sequence-panel__title text-sm font-semibold text-snow">
            Event Sequence
          </span>
        </div>
        
        <div className="sequence-panel__header-right flex items-center gap-2">
          {pendingStage && (
            <span className="sequence-panel__pending-indicator text-xs bg-warning/30 text-warning px-2 py-1 rounded-full animate-pulse">
              → {getStageName(pendingStage)}
            </span>
          )}
          <span className={cn(
            'sequence-panel__current-badge text-xs px-2 py-1 rounded-full',
            pendingStage ? 'bg-slate/50 text-mist' : 'bg-arcane/20 text-arcane'
          )}>
            {currentStage ? getStageName(currentStage) : 'Unknown'}
          </span>
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="sequence-panel__content border-t border-storm">
          {/* Warning for backward transitions */}
          {pendingStage && getStageStatus(pendingStage).isBackward && (
            <div className="sequence-panel__warning flex items-center gap-2 px-4 py-2 bg-warning/10 border-b border-warning/30">
              <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0" />
              <span className="text-xs text-warning">
                Going backward may affect recorded data. Proceed with caution.
              </span>
            </div>
          )}

          {/* Stage List */}
          <div className="sequence-panel__stages p-4">
            {isMasterView ? renderMasterView() : renderFocusedView()}
          </div>

          {/* Action Footer */}
          <div className="sequence-panel__footer border-t border-storm px-4 py-3 flex items-center justify-between bg-slate/30">
            <p className="sequence-panel__hint text-xs text-mist">
              {pendingStage 
                ? `Ready to sync: ${getStageName(pendingStage)}`
                : 'Select a stage to sync the event state'}
            </p>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSync}
              disabled={!pendingStage || isSyncing}
              className={cn(
                'sequence-panel__sync-btn',
                pendingStage && 'animate-pulse'
              )}
            >
              {isSyncing ? 'Syncing...' : 'Sync Event State'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

