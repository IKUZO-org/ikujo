# 인물 6명 프롬프트와 생성 기록

> 담당: 상경. 이슈 #87. 상태 **제안** (이미지 v3 확정. 인물 표 확인, PO 범위 확인 전. 8번)
> 근거: [prd.md](../prd.md) FR-081(이미지: 개인 화면 이미지), BR-006, BR-008 / [spec.md](../spec.md) S-08, S-11 / [DESIGN.md](../../DESIGN.md) §6 투표 칸 / [ART.md](../../ART.md) §8, §9, §11, §13 / [live-death.json](../../scenarios/live-death.json)

## 1. 프롬프트 (복사해서 쓰기)

화풍은 **A안(청록 그림자)** 으로 정했다 (8번 CQ-4). 영상과 같은 톤의 B안도 뽑아 비교했다: [characters/a-b-compare.jpg](characters/a-b-compare.jpg) (위 A, 아래 B. A 견본은 얼굴, 포즈를 고치기 전 버전).

- 인물마다 블록 하나를 그대로 넣는다. 마지막 `Avoid:` 줄은 금지 칸이 있는 도구면 그 칸으로 옮긴다
- 순서: **인물(체형, 머리, 옷, 자세, 배경) → 공통 스타일 → 공통 틀 → 금지**. 도구는 앞쪽 내용을 더 중요하게 보므로 인물 차이를 맨 앞에 둔다
- 공통 스타일은 [ART.md](../../ART.md) §8을 줄여 인물용으로 바꾼 것이다. §8이 바뀌면 여기 6개도 같이 바꾼다
  - 팔레트 6색, 역할 고정: 바탕 Ink Black, 빛 Ivory, **그림자 Petrol Teal**, 강조 Vermilion(옷 한 군데, 6명 모두 그림의 약 3%, 5% 이하), Burgundy는 가장 깊은 그림자, Amber는 빛이 실루엣 가장자리에 닿는 곳에만
  - 얼굴: 거의 매끈한 아이보리 면에 눈썹 아래 옅은 그림자, 빛 반대쪽 뺨과 턱만 청록으로 그늘진다. 눈, 코, 입, 표정은 그리지 않는다 (6명 모두 같은 무표정)
  - 빛은 하나 (왼쪽 위). 배경 무늬는 평평한 Teal과 Ivory 면
  - §8의 "비대칭 구도" 문장은 뺐다. 인물은 썸네일로 잘라 쓰려고 가운데에 둔다
- 영상은 3색(ART.md §5 "영상과 방송 화면은 3색"), 인물은 6색이다. 두 쪽이 같은 핵심 3색(검정, 아이보리, 레드)을 쓰므로 이어진다
- 성별과 나이는 정하지 않는다. 대신 체형, 머리, 옷 구조, 자세를 인물마다 확실히 다르게 해서 썸네일에서도 구별되게 한다 (2번 표)

### 국민 호감 1위 (`fav`)

```text
A person of medium height with a soft, rounded build. Rounded soft bob haircut. A chunky cable-knit sweater with a round neck and one wide, bold horizontal vermilion band across the chest, about as wide as a hand. Calm pose: body clearly turned three-quarters toward the left side of the image, head turned slightly toward the viewer, both hands loosely clasped in front at the waist. Behind: the shadow of an arched window on the wall.
Style: mid-century graphic noir illustration, 1950s-60s modernist poster design with film-noir chiaroscuro. Flat geometric color shapes, hard-edged light and shadow, form built by light and shadow rather than outlines. Silhouette-driven figure. The face is mostly a smooth flat ivory shape with only a hint of structure from light: a faint shadow under the brow, and the shadow side of the cheek and jaw falling into petrol teal shadow. Nothing else on the face. No drawn eyes, nose, lips or facial outlines. Calm, neutral, unreadable. Few anatomical details, few clothing folds. Palette of only six colors: ink black #121212 and ivory #F2EBDC as bases, vermilion #BF3026 as the single accent, petrol teal #285E60 for shadows, a tiny touch of burgundy #65282D in the deepest shadows, a tiny touch of amber #B99053 where the light meets the edge of the silhouette. Mostly flat color with a little grainy gradient for light falloff, subtle screen-print grain, outer edges fading to #0B0B0B. Mysterious, classic, tense.
Frame: vertical 2:3, waist-up, one person only, gender left ambiguous. The figure is centered; the head sits about one third from the top, and the head and shoulders stay within the middle half of the frame height. One hard light from the upper left: the lit side is ivory, the shadow side is petrol teal. Ink black wall; any pattern on the wall is drawn as flat petrol teal and ivory shapes only, never warm and never glowing. Vermilion appears in one clothing detail only, clearly visible and covering about 3% of the image (never more than 5%), the same amount as in the other portraits.
Avoid: text, letters, numbers, captions, logos, watermark, signature, real brands, photorealism, 3D render, glossy CGI, anime, cartoon outlines, eyes, pupils, eyelashes, eyebrows drawn as lines, nose shape, nostrils, lips, mouth, makeup, smiling, frowning, any expression, detailed face, gore, blood, weapons, extra colors outside the palette, busy background, hat, cap, headset, radio, earpiece, lanyard, badge, bag, towel, bandage, knee brace, phone, bottle, perfume, objects held in hands, crossed arms, clenched fists, hunched shoulders, limping, weight on one leg, back turned to the viewer, head bowed, looking down, looking back over the shoulder, multiple people.
```

