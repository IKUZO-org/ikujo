"use server";
// spec §4 getRoomState. 세션, 입력 검사는 core 가 한다
import { actionDeps } from "../context";
import { getRoomState as run } from "../rooms/core";
import { safe } from "./safe";

export async function getRoomState(input: { code: string }) {
  return safe(async () => run(await actionDeps(), input));
}
