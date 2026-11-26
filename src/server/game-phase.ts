// advance, ready 의 서버 본체. db 클라이언트(service role)와 로그인한 사용자 id 를 받는다.
// Server Action(src/server/actions/phase.ts)이 세션을 확인한 뒤 부르고, 테스트는 로컬 DB 로 바로 부른다.
import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import scenario from "../../scenarios/live-death.json";
import {
  canAdvance,
  decideTally,
  endsAtFor,
  isVotePhase,
  roundOf,
  voteRound,
  type Phase,
} from "./phase";
import { broadcast } from "./realtime";

export type PhaseResult =
  | {
      ok: true;
      advanced: boolean;
      // 안 넘어간 이유 (canAdvance 그대로). 폰은 too_early 일 때만 다시 시도한다
      reason?: "stale" | "no_next" | "too_early";
      phase: Phase;
      endsAt: string | null;
      serverNow: string;
    }
  | { error: string };

export type ReadyResult =
  { ok: true; ready: number; total: number; serverNow: string } | { error: string };

export type GameRow = {
  id: string;
  room_id: string;
  phase: Phase;
  phase_ends_at: string | null;
  revote_candidates: string[] | null;
};

export async function loadGameForMember(db: SupabaseClient, gameId: string, userId: string) {
  const { data: game } = await db
    .from("games")
    .select("id, room_id, phase, phase_ends_at, revote_candidates")
    .eq("id", gameId)
    .maybeSingle<GameRow>();
  if (!game) return null;
  const { data: player } = await db
    .from("players")
    .select("id")
    .eq("room_id", game.room_id)
    .eq("user_id", userId)
    .is("left_at", null)
    .maybeSingle<{ id: string }>();
  if (!player) return null;
  return { game, playerId: player.id };
}

/** 이 판의 유령(희생자) player id */
export async function ghostPlayerIds(db: SupabaseClient, gameId: string): Promise<string[]> {
  const { data } = await db
    .from("assignments")
    .select("player_id")
    .eq("game_id", gameId)
    .eq("is_ghost", true)
    .returns<{ player_id: string }[]>();
  return (data ?? []).map((r) => r.player_id);
}

/**
 * 투표할 사람 수와 투표한 수. 투표할 사람은 살아 있고(유령 아님, AC-053) 나가지 않은 사람 (BR-011).
 * 투표 중 다시 들어오면 left_at 이 비워져 다시 분모에 들어간다.
 * 나간 사람이 낸 표는 투표 수에서 빼서 분모와 같은 기준으로 센다 (판정은 tally 가 같은 기준, 006)
 */
export async function voteCounts(db: SupabaseClient, game: GameRow, phase: "vote" | "revote") {
  const [players, ghosts, votes] = await Promise.all([
    db
      .from("players")
      .select("id")
      .eq("room_id", game.room_id)
      .is("left_at", null)
      .returns<{ id: string }[]>(),
    ghostPlayerIds(db, game.id),
    db
      .from("votes")
      .select("voter_player_id")
      .eq("game_id", game.id)
      .eq("round", voteRound(phase))
      .returns<{ voter_player_id: string }[]>(),
  ]);
  const voters = new Set(
    (players.data ?? []).map((p) => p.id).filter((id) => !ghosts.includes(id)),
  );
  const voted = (votes.data ?? []).filter((v) => voters.has(v.voter_player_id)).length;
  return { total: voters.size, ready: voted };
}

// 지금 남아 있는 참가자 수와 이 단계에서 누른 사람 수. 투표 단계는 투표할 사람 수와 투표한 수
async function readyCounts(db: SupabaseClient, game: GameRow, phase: Phase) {
  if (isVotePhase(phase)) return voteCounts(db, game, phase);
  const [players, readies] = await Promise.all([
    db
      .from("players")
      .select("id", { count: "exact", head: true })
      .eq("room_id", game.room_id)
      .is("left_at", null),
    db
      .from("readies")
      .select("player_id", { count: "exact", head: true })
      .eq("game_id", game.id)
      .eq("phase", phase),
  ]);
  return { total: players.count ?? 0, ready: readies.count ?? 0 };
}