### 악역 담당 (`villain`)

```text
A tall, thin person with an angular build. Sleek slicked-back hair. A long tailored coat with strong squared shoulders and wide pointed lapels; both wide lapels are faced in solid vermilion. The coat itself is a mid-tone, lit ivory on the light side and petrol teal in shadow, not black, so the figure is exactly as bright as the other portraits. Calm pose: body and head clearly turned three-quarters toward the right side of the image, head level, one hand lightly straightening the lapel. Behind: a single diagonal beam of light across the wall.
Style: mid-century graphic noir illustration, 1950s-60s modernist poster design with film-noir chiaroscuro. Flat geometric color shapes, hard-edged light and shadow, form built by light and shadow rather than outlines. Silhouette-driven figure. The face is mostly a smooth flat ivory shape with only a hint of structure from light: a faint shadow under the brow, and the shadow side of the cheek and jaw falling into petrol teal shadow. Nothing else on the face. No drawn eyes, nose, lips or facial outlines. Calm, neutral, unreadable. Few anatomical details, few clothing folds. Palette of only six colors: ink black #121212 and ivory #F2EBDC as bases, vermilion #BF3026 as the single accent, petrol teal #285E60 for shadows, a tiny touch of burgundy #65282D in the deepest shadows, a tiny touch of amber #B99053 where the light meets the edge of the silhouette. Mostly flat color with a little grainy gradient for light falloff, subtle screen-print grain, outer edges fading to #0B0B0B. Mysterious, classic, tense.
Frame: vertical 2:3, waist-up, one person only, gender left ambiguous. The figure is centered; the head sits about one third from the top, and the head and shoulders stay within the middle half of the frame height. One hard light from the upper left: the lit side is ivory, the shadow side is petrol teal. Ink black wall; any pattern on the wall is drawn as flat petrol teal and ivory shapes only, never warm and never glowing. Vermilion appears in one clothing detail only, clearly visible and covering about 3% of the image (never more than 5%), the same amount as in the other portraits.
Avoid: text, letters, numbers, captions, logos, watermark, signature, real brands, photorealism, 3D render, glossy CGI, anime, cartoon outlines, eyes, pupils, eyelashes, eyebrows drawn as lines, nose shape, nostrils, lips, mouth, makeup, smiling, frowning, any expression, detailed face, gore, blood, weapons, extra colors outside the palette, busy background, hat, cap, headset, radio, earpiece, lanyard, badge, bag, towel, bandage, knee brace, phone, bottle, perfume, objects held in hands, crossed arms, clenched fists, hunched shoulders, limping, weight on one leg, back turned to the viewer, head bowed, looking down, looking back over the shoulder, multiple people.
```

### 전직 운동선수 (`athlete`)

```text
A sturdy person with a broad-shouldered, solid build. Buzz-cut hair. A boxy zip-up track jacket with a high stand collar and one wide vermilion stripe running over the shoulder and down the full length of the sleeve. Calm pose: facing straight toward the viewer, shoulders square, head level, arms relaxed at the sides. Behind: horizontal slat shadows on the wall.
Style: mid-century graphic noir illustration, 1950s-60s modernist poster design with film-noir chiaroscuro. Flat geometric color shapes, hard-edged light and shadow, form built by light and shadow rather than outlines. Silhouette-driven figure. The face is mostly a smooth flat ivory shape with only a hint of structure from light: a faint shadow under the brow, and the shadow side of the cheek and jaw falling into petrol teal shadow. Nothing else on the face. No drawn eyes, nose, lips or facial outlines. Calm, neutral, unreadable. Few anatomical details, few clothing folds. Palette of only six colors: ink black #121212 and ivory #F2EBDC as bases, vermilion #BF3026 as the single accent, petrol teal #285E60 for shadows, a tiny touch of burgundy #65282D in the deepest shadows, a tiny touch of amber #B99053 where the light meets the edge of the silhouette. Mostly flat color with a little grainy gradient for light falloff, subtle screen-print grain, outer edges fading to #0B0B0B. Mysterious, classic, tense.
Frame: vertical 2:3, waist-up, one person only, gender left ambiguous. The figure is centered; the head sits about one third from the top, and the head and shoulders stay within the middle half of the frame height. One hard light from the upper left: the lit side is ivory, the shadow side is petrol teal. Ink black wall; any pattern on the wall is drawn as flat petrol teal and ivory shapes only, never warm and never glowing. Vermilion appears in one clothing detail only, clearly visible and covering about 3% of the image (never more than 5%), the same amount as in the other portraits.
Avoid: text, letters, numbers, captions, logos, watermark, signature, real brands, photorealism, 3D render, glossy CGI, anime, cartoon outlines, eyes, pupils, eyelashes, eyebrows drawn as lines, nose shape, nostrils, lips, mouth, makeup, smiling, frowning, any expression, detailed face, gore, blood, weapons, extra colors outside the palette, busy background, hat, cap, headset, radio, earpiece, lanyard, badge, bag, towel, bandage, knee brace, phone, bottle, perfume, objects held in hands, crossed arms, clenched fists, hunched shoulders, limping, weight on one leg, back turned to the viewer, head bowed, looking down, looking back over the shoulder, multiple people.
```

