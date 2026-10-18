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
| Kích thước sprite | `SPRITE_BASE_WIDTH (0.058) * scale * PAGE_W`; view box của sprite 48 × 48 | `core/model.ts`, `board/constants.ts` |
| Khung giấy mẫu | `TEMPLATE_PAPER = 1584 × 700` page units (giấy ở x 88–1672, y 270–969) | `board/useCamera.ts` |
| Zoom | `MIN_ZOOM 1` → `MAX_ZOOM 4`, nút bấm mỗi lần 0.1× | `board/constants.ts`, `Board.tsx` |
| Kính lúp | phóng `LOUPE_ZOOM 2.4`; đường kính `clamp(110, 0.42·min(w,h), 220)` | `constants.ts`, `useCamera.ts` |
| Lật trang | `PAGE_TURN_MS = 900`; tờ giấy hạ xuống sau `PAGE_TURN_MS - 80` | `core/model.ts`, `usePageTurn.ts` |
| Combo | `COMBO_WINDOW = 6` giây | `core/caseFile.ts` |
| Nước rửa (tô màu dần) | phủ `WASH_ALPHA = 0.48`; mỗi vật tìm được rửa sạch một mảng `3.2 ×` bề ngang sprite (110–230 page units) trong `REVEAL_MS = 1100`; phá án thì tan trong `WASH_FADE_MS = 1500` | `board/render/types.ts` |
| Kính mờ | 4 lần sai trong 3000 ms → mờ 3000 ms | `game/useCase.ts` (`FOG_*`) |
| Thông báo bay | 1.2 s (điểm) / 1.8 s (thông tin) | `game/useNotices.ts` |
| Sinh vật nhút nhát | bắt được khi pha nằm trong 0.035–0.455 của chu kỳ | `core/motion.ts` |

**Luật điểm** (`core/scoring.ts`): tìm thấy = `score × combo + (combo − 1) × 50`; combo bắt đầu ×1, tăng sau mỗi lần
tìm thấy, về ×1 khi soi sai hoặc để quá 6 s. Soi sai −20. Gợi ý −50 (bước 1: đọc thẻ) / −100 (bước 2: chỉ chỗ), **chỉ cho khi điểm đủ trả** (`canAffordHint`; thiếu thì
báo cần bao nhiêu điểm, không gợi ý). Điểm không xuống dưới 0.
Phá án: thưởng `floor(giây còn lại × 4)`. **3 sao** khi sai ≤ 2, gợi ý ≤ 1 và còn > 60 s; **2 sao** khi sai ≤ 5 và gợi
ý ≤ 2; còn lại 1 sao.

**Gợi ý** (`core/hints.ts`): thẻ của vật chưa tìm ban đầu chỉ có **hình bóng**, tên và `clue` hiện `???` (trừ thẻ
câu đố: hiện `riddle`). Mỗi vật có 2 bước, ghi trong `CaseState.revealedTextIds` và `activeHint`:
**bước 1** (50 điểm) mở tên và `clue` trên thẻ; **bước 2** (100 điểm) kính lúp nhích về phía vật, radar phát xung, camera
tự lướt tới nếu vật đang khuất màn hình. Nút Gợi Ý: bước 2 cho vật vừa đọc, nếu không thì đọc thẻ kế tiếp chưa đọc (theo
thứ tự trong mảng `objects`, hết vật chính thì tới bí mật), đọc hết rồi thì chỉ chỗ. Chạm thẻ chưa đọc = bước 1 của
đúng vật đó; chạm thẻ đã đọc chỉ mở/thu thẻ, không tốn gì. **Không bao giờ gợi ý vật bonus hay mảnh manh mối**; trang
theo dấu (`order`) chỉ gợi ý vật tới lượt.

**Phá án** khi mọi vật chính (`isMainObject`: không `isSecret`, `isBonus`, `isClue`) đã được tìm. Phá án xong có thể bấm
"Soi Tiếp" (`isExploring`) để tìm nốt vật tùy chọn (`isOptionalObject`: bonus, mảnh manh mối, bí mật): không điểm, không
đồng hồ, vẫn ghi vào Sổ Tay. Phá án trang ngày
lần đầu thì mở khóa trang đêm của nó (`PageIndex`: nút đêm bị khóa tới khi `stars > 0`).

## 2. Từng file theo tầng

