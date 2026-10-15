import React, { useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, useWindowDimensions, type GestureResponderEvent } from 'react-native';
import { FRIEND_AREA, FRIEND_SIZES, friendSizeOf, type FriendChallengeObject, type FriendSize } from '../../core/challenge';
import type { SpriteType } from '../../core/model';
import { progress } from '../../core/progress';
import { allPages, placeOf } from '../../content';
import { BESTIARY } from '../../content/bestiary';
import { PrimaryButton, SecondaryButton } from '../../ui/Buttons';
import { Check, Moon, Plus, Share2, Trash } from '../../ui/icons';
import { ModalShell } from '../../ui/ModalShell';
import { SpriteIcon } from '../../ui/SpriteIcon';
import { accentControl, colors, fonts } from '../../ui/theme';
import { BookThumb } from '../BookThumb';
import { newRequestId, publishFriendChallenge } from '../../platform/friendChallenges';
import { friendChallengeMessage } from '../share/messages';
import { useShare } from '../share/useShare';
import { ShareNote } from '../share/ShareRow';
import { ScrollStrip } from '../../ui/ScrollStrip';
import { useAuth } from '../auth/AuthContext';

interface ChallengeCreateProps {
  header: React.ReactNode;
  onClose: () => void;
  onSignIn: () => void;
  signedIn: boolean;
  playedPageIds?: readonly string[];
}

const SPRITES = Object.keys(BESTIARY) as Exclude<SpriteType, 'seal'>[];
const PAPER = { x: 0.05, y: 0.218, w: 0.9, h: 0.564 };
const SIZES: { value: FriendSize; label: string }[] = [
  { value: 'small', label: 'Nhỏ' },
  { value: 'medium', label: 'Vừa' },
  { value: 'large', label: 'Lớn' },
  { value: 'huge', label: 'Rất lớn' },
];
const DEFAULT_CLUE = 'Có một người bạn nhỏ đang trốn trong tranh.';
// A medium object's marker on the preview (px)
const MARKER = 30;
// How near an object's marker a press picks it up (px on screen)
const MARKER_GRAB = 22;
const CAMOUFLAGE = [
  { value: 'ink', label: 'Mực vẽ' },
  { value: 'chameleon', label: 'Đổi màu' },
  { value: 'invisible', label: 'Mực tàng hình' },
] as const;