### 막내 작가 (`writer`)

```text
A small, slight person with a narrow build. Hair loosely tied in a messy bun on top of the head. An oversized slouchy hoodie with the hood down, layered over a collared shirt; the hood lining is solid vermilion and stays clearly visible as a wide band around the neck and shoulders. Calm pose: body and head clearly turned three-quarters toward the left side of the image, head level, both hands resting in the hoodie's front pocket. Behind: vertical venetian-blind shadows on the wall.
Style: mid-century graphic noir illustration, 1950s-60s modernist poster design with film-noir chiaroscuro. Flat geometric color shapes, hard-edged light and shadow, form built by light and shadow rather than outlines. Silhouette-driven figure. The face is mostly a smooth flat ivory shape with only a hint of structure from light: a faint shadow under the brow, and the shadow side of the cheek and jaw falling into petrol teal shadow. Nothing else on the face. No drawn eyes, nose, lips or facial outlines. Calm, neutral, unreadable. Few anatomical details, few clothing folds. Palette of only six colors: ink black #121212 and ivory #F2EBDC as bases, vermilion #BF3026 as the single accent, petrol teal #285E60 for shadows, a tiny touch of burgundy #65282D in the deepest shadows, a tiny touch of amber #B99053 where the light meets the edge of the silhouette. Mostly flat color with a little grainy gradient for light falloff, subtle screen-print grain, outer edges fading to #0B0B0B. Mysterious, classic, tense.
Frame: vertical 2:3, waist-up, one person only, gender left ambiguous. The figure is centered; the head sits about one third from the top, and the head and shoulders stay within the middle half of the frame height. One hard light from the upper left: the lit side is ivory, the shadow side is petrol teal. Ink black wall; any pattern on the wall is drawn as flat petrol teal and ivory shapes only, never warm and never glowing. Vermilion appears in one clothing detail only, clearly visible and covering about 3% of the image (never more than 5%), the same amount as in the other portraits.
Avoid: text, letters, numbers, captions, logos, watermark, signature, real brands, photorealism, 3D render, glossy CGI, anime, cartoon outlines, eyes, pupils, eyelashes, eyebrows drawn as lines, nose shape, nostrils, lips, mouth, makeup, smiling, frowning, any expression, detailed face, gore, blood, weapons, extra colors outside the palette, busy background, hat, cap, headset, radio, earpiece, lanyard, badge, bag, towel, bandage, knee brace, phone, bottle, perfume, objects held in hands, crossed arms, clenched fists, hunched shoulders, limping, weight on one leg, back turned to the viewer, head bowed, looking down, looking back over the shoulder, multiple people.
```

### 인플루언서 (`influencer`)

