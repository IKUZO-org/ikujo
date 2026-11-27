"use server";
// spec §4 getMine. 세션은 actionDeps 가, 참가 여부와 입력 검사는 reads.ts 가 한다
import { actionDeps } from "../context";
import { getMine as run } from "../reads";
import { safe } from "./safe";

export async function getMine(input: { gameId: string }) {
  return safe(async () => run(await actionDeps(), input));
}
