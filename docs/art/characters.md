# 인물 6명 프롬프트와 생성 기록

> 담당: 상경. 이슈 #87. 상태 **제안** (정연 인물 표 확인, PO 범위 확인 전. 8번)
> 근거: [prd.md](../prd.md) FR-081(이미지: 개인 화면 이미지), BR-006, BR-008 / [spec.md](../spec.md) S-08, S-11 / [DESIGN.md](../../DESIGN.md) §6 투표 칸 / [ART.md](../../ART.md) §8, §9, §11, §13 / [live-death.json](../../scenarios/live-death.json)

## 1. 프롬프트 (복사해서 쓰기)

- 인물마다 블록 하나를 그대로 넣는다. 마지막 `Avoid:` 줄은 금지 칸이 있는 도구면 그 칸으로 옮긴다
- 순서: **인물(체형, 머리, 옷, 자세, 배경) → 공통 스타일 → 공통 틀 → 금지**. 도구는 앞쪽 내용을 더 중요하게 보므로 인물 차이를 맨 앞에 둔다
- 공통 스타일은 [ART.md](../../ART.md) §8을 줄여 인물용으로 바꾼 것이다. §8이 바뀌면 여기 6개도 같이 바꾼다
  - 팔레트 6색, 역할 고정: 바탕 Ink Black, 빛 Ivory, 그림자 Petrol Teal, 강조 Vermilion(옷 한 군데, 5% 이하), Burgundy는 가장 깊은 그림자, Amber는 빛이 실루엣 가장자리에 닿는 곳에만
  - 빛은 하나 (왼쪽 위). 배경 무늬는 평평한 Teal과 Ivory 면만
  - §8의 "비대칭 구도" 문장은 뺐다. 인물은 썸네일로 잘라 쓰려고 가운데에 둔다
- 성별과 나이는 정하지 않는다. 대신 체형, 머리, 옷 구조, 자세를 인물마다 확실히 다르게 해서 썸네일에서도 구별되게 한다 (2번 표)

### 국민 호감 1위 (`fav`)

```text
A person of medium height with a soft, rounded build. Rounded soft bob haircut. A chunky cable-knit sweater with a round neck and one bold horizontal vermilion stripe across the chest. Calm pose: body turned three-quarters to the left, head turned slightly toward the viewer, both hands loosely clasped in front at the waist. Behind: the shadow of an arched window on the wall.
Style: mid-century graphic noir illustration, 1950s-60s modernist poster design with film-noir chiaroscuro. Flat geometric color shapes, hard-edged light and shadow, form built by light and shadow rather than outlines. Faceless, silhouette-driven figure: no facial features, no anatomical detail, few clothing folds. Palette of only six colors: ink black #121212 and ivory #F2EBDC as bases, vermilion #BF3026 as the single accent, petrol teal #285E60 for shadows, a tiny touch of burgundy #65282D in the deepest shadows, a tiny touch of amber #B99053 where the light meets the edge of the silhouette. Mostly flat color with a little grainy gradient for light falloff, subtle screen-print grain, outer edges fading to #0B0B0B. Mysterious, classic, tense.
Frame: vertical 2:3, waist-up, one person only, gender left ambiguous. The figure is centered; the head sits about one third from the top, and the head and shoulders stay within the middle half of the frame height. One hard light from the upper left: the lit side is ivory, the shadow side is petrol teal. Ink black wall; any pattern on the wall is drawn as flat petrol teal and ivory shapes only, never warm and never glowing. Vermilion appears only in one small clothing detail and covers less than 5% of the image.
Avoid: text, letters, numbers, captions, logos, watermark, signature, real brands, photorealism, 3D render, glossy CGI, anime, cartoon outlines, face, eyes, nose, mouth, facial features, gore, blood, weapons, extra colors outside the palette, busy background, hat, cap, headset, radio, earpiece, lanyard, badge, bag, towel, bandage, knee brace, phone, bottle, perfume, objects held in hands, crossed arms, clenched fists, hunched shoulders, limping, weight on one leg, back turned to the viewer, head bowed, looking down, looking back over the shoulder, multiple people.
```

### 악역 담당 (`villain`)

