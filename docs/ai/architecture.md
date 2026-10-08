# Kiến trúc chi tiết — file nào làm gì

> Một phần của bộ quy định cho AI và người phát triển. Bắt đầu từ `AGENTS.md` ở gốc repo.

Đường dẫn tính từ `app/` (trừ `tools/`). Ghi theo trạng thái code ở nhánh `react-native` (10/2026). Nếu code đã khác
thì tin code, rồi sửa file này.

## Mục lục
1. Hệ tọa độ và hằng số
2. Từng file theo tầng
3. Luồng: mở game và trang chủ; một lần chạm
4. Luồng: lật trang
5. Luồng: chuẩn bị trang và cache
6. Luồng: sprite và âm thanh (tools → generated)
7. Responsive

---

## 1. Hệ tọa độ và hằng số

| Thứ | Giá trị | Ở đâu |
|---|---|---|
| Tọa độ trong JSON | chuẩn hóa 0–1 trên **cả ảnh 1760 × 1240** (tính cả lề trong suốt) | `HiddenObject.x/y`, `occluder`, `roam.path`, `nightLights` |
| `radius` của vật | phần của **bề ngang** trang; khoảng cách đo theo tỉ lệ `ASPECT = 1760/1240` | `core/detection.ts` |
| Page units | pixel của tranh 1760 × 1240: `PAGE_W`, `PAGE_H` | `board/constants.ts` |
| Màn hình | `screen = page * s + t` (`s`, `tx`, `ty` là shared value) | `board/useCamera.ts` |
| Kích thước sprite | `SPRITE_BASE_WIDTH (0.044) * scale * PAGE_W`; view box của sprite 48 × 48 | `core/model.ts`, `board/constants.ts` |
| Khung giấy mẫu | `TEMPLATE_PAPER = 1584 × 700` page units (giấy ở x 88–1672, y 270–969) | `board/useCamera.ts` |
| Zoom | `MIN_ZOOM 1` → `MAX_ZOOM 4`, nút bấm mỗi lần 0.1× | `board/constants.ts`, `Board.tsx` |
| Kính lúp | phóng `LOUPE_ZOOM 2.4`; đường kính `clamp(110, 0.42·min(w,h), 220)` | `constants.ts`, `useCamera.ts` |
| Lật trang | `PAGE_TURN_MS = 900`; tờ giấy hạ xuống sau `PAGE_TURN_MS - 80` | `core/model.ts`, `usePageTurn.ts` |
| Combo | `COMBO_WINDOW = 6` giây | `core/caseFile.ts` |
| Kính mờ | 4 lần sai trong 3000 ms → mờ 3000 ms | `game/useCase.ts` (`FOG_*`) |
| Thông báo bay | 1.2 s (điểm) / 1.8 s (thông tin) | `game/useNotices.ts` |
| Sinh vật nhút nhát | bắt được khi pha nằm trong 0.035–0.455 của chu kỳ | `core/motion.ts` |

**Luật điểm** (`core/scoring.ts`): tìm thấy = `score × combo + (combo − 1) × 50`; combo bắt đầu ×1, tăng sau mỗi lần
tìm thấy, về ×1 khi soi sai hoặc để quá 6 s. Soi sai −20. Gợi ý −50 / −100 / −150 (cấp 1/2/3). Điểm không xuống dưới 0.
Phá án: thưởng `floor(giây còn lại × 4)`. **3 sao** khi sai ≤ 2, gợi ý ≤ 1 và còn > 60 s; **2 sao** khi sai ≤ 5 và gợi
ý ≤ 2; còn lại 1 sao.

**Gợi ý** (`core/hints.ts`): nhắm vào vật chính đầu tiên chưa tìm **theo thứ tự trong mảng `objects`**, hết vật chính
thì tới bí mật. **Không bao giờ gợi ý vật bonus.** Cấp 1: nhắc lại `clue`; cấp 2: kính lúp nhích về phía vật; cấp 3:
radar, camera tự lướt tới nếu vật đang khuất màn hình.

**Phá án** khi mọi vật chính (`isMainObject`: không `isSecret`, không `isBonus`) đã được tìm. Phá án xong có thể bấm
"Soi Tiếp" (`isExploring`) để tìm nốt bonus và bí mật: không điểm, không đồng hồ, vẫn ghi vào Sổ Tay. Phá án trang ngày
lần đầu thì mở khóa trang đêm của nó (`PageIndex`: nút đêm bị khóa tới khi `stars > 0`).

