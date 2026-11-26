// RoomStore 실제 구현: service role 로 쓴다 (ARCHITECTURE.md §2). 서버만.
import "server-only";
import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import {
  UniqueViolation,
  type AssignmentRow,
  type GameRow,
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

    async getAssignment(gameId, playerId) {
      const { data, error } = await db
        .from("assignments")
        .select("character_id, secret_id, alibi_id, is_culprit, clue_ids")
        .eq("game_id", gameId)
        .eq("player_id", playerId)
        .maybeSingle<{
          character_id: string;
          secret_id: string;
          alibi_id: string;
          is_culprit: boolean;
          clue_ids: AssignmentRow["clueIds"] | null;
        }>();
      check(error);
      if (!data) return null;
      return {
        characterId: data.character_id,
        secretId: data.secret_id,
        alibiId: data.alibi_id,
        isCulprit: data.is_culprit,
        clueIds: data.clue_ids ?? {},
      };
    },

    async logEvent(name, { roomId, gameId, ...props }) {
      // 기록이 실패해도 동작은 계속한다
      await db
        .from("events")
        .insert({ name, room_id: roomId ?? null, game_id: gameId ?? null, props });
    },
  };
}
