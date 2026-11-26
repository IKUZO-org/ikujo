# 구조 (ARCHITECTURE)

> 담당: 정연, 현경. 담당자가 PR로 고치고 PO가 검토한다 ([CONTRIBUTING.md](CONTRIBUTING.md))
> 근거: [docs/spec.md](docs/spec.md) §1, §4, [docs/data.md](docs/data.md) §3, §5. 이 문서와 docs가 어긋나면 docs가 이긴다
> `제안` 표시는 1단계 뼈대 PR에서 담당자가 확정하고 이 표시를 지운다

## 1. 한 장 그림
```
폰(브라우저) ──Server Action──▶ Next.js 서버 ──service role──▶ Supabase Postgres (RLS)
     ▲                              │
     │  "바뀌었다" 신호만             │ 끝에서 broadcast
     └──── Supabase Realtime ◀───────┘
폰은 신호를 받으면 getRoomState / getMine 로 다시 읽는다
```

| 부분 | 맡는 일 | 하지 않는 일 |
| --- | --- | --- |
| 화면 (Client Component) | 서버가 정한 단계를 그린다, 버튼을 Server Action으로 보낸다 | 단계 판단, DB 쓰기, 남의 비밀 갖기 |
| 서버 (Server Action, Route Handler) | 방, 입장, 시작, 배정, `advance`, 투표 집계, 해설 (spec §4) | 클라이언트가 보낸 역할, 단계를 믿기 |
| Supabase DB + RLS | 저장, 본인 것만 읽게 (data §3) | — |
| Supabase Realtime | 방 채널 `room:{roomId}` 로 공용 신호 (data §5) | 비밀 보내기 |
| 시나리오 파일 | `scenarios/live-death.json` (data §4) | 판마다 바뀌는 값 |

## 2. 꼭 지킬 원칙
1. **단계는 서버의 `games.phase` 하나만 진실.** 화면은 `phase`, `phase_ends_at` 을 따라 그린다. 넘기기는 `advance(gameId, from)` 하나로만, `from` 이 지금 단계와 다르면 아무것도 안 한다 (spec §1.1)
2. **쓰기는 전부 서버에서.** 클라이언트는 Supabase에 직접 쓰지 않는다. Server Action이 세션, 참가자, 단계, 입력(zod)을 확인하고 service role로 쓴다
3. **비밀은 본인 요청에만.** 공용은 `getRoomState`, 내 것은 `getMine`, 해설은 `getReveal`(reveal 이후). 응답 타입을 공용/개인으로 나눠 섞이지 않게 한다
4. **실시간은 신호만.** 신호를 놓쳐도 되게: 화면을 열 때, 신호를 받을 때, 타이머가 0일 때 다시 읽는다 (NFR-001, NFR-002)
5. **실패는 `{ error: '한 줄 안내' }`.** 스택, SQL을 돌려주지 않는다

## 3. 폴더 `제안`
```
src/
  app/                      화면 (App Router). 화면 ID(S-xx)별 폴더
    (game)/room/[code]/     대기실 ~ 해설 (단계에 따라 그리는 한 화면)
  components/               공용 UI (DESIGN.md 규칙)
  server/                   서버만. 파일 맨 위 import 'server-only'
    actions/                Server Action (spec §4의 동작 하나에 파일 하나)
    db.ts                   service role 클라이언트 (여기서만 만든다)
    reads.ts                getRoomState, getMine, getReveal
    phase.ts                단계 표와 advance 규칙 (순수 함수 + 테스트)
    assign.ts               배정 (CAG + 규칙 검사, spec §5)
  lib/
    supabase/client.ts      브라우저용 (anon 키)
    supabase/server.ts      세션 읽기용 (@supabase/ssr)
    schemas.ts              zod 입력 스키마
scenarios/live-death.json   시나리오 (data §4)
supabase/migrations/        001_core.sql, 002_rls.sql, 003_functions.sql (data §7)
tests/                      단위, RLS(두 사용자 세션), 단계 진행
```
- `src/server/` 밖에서 `SUPABASE_SERVICE_ROLE_KEY` 를 읽지 않는다
- 갈아탈 신호: Server Action이 15개를 넘거나 화면 하나가 300줄을 넘으면 폴더를 더 나눈다

## 4. 데이터
- 표와 RLS는 [docs/data.md](docs/data.md) §2~3 그대로. 새 표, 새 열은 data 문서를 먼저 바꾸고(Hatch) 마이그레이션을 쓴다
- 마이그레이션은 번호 순서로 추가만 한다. 머지된 마이그레이션 파일은 고치지 않는다
- RLS 테스트는 두 사용자 세션으로 서로의 `assignments`, `votes`, `game_secrets` 를 읽어 0줄 (AC-030)
- 정기 작업은 Supabase `pg_cron` 이 DB 함수를 부른다. 함수는 security definer 이고 앱 역할(anon, authenticated, service_role)에는 실행 권한을 주지 않는다. 외부에서 부르는 주소와 비밀 값이 없다
- 원격 Supabase 에 `pg_cron` 확장이 켜져 있어야 한다

| job | 언제 | 하는 일 |
| --- | --- | --- |
| `ikujo-cleanup` | 매일 18:00 UTC (한국 03:00) | `cleanup_stale_and_old()`: 24시간 활동 없는 방과 판을 끝내고, 30일 지난 방과 익명 사용자를 지운다 (data §6, `009_cleanup.sql`, #74) |

## 5. 테스트와 확인
| 무엇 | 어떻게 |
| --- | --- |
| 단계 규칙, 집계, 배정 검사 | 순수 함수 단위 테스트 (vitest) |
| 권한 | 로컬 Supabase(`supabase start`) + 두 세션 RLS 테스트 |
| 여러 폰 | 브라우저 창 3개 이상(390×844)으로 같은 방. 단계가 2초 안에 같이 바뀌는지 (NFR-001) |
| 다시 열기 | 라운드 중 새로 고침 → 같은 단계, 내 단서 (AC-NFR-002) |

PR 전에 `npm run typecheck && npm run lint && npm test`.

## 6. 정해지지 않은 것
모델(OQ-003), 모두 준비 시 먼저 넘기기(OQ-007) 등은 [docs/spec.md](docs/spec.md) §9의 임시 결정대로 하고 코드 주석에 OQ 번호를 남긴다.
