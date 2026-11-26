// 개인 읽기 (spec §4 getMine, ARCHITECTURE.md §2-3). 본인 배정만 돌려준다.
// 공용은 getRoomState(rooms/core.ts). 응답 타입을 공용(GameState)과 개인(MineState)으로 나눠 섞이지 않게 한다.
// 누구인지는 세션의 userId 로만 정한다. 클라이언트가 보낸 playerId 는 받지 않는다 (SECURITY.md §3).
import { z } from "zod";
import { MSG, roundNumber, type Deps, type Result } from "./rooms/core";

const ROUNDS = ["r1", "r2", "r3"] as const;

// 이 단계까지 열린 라운드 수. 다음 라운드 개인 단서를 미리 보여 주지 않는다 (FR-041)
const OPENED: Record<string, number> = {
  intro: 0,
  secret: 0,
  r1: 1,
  r2: 2,
  r3: 3,
  vote: 3,
  revote: 3,
  reveal: 3,
  ended: 3,
};

export type MineState = {
  character: { id: string; name: string; intro: string };
  secret: string;
  alibi: string;
  /** 본인이 범인일 때만 true (AC-030). 다른 사람이 범인인지는 알려 주지 않는다 */
  isCulprit: boolean;
  /** 나에게만 온 단서. 지금 라운드까지, 라운드 순서 (FR-041, S-09 내 것 탭) */
  clues: { id: string; round: number; text: string }[];
  /** 유령에게 받은 속삭임 (FR-052, spec §4 getMine). 나에게 온 것만, 보낸 순서 */
  whispers: { id: string; round: number; body: string }[];
  /**
   * 유령 본인만 (FR-050~052): 범인의 특징 글(AC-051), 이번 라운드에 속삭임을 보냈는지 (OQ-005 라운드당 1번).
   * 유령이 아니면 null
   */
  ghost: { trait: string; whisperedThisRound: boolean } | null;
};

const input = z.object({ gameId: z.uuid() });

export async function getMine(
  deps: Deps,
  raw: { gameId: string },
): Promise<Result<{ mine: MineState }>> {
  const parsed = input.safeParse(raw);
  if (!parsed.success) return { error: MSG.notFound };
  const { store, user, scenario } = deps;

  const game = await store.getGame(parsed.data.gameId);
  if (!game) return { error: MSG.notFound };
  const players = await store.listPlayers(game.roomId);
  const me = players.find((p) => p.userId === user.id);
  if (!me) return { error: MSG.notMember };

  const a = await store.getAssignment(game.id, me.id);
  if (!a) return { error: MSG.notMember };

  const character = scenario.characters.find((c) => c.id === a.characterId);
  const secret = scenario.secrets.find((s) => s.id === a.secretId);
  const alibi = scenario.alibis.find((x) => x.id === a.alibiId);
  if (!character || !secret || !alibi) throw new Error(`scenario id missing for game ${game.id}`);

  const opened = OPENED[game.phase] ?? 0;
  const clueById = new Map(scenario.clues.map((c) => [c.id, c]));
  const clues = ROUNDS.slice(0, opened).flatMap((r, i) =>
    (a.clueIds[r] ?? []).flatMap((id) => {
      const c = clueById.get(id);
      return c ? [{ id: c.id, round: i + 1, text: c.text }] : [];
    }),
  );

  // 속삭임: 나에게 온 것만. 유령이면 내가 이번 라운드에 보냈는지만 (보낸 글은 다시 돌려주지 않는다)
  const actions = await store.listGhostActions(game.id);
  const whispers = actions
    .filter((w) => w.kind === "whisper" && w.toPlayerId === me.id)
    .map((w) => ({ id: w.id, round: w.round, body: w.body }));

  let ghost: MineState["ghost"] = null;
  if (a.isGhost) {
    // 범인의 특징은 game_secrets 에서 서버만 읽고, 유령 본인에게 글만 준다. 범인 인물 id 는 싣지 않는다
    const traitId = await store.getGhostTrait(game.id);
    const trait = scenario.traits.find((t) => t.id === traitId);
    if (!trait) throw new Error(`scenario trait missing for game ${game.id}`);
    const round = roundNumber(game.phase);
    ghost = {
      trait: trait.text,
      whisperedThisRound:
        round !== null &&
        actions.some((w) => w.kind === "whisper" && w.fromPlayerId === me.id && w.round === round),
    };
  }

  return {
    ok: true,
    mine: {
      character: { id: character.id, name: character.name, intro: character.intro },
      secret: secret.text,
      alibi: alibi.text,
      isCulprit: a.isCulprit,
      clues,
      whispers,
      ghost,
    },
  };
}