## 2. Từng file theo tầng

### core/ — thuần TypeScript, không import package
| File | Export chính | Ghi chú |
|---|---|---|
| `model.ts` | `SpriteType`, `CamoStyle`, `ShyBehavior`, `RoamBehavior`, `HiddenObject`, `isMainObject`, `SPRITE_BASE_WIDTH`, `NightLight`, `Page`, `PageSlot`, `Chapter`, `Country`, `PageRef`, `PAGE_TURN_MS`, `PageTurn`, `ActiveHint`, `CaseState`, `PageResult`, `GameProgress` | **Từ điển của cả game.** Thêm kiểu mới ở đây. |
| `caseFile.ts` | `COMBO_WINDOW`, `openCase`, `clockTick`, `recordFind` → `FindResult {changes, earned, combo, solved}`, `recordExploreFind`, `recordMiss`, `recordHint`, `leftovers` | Hàm thuần `CaseState → CaseState`. `recordFind` trả về `changes` để **merge** (đồng hồ vẫn chạy song song). |
| `detection.ts` | `detectObject(nx, ny, objects, foundIds, now?)` → `{hit, object, distance, position, hidingObject}` | Vùng chạm chồng nhau thì vật gần nhất thắng; vật nhút nhát đang trốn trả về `hidingObject` (không tính là sai). |
| `scoring.ts` | `foundScore`, `mistakePenalty`, `hintPenalty`, `completionBonus` | Số liệu ở mục 1. |
| `hints.ts` | `nextHint(currentHintLevel, objects, foundIds, currentLoupePos)` → `HintResult` | |
| `motion.ts` | `motionNow`, `shyPhase`, `isShyVisible`, `roamState`, `objectPosition` | **Worklet**, chạy cả JS thread (bắt vật) lẫn UI thread (vẽ) trên cùng một đồng hồ, nên vật chỉ bắt được đúng nơi, đúng lúc nó được vẽ. |
| `progress.ts` | `SCHEMA_VERSION` (=2), `readProgress(raw)`, `progress.{recordVictory, pageResult, recordDiscovery, discovered, recordVisit, lastPage, totalScore}` | `lastPageId` (tùy chọn) là trang người chơi đang ở, cho nút "Chơi Tiếp". Lưu JSON trong localStorage (app: SQLite qua `expo-sqlite/localStorage/install` trong `index.ts`). Bản lưu được giữ trong bộ nhớ (`copy`), module này là nơi duy nhất ghi. `readProgress` đọc an toàn mọi phiên bản và **giữ lại trường lạ**. |

### content/ — chỉ dữ liệu
| File | Export | Ghi chú |
|---|---|---|
| `index.ts` | `COUNTRIES`, `FIRST_COUNTRY` (=`COUNTRIES[0]`), `countryById`, `pagesOf(country)` → `PageRef[]`, `pageRefOf(page)`, `artOf(page)` → asset `require`, `artIdOf(page)` → `"<country>/<art>"`, `allPages()` (mọi trang ngày rồi tới mọi trang đêm), `placeOf(pageId)` → `{ref, night}` hoặc `null` | Khi load sẽ **throw** nếu id trang bị trùng hoặc `art` không có trong bảng `art` của nước. |
| `countries/<nước>/index.ts` | `const <nước>: Country` | Chương, prologue, `pages: [{ day }, { day, night }]`, bảng `art`. Ép kiểu JSON bằng `const page = (json: unknown) => json as Page`. |
| `countries/<nước>/chapter-N/*.json` | — | Một trang mỗi file (định dạng: add-country.md). |
| `bestiary.ts` | `BESTIARY: Record<Exclude<SpriteType,'seal'>, {name, kind, fact}>`, `isCreature(type)` | Sổ Tay Sinh Vật. TypeScript **bắt buộc** mỗi `SpriteType` có một mục. |

