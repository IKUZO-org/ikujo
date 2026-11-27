"use client";
// S-12 해설 (FR-061, FR-070, FR-071). 카드를 순서대로 넘긴다. 모든 폰에 같은 공용 화면.
// 해설은 getReveal 로만 받는다 (reveal 단계부터, data §3). 카드 8 맞춤 해설은 뒤늦게 올 수 있고,
// 없으면(LLM 실패, 모델 미정 OQ-003) 8을 빼고 보여 준다. 인물 그래픽은 #23 전이라 자리만 둔다
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import { Button } from "@/components/Button";
import { Card, GameScreen } from "@/components/game";
import { ErrorLine } from "@/components/Screen";
import { playSound } from "@/lib/sound";
import { leaveRoom } from "@/server/actions/leave-room";
import { endRoom } from "@/server/actions/end-room";
import { getReveal } from "@/server/actions/get-reveal";
import { replay } from "@/server/actions/replay";
import type { RevealBody, Who } from "@/server/reveal";
import type { RoomState } from "@/server/rooms/core";

const MIN_PLAYERS = 4;

type Loaded = { body: RevealBody; personal: string | null };

export function Reveal({
  gameId,
  state,
  top,
  reload,
}: {
  gameId: string;
  state: RoomState;
  top: ReactNode;
  reload: () => Promise<void>;
}) {
  const router = useRouter();
  const [data, setData] = useState<Loaded | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [index, setIndex] = useState(0);
  const [pending, startTransition] = useTransition();
  const seq = useRef(0);

  // 방 상태를 다시 읽을 때마다(신호 "reveal" 포함) 같이 다시 읽는다: 카드 8이 뒤늦게 채워진다
  useEffect(() => {
    const my = ++seq.current;
    void getReveal(gameId).then((r) => {
      if (my !== seq.current) return;
      if ("error" in r) return setError(r.error);
      setError(null);
      setData({ body: r.body, personal: r.personal });
    });
  }, [gameId, state]);

  // 엔딩 소리: 카드 1 이 처음 보일 때 한 번. 검거 성공 RV-01, 방송 중단 RV-02 (sound.md, 방장 폰)
  const outcome = data?.body.ending.outcome ?? null;
  const isHost = state.me.isHost;
  const endingPlayed = useRef(false);
  useEffect(() => {
    if (!outcome || index !== 0 || endingPlayed.current) return;
    endingPlayed.current = true;
    playSound(outcome === "caught" ? "rv-01" : "rv-02", { isHost });
  }, [outcome, index, isHost]);

  if (!data) {
    return (
      <GameScreen top={top}>
        <h2 className="text-(length:--text-xl) font-extrabold">해설</h2>
        {error ? (
          <ErrorLine message={error} />
        ) : (
          <p className="text-(length:--text-md) text-(--color-text-muted)">
            해설을 불러오고 있어요
          </p>
        )}
      </GameScreen>
    );
  }

  const cards = buildCards(data);
  const last = cards.length; // 마지막 다음 칸이 카드 10 (다시 하기 / 홈으로)
  const at = Math.min(index, last);
  const connected = state.players.filter((p) => !p.left).length;

  // 카드 넘김 RV-04. 이 폰만 (sound.md)
  function turn(to: number) {
    setIndex(to);
    playSound("rv-04", { isHost: false });
  }

  function act(run: () => Promise<{ error: string } | { ok: true }>, after?: () => void) {
    setError(null);
    startTransition(async () => {
      const r = await run();
      if ("error" in r) return setError(r.error);
      after?.();
      await reload();
    });
  }

  if (at === last) {
    const canReplay = connected >= MIN_PLAYERS; // AC-070-2
    return (
      <GameScreen
        top={top}
        bottom={
          <>
            <ErrorLine message={error} />
            {state.me.isHost && (
              <>
                {!canReplay && (
                  <p className="text-center text-(length:--text-sm) text-(--color-text-muted)">
                    {MIN_PLAYERS}명부터 시작해요
                  </p>
                )}
                <Button
                  disabled={pending || !canReplay}
                  onClick={() => act(() => replay({ roomId: state.roomId }))}
                >
                  다시 하기
                </Button>
              </>
            )}
            <Button
              variant="secondary"
              disabled={pending}
              onClick={() =>
                // 방장의 홈으로는 방을 끝내고(endRoom), 참가자의 홈으로는 나만 나간다(leaveRoom) (spec S-12 10번)
                act(
                  () =>
                    state.me.isHost
                      ? endRoom({ roomId: state.roomId })
                      : leaveRoom({ roomId: state.roomId }),
                  () => router.push("/"),
                )
              }
            >
              홈으로
            </Button>
            <Button variant="secondary" disabled={pending} onClick={() => turn(last - 1)}>
              이전
            </Button>
          </>
        }
      >
        <h2 className="text-(length:--text-xl) font-extrabold">한 판 더 할까요?</h2>
        <p className="text-(length:--text-md) text-(--color-text-muted)">
          {state.me.isHost
            ? "다시 하면 같은 방에서 범인과 단서를 새로 정해요"
            : "방장이 다시 하기를 고르면 새 판이 시작돼요"}
        </p>
      </GameScreen>
    );
  }

  const card = cards[at];
  return (
    <GameScreen
      top={top}
      bottom={
        <>
          <Button onClick={() => turn(at + 1)}>다음</Button>
          {at > 0 && (
            <Button variant="secondary" onClick={() => turn(at - 1)}>
              이전
            </Button>
          )}
        </>
      }
    >
      <p className="text-(length:--text-sm) text-(--color-text-muted) tabular-nums">
        {at + 1}/{last + 1}
      </p>
      <h2 className="text-(length:--text-xl) font-extrabold">{card.title}</h2>
      {card.body}
    </GameScreen>
  );
}

