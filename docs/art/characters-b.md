# 인물 프롬프트 B안: 영상 톤 (검정, 아이보리, 레드)

> 담당: 상경. 이슈 #87. 상태 **후보** (화풍 A, B 중 정하는 중. [characters.md](characters.md) 8번 CQ-4)
> 인물 표, 넣지 않는 것, 뽑는 방법, 생성 기록은 [characters.md](characters.md) 에 있다. 이 문서는 화풍과 프롬프트만 둔다

- 인물마다 블록 하나를 그대로 넣는다. 마지막 `Avoid:` 줄은 금지 칸이 있는 도구면 그 칸으로 옮긴다
- 인물 줄(첫 줄)은 A와 B가 같다. 다른 것은 `Style:`, `Frame:`, `Avoid:` 세 줄뿐이다

## 1. 화풍

[ART.md](../../ART.md) §8을 줄여 인물용으로 바꾸고, 질감과 대비는 지영의 영상 `{STYLE}`([V-01.md](../video/storyboards/V-01.md) §1)에 맞췄다. ART.md §5 "영상과 방송 화면은 3색"과 이어지게 했다.

- **검정과 아이보리가 주인공.** 바탕과 그림자 Ink Black, 빛 Ivory(맑은 크림색, 베이지 아님), 강조 Vermilion(옷 한 군데, 5% 이하). Petrol Teal은 벽 그림자에 옅게만, Burgundy는 가장 깊은 그림자, Amber는 아주 작은 따뜻한 반짝임만
- 질감: 높은 대비, 필름 입자, 망점(halftone), 1960년대 인쇄물 느낌 (영상과 같은 말)
- 얼굴: 거의 매끈한 아이보리 면에 눈썹 아래 옅은 그림자, 빛 반대쪽 뺨과 턱이 검게 지는 것만. 눈, 코, 입, 표정은 그리지 않는다 (6명 모두 같은 무표정)
- 빛은 하나 (왼쪽 위). 배경 무늬는 아이보리 빛과 검은 그림자. 인물 테두리에 색 있는 윤곽선이나 테두리 빛을 넣지 않는다
- 좋은 점: 영상 V-01 옆에 두면 같은 세계로 보인다. 얼굴형이 조금 보여 사람 같다
- 아쉬운 점: 색이 적어 A보다 단조로워 보일 수 있다
- 어떻게 정했나: `fav` 시험 4번. 1차 그림자가 청록, 2차 밝은 면이 베이지, 3차 얼굴이 완전히 빔, 4차 채택 ([characters.md](characters.md) 7번)

## 2. 뽑아 본 것

| 인물 | 파일 |
| --- | --- |
| `fav` | [fav-v4.jpg](characters/fav-v4.jpg) |
| `villain` | [villain-v1.jpg](characters/villain-v1.jpg) |
| `athlete` | [athlete-v1.jpg](characters/athlete-v1.jpg) |
| `writer` | [writer-v1.jpg](characters/writer-v1.jpg) |
| `influencer` | 다시 뽑을 것 (배경 원 → 야자잎 그림자) |
| `medic` | 다시 뽑을 것 (청진기, V넥 스크럽) |

## 3. 뽑은 뒤 확인 (B안만)

- [ ] 그림자 면이 청록이 아니라 검정이다. 청록은 벽 그림자에 옅게만, 버건디는 가장 깊은 그림자에만 있다
- [ ] 밝은 면이 맑은 아이보리다 (베이지, 세피아로 누렇지 않다). 인물 테두리에 색 있는 선이 없다
- [ ] 배경 무늬가 아이보리 빛과 검은 그림자다 (따뜻한 색, 빛나는 효과 없음)
- [ ] 지영의 영상 컷(V-01 스토리보드)과 나란히 놓았을 때 같은 세계로 보인다
- [ ] 얼굴은 눈썹 아래 옅은 그림자와 그늘진 뺨, 턱선뿐이다. 눈, 코, 입, 표정이 그려지지 않았다. 글자, 로고가 없다

## 4. B로 정하면 ART.md에서 고칠 것

