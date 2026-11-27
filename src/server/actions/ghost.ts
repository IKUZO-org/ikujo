"use server";
// spec §4 whisper, haunt (S-10). 세션은 actionDeps 가, 유령 본인, 단계, 대상, 입력 검사는 ghost.ts 가 한다
import { actionDeps } from "../context";
import { haunt as runHaunt, whisper as runWhisper } from "../ghost";
import { safe } from "./safe";

export async function whisper(input: { gameId: string; toPlayerId: string; body: string }) {
  return safe(async () => runWhisper(await actionDeps(), input));
}

export async function haunt(input: { gameId: string; body: string }) {
  return safe(async () => runHaunt(await actionDeps(), input));
}