### core/ — thuần TypeScript, không import package
| File | Export chính | Ghi chú |
|---|---|---|
| `model.ts` | Re-export toàn bộ kiểu dữ liệu từ `storyModel.ts`, `spriteTypes.ts`, `progressModel.ts` | **Từ điển tổng hợp của cả game.** Đảm bảo tương thích hoàn toàn. |
| `spriteTypes.ts` | `SpriteType`, `CamoStyle`, `ShyBehavior`, `RoamBehavior`, `SPRITE_BASE_WIDTH` | Kiểu dữ liệu về sprite, ngụy trang và hành vi chuyển động. |
| `storyModel.ts` | `Country`, `Chapter`, `Page`, `HiddenObject`, `NightLight`, `PageSlot`, `Mystery`, `MysteryOption`, `PageRef`, `PAGE_TURN_MS`, `PageTurn`, `ActiveHint`, `CaseState` | Mô hình dữ liệu cốt truyện, trang sách và trạng thái vụ án. |
| `progressModel.ts` | `PageResult`, `GameProgress`, `GameSettings`, `DailyStamp`, `CoverSticker` | Cấu trúc dữ liệu lưu tiến độ và cài đặt người chơi. |
| `story.ts` | Helper tra cứu tiến độ cốt truyện: mở khóa, trang kế tiếp, lý do khóa | Tách từ model/content để tái sử dụng trong các màn hình và hộp thoại. |
| `leaderboard.ts` | `DEFAULT_LEADERBOARD_FILTER`, `describeFilter`, `formatRank`, `medalForRank`, `isPlausibleStoryScore`, `LeaderboardFilter`, `LeaderboardEntry`, `LeaderboardData` | Quy tắc xếp hạng, định dạng hạng và bộ lọc Bảng Xếp Hạng. |
| `caseFile.ts` | `COMBO_WINDOW`, `openCase`, `clockTick`, `recordFind` → `FindResult {changes, earned, combo, solved}`, `recordExploreFind`, `recordMiss`, `recordHint`, `leftovers` | Hàm thuần `CaseState → CaseState`. `recordFind` trả về `changes` để **merge** (đồng hồ vẫn chạy song song). |
| `detection.ts` | `detectObject(nx, ny, objects, foundIds, now?)` → `{hit, object, distance, position, hidingObject, outOfTurn}`, `nextInSequence`, `waitsInSequence` | Vùng chạm chồng nhau thì vật gần nhất thắng; vật nhút nhát đang trốn trả về `hidingObject`, vật chưa tới lượt trong trang theo dấu trả về `outOfTurn` (cả hai không tính là sai). |
| `scoring.ts` | `foundScore`, `mistakePenalty`, `hintCost`, `canAffordHint`, `hintPenalty`, `completionBonus` | Số liệu ở mục 1. |
| `hints.ts` | `nextHint(activeHint, revealedIds, objects, foundIds, loupePos, targetId?)` → `HintResult` | `targetId`: thẻ được chạm. |
| `motion.ts` | `motionNow`, `shyPhase`, `isShyVisible`, `roamState`, `objectPosition` | **Worklet**, chạy cả JS thread (bắt vật) lẫn UI thread (vẽ) trên cùng một đồng hồ, nên vật chỉ bắt được đúng nơi, đúng lúc nó được vẽ. |
| `random.ts` | `SEED_BITS` (20), `SEED_COUNT`, `hashString` (FNV-1a), `rng(seed)` (mulberry32), `draw`, `shuffled`, `localDay(date)` | Ngẫu nhiên tái lập được: cùng seed ra cùng kết quả trên mọi máy. `localDay` theo giờ máy, không theo UTC. |
| `layout.ts` | `layOutPage(page, seed)`, `hasSpots`, `layoutKey(page)` | Seed 0 là trang đúng như JSON. Vật có `spots` có thể sang chỗ khác (kèm `clue` của chỗ đó); id trang và id vật giữ nguyên. Trang đã sắp đặt có `layout` (`s<seed>`); mọi cache theo trang dùng `layoutKey`. |
| `daily.ts` | `DAILY_TIME_LIMIT` (150 s), `DAILY_MIN_FINDS`/`MAX` (3/5), `dailyPuzzle(day, pages)` → `DailyPuzzle {day, pageId, seed, focus, objectIds}`, `dailyPage(page, puzzle)`, `inFocus(page, nx, ny)`, `STAMPS_FOR_SEAL` (7), `stampsByCountry` | Trang của ngày: chọn theo ngày, giống nhau cho mọi người. Một góc 0.4 × 0.36 của trang (khung giấy), 3–5 vật chính không di chuyển, không có thứ tự. Không tính là chơi trang đó: chỉ đóng dấu hộ chiếu. |
| `mystery.ts` | `cluesOf(chapter)`, `hasMystery`, `mysteryProgress(chapter, seen)`, `canDeduce`, `isRightAnswer` | Đủ mảnh manh mối (`isClue`) của chương thì mở Bảng Suy Luận. |
| `rare.ts` | `RARE_CHANCE` (1/25 mỗi lượt), `withRareCritter(page, roll)` | Một sinh vật phụ (`isCritter`: không bao giờ là lời nhắn mực tàng hình) thành bản ánh vàng (`rare: true`, chỉ trong lượt đó, không bao giờ ghi trong JSON). `roll` do `useNavigation` tung khi mở trang (trang đầu tiên của người chơi mới thì không). Trang có sinh vật vàng mang `layout` riêng (`r<id>`). |
| `tools.ts` | `toolsOwned(chapters, isSolved)`, `chapterGiving(chapters, tool)`, `withTools(page, tools)` | Đồ nghề là phần thưởng của bí ẩn chương (`Mystery.reward`). Vật `requires` chỉ có trên trang khi người chơi có dụng cụ đó; trang thiếu dụng cụ mang `layout` `t…`, cùng một object cho mỗi bộ dụng cụ (memo WeakMap). Ba dụng cụ, mỗi cái hiện vật của mình **chỉ trong kính lúp**, mỗi cái một kiểu (`board/render/book.ts`, theo `SceneSprite.lens`): `uv-lens` (bí ẩn chương 3 Singapore; 9 lời nhắn mực tàng hình `uv-note-<n>`, sáng xanh), `prism` (bí ẩn chương 2 Thái Lan; 9 nét vẽ cầu vồng `prism-sketch-<n>`, chỉ hiện trong dải cầu vồng chéo ngang tròng kính, quầng sáng đổi màu theo thời gian), `twin-lens` (bí ẩn chương 2 Việt Nam; 10 nét vẽ tí hon `tiny-sketch-<n>`, `scale` ≤ 0.3, chỉ hiện khi phóng to tranh từ `TINY_ZOOM_FROM` 1.6× tới đủ ở `TINY_ZOOM_FULL` 2×). |
| `dayNight.ts` | `hasDayTwins(page)`, `withDayTwins(night, day)` | Trang đêm "ngày và đêm": vật có `dayTwin` nhận `dayAt` (vị trí và `clue` của vật đó ở trang ngày; chỉ trong lượt chơi, không ghi trong JSON). Cùng một object cho mỗi trang (memo WeakMap), mang `layout` `n` (không dùng `d`: chữ đó đánh dấu trang của ngày). `useNavigation` áp khi mở, lật, nạp sẵn (`openingPage`). Thẻ ghi "Ban ngày: …"; tìm được thì `book.ts` vẽ đường cong nét đứt từ chỗ ban ngày tới chỗ ban đêm (`SceneSprite.dayTrail`, `DAY_TRAIL_MS`). Hiện có ở Lau Pa Sat, Yaowarat, Hội An (đêm), mỗi trang 3 vật `moved-<id ngày>`. |
| `migrants.ts` | `migrantObjectId`, `migrantSpot(m, day)`, `withVisitors(page, day, migrants)`, `migrantProgress(m, seen)` | Mỗi ngày mỗi sinh vật lữ hành ở một trang (theo ngày, giống nhau cho mọi người), thành vật phụ id `migrant-<id>` (`camo: chameleon`). Trang có khách mang `layout` `v…`. `useNavigation` thêm khách khi mở, lật, nạp sẵn (`openingPage`). |
| `profile.ts` | `cleanDisplayName(text)`, `displayNameOf(meta)`, `NAME_MIN` (2), `NAME_MAX` (24) | Tên trong game, lưu ở `user_metadata.display_name` của tài khoản: tên đã chọn trước, rồi tên của nhà cung cấp đăng nhập (`full_name`/`name` của Google, cắt cho vừa). Đếm theo ký tự (emoji không bị cắt đôi). |
| `challenge.ts` | `Challenge`, `FriendChallenge`, `FriendChallengeObject`, `ChallengeRefusal` (`missing` · `turning` · `newer`; mọi trang đều thách được), `encodeChallenge`, `parseChallenge(text)`, `parseFriendCode(text)`, `isFriendChallenge`, `readFriendChallenge(raw, knownSprite)` (kiểm từng vật dữ liệu server gửi về; sai một vật là bỏ cả thử thách), `friendChallengeRefusal`, `friendPage(visit, c)`, `canChallengePage(pageId, playedPages)`, `challengeSeed(roll)`; hằng số `FRIEND_CONTENT_VERSION`, `FRIEND_AREA`, `FRIEND_RADIUS`, `FRIEND_MAX_OBJECTS`, `FRIEND_OBJECT_SCORE`, `FRIEND_SIZES` (nhỏ/vừa/lớn/rất lớn: scale 0,6/0,9/1,3/1,8 kèm radius 0,022/0,03/0,042/0,055), `friendSizeOf` (khớp với kiểm tra trong SQL) | Mã local `SG3N-7K2P-142` dùng seed; mã `H-…` trỏ tới thử thách người chơi tự đặt trên backend. Thử thách bạn bè lưu ID trang, sprite, tọa độ, ngụy trang và gợi ý; hai phía phải đăng nhập và đã chơi đúng trang ngày/đêm. |
| `progress.ts` | `progress.{subscribe, backup, restore, recordVictory, pageResult, recordDiscovery, discovered, recordVisit, playedPages, lastPage, …}` | API quản lý tiến độ runtime, ủy thác schema cho `progressSchema.ts` và gộp bản lưu cho `progressMerge.ts`. |
| `progressSchema.ts` | `SCHEMA_VERSION` (=2), `MAX_STAMPS` (400), `MAX_STICKERS` (60), `readProgress(raw)`, `readBackup(text)` | Định dạng và xác thực cấu trúc bản lưu local/backup. |
| `progressMerge.ts` | `mergeProgress(current, other)` | Quy tắc gộp hai tiến độ không mất mát dữ liệu. |

