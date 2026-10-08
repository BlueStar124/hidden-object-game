import { useCallback, useEffect, useRef, useState } from 'react';

/** A short message floating up from where the player tapped (points, or a notice). */
export interface Notice {
  id: string;
  text: string;
  x: number; // window coordinates
  y: number;
  variant?: 'score' | 'info';
}

export type Notify = (text: string, at: { x: number; y: number }, variant?: Notice['variant']) => void;

/** Floating notices: each one lives for 1.2s (points) or 1.8s (information). */
export function useNotices(): { notices: Notice[]; notify: Notify } {
  const [notices, setNotices] = useState<Notice[]>([]);
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>());
  useEffect(() => {
    const pending = timers.current;
    return () => {
      for (const timer of pending) clearTimeout(timer);
      pending.clear();
    };
  }, []);
  const notify = useCallback<Notify>((text, at, variant = 'score') => {
    const id = Math.random().toString();
    setNotices((prev) => [...prev, { id, text, x: at.x, y: at.y, variant }]);
    const timer = setTimeout(() => {
      timers.current.delete(timer);
      setNotices((prev) => prev.filter((n) => n.id !== id));
    }, variant === 'info' ? 1800 : 1200);
    timers.current.add(timer);
  }, []);
  return { notices, notify };
}
