import { useCallback, useRef } from 'react';

/**
 * A callback that keeps its identity while always calling the latest `fn`: memoized components
 * that receive it are not re-rendered just because the state it reads has changed (the game
 * clock ticks every second).
 */
export function useStableCallback<A extends unknown[], R>(fn: (...args: A) => R): (...args: A) => R {
  const latest = useRef(fn);
  latest.current = fn;
  return useCallback((...args: A) => latest.current(...args), []);
}