### content/ — chỉ dữ liệu
| File | Export | Ghi chú |
|---|---|---|
| `migrants.ts` | `MIGRANTS` (én, mèo của vị kiến trúc sư, bướm; mỗi con 4 chỗ ghé qua 3 nước) | Test bắt chỗ ghé phải ở trang ngày, trên giấy, không đè vật nào. Id sinh vật và id trang của chỗ ghé là vĩnh viễn. |
| `tools.ts` | `TOOLS: Record<ToolId, {name, description, finds, badge}>` | Tên và mô tả dụng cụ cho người chơi (Bảng Suy Luận hiện khi trao); `finds`/`badge`: tên những thứ nó làm hiện ra, ở Mục Lục và thanh manh mối. |
| `index.ts` | `COUNTRIES`, `FIRST_COUNTRY` (=`COUNTRIES[0]`), `allChapters()`, `countryById`, `pagesOf(country)` → `PageRef[]`, `pageRefOf(page)`, `artOf(page)` → asset `require`, `artIdOf(page)` → `"<country>/<art>"`, `allPages()` (mọi trang ngày rồi tới mọi trang đêm), `placeOf(pageId)` → `{ref, night}` hoặc `null`, `codeOf(country)`, `challengeOf(page, seed, time?)`, `pageOfChallenge(challenge)` | Khi load sẽ **throw** nếu id trang hay id chương bị trùng (kể cả giữa hai nước), `art` không có trong bảng `art` của nước, hoặc hai nước trùng `code`. |
| `countries/<nước>/index.ts` | `const <nước>: Country` | Chương, prologue, `pages: [{ day }, { day, night }]`, bảng `art`. Ép kiểu JSON bằng `const page = (json: unknown) => json as Page`. |
| `countries/<nước>/chapter-N/*.json` | — | Một trang mỗi file (định dạng: add-country.md). |
| `countries/<nước>/mysteries.ts` | `Mystery` của từng chương | Câu hỏi, đáp án, đoạn kết của bí ẩn chương. Cả 11 chương của 3 nước đều có; mạch truyện xuyên suốt: vị kiến trúc sư là người giữ sổ thứ ba, hẹn trao sổ cho người chơi ở Mũi Cà Mau. |
| `bestiary.ts` | `BESTIARY: Record<Exclude<SpriteType,'seal'>, {name, kind, fact}>`, `isCreature(type)`, `STARTLE` (`hop` · `scurry` · `splash` · `flutter`) | Sổ Tay Sinh Vật. TypeScript **bắt buộc** mỗi `SpriteType` có một mục. Sinh vật mới phải có một kiểu `STARTLE` (test), đồ vật thì không. |

