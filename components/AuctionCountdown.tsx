'use client';

import { useState, useEffect, useRef } from 'react';

interface AuctionCountdownProps {
  endDate: Date;
  increaseRate?: number; // milliseconds between price increases
  onEnd?: () => void;
}

/** Renders "Next increase in: X ms" with countdown — use below Increases in the card */
export function NextIncreaseCountdown({ endDate, increaseRate = 10000 }: { endDate: Date; increaseRate?: number }) {
  const [msCountdown, setMsCountdown] = useState(increaseRate);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (increaseRate <= 0) return;
    setMsCountdown(increaseRate);
    if (tickRef.current) clearInterval(tickRef.current);
    tickRef.current = setInterval(() => {
      if (Date.now() >= endDate.getTime()) {
        if (tickRef.current) clearInterval(tickRef.current);
        tickRef.current = null;
        return;
      }
      setMsCountdown((prev) => {
        const next = prev - 100;
        return next <= 0 ? increaseRate : next;
      });
    }, 100);
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
      tickRef.current = null;
    };
  }, [increaseRate, endDate.getTime()]);
  return (
    <div className="flex justify-between text-xs text-gray-500 mt-1">
      <span>Next increase in:</span>
      <span>{msCountdown} ms</span>
    </div>
  );
}

export default function AuctionCountdown({ 
  endDate, 
  increaseRate = 10000,
  onEnd 
}: AuctionCountdownProps) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    milliseconds: 0,
    totalMs: 0
  });

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date().getTime();
      const end = endDate.getTime();
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          milliseconds: 0,
          totalMs: 0
        });
        if (onEnd) onEnd();
        return;
      }

      const days = Math.floor(diff / 86400000);
      const hours = Math.floor((diff % 86400000) / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      const ms = diff % 1000;

      setTimeLeft({
        days,
        hours,
        minutes,
        seconds,
        milliseconds: ms,
        totalMs: diff
      });
    };

    // Update every 100ms for smooth countdown
    const interval = setInterval(updateCountdown, 100);
    updateCountdown(); // Initial call

    return () => clearInterval(interval);
  }, [endDate, onEnd]);

  if (timeLeft.totalMs <= 0) {
    return (
      <div className="text-center">
        <p className="text-lg font-bold text-gray-500">Time Over</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Main Countdown */}
      <div className="flex items-center justify-center gap-2 text-2xl font-bold">
        <div className="flex flex-col items-center">
          <span className="text-3xl">{timeLeft.days}</span>
          <span className="text-xs text-gray-500">Days</span>
        </div>
        <span className="text-gray-400">:</span>
        <div className="flex flex-col items-center">
          <span className="text-3xl">{String(timeLeft.hours).padStart(2, '0')}</span>
          <span className="text-xs text-gray-500">Hours</span>
        </div>
        <span className="text-gray-400">:</span>
        <div className="flex flex-col items-center">
          <span className="text-3xl">{String(timeLeft.minutes).padStart(2, '0')}</span>
          <span className="text-xs text-gray-500">Mins</span>
        </div>
        <span className="text-gray-400">:</span>
        <div className="flex flex-col items-center">
          <span className="text-3xl">{String(timeLeft.seconds).padStart(2, '0')}</span>
          <span className="text-xs text-gray-500">Secs</span>
        </div>
      </div>
    </div>
  );
}
