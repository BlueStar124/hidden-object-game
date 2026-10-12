import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions, type LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import type { CoverSticker, SpriteType } from '../../core/model';
import { MAX_STICKERS, progress } from '../../core/progress';
import { BESTIARY } from '../../content/bestiary';
import { SecondaryButton } from '../../ui/Buttons';
import { DialogHeader } from '../../ui/DialogHeader';
import { RotateCw, Sticker as StickerIcon, Trash, ZoomIn, ZoomOut } from '../../ui/icons';
import { ModalShell } from '../../ui/ModalShell';
import { SpriteIcon } from '../../ui/SpriteIcon';
import { colors, fonts } from '../../ui/theme';
import { spottedKinds } from '../home/summary';

interface MyCoverProps {
  onClose: () => void;
}

// A sticker at scale 1 (px); how far it may be shrunk or grown
const STICKER = 56;
const MIN_SCALE = 0.5;
const MAX_SCALE = 2.6;
// The cover takes this share of the screen's height, within these bounds (px): the whole dialog fits
// a phone held sideways without shrinking too far
const COVER_SHARE = 0.36;
const COVER_MIN = 120;
const COVER_MAX = 250;
// Buttons (for a mouse, where there is no pinch): steps of rotation (degrees) and of size
const ROTATE_STEP = 15;
const SCALE_STEP = 1.2;

const clamp = (v: number, min: number, max: number) => {
  'worklet';
  return Math.min(max, Math.max(min, v));
};

/**
 * The inside cover of the player's own sketchbook: every creature and object they have found is a
 * sticker, to place, turn and size as they like. Gestures move the stickers on the UI thread; the
 * cover is saved when a gesture ends.
 */
export const MyCover: React.FC<MyCoverProps> = ({ onClose }) => {
  const kinds = useMemo(() => [...spottedKinds().found].filter((t) => BESTIARY[t as Exclude<SpriteType, 'seal'>]), []);
  const [stickers, setStickers] = useState<CoverSticker[]>(() => progress.cover().filter((s) => kinds.includes(s.type)));
  const [selected, setSelected] = useState<number | null>(null);
  const [area, setArea] = useState({ w: 0, h: 0 });
  const { height } = useWindowDimensions();
  const coverHeight = Math.round(Math.min(COVER_MAX, Math.max(COVER_MIN, height * COVER_SHARE)));

  // Saved after every change but the first render
  const loaded = useRef(false);
  useEffect(() => {
    if (!loaded.current) {
      loaded.current = true;
      return;
    }
    progress.saveCover(stickers);
  }, [stickers]);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setArea((a) => (a.w === width && a.h === height ? a : { w: width, h: height }));
  }, []);

  const add = (type: SpriteType) => {
    if (stickers.length >= MAX_STICKERS) return;
    // A little off-centre each time, so a new sticker never hides the last one exactly
    const n = stickers.length;
    setStickers((list) => [...list, { type, x: 0.5 + ((n % 5) - 2) * 0.04, y: 0.5 + ((n % 3) - 1) * 0.06, rotation: 0, scale: 1 }]);
    setSelected(n);
  };
  const change = useCallback((index: number, next: CoverSticker) => {
    setStickers((list) => list.map((s, i) => (i === index ? next : s)));
  }, []);
  const adjust = (fn: (s: CoverSticker) => CoverSticker) => {
    if (selected !== null) setStickers((list) => list.map((s, i) => (i === selected ? fn(s) : s)));
  };
  const remove = () => {
    if (selected === null) return;
    setStickers((list) => list.filter((_, i) => i !== selected));
    setSelected(null);
  };

  return (
    <ModalShell
      maxWidth={760}
      zIndex={350}
      backdrop="rgba(28, 24, 20, 0.74)"
      header={
        <DialogHeader
          icon={<StickerIcon size={24} color={colors.earth} />}
          title="Trang Bìa Của Tôi"
          description="Dán những gì bạn đã tìm thấy · kéo để di chuyển, chụm hai ngón để xoay và đổi cỡ"
          onClose={onClose}
        />
      }
    >
      <View style={[styles.cover, { height: coverHeight }]} onLayout={onLayout}>
        {/* A tap on the paper puts the selection down */}
        <Pressable style={StyleSheet.absoluteFill} onPress={() => setSelected(null)} accessible={false} />
        {stickers.length === 0 && (
          <Text style={styles.empty}>{kinds.length ? 'Chạm vào một sticker bên dưới để dán lên trang bìa.' : 'Hãy tìm vật trong tranh để có sticker đầu tiên!'}</Text>
        )}
        {area.w > 0 &&
          stickers.map((s, i) => (
            <Sticker key={i} index={i} sticker={s} area={area} selected={selected === i} onSelect={setSelected} onChange={change} />
          ))}
      </View>

      <View style={styles.tools}>
        <SecondaryButton
          label="Xoay"
          icon={<RotateCw size={16} color={colors.ink} />}
          disabled={selected === null}
          onPress={() => adjust((s) => ({ ...s, rotation: (s.rotation + ROTATE_STEP) % 360 }))}
        />
        <SecondaryButton
          label="Nhỏ"
          icon={<ZoomOut size={16} color={colors.ink} />}
          disabled={selected === null}
          onPress={() => adjust((s) => ({ ...s, scale: clamp(s.scale / SCALE_STEP, MIN_SCALE, MAX_SCALE) }))}
        />
        <SecondaryButton
          label="To"
          icon={<ZoomIn size={16} color={colors.ink} />}
          disabled={selected === null}
          onPress={() => adjust((s) => ({ ...s, scale: clamp(s.scale * SCALE_STEP, MIN_SCALE, MAX_SCALE) }))}
        />
        <SecondaryButton label="Gỡ" tone="danger" icon={<Trash size={16} color={colors.crimson} />} disabled={selected === null} onPress={remove} />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tray} contentContainerStyle={styles.trayRow}>
        {kinds.map((type) => (
          <Pressable
            key={type}
            onPress={() => add(type)}
            disabled={stickers.length >= MAX_STICKERS}
            accessibilityRole="button"
            accessibilityLabel={`Dán ${BESTIARY[type as Exclude<SpriteType, 'seal'>].name}`}
            style={({ pressed }) => [styles.trayItem, pressed && styles.trayPressed]}
          >
            <SpriteIcon type={type} size={34} />
          </Pressable>
        ))}
      </ScrollView>
      <Text style={styles.count}>
        {stickers.length}/{MAX_STICKERS} sticker · {kinds.length} loại đã sưu tầm
      </Text>
    </ModalShell>
  );
};