### game/ — một lượt chơi (hooks)
| File | Vai trò |
|---|---|
| `useGame.ts` | `useGame({browsing})` = `nav` + `case` + `notices` + bật/tắt âm (nước rửa màu luôn bật; `settings.wash` trong bản lưu cũ không còn được đọc) + `home`/`setHome` (trang chủ đang mở; mở sẵn khi vào game). Đồng hồ dừng khi chờ/lật trang hoặc có trang chủ, prologue, intro đêm, Mục Lục hay Sổ Tay. Trang thực sự mở để chơi trong sổ (không còn trang chủ, intro, lật trang hay hộp thoại) thì ghi trang đang ở và lịch sử đã chơi (`progress.recordVisit`). Kiểu trả về: `Game`. |
| `useNavigation.ts` | `mode: PlayMode` (`book` · `daily` · `challenge`) và `seed`: trang được dựng qua `layOutPage` / `dailyPage` một lần mỗi lượt. Lần đầu chơi một trang là seed 0; trang đã giải (và có `spots`) thì mỗi lần chơi lại một seed mới. Trang lân cận được chuẩn bị trước khi lật để đích khớp `layoutKey`. `openDaily`, `openChallenge`, `openFriendChallenge` (trả về `ChallengeRefusal` hoặc null khi mở được), `leaveSpecial` (về chỗ đang ở trong sổ). Thử thách bạn bè dựng bằng `friendPage` (core). Ngoài sổ thì `nextPage` là null. Trang đang dở được mở sẵn từ tiến độ local. |
| `useCase.ts` | Vụ án của trang: `inspect`, `requestHint`, `togglePause`, `explore`, `isFogged`, `screenShake`, `unlockedNight`. Chạm ngoài góc của trang của ngày bị bỏ qua; vật chưa tới lượt chỉ báo nhắc; mảnh manh mối cuối của chương báo mở Bảng Suy Luận. Phá trang của ngày thì `recordStamp` thay cho `recordVictory`. Khi `visit` đổi thì reset vụ án **ngay trong lần render đó** (không lộ trạng thái cũ). Đây là nơi gọi `sound`, `notify`, `progress`. |
| `useNotices.ts` | `notify(text, at, 'score' \| 'info')`. |
| `ownedTools.ts` | `ownedTools()`: dụng cụ đang có, đọc từ bản lưu (bí ẩn đã giải). `useNavigation` lọc trang qua `withTools` khi mở/lật; `GameScreen` nạp sẵn trang lân cận qua `nav.preparedPage` (đúng trang lượt lật sẽ mở: dụng cụ, sinh vật lữ hành, seed, sinh vật vàng) để lật không phải dựng lại. |

