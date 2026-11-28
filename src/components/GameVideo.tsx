"use client";
// 게임 영상 (FR-081, docs/video/RULES.md §3, #101). 화면 틀의 그래픽 영역 안에만 그린다 (DESIGN.md §9).
// - 소리: 방장 폰만, V-04 는 희생자 폰, V-05 는 모든 폰. 설정에서 끄면 영상이 나오는 중에도 바로 음소거 (lib/video)
// - 소리를 켜고 틀 수 없으면(브라우저가 막음) 음소거로라도 튼다. 영상은 소리 없이도 이해되게 만들었다 (RULES R-07)
// - 파일이 없거나 못 틀면 아무것도 그리지 않는다: 그래픽 영역은 검정 그대로, 내용은 아래 글이 맡는다 (PRD §24, DESIGN.md §3)
// - 움직임 줄이기 설정이면 틀지 않는다 (DESIGN.md §7). 이때도 글만으로 진행된다
// - 한 판에서 끝까지 본 영상은 다시 틀지 않는다: 새로 고침, 탭 바꾸기로 방장 폰 소리가 또 나지 않게
// - 끝난 영상은 마지막 장면에 멈춰 둔다. 이미 본 영상은 틀지 않고 마지막 장면으로만 옮겨 보여 준다 (#127, #125 리뷰).
//   iOS 처럼 틀기 전에는 장면을 그리지 않는 브라우저에서는 검정으로 남는다
// 영상은 글과 같은 내용이라 읽어 주지 않는다 (aria-hidden). 글은 그래픽 위에 겹치지 않는다
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { readItem, writeItem } from "@/lib/session-item";
import { isOn, onSettingsChange } from "@/lib/settings";
import { onNextTap } from "@/lib/tap";
import {
  holdAt,
  playedKey,
  VIDEO_VOLUME,
  videoHasSound,
  videoSrc,
  type VideoId,
} from "@/lib/video";

// playing: 트는 중, ended: 이번에 끝까지 봄(마지막 장면), seen: 전에 봄(틀지 않고 마지막 장면),
// skipped: 움직임 줄이기라 틀지 않음, failed: 못 틂
type Status = "playing" | "ended" | "seen" | "skipped" | "failed";

// 마지막 장면으로 옮길 때 끝에서 조금 앞 (끝 시각 그대로면 장면을 안 그리는 브라우저가 있다)
const LAST_FRAME_GAP_S = 0.05;

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
  onTime,
  seekTo = null,
}: {
  id: VideoId;
  gameId: string;
  /** 공용 영상은 방장 폰만 소리를 낸다. V-04, V-05 는 상관없어 넘기지 않아도 된다 */
  isHost?: boolean;
  /** 끝까지 봤거나("ended"), 못 틀어서 건너뛰었을 때("skipped") 한 번. 이미 본 영상이면 부르지 않는다 */
  onEnded?: (how: "ended" | "skipped") => void;
  /** 재생 중 시각(초)이 바뀔 때마다 (timeupdate). 영상 안 장면에 맞춰 소리를 낼 때 쓴다 */
  onTime?: (seconds: number) => void;
  /**
   * 트는 중이면 이 시각(초)으로 건너뛴다. 값이 바뀔 때마다 한 번, 앞으로만 (#141 오프닝 "다음").
   * 이미 그 시각을 지났거나 트는 중이 아니면(이미 봄, 못 틂) 아무것도 하지 않는다
   */
  seekTo?: number | null;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const key = playedKey(gameId, id);
  // 게임 화면은 방 상태를 읽은 뒤 브라우저에서만 그려져서(room-view) 처음부터 저장소를 읽어도 된다.
  const [status, setStatus] = useState<Status>(() =>
    readItem(key) !== null ? "seen" : reducedMotion() ? "skipped" : "playing",
  );
  // 소리를 켜고 틀려다 브라우저가 막으면 이번 재생은 음소거로 둔다
  const [blocked, setBlocked] = useState(false);
  // 첫 장면을 그릴 수 있게 되었는지. 그 전에는 투명하게 둔다 (QA #136)
  const [shown, setShown] = useState(false);
  const soundOn = useSyncExternalStore(onSettingsChange, soundSnapshot, serverSoundSnapshot);
  const wantSound = videoHasSound(id, { isHost, soundOn }) && !blocked;

  const ended = useRef(onEnded);
  const time = useRef(onTime);
  useEffect(() => {
    ended.current = onEnded;
    time.current = onTime;
  });

  // 처음 한 번 튼다. 움직임 줄이기면 못 튼 것으로 알린다. 이미 본 영상은 뒤에 이어지는 소리도 이미 났으니 알리지 않는다
  useEffect(() => {
    if (status === "skipped") return ended.current?.("skipped");
    if (status !== "playing") return; // 이미 본 영상은 틀지 않는다
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

  // 바깥(오프닝 "다음")이 장면을 넘기면 영상도 그 장면으로 건너뛴다 (#141). 트는 중일 때만, 앞으로만
  useEffect(() => {
    const v = ref.current;
    if (seekTo === null || !v || status !== "playing") return;
    if (v.currentTime < seekTo) v.currentTime = seekTo;
    // status 가 바뀔 때는 다시 건너뛰지 않는다: seekTo 가 바뀔 때만
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seekTo]);

  function fail() {
    // 이미 본 영상의 마지막 장면을 못 불러온 것은 알리지 않는다: 뒤에 이어지는 소리가 또 나지 않게
    const was = status;
    setStatus("failed");
    if (was === "playing") ended.current?.("skipped");
  }

  function finish() {
    if (status !== "playing") return; // 멈춰 둘 시각에서 끝낸 뒤 ended 가 또 와도 한 번만
    writeItem(key, "1");
    setStatus("ended");
    ended.current?.("ended");
  }

  // 끝이 검게 사라지는 영상은 그 직전에서 멈추고 끝난 것으로 본다 (#141)
  const hold = holdAt(id);
  function onTimeUpdate(v: HTMLVideoElement) {
    if (status !== "playing") return;
    time.current?.(v.currentTime);
    if (hold !== null && v.currentTime >= hold) {
      v.pause();
      v.currentTime = hold;
      finish();
    }
  }

  // 이미 본 영상: 틀지 않고 마지막 장면으로만 옮긴다 (소리 없음). 멈춰 둘 시각이 있으면 그 장면
  function showLastFrame(v: HTMLVideoElement) {
    if (status !== "seen" || !Number.isFinite(v.duration)) return;
    v.currentTime = hold ?? Math.max(0, v.duration - LAST_FRAME_GAP_S);
  }

  if (status === "skipped" || status === "failed") return null;
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
        onLoadedMetadata={(e) => showLastFrame(e.currentTarget)}
        // 첫 장면이 준비되면 살짝 나타난다: 글보다 늦게 툭 뜨지 않게 (QA #136)
        onLoadedData={() => setShown(true)}
        // 재생 중일 때만 알린다. 마지막 장면으로 옮길 때 알리면 시각에 맞춘 소리(RV-02 등)가 또 난다
        onTimeUpdate={(e) => onTimeUpdate(e.currentTarget)}
        onEnded={finish}
        onError={fail}
        className={`absolute inset-0 size-full bg-(--color-bg) object-contain transition-opacity duration-(--duration-base) motion-reduce:transition-none ${shown ? "opacity-100" : "opacity-0"}`}
      />
    </div>
  );
}
