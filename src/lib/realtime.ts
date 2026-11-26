// 방 채널 신호 (data §5). 비밀은 넣지 않는다: 받으면 다시 읽는다 (ARCHITECTURE.md §2-4).
// 서버와 브라우저가 같이 쓰는 이름만 둔다.

export const roomChannel = (roomId: string) => `room:${roomId}`;

// 브로드캐스트 이벤트 이름. 종류는 payload.type 으로 나눈다
export const SIGNAL_EVENT = "signal";

// count: 준비(markReady)는 ready 만, 투표(vote)는 votes 만 싣는다 (data §5)
export type RoomSignal =
  | { type: "players" }
  | { type: "phase"; phase: string; endsAt: string | null }
  | { type: "count"; ready?: number; votes?: number }
  // 출몰 (FR-053). 유령의 말은 모두에게 보이는 공용 글이라 실어도 된다 (data §5)
  | { type: "haunt"; body: string }
  // 맞춤 해설(S-12 카드 8)이 뒤늦게 채워짐. 글은 싣지 않고 getReveal 로 다시 읽는다
  | { type: "reveal" };