### board/ — cuốn sổ (Skia)
| File | Vai trò |
|---|---|
| `Board.tsx` | Ghép các hook theo **đúng thứ tự**: `useSceneLibrary → useCamera → useCaseMarks → usePageTurn → usePagesAround → useWarmUp`; `useDerivedValue` gọi `renderFrame`, đưa picture thẳng vào Canvas và giải phóng đầu ra cũ. Dừng clock/cử chỉ khi bị che hoặc chờ đích (trừ warm-up/lật đang chạy); nút zoom. |
| `constants.ts` | `PAGE_W/H`, `PX` (page units cho mỗi px CSS của bản web gốc rộng 960 px), `LOUPE_ZOOM`, `spriteSize`, `MIN/MAX_ZOOM`. |
| `anim.ts` | Easing và đường cong hoạt ảnh (worklet): `track`, `loop`, `alternate`, `shyPeek`, `shyJump`, `foundBounce`, `startle` (sinh vật giật mình khi bị bắt, `STARTLE_MS = 760`, luôn trở về đúng chỗ bị bắt), `bloom`, `blinkScale`… |
| `useCamera.ts` | Shared value `s, tx, ty, lx, ly, dims`; `bounds`, `centre`, `placeLoupe`, `zoomTo`, `markZoomed`; `fittedScale`, `loupeDiameter`. Camera ôm khung giấy chứ không ôm cả ảnh; trang của ngày thì ôm góc đang chơi (`SceneData.focus`). |
| `useBoardGestures.ts` | Cử chỉ native: kéo kính lúp (tròng hoặc cán), thả là soi; chạm để soi; kéo trang, chụm để zoom, lăn chuột (web); kéo sát mép thì trang tự cuộn. Chạm ra mặt bàn không tính là soi. |
| `useCaseMarks.ts` | Đẩy trạng thái vụ án sang UI thread: `found` (thời điểm + vị trí, để vật "nở" màu), `radar`, `fogStart`, `nudge`, `reveal` (nước rửa: -1 tắt / trang đêm, 0 đang phủ, lúc phá án thì tan dần). |
| `usePageTurn.ts` | Vòng đời một lần lật trang (mục 4). |
| `usePagesAround.ts` | Ưu tiên dựng đích chưa có cache trước khi hoạt ảnh bắt đầu; thử lại khi ảnh tới. Dựng trang lân cận mỗi lần một trang, 120 ms sau khi ổn định, **không trong hoạt ảnh lật**. Trả về ảnh để giữ "ấm" trên GPU. |
| `useSceneLibrary.ts` | Cache cấp module: `images` (tranh đã giải mã theo `artIdOf`, tối đa `MAX_IMAGES = 5`), `analyses` (theo `layoutKey`, tối đa 40); cache `scenes` theo `layoutKey` và (loupe, compact, density); `keepArt` cho nghỉ mọi scene có `layoutKey` không còn trong danh sách cần (trang này, đích lật, `preload`), vì mỗi scene giữ sprite sheet riêng trên GPU. API: `prepare`, `keepArt`, `useKeepArt`… |
| `useWarmUp.ts` | Mỗi loại trang (ngày, đêm) một lần, khi hộp thoại đang phủ: vẽ ẩn các khung "lần đầu" (tìm thấy, radar, mờ kính, lật trang) để GPU biên dịch shader trước. |
| `scene/buildScene.ts` | Dựng `SceneData` một lần trên JS thread: sprite ở mọi biến thể ngụy trang, occluder, waterline, đêm (đèn, sao, trăng), sprite sheet, góc của trang của ngày (`focus` + 4 hình chữ nhật `focusVeil` phủ phần còn lại). |
| `scene/disposeScene.ts` | Giải phóng atlas, waterline, occluder, trăng và shader đèn của scene đã thôi dùng; tài nguyên dùng chung có chủ sở hữu riêng. |
| `scene/snapshotPage.ts` | Chụp trang thành picture chứa một ảnh tạm, tối đa 2048 px mỗi chiều, trước khi lật/warm-up; dùng lại một surface GPU, chuyển snapshot sang pixel để vẽ qua context của Canvas. GPU không sẵn sàng thì giữ picture gốc. |
| `scene/analyze.ts` | Đọc pixel tranh (thu nhỏ còn rộng 880): màu tắc kè hoa quanh từng vật `chameleon`; khung sổ = bounding box các pixel đục (alpha ≥ 128). |
| `scene/paints.ts` | Mọi `SkPaint` và shader, tạo **một lần** (dịch từ CSS bản web gốc). Renderer chỉ đổi alpha. |
| `scene/spriteParts.ts`, `spriteArt.ts` | Biến `SPRITE_ART` (sinh tự động) thành các phần vẽ được; cờ hoạt ảnh `ANIM_BLINK/WING/TAIL/WAVE/GLOW_SPOT`. |
| `scene/spriteAtlas.ts` | Sprite đứng yên được vẽ sẵn vào một sheet (tối đa 2048 px); `atlasDensity`. |
| `scene/loupeBody.ts` | Hình kính lúp đồng / đèn pin. |
| `render/*.ts` | **Worklet, UI thread.** `frame.ts` (thứ tự lớp: ảnh warm → bóng → sách → radar/dấu mộc → kính lúp), `book.ts` (tranh, sprite ngụy trang, occluder, nước rửa `drawWash` (một `saveLayer` giới hạn trong phần trang đang thấy, đục lỗ mềm `washHole` quanh vật đã tìm; không vẽ trong kính lúp: kính lúp luôn thấy màu thật), đêm, cắt bỏ thứ ngoài khung nhìn), `sprites.ts` (tư thế từng vật trong khung này), `marks.ts`, `pageTurn.ts`, `loupe.ts` (kể cả dải cầu vồng của lăng kính khi `SceneData.prism`), `types.ts` (`SceneData`, `FrameState` (có `zoom`: độ phóng so với khung vừa trang), `CAMO_*`, `LENS_*`, `PRISM_ANGLE`/`PRISM_BAND`, `TINY_ZOOM_*`, `FOUND_FADE_MS`). |

