// 방 화면: 단계에 따라 그리는 한 화면 (ARCHITECTURE.md §3). S-05 대기실 ~ S-09 라운드
// 사건 제목만 서버에서 꺼내 넘긴다. 시나리오 전체는 server-only 라 브라우저로 가지 않는다
import { Suspense } from "react";
import { loadScenario } from "@/server/scenario";
import { RoomView } from "./room-view";

export default function Page() {
  return (
    <Suspense>
      <RoomView title={loadScenario().title} />
    </Suspense>
  );
}
