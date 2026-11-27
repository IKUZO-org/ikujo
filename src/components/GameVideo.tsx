"use client";
// 게임 영상 (FR-081, docs/video/RULES.md §3, #101). 화면 틀의 그래픽 영역 안에만 그린다 (DESIGN.md §9).
// - 소리: 방장 폰만, V-04 는 희생자 폰, V-05 는 모든 폰. 설정에서 끄면 영상이 나오는 중에도 바로 음소거 (lib/video)
// - 소리를 켜고 틀 수 없으면(브라우저가 막음) 음소거로라도 튼다. 영상은 소리 없이도 이해되게 만들었다 (RULES R-07)
// - 파일이 없거나 못 틀면 아무것도 그리지 않는다: 그래픽 영역은 검정 그대로, 내용은 아래 글이 맡는다 (PRD §24, DESIGN.md §3)
// - 움직임 줄이기 설정이면 틀지 않는다 (DESIGN.md §7). 이때도 글만으로 진행된다
// - 한 판에서 끝까지 본 영상은 다시 틀지 않는다: 새로 고침, 탭 바꾸기로 방장 폰 소리가 또 나지 않게
// 영상은 글과 같은 내용이라 읽어 주지 않는다 (aria-hidden). 글은 그래픽 위에 겹치지 않는다
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { readItem, writeItem } from "@/lib/session-item";
import { isOn, onSettingsChange } from "@/lib/settings";
import { onNextTap } from "@/lib/tap";
import { playedKey, VIDEO_VOLUME, videoHasSound, videoSrc, type VideoId } from "@/lib/video";

type Status = "playing" | "seen" | "skipped" | "failed";

const soundSnapshot = () => isOn("sound");
const serverSoundSnapshot = () => false;

function reducedMotion(): boolean {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

export function GameVideo({
  id,
  gameId,
  isHost = false,
  onEnded,
}: {
  id: VideoId;
  gameId: string;
  /** 공용 영상은 방장 폰만 소리를 낸다. V-04, V-05 는 상관없어 넘기지 않아도 된다 */
  isHost?: boolean;
  /** 끝까지 봤거나("ended"), 못 틀어서 건너뛰었을 때("skipped") 한 번. 이미 본 영상이면 부르지 않는다 */
  onEnded?: (how: "ended" | "skipped") => void;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const key = playedKey(gameId, id);
  // 게임 화면은 방 상태를 읽은 뒤 브라우저에서만 그려져서(room-view) 처음부터 저장소를 읽어도 된다.
  // seen: 이 판에서 이미 끝까지 봄. skipped: 움직임 줄이기라 틀지 않음
  const [status, setStatus] = useState<Status>(() =>
    readItem(key) !== null ? "seen" : reducedMotion() ? "skipped" : "playing",
  );
  // 소리를 켜고 틀려다 브라우저가 막으면 이번 재생은 음소거로 둔다
  const [blocked, setBlocked] = useState(false);
  const soundOn = useSyncExternalStore(onSettingsChange, soundSnapshot, serverSoundSnapshot);
  const wantSound = videoHasSound(id, { isHost, soundOn }) && !blocked;

  const ended = useRef(onEnded);
  useEffect(() => {
    ended.current = onEnded;
  });

  // 처음 한 번 튼다. 움직임 줄이기면 못 튼 것으로 알린다. 이미 본 영상은 뒤에 이어지는 소리도 이미 났으니 알리지 않는다
  useEffect(() => {
    if (status === "skipped") return ended.current?.("skipped");
    const v = ref.current;
    if (!v) return;
    let cancelled = false;
    let offTap = () => {};
    const hasSound = () => videoHasSound(id, { isHost, soundOn: isOn("sound") });
    // 음소거로 틀고 있다가 화면을 한 번 누르면 소리를 켠다 (sound.md 규칙 6 "첫 탭에서 소리 열기").
    // 모바일은 누르는 순간 안에서 켜야 하므로 여기서 바로 바꾼다
    const unlock = () => {
      if (cancelled) return;
      v.muted = !hasSound();
      setBlocked(false);
    };
    v.volume = VIDEO_VOLUME; // 앱 소리보다 작게 (R-13)
    v.muted = !hasSound();
    v.play().catch((e: unknown) => {
      if (cancelled) return;
      // 소리 때문에 막힌 것이면 음소거로 다시. 그래도 안 되면 못 트는 것으로
      if (e instanceof DOMException && e.name === "NotAllowedError" && !v.muted) {
        setBlocked(true);
        v.muted = true;
        v.play().catch(() => !cancelled && fail());
        offTap = onNextTap(unlock);
        return;
      }
      if (!(e instanceof DOMException && e.name === "AbortError")) fail();
    });
    return () => {
      cancelled = true;
      offTap();
    };
    // 처음 한 번만 튼다. 소리는 아래 effect 가 따른다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  // 설정이 바뀌면 나오는 중에도 바로 따른다
  useEffect(() => {
    if (ref.current) ref.current.muted = !wantSound;
  }, [wantSound]);

  function fail() {
    setStatus("failed");
    ended.current?.("skipped");
  }

  function finish() {
    writeItem(key, "1");
    setStatus("seen");
    ended.current?.("ended");
  }

  if (status !== "playing") return null;
  return (
    <div aria-hidden className="relative flex-1">
      <video
        ref={ref}
        src={videoSrc(id)}
        // 처음에는 음소거로 붙여 모바일 자동 재생이 막히지 않게 한다. 소리는 위에서 켠다
        muted
        playsInline
        preload="auto"
        disablePictureInPicture
        onEnded={finish}
        onError={fail}
        className="absolute inset-0 size-full bg-(--color-bg) object-contain"
      />
    </div>
  );
}