### game/ — một lượt chơi (hooks)
| File | Vai trò |
|---|---|
| `useGame.ts` | `useGame({browsing})` = `nav` + `case` + `notices` + bật/tắt âm + `home`/`setHome` (trang chủ đang mở; mở sẵn khi vào game). Đồng hồ dừng khi chờ/lật trang hoặc có trang chủ, prologue, intro đêm, Mục Lục hay Sổ Tay. Rời trang chủ thì ghi trang đang ở (`progress.recordVisit`). Kiểu trả về: `Game`. |
| `useNavigation.ts` | Mở sẵn ở trang người chơi đang dở (`progress.lastPage()` + `placeOf`); người chơi mới bắt đầu ở trang 1 với prologue, người chơi cũ thì không. Nước, chỉ số trang, ngày/đêm, `visit` (tăng mỗi lần mở trang, kể cả chơi lại), `turn`, `next/prev/goTo/replay`, `showPrologue`, `showNightIntro`. Từ trang đêm bấm "sau" sẽ sang trang ngày kế; bấm "trước" về trang ngày của chính nó. Prologue mở lại khi `next()` sang chương mới hoặc `goTo` sang nước khác. Ở trang cuối, `next()` quay về trang 1 (không lật). |
| `useCase.ts` | Vụ án của trang: `inspect`, `requestHint`, `togglePause`, `explore`, `isFogged`, `screenShake`, `unlockedNight`. Khi `visit` đổi thì reset vụ án **ngay trong lần render đó** (không lộ trạng thái cũ). Đây là nơi gọi `sound`, `notify`, `progress`. |
| `useNotices.ts` | `notify(text, at, 'score' \| 'info')`. |

### board/ — cuốn sổ (Skia)
| File | Vai trò |
|---|---|
| `Board.tsx` | Ghép các hook theo **đúng thứ tự**: `useSceneLibrary → useCamera → useCaseMarks → usePageTurn → usePagesAround → useWarmUp`; `useDerivedValue` gọi `renderFrame`, đưa picture thẳng vào Canvas và giải phóng đầu ra cũ. Dừng clock/cử chỉ khi bị che hoặc chờ đích (trừ warm-up/lật đang chạy); nút zoom. |
| `constants.ts` | `PAGE_W/H`, `PX` (page units cho mỗi px CSS của bản web gốc rộng 960 px), `LOUPE_ZOOM`, `spriteSize`, `MIN/MAX_ZOOM`. |
| `anim.ts` | Easing và đường cong hoạt ảnh (worklet): `track`, `loop`, `alternate`, `shyPeek`, `shyJump`, `foundBounce`, `bloom`, `blinkScale`… |
| `useCamera.ts` | Shared value `s, tx, ty, lx, ly, dims`; `bounds`, `centre`, `placeLoupe`, `zoomTo`, `markZoomed`; `fittedScale`, `loupeDiameter`. Camera ôm khung giấy chứ không ôm cả ảnh. |
| `useBoardGestures.ts` | Cử chỉ native: kéo kính lúp (tròng hoặc cán), thả là soi; chạm để soi; kéo trang, chụm để zoom, lăn chuột (web); kéo sát mép thì trang tự cuộn. Chạm ra mặt bàn không tính là soi. |
| `useCaseMarks.ts` | Đẩy trạng thái vụ án sang UI thread: `found` (thời điểm + vị trí, để vật "nở" màu), `radar`, `fogStart`, `nudge`. |
| `usePageTurn.ts` | Vòng đời một lần lật trang (mục 4). |
| `usePagesAround.ts` | Ưu tiên dựng đích chưa có cache trước khi hoạt ảnh bắt đầu; thử lại khi ảnh tới. Dựng trang lân cận mỗi lần một trang, 120 ms sau khi ổn định, **không trong hoạt ảnh lật**. Trả về ảnh để giữ "ấm" trên GPU. |
| `useSceneLibrary.ts` | Cache cấp module: `images` (tranh đã giải mã, tối đa `MAX_IMAGES = 5`), `analyses` (theo id trang); cache `scenes` theo (loupe, compact, density). API: `prepare`, `keepArt`, `useKeepArt`… |
| `useWarmUp.ts` | Mỗi loại trang (ngày, đêm) một lần, khi hộp thoại đang phủ: vẽ ẩn các khung "lần đầu" (tìm thấy, radar, mờ kính, lật trang) để GPU biên dịch shader trước. |
| `scene/buildScene.ts` | Dựng `SceneData` một lần trên JS thread: sprite ở mọi biến thể ngụy trang, occluder, waterline, đêm (đèn, sao, trăng), sprite sheet. |
| `scene/disposeScene.ts` | Giải phóng atlas, waterline, occluder, trăng và shader đèn của scene đã thôi dùng; tài nguyên dùng chung có chủ sở hữu riêng. |
| `scene/snapshotPage.ts` | Chụp trang thành picture chứa một ảnh tạm, tối đa 2048 px mỗi chiều, trước khi lật/warm-up; dùng lại một surface GPU, chuyển snapshot sang pixel để vẽ qua context của Canvas. GPU không sẵn sàng thì giữ picture gốc. |
| `scene/analyze.ts` | Đọc pixel tranh (thu nhỏ còn rộng 880): màu tắc kè hoa quanh từng vật `chameleon`; khung sổ = bounding box các pixel đục (alpha ≥ 128). |
| `scene/paints.ts` | Mọi `SkPaint` và shader, tạo **một lần** (dịch từ CSS bản web gốc). Renderer chỉ đổi alpha. |
| `scene/spriteParts.ts`, `spriteArt.ts` | Biến `SPRITE_ART` (sinh tự động) thành các phần vẽ được; cờ hoạt ảnh `ANIM_BLINK/WING/TAIL/WAVE/GLOW_SPOT`. |
| `scene/spriteAtlas.ts` | Sprite đứng yên được vẽ sẵn vào một sheet (tối đa 2048 px); `atlasDensity`. |
| `scene/loupeBody.ts` | Hình kính lúp đồng / đèn pin. |
| `render/*.ts` | **Worklet, UI thread.** `frame.ts` (thứ tự lớp: ảnh warm → bóng → sách → radar/dấu mộc → kính lúp), `book.ts` (tranh, sprite ngụy trang, occluder, đêm, cắt bỏ thứ ngoài khung nhìn), `sprites.ts` (tư thế từng vật trong khung này), `marks.ts`, `pageTurn.ts`, `loupe.ts`, `types.ts` (`SceneData`, `FrameState`, `CAMO_*`, `FOUND_FADE_MS`). |

