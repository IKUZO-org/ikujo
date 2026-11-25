// S-03 닉네임 (FR-003). ?code= 가 있으면 그 방에 들어가고, 없으면 방을 만든다
import { Suspense } from "react";
import { NicknameView } from "./nickname-view";

export default function Page() {
  return (
    <Suspense>
      <NicknameView />
    </Suspense>
  );
}
