// 해설(reveals)의 서버 본체 (spec §4 getReveal, S-12). db 클라이언트(service role)를 받는다.
// reveal 진입 때 advancePhase 가 한 번 부르고, 읽기는 Server Action 이 세션을 확인한 뒤 부른다.
import "server-only";
import { after } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getRevealModel } from "./llm";
import { broadcast } from "./realtime";
import {
  buildReveal,
  personalInput,
  writePersonal,
  type RevealBody,
  type RevealInput,
} from "./reveal";
import { loadScenario } from "./scenario";

type Secret = {
  culprit_player_id: string;
  culprit_character: string;
  ghost_trait: string;
};

async function revealInput(db: SupabaseClient, gameId: string) {
  const [game, secret, assigned, votes] = await Promise.all([
    db.from("games").select("room_id, outcome, revote_candidates").eq("id", gameId).single<{
      room_id: string;
      outcome: "caught" | "aired_off" | null;
      revote_candidates: string[] | null;
    }>(),
    db
      .from("game_secrets")
      .select("culprit_player_id, culprit_character, ghost_trait")
      .eq("game_id", gameId)
      .single<Secret>(),
    db
      .from("assignments")
      .select("player_id, character_id, secret_id, is_ghost, players(nickname, left_at)")
      .eq("game_id", gameId)
      .returns<
        {
          player_id: string;
          character_id: string;
          secret_id: string;
          is_ghost: boolean;
          players: { nickname: string; left_at: string | null } | null;
        }[]
      >(),
    db
      .from("votes")
      .select("round, voter_player_id, target_player_id")
      .eq("game_id", gameId)
      .returns<{ round: 1 | 2; voter_player_id: string; target_player_id: string }[]>(),
  ]);
  for (const r of [game, secret, assigned, votes]) if (r.error) throw r.error;
  const input: RevealInput = {
    // 판정이 outcome 을 같이 쓰므로 reveal 에서는 늘 있다. 없으면 방송 중단으로 본다 (OQ-008)
    outcome: game.data!.outcome ?? "aired_off",
    culpritPlayerId: secret.data!.culprit_player_id,
    culpritCharacter: secret.data!.culprit_character,
    ghostTrait: secret.data!.ghost_trait,
    players: (assigned.data ?? []).map((a) => ({
      id: a.player_id,
      nickname: a.players?.nickname ?? "",
      characterId: a.character_id,
      isGhost: a.is_ghost,
      left: a.players?.left_at != null,
    })),
    votes: (votes.data ?? []).map((v) => ({
      round: v.round,
      voterId: v.voter_player_id,
      targetId: v.target_player_id,
    })),
    revoted: game.data!.revote_candidates !== null,
  };
  const secrets = (assigned.data ?? []).map((a) => ({
    characterId: a.character_id,
    secretId: a.secret_id,
  }));
  return { roomId: game.data!.room_id, input, secrets };
}

/**
 * reveal 진입 때 한 번 (advancePhase 의 단계를 넘긴 호출만 부른다).
 * 카드 1~7, 9 는 바로 넣고, 8(personal)은 응답을 붙잡지 않고 뒤에서 채운다 (#47).
 * 범인과 개별 투표는 여기서 처음 reveals 로 옮긴다: reveal 전에는 reveals 에 줄이 없다 (data §2)
 */
export async function createReveal(db: SupabaseClient, gameId: string): Promise<void> {
  const scenario = loadScenario();
  const { roomId, input, secrets } = await revealInput(db, gameId);
  const body = buildReveal(scenario, input);
  const { error } = await db
    .from("reveals")
    .upsert(
      { game_id: gameId, body, personal: null },
      { onConflict: "game_id", ignoreDuplicates: true },
    );
  if (error) throw error;
  // 기록 (spec §7). 범인, 누가 누구를 찍었는지는 넣지 않는다
  await db.from("events").insert({
    name: "reveal_reached",
    room_id: roomId,
    game_id: gameId,
    props: { outcome: input.outcome },
  });

  const model = getRevealModel();
  if (!model) return; // 모델 미정(OQ-003)이면 8 없이
  runAfterResponse(async () => {
    const personal = await writePersonal(scenario, model, personalInput(input, secrets));
    if (!personal) return;
    await db.from("reveals").update({ personal }).eq("game_id", gameId);
    // 신호에는 "해설이 바뀌었다"만. 글은 getReveal 로 다시 읽는다 (data §5)
    await broadcast(db, roomId, { type: "reveal" });
  });
}

// Server Action 안이면 응답을 보낸 뒤 실행한다 (next/server after). 요청 밖(테스트)이면 그냥 뒤에서 돈다
function runAfterResponse(task: () => Promise<void>) {
  const safeTask = () => task().catch((e) => console.error("personal reveal", e));
  try {
    after(safeTask);
  } catch {
    void safeTask();
  }
}

export type RevealResult =
  { ok: true; body: RevealBody; personal: string | null } | { error: string };

/**
 * spec §4 getReveal. 그 판의 방 참가자만, games.phase 가 reveal, ended 일 때만 (data §3 reveals RLS 와 같게)
 */
export async function readReveal(
  db: SupabaseClient,
  userId: string,
  gameId: string,
): Promise<RevealResult> {
  const { data: game } = await db
    .from("games")
    .select("room_id, phase")
    .eq("id", gameId)
    .maybeSingle<{ room_id: string; phase: string }>();
  if (!game) return { error: "이 판의 참가자가 아니에요." };
  const { data: player } = await db
    .from("players")
    .select("id")
    .eq("room_id", game.room_id)
    .eq("user_id", userId)
    .maybeSingle<{ id: string }>();
  if (!player) return { error: "이 판의 참가자가 아니에요." };
  if (game.phase !== "reveal" && game.phase !== "ended")
    return { error: "아직 해설 시간이 아니에요." };
  const read = () =>
    db
      .from("reveals")
      .select("body, personal")
      .eq("game_id", gameId)
      .maybeSingle<{ body: RevealBody; personal: string | null }>();
  let { data } = await read();
  if (!data) {
    // 단계는 넘어갔는데 만들다 실패했으면 여기서 다시 만든다 (upsert 라 두 번 만들어지지 않는다)
    await createReveal(db, gameId);
    ({ data } = await read());
  }
  if (!data) return { error: "해설을 준비하고 있어요." };
  return { ok: true, body: data.body, personal: data.personal };
}