```text
A tall, slender person with a long neck. Long straight hair falling past the shoulders. An oversized trench coat with a large, solid vermilion collar. Calm pose: full side profile facing the left side of the image, chin slightly raised, one hand brushing the hair back from the shoulder. Behind: the shadows of palm leaves cast across a patch of light on the wall, as if from a window outside.
Style: mid-century graphic noir illustration, 1950s-60s modernist poster design with film-noir chiaroscuro. Flat geometric color shapes, hard-edged light and shadow, form built by light and shadow rather than outlines. Silhouette-driven figure. The face is mostly a smooth flat ivory shape with only a hint of structure from light: a faint shadow under the brow, and the shadow side of the cheek and jaw falling into petrol teal shadow. Nothing else on the face. No drawn eyes, nose, lips or facial outlines. Calm, neutral, unreadable. Few anatomical details, few clothing folds. Palette of only six colors: ink black #121212 and ivory #F2EBDC as bases, vermilion #BF3026 as the single accent, petrol teal #285E60 for shadows, a tiny touch of burgundy #65282D in the deepest shadows, a tiny touch of amber #B99053 where the light meets the edge of the silhouette. Mostly flat color with a little grainy gradient for light falloff, subtle screen-print grain, outer edges fading to #0B0B0B. Mysterious, classic, tense.
Frame: vertical 2:3, waist-up, one person only, gender left ambiguous. The figure is centered; the head sits about one third from the top, and the head and shoulders stay within the middle half of the frame height. One hard light from the upper left: the lit side is ivory, the shadow side is petrol teal. Ink black wall; any pattern on the wall is drawn as flat petrol teal and ivory shapes only, never warm and never glowing. Vermilion appears in one clothing detail only, clearly visible and covering about 3% of the image (never more than 5%), the same amount as in the other portraits.
Avoid: text, letters, numbers, captions, logos, watermark, signature, real brands, photorealism, 3D render, glossy CGI, anime, cartoon outlines, eyes, pupils, eyelashes, eyebrows drawn as lines, nose shape, nostrils, lips, mouth, makeup, smiling, frowning, any expression, detailed face, gore, blood, weapons, extra colors outside the palette, busy background, hat, cap, headset, radio, earpiece, lanyard, badge, bag, towel, bandage, knee brace, phone, bottle, perfume, objects held in hands, crossed arms, clenched fists, hunched shoulders, limping, weight on one leg, back turned to the viewer, head bowed, looking down, looking back over the shoulder, multiple people.
```

### 의료 담당 (`medic`)

```text
A person of medium height with an upright, neat build. Short hair neatly tucked behind the ears. A short-sleeved V-neck medical scrub top layered over a fitted long-sleeved undershirt, a wide solid vermilion band around the V-neckline, clearly visible on the chest. A stethoscope hangs loosely around the neck, resting on the chest, not held. Calm pose: body clearly turned three-quarters toward the right side of the image, back straight, head level, arms relaxed at the sides. Behind: grid-shaped window-bar shadows on the wall.
Style: mid-century graphic noir illustration, 1950s-60s modernist poster design with film-noir chiaroscuro. Flat geometric color shapes, hard-edged light and shadow, form built by light and shadow rather than outlines. Silhouette-driven figure. The face is mostly a smooth flat ivory shape with only a hint of structure from light: a faint shadow under the brow, and the shadow side of the cheek and jaw falling into petrol teal shadow. Nothing else on the face. No drawn eyes, nose, lips or facial outlines. Calm, neutral, unreadable. Few anatomical details, few clothing folds. Palette of only six colors: ink black #121212 and ivory #F2EBDC as bases, vermilion #BF3026 as the single accent, petrol teal #285E60 for shadows, a tiny touch of burgundy #65282D in the deepest shadows, a tiny touch of amber #B99053 where the light meets the edge of the silhouette. Mostly flat color with a little grainy gradient for light falloff, subtle screen-print grain, outer edges fading to #0B0B0B. Mysterious, classic, tense.
Frame: vertical 2:3, waist-up, one person only, gender left ambiguous. The figure is centered; the head sits about one third from the top, and the head and shoulders stay within the middle half of the frame height. One hard light from the upper left: the lit side is ivory, the shadow side is petrol teal. Ink black wall; any pattern on the wall is drawn as flat petrol teal and ivory shapes only, never warm and never glowing. Vermilion appears in one clothing detail only, clearly visible and covering about 3% of the image (never more than 5%), the same amount as in the other portraits.
Avoid: text, letters, numbers, captions, logos, watermark, signature, real brands, photorealism, 3D render, glossy CGI, anime, cartoon outlines, eyes, pupils, eyelashes, eyebrows drawn as lines, nose shape, nostrils, lips, mouth, makeup, smiling, frowning, any expression, detailed face, gore, blood, weapons, extra colors outside the palette, busy background, hat, cap, headset, radio, earpiece, lanyard, badge, bag, towel, bandage, knee brace, phone, bottle, perfume, objects held in hands, crossed arms, clenched fists, hunched shoulders, limping, weight on one leg, back turned to the viewer, head bowed, looking down, looking back over the shoulder, multiple people.
```

## 2. 인물 표

6명 모두 색 비중, 빛, 크기가 같고 자세는 모두 차분하다. 구별은 **체형, 머리, 옷 구조, 자세(몸 방향), 배경 무늬, 레드 자리**로 한다. 썸네일에서는 머리 모양과 옷 윤곽이 가장 먼저 보이므로 6명이 서로 겹치지 않게 했다.

