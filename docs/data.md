<!-- 원본: Hatch 팀 문서 "데이터 구성" 5판. 고칠 때는 Hatch에서 고치고 이 사본을 바꾼다 -->
# 데이터 구성 — 「LAST ONE」

## 0. 문서 정보
| 항목 | 내용 |
| --- | --- |
| 버전 | v0.1 |
| 근거 | PRD 2판, 기능명세 v0.1 |
| 저장소 | Supabase (Postgres + Auth + Realtime). 시나리오는 레포 안 JSON |
| 바뀐 것 | 5판: 쓰지 않는 표 profiles, completions를 지움 (§2 댓글 @uyeon0, PO 2026-11-27 확정). FR-090을 다시 다룰 때 새로 만든다. 4판: 익명 사용자도 30일 보관(D-026), 24시간 활동 없는 방과 판은 ended(D-027), `ended_reason`에 `cancelled`, `stale` 추가(D-025) (§6 댓글 @uyeon0, PO 2026-11-26 확정) |
| 상태 표시 | `확정` PRD에서 정함 · `제안` 이 문서에서 제안 |

원칙
- **비밀은 서버와 그 사람만.** 다른 사람의 배정, 범인, 개별 투표는 RLS로 막아서 개발자 도구로도 못 본다 (NFR-004)
- **단계는 한 곳.** `games.phase`가 유일한 진실이다. 폰은 읽기만 한다
- **손님도 같은 규칙.** 모두 손님이다(로그인 없음, D-018). Supabase 익명 세션으로 `auth.uid()`를 갖고 같은 RLS를 탄다
- **시나리오는 코드와 함께.** 시나리오 내용은 DB가 아니라 `scenarios/*.json`(버전 관리, 리뷰)

---

## 1. 표 한눈에
```
rooms ──< players            방과 참가자 (손님 포함)
rooms ──< games              판 (다시 하기면 여러 개)
games ──< assignments        자리마다 인물, 비밀, 단서 (본인만)
games ──< revealed_clues     공용으로 열린 단서
games ──< readies            준비/확인 표시
games ──< votes              투표 (본인만, 집계는 함수)
games ──< ghost_actions      속삭임, 출몰
games ── 1 reveals           해설 (reveal 단계부터)
events                       기록 (분석)
```

## 2. 표 정의

### 지운 표 `확정` (PO 2026-11-27)
- `profiles`(기본 닉네임), `completions`(완료 기록)는 로그인이 없어(D-018) 쓰지 않아 지웠다. 새 마이그레이션 `010`에서 지운다
- FR-090(완료 체크)을 다시 다루면 그때 "계정 없이 폰마다 익명 사용자"를 기준으로 새로 설계한다

### rooms
| 칸 | 형 | 설명 |
| --- | --- | --- |
| id | uuid PK | |
| code | text | 숫자 6자리 `제안`. `status <> 'ended'`인 방끼리 unique (부분 인덱스) |
| scenario_id | text | `live-death` |
| status | text | `lobby` / `playing` / `ended` |
| host_player_id | uuid → players | 방장 (BR-012로 바뀜) |
| created_at, ended_at | timestamptz | |

### players
| 칸 | 형 | 설명 |
| --- | --- | --- |
| id | uuid PK | |
| room_id | uuid → rooms (cascade) | |
| user_id | uuid → auth.users | 손님이면 익명 사용자 id |
| is_guest | bool | `auth.jwt()->>'is_anonymous'` 값 복사 |
| nickname | text 1~12 | 겹치면 "이름2" |
| seat | int 1~6 | 입장 순서. 방장 넘김 순서 (BR-012) |
| joined_at | timestamptz | |
| left_at | timestamptz null | 게임 중 나감 (BR-011). 다시 오면 null |
- unique (room_id, user_id), unique (room_id, seat)

### games
| 칸 | 형 | 설명 |
| --- | --- | --- |
| id | uuid PK | |
| room_id | uuid → rooms | |
| player_count | int 4~6 | |
| phase | text | `intro` `secret` `r1` `r2` `r3` `vote` `revote` `reveal` `ended` |
| phase_started_at, phase_ends_at | timestamptz | 타이머 기준 (서버 시간) |
| revote_candidates | uuid[] null | 재투표 후보 (BR-013) |
| outcome | text null | `caught` 검거 / `aired_off` 방송 중단 |
| ended_reason | text null | `normal` / `culprit_left`(r1 이후 범인이 나가 해설로) / `cancelled`(추리 전 범인이 나가 취소) / `stale`(24시간 활동 없음) (D-025, D-027) |
| assignment_source | text | `ai` / `rule` (BR-014) |
| started_at, ended_at | timestamptz | |
- **범인, 희생자는 이 표에 두지 않는다**(읽기 권한이 넓어서). `game_secrets`에 둔다

