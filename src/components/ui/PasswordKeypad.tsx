import { useState } from 'react';
import { Delete, ArrowLeft, Lock } from 'lucide-react';
import { Button } from './Button';
import { cn } from '@/lib/cn';
import { verifyPassword } from '@/lib/api';

interface PasswordKeypadProps {
  onSuccess: () => void;
  onGoBack?: () => void;
  showGoBack?: boolean;
}

export const PasswordKeypad = ({ onSuccess, onGoBack, showGoBack = false }: PasswordKeypadProps) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const maxLength = 4;

  const handleNumberPress = (num: string) => {
    if (pin.length < maxLength) {
      const newPin = pin + num;
      setPin(newPin);
      setError('');
      
      // Auto-submit when 4 digits entered
      if (newPin.length === maxLength) {
        verifyPin(newPin);
      }
    }
  };

  const handleDelete = () => {
    setPin(pin.slice(0, -1));
    setError('');
  };

  const verifyPin = async (pinToVerify: string) => {
    setIsVerifying(true);
    setError('');

    try {
      const isValid = await verifyPassword(pinToVerify);

      if (isValid) {
        // Store auth in sessionStorage
        sessionStorage.setItem('host_authenticated', 'true');
        onSuccess();
      } else {
        setError('Incorrect PIN');
        setPin('');
      }
    } catch (err) {
      setError('Failed to verify. Try again.');
      setPin('');
    } finally {
      setIsVerifying(false);
    }
  };

  const numbers = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];

  return (
    <div className="min-h-screen bg-midnight flex flex-col items-center justify-center px-4">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-arcane/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Lock className="w-8 h-8 text-arcane" />
        </div>
        <h1 className="text-2xl font-bold text-snow mb-2">Host Access</h1>
        <p className="text-mist">Enter your PIN to access event controls</p>
      </div>

      {/* PIN Display */}
      <div className="flex gap-3 mb-8">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={cn(
              'w-14 h-14 rounded-xl border-2 flex items-center justify-center text-2xl font-bold transition-all',
              pin.length > i
                ? 'border-arcane bg-arcane/20 text-snow'
                : 'border-storm bg-slate text-mist'
            )}
          >
            {pin.length > i ? '•' : ''}
          </div>
        ))}
      </div>

      {/* Error Message */}
      {error && (
        <p className="text-danger text-sm mb-4 animate-pulse">{error}</p>
      )}

      {/* Keypad */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {numbers.map((num, index) => {
          if (num === '') {
            return <div key={index} className="w-20 h-16" />;
          }
          
          if (num === 'del') {
            return (
              <button
                key={index}
                onClick={handleDelete}
                disabled={isVerifying || pin.length === 0}
                className="w-20 h-16 rounded-xl bg-slate border border-storm flex items-center justify-center text-mist hover:bg-storm hover:text-snow transition-all disabled:opacity-50"
              >
                <Delete className="w-6 h-6" />
              </button>
            );
          }

          return (
            <button
              key={index}
              onClick={() => handleNumberPress(num)}
              disabled={isVerifying}
              className="w-20 h-16 rounded-xl bg-slate border border-storm text-2xl font-semibold text-snow hover:bg-storm hover:border-arcane transition-all disabled:opacity-50 active:scale-95"
            >
              {num}
            </button>
          );
        })}
      </div>

      {/* Loading indicator */}
      {isVerifying && (
        <div className="flex items-center gap-2 text-mist mb-4">
          <div className="w-4 h-4 border-2 border-arcane border-t-transparent rounded-full animate-spin" />
          <span>Verifying...</span>
        </div>
      )}

      {/* Go Back Button */}
      {showGoBack && onGoBack && (
        <Button
          variant="ghost"
          onClick={onGoBack}
          className="mt-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Go Back to Event
        </Button>
      )}
    </div>
  );
};

// Helper function to check if user is authenticated
export const isHostAuthenticated = (): boolean => {
  return sessionStorage.getItem('host_authenticated') === 'true';
};

// Helper function to clear authentication
export const clearHostAuth = (): void => {
  sessionStorage.removeItem('host_authenticated');
};

