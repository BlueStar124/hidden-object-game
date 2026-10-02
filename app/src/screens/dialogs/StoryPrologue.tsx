import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  BookOpen,
  Compass,
  Eye,
  Flashlight,
  Footprints,
  Hand,
  Moon,
  Palette,
  Search,
  Sparkles,
  ZoomIn,
  type LucideIcon,
} from '../../ui/icons';
import type { Chapter, Page } from '../../core/model';
import { colors, fonts } from '../../ui/theme';
import { ModalShell } from '../../ui/ModalShell';
import { PrimaryButton } from '../../ui/Buttons';
import { useShortLandscape } from '../../ui/layout';

interface BriefingItem {
  icon: LucideIcon;
  text: string;
}

// The web briefing, reworded for touch: pinch to zoom, drag the loupe by its handle, tap to inspect
const DAY_BRIEFING: BriefingItem[] = [
  { icon: ZoomIn, text: 'Chụm hai ngón để phóng to trang, kéo để xem khắp cuốn sổ.' },
  { icon: Search, text: 'Cầm cán kính lúp mà rê để soi từng nét vẽ — ngón tay không che mất tròng kính.' },
  {
    icon: Palette,
    text: 'Mọi thứ đều được ngụy trang: có con đổi màu theo nền, có vật viết bằng mực tàng hình chỉ hiện qua kính lúp, có con nhút nhát thỉnh thoảng mới ló ra.',
  },
  { icon: Footprints, text: 'Có sinh vật không chịu đứng yên — canh đúng lúc nó đi ngang qua để bắt.' },
  { icon: Eye, text: 'Để ý những đôi mắt chớp chớp — dấu hiệu của sinh vật đang ẩn nấp!' },
  { icon: Hand, text: 'Chạm vào chỗ nghi ngờ, hoặc chạm vào tròng kính để soi đúng tâm. Chạm bừa sẽ bị trừ điểm!' },
];

const NIGHT_BRIEFING: BriefingItem[] = [
  { icon: Flashlight, text: 'Kính lúp giờ là đèn pin — chỉ vùng quanh kính mới được soi sáng.' },
  { icon: Eye, text: 'Trong bóng tối, mắt của các con vật phát sáng lấp lánh. Hãy lần theo chúng!' },
  { icon: Sparkles, text: 'Đom đóm và những kẻ lang thang luôn di chuyển — rọi đèn và bắt đúng lúc.' },
];

interface StoryPrologueProps {
  chapter: Chapter;
  chapterNumber: number;
  nightPage?: Page; // When set: the intro card for that page's night variant
  onStartGame: () => void;
}

export const StoryPrologue: React.FC<StoryPrologueProps> = ({ chapter, chapterNumber, nightPage, onStartGame }) => {
  const night = !!nightPage;
  const briefing = night ? NIGHT_BRIEFING : DAY_BRIEFING;
  const paragraphs = night ? [nightPage!.storyClue] : chapter.prologue;
  const ink = night ? colors.moonlight : colors.ink;
  // Phone held sideways: story on the left, how-to-play on the right
  const columns = useShortLandscape();

  return (
    <ModalShell
      maxWidth={columns ? 880 : 520}
      zIndex={300}
      backdrop={night ? 'rgba(6, 10, 26, 0.82)' : 'rgba(30, 26, 20, 0.74)'}
      cardStyle={night && styles.nightCard}
      footer={
        <PrimaryButton
          tall
          label={night ? 'Bật Đèn Pin & Bắt Đầu' : 'Mở Cuốn Sổ & Bắt Đầu Điều Tra'}
          icon={night ? <Flashlight size={19} color="#fff" /> : <BookOpen size={19} color="#fff" />}
          onPress={onStartGame}
        />
      }
    >
      <View style={columns ? styles.columns : styles.stack}>
        <View style={columns ? styles.column : styles.stack}>
          <View style={[styles.stamp, night && { borderColor: colors.moonGold }]}>
            {night ? <Moon size={20} color={colors.moonGold} /> : <Compass size={22} color={colors.earth} />}
            <Text style={[styles.stampText, night && { color: colors.moonGold }]}>
              {night ? 'ĐÊM XUỐNG' : `CASE FILE #${chapterNumber}`}
            </Text>
          </View>

          <Text style={[styles.title, { color: ink }]}>{night ? nightPage!.title : chapter.title}</Text>
          <Text style={[styles.subtitle, night && { color: 'rgba(244, 236, 208, 0.7)' }]}>
            {night ? nightPage!.subtitle : chapter.subtitle}
          </Text>

          <View style={[styles.divider, night && { backgroundColor: 'rgba(244, 236, 208, 0.2)' }]} />

          <View style={styles.narrative}>
            {paragraphs.map((p, i) => (
              <Text key={i} style={[styles.paragraph, { color: night ? 'rgba(244, 236, 208, 0.92)' : colors.ink }]}>
                {' '}
                {p}
              </Text>
            ))}
          </View>
        </View>

        <View style={[styles.briefing, night && styles.briefingNight, columns && styles.briefingSide]}>
          {briefing.map(({ icon: Icon, text }) => (
            <View key={text} style={styles.briefingItem}>
              <Icon size={17} color={night ? colors.moonGold : colors.gold} />
              <Text style={[styles.briefingText, night && { color: 'rgba(244, 236, 208, 0.85)' }]}>{text}</Text>
            </View>
          ))}
        </View>
      </View>
    </ModalShell>
  );
};

const styles = StyleSheet.create({
  stack: {
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  columns: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 22,
  },
  column: {
    flex: 1.15,
    alignItems: 'center',
  },
  briefingSide: {
    flex: 1,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  nightCard: {
    backgroundColor: '#171e36',
    borderColor: 'rgba(255, 226, 160, 0.25)',
  },
  stamp: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.earth,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 4,
    marginBottom: 12,
  },
  stampText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    color: colors.earth,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 30,
    lineHeight: 36,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkSoft,
    textAlign: 'center',
    marginTop: 4,
  },
  divider: {
    width: '60%',
    height: 1,
    backgroundColor: colors.hairline,
    marginVertical: 16,
  },
  narrative: {
    alignSelf: 'stretch',
    gap: 8,
    marginBottom: 16,
  },
  paragraph: {
    fontFamily: fonts.body,
    fontSize: 14.5,
    lineHeight: 22,
    textAlign: 'justify',
  },
  briefing: {
    alignSelf: 'stretch',
    gap: 9,
    padding: 13,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    marginBottom: 6,
  },
  briefingNight: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderColor: 'rgba(244, 236, 208, 0.18)',
  },
  briefingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  briefingText: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 12.5,
    lineHeight: 17,
    color: colors.inkSoft,
  },
});
