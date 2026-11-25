// 서버 시각 보정과 남은 시간 (#21)
import { describe, expect, it } from "vitest";
import { clockOffsetMs, remainingMs } from "@/lib/room-clock";

const server = "2026-01-01T00:00:10.000Z";
const serverMs = Date.parse(server);

describe("clockOffsetMs", () => {
  it("서버 시각 - 폰 시각", () => {
    expect(clockOffsetMs(server, serverMs - 3000)).toBe(3000); // 폰이 3초 느림
    expect(clockOffsetMs(server, serverMs + 2000)).toBe(-2000); // 폰이 2초 빠름
  });
});

describe("remainingMs", () => {
  const endsAt = "2026-01-01T00:01:10.000Z"; // 서버 기준 60초 뒤

  it("보정값을 더한 시각으로 남은 시간을 센다", () => {
    const phone = serverMs - 3000;
    expect(remainingMs(endsAt, phone, clockOffsetMs(server, phone))).toBe(60_000);
    expect(remainingMs(endsAt, phone + 1000, 3000)).toBe(59_000);
  });

  it("지나면 0", () => {
    expect(remainingMs(endsAt, serverMs + 120_000, 0)).toBe(0);
  });

  it("마감이 없으면 null", () => {
    expect(remainingMs(null, serverMs, 0)).toBeNull();
  });
});