### game_secrets (서버만)
| 칸 | 형 | 설명 |
| --- | --- | --- |
| game_id | uuid PK → games | |
| culprit_player_id | uuid → players | |
| victim_player_id | uuid → players | |
| culprit_character | text | 시나리오 인물 ID |
| ghost_trait | text | 시나리오 특징 ID |
| llm_raw | jsonb null | AI 응답 원문 (검사 실패 원인 보기) |
- RLS: 아무도 못 읽음. 서버(service role)만. reveal 단계에서 `reveals`로 옮겨 공개

### assignments (본인만)
| 칸 | 형 | 설명 |
| --- | --- | --- |
| game_id, player_id | PK | |
| character_id | text | `fav`, `villain`, `athlete`, `writer`, `influencer`, `medic` |
| secret_id | text | 기본 1개 (D-016) |
| alibi_id | text | |
| is_culprit | bool | 본인 화면 "당신이 범인입니다" (AC-030) |
| clue_ids | jsonb | `{ "r1": ["c-r1-03"], "r2": [...], "r3": [...] }` 개인 단서 |
| is_ghost | bool | r2부터 true (희생자) |

### revealed_clues (공용)
| 칸 | 형 | 설명 |
| --- | --- | --- |
| game_id, clue_id | PK | |
| round | int 1~3 | |
| revealed_at | timestamptz | |
- 라운드 진입 때 서버가 그 라운드 공용 단서를 넣는다. 개인 단서는 여기 넣지 않는다

### readies
| 칸 | 형 | 설명 |
| --- | --- | --- |
| game_id, player_id, phase | PK | 확인(secret), 준비 완료(r1~r3), 오프닝 다음(intro) |
| at | timestamptz | |

### votes (본인만)
| 칸 | 형 | 설명 |
| --- | --- | --- |
| game_id, round, voter_player_id | PK | round 1 투표, 2 재투표 |
| target_player_id | uuid | 살아 있는 플레이어, 재투표면 후보 중 |
| at | timestamptz | |
- 집계는 서버 함수 `tally(game_id, round)`만 (AC-060). 공용에는 `vote_count`만

### ghost_actions
| 칸 | 형 | 설명 |
| --- | --- | --- |
| id | bigint PK | |
| game_id | uuid | |
| kind | text | `whisper` / `haunt` |
| from_player_id | uuid | 유령 |
| to_player_id | uuid null | whisper만 |
| round | int | 횟수 검사 (OQ-005, 라운드당 1번 `제안`) |
| body | text 1~80 | |
| at | timestamptz | |
- unique (game_id) where kind='haunt' — 출몰 1번 (AC-053)
- 판이 끝나면 body를 지운다 `제안` (PRD §19)

### reveals
| 칸 | 형 | 설명 |
| --- | --- | --- |
| game_id | uuid PK | |
| body | jsonb | 해설 카드 1~9 (기능명세 S-12) |
| personal | text null | 맞춤 해설 (LLM). 실패하면 null |
| created_at | timestamptz | |
- RLS: 그 판 참가자 + `games.phase in ('reveal','ended')`일 때만

### events (기록)
| 칸 | 형 | 설명 |
| --- | --- | --- |
| id | bigint PK | |
| name | text | 기능명세 §7 |
| room_id, game_id | uuid null | |
| props | jsonb | 인원, 단계, 손님 여부 등. 닉네임, 글 내용은 넣지 않음 |
| at | timestamptz | |

---

## 3. 권한 (RLS)
도우미 함수: `my_player(room_id)` = 이 방에서 `user_id = auth.uid()`인 players.id

| 표 | 읽기 | 쓰기 |
| --- | --- | --- |
| rooms | 그 방 참가자 (코드로 찾기는 서버 함수 `join_room`) | 서버 |
| players | 같은 방 참가자 (닉네임, seat, left_at) | 서버 |
| games | 그 방 참가자 | 서버 |
| game_secrets | **없음** | 서버 |
| assignments | `player_id = my_player(...)` 만 | 서버 |
| revealed_clues | 그 방 참가자 | 서버 |
| readies | 그 방 참가자 (인원 표시) | 서버 |
| votes | 본인 것만 | 서버 (`vote` 동작이 검사 후 넣음) |
| ghost_actions | whisper: 보낸 사람, 받은 사람 / haunt: 그 방 참가자 | 서버 |
| reveals | 참가자 + reveal 이후 | 서버 |
| events | 없음 | 서버 |

- 쓰기는 전부 Server Action에서 service role로. 클라이언트에서 DB에 바로 쓰지 않는다
- 테스트: 플레이어 A 세션으로 B의 assignments, game_secrets, votes 읽기 → 0줄 (AC-030, NFR-004)