| ID | 이름 (소개) | 체형 | 머리 | 옷 구조 (레드 자리) | 자세 | 배경 무늬 |
| --- | --- | --- | --- | --- | --- | --- |
| `fav` | 국민 호감 1위 (착한 이미지로 인기 1위) | 보통 키, 부드럽고 둥근 | 둥글고 부드러운 단발 | 두툼한 꽈배기 니트, 둥근 목 (가슴의 넓은 가로 띠) | 몸 왼쪽 3/4, 고개는 보는 사람 쪽으로 살짝, 두 손을 앞에서 가볍게 모음 | 아치형 창 그림자 |
| `villain` | 악역 담당 (방송에서 욕먹는 캐릭터) | 크고 마른, 각진 | 뒤로 넘긴 날렵한 머리 | 어깨가 각진 긴 코트, 넓고 뾰족한 깃. 코트는 검정이 아닌 중간 톤 (양쪽 깃 전체) | 몸 오른쪽 3/4, 한 손으로 깃을 살짝 정돈 | 사선으로 떨어지는 빛 한 줄기 |
| `athlete` | 전직 운동선수 (상금이 꼭 필요한 사람) | 다부지고 어깨가 넓은 | 아주 짧게 민 머리 | 박스형 집업 트레이닝 상의, 높은 깃 (어깨에서 소매 끝까지 넓은 줄) | 정면, 어깨 반듯하게, 팔은 옆으로 | 가로 줄 그림자 |
| `writer` | 막내 작가 (제작진이지만 섬에 남은 사람) | 작고 마른 | 정수리에 대충 묶은 똥머리 | 크게 늘어진 후드티를 셔츠 위에 겹쳐 입음 (목둘레로 보이는 후드 안감) | 몸 왼쪽 3/4, 두 손을 후드 앞주머니에 | 세로 블라인드 그림자 |
| `influencer` | 인플루언서 (팔로워 300만, 방송보다 SNS) | 크고 늘씬한, 긴 목 | 어깨 아래까지 오는 긴 생머리 | 깃이 큰 오버사이즈 트렌치코트 (큰 깃 전체) | 왼쪽 옆모습, 턱을 살짝 들고 한 손으로 머리를 넘김 | 창밖 야자잎 그림자 |
| `medic` | 의료 담당 (출연자 건강 체크 스태프) | 보통 키, 곧고 단정한 | 귀 뒤로 넘긴 단정한 짧은 머리 | 반팔 V넥 스크럽 상의를 긴팔 속옷 위에, 목에 건 청진기 (V넥 둘레의 넓은 띠) | 몸 오른쪽 3/4, 등을 곧게 펴고 팔은 옆으로 | 바둑판 창살 그림자 |

몸 방향은 왼쪽 3/4 둘, 오른쪽 3/4 둘, 왼쪽 옆모습 하나, 정면 하나로 고르게 나눠 한 사람만 튀지 않게 했다.

## 3. 인물 그림에 넣지 않는 것과 이유

| 넣지 않는 것 | 이유 (live-death.json) |
| --- | --- |
| 모자 전부 (볼캡 포함) | 범인 특징 `t-black-cap` (villain, athlete, medic) |
| 무전기, 이어피스, 헤드셋 | 범인 특징 `t-radio` (writer, medic) |
| 한쪽 다리에 무게가 쏠리거나 저는 자세 | 범인 특징 `t-limp` (athlete, medic) |
| 향수병, 향을 떠올리게 하는 것 | 범인 특징 `t-citrus` (fav, influencer) |
| 무릎 보호대, 붕대 | 단서 `c-r2-03` |
| 운동 가방, 수건 | 단서 `c-r1-04` |
| 의료 가방, 약통 | 단서 `c-r1-07` |
| 하드디스크, 케이스 | 단서 `c-r1-06` |
| 손에 든 폰, 손에 든 물건 | 단서 `c-r1-03` 등. 손동작(깃 정돈, 머리 넘기기, 주머니)은 되지만 물건은 들지 않는다 |
| 팔짱, 주먹, 움츠림 | 수상해 보이는 자세. 범인이 누구든 같은 그림이어야 한다 (ART.md §6, §9) |
| 등을 돌린 자세, 고개 숙임, 어깨 너머로 돌아보기 | 숨기거나 수상해 보인다 |

## 4. 뽑을 때

- 통일성은 프롬프트보다 뽑는 방법이 더 크게 좌우한다
  - 6명을 한 번에 같은 도구, 같은 모델, 같은 화질로 뽑는다
  - 첫 번째로 마음에 드는 그림을 나머지 5명의 "스타일 참고 이미지"로 넣는다. 이때 참고 이미지의 체형과 옷까지 따라 하지 않는지 본다 (6명이 닮아 보이면 참고 이미지를 빼고 다시 뽑는다)
  - 시드를 고정할 수 있는 도구면 같은 시드를 쓴다
- HEX 값은 도구가 잘 안 따를 수 있다. 결과 색이 조금 다르면 나중에 팔레트로 보정한다
- 최종 크기 1170×1755px (2:3). 9:16만 되는 도구는 9:16으로 뽑고 2:3으로 자른다 (ART.md §11)
- 결과는 이 폴더의 `characters/` 에 `<ID>-v<버전>.jpg` 로 둔다 (예: `characters/fav-v3.jpg`). 검토용이라 JPG(품질 85)로 줄여 둔다 (원본 PNG는 장당 2~3MB). 앱에서 쓸 파일은 위치와 형식(ART.md §11 WebP)을 따로 정한다 (8번 CQ-3)
- 다시 뽑을 때는 바뀐 점만 적고 버전을 올린다. 도구, 모델, 크레딧을 6번 기록에 남긴다

