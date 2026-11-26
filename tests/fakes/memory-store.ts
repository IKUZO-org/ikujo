// 가짜 Supabase: RoomStore 를 메모리로. 001_core.sql 의 unique 제약을 똑같이 흉내 낸다.
import {
  UniqueViolation,
  type GameRow,
  type NewGame,
  type PlayerRow,
  type RoomRow,
  type RoomStore,
} from "@/server/rooms/store";
import { MAX_PLAYERS, freeSeat, uniqueNickname } from "@/server/rooms/core";

export type MemoryStore = RoomStore & {
  rooms: RoomRow[];
  players: PlayerRow[];
  games: (GameRow & { roomId: string; game: NewGame })[];
  events: { name: string; props: Record<string, unknown> }[];
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
    // join_room (004_join_room.sql) 과 같은 규칙. 메모리라 잠금은 필요 없다
    async joinRoom({ code, userId, isGuest, nickname }) {
      const room = s.rooms.find((r) => r.code === code && r.status !== "ended");
      if (!room) return { result: "not_found" };
      const at = { roomId: room.id, code: room.code };
      const players = s.players.filter((p) => p.roomId === room.id);
      const me = players.find((p) => p.userId === userId);
      if (me) {
        if (!me.leftAt) return { result: "member", ...at };
        me.leftAt = null;
        return { result: "rejoined", ...at };
      }
      if (room.status !== "lobby") return { result: "started", ...at };
      if (players.length >= MAX_PLAYERS) return { result: "full", ...at };
      if (nickname === null) return { result: "need_nickname", ...at };
      await s.insertPlayer({
        roomId: room.id,
        userId,
        isGuest,
        nickname: uniqueNickname(nickname, players),
        seat: freeSeat(players)!,
      });
      return { result: "joined", ...at };
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
    async logEvent(name, props) {
      s.events.push({ name, props });
    },
  };
  return s;
}