### screens/
| File | Vai trò |
|---|---|
| `GameScreen.tsx` | Màn hình duy nhất. Tính `preload` (trang sau, trang trước, trang kế của đích đang lật), `boardActive`, `playing`; quyết định hộp thoại nào hiện (prologue, Tạm Dừng, Thắng, Hết Giờ chỉ hiện khi đã rời trang chủ). Layout HUD: `height < 500` → `'phoneLandscape'`, `width < 700` → `'phone'`, còn lại `'wide'`. |
| `home/HomeScreen.tsx` | **Trang chủ**, lớp phủ zIndex 180 (trên HUD, dưới mọi hộp thoại): Chơi Tiếp / Bắt Đầu Điều Tra, thẻ từng cuốn sổ (mở ở trang chưa xong đầu tiên), Mục Lục, Sổ Tay, âm thanh, tổng điểm. Ngang ≥ 600 px: 2 cột; hẹp hơn: 1 cột cuộn. Số liệu trong `home/summary.ts` (`bookSummary`, `albumProgress`). |
| `BookThumb.tsx` | Ảnh thu nhỏ một trang (cắt đúng khung giấy, 16:9), dùng ở Mục Lục và trang chủ. |
| `Desk.tsx` | Mặt bàn: `paper-wash.jpg` và tán lá `botany-*.webp` (chỉ khi `width > 800`). |
| `useDeviceBehaviour.ts` | Giữ màn hình sáng, ẩn thanh điều hướng Android, rời app thì tạm dừng, nút Back Android. |
| `hud/HUD.tsx` | Thanh trên: điểm, đồng hồ, combo, chuyển trang, các nút (gợi ý, tạm dừng, âm thanh, Mục Lục, Sổ Tay), `ExploreStatus`. |
| `hud/QuestPanel.tsx` | Thẻ manh mối: **hình bóng** của vật chính + nhãn kiểu ngụy trang. |
| `hud/FloatingScores.tsx` | Điểm và thông báo bay lên từ chỗ chạm. |
| `dialogs/*` | `StoryPrologue` (prologue chương / intro trang đêm), `PauseMenu`, `VictoryScreen`, `TimeUpScreen`, `PageIndex` (Mục Lục; có tab nước khi `COUNTRIES.length > 1`), `CreatureAlbum` (Sổ Tay), `RotatePrompt` (web, điện thoại cầm dọc). |