- §3 Silhouette-driven: "얼굴, 해부학적 디테일, 옷 주름을 생략" → "이목구비, 해부학적 디테일, 옷 주름을 생략. 얼굴형은 빛과 그림자로만 조금 보인다 (§9)"
- §9 첫 문단: "얼굴을 그리지 않고" → "이목구비와 표정을 그리지 않고"
- §9 같게 할 것, 색: 그림자를 Petrol Teal에서 Ink Black으로, 청록은 벽 그림자에 옅게, 앰버는 작은 반짝임, 테두리 빛 없음, 질감은 영상 `{STYLE}` 과 같은 말
- §9 같게 할 것, 배경 무늬: "평평한 Petrol Teal과 Ivory 면만" → "아이보리 빛과 검은 그림자 (청록은 그림자에 옅게만)"
- §9 같게 할 것에 얼굴 줄 추가 (위 1번의 얼굴 설명)
- 화풍이 바뀌므로 ART.md §8 규칙대로 지영에게 알린다

## 5. 프롬프트

### 국민 호감 1위 (`fav`)

```text
A person of medium height with a soft, rounded build. Rounded soft bob haircut. A chunky cable-knit sweater with a round neck and one bold horizontal vermilion stripe across the chest. Calm pose: body clearly turned three-quarters toward the left side of the image, head turned slightly toward the viewer, both hands loosely clasped in front at the waist. Behind: the shadow of an arched window on the wall.
Style: Mid-Century Graphic Noir character portrait for a fictional island survival TV finale. Flat, high-contrast graphic shapes with fine film grain and a subtle halftone texture, like an aged 1960s screen print. Deep shadows, hard edge light, 1960s broadcast-graphic feel. Silhouette-driven figure. The face is mostly a smooth flat ivory shape with only a hint of structure from light: a faint shadow under the brow, and the shadow side of the cheek and jaw falling into black. Nothing else on the face. No drawn eyes, nose, lips or facial outlines. Calm, neutral, unreadable. Few anatomical details, few clothing folds. Mostly ink black #121212 and ivory #F2EBDC, with vermilion red #BF3026 as the only strong accent. Lit areas are clean bright ivory #F2EBDC, not beige or tan; amber #B99053 only as a tiny warm glint. Petrol teal #285E60 appears only as a faint dark tint inside the wall shadows; burgundy #65282D only in the very deepest shadow. Outer edges fade to #0B0B0B. Mysterious, classic, tense.
Frame: vertical 2:3, waist-up, one person only, gender left ambiguous. The figure is centered; the head sits about one third from the top, and the head and shoulders stay within the middle half of the frame height. One hard light from the upper left: the lit side is ivory, the shadow side falls into deep black, not teal. Near-black wall; the wall pattern is ivory light broken by dark cast shadows, never warm and never glowing. Vermilion appears only in one small clothing detail and covers less than 5% of the image. No colored outline or rim light around the figure.
Avoid: text, letters, numbers, captions, logos, watermark, signature, real brands, photorealism, 3D render, glossy CGI, anime, cartoon outlines, eyes, pupils, eyelashes, eyebrows drawn as lines, nose shape, nostrils, lips, mouth, makeup, smiling, frowning, any expression, detailed face, gore, blood, weapons, extra colors outside the palette, busy background, teal-dominant shading, colored rim light, beige or tan cast, sepia tone, hat, cap, headset, radio, earpiece, lanyard, badge, bag, towel, bandage, knee brace, phone, bottle, perfume, objects held in hands, crossed arms, clenched fists, hunched shoulders, limping, weight on one leg, back turned to the viewer, head bowed, looking down, looking back over the shoulder, multiple people.
```

### 악역 담당 (`villain`)

