// RoomStore 실제 구현: service role 로 쓴다 (ARCHITECTURE.md §2). 서버만.
import "server-only";
import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import {
  UniqueViolation,
  type AssignmentRow,
  type GameRow,
  type JoinResult,
  type NewGame,
  type PlayerRow,
  type RoomRow,
  type RoomStore,
} from "./store";

type Db = SupabaseClient;

const ROOM_COLS = "id, code, status, host_player_id";
const PLAYER_COLS = "id, room_id, user_id, is_guest, nickname, seat, left_at";
const GAME_COLS = "id, phase, phase_ends_at";

type RoomDb = {
  id: string;
  code: string;
  status: RoomRow["status"];
  host_player_id: string | null;
};
type PlayerDb = {
  id: string;
  room_id: string;
  user_id: string;
  is_guest: boolean;
  nickname: string;
  seat: number;
  left_at: string | null;
};
type GameDb = { id: string; phase: string; phase_ends_at: string | null };

const toRoom = (r: RoomDb): RoomRow => ({
  id: r.id,
  code: r.code,
  status: r.status,
  hostPlayerId: r.host_player_id,
});
const toPlayer = (p: PlayerDb): PlayerRow => ({
  id: p.id,
  roomId: p.room_id,
  userId: p.user_id,
  isGuest: p.is_guest,
  nickname: p.nickname,
  seat: p.seat,
  leftAt: p.left_at,
});
const toGame = (g: GameDb): GameRow => ({ id: g.id, phase: g.phase, phaseEndsAt: g.phase_ends_at });

// 001_core.sql 의 unique 제약 이름 → 무엇이 겹쳤나
const UNIQUE_NAMES: [string, UniqueViolation["target"]][] = [
  ["rooms_code_active_key", "code"],
  ["players_room_id_seat_key", "seat"],
  ["players_room_id_user_id_key", "user"],
  ["ghost_actions_one_haunt_key", "haunt"],
  ["ghost_actions_one_whisper_per_round_key", "whisper"],
];

function check(error: PostgrestError | null): void {
  if (!error) return;
  if (error.code === "23505") {
    const hit = UNIQUE_NAMES.find(([name]) => `${error.message} ${error.details}`.includes(name));
    if (hit) throw new UniqueViolation(hit[1]);
  }
  // 스택, SQL 은 화면으로 돌려주지 않는다. 동작 쪽에서 한 줄 안내로 바꾼다 (ARCHITECTURE.md §2-5)
  throw new Error(`db: ${error.code} ${error.message}`);
}

