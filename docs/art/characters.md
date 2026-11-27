# 인물 6명 프롬프트와 생성 기록

> 담당: 상경. 이슈 #87. 상태 **제안** (정연 인물 표 확인, PO 범위 확인 전. 8번)
> 근거: [prd.md](../prd.md) FR-081(이미지: 개인 화면 이미지), BR-006, BR-008 / [spec.md](../spec.md) S-08, S-11 / [DESIGN.md](../../DESIGN.md) §6 투표 칸 / [ART.md](../../ART.md) §8, §9, §11, §13 / [live-death.json](../../scenarios/live-death.json)

## 1. 프롬프트 (복사해서 쓰기)

- 인물마다 **프롬프트 한 덩어리 + 공통 금지**만 넣으면 된다
- 금지 칸이 없는 도구는 프롬프트 맨 뒤에 `Avoid: ` 를 붙이고 공통 금지를 이어 쓴다
- 앞부분 스타일은 [ART.md](../../ART.md) §8에서 왔고, 인물에 맞게 아래만 바꿨다. §8이 바뀌면 여기 6개도 같이 바꾼다
  - 팔레트 6색은 그대로 쓰되 역할을 고정했다: 바탕 Ink Black, 빛 Ivory, 그림자 Petrol Teal, 강조 Vermilion(옷 한 군데, 5% 이하), **Burgundy는 가장 깊은 그림자에만, Amber는 빛이 실루엣 가장자리에 닿는 곳에만** 아주 조금. 6명 모두 같은 자리에만 쓰게 해서 인물마다 색이 달라지지 않게 한다
  - 빛은 하나: 왼쪽 위에서 와서 몸 왼쪽은 Ivory, 오른쪽은 Teal 그림자
  - 배경 무늬(창 그림자, 블라인드, 조명 원 등)는 평평한 Teal과 Ivory 면으로만. 따뜻한 색이나 빛나는 효과를 쓰지 않는다
  - §8의 "비대칭 구도" 문장은 뺐다. 인물은 6명이 같은 자리에 서야 해서 가운데에 둔다 (ART.md §9)
- 성별과 나이는 정하지 않고 모호하게 둔다 (시나리오에 없음)

### 공통 금지 (6명 모두)

```text
text, letters, numbers, captions, logos, watermark, signature, real brands, photorealism, 3D render, glossy CGI, anime, cartoon outlines, face, eyes, nose, mouth, facial features, gore, blood, weapons, extra colors outside the palette, busy background, hat, cap, headset, radio, earpiece, lanyard, badge, bag, towel, bandage, knee brace, phone, bottle, perfume, props in hands, crossed arms, clenched fists, hunched shoulders, limping, weight on one leg, multiple people
```

ART.md §8 금지의 `symmetrical centered poster layout` 은 뺐다. 인물은 6명이 같은 자리에 서야 해서 가운데에 둔다 (ART.md §9 "같게 할 것").

### 국민 호감 1위 (`fav`)

```text
Mid-century graphic noir illustration: classic film-noir chiaroscuro combined with 1950s-60s modernist poster design. Flat, geometric color shapes with hard-edged light and shadow; form is built by the boundary between light and shadow, not by outlines. Silhouette-driven figure with no facial features, no anatomical detail and no clothing folds. Bold omission: only a few defining shapes get detail. Limited palette with a strict hierarchy, using only these six colors: ink black #121212 and ivory #F2EBDC as bases, vermilion #BF3026 as the single accent, petrol teal #285E60 for shadows and depth, a tiny touch of burgundy #65282D only in the deepest shadows, and a tiny touch of amber #B99053 only where the light meets the edge of the silhouette. About 85% flat color and 15% grainy gradient only for light falloff. Subtle screen-print paper grain inside color fields; deep black areas stay clean. Outer edges fade to pure #0B0B0B. Intellectual, mysterious, classic, tense.
Single character portrait, one person only, gender-neutral and age-ambiguous silhouette. Vertical 2:3 frame. Waist-up, body turned three-quarters to the left, calm neutral posture, arms relaxed at the sides, empty hands. The figure is centered horizontally; the head sits about one third from the top, and the head and shoulders stay within the middle half of the frame height. A single hard light from the upper left lights the left side of the figure in ivory; the right side falls into petrol teal shadow. Ink black wall behind. Any light or shadow pattern on the wall is drawn as flat petrol teal and ivory shapes only, never warm and never glowing. Vermilion appears in only one small clothing detail and covers less than 5% of the image.
Background: the shadow of an arched window cast on the wall behind. Hair: neat short hair. Clothing: a round-neck knit sweater with one bold horizontal vermilion stripe across the chest.
```

### 악역 담당 (`villain`)

