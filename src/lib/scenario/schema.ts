import { z } from "zod";

// 시나리오 파일 형식 (docs/data.md §4). 서버와 LLM(CAG)이 같은 파일을 읽는다.

const id = z.string().min(1);
const text = z.string().min(1);
const round = z.number().int().min(1).max(3);
const players = z.number().int().min(4).max(6);

export const characterSchema = z
  .object({
    id,
    core: z.boolean(),
    name: text,
    intro: text,
    order: z.number().int().min(1),
    // 핵심이 아닌 인물은 이 인원부터 등장한다 (BR-002)
    minPlayers: players.optional(),
  })
  .refine((c) => c.core || c.minPlayers !== undefined, {
    message: "핵심이 아닌 인물은 minPlayers 가 있어야 한다",
    path: ["minPlayers"],
  });

export const clueSchema = z
  .object({
    id,
    round,
    visibility: z.enum(["public", "private"]),
    // 이 단서를 받을 수 있는 인물 (개인 단서만)
    for: z.array(id).min(1).optional(),
    // 이 단서가 가리키는 범인 후보
    pointsTo: z.array(id).optional(),
    redHerring: z.boolean().optional(),
    // 알리바이 퍼즐 증거 (D-032): 이 인물이 이 판에 있고 범인이 아닐 때만 나온다
    clears: z.array(id).min(1).optional(),
    text,
  })
  .refine((c) => (c.visibility === "private") === (c.for !== undefined), {
    message: "개인 단서에만 for 가 있다",
    path: ["for"],
  })
  .refine((c) => c.clears === undefined || c.visibility === "private", {
    message: "증거(clears)는 개인 단서만",
    path: ["clears"],
  });

export const scenarioSchema = z.object({
  id,
  title: text,
  version: z.number().int().min(1),
  timeline: z.array(z.object({ at: text, text })).min(1),
  characters: z.array(characterSchema).min(4),
  // 비밀은 인물마다 기본 1개 (D-016). 배열이라 나중에 후보를 늘릴 수 있다
  secrets: z.array(z.object({ id, character: id, text })),
  alibis: z.array(z.object({ id, character: id, text })),
  traits: z.array(z.object({ id, text, characters: z.array(id).min(1) })),
  culprits: z.array(z.object({ character: id, motive: text, mistake: text, trait: id })).min(1),
  clues: z.array(clueSchema),
  redHerrings: z.array(z.object({ clue: id, suspect: id, truth: text })),
  pairs: z.array(z.object({ a: id, b: id, secret: text, tension: text })),
  rounds: z
    .array(z.object({ round, place: text, time: text, minutes: z.number().int().min(1) }))
    .length(3),
  reveal: z.object({
    pastTruth: text,
    endings: z.object({ caught: text, aired_off: text }),
  }),
});

export type Scenario = z.infer<typeof scenarioSchema>;
export type Character = z.infer<typeof characterSchema>;
export type Clue = z.infer<typeof clueSchema>;