```text
A tall, thin person with an angular build. Sleek slicked-back hair. A long tailored coat with strong squared shoulders and wide pointed lapels, vermilion only on the inner lining of the lapel. Calm pose: body and head clearly turned three-quarters toward the right side of the image, head level, one hand lightly straightening the lapel. Behind: a single diagonal beam of light across the wall.
Style: Mid-Century Graphic Noir character portrait for a fictional island survival TV finale. Flat, high-contrast graphic shapes with fine film grain and a subtle halftone texture, like an aged 1960s screen print. Deep shadows, hard edge light, 1960s broadcast-graphic feel. Silhouette-driven figure. The face is mostly a smooth flat ivory shape with only a hint of structure from light: a faint shadow under the brow, and the shadow side of the cheek and jaw falling into black. Nothing else on the face. No drawn eyes, nose, lips or facial outlines. Calm, neutral, unreadable. Few anatomical details, few clothing folds. Mostly ink black #121212 and ivory #F2EBDC, with vermilion red #BF3026 as the only strong accent. Lit areas are clean bright ivory #F2EBDC, not beige or tan; amber #B99053 only as a tiny warm glint. Petrol teal #285E60 appears only as a faint dark tint inside the wall shadows; burgundy #65282D only in the very deepest shadow. Outer edges fade to #0B0B0B. Mysterious, classic, tense.
Frame: vertical 2:3, waist-up, one person only, gender left ambiguous. The figure is centered; the head sits about one third from the top, and the head and shoulders stay within the middle half of the frame height. One hard light from the upper left: the lit side is ivory, the shadow side falls into deep black, not teal. Near-black wall; the wall pattern is ivory light broken by dark cast shadows, never warm and never glowing. Vermilion appears only in one small clothing detail and covers less than 5% of the image. No colored outline or rim light around the figure.
Avoid: text, letters, numbers, captions, logos, watermark, signature, real brands, photorealism, 3D render, glossy CGI, anime, cartoon outlines, eyes, pupils, eyelashes, eyebrows drawn as lines, nose shape, nostrils, lips, mouth, makeup, smiling, frowning, any expression, detailed face, gore, blood, weapons, extra colors outside the palette, busy background, teal-dominant shading, colored rim light, beige or tan cast, sepia tone, hat, cap, headset, radio, earpiece, lanyard, badge, bag, towel, bandage, knee brace, phone, bottle, perfume, objects held in hands, crossed arms, clenched fists, hunched shoulders, limping, weight on one leg, back turned to the viewer, head bowed, looking down, looking back over the shoulder, multiple people.
```

### 전직 운동선수 (`athlete`)

```text
A sturdy person with a broad-shouldered, solid build. Buzz-cut hair. A boxy zip-up track jacket with a high stand collar and one vermilion stripe running down along the shoulder line. Calm pose: facing straight toward the viewer, shoulders square, head level, arms relaxed at the sides. Behind: horizontal slat shadows on the wall.
Style: Mid-Century Graphic Noir character portrait for a fictional island survival TV finale. Flat, high-contrast graphic shapes with fine film grain and a subtle halftone texture, like an aged 1960s screen print. Deep shadows, hard edge light, 1960s broadcast-graphic feel. Silhouette-driven figure. The face is mostly a smooth flat ivory shape with only a hint of structure from light: a faint shadow under the brow, and the shadow side of the cheek and jaw falling into black. Nothing else on the face. No drawn eyes, nose, lips or facial outlines. Calm, neutral, unreadable. Few anatomical details, few clothing folds. Mostly ink black #121212 and ivory #F2EBDC, with vermilion red #BF3026 as the only strong accent. Lit areas are clean bright ivory #F2EBDC, not beige or tan; amber #B99053 only as a tiny warm glint. Petrol teal #285E60 appears only as a faint dark tint inside the wall shadows; burgundy #65282D only in the very deepest shadow. Outer edges fade to #0B0B0B. Mysterious, classic, tense.
Frame: vertical 2:3, waist-up, one person only, gender left ambiguous. The figure is centered; the head sits about one third from the top, and the head and shoulders stay within the middle half of the frame height. One hard light from the upper left: the lit side is ivory, the shadow side falls into deep black, not teal. Near-black wall; the wall pattern is ivory light broken by dark cast shadows, never warm and never glowing. Vermilion appears only in one small clothing detail and covers less than 5% of the image. No colored outline or rim light around the figure.
Avoid: text, letters, numbers, captions, logos, watermark, signature, real brands, photorealism, 3D render, glossy CGI, anime, cartoon outlines, eyes, pupils, eyelashes, eyebrows drawn as lines, nose shape, nostrils, lips, mouth, makeup, smiling, frowning, any expression, detailed face, gore, blood, weapons, extra colors outside the palette, busy background, teal-dominant shading, colored rim light, beige or tan cast, sepia tone, hat, cap, headset, radio, earpiece, lanyard, badge, bag, towel, bandage, knee brace, phone, bottle, perfume, objects held in hands, crossed arms, clenched fists, hunched shoulders, limping, weight on one leg, back turned to the viewer, head bowed, looking down, looking back over the shoulder, multiple people.
```

