# 인물 프롬프트 A안: 청록 그림자

> 담당: 상경. 이슈 #87. 상태 **후보** (화풍 A, B 중 정하는 중. [characters.md](characters.md) 8번 CQ-4)
> 인물 표, 넣지 않는 것, 뽑는 방법, 생성 기록은 [characters.md](characters.md) 에 있다. 이 문서는 화풍과 프롬프트만 둔다

- 인물마다 블록 하나를 그대로 넣는다. 마지막 `Avoid:` 줄은 금지 칸이 있는 도구면 그 칸으로 옮긴다
- 인물 줄(첫 줄)은 A와 B가 같다. B안을 정하며 확정한 몸 방향, 손동작, 인플루언서 배경, 의료 담당 옷과 청진기가 그대로 들어 있다. 얼굴 명암도 B안과 같게 했다 (그늘 색만 청록). 다른 것은 색과 질감이다

## 1. 화풍

[ART.md](../../ART.md) §5 팔레트 6색을 역할을 정해 모두 쓴다. 처음 쓴 프롬프트(커밋 `fc51a2f`)다.

- 바탕 Ink Black, 빛 Ivory, **그림자 Petrol Teal**, 강조 Vermilion(옷 한 군데, 5% 이하), Burgundy는 가장 깊은 그림자, Amber는 빛이 실루엣 가장자리에 닿는 곳
- 빛은 하나 (왼쪽 위). 배경 무늬는 평평한 Teal과 Ivory 면
- 얼굴: B안과 같다. 거의 매끈한 아이보리 면에 눈썹 아래 옅은 그림자, 빛 반대쪽 뺨과 턱만 그늘진다 (A안은 그늘이 청록). 눈, 코, 입, 표정은 그리지 않는다
- 좋은 점: 색이 풍부해서 그림 한 장으로 보면 고급스럽다
- 아쉬운 점: 그림자 면 전체가 청록이라(`fav` 약 18%) §5 권장 비중(청록 7%)을 넘는다. 영상(검정, 아이보리, 레드 3색)과 나란히 두면 다른 작품처럼 보인다. 앰버가 테두리선처럼 보인다

## 2. 뽑아 본 것

| 인물 | 파일 |
| --- | --- |
| `fav` | [a/fav.jpg](characters/a/fav.jpg) |
| `athlete` | [a/athlete.jpg](characters/a/athlete.jpg) |
| `villain` | [a/villain.jpg](characters/a/villain.jpg) |

- 2026-11-27, ChatGPT 이미지 생성 (GPT 이미지), 크레딧 0 (플랜 포함). 이 세 장은 지금 프롬프트보다 앞선 것이다. 얼굴이 비어 있고 몸 방향이 덜 분명하다. 지금 프롬프트로 다시 뽑으면 얼굴형 그늘이 생긴다

## 3. 뽑은 뒤 확인 (A안만)

- [ ] 그림자 면이 Petrol Teal이다. 버건디는 가장 깊은 그림자, 앰버는 빛 닿는 가장자리에만 있다
- [ ] 배경 무늬가 Teal과 Ivory 평평한 면이다 (따뜻한 색, 빛나는 효과 없음)
- [ ] 얼굴은 눈썹 아래 옅은 그림자와 그늘진 뺨, 턱선뿐이다 (그늘은 청록). 눈, 코, 입, 표정이 그려지지 않았다. 글자, 로고가 없다

## 4. 프롬프트

### 국민 호감 1위 (`fav`)

