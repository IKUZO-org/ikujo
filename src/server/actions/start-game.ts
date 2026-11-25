"use server";
// spec §4 startGame. 세션, 입력 검사는 core 가 한다
import { actionDeps } from "../context";
import { startGame as run } from "../rooms/core";
import { safe } from "./safe";

export async function startGame(input: { roomId: string }) {
  return safe(async () => run(await actionDeps(), input));
}
