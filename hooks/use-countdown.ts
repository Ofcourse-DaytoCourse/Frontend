// hooks/use-countdown.ts
import { useState, useEffect } from 'react';

export interface CountdownTime {
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
  totalMs: number;
}

export const useCountdown = (targetDate: Date | string | null): CountdownTime => {
  const [timeRemaining, setTimeRemaining] = useState(0);

  useEffect(() => {
    if (!targetDate) {
      setTimeRemaining(0);
      return;
    }

    const target = new Date(targetDate).getTime();
    
    const updateTimer = () => {
      const now = new Date().getTime();
      const difference = target - now;
      
      if (difference > 0) {
        setTimeRemaining(difference);
      } else {
        setTimeRemaining(0);
      }
    };

    // 즉시 실행
    updateTimer();
    
    // 1초마다 업데이트
    const interval = setInterval(updateTimer, 1000);
    
    return () => clearInterval(interval);
  }, [targetDate]);

  const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
  const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);
  const isExpired = timeRemaining === 0 && targetDate !== null;

  return {
    hours,
    minutes,
    seconds,
    isExpired,
    totalMs: timeRemaining,
  };
};