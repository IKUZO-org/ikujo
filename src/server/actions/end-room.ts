"use server";
// spec §4 endRoom. 세션, 입력 검사는 core 가 한다
import { actionDeps } from "../context";
import { endRoom as run } from "../rooms/core";
import { safe } from "./safe";

export async function endRoom(input: { roomId: string }) {
  return safe(async () => run(await actionDeps(), input));
}