```text
A tall, thin person with an angular build. Sleek slicked-back hair. A long tailored coat with strong squared shoulders and wide pointed lapels, vermilion only on the inner lining of the lapel. Calm pose: body and head turned three-quarters to the right, head level, one hand lightly straightening the lapel. Behind: a single diagonal beam of light across the wall.
Style: mid-century graphic noir illustration, 1950s-60s modernist poster design with film-noir chiaroscuro. Flat geometric color shapes, hard-edged light and shadow, form built by light and shadow rather than outlines. Faceless, silhouette-driven figure: no facial features, no anatomical detail, few clothing folds. Palette of only six colors: ink black #121212 and ivory #F2EBDC as bases, vermilion #BF3026 as the single accent, petrol teal #285E60 for shadows, a tiny touch of burgundy #65282D in the deepest shadows, a tiny touch of amber #B99053 where the light meets the edge of the silhouette. Mostly flat color with a little grainy gradient for light falloff, subtle screen-print grain, outer edges fading to #0B0B0B. Mysterious, classic, tense.
Frame: vertical 2:3, waist-up, one person only, gender left ambiguous. The figure is centered; the head sits about one third from the top, and the head and shoulders stay within the middle half of the frame height. One hard light from the upper left: the lit side is ivory, the shadow side is petrol teal. Ink black wall; any pattern on the wall is drawn as flat petrol teal and ivory shapes only, never warm and never glowing. Vermilion appears only in one small clothing detail and covers less than 5% of the image.
Avoid: text, letters, numbers, captions, logos, watermark, signature, real brands, photorealism, 3D render, glossy CGI, anime, cartoon outlines, face, eyes, nose, mouth, facial features, gore, blood, weapons, extra colors outside the palette, busy background, hat, cap, headset, radio, earpiece, lanyard, badge, bag, towel, bandage, knee brace, phone, bottle, perfume, objects held in hands, crossed arms, clenched fists, hunched shoulders, limping, weight on one leg, back turned to the viewer, head bowed, looking down, looking back over the shoulder, multiple people.
```

### 전직 운동선수 (`athlete`)

```text
A sturdy person with a broad-shouldered, solid build. Buzz-cut hair. A boxy zip-up track jacket with a high stand collar and one vermilion stripe running down along the shoulder line. Calm pose: facing straight toward the viewer, shoulders square, head level, arms relaxed at the sides. Behind: horizontal slat shadows on the wall.
Style: mid-century graphic noir illustration, 1950s-60s modernist poster design with film-noir chiaroscuro. Flat geometric color shapes, hard-edged light and shadow, form built by light and shadow rather than outlines. Faceless, silhouette-driven figure: no facial features, no anatomical detail, few clothing folds. Palette of only six colors: ink black #121212 and ivory #F2EBDC as bases, vermilion #BF3026 as the single accent, petrol teal #285E60 for shadows, a tiny touch of burgundy #65282D in the deepest shadows, a tiny touch of amber #B99053 where the light meets the edge of the silhouette. Mostly flat color with a little grainy gradient for light falloff, subtle screen-print grain, outer edges fading to #0B0B0B. Mysterious, classic, tense.
Frame: vertical 2:3, waist-up, one person only, gender left ambiguous. The figure is centered; the head sits about one third from the top, and the head and shoulders stay within the middle half of the frame height. One hard light from the upper left: the lit side is ivory, the shadow side is petrol teal. Ink black wall; any pattern on the wall is drawn as flat petrol teal and ivory shapes only, never warm and never glowing. Vermilion appears only in one small clothing detail and covers less than 5% of the image.
Avoid: text, letters, numbers, captions, logos, watermark, signature, real brands, photorealism, 3D render, glossy CGI, anime, cartoon outlines, face, eyes, nose, mouth, facial features, gore, blood, weapons, extra colors outside the palette, busy background, hat, cap, headset, radio, earpiece, lanyard, badge, bag, towel, bandage, knee brace, phone, bottle, perfume, objects held in hands, crossed arms, clenched fists, hunched shoulders, limping, weight on one leg, back turned to the viewer, head bowed, looking down, looking back over the shoulder, multiple people.
```

### 막내 작가 (`writer`)

