// 가짜 Supabase: RoomStore 를 메모리로. 001_core.sql 의 unique 제약을 똑같이 흉내 낸다.
import {
  UniqueViolation,
  type GameEnd,
  type GameRow,
  type GhostActionRow,
  type NewGame,
  type PlayerRow,
  type RoomRow,
  type RoomStore,
} from "@/server/rooms/store";
import { MAX_PLAYERS, freeSeat, uniqueNickname } from "@/server/rooms/core";

export type MemoryStore = RoomStore & {
  rooms: RoomRow[];
  players: PlayerRow[];
  games: (GameRow & { roomId: string; game: NewGame; end?: GameEnd })[];
  events: { name: string; props: Record<string, unknown> }[];
  revealed: { gameId: string; clueId: string; round: number }[];
  readies: { gameId: string; playerId: string; phase: string }[];
  /** r2 진입 때 game-phase.ts 가 켜는 assignments.is_ghost. 테스트가 직접 넣는다 */
  ghosts: { gameId: string; playerId: string }[];
  ghostActions: (GhostActionRow & { gameId: string })[];
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
    ghosts: [],
    ghostActions: [],

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
    async getChangeableVote() {
      return null;
    },
    async getVoteInfo() {
      return { votedPlayerIds: [], revoteCandidates: [] };
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
        isGhost: s.ghosts.some((x) => x.gameId === gameId && x.playerId === playerId),
      };
    },
    async getGhost(gameId) {
      const ghost = s.ghosts.find((x) => x.gameId === gameId);
      const g = s.games.find((x) => x.id === gameId);
      const a = g?.game.assignments.find((x) => x.playerId === ghost?.playerId);
      return ghost && a ? { playerId: ghost.playerId, characterId: a.characterId } : null;
    },
    async getGhostTrait(gameId) {
      return s.games.find((x) => x.id === gameId)?.game.secret.ghostTrait ?? null;
    },
    async listAssignedPlayerIds(gameId) {
      return (s.games.find((x) => x.id === gameId)?.game.assignments ?? []).map((a) => a.playerId);
    },
    async getCulpritCharacter(gameId) {
      return s.games.find((x) => x.id === gameId)?.game.secret.culpritCharacter ?? null;
    },
    async getCulpritPlayerId(gameId) {
      return s.games.find((x) => x.id === gameId)?.game.secret.culpritPlayerId ?? null;
    },
    async updateGamePhase(gameId, from, to, end) {
      const g = s.games.find((x) => x.id === gameId);
      if (!g || g.phase !== from) return false;
      g.phase = to;
      if (end) g.end = end;
      g.phaseEndsAt = null;
      return true;
    },
    async listGhostActions(gameId) {
      return s.ghostActions
        .filter((a) => a.gameId === gameId)
        .map((a) => ({
          id: a.id,
          kind: a.kind,
          fromPlayerId: a.fromPlayerId,
          toPlayerId: a.toPlayerId,
          round: a.round,
          body: a.body,
        }));
    },
    // 001_core.sql 출몰 1번, 005_ghost.sql 라운드당 속삭임 1번과 같은 제약
    async insertGhostAction(a) {
      const same = s.ghostActions.filter((x) => x.gameId === a.gameId && x.kind === a.kind);
      if (a.kind === "haunt" && same.length > 0) throw new UniqueViolation("haunt");
      if (
        a.kind === "whisper" &&
        same.some((x) => x.fromPlayerId === a.fromPlayerId && x.round === a.round)
      )
        throw new UniqueViolation("whisper");
      s.ghostActions.push({ ...a, id: String(s.ghostActions.length + 1) });
    },
    async logEvent(name, props) {
      s.events.push({ name, props });
    },
  };
  return s;
}