/** Lets a player place any bundled sprite on a page they have played, then publish the layout. */
export const ChallengeCreate: React.FC<ChallengeCreateProps> = ({ header, onClose, onSignIn, signedIn, playedPageIds }) => {
  const pages = useMemo(() => {
    const played = playedPageIds ?? progress.playedPages();
    return allPages().filter((page) => played.includes(page.id));
  }, [playedPageIds]);
  const [selectedPageId, setSelectedPageId] = useState(pages[0]?.id);
  const selectedPage = pages.find((page) => page.id === selectedPageId);
  const [title, setTitle] = useState('Thử thách của mình');
  const [spriteType, setSpriteType] = useState<Exclude<SpriteType, 'seal'>>('cat');
  const [name, setName] = useState(BESTIARY.cat.name);
  const [clue, setClue] = useState(DEFAULT_CLUE);
  const [camo, setCamo] = useState<FriendChallengeObject['camo']>('ink');
  const [size, setSize] = useState<FriendSize>('medium');
  const [objects, setObjects] = useState<FriendChallengeObject[]>([]);
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [published, setPublished] = useState<{ code: string; text: string } | null>(null);
  const request = useRef<{ draft: string; id: string } | null>(null);
  const share = useShare();
  const { name: playerName } = useAuth();
  const { width } = useWindowDimensions();
  const previewWidth = Math.min(460, Math.max(240, width - 88));
  const previewHeight = previewWidth * 9 / 16;
  const pageLocation = selectedPage ? placeOf(selectedPage.id) : null;

  const updateSprite = (type: Exclude<SpriteType, 'seal'>) => {
    setSpriteType(type);
    setName(BESTIARY[type].name);
    if (selectedObjectId) {
      setObjects((current) => current.map((object) => object.id === selectedObjectId ? { ...object, spriteType: type, name: BESTIARY[type].name } : object));
      setPublished(null);
    }
  };

  const updateName = (value: string) => {
    setName(value);
    if (selectedObjectId) setObjects((current) => current.map((object) => object.id === selectedObjectId ? { ...object, name: value } : object));
    setPublished(null);
  };

  const updateClue = (value: string) => {
    setClue(value);
    if (selectedObjectId) setObjects((current) => current.map((object) => object.id === selectedObjectId ? { ...object, clue: value } : object));
    setPublished(null);
  };

  const updateSize = (value: FriendSize) => {
    setSize(value);
    if (selectedObjectId) setObjects((current) => current.map((object) => (object.id === selectedObjectId ? { ...object, ...FRIEND_SIZES[value] } : object)));
    setPublished(null);
  };

  const updateCamo = (value: NonNullable<FriendChallengeObject['camo']>) => {
    setCamo(value);
    if (selectedObjectId) setObjects((current) => current.map((object) => object.id === selectedObjectId ? { ...object, camo: value } : object));
    setPublished(null);
  };

  const addObject = () => {
    if (objects.length >= 20) {
      setError('Mỗi thử thách có thể giấu tối đa 20 vật.');
      return;
    }
    const nextNumber = objects.reduce((max, object) => Math.max(max, Number(object.id.replace('item-', '')) || 0), 0) + 1;
    const id = `item-${nextNumber}`;
    const next: FriendChallengeObject = {
      id,
      spriteType,
      name: name.trim(),
      clue: clue.trim(),
      x: 0.5,
      y: 0.5,
      ...FRIEND_SIZES[size],
      camo,
    };
    if (!next.name || !next.clue) {
      setError('Hãy điền tên vật và lời gợi ý trước khi thêm.');
      return;
    }
    setObjects((current) => [...current, next]);
    setSelectedObjectId(id);
    setError('Chạm hoặc kéo trên tranh để chọn chỗ giấu vật.');
    setPublished(null);
  };

  // Done with the object being edited: the fields are free again, so choosing another sprite starts a
  // new object instead of changing the one just hidden
  const finishObject = () => {
    setSelectedObjectId(null);
    setName(BESTIARY[spriteType].name);
    setClue(DEFAULT_CLUE);
    setError('Đã giấu xong. Chọn vật khác rồi bấm "Thêm vật" để giấu tiếp.');
  };
  const editing = objects.find((object) => object.id === selectedObjectId);

  /* ---- Placing objects: tap or drag on the painting ---- */

  // Where the painting is in the window, as shown (the dialog may be scaled down): measured as a
  // drag starts, so pointer positions map onto the spread whatever the layout
  const previewRef = useRef<View>(null);
  const previewRect = useRef({ x: 0, y: 0, width: 1, height: 1 });
  const dragging = useRef<string | null>(null);
  const spreadAt = (pageX: number, pageY: number) => {
    const { x, y, width, height } = previewRect.current;
    const { minX, maxX, minY, maxY } = FRIEND_AREA;
    return {
      x: Math.max(minX, Math.min(maxX, PAPER.x + ((pageX - x) / width) * PAPER.w)),
      y: Math.max(minY, Math.min(maxY, PAPER.y + ((pageY - y) / height) * PAPER.h)),
    };
  };
  const moveTo = (id: string, pageX: number, pageY: number) => {
    const at = spreadAt(pageX, pageY);
    if (!Number.isFinite(at.x) || !Number.isFinite(at.y)) return;
    setObjects((current) => current.map((object) => (object.id === id ? { ...object, ...at } : object)));
    setPublished(null);
  };
  const select = (object: FriendChallengeObject) => {
    setSelectedObjectId(object.id);
    setSpriteType(object.spriteType);
    setName(object.name);
    setClue(object.clue);
    setCamo(object.camo ?? 'ink');
    setSize(friendSizeOf(object));
  };
  const grabAt = (event: GestureResponderEvent) => {
    const { pageX, pageY } = event.nativeEvent;
    previewRef.current?.measureInWindow((x, y, width, height) => {
      if (!width || !height) return;
      previewRect.current = { x, y, width, height };
      // An object under the pointer is picked up; elsewhere, the selected one comes here
      const hit = objects.find((object) => {
        const sx = x + ((object.x - PAPER.x) / PAPER.w) * width;
        const sy = y + ((object.y - PAPER.y) / PAPER.h) * height;
        return Math.hypot(sx - pageX, sy - pageY) <= MARKER_GRAB;
      });
      if (hit) select(hit);
      const id = hit?.id ?? selectedObjectId;
      if (!id) {
        setError('Hãy thêm một vật (hoặc chọn vật trong danh sách) rồi chạm vào tranh để giấu.');
        return;
      }
      dragging.current = id;
      if (!hit) moveTo(id, pageX, pageY);
      setError('');
    });
  };

  const publish = async () => {
    if (!signedIn) {
      setError('Đăng nhập để xuất bản thử thách lên máy chủ.');
      return;
    }
    if (!selectedPage || !pageLocation) {
      setError('Hãy chọn trang đã chơi.');
      return;
    }
    if (!title.trim() || title.trim().length > 80) {
      setError('Tên thử thách cần có từ 1 đến 80 ký tự.');
      return;
    }
    if (objects.length === 0) {
      setError('Hãy thêm và đặt ít nhất một vật vào tranh.');
      return;
    }
    if (objects.some((object) => !object.name.trim() || !object.clue.trim())) {
      setError('Mỗi vật cần có tên và lời gợi ý.');
      return;
    }

    setBusy(true);
    setError('');
    try {
      // The same draft sent again (a retry after a timeout) keeps its request id: never two challenges
      const draft = JSON.stringify([selectedPage.id, title.trim(), objects]);
      if (request.current?.draft !== draft) request.current = { draft, id: newRequestId() };
      const code = await publishFriendChallenge(request.current.id, selectedPage.id, title.trim(), objects);
      setPublished({ code, text: friendChallengeMessage(code, selectedPage.title, objects.length, playerName) });
    } catch {
      setError('Chưa thể xuất bản. Hãy đăng nhập, chơi trang này trên tài khoản của bạn rồi thử lại.');
    } finally {
      setBusy(false);
    }
  };

  const headerWithHelp = (
    <View>
      {header}
      <Text style={styles.help}>Chọn trang đã chơi, thêm vật bất kỳ và chạm vào tranh để giấu vật.</Text>
    </View>
  );

  return (
    <ModalShell
      maxWidth={680}
      zIndex={360}
      backdrop="rgba(28, 24, 20, 0.74)"
      onBackdropPress={onClose}
      header={headerWithHelp}
      scroll
      contentStyle={styles.content}
      footer={(
        <View style={styles.footer}>
          {published && (
            <View style={styles.published}>
              <Text style={styles.code} selectable accessibilityLabel={`Mã thử thách ${published.code}`}>{published.code}</Text>
              <SecondaryButton label="Gửi mã" icon={<Share2 size={16} color={colors.earth} />} disabled={share.busy} onPress={() => share.shareMessage(published.text)} />
            </View>
          )}
          {share.note && <ShareNote note={share.note} />}
          {!signedIn && <SecondaryButton label="Đăng nhập để xuất bản" onPress={onSignIn} />}
          <PrimaryButton
            label={busy ? 'Đang xuất bản…' : published ? 'Tạo mã khác' : 'Xuất bản thử thách'}
            disabled={busy || !signedIn}
            onPress={() => void publish()}
          />
          {!!error && <Text style={styles.error} accessibilityRole="alert">{error}</Text>}
        </View>
      )}
    >
      {pages.length === 0 ? (
        <Text style={styles.empty}>Hãy chơi một trang trong cuốn sổ trước khi tạo thử thách.</Text>
      ) : (
        <>
          <Text style={styles.label}>TRANG ĐỂ GIẤU VẬT</Text>
          <ScrollStrip label="Danh sách trang" contentContainerStyle={styles.pages}>
            {pages.map((page) => {
              const at = placeOf(page.id)!;
              const active = selectedPageId === page.id;
              return (
                <Pressable key={page.id} onPress={() => { setSelectedPageId(page.id); setObjects([]); setSelectedObjectId(null); setPublished(null); setError(''); }} accessibilityRole="radio" accessibilityState={{ checked: active }} accessibilityLabel={`${at.ref.country.name}, ${page.title}${page.isNight ? ', đêm' : ''}`} style={[styles.page, active && styles.selectedPage]}>
                  <BookThumb scene={page} width={100} />
                  <View style={styles.pageCaption}>
                    {page.isNight && <Moon size={11} color={colors.earth} />}
                    <Text style={styles.pageName} numberOfLines={1}>{page.title}</Text>
                    {active && <Check size={13} color={colors.emerald} />}
                  </View>
                </Pressable>
              );
            })}
          </ScrollStrip>

          <Text style={styles.label}>TÊN THỬ THÁCH</Text>
          <TextInput value={title} onChangeText={(value) => { setTitle(value); setPublished(null); }} maxLength={80} placeholder="Tên thử thách" style={styles.input} accessibilityLabel="Tên thử thách" />

          <Text style={styles.label} numberOfLines={1}>{editing ? `ĐANG SỬA: ${editing.name.toUpperCase()}` : 'CHỌN VẬT ĐỂ GIẤU'}</Text>
          <ScrollStrip label="Danh sách vật" contentContainerStyle={styles.sprites}>
            {SPRITES.map((type) => (
                <Pressable key={type} onPress={() => updateSprite(type)} accessibilityRole="button" accessibilityLabel={BESTIARY[type].name} accessibilityState={{ selected: spriteType === type }} style={[styles.spriteChoice, spriteType === type && styles.selectedSprite]}>
                <SpriteIcon type={type} size={30} />
              </Pressable>
            ))}
          </ScrollStrip>
          <View style={styles.fields}>
            <TextInput value={name} onChangeText={updateName} maxLength={80} placeholder="Tên vật" style={[styles.input, styles.flex]} accessibilityLabel="Tên vật cần tìm" />
            <TextInput value={clue} onChangeText={updateClue} maxLength={160} placeholder="Gợi ý cho người chơi" style={[styles.input, styles.flex]} accessibilityLabel="Gợi ý tìm vật" />
            {editing ? (
              <SecondaryButton label="Xong" accessibilityLabel={`Xong vật ${editing.name}, để thêm vật khác`} icon={<Check size={16} color={colors.earth} />} onPress={finishObject} style={[styles.addButton, accentControl]} />
            ) : (
              <SecondaryButton label="Thêm vật" icon={<Plus size={16} color={colors.earth} />} onPress={addObject} disabled={objects.length >= 20} style={styles.addButton} />
            )}
          </View>
          <View style={styles.camoRow}>
            <Text style={styles.fieldLabel}>Cách giấu:</Text>
            {CAMOUFLAGE.map((item) => (
              <Pressable key={item.value} onPress={() => updateCamo(item.value)} accessibilityRole="radio" accessibilityState={{ checked: camo === item.value }} style={[styles.camo, camo === item.value && styles.selectedCamo]}>
                <Text style={[styles.camoText, camo === item.value && styles.selectedCamoText]}>{item.label}</Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.camoRow}>
            <Text style={styles.fieldLabel}>Cỡ vật:</Text>
            {SIZES.map((item) => (
              <Pressable key={item.value} onPress={() => updateSize(item.value)} accessibilityRole="radio" accessibilityLabel={`Cỡ ${item.label}`} accessibilityState={{ checked: size === item.value }} style={[styles.camo, size === item.value && styles.selectedCamo]}>
                <Text style={[styles.camoText, size === item.value && styles.selectedCamoText]}>{item.label}</Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.previewHeader}>
            <Text style={styles.label}>CHẠM HOẶC KÉO TRÊN TRANH ĐỂ GIẤU VẬT</Text>
            <Text style={styles.counter}>{objects.length}/20</Text>
          </View>
          {selectedPage && (
            <View
              ref={previewRef}
              style={[styles.preview, { width: previewWidth, height: previewHeight }]}
              accessibilityLabel="Tranh để giấu vật: chạm hoặc kéo để đặt vật đang chọn"
              onStartShouldSetResponder={() => true}
              onMoveShouldSetResponder={() => true}
              // The dialog's scroll must not take the drag over
              onResponderTerminationRequest={() => false}
              onResponderGrant={grabAt}
              onResponderMove={(e) => {
                if (dragging.current) moveTo(dragging.current, e.nativeEvent.pageX, e.nativeEvent.pageY);
              }}
              onResponderRelease={() => { dragging.current = null; }}
              onResponderTerminate={() => { dragging.current = null; }}
            >
              <BookThumb scene={selectedPage} width={previewWidth} />
              {objects.map((object) => {
                // The marker grows with the object's size (FRIEND_SIZES), so sizes compare on the painting
                const grow = (object.scale ?? FRIEND_SIZES.medium.scale) / FRIEND_SIZES.medium.scale;
                const d = Math.round(MARKER * grow);
                return (
                <View key={object.id} pointerEvents="none" style={[
                  styles.marker,
                  { left: `${((object.x - PAPER.x) / PAPER.w) * 100}%`, top: `${((object.y - PAPER.y) / PAPER.h) * 100}%` },
                  { width: d, height: d, marginLeft: -d / 2, marginTop: -d / 2, borderRadius: d / 2 },
                  selectedObjectId === object.id && styles.activeMarker,
                ]}>
                  <SpriteIcon type={object.spriteType} size={Math.round(d * 0.8)} />
                </View>
                );
              })}
            </View>
          )}

          <View style={styles.objectList}>
            {objects.map((object) => (
              <Pressable key={object.id} onPress={() => { select(object); setError('Chạm hoặc kéo trên tranh để đổi chỗ vật đang chọn.'); }} accessibilityRole="radio" accessibilityState={{ checked: selectedObjectId === object.id }} style={[styles.objectRow, selectedObjectId === object.id && styles.selectedObject]}>
                <SpriteIcon type={object.spriteType} size={26} />
                <Text style={styles.objectName} numberOfLines={1}>{object.name}</Text>
                <Text style={styles.objectPosition}>{Math.round(object.x * 100)}%, {Math.round(object.y * 100)}%</Text>
                <Pressable onPress={() => { setObjects((items) => items.filter((item) => item.id !== object.id)); if (selectedObjectId === object.id) setSelectedObjectId(null); setPublished(null); }} accessibilityRole="button" accessibilityLabel={`Xóa vật ${object.name}`} hitSlop={8} style={styles.delete}>
                  <Trash size={16} color={colors.crimson} />
                </Pressable>
              </Pressable>
            ))}
          </View>
        </>
      )}
    </ModalShell>
  );
};

const styles = StyleSheet.create({
  content: { paddingTop: 5, paddingBottom: 8, gap: 7 },
  help: { alignSelf: 'stretch', marginHorizontal: 22, marginBottom: 8, color: colors.inkSoft, fontSize: 12, textAlign: 'center' },
  label: { color: colors.earth, fontSize: 10, fontWeight: '800', letterSpacing: 1.1 },
  pages: { gap: 7, paddingVertical: 2, paddingHorizontal: 34 },
  page: { width: 112, padding: 4, borderRadius: 8, borderWidth: 1, borderColor: colors.hairline, backgroundColor: '#fff' },
  selectedPage: { borderColor: colors.emerald, backgroundColor: 'rgba(45, 122, 79, 0.08)' },
  pageCaption: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 3 },
  pageName: { flex: 1, color: colors.ink, fontSize: 10, fontWeight: '700' },
  input: { minHeight: 38, paddingHorizontal: 10, borderWidth: 1, borderColor: colors.hairline, borderRadius: 7, backgroundColor: '#fff', color: colors.ink, fontFamily: fonts.body, fontSize: 12 },
  sprites: { gap: 5, paddingVertical: 2, paddingHorizontal: 34 },
  spriteChoice: { width: 40, height: 38, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.hairline, borderRadius: 7, backgroundColor: '#fff' },
  selectedSprite: { borderColor: colors.earth, backgroundColor: '#f4eadb' },
  fields: { alignSelf: 'stretch', flexDirection: 'row', alignItems: 'center', gap: 6 },
  flex: { flex: 1, minWidth: 100 },
  addButton: { flex: 0, flexShrink: 0, minWidth: 112, minHeight: 38 },
  camoRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 5 },
  fieldLabel: { color: colors.inkSoft, fontSize: 11 },
  camo: { paddingHorizontal: 8, paddingVertical: 5, borderWidth: 1, borderColor: colors.hairline, borderRadius: 20 },
  selectedCamo: { borderColor: colors.earth, backgroundColor: '#f4eadb' },
  camoText: { color: colors.inkSoft, fontSize: 10 },
  selectedCamoText: { color: colors.earth, fontWeight: '700' },
  previewHeader: { alignSelf: 'stretch', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 },
  counter: { color: colors.inkSoft, fontSize: 11 },
  preview: { alignSelf: 'center', overflow: 'hidden', borderWidth: 1, borderColor: colors.hairline, borderRadius: 6 },
  marker: { position: 'absolute', width: 30, height: 30, marginLeft: -15, marginTop: -15, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.9)', borderRadius: 15, backgroundColor: 'rgba(44,36,27,0.55)' },
  activeMarker: { borderColor: colors.gold, borderWidth: 2, backgroundColor: 'rgba(160,107,71,0.85)' },
  objectList: { gap: 3 },
  objectRow: { minHeight: 36, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 7, borderWidth: 1, borderColor: 'transparent', borderRadius: 7 },
  selectedObject: { borderColor: colors.emerald, backgroundColor: 'rgba(45, 122, 79, 0.07)' },
  objectName: { flex: 1, color: colors.ink, fontSize: 12, fontWeight: '600' },
  objectPosition: { color: colors.inkSoft, fontSize: 10 },
  delete: { padding: 4 },
  footer: { gap: 6 },
  published: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  code: { color: colors.earth, fontFamily: fonts.displayBold, fontSize: 19, letterSpacing: 1 },
  error: { color: colors.crimson, fontSize: 11, textAlign: 'center' },
  empty: { alignSelf: 'stretch', padding: 16, color: colors.inkSoft, fontSize: 13, textAlign: 'center' },
});