```text
A small, slight person with a narrow build. Hair loosely tied in a messy bun on top of the head. An oversized slouchy hoodie with the hood down, layered over a collared shirt, vermilion only on the inside of the hood. Calm pose: body and head turned three-quarters to the left, head level, both hands resting in the hoodie's front pocket. Behind: vertical venetian-blind shadows on the wall.
Style: mid-century graphic noir illustration, 1950s-60s modernist poster design with film-noir chiaroscuro. Flat geometric color shapes, hard-edged light and shadow, form built by light and shadow rather than outlines. Faceless, silhouette-driven figure: no facial features, no anatomical detail, few clothing folds. Palette of only six colors: ink black #121212 and ivory #F2EBDC as bases, vermilion #BF3026 as the single accent, petrol teal #285E60 for shadows, a tiny touch of burgundy #65282D in the deepest shadows, a tiny touch of amber #B99053 where the light meets the edge of the silhouette. Mostly flat color with a little grainy gradient for light falloff, subtle screen-print grain, outer edges fading to #0B0B0B. Mysterious, classic, tense.
Frame: vertical 2:3, waist-up, one person only, gender left ambiguous. The figure is centered; the head sits about one third from the top, and the head and shoulders stay within the middle half of the frame height. One hard light from the upper left: the lit side is ivory, the shadow side is petrol teal. Ink black wall; any pattern on the wall is drawn as flat petrol teal and ivory shapes only, never warm and never glowing. Vermilion appears only in one small clothing detail and covers less than 5% of the image.
Avoid: text, letters, numbers, captions, logos, watermark, signature, real brands, photorealism, 3D render, glossy CGI, anime, cartoon outlines, face, eyes, nose, mouth, facial features, gore, blood, weapons, extra colors outside the palette, busy background, hat, cap, headset, radio, earpiece, lanyard, badge, bag, towel, bandage, knee brace, phone, bottle, perfume, objects held in hands, crossed arms, clenched fists, hunched shoulders, limping, weight on one leg, back turned to the viewer, head bowed, looking down, looking back over the shoulder, multiple people.
```

### 인플루언서 (`influencer`)

```text
A tall, slender person with a long neck. Long straight hair falling past the shoulders. An oversized trench coat with a large collar, a thin vermilion trim along the collar edge. Calm pose: side profile facing left, chin slightly raised, one hand brushing the hair back from the shoulder. Behind: a large flat ivory circle of light on the wall behind the head.
Style: mid-century graphic noir illustration, 1950s-60s modernist poster design with film-noir chiaroscuro. Flat geometric color shapes, hard-edged light and shadow, form built by light and shadow rather than outlines. Faceless, silhouette-driven figure: no facial features, no anatomical detail, few clothing folds. Palette of only six colors: ink black #121212 and ivory #F2EBDC as bases, vermilion #BF3026 as the single accent, petrol teal #285E60 for shadows, a tiny touch of burgundy #65282D in the deepest shadows, a tiny touch of amber #B99053 where the light meets the edge of the silhouette. Mostly flat color with a little grainy gradient for light falloff, subtle screen-print grain, outer edges fading to #0B0B0B. Mysterious, classic, tense.
Frame: vertical 2:3, waist-up, one person only, gender left ambiguous. The figure is centered; the head sits about one third from the top, and the head and shoulders stay within the middle half of the frame height. One hard light from the upper left: the lit side is ivory, the shadow side is petrol teal. Ink black wall; any pattern on the wall is drawn as flat petrol teal and ivory shapes only, never warm and never glowing. Vermilion appears only in one small clothing detail and covers less than 5% of the image.
Avoid: text, letters, numbers, captions, logos, watermark, signature, real brands, photorealism, 3D render, glossy CGI, anime, cartoon outlines, face, eyes, nose, mouth, facial features, gore, blood, weapons, extra colors outside the palette, busy background, hat, cap, headset, radio, earpiece, lanyard, badge, bag, towel, bandage, knee brace, phone, bottle, perfume, objects held in hands, crossed arms, clenched fists, hunched shoulders, limping, weight on one leg, back turned to the viewer, head bowed, looking down, looking back over the shoulder, multiple people.
```

### 의료 담당 (`medic`)

