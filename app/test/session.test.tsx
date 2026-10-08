import React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';
import { FIRST_COUNTRY, pagesOf } from '../src/content';
import { useNavigation, type Navigation } from '../src/game/useNavigation';
import { usePagesAround } from '../src/board/usePagesAround';
import type { SceneLibrary } from '../src/board/useSceneLibrary';

jest.mock('../src/platform/sound', () => ({ sound: { playPageTurn: jest.fn() } }));
jest.mock('../src/core/progress', () => ({ progress: { lastPage: () => undefined } }));
jest.mock('../src/board/useSceneLibrary', () => ({ useKeepArt: jest.fn() }));

let renderer: ReactTestRenderer;
let navigation: Navigation;
function NavigationProbe() {
  navigation = useNavigation();
  return null;
}

beforeEach(() => {
  jest.useFakeTimers();
  // React's test renderer is already provided by jest-expo; opt into its act environment.
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  jest.spyOn(console, 'error').mockImplementation((...args) => {
    if (String(args[0]).includes('react-test-renderer is deprecated')) return;
    throw new Error(args.map(String).join(' '));
  });
});

afterEach(() => {
  if (renderer) act(() => renderer.unmount());
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('Page-turn ownership', () => {
  test('a cold destination waits for the board instead of a fixed navigation deadline', () => {
    act(() => { renderer = create(<NavigationProbe />); });
    const initial = navigation.page.id;
    act(() => navigation.next());
    const request = navigation.turn!;
    act(() => jest.advanceTimersByTime(5000));
    expect(navigation.page.id).toBe(initial);
    expect(navigation.turn).toBe(request);
    act(() => navigation.completeTurn(request));
    expect(navigation.page.id).toBe(request.to.id);
    expect(navigation.visit).toBe(1);
    expect(navigation.turn).toBeNull();
  });

  test('replaying cancels an outstanding completion and rapid requests keep one destination', () => {
    act(() => { renderer = create(<NavigationProbe />); });
    const initial = navigation.page.id;
    act(() => { navigation.next(); navigation.goTo(4); });
    const request = navigation.turn!;
    expect(request.to.id).toBe(pagesOf(FIRST_COUNTRY)[1].day.id);
    act(() => navigation.replay());
    act(() => navigation.completeTurn(request));
    expect(navigation.page.id).toBe(initial);
    expect(navigation.visit).toBe(1);
    expect(navigation.turn).toBeNull();
  });

  test('destination preparation reacts when artwork arrives after the request', () => {
    const pages = pagesOf(FIRST_COUNTRY);
    const prepare = jest.fn<SceneLibrary['prepare']>(() => null);
    const bump = jest.fn<SceneLibrary['bump']>();
    let ready = false;
    const library = {
      version: 0, prepare, bump,
      hasArt: () => ready, isPrepared: () => false,
      preparedScene: () => undefined, imageOf: () => undefined,
    } as unknown as SceneLibrary;
    function PreparationProbe({ version }: { version: number }) {
      usePagesAround({ ...library, version }, pages[0].day, [], pages[4].day);
      return null;
    }
    act(() => { renderer = create(<PreparationProbe version={0} />); });
    act(() => jest.runOnlyPendingTimers());
    expect(prepare).not.toHaveBeenCalled();
    ready = true;
    act(() => renderer.update(<PreparationProbe version={1} />));
    act(() => jest.runOnlyPendingTimers());
    expect(prepare).toHaveBeenCalledWith(pages[4].day);
    expect(bump).toHaveBeenCalledTimes(1);
  });
});
