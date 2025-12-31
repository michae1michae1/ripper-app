import { useState, useEffect, useCallback } from 'react';

interface TimerState {
  startedAt: number | null;
  pausedAt: number | null;
  duration: number; // total duration in seconds
  isPaused: boolean;
}

interface UseTimerReturn {
  remainingSeconds: number;
  isRunning: boolean;
  isExpired: boolean;
  formattedTime: string;
}

function formatTime(seconds: number): string {
  const absSeconds = Math.abs(seconds);
  const mins = Math.floor(absSeconds / 60);
  const secs = absSeconds % 60;
  const sign = seconds < 0 ? '-' : '';
  return `${sign}${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function useTimer(state: TimerState | null): UseTimerReturn {
  const [remainingSeconds, setRemainingSeconds] = useState(state?.duration ?? 0);
  
  const calculateRemaining = useCallback(() => {
    if (!state) return 0;
    
    if (state.startedAt === null) {
      return state.duration;
    }
    
    const elapsed = state.isPaused && state.pausedAt
      ? (state.pausedAt - state.startedAt) / 1000
      : (Date.now() - state.startedAt) / 1000;
    
    return Math.max(0, Math.floor(state.duration - elapsed));
  }, [state]);
  
  useEffect(() => {
    setRemainingSeconds(calculateRemaining());
    
    if (!state || state.isPaused || state.startedAt === null) {
      return;
    }
    
    const interval = setInterval(() => {
      setRemainingSeconds(calculateRemaining());
    }, 100);
    
    return () => clearInterval(interval);
  }, [state, calculateRemaining]);
  
  return {
    remainingSeconds,
    isRunning: !!state && !state.isPaused && state.startedAt !== null,
    isExpired: remainingSeconds <= 0,
    formattedTime: formatTime(remainingSeconds),
  };
}

// For large timers (minutes display)
export function useTimerMinutes(state: TimerState | null): UseTimerReturn & {
  minutes: number;
  seconds: number;
} {
  const timer = useTimer(state);
  
  return {
    ...timer,
    minutes: Math.floor(timer.remainingSeconds / 60),
    seconds: timer.remainingSeconds % 60,
  };
}

