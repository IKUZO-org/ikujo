// 방 동작이 DB에 바라는 것. 실제는 supabase-store.ts (service role), 테스트는 가짜 저장소.
// 동시에 눌러도 깨지지 않게 하는 마지막 방어선은 DB 제약이다 (001_core.sql):
//   진행 중 방 코드 unique, (room_id, seat) unique, (room_id, user_id) unique, seat 1~6.
// 제약에 걸리면 UniqueViolation 을 던진다. 입장은 DB 함수 join_room 이 방 줄을 잠가 차례로 한다.

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
    /** AI 응답 원문과 검사 실패 원인 (data §2). 규칙 배정만 했으면 null */
    llmRaw: unknown;
  };
  assignments: {
    playerId: string;
    characterId: string;
    secretId: string;
    alibiId: string;
    isCulprit: boolean;
    /** 개인 단서 { r1: [...], r2: [...], r3: [...] } (data §2 assignments.clue_ids) */
    clueIds: Record<"r1" | "r2" | "r3", string[]>;
  }[];
};

export type UniqueTarget = "code" | "seat" | "user";

export class UniqueViolation extends Error {
  constructor(readonly target: UniqueTarget) {
    super(`unique violation: ${target}`);
  }
}

export type JoinResult =
  | { result: "not_found" }
  | {
      result: "member" | "rejoined" | "need_nickname" | "joined" | "started" | "full";
      roomId: string;
      code: string;
    };

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

  /**
   * 코드로 방에 들어가기 (DB 함수 join_room, 004_join_room.sql). 방 줄을 잠그고 한 번에 한다.
   * nickname 이 null 이면 들어갈 수 있는지만 본다.
   */
  joinRoom(p: {
    code: string;
    userId: string;
    isGuest: boolean;
    nickname: string | null;
  }): Promise<JoinResult>;

  /** games + game_secrets + assignments. 중간에 실패하면 만든 것을 지우고 던진다 */
  createGame(game: NewGame): Promise<GameRow>;
  latestGame(roomId: string): Promise<GameRow | null>;

  /** 기록 (spec §7). 개인 식별 정보는 넣지 않는다 (data §6) */
  logEvent(
    name: string,
    props: { roomId?: string; gameId?: string; [k: string]: unknown },
  ): Promise<void>;
}
