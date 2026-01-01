import { useState, useRef, useEffect, type KeyboardEvent } from 'react';
import { Pencil, Check, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useEventStore } from '@/lib/store';
import { updateEventSession } from '@/lib/api';

interface EditablePlayerNameProps {
  playerId: string;
  name: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const EditablePlayerName = ({
  playerId,
  name,
  className,
  size = 'md',
}: EditablePlayerNameProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(name);
  const inputRef = useRef<HTMLInputElement>(null);
  const { event, updatePlayerName } = useEventStore();

  useEffect(() => {
    setEditedName(name);
  }, [name]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = async () => {
    const trimmedName = editedName.trim();
    if (trimmedName && trimmedName !== name) {
      updatePlayerName(playerId, trimmedName);
      if (event) {
        await updateEventSession(event.id, useEventStore.getState().event!);
      }
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedName(name);
    setIsEditing(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  const inputSizeClasses = {
    sm: 'text-sm px-1.5 py-0.5',
    md: 'text-base px-2 py-1',
    lg: 'text-lg px-2 py-1',
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-1">
        <input
          ref={inputRef}
          type="text"
          value={editedName}
          onChange={(e) => setEditedName(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          className={cn(
            'bg-slate border border-arcane rounded text-snow outline-none focus:ring-1 focus:ring-arcane',
            inputSizeClasses[size],
            className
          )}
          maxLength={30}
        />
        <button
          onClick={handleSave}
          className="p-1 text-success hover:bg-success/20 rounded transition-colors"
          title="Save"
        >
          <Check className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleCancel}
          className="p-1 text-danger hover:bg-danger/20 rounded transition-colors"
          title="Cancel"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setIsEditing(true)}
      className={cn(
        'group inline-flex items-center gap-1.5 hover:text-arcane transition-colors text-left',
        sizeClasses[size],
        className
      )}
      title="Click to edit name"
    >
      <span className="truncate">{name}</span>
      <Pencil className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
    </button>
  );
};