### 막내 작가 (`writer`)

```text
A small, slight person with a narrow build. Hair loosely tied in a messy bun on top of the head. An oversized slouchy hoodie with the hood down, layered over a collared shirt, vermilion only on the inside of the hood. Calm pose: body and head clearly turned three-quarters toward the left side of the image, head level, both hands resting in the hoodie's front pocket. Behind: vertical venetian-blind shadows on the wall.
Style: Mid-Century Graphic Noir character portrait for a fictional island survival TV finale. Flat, high-contrast graphic shapes with fine film grain and a subtle halftone texture, like an aged 1960s screen print. Deep shadows, hard edge light, 1960s broadcast-graphic feel. Silhouette-driven figure. The face is mostly a smooth flat ivory shape with only a hint of structure from light: a faint shadow under the brow, and the shadow side of the cheek and jaw falling into black. Nothing else on the face. No drawn eyes, nose, lips or facial outlines. Calm, neutral, unreadable. Few anatomical details, few clothing folds. Mostly ink black #121212 and ivory #F2EBDC, with vermilion red #BF3026 as the only strong accent. Lit areas are clean bright ivory #F2EBDC, not beige or tan; amber #B99053 only as a tiny warm glint. Petrol teal #285E60 appears only as a faint dark tint inside the wall shadows; burgundy #65282D only in the very deepest shadow. Outer edges fade to #0B0B0B. Mysterious, classic, tense.
Frame: vertical 2:3, waist-up, one person only, gender left ambiguous. The figure is centered; the head sits about one third from the top, and the head and shoulders stay within the middle half of the frame height. One hard light from the upper left: the lit side is ivory, the shadow side falls into deep black, not teal. Near-black wall; the wall pattern is ivory light broken by dark cast shadows, never warm and never glowing. Vermilion appears only in one small clothing detail and covers less than 5% of the image. No colored outline or rim light around the figure.
Avoid: text, letters, numbers, captions, logos, watermark, signature, real brands, photorealism, 3D render, glossy CGI, anime, cartoon outlines, eyes, pupils, eyelashes, eyebrows drawn as lines, nose shape, nostrils, lips, mouth, makeup, smiling, frowning, any expression, detailed face, gore, blood, weapons, extra colors outside the palette, busy background, teal-dominant shading, colored rim light, beige or tan cast, sepia tone, hat, cap, headset, radio, earpiece, lanyard, badge, bag, towel, bandage, knee brace, phone, bottle, perfume, objects held in hands, crossed arms, clenched fists, hunched shoulders, limping, weight on one leg, back turned to the viewer, head bowed, looking down, looking back over the shoulder, multiple people.
```

### 인플루언서 (`influencer`)

