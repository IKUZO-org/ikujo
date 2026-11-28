// 글 복사 (S-05 방 코드). QA #136: 폰에서는 되는데 PC에서 안 된다는 보고.
// navigator.clipboard 는 https(또는 localhost)이고 문서에 포커스가 있을 때만 된다.
// http 주소(같은 와이파이의 IP 등)로 열었거나 개발자 도구에 포커스가 있으면 실패하므로
// 그때는 예전 방식(숨긴 입력칸을 골라 execCommand("copy"))으로 한 번 더 해 본다.

export async function copyText(text: string): Promise<boolean> {
  if (typeof navigator !== "undefined" && navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // 아래 예전 방식으로
    }
  }
  return legacyCopy(text);
}

function legacyCopy(text: string): boolean {
  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  // 화면에 보이지 않게, 스크롤도 움직이지 않게
  area.style.position = "fixed";
  area.style.top = "0";
  area.style.opacity = "0";
  document.body.appendChild(area);
  area.select();
  area.setSelectionRange(0, text.length);
  let ok = false;
  try {
    ok = document.execCommand("copy");
  } catch {
    ok = false;
  }
  area.remove();
  return ok;
}