```text
A person of medium height with an upright, neat build. Neat side-parted hair. A collarless tunic with a row of front buttons, a thin vermilion trim along the neckline. Calm pose: side profile facing right, back straight, head level, arms relaxed at the sides. Behind: grid-shaped window-bar shadows on the wall.
Style: mid-century graphic noir illustration, 1950s-60s modernist poster design with film-noir chiaroscuro. Flat geometric color shapes, hard-edged light and shadow, form built by light and shadow rather than outlines. Faceless, silhouette-driven figure: no facial features, no anatomical detail, few clothing folds. Palette of only six colors: ink black #121212 and ivory #F2EBDC as bases, vermilion #BF3026 as the single accent, petrol teal #285E60 for shadows, a tiny touch of burgundy #65282D in the deepest shadows, a tiny touch of amber #B99053 where the light meets the edge of the silhouette. Mostly flat color with a little grainy gradient for light falloff, subtle screen-print grain, outer edges fading to #0B0B0B. Mysterious, classic, tense.
Frame: vertical 2:3, waist-up, one person only, gender left ambiguous. The figure is centered; the head sits about one third from the top, and the head and shoulders stay within the middle half of the frame height. One hard light from the upper left: the lit side is ivory, the shadow side is petrol teal. Ink black wall; any pattern on the wall is drawn as flat petrol teal and ivory shapes only, never warm and never glowing. Vermilion appears only in one small clothing detail and covers less than 5% of the image.
Avoid: text, letters, numbers, captions, logos, watermark, signature, real brands, photorealism, 3D render, glossy CGI, anime, cartoon outlines, face, eyes, nose, mouth, facial features, gore, blood, weapons, extra colors outside the palette, busy background, hat, cap, headset, radio, earpiece, lanyard, badge, bag, towel, bandage, knee brace, phone, bottle, perfume, objects held in hands, crossed arms, clenched fists, hunched shoulders, limping, weight on one leg, back turned to the viewer, head bowed, looking down, looking back over the shoulder, multiple people.
```

## 2. 인물 표

6명 모두 색 비중, 빛, 크기가 같고 자세는 모두 차분하다. 구별은 **체형, 머리, 옷 구조, 자세(몸 방향), 배경 무늬, 레드 자리**로 한다. 썸네일에서는 머리 모양과 옷 윤곽이 가장 먼저 보이므로 6명이 서로 겹치지 않게 했다.

| ID | 이름 (소개) | 체형 | 머리 | 옷 구조 (레드 자리) | 자세 | 배경 무늬 |
| --- | --- | --- | --- | --- | --- | --- |
| `fav` | 국민 호감 1위 (착한 이미지로 인기 1위) | 보통 키, 부드럽고 둥근 | 둥글고 부드러운 단발 | 두툼한 꽈배기 니트, 둥근 목 (가슴 가로 줄) | 몸 왼쪽 3/4, 고개는 보는 사람 쪽으로 살짝, 두 손을 앞에서 가볍게 모음 | 아치형 창 그림자 |
| `villain` | 악역 담당 (방송에서 욕먹는 캐릭터) | 크고 마른, 각진 | 뒤로 넘긴 날렵한 머리 | 어깨가 각진 긴 코트, 넓고 뾰족한 깃 (깃 안감) | 몸 오른쪽 3/4, 한 손으로 깃을 살짝 정돈 | 사선으로 떨어지는 빛 한 줄기 |
| `athlete` | 전직 운동선수 (상금이 꼭 필요한 사람) | 다부지고 어깨가 넓은 | 아주 짧게 민 머리 | 박스형 집업 트레이닝 상의, 높은 깃 (어깨선 줄) | 정면, 어깨 반듯하게, 팔은 옆으로 | 가로 줄 그림자 |
| `writer` | 막내 작가 (제작진이지만 섬에 남은 사람) | 작고 마른 | 정수리에 대충 묶은 똥머리 | 크게 늘어진 후드티를 셔츠 위에 겹쳐 입음 (후드 안쪽) | 몸 왼쪽 3/4, 두 손을 후드 앞주머니에 | 세로 블라인드 그림자 |
| `influencer` | 인플루언서 (팔로워 300만, 방송보다 SNS) | 크고 늘씬한, 긴 목 | 어깨 아래까지 오는 긴 생머리 | 깃이 큰 오버사이즈 트렌치코트 (깃 테두리) | 왼쪽 옆모습, 턱을 살짝 들고 한 손으로 머리를 넘김 | 평평한 Ivory 조명 원 |
| `medic` | 의료 담당 (출연자 건강 체크 스태프) | 보통 키, 곧고 단정한 | 옆가르마를 탄 단정한 머리 | 앞단추가 있는 깃 없는 튜닉 (목선 테두리) | 오른쪽 옆모습, 등을 곧게 펴고 팔은 옆으로 | 바둑판 창살 그림자 |

