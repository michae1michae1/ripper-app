import { useState, type KeyboardEvent } from 'react';
import { UserPlus } from 'lucide-react';
import { Input, Button } from '@/components/ui';

interface PlayerInputProps {
  onAddPlayer: (name: string) => void;
  disabled?: boolean;
}

export const PlayerInput = ({ onAddPlayer, disabled }: PlayerInputProps) => {
  const [name, setName] = useState('');
  
  const handleSubmit = () => {
    const trimmedName = name.trim();
    if (trimmedName) {
      onAddPlayer(trimmedName);
      setName('');
    }
  };
  
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };
  
  return (
    <div 
      data-component="PlayerInput"
      className="player-input flex gap-2"
    >
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Add player by name..."
        disabled={disabled}
        icon={<UserPlus className="w-4 h-4" />}
        className="player-input__field flex-1"
        suffix={
          <Button
            variant="secondary"
            size="sm"
            onClick={handleSubmit}
            disabled={disabled || !name.trim()}
            className="player-input__submit-btn"
          >
            Enter
          </Button>
        }
      />
    </div>
  );
};

