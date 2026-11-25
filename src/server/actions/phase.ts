"use server";
// 단계 넘기기와 준비 (spec §1.1, §4). 매번 세션과 참가 여부를 서버에서 다시 확인한다.
import "server-only";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "../db";
import { advancePhase, markReady, type PhaseResult, type ReadyResult } from "../game-phase";
import { PHASES } from "../phase";

const phaseInput = z.object({ gameId: z.uuid(), phase: z.enum(PHASES) });

async function currentUserId(): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

export async function advance(gameId: string, from: string): Promise<PhaseResult> {
  const input = phaseInput.safeParse({ gameId, phase: from });
  if (!input.success) return { error: "잘못된 요청이에요." };
  const userId = await currentUserId();
  if (!userId) return { error: "다시 들어와 주세요." };
  try {
    return await advancePhase(createServiceClient(), userId, input.data.gameId, input.data.phase);
  } catch {
    return { error: "단계를 넘기지 못했어요. 잠시 뒤 다시 시도해 주세요." };
  }
}

export async function ready(gameId: string, phase: string): Promise<ReadyResult> {
  const input = phaseInput.safeParse({ gameId, phase });
  if (!input.success) return { error: "잘못된 요청이에요." };
  const userId = await currentUserId();
  if (!userId) return { error: "다시 들어와 주세요." };
  try {
    return await markReady(createServiceClient(), userId, input.data.gameId, input.data.phase);
  } catch {
    return { error: "준비를 저장하지 못했어요. 잠시 뒤 다시 시도해 주세요." };
  }
}