```text
A person of medium height with a soft, rounded build. Rounded soft bob haircut. A chunky cable-knit sweater with a round neck and one bold horizontal vermilion stripe across the chest. Calm pose: body clearly turned three-quarters toward the left side of the image, head turned slightly toward the viewer, both hands loosely clasped in front at the waist. Behind: the shadow of an arched window on the wall.
Style: mid-century graphic noir illustration, 1950s-60s modernist poster design with film-noir chiaroscuro. Flat geometric color shapes, hard-edged light and shadow, form built by light and shadow rather than outlines. Silhouette-driven figure. The face is mostly a smooth flat ivory shape with only a hint of structure from light: a faint shadow under the brow, and the shadow side of the cheek and jaw falling into petrol teal shadow. Nothing else on the face. No drawn eyes, nose, lips or facial outlines. Calm, neutral, unreadable. Few anatomical details, few clothing folds. Palette of only six colors: ink black #121212 and ivory #F2EBDC as bases, vermilion #BF3026 as the single accent, petrol teal #285E60 for shadows, a tiny touch of burgundy #65282D in the deepest shadows, a tiny touch of amber #B99053 where the light meets the edge of the silhouette. Mostly flat color with a little grainy gradient for light falloff, subtle screen-print grain, outer edges fading to #0B0B0B. Mysterious, classic, tense.
Frame: vertical 2:3, waist-up, one person only, gender left ambiguous. The figure is centered; the head sits about one third from the top, and the head and shoulders stay within the middle half of the frame height. One hard light from the upper left: the lit side is ivory, the shadow side is petrol teal. Ink black wall; any pattern on the wall is drawn as flat petrol teal and ivory shapes only, never warm and never glowing. Vermilion appears only in one small clothing detail and covers less than 5% of the image.
Avoid: text, letters, numbers, captions, logos, watermark, signature, real brands, photorealism, 3D render, glossy CGI, anime, cartoon outlines, eyes, pupils, eyelashes, eyebrows drawn as lines, nose shape, nostrils, lips, mouth, makeup, smiling, frowning, any expression, detailed face, gore, blood, weapons, extra colors outside the palette, busy background, hat, cap, headset, radio, earpiece, lanyard, badge, bag, towel, bandage, knee brace, phone, bottle, perfume, objects held in hands, crossed arms, clenched fists, hunched shoulders, limping, weight on one leg, back turned to the viewer, head bowed, looking down, looking back over the shoulder, multiple people.
```

### 악역 담당 (`villain`)

```text
A tall, thin person with an angular build. Sleek slicked-back hair. A long tailored coat with strong squared shoulders and wide pointed lapels, vermilion only on the inner lining of the lapel. Calm pose: body and head clearly turned three-quarters toward the right side of the image, head level, one hand lightly straightening the lapel. Behind: a single diagonal beam of light across the wall.
Style: mid-century graphic noir illustration, 1950s-60s modernist poster design with film-noir chiaroscuro. Flat geometric color shapes, hard-edged light and shadow, form built by light and shadow rather than outlines. Silhouette-driven figure. The face is mostly a smooth flat ivory shape with only a hint of structure from light: a faint shadow under the brow, and the shadow side of the cheek and jaw falling into petrol teal shadow. Nothing else on the face. No drawn eyes, nose, lips or facial outlines. Calm, neutral, unreadable. Few anatomical details, few clothing folds. Palette of only six colors: ink black #121212 and ivory #F2EBDC as bases, vermilion #BF3026 as the single accent, petrol teal #285E60 for shadows, a tiny touch of burgundy #65282D in the deepest shadows, a tiny touch of amber #B99053 where the light meets the edge of the silhouette. Mostly flat color with a little grainy gradient for light falloff, subtle screen-print grain, outer edges fading to #0B0B0B. Mysterious, classic, tense.
Frame: vertical 2:3, waist-up, one person only, gender left ambiguous. The figure is centered; the head sits about one third from the top, and the head and shoulders stay within the middle half of the frame height. One hard light from the upper left: the lit side is ivory, the shadow side is petrol teal. Ink black wall; any pattern on the wall is drawn as flat petrol teal and ivory shapes only, never warm and never glowing. Vermilion appears only in one small clothing detail and covers less than 5% of the image.
Avoid: text, letters, numbers, captions, logos, watermark, signature, real brands, photorealism, 3D render, glossy CGI, anime, cartoon outlines, eyes, pupils, eyelashes, eyebrows drawn as lines, nose shape, nostrils, lips, mouth, makeup, smiling, frowning, any expression, detailed face, gore, blood, weapons, extra colors outside the palette, busy background, hat, cap, headset, radio, earpiece, lanyard, badge, bag, towel, bandage, knee brace, phone, bottle, perfume, objects held in hands, crossed arms, clenched fists, hunched shoulders, limping, weight on one leg, back turned to the viewer, head bowed, looking down, looking back over the shoulder, multiple people.
```

### 전직 운동선수 (`athlete`)

