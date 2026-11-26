// 가짜 Supabase: RoomStore 를 메모리로. 001_core.sql 의 unique 제약을 똑같이 흉내 낸다.
import {
  UniqueViolation,
  type GameRow,
  type NewGame,
  type PlayerRow,
  type RoomRow,
  type RoomStore,
} from "@/server/rooms/store";

export type MemoryStore = RoomStore & {
  rooms: RoomRow[];
  players: PlayerRow[];
  games: (GameRow & { roomId: string; game: NewGame })[];
  events: { name: string; props: Record<string, unknown> }[];
  revealed: { gameId: string; clueId: string; round: number }[];
  readies: { gameId: string; playerId: string; phase: string }[];
  /** 다음 insertPlayer 직전에 끼어드는 일 (동시 입장 흉내) */
  beforeInsertPlayer?: () => void;
};

export function memoryStore(): MemoryStore {
  let n = 0;
  // 실제 DB처럼 uuid 모양 (Server Action 이 zod 로 uuid 를 검사한다)
  const id = () => `00000000-0000-4000-8000-${String(++n).padStart(12, "0")}`;
  const s: MemoryStore = {
    rooms: [],
    players: [],
    games: [],
    events: [],
    revealed: [],
    readies: [],

    async findActiveRoomByCode(code) {
      const r = s.rooms.find((x) => x.code === code && x.status !== "ended");
      return r ? { ...r } : null;
    },
    async getRoom(roomId) {
      const r = s.rooms.find((x) => x.id === roomId);
      return r ? { ...r } : null;
    },
    async insertRoom(code) {
      if (s.rooms.some((r) => r.code === code && r.status !== "ended"))
        throw new UniqueViolation("code");
      const room: RoomRow = { id: id(), code, status: "lobby", hostPlayerId: null };
      s.rooms.push(room);
      return { ...room };
    },
    async setHost(roomId, playerId) {
      s.rooms.find((r) => r.id === roomId)!.hostPlayerId = playerId;
    },
    async updateRoomStatus(roomId, from, to) {
      const room = s.rooms.find((r) => r.id === roomId);
      if (!room || room.status !== from) return false;
      room.status = to;
      return true;
    },
    async listPlayers(roomId) {
      return s.players
        .filter((p) => p.roomId === roomId)
        .sort((a, b) => a.seat - b.seat)
        .map((p) => ({ ...p }));
    },
    async insertPlayer(p) {
      const hook = s.beforeInsertPlayer;
      s.beforeInsertPlayer = undefined;
      hook?.();
      if (p.seat < 1 || p.seat > 6) throw new Error("check violation: seat");
      if (s.players.some((x) => x.roomId === p.roomId && x.userId === p.userId))
        throw new UniqueViolation("user");
      if (s.players.some((x) => x.roomId === p.roomId && x.seat === p.seat))
        throw new UniqueViolation("seat");
      const row: PlayerRow = { ...p, id: id(), leftAt: null };
      s.players.push(row);
      return { ...row };
    },
    async deletePlayer(playerId) {
      s.players = s.players.filter((p) => p.id !== playerId);
      for (const r of s.rooms) if (r.hostPlayerId === playerId) r.hostPlayerId = null; // on delete set null
    },
    async setPlayerLeftAt(playerId, leftAt) {
      s.players.find((p) => p.id === playerId)!.leftAt = leftAt;
    },
    async createGame(game) {
      const row = {
        id: id(),
        phase: game.phase,
        phaseEndsAt: game.phaseEndsAt,
        roomId: game.roomId,
        game,
      };
      s.games.push(row);
      return { id: row.id, phase: row.phase, phaseEndsAt: row.phaseEndsAt };
    },
    async latestGame(roomId) {
      const g = s.games.filter((x) => x.roomId === roomId).at(-1);
      return g ? { id: g.id, phase: g.phase, phaseEndsAt: g.phaseEndsAt } : null;
    },
    async getGame(gameId) {
      const g = s.games.find((x) => x.id === gameId);
      return g ? { id: g.id, phase: g.phase, phaseEndsAt: g.phaseEndsAt, roomId: g.roomId } : null;
    },
    async listRevealedClues(gameId) {
      return s.revealed
        .filter((c) => c.gameId === gameId)
        .map((c) => ({ clueId: c.clueId, round: c.round }));
    },
    async listReadyPlayerIds(gameId, phase) {
      return s.readies
        .filter((r) => r.gameId === gameId && r.phase === phase)
        .map((r) => r.playerId);
    },
    async getAssignment(gameId, playerId) {
      const g = s.games.find((x) => x.id === gameId);
      const a = g?.game.assignments.find((x) => x.playerId === playerId);
      if (!a) return null;
      return {
        characterId: a.characterId,
        secretId: a.secretId,
        alibiId: a.alibiId,
        isCulprit: a.isCulprit,
        clueIds: a.clueIds,
      };
    },
    async logEvent(name, props) {
      s.events.push({ name, props });
    },
  };
  return s;
}