### platform/
| File | Vai trò |
|---|---|
| `sound.d.ts` | Hợp đồng `GameSound`: `playFound/Wrong/Hint/PageTurn/Voice/Fog/Creature/Rustle/Victory`, `prepareVoices`, `setSoundEnabled`. |
| `sound.web.ts` | Web: synth chạy trực tiếp + rung. Mở AudioContext ở lần chạm đầu. |
| `sound.native.ts` | iOS/Android: phát WAV đã sinh (`generated/sounds.ts`), mỗi âm 2 player; + rung. |
| `synth/synth.ts`, `synth/voices.ts` | Bộ tổng hợp Web Audio: **nguồn gốc của mọi âm thanh**. `VOICE_OF: SpriteType → tên giọng`. |
| `haptics.ts` | Rung theo từng sự kiện, kiểu fire-and-forget. |
| `sceneImage.ts` / `.web.ts` | Giải mã tranh ngoài luồng vẽ (native: JS thread + `makeNonTextureImage`; web: `createImageBitmap` rồi copy pixel qua canvas 2D, tránh lazy texture không vẽ được trên surface CPU), `readPixels` để phân tích. |

### ui/
`theme.ts` (`colors`, `fonts`, `gradients`, `shadow`), `ModalShell.tsx` (nền mờ + thẻ giấy; tự thu nhỏ tối thiểu 0.75×;
`scroll` chỉ cho danh sách dài; `footer` ghim nút chính), `Buttons.tsx` (`PrimaryButton`, `SecondaryButton`,
`RoundIconButton`), `SpriteIcon.tsx` (SVG tĩnh từ `SPRITE_SVG`), `icons.ts` (Lucide, mỗi icon một import),
`layout.ts` (`useCompact`: cao < 680; `useShortLandscape`: ngang và cao < 560), `format.ts` (`formatNumber` "12.345",
`formatClock` "03:45", `formatDuration`), `useStableCallback.ts`.

### tools/ (gốc repo)
`generate-assets.mjs` (sprite + âm thanh), `generate-icons.mjs`, `check-architecture.mjs`, `test-screens.mjs`
(Playwright, 13 viewport, danh sách `DIALOGS`), `benchmark-render.cjs`, `benchmark-page-turn.cjs`, `sprites/`
(`ObjectSprite.tsx` và `sprites.css` là **nguồn** của mọi hình vẽ).

### test/ (app/test, Jest)
`rules.test.ts` (điểm, phát hiện, chuyển động, gợi ý, hồ sơ vụ án), `progress.test.ts` (đọc/ghi/nâng cấp bản lưu),
`content.test.ts` (soát **mọi trang**: tọa độ trong 0–1, `0 < radius < 0.2`, sprite có art và mục Sổ Tay, `roam` ≥ 2
điểm, `occluder` ≥ 3 điểm, `0 < waterline < 1`, ≤ 1 bí mật, có ít nhất một vật chính, id vật không trùng trong trang,
trang đêm dùng chung `art` với trang ngày), `session.test.tsx` (chờ đích, hủy completion cũ, dựng lại khi ảnh tới),
`sound.test.ts` (âm thanh native lỗi không ngắt game), `screens/Gallery.tsx` (mọi hộp thoại với nội dung dài nhất, cho
`test:screens`).

## 3. Luồng: mở game và trang chủ

```
App → GameScreen → useGame: home = true; useNavigation mở ở progress.lastPage() (hoặc trang 1 Singapore)
→ HomeScreen phủ lên; cuốn sổ bên dưới giải mã, dựng sẵn và warm-up GPU (Board active = false)
   ├─ Chơi Tiếp / Bắt Đầu Điều Tra → setHome(false); người chơi mới thấy prologue chương 1
   ├─ thẻ cuốn sổ → nav.goTo(trang chưa xong đầu tiên, nước đó) + setHome(false); đổi nước thì có prologue
   └─ Mục Lục / Sổ Tay → mở đè lên trang chủ; chọn trang trong Mục Lục cũng đóng trang chủ
Menu Tạm Dừng → "Về Màn Hình Chính" → bỏ tạm dừng + setHome(true): đồng hồ dừng, Chơi Tiếp quay lại đúng vụ án đó
```

## 3b. Luồng: một lần chạm