```text
Mid-century graphic noir illustration: classic film-noir chiaroscuro combined with 1950s-60s modernist poster design. Flat, geometric color shapes with hard-edged light and shadow; form is built by the boundary between light and shadow, not by outlines. Silhouette-driven figure with no facial features, no anatomical detail and no clothing folds. Bold omission: only a few defining shapes get detail. Limited palette with a strict hierarchy, using only these six colors: ink black #121212 and ivory #F2EBDC as bases, vermilion #BF3026 as the single accent, petrol teal #285E60 for shadows and depth, a tiny touch of burgundy #65282D only in the deepest shadows, and a tiny touch of amber #B99053 only where the light meets the edge of the silhouette. About 85% flat color and 15% grainy gradient only for light falloff. Subtle screen-print paper grain inside color fields; deep black areas stay clean. Outer edges fade to pure #0B0B0B. Intellectual, mysterious, classic, tense.
Single character portrait, one person only, gender-neutral and age-ambiguous silhouette. Vertical 2:3 frame. Waist-up, body turned three-quarters to the left, calm neutral posture, arms relaxed at the sides, empty hands. The figure is centered horizontally; the head sits about one third from the top, and the head and shoulders stay within the middle half of the frame height. A single hard light from the upper left lights the left side of the figure in ivory; the right side falls into petrol teal shadow. Ink black wall behind. Any light or shadow pattern on the wall is drawn as flat petrol teal and ivory shapes only, never warm and never glowing. Vermilion appears in only one small clothing detail and covers less than 5% of the image.
Background: a single diagonal beam of light falling across the wall behind. Hair: slicked-back hair. Clothing: a jacket with sharp angular lapels, vermilion only on the inner lining of the V-shaped lapel.
```

### 전직 운동선수 (`athlete`)

```text
Mid-century graphic noir illustration: classic film-noir chiaroscuro combined with 1950s-60s modernist poster design. Flat, geometric color shapes with hard-edged light and shadow; form is built by the boundary between light and shadow, not by outlines. Silhouette-driven figure with no facial features, no anatomical detail and no clothing folds. Bold omission: only a few defining shapes get detail. Limited palette with a strict hierarchy, using only these six colors: ink black #121212 and ivory #F2EBDC as bases, vermilion #BF3026 as the single accent, petrol teal #285E60 for shadows and depth, a tiny touch of burgundy #65282D only in the deepest shadows, and a tiny touch of amber #B99053 only where the light meets the edge of the silhouette. About 85% flat color and 15% grainy gradient only for light falloff. Subtle screen-print paper grain inside color fields; deep black areas stay clean. Outer edges fade to pure #0B0B0B. Intellectual, mysterious, classic, tense.
Single character portrait, one person only, gender-neutral and age-ambiguous silhouette. Vertical 2:3 frame. Waist-up, body turned three-quarters to the left, calm neutral posture, arms relaxed at the sides, empty hands. The figure is centered horizontally; the head sits about one third from the top, and the head and shoulders stay within the middle half of the frame height. A single hard light from the upper left lights the left side of the figure in ivory; the right side falls into petrol teal shadow. Ink black wall behind. Any light or shadow pattern on the wall is drawn as flat petrol teal and ivory shapes only, never warm and never glowing. Vermilion appears in only one small clothing detail and covers less than 5% of the image.
Background: horizontal slat shadows on the wall behind. Hair: very short cropped hair, broad shoulders. Clothing: a zip-up track jacket with a high collar and one vermilion stripe running down along the shoulder line.
```

### 막내 작가 (`writer`)

```text
Mid-century graphic noir illustration: classic film-noir chiaroscuro combined with 1950s-60s modernist poster design. Flat, geometric color shapes with hard-edged light and shadow; form is built by the boundary between light and shadow, not by outlines. Silhouette-driven figure with no facial features, no anatomical detail and no clothing folds. Bold omission: only a few defining shapes get detail. Limited palette with a strict hierarchy, using only these six colors: ink black #121212 and ivory #F2EBDC as bases, vermilion #BF3026 as the single accent, petrol teal #285E60 for shadows and depth, a tiny touch of burgundy #65282D only in the deepest shadows, and a tiny touch of amber #B99053 only where the light meets the edge of the silhouette. About 85% flat color and 15% grainy gradient only for light falloff. Subtle screen-print paper grain inside color fields; deep black areas stay clean. Outer edges fade to pure #0B0B0B. Intellectual, mysterious, classic, tense.
Single character portrait, one person only, gender-neutral and age-ambiguous silhouette. Vertical 2:3 frame. Waist-up, body turned three-quarters to the left, calm neutral posture, arms relaxed at the sides, empty hands. The figure is centered horizontally; the head sits about one third from the top, and the head and shoulders stay within the middle half of the frame height. A single hard light from the upper left lights the left side of the figure in ivory; the right side falls into petrol teal shadow. Ink black wall behind. Any light or shadow pattern on the wall is drawn as flat petrol teal and ivory shapes only, never warm and never glowing. Vermilion appears in only one small clothing detail and covers less than 5% of the image.
Background: vertical venetian-blind shadows on the wall behind. Hair: hair tied back. Clothing: a hoodie with the hood down, vermilion only on the inside of the hood.
```