export async function advancePhase(
  db: SupabaseClient,
  userId: string,
  gameId: string,
  from: Phase,
  now: Date = new Date(),
): Promise<PhaseResult> {
  const serverNow = now.toISOString();
  const found = await loadGameForMember(db, gameId, userId);
  if (!found) return { error: "이 판의 참가자가 아니에요." };
  const { game } = found;

  const { ready, total } = await readyCounts(db, game, game.phase);
  const decision = canAdvance({
    current: game.phase,
    from,
    endsAt: game.phase_ends_at ? new Date(game.phase_ends_at) : null,
    now,
    readyCount: ready,
    playerCount: total,
  });
  if (!decision.ok) {
    return {
      ok: true,
      advanced: false,
      reason: decision.reason,
      phase: game.phase,
      endsAt: game.phase_ends_at,
      serverNow,
    };
  }

  let to = decision.to;
  const judged = isVotePhase(game.phase) ? await judge(db, game, game.phase) : null;
  if (judged) to = judged.to;
  const endsAt = endsAtFor(to, now)?.toISOString() ?? null;
  // where phase = from: 여러 폰이 동시에 불러도 한 번만 바뀐다 (spec §1.1).
  // 판정도 이 한 번의 update 에 같이 쓰므로, 마지막 두 표가 동시에 와도 판정은 한 번만 남는다
  const { data: updated, error } = await db
    .from("games")
    .update({
      phase: to,
      phase_started_at: serverNow,
      phase_ends_at: endsAt,
      ...(judged?.fields ?? {}),
    })
    .eq("id", gameId)
    .eq("phase", from)
    .select("id");
  if (error) return { error: "단계를 넘기지 못했어요. 잠시 뒤 다시 시도해 주세요." };
  if (!updated || updated.length === 0) {
    const { data: latest } = await db
      .from("games")
      .select("phase, phase_ends_at")
      .eq("id", gameId)
      .single<{ phase: Phase; phase_ends_at: string | null }>();
    return {
      ok: true,
      advanced: false,
      reason: "stale",
      phase: latest?.phase ?? from,
      endsAt: latest?.phase_ends_at ?? null,
      serverNow,
    };
  }

  // 아래는 이 단계를 넘긴 한 번의 호출만 한다
  const round = roundOf(to);
  if (round) {
    // r3 반전 단서는 범인 후보마다 하나씩 있어서, 이번 판 범인을 가리키는 것만 연다 (BR-009, spec §5).
    // 범인은 서버 안에서만 쓰고 응답이나 신호에 싣지 않는다
    let culprit: string | null = null;
    if (round === 3) {
      const { data: secret } = await db
        .from("game_secrets")
        .select("culprit_character")
        .eq("game_id", gameId)
        .maybeSingle<{ culprit_character: string }>();
      culprit = secret?.culprit_character ?? null;
    }
    const clues = scenario.clues
      .filter((c) => c.round === round && c.visibility === "public")
      .filter((c) => round !== 3 || (culprit !== null && (c.pointsTo ?? []).includes(culprit)))
      .map((c) => ({ game_id: gameId, clue_id: c.id, round, revealed_at: serverNow }));
    if (clues.length > 0) {
      await db
        .from("revealed_clues")
        .upsert(clues, { onConflict: "game_id,clue_id", ignoreDuplicates: true });
    }
  }
  if (to === "r2") {
    // 희생자가 유령이 된다 (spec §4)
    const { data: secret } = await db
      .from("game_secrets")
      .select("victim_player_id")
      .eq("game_id", gameId)
      .maybeSingle<{ victim_player_id: string }>();
    if (secret) {
      await db
        .from("assignments")
        .update({ is_ghost: true })
        .eq("game_id", gameId)
        .eq("player_id", secret.victim_player_id);
    }
  }

  if (judged) {
    // 기록 (spec §7). 누가 누구를 찍었는지, 누가 지목됐는지는 넣지 않는다 (BR-001)
    const round = voteRound(judged.from);
    await logEvent(db, "vote_done", game, { round, votes: judged.votes, voters: judged.voters });
    if (to === "revote") {
      await logEvent(db, "revote", game, { candidates: judged.fields.revote_candidates?.length });
    }
  }

  await broadcast(db, game.room_id, { type: "phase", phase: to, endsAt });
  return { ok: true, advanced: true, phase: to, endsAt, serverNow };
}

