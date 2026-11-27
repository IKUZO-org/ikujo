# 홈 키 비주얼 프롬프트와 생성 기록

> 이슈 #126. 쓰는 곳: S-02 홈 위쪽 그래픽 영역 (ART.md §10 우선 1). 파일 [`public/images/key-visual-home.webp`](../../public/images/key-visual-home.webp) (1170×1755, ART.md §11)
> 장면: 결승 생방송 전날 저녁, 바다에서 본 무인도. 붉은 해가 섬 뒤로 지고 왼쪽에서 폭풍 구름이 밀려온다. 오프닝 영상 V-01의 붉은 해와 섬 모티프와 같다
> 색: 게임 속 세계 그림이라 6색 팔레트 (ART.md §5). 방송 부품(녹화 테두리, REC 점)은 넣지 않는다
> 로고: 그림에 그리지 않고 화면에서 [`public/logo-last-one.svg`](../../public/logo-last-one.svg)를 위쪽 빈 하늘에 얹는다 (ART.md §8 예외, 폭 300px, 390 기준)

## 1. 프롬프트 (복사해서 쓰기)
맨 앞 문단은 ART.md §8 공통 스타일 블록 그대로다. §8을 고치면 여기도 같이 고친다.

```text
Mid-century graphic noir illustration: classic film-noir chiaroscuro combined with 1950s-60s modernist poster design. Flat, geometric color shapes with hard-edged light and shadow; form is built by the boundary between light and shadow, not by outlines. Silhouette-driven figures with no facial features, no anatomical detail and no clothing folds. Bold omission: only the story-relevant object gets detail. Asymmetric cinematic framing with generous negative space. Limited palette with a strict hierarchy: ink black #121212 and ivory #F2EBDC as bases, vermilion #BF3026 as the single dominant accent, petrol teal #285E60 for shadows and depth, tiny touches of burgundy #65282D and amber #B99053. About 85% flat color and 15% grainy gradient used only for light falloff and atmosphere. Subtle screen-print paper grain and ink texture inside color fields; deep black areas stay clean. Outer edges fade to pure #0B0B0B. Intellectual, mysterious, classic, tense.

Scene: the evening before the live final of a survival reality show. A small deserted island seen from the sea at dusk. A large flat vermilion sun sits low behind the island, slightly right of center, with a thin amber glow around its rim. The island is a hard black silhouette: one sharp rocky peak, a few palm trees, and one low lodge with two tiny amber-lit windows. The shadow side of the island and the rocks carry petrol teal. Below the island, the water is deep black-teal and carries a broken vermilion reflection of the sun in short horizontal strokes. From the left edge, heavy storm clouds roll in toward the sun: black bodies with petrol teal inside, burgundy where the sunset light fades into them, and ivory-lit rims facing the sun. No people, no boats.

Color hierarchy: vermilion clearly leads (sun, reflection, sunset band), black and ivory hold the structure, teal only for shadow and depth, burgundy and amber only as small transitional and light accents. The colors never compete.

Composition (portrait 2:3): the top 35% is empty, clean dark sky with only a faint edge of the incoming storm clouds, left free for a logo placed later. The sun and island sit between 40% and 70% of the height. The bottom 25% is dark water fading to #0B0B0B. Keep everything important inside the central 70% of the height, because the top and bottom may be cropped. Asymmetric balance: storm on the left, sun on the right.

Avoid: text, letters, numbers, captions, logos, watermark, signature, real brands, real TV network graphics, real messenger or phone UI, photorealism, 3D render, glossy CGI, anime, cartoon outlines, faces, eyes, gore, blood, weapons, extra colors outside the palette, busy background, symmetrical centered poster layout, border, frame, rectangle outline, REC dot, red circle in a corner, bright blue, green, purple, pink, people, boats.
```

## 2. 화면에 넣는 방법
- 그래픽 영역은 홈에서 입력칸과 버튼을 뺀 남는 높이 전부이고 양옆까지 채운다 (DESIGN.md §3). 그림은 가운데 기준으로 위아래만 잘린다 (`object-cover`)
- 로고 폭은 300px(390 기준). 좁은 폰은 영역 폭의 77%, 낮은 폰은 영역 높이의 34% 안으로 줄어 해와 섬을 덮지 않는다
- 그림이나 로고를 못 불러오면 검정 바탕 그대로 두고 로고 자리에 글자 "LAST ONE"을 보인다 (DESIGN.md §3, PRD §24)

## 3. 뽑은 뒤 확인 (ART.md §13)
| 항목 | 결과 |
| --- | --- |
| 글자, 사람, 배, 단서 물건 | 없음 |
| 팔레트 밖 색 | 0.4% (원본 1024×1536을 256폭으로 줄여 가장 가까운 팔레트 색으로 분류) |
| 색 비중 | 검정 77%, 버밀리언 12%, 버건디 8%, 청록 2%, 앰버 1%, 아이보리 0.3%. 위쪽 약 40%를 로고 자리로 비워 검정이 많고, 아이보리는 로고가 채운다 |
| 가장자리 | 모서리 `#0A0A09` 로 화면 바탕과 경계 없음 |
| 화면 | 360×640, 390×844, 430×932에서 로고, 해와 섬, 입력칸, 버튼이 한 화면에 보임 |

## 4. 생성 기록
| 날짜 | 버전 | 도구, 모델 | 크레딧 | 메모 |
| --- | --- | --- | --- | --- |
| 2026-11-27 | v1 확정 | ChatGPT 이미지 생성 (GPT 이미지) | 0 (플랜 포함, 추가 결제 없음) | 1번 프롬프트. 원본 1024×1536 PNG(레포 밖)을 1170×1755 WebP(품질 82, 75KB)로 늘려 넣음. PO 확인 (2026-11-27) |
