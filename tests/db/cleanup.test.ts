// 하루 한 번 정리 작업 (009_cleanup.sql, data §6, D-019, D-026, D-027). 로컬 Supabase 필요
// 함수는 앱 역할이 부를 수 없어 postgres 로 부른다. 시각은 이 테스트가 만든 줄만 과거로 바꾼다.
import { execFileSync } from "node:child_process";
import { beforeAll, describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { guest, insert, serviceClient } from "./local-supabase";

type Row = Record<string, unknown> & { id: string };

// config.jsonc 의 project_id 가 ikujo
function psql(query: string): string {
  return execFileSync(
    "docker",
    ["exec", "supabase_db_ikujo", "psql", "-U", "postgres", "-Atc", query],
    { encoding: "utf8" },
  ).trim();
}

const ago = (hours: number) => new Date(Date.now() - hours * 3600_000).toISOString();
const DAY = 24;

let db: SupabaseClient;

async function room(status: string, users: string[]): Promise<{ room: Row; players: Row[] }> {
  const [r] = await insert<Row>(db, "rooms", {
    code: String(Math.floor(100000 + Math.random() * 900000)),
    status,
  });
  const players = await insert<Row>(
    db,
    "players",
    users.map((u, i) => ({ room_id: r.id, user_id: u, nickname: `p${i + 1}`, seat: i + 1 })),
  );
  return { room: r, players };
}

async function game(roomId: string, fields: Record<string, unknown>): Promise<Row> {
  const [g] = await insert<Row>(db, "games", {
    room_id: roomId,
    player_count: 4,
    assignment_source: "rule",
    ...fields,
  });
  return g;
}

async function set(table: string, id: string, fields: Record<string, unknown>) {
  const { error } = await db.from(table).update(fields).eq("id", id);
  if (error) throw new Error(`${table} 바꾸기 실패: ${error.message}`);
}

const get = async (table: string, id: string) =>
  (await db.from(table).select("*").eq("id", id).maybeSingle()).data as Row | null;

const userExists = (id: string) =>
  psql(`select count(*) from auth.users where id = '${id}'`) === "1";

const s: Record<string, Row> = {};
const u: Record<string, string> = {};

beforeAll(async () => {
  db = serviceClient();
  const users = await Promise.all(Array.from({ length: 8 }, () => guest()));
  const ids = users.map((x) => x.userId);

  // (a) 25시간 전 r2 판, 23시간 전 r2 판
  const a25 = await room("playing", ids.slice(0, 1));
  s.a25room = a25.room;
  s.a25game = await game(a25.room.id, { phase: "r2" });
  await set("rooms", a25.room.id, { created_at: ago(3 * DAY) });
  await set("games", s.a25game.id, { phase_started_at: ago(25) });

  const a23 = await room("playing", ids.slice(1, 2));
  s.a23room = a23.room;
  s.a23game = await game(a23.room.id, { phase: "r2" });
  await set("rooms", a23.room.id, { created_at: ago(3 * DAY) });
  await set("games", s.a23game.id, { phase_started_at: ago(23) });

  // (b) 3일 전 방, 1시간 전 판이 취소돼 대기실로 돌아옴
  const b = await room("lobby", ids.slice(2, 3));
  s.broom = b.room;
  const bg = await game(b.room.id, { phase: "ended", ended_reason: "cancelled", ended_at: ago(1) });
  await set("rooms", b.room.id, { created_at: ago(3 * DAY) });
  await set("games", bg.id, { phase_started_at: ago(1) });

  // (c) 판은 끝났는데(normal) 방은 playing, 25시간 전
  const c = await room("playing", ids.slice(3, 4));
  s.croom = c.room;
  const cg = await game(c.room.id, { phase: "ended", ended_reason: "normal", ended_at: ago(25) });
  await set("rooms", c.room.id, { created_at: ago(2 * DAY) });
  await set("games", cg.id, { phase_started_at: ago(25) });

  // (d)(e) 31일 전 끝난 방: 사용자 4(여기만), 5(최근 방에도 있음). 29일 전 끝난 방: 사용자 6
  const d31 = await room("ended", [ids[4], ids[5]]);
  s.d31room = d31.room;
  s.d31game = await game(d31.room.id, {
    phase: "ended",
    ended_reason: "normal",
    ended_at: ago(31 * DAY),
  });
  const [p1, p2] = d31.players;
  await insert(db, "game_secrets", {
    game_id: s.d31game.id,
    culprit_player_id: p1.id,
    victim_player_id: p2.id,
    culprit_character: "fav",
    ghost_trait: "t",
  });
  await insert(db, "votes", {
    game_id: s.d31game.id,
    round: 1,
    voter_player_id: p2.id,
    target_player_id: p1.id,
  });
  await insert(db, "reveals", { game_id: s.d31game.id, body: [] });
  await set("rooms", d31.room.id, { ended_at: ago(31 * DAY) });
  await room("lobby", [ids[5]]);

  const d29 = await room("ended", [ids[6]]);
  s.d29room = d29.room;
  await set("rooms", d29.room.id, { ended_at: ago(29 * DAY) });

  // 모든 사용자를 31일 전에 만든 것으로. 사용자 7 은 방에 들어간 적 없음
  psql(
    `update auth.users set created_at = now() - interval '31 days' where id in (${ids
      .map((id) => `'${id}'`)
      .join(",")})`,
  );
  Object.assign(u, { only: ids[4], shared: ids[5], recent: ids[6], none: ids[7] });

  psql("select public.cleanup_stale_and_old()");
});

describe("24시간 활동 없는 방과 판 (D-027)", () => {
  it("25시간 멈춘 판과 그 방은 ended, stale, ended_at 채움. 23시간이면 그대로", async () => {
    const g = await get("games", s.a25game.id);
    expect(g).toMatchObject({ phase: "ended", ended_reason: "stale" });
    expect(g?.ended_at).not.toBeNull();
    expect(await get("rooms", s.a25room.id)).toMatchObject({ status: "ended" });

    expect(await get("games", s.a23game.id)).toMatchObject({ phase: "r2", ended_at: null });
    expect(await get("rooms", s.a23room.id)).toMatchObject({ status: "playing" });
  });

  it("오래된 방이라도 최근에 판이 취소됐으면 그대로", async () => {
    expect(await get("rooms", s.broom.id)).toMatchObject({ status: "lobby", ended_at: null });
  });

  it("진행 중 판 없이 playing 인 방도 끝낸다", async () => {
    expect(await get("rooms", s.croom.id)).toMatchObject({ status: "ended" });
  });
});

describe("30일 지난 방과 익명 사용자 삭제 (D-019, D-026)", () => {
  it("31일 전 끝난 방은 딸린 표까지 없어지고 29일이면 남는다", async () => {
    expect(await get("rooms", s.d31room.id)).toBeNull();
    const gid = s.d31game.id;
    for (const t of [
      "games",
      "game_secrets",
      "assignments",
      "revealed_clues",
      "readies",
      "votes",
      "ghost_actions",
      "reveals",
    ]) {
      const col = t === "games" ? "id" : "game_id";
      expect(psql(`select count(*) from public.${t} where ${col} = '${gid}'`), t).toBe("0");
    }
    expect(psql(`select count(*) from public.players where room_id = '${s.d31room.id}'`)).toBe("0");
    expect(await get("rooms", s.d29room.id)).not.toBeNull();
  });

  it("다른 방에 남은 사용자만 두고 지운다", () => {
    expect(userExists(u.only)).toBe(false);
    expect(userExists(u.none)).toBe(false);
    expect(userExists(u.shared)).toBe(true);
    expect(userExists(u.recent)).toBe(true);
  });
});

describe("권한과 예약", () => {
  it("anon, authenticated, service_role 은 부를 수 없다", async () => {
    const anon = await guest();
    for (const client of [anon.client, db]) {
      const { error } = await client.rpc("cleanup_stale_and_old");
      expect(error?.code).toBe("42501");
    }
  });

  it("cron 에 job 하나", () => {
    expect(psql("select count(*) from cron.job where jobname = 'ikujo-cleanup'")).toBe("1");
  });
});