몸 방향은 왼쪽 3/4 둘, 오른쪽 3/4 하나, 옆모습 둘(왼쪽, 오른쪽), 정면 하나로 고르게 나눠 한 사람만 튀지 않게 했다.

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
- 결과는 이 폴더의 `characters/` 에 `<ID>-v<버전>.png` 로 둔다 (예: `characters/fav-v1.png`). 검토용이다. 앱에서 쓸 파일은 위치를 따로 정한다 (8번 CQ-3)
- 다시 뽑을 때는 바뀐 점만 적고 버전을 올린다. 도구, 모델, 크레딧을 6번 기록에 남긴다

## 5. 뽑은 뒤 확인 (ART.md §13)

- [ ] 3번 표의 것이 하나도 없다
- [ ] 6명의 빛 방향과 세기, 색 비중, 크기가 같다. 악역만 더 어둡거나 호감만 더 밝지 않다
- [ ] 자세가 모두 차분하다. 몸 방향이 2번 표대로 서로 다르다 (등 돌림, 고개 숙임 없음)
- [ ] 레드가 옷 한 군데에만 있다. 버건디는 가장 깊은 그림자, 앰버는 빛 닿는 가장자리에만 있다
- [ ] 배경 무늬가 Teal과 Ivory 평평한 면이다 (따뜻한 색, 빛나는 효과 없음)
- [ ] 얼굴, 글자, 로고가 없다
- [ ] 그림 가장자리가 `#0B0B0B` 로 끝난다
- [ ] 투표 칸 크기(폭 약 170px)로 줄여도 머리 모양과 옷 윤곽만으로 누가 누군지 구별된다

## 6. 생성 기록

| 날짜 | 인물 | 버전 | 도구, 모델 | 크레딧 | 메모 |
| --- | --- | --- | --- | --- | --- |
| | | | | | |

## 7. 바꾼 기록

| 날짜 | 바꾼 것 |
| --- | --- |
| 2026-11-27 | 처음 씀. 성별과 나이는 모호하게 두기로 함 (상경) |
| 2026-11-27 | 팔레트 6색을 모두 넣고 버건디(가장 깊은 그림자), 앰버(빛 닿는 가장자리) 역할을 고정. 빛을 하나로 정리, 배경 무늬를 Teal과 Ivory 평평한 면으로 제한, 인플루언서 조명 원을 "빛나는"에서 "평평한 Ivory 원"으로 (상경) |
| 2026-11-27 | 6명이 모두 같은 곳을 보는 것 같아 몸 방향을 인물마다 다르게 함 (왼쪽 3/4 둘, 오른쪽 3/4 하나, 옆모습 둘, 정면 하나). 등 돌림, 고개 숙임, 돌아보기는 금지 (상경) |
| 2026-11-27 | 6명이 비슷해 보일 수 있어 체형, 머리, 옷 구조, 손동작을 인물마다 확실히 다르게 함. 인물 설명을 프롬프트 맨 앞으로 옮기고 공통 스타일을 줄임. ART.md §9의 표(몸 3/4 방향, 팔은 옆으로, 옷)와 달라져 §9도 고쳐야 함 (상경) |

## 8. 정할 것

| 번호 | 질문 | 상태 | 맞출 사람 |
| --- | --- | --- | --- |
| CQ-1 | 인물 일러스트를 FR-081 "개인 화면 이미지"로 보고 만들어도 되나 | 확인 전 | PO |
| CQ-2 | 2번 인물 표가 범인 특징, 단서 물건, 인물 소개와 어긋나지 않나 | 확인 전 (1차 이미지와 함께 확인 요청 예정) | 정연 |
| CQ-3 | 앱에서 쓸 인물 이미지를 레포 어디에 둘지 (`public/images/` 안 `제안`. 영상은 `public/videos/` 로 정해짐, #85) | 확인 전 | 상경, 개발 |