### 인플루언서 (`influencer`)

```text
Mid-century graphic noir illustration: classic film-noir chiaroscuro combined with 1950s-60s modernist poster design. Flat, geometric color shapes with hard-edged light and shadow; form is built by the boundary between light and shadow, not by outlines. Silhouette-driven figure with no facial features, no anatomical detail and no clothing folds. Bold omission: only a few defining shapes get detail. Limited palette with a strict hierarchy, using only these six colors: ink black #121212 and ivory #F2EBDC as bases, vermilion #BF3026 as the single accent, petrol teal #285E60 for shadows and depth, a tiny touch of burgundy #65282D only in the deepest shadows, and a tiny touch of amber #B99053 only where the light meets the edge of the silhouette. About 85% flat color and 15% grainy gradient only for light falloff. Subtle screen-print paper grain inside color fields; deep black areas stay clean. Outer edges fade to pure #0B0B0B. Intellectual, mysterious, classic, tense.
Single character portrait, one person only, gender-neutral and age-ambiguous silhouette. Vertical 2:3 frame. Waist-up, body turned three-quarters to the left, calm neutral posture, arms relaxed at the sides, empty hands. The figure is centered horizontally; the head sits about one third from the top, and the head and shoulders stay within the middle half of the frame height. A single hard light from the upper left lights the left side of the figure in ivory; the right side falls into petrol teal shadow. Ink black wall behind. Any light or shadow pattern on the wall is drawn as flat petrol teal and ivory shapes only, never warm and never glowing. Vermilion appears in only one small clothing detail and covers less than 5% of the image.
Background: a large flat ivory circle of light on the wall behind the head. Hair: long hair. Clothing: an oversized jacket with a thin vermilion trim along the lapel edge.
```

### 의료 담당 (`medic`)

```text
Mid-century graphic noir illustration: classic film-noir chiaroscuro combined with 1950s-60s modernist poster design. Flat, geometric color shapes with hard-edged light and shadow; form is built by the boundary between light and shadow, not by outlines. Silhouette-driven figure with no facial features, no anatomical detail and no clothing folds. Bold omission: only a few defining shapes get detail. Limited palette with a strict hierarchy, using only these six colors: ink black #121212 and ivory #F2EBDC as bases, vermilion #BF3026 as the single accent, petrol teal #285E60 for shadows and depth, a tiny touch of burgundy #65282D only in the deepest shadows, and a tiny touch of amber #B99053 only where the light meets the edge of the silhouette. About 85% flat color and 15% grainy gradient only for light falloff. Subtle screen-print paper grain inside color fields; deep black areas stay clean. Outer edges fade to pure #0B0B0B. Intellectual, mysterious, classic, tense.
Single character portrait, one person only, gender-neutral and age-ambiguous silhouette. Vertical 2:3 frame. Waist-up, body turned three-quarters to the left, calm neutral posture, arms relaxed at the sides, empty hands. The figure is centered horizontally; the head sits about one third from the top, and the head and shoulders stay within the middle half of the frame height. A single hard light from the upper left lights the left side of the figure in ivory; the right side falls into petrol teal shadow. Ink black wall behind. Any light or shadow pattern on the wall is drawn as flat petrol teal and ivory shapes only, never warm and never glowing. Vermilion appears in only one small clothing detail and covers less than 5% of the image.
Background: grid-shaped window-bar shadows on the wall behind. Hair: short hair cut above the ears. Clothing: a plain collarless uniform top with a thin vermilion trim along the V-neck.
```

## 2. 인물 표 (ART.md §9와 같음)

인물은 색이 아니라 아래 네 가지로 구별한다. 6명 모두 색 비중, 빛, 구도, 자세가 같다.

