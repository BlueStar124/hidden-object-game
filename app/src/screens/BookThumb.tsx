import React from 'react';
import { Image, View } from 'react-native';
import type { Page } from '../core/model';
import { artOf } from '../content';

// The artwork is the open book on a transparent margin: the thumbnail shows just the paper
const BOOK = { x: 0.05, y: 0.218, w: 0.9, h: 0.564 };

/** A page's painting, cropped to its paper, in a 16:9 frame (page index, home screen). */
export const BookThumb: React.FC<{ scene: Page; width: number }> = ({ scene, width }) => {
  const height = (width * 9) / 16;
  // Cover the 16:9 frame with the paper
  const scale = Math.max(width / (BOOK.w * 1760), height / (BOOK.h * 1240));
  const imgW = 1760 * scale;
  const imgH = 1240 * scale;
  const left = -(BOOK.x + BOOK.w / 2) * imgW + width / 2;
  const top = -(BOOK.y + BOOK.h / 2) * imgH + height / 2;
  return (
    <View style={{ width, height, overflow: 'hidden', backgroundColor: '#e3ded3' }}>
      <Image
        source={artOf(scene)}
        style={{ position: 'absolute', width: imgW, height: imgH, left, top }}
        resizeMode="stretch"
      />
    </View>
  );
};
