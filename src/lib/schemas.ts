// zod 입력 스키마 (SECURITY.md §3). 서버가 매번 다시 검사한다.
import { z } from "zod";

// S-03: 1~10자, 앞뒤 공백 제거 (FR-003)
export const nicknameSchema = z
  .string()
  .trim()
  .min(1, "닉네임을 입력해 주세요")
  .max(10, "닉네임은 10자까지예요");

// S-02: 숫자 6자리 (data §2 rooms.code `제안`)
export const roomCodeSchema = z
  .string()
  .trim()
  .regex(/^[0-9]{6}$/, "방 코드는 숫자 6자리예요");

export const roomIdSchema = z.uuid("잘못된 방이에요");

// S-10: 속삭임, 출몰 글 1~80자 (spec S-10 `제안`, data §2 ghost_actions.body)
export const ghostBodySchema = z
  .string()
  .trim()
  .min(1, "한 글자 이상 써 주세요")
  .max(80, "80자까지 쓸 수 있어요");
