// 방 동작이 DB에 바라는 것. 실제는 supabase-store.ts (service role), 테스트는 가짜 저장소.
// 동시에 눌러도 깨지지 않게 하는 마지막 방어선은 DB 제약이다 (001_core.sql):
//   진행 중 방 코드 unique, (room_id, seat) unique, (room_id, user_id) unique, seat 1~6.
// 제약에 걸리면 UniqueViolation 을 던지고, 동작 쪽에서 다시 시도한다.

export type RoomStatus = "lobby" | "playing" | "ended";

export type RoomRow = {
  id: string;
  code: string;
  status: RoomStatus;
  hostPlayerId: string | null;
};

export type PlayerRow = {
  id: string;
  roomId: string;
  userId: string;
  isGuest: boolean;
  nickname: string;
  seat: number;
  leftAt: string | null;
};

export type GameRow = {
  id: string;
  phase: string;
  phaseEndsAt: string | null;
};

export type NewGame = {
  roomId: string;
  playerCount: number;
  phase: "intro";
  phaseEndsAt: string;
  assignmentSource: "rule" | "ai";
  secret: {
    culpritPlayerId: string;
    victimPlayerId: string;
    culpritCharacter: string;
    ghostTrait: string;
  };
  assignments: {
    playerId: string;
    characterId: string;
    secretId: string;
    alibiId: string;
    isCulprit: boolean;
  }[];
};

export type UniqueTarget = "code" | "seat" | "user";

export class UniqueViolation extends Error {
  constructor(readonly target: UniqueTarget) {
    super(`unique violation: ${target}`);
  }
}

export interface RoomStore {
  /** status 가 ended 가 아닌 방 중 이 코드 */
  findActiveRoomByCode(code: string): Promise<RoomRow | null>;
  getRoom(roomId: string): Promise<RoomRow | null>;
  /** 코드가 진행 중 방과 겹치면 UniqueViolation('code') */
  insertRoom(code: string): Promise<RoomRow>;
  setHost(roomId: string, playerId: string | null): Promise<void>;
  /** 지금 상태가 from 일 때만 바꾼다. 바꿨으면 true (두 번 시작 막기) */
  updateRoomStatus(roomId: string, from: RoomStatus, to: RoomStatus): Promise<boolean>;

  /** seat 순서 */
  listPlayers(roomId: string): Promise<PlayerRow[]>;
  /** seat 겹침은 UniqueViolation('seat'), 같은 사람 두 번은 UniqueViolation('user') */
  insertPlayer(p: Omit<PlayerRow, "id" | "leftAt">): Promise<PlayerRow>;
  deletePlayer(playerId: string): Promise<void>;
  setPlayerLeftAt(playerId: string, leftAt: string | null): Promise<void>;

  /** games + game_secrets + assignments. 중간에 실패하면 만든 것을 지우고 던진다 */
  createGame(game: NewGame): Promise<GameRow>;
  latestGame(roomId: string): Promise<GameRow | null>;

  /** 기록 (spec §7). 개인 식별 정보는 넣지 않는다 (data §6) */
  logEvent(name: string, props: { roomId?: string; gameId?: string; [k: string]: unknown }): Promise<void>;
}