```text
A tall, slender person with a long neck. Long straight hair falling past the shoulders. An oversized trench coat with a large collar, a thin vermilion trim along the collar edge. Calm pose: full side profile facing the left side of the image, chin slightly raised, one hand brushing the hair back from the shoulder. Behind: the shadows of palm leaves cast across a patch of light on the wall, as if from a window outside.
Style: Mid-Century Graphic Noir character portrait for a fictional island survival TV finale. Flat, high-contrast graphic shapes with fine film grain and a subtle halftone texture, like an aged 1960s screen print. Deep shadows, hard edge light, 1960s broadcast-graphic feel. Silhouette-driven figure. The face is mostly a smooth flat ivory shape with only a hint of structure from light: a faint shadow under the brow, and the shadow side of the cheek and jaw falling into black. Nothing else on the face. No drawn eyes, nose, lips or facial outlines. Calm, neutral, unreadable. Few anatomical details, few clothing folds. Mostly ink black #121212 and ivory #F2EBDC, with vermilion red #BF3026 as the only strong accent. Lit areas are clean bright ivory #F2EBDC, not beige or tan; amber #B99053 only as a tiny warm glint. Petrol teal #285E60 appears only as a faint dark tint inside the wall shadows; burgundy #65282D only in the very deepest shadow. Outer edges fade to #0B0B0B. Mysterious, classic, tense.
Frame: vertical 2:3, waist-up, one person only, gender left ambiguous. The figure is centered; the head sits about one third from the top, and the head and shoulders stay within the middle half of the frame height. One hard light from the upper left: the lit side is ivory, the shadow side falls into deep black, not teal. Near-black wall; the wall pattern is ivory light broken by dark cast shadows, never warm and never glowing. Vermilion appears only in one small clothing detail and covers less than 5% of the image. No colored outline or rim light around the figure.
Avoid: text, letters, numbers, captions, logos, watermark, signature, real brands, photorealism, 3D render, glossy CGI, anime, cartoon outlines, eyes, pupils, eyelashes, eyebrows drawn as lines, nose shape, nostrils, lips, mouth, makeup, smiling, frowning, any expression, detailed face, gore, blood, weapons, extra colors outside the palette, busy background, teal-dominant shading, colored rim light, beige or tan cast, sepia tone, hat, cap, headset, radio, earpiece, lanyard, badge, bag, towel, bandage, knee brace, phone, bottle, perfume, objects held in hands, crossed arms, clenched fists, hunched shoulders, limping, weight on one leg, back turned to the viewer, head bowed, looking down, looking back over the shoulder, multiple people.
```

### 의료 담당 (`medic`)

```text
A person of medium height with an upright, neat build. Short hair neatly tucked behind the ears. A short-sleeved V-neck medical scrub top layered over a fitted long-sleeved undershirt, a thin vermilion trim along the V-neckline. A stethoscope hangs loosely around the neck, resting on the chest, not held. Calm pose: body clearly turned three-quarters toward the right side of the image, back straight, head level, arms relaxed at the sides. Behind: grid-shaped window-bar shadows on the wall.
Style: Mid-Century Graphic Noir character portrait for a fictional island survival TV finale. Flat, high-contrast graphic shapes with fine film grain and a subtle halftone texture, like an aged 1960s screen print. Deep shadows, hard edge light, 1960s broadcast-graphic feel. Silhouette-driven figure. The face is mostly a smooth flat ivory shape with only a hint of structure from light: a faint shadow under the brow, and the shadow side of the cheek and jaw falling into black. Nothing else on the face. No drawn eyes, nose, lips or facial outlines. Calm, neutral, unreadable. Few anatomical details, few clothing folds. Mostly ink black #121212 and ivory #F2EBDC, with vermilion red #BF3026 as the only strong accent. Lit areas are clean bright ivory #F2EBDC, not beige or tan; amber #B99053 only as a tiny warm glint. Petrol teal #285E60 appears only as a faint dark tint inside the wall shadows; burgundy #65282D only in the very deepest shadow. Outer edges fade to #0B0B0B. Mysterious, classic, tense.
Frame: vertical 2:3, waist-up, one person only, gender left ambiguous. The figure is centered; the head sits about one third from the top, and the head and shoulders stay within the middle half of the frame height. One hard light from the upper left: the lit side is ivory, the shadow side falls into deep black, not teal. Near-black wall; the wall pattern is ivory light broken by dark cast shadows, never warm and never glowing. Vermilion appears only in one small clothing detail and covers less than 5% of the image. No colored outline or rim light around the figure.
Avoid: text, letters, numbers, captions, logos, watermark, signature, real brands, photorealism, 3D render, glossy CGI, anime, cartoon outlines, eyes, pupils, eyelashes, eyebrows drawn as lines, nose shape, nostrils, lips, mouth, makeup, smiling, frowning, any expression, detailed face, gore, blood, weapons, extra colors outside the palette, busy background, teal-dominant shading, colored rim light, beige or tan cast, sepia tone, hat, cap, headset, radio, earpiece, lanyard, badge, bag, towel, bandage, knee brace, phone, bottle, perfume, objects held in hands, crossed arms, clenched fists, hunched shoulders, limping, weight on one leg, back turned to the viewer, head bowed, looking down, looking back over the shoulder, multiple people.
```
