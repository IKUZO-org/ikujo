import { describe, expect, it } from "vitest";
import { systemShowsCopyNotice } from "@/lib/copy-text";

// 복사하면 휴대폰이 직접 알림을 띄우는 기기 (#145): 안드로이드만. 앱 토스트는 나머지에서
describe("systemShowsCopyNotice", () => {
  it("안드로이드는 휴대폰 알림이 있어 앱 토스트를 뺀다", () => {
    expect(
      systemShowsCopyNotice(
        "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36",
      ),
    ).toBe(true);
  });

  it("iOS, PC 는 알림이 없어 앱 토스트를 띄운다", () => {
    expect(
      systemShowsCopyNotice(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1",
      ),
    ).toBe(false);
    expect(
      systemShowsCopyNotice(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      ),
    ).toBe(false);
  });
});