/** One sticker on the cover: dragged, pinched and turned on the UI thread, saved when let go. */
const Sticker = React.memo<{
  index: number;
  sticker: CoverSticker;
  area: { w: number; h: number };
  selected: boolean;
  onSelect: (index: number) => void;
  onChange: (index: number, sticker: CoverSticker) => void;
}>(({ index, sticker, area, selected, onSelect, onChange }) => {
  const x = useSharedValue(sticker.x * area.w);
  const y = useSharedValue(sticker.y * area.h);
  const rotation = useSharedValue(sticker.rotation);
  const scale = useSharedValue(sticker.scale);
  // The buttons, a removal (indices shift) or a new layout change the sticker from outside
  useEffect(() => {
    x.value = sticker.x * area.w;
    y.value = sticker.y * area.h;
    rotation.value = sticker.rotation;
    scale.value = sticker.scale;
  }, [sticker, area, x, y, rotation, scale]);

  const gesture = useMemo(() => {
    const { w, h } = area;
    const { type } = sticker;
    const commit = () => {
      'worklet';
      scheduleOnRN(onChange, index, { type, x: x.value / w, y: y.value / h, rotation: rotation.value, scale: scale.value });
    };
    const pan = Gesture.Pan()
      .onBegin(() => scheduleOnRN(onSelect, index))
      .onChange((e) => {
        x.value = clamp(x.value + e.changeX, 0, w);
        y.value = clamp(y.value + e.changeY, 0, h);
      })
      .onEnd(commit);
    const pinch = Gesture.Pinch()
      .onChange((e) => {
        scale.value = clamp(scale.value * e.scaleChange, MIN_SCALE, MAX_SCALE);
      })
      .onEnd(commit);
    const turn = Gesture.Rotation()
      .onChange((e) => {
        rotation.value += (e.rotationChange * 180) / Math.PI;
      })
      .onEnd(commit);
    return Gesture.Simultaneous(pan, pinch, turn);
  }, [area, sticker, index, onChange, onSelect, x, y, rotation, scale]);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: x.value - STICKER / 2 },
      { translateY: y.value - STICKER / 2 },
      { rotate: `${rotation.value}deg` },
      { scale: scale.value },
    ],
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[styles.sticker, selected && styles.stickerSelected, style]}>
        <SpriteIcon type={sticker.type} size={STICKER - 8} />
      </Animated.View>
    </GestureDetector>
  );
});

const styles = StyleSheet.create({
  cover: {
    alignSelf: 'stretch',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: '#fbf7ee',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    fontFamily: fonts.bodyItalic,
    fontSize: 14,
    color: colors.inkSoft,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  sticker: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: STICKER,
    height: STICKER,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  stickerSelected: {
    borderColor: 'rgba(179, 131, 59, 0.7)',
    borderStyle: 'dashed',
    zIndex: 1,
  },
  tools: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  tray: {
    alignSelf: 'stretch',
    marginTop: 10,
    flexGrow: 0,
  },
  trayRow: {
    gap: 6,
    paddingVertical: 2,
  },
  trayItem: {
    width: 48,
    height: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  trayPressed: {
    backgroundColor: '#fff',
  },
  count: {
    fontSize: 11.5,
    color: colors.inkSoft,
    marginTop: 6,
    marginBottom: 8,
  },
});
