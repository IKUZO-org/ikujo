// 방 화면: 단계에 따라 그리는 한 화면 (ARCHITECTURE.md §3). 지금은 S-05 대기실까지
import { Suspense } from "react";
import { RoomView } from "./room-view";

export default function Page() {
  return (
    <Suspense>
      <RoomView />
    </Suspense>
  );
}
