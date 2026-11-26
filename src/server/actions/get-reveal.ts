"use server";
// spec §4 getReveal. 매번 세션과 참가 여부를 서버에서 다시 확인한다.
import "server-only";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "../db";
import { readReveal, type RevealResult } from "../game-reveal";

export async function getReveal(gameId: string): Promise<RevealResult> {
  const input = z.uuid().safeParse(gameId);
  if (!input.success) return { error: "잘못된 요청이에요." };
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return { error: "다시 들어와 주세요." };
  try {
    return await readReveal(createServiceClient(), data.user.id, input.data);
  } catch {
    return { error: "해설을 불러오지 못했어요. 잠시 뒤 다시 시도해 주세요." };
  }
}