```text
A sturdy person with a broad-shouldered, solid build. Buzz-cut hair. A boxy zip-up track jacket with a high stand collar and one vermilion stripe running down along the shoulder line. Calm pose: facing straight toward the viewer, shoulders square, head level, arms relaxed at the sides. Behind: horizontal slat shadows on the wall.
Style: mid-century graphic noir illustration, 1950s-60s modernist poster design with film-noir chiaroscuro. Flat geometric color shapes, hard-edged light and shadow, form built by light and shadow rather than outlines. Silhouette-driven figure. The face is mostly a smooth flat ivory shape with only a hint of structure from light: a faint shadow under the brow, and the shadow side of the cheek and jaw falling into petrol teal shadow. Nothing else on the face. No drawn eyes, nose, lips or facial outlines. Calm, neutral, unreadable. Few anatomical details, few clothing folds. Palette of only six colors: ink black #121212 and ivory #F2EBDC as bases, vermilion #BF3026 as the single accent, petrol teal #285E60 for shadows, a tiny touch of burgundy #65282D in the deepest shadows, a tiny touch of amber #B99053 where the light meets the edge of the silhouette. Mostly flat color with a little grainy gradient for light falloff, subtle screen-print grain, outer edges fading to #0B0B0B. Mysterious, classic, tense.
Frame: vertical 2:3, waist-up, one person only, gender left ambiguous. The figure is centered; the head sits about one third from the top, and the head and shoulders stay within the middle half of the frame height. One hard light from the upper left: the lit side is ivory, the shadow side is petrol teal. Ink black wall; any pattern on the wall is drawn as flat petrol teal and ivory shapes only, never warm and never glowing. Vermilion appears only in one small clothing detail and covers less than 5% of the image.
Avoid: text, letters, numbers, captions, logos, watermark, signature, real brands, photorealism, 3D render, glossy CGI, anime, cartoon outlines, eyes, pupils, eyelashes, eyebrows drawn as lines, nose shape, nostrils, lips, mouth, makeup, smiling, frowning, any expression, detailed face, gore, blood, weapons, extra colors outside the palette, busy background, hat, cap, headset, radio, earpiece, lanyard, badge, bag, towel, bandage, knee brace, phone, bottle, perfume, objects held in hands, crossed arms, clenched fists, hunched shoulders, limping, weight on one leg, back turned to the viewer, head bowed, looking down, looking back over the shoulder, multiple people.
```

### 막내 작가 (`writer`)

```text
A small, slight person with a narrow build. Hair loosely tied in a messy bun on top of the head. An oversized slouchy hoodie with the hood down, layered over a collared shirt, vermilion only on the inside of the hood. Calm pose: body and head clearly turned three-quarters toward the left side of the image, head level, both hands resting in the hoodie's front pocket. Behind: vertical venetian-blind shadows on the wall.
Style: mid-century graphic noir illustration, 1950s-60s modernist poster design with film-noir chiaroscuro. Flat geometric color shapes, hard-edged light and shadow, form built by light and shadow rather than outlines. Silhouette-driven figure. The face is mostly a smooth flat ivory shape with only a hint of structure from light: a faint shadow under the brow, and the shadow side of the cheek and jaw falling into petrol teal shadow. Nothing else on the face. No drawn eyes, nose, lips or facial outlines. Calm, neutral, unreadable. Few anatomical details, few clothing folds. Palette of only six colors: ink black #121212 and ivory #F2EBDC as bases, vermilion #BF3026 as the single accent, petrol teal #285E60 for shadows, a tiny touch of burgundy #65282D in the deepest shadows, a tiny touch of amber #B99053 where the light meets the edge of the silhouette. Mostly flat color with a little grainy gradient for light falloff, subtle screen-print grain, outer edges fading to #0B0B0B. Mysterious, classic, tense.
Frame: vertical 2:3, waist-up, one person only, gender left ambiguous. The figure is centered; the head sits about one third from the top, and the head and shoulders stay within the middle half of the frame height. One hard light from the upper left: the lit side is ivory, the shadow side is petrol teal. Ink black wall; any pattern on the wall is drawn as flat petrol teal and ivory shapes only, never warm and never glowing. Vermilion appears only in one small clothing detail and covers less than 5% of the image.
Avoid: text, letters, numbers, captions, logos, watermark, signature, real brands, photorealism, 3D render, glossy CGI, anime, cartoon outlines, eyes, pupils, eyelashes, eyebrows drawn as lines, nose shape, nostrils, lips, mouth, makeup, smiling, frowning, any expression, detailed face, gore, blood, weapons, extra colors outside the palette, busy background, hat, cap, headset, radio, earpiece, lanyard, badge, bag, towel, bandage, knee brace, phone, bottle, perfume, objects held in hands, crossed arms, clenched fists, hunched shoulders, limping, weight on one leg, back turned to the viewer, head bowed, looking down, looking back over the shoulder, multiple people.
```

### 인플루언서 (`influencer`)