## 5. 뽑은 뒤 확인 (ART.md §13)

- [ ] 3번 표의 것이 하나도 없다
- [ ] 6명의 빛 방향과 세기, 색 비중, 크기가 같다. 악역만 더 어둡거나 호감만 더 밝지 않다
- [ ] 자세가 모두 차분하다. 몸 방향이 2번 표대로 서로 다르다 (등 돌림, 고개 숙임 없음)
- [ ] 레드가 옷 한 군데에만 있고, 6명 모두 그림의 약 3%로 비슷하다 (너무 가늘어 안 보이거나 한 사람만 크지 않다)
- [ ] 악역의 코트가 검정이 아니라 다른 인물과 같은 밝기다 (ART.md §9)
- [ ] 그림자 면이 Petrol Teal이다. 버건디는 가장 깊은 그림자, 앰버는 빛 닿는 가장자리에만 있다
- [ ] 배경 무늬가 Teal과 Ivory 평평한 면이다 (따뜻한 색, 빛나는 효과 없음)
- [ ] 얼굴은 눈썹 아래 옅은 그림자와 그늘진 뺨, 턱선뿐이다 (그늘은 청록). 눈, 코, 입, 표정이 그려지지 않았다. 글자, 로고가 없다
- [ ] 그림 가장자리가 `#0B0B0B` 로 끝난다
- [ ] 투표 칸 크기(폭 약 170px)로 줄여도 머리 모양과 옷 윤곽만으로 누가 누군지 구별된다

## 6. 생성 기록