### screens/
| File | Vai trò |
|---|---|
| `useChallenges.ts` | Mở mã thử thách, thử thách bạn bè (kể cả từ link `?c=`), nháp của hộp thoại khi bị từ chối (lý do → câu tiếng Việt), lời nhắn chia sẻ sau khi thắng. |
| `GameScreen.tsx` | Màn hình duy nhất. Điều phối trang chủ, hộp thoại và HUD; thử thách qua `useChallenges`. Hộp thoại prologue, Tạm Dừng, Thắng, Hết Giờ chỉ hiện khi đã rời trang chủ. |
| `home/HomeScreen.tsx` | **Trang chủ**: tiếp tục/chọn trang; khách có đường dẫn đăng nhập để đồng bộ tiến độ và xuất bản/nhận thử thách. |
| `ErrorBoundary.tsx` | Bọc `GameScreen` trong `App.tsx`. Lỗi lúc render thì hiện màn "Cuốn sổ gặp chút sự cố" thay vì màn trắng: "Mở lại cuốn sổ" mount lại game (về trang chủ), "Gửi báo lỗi" chia sẻ hoặc chép `crashLog.report()`. |
| `BookThumb.tsx` | Ảnh thu nhỏ một trang (cắt đúng khung giấy, 16:9), dùng ở Mục Lục và trang chủ. |
| `Desk.tsx` | Mặt bàn: `paper-wash.jpg` và tán lá `botany-*.webp` (chỉ khi `width > 800`), sticker của Trang Bìa đặt theo tọa độ người chơi chọn (cuốn sổ che phần nằm sau nó; `GameScreen` đọc lại khi đóng Trang Bìa hoặc khôi phục bản sao lưu). |
| `useDeviceBehaviour.ts` | Giữ màn hình sáng, ẩn thanh điều hướng Android, rời app thì tạm dừng, nút Back Android. |
| `hud/HUD.tsx` | Thanh trên: điểm, đồng hồ, combo, chuyển trang, nút về trang chủ, gợi ý, tạm dừng, âm thanh, Mục Lục, Sổ Tay; `ExploreStatus`. |
| `hud/QuestPanel.tsx`, `hud/QuestCard.tsx` | Bảng và từng thẻ manh mối (`QuestCard` memo, `cardName`, `cardText`, `cardStyles`): **hình bóng** của vật chính; tên, `clue` và nhãn kiểu ngụy trang hiện khi thẻ đã đọc (gợi ý bước 1) hoặc vật đã tìm. |
| `hud/FloatingScores.tsx` | Điểm và thông báo bay lên từ chỗ chạm. |
| `dialogs/*` | `StoryPrologue` (prologue chương / intro trang đêm), `PauseMenu`, `VictoryScreen` (kèm so thời gian thử thách, bưu thiếp, mã thử thách), `TimeUpScreen`, `PageIndex` (Mục Lục; tab nước khi có nhiều nước; số mảnh manh mối và nút Suy Luận ở đầu chương), `CreatureAlbum` (Sổ Tay), `RotatePrompt`, `Deduction` (Bảng Suy Luận), `Passport` (Hộ Chiếu), `MyCover` (Trang Bìa), `ChallengeEntry` (nhận mã local hoặc mã `H-…` từ backend), `ChallengeCreate` (chọn trang đã chơi, chọn sprite, chạm tranh để đặt vật, đặt tên/ngụy trang/gợi ý và xuất bản mã), `DailyDone`, `Finale`, `Backup` (khôi phục xong thì `GameScreen` mount lại trang chủ để đọc tiến độ). |
| `share/*` | `postcard.ts` (`drawPostcard`: vẽ bưu thiếp 1200 × 630 bằng Skia trên JS thread, viền và con dấu vàng khi nước đó có tem vàng hộ chiếu, font nạp một lần, xuất JPEG base64; đo chữ bằng glyph vì web không có `measureText`), `messages.ts` (lời nhắn thử thách, bưu thiếp thắng, bưu thiếp trang của ngày), `useShare.ts` (`busy`, `note`, `sharePostcard`, `shareMessage`), `ShareRow.tsx` (nút bưu thiếp/thách bạn; màn thấp thì thành icon hai bên hàng sao). |