const name = (w: Who) => `${w.nickname} (${w.character})`;

function Text({ children }: { children: ReactNode }) {
  return <p className="text-(length:--text-md)">{children}</p>;
}

function List({ children }: { children: ReactNode }) {
  return <ul className="flex w-full flex-col gap-(--space-2)">{children}</ul>;
}

/** 카드 1~9. 맞춤 해설(8)이 없으면 뺀다. 범인이 나가 온 해설이면 3, 9 도 뺀다 (spec S-12) */
function buildCards({ body, personal }: Loaded): { title: string; body: ReactNode }[] {
  const cards: { title: string; body: ReactNode }[] = [
    {
      title: body.ending.text,
      body: (
        <Text>
          {body.ending.culpritLeft
            ? `범인 ${body.culprit.who.nickname}이 자리를 떠나 방송이 중단됐어요`
            : body.ending.outcome === "caught"
              ? "범인을 지목했어요"
              : "범인을 찾지 못해 방송이 멈췄어요"}
        </Text>
      ),
    },
    {
      title: "범인",
      body: (
        <>
          <Text>{name(body.culprit.who)}</Text>
          <Text>{body.culprit.motive}</Text>
        </>
      ),
    },
    // 범인이 나가 판정 없이 온 해설이면 3 투표 결과, 9 맞힌 사람을 뺀다 (D-025)
    ...(body.ending.culpritLeft
      ? []
      : [
          {
            title: "투표 결과",
            body: body.votes.map((v) => (
              <div key={v.round} className="flex w-full flex-col gap-(--space-2)">
                {body.votes.length > 1 && (
                  <p className="text-(length:--text-sm) text-(--color-text-muted)">
                    {v.round === 1 ? "첫 투표" : "재투표"}
                  </p>
                )}
                <List>
                  {v.picks.length === 0 ? (
                    <Card>아무도 투표하지 않았어요</Card>
                  ) : (
                    v.picks.map((p) => (
                      <Card key={`${p.voter.nickname}-${p.target.nickname}`}>
                        {name(p.voter)} → {name(p.target)}
                      </Card>
                    ))
                  )}
                </List>
              </div>
            )),
          },
        ]),
    {
      title: "그날 밤",
      body: (
        <>
          <List>
            {body.timeline.map((t) => (
              <Card key={t.at}>
                {t.at} {t.text}
              </Card>
            ))}
          </List>
          <p className="text-(length:--text-sm) text-(--color-text-muted)">범인의 결정적 실수</p>
          <Text>{body.mistake}</Text>
        </>
      ),
    },
    {
      title: "유령이 본 장면",
      body: (
        <>
          {body.ghost.seenBy && (
            <p className="text-(length:--text-sm) text-(--color-text-muted)">
              유령 {name(body.ghost.seenBy)}
            </p>
          )}
          <Text>{body.ghost.trait}</Text>
          <p className="text-(length:--text-sm) text-(--color-text-muted)">
            이번 판에서 이 특징에 해당한 사람
          </p>
          <List>
            {body.ghost.matches.map((w) => (
              <Card key={w.nickname}>{name(w)}</Card>
            ))}
          </List>
        </>
      ),
    },
    {
      title: "헷갈리게 한 단서",
      body: (
        <List>
          {body.redHerrings.map((r) => (
            <Card key={r.clue}>
              {r.clue}
              <br />
              <span className="text-(--color-text-muted)">
                {r.suspect}: {r.truth}
              </span>
            </Card>
          ))}
        </List>
      ),
    },
    { title: "3주 차 사고의 진실", body: <Text>{body.pastTruth}</Text> },
  ];
  if (personal) cards.push({ title: "우리 판 이야기", body: <Text>{personal}</Text> });
  if (body.ending.culpritLeft) return cards;
  cards.push({
    title: "정확히 추리한 사람",
    body:
      body.solvers.length === 0 ? (
        <Text>이번엔 범인이 이겼어요</Text>
      ) : (
        <List>
          {body.solvers.map((w) => (
            <Card key={w.nickname}>{name(w)}</Card>
          ))}
        </List>
      ),
  });
  return cards;
}
