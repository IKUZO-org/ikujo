// vote 의 서버 본체 (spec §4 vote, S-11). db 클라이언트(service role)와 로그인한 사용자 id 를 받는다.
// Server Action(src/server/actions/vote.ts)이 세션을 확인한 뒤 부르고, 테스트는 로컬 DB 로 바로 부른다.
import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  advancePhase,
  assignedPlayerIds,
  ghostPlayerIds,
  loadGameForMember,
  voteCounts,
  type GameRow,
} from "./game-phase";
import { isVotePhase, voteRound } from "./phase";
import { broadcast } from "./realtime";

export type VoteResult = { ok: true; votes: number; total: number } | { error: string };

/**
 * 후보 (spec S-11). 유령은 후보가 아니다 (AC-053).
 * vote: 유령이 아닌 참가자 전부. 나 포함 `제안`(S-11).
 *   게임 중 나간 사람도 후보에 남긴다 (D-021, AC-BR-011-2)
 * revote: vote 동점자만 (AC-060-2)
 */
export async function voteCandidates(
  db: SupabaseClient,
  game: GameRow,
  phase: "vote" | "revote",
): Promise<string[]> {
  if (phase === "revote") return game.revote_candidates ?? [];
  const [players, ghosts, assigned] = await Promise.all([
    db
      .from("players")
      .select("id")
      .eq("room_id", game.room_id)
      .order("seat")
      .returns<{ id: string }[]>(),
    ghostPlayerIds(db, game.id),
    assignedPlayerIds(db, game.id),
  ]);
  // 이 판에 배정된 사람만 (다시 하기 전 판에 나간 사람은 빠진다, D-023)
  return (players.data ?? [])
    .map((p) => p.id)
    .filter((id) => assigned.includes(id) && !ghosts.includes(id));
}

export async function castVote(
  db: SupabaseClient,
  userId: string,
  gameId: string,
  targetPlayerId: string,
  now: Date = new Date(),
): Promise<VoteResult> {
  // 나간 사람(left_at)은 여기서 걸러져 투표할 수 없다 (BR-011). 다시 들어오면 join_room 이 left_at 을 비운다
  const found = await loadGameForMember(db, gameId, userId);
  if (!found) return { error: "이 판의 참가자가 아니에요." };
  const { game, playerId } = found;
  const phase = game.phase;
  if (!isVotePhase(phase)) return { error: "지금은 투표 시간이 아니에요." };
  if (game.phase_ends_at && now.getTime() >= new Date(game.phase_ends_at).getTime()) {
    return { error: "투표 시간이 끝났어요." };
  }

  const ghosts = await ghostPlayerIds(db, gameId);
  if (ghosts.includes(playerId)) return { error: "유령은 투표하지 않아요." };
  const candidates = await voteCandidates(db, game, phase);
  if (!candidates.includes(targetPlayerId)) return { error: "고를 수 없는 사람이에요." };

  // (game_id, round, voter) 가 기본 키라 한 번만, 보내면 바꿀 수 없다 (S-11). 나갔다 돌아온 사람만 바꿀 수 있다 (D-022)
  const round = voteRound(phase);
  const { error } = await db.from("votes").insert({
    game_id: gameId,
    round,
    voter_player_id: playerId,
    target_player_id: targetPlayerId,
    at: now.toISOString(),
  });
  if (error && error.code !== "23505") {
    return { error: "투표를 저장하지 못했어요. 잠시 뒤 다시 시도해 주세요." };
  }
  if (error) {
    const changed = await changeVoteAfterRejoin(db, gameId, round, playerId, targetPlayerId, now);
    if (changed === "error")
      return { error: "투표를 저장하지 못했어요. 잠시 뒤 다시 시도해 주세요." };
    if (!changed) return { error: "이미 투표했어요." };
  }

  // 공용에는 완료 인원만 (AC-060). 누가 누구를 찍었는지는 싣지 않는다
  const { ready: votes, total } = await voteCounts(db, game, phase);
  // 모두 투표했으면 그 자리에서 판정한다. 넘길지와 한 번만 넘기는 것은 advancePhase 가 맡는다.
  // 넘겼으면 phase 신호로 충분해서 count 신호는 넘기지 못했을 때만 보낸다 (#135)
  let advanced = false;
  if (total > 0 && votes >= total) {
    const r = await advancePhase(db, userId, gameId, phase, now);
    advanced = "ok" in r && r.advanced;
  }
  if (!advanced) await broadcast(db, game.room_id, { type: "count", votes });
  return { ok: true, votes, total };
}

/**
 * 투표한 뒤 나갔다가 판정 전에 돌아온 사람만 표를 바꿀 수 있다 (D-022).
 * 표를 낸 시각(votes.at)이 돌아온 시각(players.rejoined_at, 007)보다 앞일 때만 바뀐다.
 * 판정 뒤에는 phase 가 넘어가 castVote 가 먼저 거절한다.
 */
async function changeVoteAfterRejoin(
  db: SupabaseClient,
  gameId: string,
  round: number,
  playerId: string,
  targetPlayerId: string,
  now: Date,
): Promise<boolean | "error"> {
  const { data: me } = await db
    .from("players")
    .select("rejoined_at")
    .eq("id", playerId)
    .maybeSingle<{ rejoined_at: string | null }>();
  if (!me?.rejoined_at) return false;
  const rejoinedAt = new Date(me.rejoined_at).getTime();
  // at 이 rejoined_at 보다 뒤여야 다시 나갔다 오기 전까지 또 바꾸지 못한다.
  // votes.at 은 서버(Node) 시각, rejoined_at 은 DB now() 라 둘 사이 시계 차이를 1ms 로 넘긴다
  const at = new Date(Math.max(now.getTime(), rejoinedAt + 1)).toISOString();
  // 조건은 update 안에서 본다 (읽고 비교하면 동시에 두 번 바꿀 수 있다)
  const { data, error } = await db
    .from("votes")
    .update({ target_player_id: targetPlayerId, at })
    .eq("game_id", gameId)
    .eq("round", round)
    .eq("voter_player_id", playerId)
    .lt("at", me.rejoined_at)
    .select("voter_player_id");
  if (error) return "error";
  return (data ?? []).length > 0;
}