## 4. 시나리오 파일 (`scenarios/live-death.json`)
CAG의 고정 맥락이자 규칙 검사의 기준. LLM과 서버가 같은 파일을 읽는다.

```json
{
  "id": "live-death",
  "title": "생방송 중 사망",
  "version": 1,
  "timeline": [{ "at": "21:30", "text": "..." }],
  "characters": [
    { "id": "fav", "core": true, "name": "국민 호감 1위", "intro": "...", "order": 1 },
    { "id": "influencer", "core": false, "minPlayers": 5, "name": "인플루언서", "intro": "..." },
    { "id": "medic", "core": false, "minPlayers": 6, "name": "의료 담당", "intro": "..." }
  ],
  "secrets": [{ "id": "s-fav-1", "character": "fav", "text": "..." }],
  "alibis": [{ "id": "a-fav-1", "character": "fav", "text": "..." }],
  "traits": [{ "id": "t-citrus", "text": "시트러스 향수 냄새", "characters": ["fav", "influencer"] }],
  "culprits": [
    { "character": "fav", "motive": "...", "mistake": "...", "trait": "t-citrus" }
  ],
  "clues": [
    { "id": "c-r1-01", "round": 1, "visibility": "public", "text": "..." },
    { "id": "c-r1-02", "round": 1, "visibility": "private", "for": ["fav", "writer"], "pointsTo": ["fav"], "redHerring": false, "text": "..." }
  ],
  "redHerrings": [{ "clue": "c-r2-04", "suspect": "athlete", "truth": "..." }],
  "pairs": [{ "a": "fav", "b": "writer", "secret": "...", "tension": "..." }],
  "rounds": [{ "round": 1, "place": "숙소 거실", "time": "현재", "minutes": 8 }],
  "reveal": { "pastTruth": "...", "endings": { "caught": "...", "aired_off": "..." } }
}
```

규칙
- 비밀은 인물마다 기본 1개(D-016). 배열이라 나중에 후보를 늘릴 수 있다
- 단서 `for`는 그 단서를 받을 수 있는 인물, `pointsTo`는 그 단서가 가리키는 범인 후보. 배정 검사에서 "이번 범인을 가리키는 단서가 라운드마다 1개 이상" `제안`
- 특징 `characters`는 그 특징이 해당하는 인물. 인원에 따라 빠지는 인물을 빼고 2명 이상 남아야 그 범인을 고를 수 있다 (BR-006, OQ-013)
- 파일을 고치면 검사 스크립트(zod 스키마 + 위 규칙)가 통과해야 머지

## 5. 실시간
| 채널 | 보내는 것 | 누가 보냄 |
| --- | --- | --- |
| `room:{roomId}` broadcast | `{ type: 'phase', phase, endsAt }`, `{ type: 'count', ready, votes }`, `{ type: 'haunt', body }`, `{ type: 'event', id }`, `{ type: 'players' }` | 서버 (Server Action 끝에서) |
| (개인) | 보내지 않음. 신호를 받으면 `getMine`로 다시 읽는다 | — |

- 폰은 신호를 놓쳐도 되게 만든다: 화면을 열 때, 신호를 받을 때, 타이머가 0일 때 `getRoomState`를 다시 읽는다 (NFR-001, NFR-002)

## 6. 보관과 삭제 (D-019)
| 데이터 | 보관 |
| --- | --- |
| 손님 익명 사용자 | 판 기록과 같이 30일 뒤 삭제 `확정` (D-026). 참가자 줄이 사용자에 묶여 있어 먼저 지우면 배정, 투표가 같이 지워진다 |
| 끝난 방, 판, 배정, 투표 | 30일 뒤 삭제 `확정` (D-019) |
| 끝나지 않은 방, 판 | 24시간 동안 단계가 안 바뀌면(`phase_started_at`, 대기 중인 방은 `created_at` 기준) ended로 바꾸고 `ended_at`을 그 시각으로, `ended_reason=stale`. 그때부터 30일 `확정` (D-027) |

정리 작업은 하루 한 번 돈다: (1) 24시간 넘은 방과 판을 ended로 (2) `ended_at`이 30일 지난 방, 판과 그 사람들의 익명 사용자를 지운다. 11단계(보관 정리)에서 만든다
| ghost_actions.body | 판이 끝나면 지움 `제안` |
| events | 개인 식별 없이 보관 |

## 7. 마이그레이션 순서
1. `001_core.sql`: rooms, players, games, game_secrets, assignments, revealed_clues, readies, votes, ghost_actions, reveals, profiles, completions, events + 인덱스 (profiles, completions는 `010`에서 지움)
2. `002_rls.sql`: 도우미 함수와 §3 정책
3. `003_functions.sql`: `join_room`, `tally`
4. Supabase 설정: 익명 로그인 켜기, Realtime broadcast 켜기