```
useBoardGestures (UI thread) → onInspect(nx, ny, screenPos)        // GameScreen bọc bằng useStableCallback
→ useCase.inspect: bỏ qua khi tạm dừng / hết giờ / đang lật; kính đang mờ → chỉ thông báo
→ detectObject(nx, ny, page.objects, foundItems)
   ├─ trúng   → sound.playFound + playVoice, progress.recordDiscovery, recordFind → notify("+điểm")
   │            phá án → playVictory, progress.recordVictory(...), mở khóa trang đêm
   ├─ đang trốn → playRustle + thông báo (không phạt)
   └─ trượt   → recordMiss, rung màn hình; 4 lần trong 3 s → kính mờ
→ state.foundItems → Board → useCaseMarks → shared value `found` → renderFrame cho vật nở màu
```

## 4. Luồng: lật trang

`nav.next/prev/goTo` → `turnTo`: giữ một yêu cầu `setTurn({to, direction})` + âm lật trang. Nếu đích chưa có cache,
`usePagesAround` tải/dựng đích, giữ trang cũ đứng yên. `usePageTurn` chỉ đọc `preparedScene`, ghi nguồn và đích thành
`SkPicture` chứa ảnh raster tạm qua `scene/snapshotPage`, rồi mới bắt đầu hoạt ảnh 900 ms.
`render/pageTurn.ts` vẽ tờ giấy quay quanh gáy sổ thành 7 dải phối cảnh,
camera lướt về giữa. Khi hết 900 ms, Board gọi `nav.completeTurn(request)` → `open()` tăng `visit`, mở vụ án mới;
yêu cầu đã bị hủy/chơi lại thì bị bỏ qua. Giữ khung cuối tới khi game mở trang mới. Trong lúc chờ/lật: dừng đồng hồ
vụ án, tắt cử chỉ và nút zoom, ẩn Victory/TimeUp. Timer thuộc Board và được hủy trong cleanup.

Board đưa picture đã ghi thẳng vào picture-view API của Canvas, không qua lớp `<Picture>` ghi bao ngoài. Picture
đầu ra được thay và giải phóng bằng buffer ổn định. `useSceneLibrary.releaseUnused` giải phóng tài nguyên bị loại
khỏi cache sau khi mapper cập nhật, bảo vệ scene nguồn/đích và ảnh warm. `scene/disposeScene.ts` chỉ giải phóng
atlas, waterline, occluder và tài nguyên đêm thuộc trang; sprite parts, tranh, paints dùng chung có chủ riêng.

## 5. Luồng: chuẩn bị trang và cache

`GameScreen.preload` = [trang ngày kế, trang trước (hoặc trang ngày của trang đêm), trang kế của đích đang lật] →
`usePagesAround` → `useKeepArt` giải mã tranh (`platform/sceneImage`) → `analyzeScene` (mỗi trang một lần) →
`buildScene` (mỗi trang một lần cho mỗi bộ loupe/compact/density) → sprite sheet. Các ảnh này được vẽ thành 1 pixel vô
hình mỗi khung để luôn nằm trên GPU. Trang đêm dùng chung tranh với trang ngày nên chỉ giải mã một lần (`artIdOf`).

## 6. Luồng: sprite và âm thanh

```
tools/sprites/ObjectSprite.tsx (SVG React, 48×48) + sprites.css
  → npm run generate (render SVG, Chromium đo màu thật của các biến thể base/chameleon/invisible/glow/glowChameleon)
  → src/generated/spriteArt.ts: SPRITE_ART (cây hình + paint; "$fill"/"$ink" = màu tắc kè hoa lấy mẫu lúc chạy)
                                SPRITE_SVG (icon tĩnh cho QuestPanel, Sổ Tay)
  → board/scene/spriteParts → buildScene → spriteAtlas

src/platform/synth (Web Audio)  → web: phát trực tiếp
  → npm run generate (OfflineAudioContext, +6 dB) → assets/sounds/*.wav + src/generated/sounds.ts (SFX, VOICES) → native
```

## 7. Responsive

- App khóa ngang; web trên điện thoại cầm dọc thì hỏi xoay (`RotatePrompt`).
- HUD: `phoneLandscape` / `phone` / `wide` (xem GameScreen). Board `compact` khi rộng < 640.
- Hộp thoại **thu nhỏ cho vừa** thay vì cuộn (`ModalShell`, tối thiểu 0.75×); chỉ Mục Lục và Sổ Tay cuộn. Màn thấp thì
  gọn lại bằng `useCompact()`; điện thoại cầm ngang thì chia 2 cột bằng `useShortLandscape()`.
- Luôn tính safe area (`useSafeAreaInsets`), vì tai thỏ nằm ở cạnh trái/phải khi cầm ngang.
