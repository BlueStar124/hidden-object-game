import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import { sound } from '../src/platform/sound.native';

jest.mock('expo-audio', () => ({
  createAudioPlayer: jest.fn(),
  setAudioModeAsync: jest.fn(() => Promise.resolve()),
}));
jest.mock('../src/platform/haptics', () => ({
  haptics: { wrong: jest.fn(), pageTurn: jest.fn() },
}));

beforeEach(() => {
  jest.mocked(createAudioPlayer).mockReset();
  sound.setSoundEnabled(true);
});

describe('Optional native audio', () => {
  test('failed initialization and player creation cannot interrupt a page turn', () => {
    jest.mocked(setAudioModeAsync).mockImplementationOnce(() => { throw new Error('Audio session unavailable'); });
    jest.mocked(createAudioPlayer).mockImplementation(() => { throw new Error('Player unavailable'); });
    expect(() => sound.prepareVoices(['cat'])).not.toThrow();
    expect(() => sound.playPageTurn()).not.toThrow();
  });

  test('a player can be created again after a failed prewarm', () => {
    const player = { seekTo: jest.fn(() => Promise.resolve()), play: jest.fn() };
    jest.mocked(createAudioPlayer).mockReturnValue(player as unknown as ReturnType<typeof createAudioPlayer>);
    sound.playWrong();
    expect(player.play).toHaveBeenCalledTimes(1);
  });
});