| 날짜 | 인물 | 버전 | 도구, 모델 | 크레딧 | 메모 |
| --- | --- | --- | --- | --- | --- |
| 2026-11-27 | fav | v1~v3 | ChatGPT 이미지 생성 (GPT 이미지) | 0 (플랜 포함, 추가 결제 없음) | 시험. v1 그림자가 청록이라 영상과 다름, v2 밝은 면이 베이지, v3 톤은 맞지만 얼굴이 완전히 빔. v1은 A안 견본으로 썼다가 v3 확정 뒤 레포에서 뺌, v2와 v3는 레포에 두지 않음 |
| 2026-11-27 | athlete, villain | v1 | ChatGPT 이미지 생성 (GPT 이미지) | 0 (플랜 포함, 추가 결제 없음) | A안 견본 (얼굴, 포즈 수정 전). v3 확정 뒤 레포에서 뺌 |
| 2026-11-27 | fav | B v4 | ChatGPT 이미지 생성 (GPT 이미지) | 0 (플랜 포함, 추가 결제 없음) | B안. A로 정해져 레포에서 뺌 |
| 2026-11-27 | villain | B v1 | ChatGPT 이미지 생성 (GPT 이미지) | 0 (플랜 포함, 추가 결제 없음) | B안 안에서 채택했으나 A로 정해져 레포에서 뺌. 참고 이미지 fav-v4 |
| 2026-11-27 | athlete | B v1 | ChatGPT 이미지 생성 (GPT 이미지) | 0 (플랜 포함, 추가 결제 없음) | B안 안에서 채택했으나 A로 정해져 레포에서 뺌. 참고 이미지 fav-v4 |
| 2026-11-27 | writer | B v1 | ChatGPT 이미지 생성 (GPT 이미지) | 0 (플랜 포함, 추가 결제 없음) | B안 안에서 채택했으나 A로 정해져 레포에서 뺌. 참고 이미지 fav-v4 |
| 2026-11-27 | influencer | B v1 | ChatGPT 이미지 생성 (GPT 이미지) | 0 (플랜 포함, 추가 결제 없음) | B안. 레포에 넣지 않음. 다시 뽑기로 함. 배경이 가장자리가 딱 잘린 평평한 원이라 후광처럼 보이고 혼자 튐 (프롬프트 탓). 야자잎 그림자로 바꿈 |
| 2026-11-27 | medic | B v1 | ChatGPT 이미지 생성 (GPT 이미지) | 0 (플랜 포함, 추가 결제 없음) | B안. 레포에 넣지 않음. 다시 뽑기로 함. 특징이 약하고 썸네일에서 악역과 머리가 비슷함. 청진기, V넥 스크럽, 몸 방향 오른쪽 3/4로 바꿈 (정연 확인 필요) |
| 2026-11-27 | fav | v2 | ChatGPT 이미지 생성 (GPT 이미지) | 0 (플랜 포함, 추가 결제 없음) | A안 확정 프롬프트 (v2). 레포에 두지 않음 |
| 2026-11-27 | villain | v2 | ChatGPT 이미지 생성 (GPT 이미지) | 0 (플랜 포함, 추가 결제 없음) | A안 확정 프롬프트 (v2). 레포에 두지 않음. 6명 중 가장 어둡다 (검정 약 73%, 다른 인물 60~65%) |
| 2026-11-27 | athlete | v2 | ChatGPT 이미지 생성 (GPT 이미지) | 0 (플랜 포함, 추가 결제 없음) | A안 확정 프롬프트 (v2). 레포에 두지 않음 |
| 2026-11-27 | writer | v2 | ChatGPT 이미지 생성 (GPT 이미지) | 0 (플랜 포함, 추가 결제 없음) | A안 확정 프롬프트 (v2). 레포에 두지 않음. 레드(후드 안쪽)가 작게 보임 |
| 2026-11-27 | influencer | v2 | ChatGPT 이미지 생성 (GPT 이미지) | 0 (플랜 포함, 추가 결제 없음) | A안 확정 프롬프트 (v2). 레포에 두지 않음. 고개가 오른쪽 위를 봄 (프롬프트는 왼쪽 옆모습). 레드가 작게 보임 |
| 2026-11-27 | medic | v2 | ChatGPT 이미지 생성 (GPT 이미지) | 0 (플랜 포함, 추가 결제 없음) | A안 확정 프롬프트 (v2). 레포에 두지 않음. 몸이 거의 정면. 레드(V넥 테두리)가 아주 작게 보임 |
| 2026-11-27 | fav | **v3 확정** | ChatGPT 이미지 생성 (GPT 이미지) | 0 (플랜 포함, 추가 결제 없음) | 레드 3%, 악역 코트 밝게 고친 프롬프트. 레드 근사 1.3% |
| 2026-11-27 | villain | **v3 확정** | ChatGPT 이미지 생성 (GPT 이미지) | 0 (플랜 포함, 추가 결제 없음) | 레드 3%, 악역 코트 밝게 고친 프롬프트. 레드 근사 4.4% |
| 2026-11-27 | athlete | **v3 확정** | ChatGPT 이미지 생성 (GPT 이미지) | 0 (플랜 포함, 추가 결제 없음) | 레드 3%, 악역 코트 밝게 고친 프롬프트. 레드 근사 2.1% |
| 2026-11-27 | writer | **v3 확정** | ChatGPT 이미지 생성 (GPT 이미지) | 0 (플랜 포함, 추가 결제 없음) | 레드 3%, 악역 코트 밝게 고친 프롬프트. 레드 근사 0.7% |
| 2026-11-27 | influencer | **v3 확정** | ChatGPT 이미지 생성 (GPT 이미지) | 0 (플랜 포함, 추가 결제 없음) | 레드 3%, 악역 코트 밝게 고친 프롬프트. 레드 근사 1.8% |
| 2026-11-27 | medic | **v3 확정** | ChatGPT 이미지 생성 (GPT 이미지) | 0 (플랜 포함, 추가 결제 없음) | 레드 3%, 악역 코트 밝게 고친 프롬프트. 레드 근사 0.7% |

## 7. 바꾼 기록

