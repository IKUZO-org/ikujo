"use server";
// spec §4 createRoom. 세션, 입력 검사는 core 가 한다
import { actionDeps } from "../context";
import { createRoom as run } from "../rooms/core";
import { safe } from "./safe";

export async function createRoom(input: { nickname: string }) {
  return safe(async () => run(await actionDeps(), input));
}