### platform/
| File | Vai trò |
|---|---|
| `sound.d.ts` | Hợp đồng `GameSound`: `playFound/Wrong/Hint/PageTurn/Voice/Fog/Creature/Rustle/Victory`, `prepareVoices`, `setSoundEnabled`. |
| `cloudProgress.ts` | `connectCloudProgress(userId)` → `{ ready, flush, stop }`. Mỗi lần đồng bộ: đọc `user_progress`, gộp vào máy (`progress.restore`), ghi lại bản **đã gộp** (hai máy không ghi đè nhau), rồi gửi từng trang đã chơi. Mỗi request có timeout 8 s; lỗi thì thử lại sau 30 s, không bao giờ chặn game. Bản lưu của tài khoản khác trên máy được thay bằng bản của tài khoản này (`progress.replace`); tiến độ chơi khách nhập vào tài khoản đầu tiên. |
| `googleSignIn.ts`, `googleSignIn.web.ts` | `signInWithGoogle()`. Web: chuyển trang sang Google rồi quay về chính địa chỉ đó, client Supabase tự đổi mã lấy phiên (`detectSessionInUrl`). App: mở trình duyệt hệ thống (`expo-web-browser`), quay về qua link của app (`scheme` `lostsketchbook` trong app.json; Expo Go: `exp://`), rồi `exchangeCodeForSession`. Client dùng PKCE (`flowType: 'pkce'`). |
| `displayDensity.ts`, `displayDensity.web.ts` | Web: giới hạn `devicePixelRatio` của canvas (điện thoại 1,5, máy khác 2), chạy khi được import trong `index.web.ts` trước Skia; `IDLE_FRAME_STRIDE` (điện thoại web: 2, Board vẽ cách khung khi rảnh). App: không đổi (1). |
| `accountPrefs.ts` | `saveOwner`/`setSaveOwner` (bản lưu trên máy thuộc tài khoản nào), `hasEntered`/`rememberEntered` (đã vào game: lần sau vào thẳng, kể cả offline). |
| `friendChallenges.ts` | RPC xuất bản layout vật (`requestId` giữ nguyên khi gửi lại cùng bản nháp: không tạo trùng) và nhận layout theo mã, kiểm bằng `readFriendChallenge`; Postgres kiểm tra quyền, sprite và giới hạn payload. Không còn điều kiện "đã chơi trang" (migration `20261016143000`); `record_page_visit` vẫn giữ cho bản app cũ. |
| `auth/*` | `AuthScreen`: nút "Tiếp tục với Google", email + mật khẩu, đăng ký email có ô tên trong game, "Quên mật khẩu?" (`resetPasswordForEmail`). Link trong mail (mẫu ở `supabase/templates/`) có dạng `?token_hash=…&type=email|recovery`: `AuthGate` đọc qua `launchLink.takeAuthLink` (chỉ web) rồi `verifyOtp`, nên mở ở trình duyệt nào cũng được; `recovery` mở `PasswordDialog` (đặt mật khẩu mới), link hỏng hiện `AuthNotice`. `NameDialog`: đặt hoặc đổi tên (`updateUser({ data: { display_name } })`); hỏi một lần khi tài khoản chưa có tên, luôn có "Để sau". `AuthContext`: `email`, `name`, `editName`, `openAccount`, `signOut`. `AuthGate`: màn đăng nhập chỉ hiện ở lần mở đầu tiên (hoặc khi người chơi bấm mở tài khoản, dạng lớp phủ trên game); sau đó vào thẳng game, session có sẵn thì đồng bộ nền. Vừa đăng nhập thì chờ đồng bộ tối đa 4 s rồi mở lại game với tiến độ của tài khoản. Đăng xuất: đẩy nốt thay đổi rồi `signOut({ scope: 'local' })` (chạy được offline). |
| `sound.web.ts` | Web: synth chạy trực tiếp + rung. Mở AudioContext ở lần chạm đầu. |
| `sound.native.ts` | iOS/Android: phát WAV đã sinh (`generated/sounds.ts`), mỗi âm 2 player; + rung. |
| `synth/synth.ts`, `synth/voices.ts` | Bộ tổng hợp Web Audio: **nguồn gốc của mọi âm thanh**. `VOICE_OF: SpriteType → tên giọng`. |
| `crashLog.ts` | 10 lỗi gần nhất lưu trên máy, khóa riêng `detective_sketchbook_crashes_v1` (không có server). `installCrashLog()` gọi trong `App.tsx`: native bọc `ErrorUtils` (giữ handler gốc), web nghe `error` / `unhandledrejection`. Không bao giờ throw. |
| `haptics.ts` | Rung theo từng sự kiện, kiểu fire-and-forget. |
| `share.d.ts`, `share.native.ts` / `.web.ts` | `shareText`, `shareImage(jpegBase64, fileName, text)` → `ShareOutcome`. Native: bảng chia sẻ (`Share`; ảnh ghi ra cache bằng `expo-file-system` rồi `expo-sharing`). Web: Web Share API nếu có, không thì chép clipboard / tải ảnh. Không bao giờ throw. |
| `backupFile.d.ts`, `backupFile.native.ts` / `.web.ts` | `saveBackupFile(text, fileName)` (native: tệp trong cache qua bảng chia sẻ; web: tải về), `pickBackupFile()` (`expo-document-picker`, đọc bằng `expo-file-system` / `File.text()`). |
| `keepStorage.ts` / `.web.ts` | `askToKeepStorage()` gọi trong `App.tsx`: web xin `navigator.storage.persist()` để trình duyệt không tự xóa bản lưu; native không cần. |
| `launchLink.ts` / `.web.ts` | `takeLaunchCode()` (web: đọc rồi xóa `?c=` khỏi địa chỉ), `challengeLink(code)` (web: địa chỉ của chính trang; native: `EXPO_PUBLIC_WEB_URL` nếu có). |
| `sceneImage.ts` / `.web.ts` | Giải mã tranh ngoài luồng vẽ (native: JS thread + `makeNonTextureImage`; web: `createImageBitmap` rồi copy pixel qua canvas 2D, tránh lazy texture không vẽ được trên surface CPU), `readPixels` để phân tích. |