export function supabaseRoomStore(db: Db): RoomStore {
  return {
    async findActiveRoomByCode(code) {
      const { data, error } = await db
        .from("rooms")
        .select(ROOM_COLS)
        .eq("code", code)
        .neq("status", "ended")
        .maybeSingle<RoomDb>();
      check(error);
      return data ? toRoom(data) : null;
    },

    async getRoom(roomId) {
      const { data, error } = await db
        .from("rooms")
        .select(ROOM_COLS)
        .eq("id", roomId)
        .maybeSingle<RoomDb>();
      check(error);
      return data ? toRoom(data) : null;
    },

    async insertRoom(code) {
      const { data, error } = await db
        .from("rooms")
        .insert({ code })
        .select(ROOM_COLS)
        .single<RoomDb>();
      check(error);
      return toRoom(data!);
    },

    async setHost(roomId, playerId) {
      const { error } = await db
        .from("rooms")
        .update({ host_player_id: playerId })
        .eq("id", roomId);
      check(error);
    },

    async updateRoomStatus(roomId, from, to) {
      const { data, error } = await db
        .from("rooms")
        .update({ status: to, ended_at: to === "ended" ? new Date().toISOString() : null })
        .eq("id", roomId)
        .eq("status", from)
        .select("id");
      check(error);
      return (data ?? []).length > 0;
    },

    async listPlayers(roomId) {
      const { data, error } = await db
        .from("players")
        .select(PLAYER_COLS)
        .eq("room_id", roomId)
        .order("seat")
        .returns<PlayerDb[]>();
      check(error);
      return (data ?? []).map(toPlayer);
    },

    async insertPlayer(p) {
      const { data, error } = await db
        .from("players")
        .insert({
          room_id: p.roomId,
          user_id: p.userId,
          is_guest: p.isGuest,
          nickname: p.nickname,
          seat: p.seat,
        })
        .select(PLAYER_COLS)
        .single<PlayerDb>();
      check(error);
      return toPlayer(data!);
    },

    async deletePlayer(playerId) {
      const { error } = await db.from("players").delete().eq("id", playerId);
      check(error);
    },

    async setPlayerLeftAt(playerId, leftAt) {
      const { error } = await db.from("players").update({ left_at: leftAt }).eq("id", playerId);
      check(error);
    },

    async joinRoom({ code, userId, isGuest, nickname }) {
      const { data, error } = await db
        .rpc("join_room", {
          p_code: code,
          p_user_id: userId,
          p_is_guest: isGuest,
          p_nickname: nickname,
        })
        .single<{
          result: JoinResult["result"];
          room_id: string | null;
          room_code: string | null;
        }>();
      check(error);
      const row = data!;
      if (row.result === "not_found") return { result: "not_found" };
      return { result: row.result, roomId: row.room_id!, code: row.room_code! };
    },

    async createGame(game: NewGame) {
      const { data, error } = await db
        .from("games")
        .insert({
          room_id: game.roomId,
          player_count: game.playerCount,
          phase: game.phase,
          phase_ends_at: game.phaseEndsAt,
          assignment_source: game.assignmentSource,
        })
        .select(GAME_COLS)
        .single<GameDb>();
      check(error);
      const created = toGame(data!);
      try {
        check(
          (
            await db.from("game_secrets").insert({
              game_id: created.id,
              culprit_player_id: game.secret.culpritPlayerId,
              victim_player_id: game.secret.victimPlayerId,
              culprit_character: game.secret.culpritCharacter,
              ghost_trait: game.secret.ghostTrait,
              llm_raw: game.secret.llmRaw ?? null,
            })
          ).error,
        );
        check(
          (
            await db.from("assignments").insert(
              game.assignments.map((a) => ({
                game_id: created.id,
                player_id: a.playerId,
                character_id: a.characterId,
                secret_id: a.secretId,
                alibi_id: a.alibiId,
                is_culprit: a.isCulprit,
                clue_ids: a.clueIds,
              })),
            )
          ).error,
        );
      } catch (e) {
        // 반쯤 만든 판을 남기지 않는다 (game_secrets, assignments 는 cascade)
        await db.from("games").delete().eq("id", created.id);
        throw e;
      }
      return created;
    },

    async latestGame(roomId) {
      const { data, error } = await db
        .from("games")
        .select(GAME_COLS)
        .eq("room_id", roomId)
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle<GameDb>();
      check(error);
      return data ? toGame(data) : null;
    },

    async getGame(gameId) {
      const { data, error } = await db
        .from("games")
        .select(`${GAME_COLS}, room_id`)
        .eq("id", gameId)
        .maybeSingle<GameDb & { room_id: string }>();
      check(error);
      return data ? { ...toGame(data), roomId: data.room_id } : null;
    },

    async listRevealedClues(gameId) {
      const { data, error } = await db
        .from("revealed_clues")
        .select("clue_id, round")
        .eq("game_id", gameId)
        .order("revealed_at")
        .returns<{ clue_id: string; round: number }[]>();
      check(error);
      return (data ?? []).map((c) => ({ clueId: c.clue_id, round: c.round }));
    },

    async listReadyPlayerIds(gameId, phase) {
      const { data, error } = await db
        .from("readies")
        .select("player_id")
        .eq("game_id", gameId)
        .eq("phase", phase)
        .returns<{ player_id: string }[]>();
      check(error);
      return (data ?? []).map((r) => r.player_id);
    },

    async getVoteInfo(gameId, round) {
      const [votes, game] = await Promise.all([
        db
          .from("votes")
          .select("voter_player_id")
          .eq("game_id", gameId)
          .eq("round", round)
          .returns<{ voter_player_id: string }[]>(),
        db
          .from("games")
          .select("revote_candidates")
          .eq("id", gameId)
          .maybeSingle<{ revote_candidates: string[] | null }>(),
      ]);
      check(votes.error);
      check(game.error);
      return {
        votedPlayerIds: (votes.data ?? []).map((v) => v.voter_player_id),
        revoteCandidates: game.data?.revote_candidates ?? [],
      };
    },

    async getAssignment(gameId, playerId) {
      const { data, error } = await db
        .from("assignments")
        .select("character_id, secret_id, alibi_id, is_culprit, clue_ids, is_ghost")
        .eq("game_id", gameId)
        .eq("player_id", playerId)
        .maybeSingle<{
          character_id: string;
          secret_id: string;
          alibi_id: string;
          is_culprit: boolean;
          clue_ids: AssignmentRow["clueIds"] | null;
          is_ghost: boolean;
        }>();
      check(error);
      if (!data) return null;
      return {
        characterId: data.character_id,
        secretId: data.secret_id,
        alibiId: data.alibi_id,
        isCulprit: data.is_culprit,
        clueIds: data.clue_ids ?? {},
        isGhost: data.is_ghost,
      };
    },

    async getGhost(gameId) {
      const { data, error } = await db
        .from("assignments")
        .select("player_id, character_id")
        .eq("game_id", gameId)
        .eq("is_ghost", true)
        .limit(1)
        .maybeSingle<{ player_id: string; character_id: string }>();
      check(error);
      return data ? { playerId: data.player_id, characterId: data.character_id } : null;
    },

    async getGhostTrait(gameId) {
      const { data, error } = await db
        .from("game_secrets")
        .select("ghost_trait")
        .eq("game_id", gameId)
        .maybeSingle<{ ghost_trait: string }>();
      check(error);
      return data?.ghost_trait ?? null;
    },

    async getCulpritCharacter(gameId) {
      const { data, error } = await db
        .from("game_secrets")
        .select("culprit_character")
        .eq("game_id", gameId)
        .maybeSingle<{ culprit_character: string }>();
      check(error);
      return data?.culprit_character ?? null;
    },

    async updateGamePhase(gameId, from, to) {
      const { data, error } = await db
        .from("games")
        .update({ phase: to, phase_started_at: new Date().toISOString(), phase_ends_at: null })
        .eq("id", gameId)
        .eq("phase", from)
        .select("id");
      check(error);
      return (data ?? []).length > 0;
    },

    async listGhostActions(gameId) {
      const { data, error } = await db
        .from("ghost_actions")
        .select("id, kind, from_player_id, to_player_id, round, body")
        .eq("game_id", gameId)
        .order("at")
        .returns<
          {
            id: number;
            kind: "whisper" | "haunt";
            from_player_id: string;
            to_player_id: string | null;
            round: number;
            body: string | null;
          }[]
        >();
      check(error);
      return (data ?? []).map((a) => ({
        id: String(a.id),
        kind: a.kind,
        fromPlayerId: a.from_player_id,
        toPlayerId: a.to_player_id,
        round: a.round,
        // 판이 끝나면 body 를 지운다 (data §2 `제안`)
        body: a.body ?? "",
      }));
    },

    async insertGhostAction(a) {
      const { error } = await db.from("ghost_actions").insert({
        game_id: a.gameId,
        kind: a.kind,
        from_player_id: a.fromPlayerId,
        to_player_id: a.toPlayerId,
        round: a.round,
        body: a.body,
      });
      check(error);
    },

    async logEvent(name, { roomId, gameId, ...props }) {
      // 기록이 실패해도 동작은 계속한다
      await db
        .from("events")
        .insert({ name, room_id: roomId ?? null, game_id: gameId ?? null, props });
    },
  };
}