| 날짜 | 바꾼 것 |
| --- | --- |
| 2026-11-27 | 처음 씀. 성별과 나이는 모호하게 두기로 함 (상경) |
| 2026-11-27 | 팔레트 6색을 모두 넣고 버건디(가장 깊은 그림자), 앰버(빛 닿는 가장자리) 역할을 고정. 빛을 하나로 정리, 배경 무늬를 Teal과 Ivory 평평한 면으로 제한, 인플루언서 조명 원을 "빛나는"에서 "평평한 Ivory 원"으로 (상경) |
| 2026-11-27 | 6명이 모두 같은 곳을 보는 것 같아 몸 방향을 인물마다 다르게 함 (왼쪽 3/4 둘, 오른쪽 3/4 하나, 옆모습 둘, 정면 하나). 등 돌림, 고개 숙임, 돌아보기는 금지 (상경) |
| 2026-11-27 | 6명이 비슷해 보일 수 있어 체형, 머리, 옷 구조, 손동작을 인물마다 확실히 다르게 함. 인물 설명을 프롬프트 맨 앞으로 옮기고 공통 스타일을 줄임 (상경) |
| 2026-11-27 | ART.md §9를 이 문서에 맞춰 고침. §9에는 원칙(넣지 않는 것, 같게 할 것, 다르게 할 것)만 두고 인물별 표는 이 문서 2번 한 곳에만 둔다 (상경) |
| 2026-11-27 | `fav` 시험 3번 끝에 영상과 톤을 맞춤. 1차는 그림자 면이 청록이라(약 18%) 영상(검정, 아이보리, 레드 3색)과 달라 보였고, 2차는 밝은 면이 베이지로 누렇게 나왔다. 그림자는 검정, 청록은 벽 그림자에 옅게, 밝은 면은 맑은 아이보리, 질감은 영상 `{STYLE}` 의 말(대비, 필름 입자, 망점)로 바꾸고 테두리 빛을 뺌. Avoid에 `teal-dominant shading, colored rim light, beige or tan cast, sepia tone` 추가. 몸 방향을 "그림의 왼쪽/오른쪽을 향해"로 분명하게 (상경) |
| 2026-11-27 | 얼굴이 완전히 비어 보여서 빛과 그림자로 얼굴형만 조금 보이게 함 (`fav` 시험 4차). 눈썹 아래 옅은 그림자, 그늘진 뺨과 턱선만 두고 눈, 코, 입, 표정은 그리지 않는다. 코 그림자까지 넣은 안은 너무 자세해서 뺐다. Avoid의 `face, facial features` 는 얼굴형 그림자까지 지울 수 있어 눈, 코, 입, 표정을 하나씩 막는 말로 바꿈. ART.md §3, §9도 같이 고침 (상경) |
| 2026-11-27 | 인플루언서 배경을 평평한 원에서 창밖 야자잎 그림자로 (원이 딱 잘려 후광처럼 보이고 혼자 튐). 의료 담당은 특징이 약해 청진기(목에 걸기, 손에 들지 않음), V넥 스크럽, 귀 뒤로 넘긴 짧은 머리, 몸 오른쪽 3/4로. 공통 틀의 `dark shadow bars` 를 `dark cast shadows` 로 (상경) |
| 2026-11-27 | 화풍을 A(청록 그림자)와 B(영상 톤) 두 안으로 나눠 `characters-a.md`, `characters-b.md` 에 둠 (지금은 지움). 정연, 지영과 같이 보고 정한다 (CQ-4). ART.md §3, §9의 B 기준 수정은 되돌리고 B로 정해지면 다시 한다 (상경) |
| 2026-11-27 | A안에도 B안에서 확정한 얼굴 명암(눈썹 아래 옅은 그림자, 그늘진 뺨과 턱)을 넣음. 그늘 색만 청록. 두 안은 이제 색과 질감만 다르다 (상경) |
| 2026-11-27 | 화풍을 A안으로 정함 (CQ-4). A안 프롬프트를 이 문서 1번으로 옮기고 `characters-a.md`, `characters-b.md` 를 지움. B안 이미지는 레포에서 빼고, A안 견본을 `<ID>-v1.jpg` 로 옮김. 다음 A안 이미지는 v2. ART.md §3, §9에 얼굴 명암만 반영 (상경) |
| 2026-11-27 | v2를 보고 고침. 레드가 인물마다 0~0.9%로 고르지 않고 작아서, 레드 자리를 넓게(깃 전체, 넓은 띠, 소매 줄) 바꾸고 6명 모두 그림의 약 3%로 맞춤. 악역이 6명 중 가장 어두워(검정 약 73%) 코트를 검정이 아닌 중간 톤으로 (ART.md §9 "악역이라고 더 어둡게 그리지 않는다"). 몸 방향과 앰버 테두리선은 그대로 둠 (상경) |
| 2026-11-27 | v3 6장을 확정본으로 함 (`<ID>-v3.jpg`). 악역 코트가 밝아져 검정 비중이 다른 인물과 비슷해짐(약 53~63%). 레드는 0.7~4.4%(근사, 그늘진 레드는 버건디로 세어져 실제보다 작게 나옴)로 v2(0~0.9%)보다 고르지만 악역과 운동선수가 크고 작가, 의료 담당이 작다. 확정본이라 그대로 두고 팀 확인에서 보기로 함. 견본 v1(A, 수정 전)은 레포에서 뺌 (상경) |

## 8. 정할 것

| 번호 | 질문 | 상태 | 맞출 사람 |
| --- | --- | --- | --- |
| CQ-1 | 인물 일러스트를 FR-081 "개인 화면 이미지"로 보고 만들어도 되나 | 확인 전 | PO |
| CQ-2 | 2번 인물 표가 범인 특징, 단서 물건, 인물 소개와 어긋나지 않나. 특히 의료 담당의 청진기가 앞으로 쓸 단서(TODO 칸)와 겹치지 않나 | 확인 전 (1차 이미지와 함께 확인 요청 예정) | 정연 |
| CQ-4 | 인물 화풍을 A(청록 그림자)와 B(영상 톤) 중 무엇으로 할지 | **정함 (2026-11-27): A**. 팀에 물어 정함 (상경 전달) | 상경, 지영, 정연 |
| CQ-3 | 앱에서 쓸 인물 이미지를 레포 어디에 둘지 (`public/images/` 안 `제안`. 영상은 `public/videos/` 로 정해짐, #85) | 확인 전 | 상경, 개발 |
