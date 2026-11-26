// sessionStorage 는 편의용이다 (한 번 본 연출을 새로 고침해도 다시 띄우지 않기 등).
// 못 쓰는 브라우저(사생활 보호 모드 등)에서는 없는 것처럼 둔다
export function readItem(key: string): string | null {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeItem(key: string, value: string) {
  try {
    sessionStorage.setItem(key, value);
  } catch {
    // 저장 못 해도 이 화면에서는 state 로 기억한다
  }
}
