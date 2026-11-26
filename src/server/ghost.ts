// 유령 동작 (spec §4 whisper, haunt, S-10, FR-052, FR-053). Server Action(src/server/actions/ghost.ts)이
// 세션과 실제 DB 를 넣어 부르고, 테스트는 가짜 저장소를 넣는다.
// 누가 유령인지는 세션의 userId → 플레이어 → assignments.is_ghost 로 서버가 정한다. 클라이언트가 보낸 역할을 믿지 않는다 (SECURITY.md §3).
import { z } from "zod";
import { ghostBodySchema } from "@/lib/schemas";
import { MSG, roundNumber, type Deps, type Result } from "./rooms/core";
import { UniqueViolation } from "./rooms/store";

export const GHOST_MSG = {
  notGhost: "유령만 할 수 있어요",
  notNow: "지금은 할 수 없어요",
  target: "살아 있는 사람에게만 속삭일 수 있어요",
  whisperUsed: "이번 라운드에는 이미 속삭였어요",
  hauntUsed: "출몰은 한 번만 할 수 있어요",
} as const;

const fail = (error: string) => ({ error });

const whisperInput = z.object({ gameId: z.uuid(), toPlayerId: z.uuid(), body: ghostBodySchema });
const hauntInput = z.object({ gameId: z.uuid(), body: ghostBodySchema });

/** 이 판의 유령 본인인지, 지금 라운드(r2, r3)인지 확인하고 나와 라운드를 돌려준다 */
async function ghostOf(deps: Deps, gameId: string) {
  const { store, user } = deps;
  const game = await store.getGame(gameId);
  if (!game) return fail(MSG.notFound);
  const players = await store.listPlayers(game.roomId);
  const me = players.find((p) => p.userId === user.id && !p.leftAt);
  if (!me) return fail(MSG.notMember);
  const mine = await store.getAssignment(game.id, me.id);
  if (!mine?.isGhost) return fail(GHOST_MSG.notGhost);
  // 유령은 r2 부터 (FR-050). 투표부터는 유령 동작이 없다: 출몰 "시기 자유" 를 라운드 안으로 둔다 (spec S-10)
  const round = roundNumber(game.phase);
  if (round === null || round < 2) return fail(GHOST_MSG.notNow);
  return { game, me, players, round };
}

/** 속삭임: 살아 있는 한 명에게 1~80자. 라운드당 1번 (OQ-005 임시 결정, spec §9) */
export async function whisper(
  deps: Deps,
  raw: { gameId: string; toPlayerId: string; body: string },
): Promise<Result<object>> {
  const parsed = whisperInput.safeParse(raw);
  if (!parsed.success) {
    const bodyIssue = parsed.error.issues.find((i) => i.path[0] === "body");
    return fail(bodyIssue?.message ?? GHOST_MSG.target);
  }
  const found = await ghostOf(deps, parsed.data.gameId);
  if ("error" in found) return found;
  const { game, me, players, round } = found;

  // 대상: 같은 방, 나가지 않음, 나(유령) 아님, 이 판의 배정이 있음 (spec §4 "대상 생존")
  const target = players.find((p) => p.id === parsed.data.toPlayerId);
  if (!target || target.leftAt || target.id === me.id) return fail(GHOST_MSG.target);
  const targetAssignment = await deps.store.getAssignment(game.id, target.id);
  if (!targetAssignment || targetAssignment.isGhost) return fail(GHOST_MSG.target);

  try {
    await deps.store.insertGhostAction({
      gameId: game.id,
      kind: "whisper",
      fromPlayerId: me.id,
      toPlayerId: target.id,
      round,
      body: parsed.data.body,
    });
  } catch (e) {
    // 동시에 두 번 눌러도 DB 가 한 줄만 남긴다 (005_ghost.sql)
    if (e instanceof UniqueViolation && e.target === "whisper") return fail(GHOST_MSG.whisperUsed);
    throw e;
  }
  // 글 내용, 받은 사람은 기록하지 않는다 (data §2 events)
  await deps.store.logEvent("ghost_whisper", { roomId: game.roomId, gameId: game.id, round });
  // 신호는 보내지 않는다: 속삭임이 있었다는 것 자체를 다른 폰에 알리지 않게.
  // 받은 사람 폰은 라운드 동안 getMine 을 주기적으로 다시 읽어 받는다 (use-mine.ts)
  return { ok: true };
}

/** 출몰: 판 전체에서 1번 (AC-053). 모든 폰에 "생방송 연결" 덮는 화면 + 유령의 말 (FR-053) */
export async function haunt(
  deps: Deps,
  raw: { gameId: string; body: string },
): Promise<Result<object>> {
  const parsed = hauntInput.safeParse(raw);
  if (!parsed.success) {
    const bodyIssue = parsed.error.issues.find((i) => i.path[0] === "body");
    return fail(bodyIssue?.message ?? MSG.notFound);
  }
  const found = await ghostOf(deps, parsed.data.gameId);
  if ("error" in found) return found;
  const { game, me, round } = found;

  try {
    await deps.store.insertGhostAction({
      gameId: game.id,
      kind: "haunt",
      fromPlayerId: me.id,
      toPlayerId: null,
      round,
      body: parsed.data.body,
    });
  } catch (e) {
    // 판에 1번은 DB unique 가 막는다 (001_core.sql ghost_actions_one_haunt_key)
    if (e instanceof UniqueViolation && e.target === "haunt") return fail(GHOST_MSG.hauntUsed);
    throw e;
  }
  await deps.store.logEvent("ghost_haunt", { roomId: game.roomId, gameId: game.id, round });
  // 유령의 말은 모두에게 보이는 공용 글이다 (data §5 haunt 신호)
  await deps.broadcast(game.roomId, { type: "haunt", body: parsed.data.body });
  return { ok: true };
}