### ui/
`theme.ts` (`colors`, `fonts`, `gradients`, `shadow`), `DialogHeader.tsx` (tiêu đề + nút đóng của hộp thoại dạng tờ), `ModalShell.tsx` (nền mờ + thẻ giấy; tự thu nhỏ tối thiểu 0.75×;
`scroll` chỉ cho danh sách dài; `footer` ghim nút chính), `Buttons.tsx` (`PrimaryButton`, `SecondaryButton`,
`RoundIconButton`), `SpriteIcon.tsx` (SVG tĩnh từ `SPRITE_SVG`), `icons.ts` (Lucide, mỗi icon một import),
`layout.ts` (`useCompact`: cao < 680; `useShortLandscape`: ngang và cao < 560), `format.ts` (`formatNumber` "12.345",
`formatClock` "03:45", `formatDuration`), `useStableCallback.ts`, `toolMarks.ts` (`TOOL_MARKS`: icon và màu cho vật của
từng dụng cụ; `byTool(objects)`).

### tools/ (gốc repo)
`generate-assets.mjs` (sprite + âm thanh), `generate-icons.mjs`, `check-architecture.mjs`, `test-screens.mjs`
(Playwright, 13 viewport, danh sách `DIALOGS`), `benchmark-render.cjs`, `benchmark-page-turn.cjs`, `sprites/`
(`ObjectSprite.tsx` và `sprites.css` là **nguồn** của mọi hình vẽ).

### test/ (app/test, Jest)
`rules.test.ts` (điểm, phát hiện, chuyển động, gợi ý, hồ sơ vụ án, seed, vị trí thay thế, theo dấu, bí ẩn chương, trang của ngày, mã thử thách), `progress.test.ts` (đọc/ghi/nâng cấp bản lưu),
`content.test.ts` (soát **mọi trang**: tọa độ trong 0–1, `0 < radius < 0.2`, sprite có art và mục Sổ Tay, `roam` ≥ 2
điểm, `occluder` ≥ 3 điểm, `0 < waterline < 1`, ≤ 1 bí mật, có ít nhất một vật chính, id vật không trùng trong trang,
trang đêm dùng chung `art` với trang ngày), `session.test.tsx` (chờ đích, hủy completion cũ, dựng lại khi ảnh tới),
`sound.test.ts` (âm thanh native lỗi không ngắt game), `crashLog.test.ts` (giới hạn 10 lỗi, storage hỏng không throw), `screens/Gallery.tsx` (mọi hộp thoại với nội dung dài nhất, cho
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