type Judged = {
  from: "vote" | "revote";
  to: "revote" | "reveal";
  votes: number;
  voters: number;
  fields: { revote_candidates?: string[]; outcome?: "caught" | "aired_off" };
};

// 투표를 tally 로 판정한다 (spec S-11). 안 찍은 사람은 기권 (BR-007). 나간 사람의 표는 tally 가 뺀다 (006)
// 결과(지목된 사람, 범인)는 games.outcome 과 revote_candidates 로만 남기고 응답이나 신호에 싣지 않는다 (BR-001)
async function judge(db: SupabaseClient, game: GameRow, phase: "vote" | "revote"): Promise<Judged> {
  const [tally, counts] = await Promise.all([
    db.rpc("tally", { p_game_id: game.id, p_round: voteRound(phase) }),
    voteCounts(db, game, phase),
  ]);
  if (tally.error) throw tally.error;
  const decision = decideTally(
    phase,
    ((tally.data ?? []) as { target_player_id: string }[]).map((r) => r.target_player_id),
  );
  const base = { from: phase, votes: counts.ready, voters: counts.total };
  if (decision.to === "revote") {
    return { ...base, to: "revote", fields: { revote_candidates: decision.candidates } };
  }
  // 지목된 사람이 범인이면 검거, 아니면(지목 없음 포함) 방송 중단 (FR-061, OQ-008)
  let outcome: "caught" | "aired_off" = "aired_off";
  if (decision.accused) {
    const { data: secret } = await db
      .from("game_secrets")
      .select("culprit_player_id")
      .eq("game_id", game.id)
      .maybeSingle<{ culprit_player_id: string }>();
    if (secret?.culprit_player_id === decision.accused) outcome = "caught";
  }
  return { ...base, to: "reveal", fields: { outcome } };
}

async function logEvent(
  db: SupabaseClient,
  name: string,
  game: GameRow,
  props: Record<string, unknown>,
) {
  // 기록이 실패해도 동작은 계속한다
  await db.from("events").insert({ name, room_id: game.room_id, game_id: game.id, props });
}

export async function markReady(
  db: SupabaseClient,
  userId: string,
  gameId: string,
  phase: Phase,
  now: Date = new Date(),
): Promise<ReadyResult> {
  const serverNow = now.toISOString();
  const found = await loadGameForMember(db, gameId, userId);
  if (!found) return { error: "이 판의 참가자가 아니에요." };
  const { game, playerId } = found;
  if (game.phase !== phase) return { error: "이미 다음 단계로 넘어갔어요." };

  // (game_id, player_id, phase) 가 기본 키라 여러 번 눌러도 한 줄
  const { error } = await db
    .from("readies")
    .upsert(
      { game_id: gameId, player_id: playerId, phase, at: serverNow },
      { onConflict: "game_id,player_id,phase", ignoreDuplicates: true },
    );
  if (error) return { error: "준비를 저장하지 못했어요. 잠시 뒤 다시 시도해 주세요." };

  const { ready, total } = await readyCounts(db, game, phase);
  await broadcast(db, game.room_id, { type: "count", ready });
  // 모두 눌렀으면 그 자리에서 넘긴다. 넘길지는 canAdvance 가 정한다 (r1~r3 은 시간 전엔 안 넘어감, OQ-007)
  if (total > 0 && ready >= total) await advancePhase(db, userId, gameId, phase, now);
  return { ok: true, ready, total, serverNow };
}
