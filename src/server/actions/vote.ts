"use server";
// 투표 (spec §4 vote, S-11). 매번 세션과 참가 여부를 서버에서 다시 확인한다.
import "server-only";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "../db";
import { castVote, type VoteResult } from "../game-vote";

const voteInput = z.object({ gameId: z.uuid(), targetPlayerId: z.uuid() });

export async function vote(gameId: string, targetPlayerId: string): Promise<VoteResult> {
  const input = voteInput.safeParse({ gameId, targetPlayerId });
  if (!input.success) return { error: "잘못된 요청이에요." };
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return { error: "다시 들어와 주세요." };
  try {
    return await castVote(
      createServiceClient(),
      data.user.id,
      input.data.gameId,
      input.data.targetPlayerId,
    );
  } catch {
    return { error: "투표를 저장하지 못했어요. 잠시 뒤 다시 시도해 주세요." };
  }
}