| ID | 이름 (소개) | 배경 그림자 | 레드 자리 | 머리 | 목선과 옷 |
| --- | --- | --- | --- | --- | --- |
| `fav` | 국민 호감 1위 (착한 이미지로 인기 1위) | 아치형 창 그림자 | 니트 가슴의 굵은 가로 줄 | 단정한 짧은 머리 | 둥근 목 니트 |
| `villain` | 악역 담당 (방송에서 욕먹는 캐릭터) | 사선으로 떨어지는 빛 한 줄기 | 재킷 V자 깃 안쪽 | 뒤로 넘긴 머리 | 각진 재킷 깃 |
| `athlete` | 전직 운동선수 (상금이 꼭 필요한 사람) | 가로 줄 그림자 | 어깨선 따라 트레이닝 줄 | 아주 짧은 머리, 넓은 어깨 | 높이 올린 집업 깃 |
| `writer` | 막내 작가 (제작진이지만 섬에 남은 사람) | 세로 블라인드 그림자 | 후드 안쪽 | 묶은 머리 | 후드 |
| `influencer` | 인플루언서 (팔로워 300만, 방송보다 SNS) | 둥근 조명 원 | 재킷 깃 테두리 | 긴 머리 | 오버사이즈 재킷 |
| `medic` | 의료 담당 (출연자 건강 체크 스태프) | 바둑판 창살 그림자 | V넥 목선 테두리 | 귀 위로 짧은 머리 | 깃 없는 유니폼 |

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
| 손에 든 폰 | 단서 `c-r1-03` |
| 팔짱, 주먹, 움츠림 | 수상해 보이는 자세. 범인이 누구든 같은 그림이어야 한다 (ART.md §6, §9) |

## 4. 뽑을 때

- 통일성은 프롬프트보다 뽑는 방법이 더 크게 좌우한다
  - 6명을 한 번에 같은 도구, 같은 모델, 같은 화질로 뽑는다
  - 첫 번째로 마음에 드는 그림을 나머지 5명의 "스타일 참고 이미지"로 넣는다
  - 시드를 고정할 수 있는 도구면 같은 시드를 쓴다
- HEX 값은 도구가 잘 안 따를 수 있다. 결과 색이 조금 다르면 나중에 팔레트로 보정한다
- 최종 크기 1170×1755px (2:3). 9:16만 되는 도구는 9:16으로 뽑고 2:3으로 자른다 (ART.md §11)
- 결과는 이 폴더의 `characters/` 에 `<ID>-v<버전>.png` 로 둔다 (예: `characters/fav-v1.png`). 검토용이다. 앱에서 쓸 파일은 위치를 따로 정한다 (8번 CQ-3)
- 다시 뽑을 때는 바뀐 점만 적고 버전을 올린다. 도구, 모델, 크레딧을 6번 기록에 남긴다

## 5. 뽑은 뒤 확인 (ART.md §13)

- [ ] 3번 표의 것이 하나도 없다
- [ ] 6명의 빛 방향과 세기, 색 비중, 크기가 같다. 악역만 더 어둡거나 호감만 더 밝지 않다
- [ ] 자세가 모두 차분하다
- [ ] 레드가 옷 한 군데에만 있다. 버건디는 가장 깊은 그림자, 앰버는 빛 닿는 가장자리에만 있다
- [ ] 배경 무늬가 Teal과 Ivory 평평한 면이다 (따뜻한 색, 빛나는 효과 없음)
- [ ] 얼굴, 글자, 로고가 없다
- [ ] 그림 가장자리가 `#0B0B0B` 로 끝난다
- [ ] 투표 칸 크기(폭 약 170px)로 줄여도 누가 누군지 구별된다

## 6. 생성 기록

| 날짜 | 인물 | 버전 | 도구, 모델 | 크레딧 | 메모 |
| --- | --- | --- | --- | --- | --- |
| | | | | | |

## 7. 바꾼 기록

| 날짜 | 바꾼 것 |
| --- | --- |
| 2026-11-27 | 처음 씀. 성별과 나이는 모호하게 두기로 함 (상경) |
| 2026-11-27 | 팔레트 6색을 모두 넣고 버건디(가장 깊은 그림자), 앰버(빛 닿는 가장자리) 역할을 고정. 빛을 하나로 정리, 배경 무늬를 Teal과 Ivory 평평한 면으로 제한, 인플루언서 조명 원을 "빛나는"에서 "평평한 Ivory 원"으로 (상경) |

## 8. 정할 것

| 번호 | 질문 | 상태 | 맞출 사람 |
| --- | --- | --- | --- |
| CQ-1 | 인물 일러스트를 FR-081 "개인 화면 이미지"로 보고 만들어도 되나 | 확인 전 | PO |
| CQ-2 | 2번 인물 표가 범인 특징, 단서 물건, 인물 소개와 어긋나지 않나 | 확인 전 (1차 이미지와 함께 확인 요청 예정) | 정연 |
| CQ-3 | 앱에서 쓸 인물 이미지를 레포 어디에 둘지 (`public/images/` 안 `제안`. 영상은 `public/videos/` 로 정해짐, #85) | 확인 전 | 상경, 개발 |
