"use server";
// spec §4 joinRoom. 세션, 입력 검사는 core 가 한다
import { actionDeps } from "../context";
import { joinRoom as run } from "../rooms/core";
import { safe } from "./safe";

export async function joinRoom(input: { code: string; nickname?: string }) {
  return safe(async () => run(await actionDeps(), input));
}
