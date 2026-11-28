import { describe, expect, it } from "vitest";
import { runCoalesced } from "@/lib/coalesce";

const coalesce = (run: () => Promise<void>) => {
  const slot = { current: { inflight: null, dirty: false } };
  return () => runCoalesced(slot, run);
};

describe("coalesce (#135)", () => {
  it("도는 중에 여러 번 부르면 끝난 뒤 한 번만 더 돌고, promise 는 그 뒤에 풀린다", async () => {
    let runs = 0;
    const gates: (() => void)[] = [];
    const call = coalesce(
      () =>
        new Promise<void>((done) => {
          runs++;
          gates.push(done);
        }),
    );
    const first = call();
    const second = call();
    const third = call();
    expect(runs).toBe(1);
    let settled = false;
    void second.then(() => (settled = true));
    gates[0]();
    await new Promise((r) => setTimeout(r, 0));
    expect(runs).toBe(2);
    expect(settled).toBe(false);
    gates[1]();
    await Promise.all([first, second, third]);
    expect(runs).toBe(2);
    void call();
    expect(runs).toBe(3);
  });

  it("실패하면 다음 호출은 새로 돈다", async () => {
    let runs = 0;
    const call = coalesce(async () => {
      runs++;
      if (runs === 1) throw new Error("x");
    });
    await expect(call()).rejects.toThrow("x");
    await call();
    expect(runs).toBe(2);
  });
});

describe("액션 뒤 다시 읽기 합류 (#135)", () => {
  function setup() {
    let runs = 0;
    const gates: (() => void)[] = [];
    const slot = { current: { inflight: null, dirty: false } };
    const read = (since?: number) =>
      runCoalesced(
        slot,
        () =>
          new Promise<void>((done) => {
            runs++;
            gates.push(done);
          }),
        since,
      );
    const flush = () => new Promise((r) => setTimeout(r, 0));
    return { read, gates, flush, runs: () => runs };
  }

  it("액션 중에 출발한 읽기에는 합류만 해서 1번 읽는다", async () => {
    const t = setup();
    const since = performance.now();
    const signal = t.read();
    const after = t.read(since);
    t.gates[0]();
    await Promise.all([signal, after]);
    expect(t.runs()).toBe(1);
  });

  it("액션 전에 출발한 읽기면 끝난 뒤 한 번 더 읽는다", async () => {
    const t = setup();
    const before = t.read();
    await new Promise((r) => setTimeout(r, 2));
    const after = t.read(performance.now());
    t.gates[0]();
    await t.flush();
    t.gates[1]();
    await Promise.all([before, after]);
    expect(t.runs()).toBe(2);
  });
});
