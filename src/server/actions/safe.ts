// 예상 못 한 오류를 한 줄 안내로 바꾼다. 스택, SQL 은 돌려주지 않는다 (ARCHITECTURE.md §2-5)
import "server-only";
import { MSG, type Fail } from "../rooms/core";

export async function safe<T>(run: () => Promise<T>): Promise<T | Fail> {
  try {
    return await run();
  } catch (e) {
    console.error(e);
    return { error: MSG.retry };
  }
}