```text
A tall, slender person with a long neck. Long straight hair falling past the shoulders. An oversized trench coat with a large collar, a thin vermilion trim along the collar edge. Calm pose: full side profile facing the left side of the image, chin slightly raised, one hand brushing the hair back from the shoulder. Behind: the shadows of palm leaves cast across a patch of light on the wall, as if from a window outside.
Style: mid-century graphic noir illustration, 1950s-60s modernist poster design with film-noir chiaroscuro. Flat geometric color shapes, hard-edged light and shadow, form built by light and shadow rather than outlines. Silhouette-driven figure. The face is mostly a smooth flat ivory shape with only a hint of structure from light: a faint shadow under the brow, and the shadow side of the cheek and jaw falling into petrol teal shadow. Nothing else on the face. No drawn eyes, nose, lips or facial outlines. Calm, neutral, unreadable. Few anatomical details, few clothing folds. Palette of only six colors: ink black #121212 and ivory #F2EBDC as bases, vermilion #BF3026 as the single accent, petrol teal #285E60 for shadows, a tiny touch of burgundy #65282D in the deepest shadows, a tiny touch of amber #B99053 where the light meets the edge of the silhouette. Mostly flat color with a little grainy gradient for light falloff, subtle screen-print grain, outer edges fading to #0B0B0B. Mysterious, classic, tense.
Frame: vertical 2:3, waist-up, one person only, gender left ambiguous. The figure is centered; the head sits about one third from the top, and the head and shoulders stay within the middle half of the frame height. One hard light from the upper left: the lit side is ivory, the shadow side is petrol teal. Ink black wall; any pattern on the wall is drawn as flat petrol teal and ivory shapes only, never warm and never glowing. Vermilion appears only in one small clothing detail and covers less than 5% of the image.
Avoid: text, letters, numbers, captions, logos, watermark, signature, real brands, photorealism, 3D render, glossy CGI, anime, cartoon outlines, eyes, pupils, eyelashes, eyebrows drawn as lines, nose shape, nostrils, lips, mouth, makeup, smiling, frowning, any expression, detailed face, gore, blood, weapons, extra colors outside the palette, busy background, hat, cap, headset, radio, earpiece, lanyard, badge, bag, towel, bandage, knee brace, phone, bottle, perfume, objects held in hands, crossed arms, clenched fists, hunched shoulders, limping, weight on one leg, back turned to the viewer, head bowed, looking down, looking back over the shoulder, multiple people.
```

### 의료 담당 (`medic`)

```text
A person of medium height with an upright, neat build. Short hair neatly tucked behind the ears. A short-sleeved V-neck medical scrub top layered over a fitted long-sleeved undershirt, a thin vermilion trim along the V-neckline. A stethoscope hangs loosely around the neck, resting on the chest, not held. Calm pose: body clearly turned three-quarters toward the right side of the image, back straight, head level, arms relaxed at the sides. Behind: grid-shaped window-bar shadows on the wall.
Style: mid-century graphic noir illustration, 1950s-60s modernist poster design with film-noir chiaroscuro. Flat geometric color shapes, hard-edged light and shadow, form built by light and shadow rather than outlines. Silhouette-driven figure. The face is mostly a smooth flat ivory shape with only a hint of structure from light: a faint shadow under the brow, and the shadow side of the cheek and jaw falling into petrol teal shadow. Nothing else on the face. No drawn eyes, nose, lips or facial outlines. Calm, neutral, unreadable. Few anatomical details, few clothing folds. Palette of only six colors: ink black #121212 and ivory #F2EBDC as bases, vermilion #BF3026 as the single accent, petrol teal #285E60 for shadows, a tiny touch of burgundy #65282D in the deepest shadows, a tiny touch of amber #B99053 where the light meets the edge of the silhouette. Mostly flat color with a little grainy gradient for light falloff, subtle screen-print grain, outer edges fading to #0B0B0B. Mysterious, classic, tense.
Frame: vertical 2:3, waist-up, one person only, gender left ambiguous. The figure is centered; the head sits about one third from the top, and the head and shoulders stay within the middle half of the frame height. One hard light from the upper left: the lit side is ivory, the shadow side is petrol teal. Ink black wall; any pattern on the wall is drawn as flat petrol teal and ivory shapes only, never warm and never glowing. Vermilion appears only in one small clothing detail and covers less than 5% of the image.
Avoid: text, letters, numbers, captions, logos, watermark, signature, real brands, photorealism, 3D render, glossy CGI, anime, cartoon outlines, eyes, pupils, eyelashes, eyebrows drawn as lines, nose shape, nostrils, lips, mouth, makeup, smiling, frowning, any expression, detailed face, gore, blood, weapons, extra colors outside the palette, busy background, hat, cap, headset, radio, earpiece, lanyard, badge, bag, towel, bandage, knee brace, phone, bottle, perfume, objects held in hands, crossed arms, clenched fists, hunched shoulders, limping, weight on one leg, back turned to the viewer, head bowed, looking down, looking back over the shoulder, multiple people.
```
