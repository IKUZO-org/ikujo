// 겹친 호출을 합친다 (#135). 도는 중에 또 부르면 새로 돌지 않고, 끝난 뒤 한 번만 더 돈다.
// 돌려주는 promise 는 뒤에 붙은 한 번까지 끝난 뒤 풀린다: await 한 쪽은 그 뒤의 최신 결과를 본다.
// 상태는 slot 에 둔다 (React 에서는 useRef 를 그대로 넘긴다)
export type CoalesceSlot = {
  current: { inflight: Promise<void> | null; dirty: boolean; startedAt?: number };
};

/**
 * since: 액션 뒤 다시 읽기일 때 액션을 시작한 시각 (performance.now). 서버 액션은 하나씩 처리되므로
 * 액션 뒤에 출발한 읽기는 이미 액션 결과를 본다: 그 읽기에 합류만 한다. 액션 전에 출발한 읽기면 한 번 더 돈다
 */
export function runCoalesced(
  slot: CoalesceSlot,
  run: () => Promise<void>,
  since?: number,
): Promise<void> {
  const s = slot.current;
  if (s.inflight) {
    if (since === undefined || (s.startedAt ?? -Infinity) < since) s.dirty = true;
    return s.inflight;
  }
  const loop = async () => {
    do {
      s.dirty = false;
      s.startedAt = performance.now();
      await run();
    } while (s.dirty);
  };
  s.inflight = loop().finally(() => {
    s.inflight = null;
  });
  return s.inflight;
}
