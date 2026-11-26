// vote 의 서버 본체 (spec §4 vote, S-11). db 클라이언트(service role)와 로그인한 사용자 id 를 받는다.
// Server Action(src/server/actions/vote.ts)이 세션을 확인한 뒤 부르고, 테스트는 로컬 DB 로 바로 부른다.
import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  advancePhase,
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
 *   게임 중 나간 사람도 후보에 남긴다 `제안` (#46): 문서에는 "나간 사람은 기권"(BR-011)만 있고,
 *   나간 사람이 범인일 수 있어서 빼지 않는다
 * revote: vote 동점자만 (AC-060-2)
 */
export async function voteCandidates(
  db: SupabaseClient,
  game: GameRow,
  phase: "vote" | "revote",
): Promise<string[]> {
  if (phase === "revote") return game.revote_candidates ?? [];
  const [players, ghosts] = await Promise.all([
    db
      .from("players")
      .select("id")
      .eq("room_id", game.room_id)
      .order("seat")
      .returns<{ id: string }[]>(),
    ghostPlayerIds(db, game.id),
  ]);
  return (players.data ?? []).map((p) => p.id).filter((id) => !ghosts.includes(id));
}

export async function castVote(
  db: SupabaseClient,
  userId: string,
  gameId: string,
  targetPlayerId: string,
  now: Date = new Date(),
): Promise<VoteResult> {
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

  // (game_id, round, voter) 가 기본 키라 한 번만. 보내면 바꿀 수 없다 `제안` (S-11)
  const { error } = await db.from("votes").insert({
    game_id: gameId,
    round: voteRound(phase),
    voter_player_id: playerId,
    target_player_id: targetPlayerId,
    at: now.toISOString(),
  });
  if (error) {
    return error.code === "23505"
      ? { error: "이미 투표했어요." }
      : { error: "투표를 저장하지 못했어요. 잠시 뒤 다시 시도해 주세요." };
  }

  // 공용에는 완료 인원만 (AC-060). 누가 누구를 찍었는지는 싣지 않는다
  const { ready: votes, total } = await voteCounts(db, game, phase);
  await broadcast(db, game.room_id, { type: "count", votes });
  // 모두 투표했으면 그 자리에서 판정한다. 넘길지와 한 번만 넘기는 것은 advancePhase 가 맡는다
  if (total > 0 && votes >= total) await advancePhase(db, userId, gameId, phase, now);
  return { ok: true, votes, total };
}
