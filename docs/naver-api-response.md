# 네이버 영어사전 응답 JSON 가이드

> voca-extension에서 사용하는 비공식 API의 응답 구조 요약. 사용자가 응답 전문(80~120 KB)을 직접 읽지 않아도 어떤 데이터가 있고 우리가 무엇을 뽑아 쓰는지 한눈에 파악하도록.

## 1. 엔드포인트 & 요청 규칙

| 항목 | 값 |
|---|---|
| URL | `https://en.dict.naver.com/api3/enko/search?m=mobile&lang=ko&query={단어}` |
| 메서드 | `GET` |
| 필수 헤더 | `Referer: https://en.dict.naver.com` |

`Referer`가 없으면 네이버 서버가 응답을 거부한다. 익스텐션에서는 `rules.json`(declarativeNetRequest)이 모든 요청에 자동으로 이 헤더를 박아준다.

## 2. 응답 구조 (도달 경로)

```
{
  searchResultMap: {
    searchResultListMap: {
      WORD: {
        items: [
          ✦ 우리가 사용하는 단어 정보는 여기 ✦
          {
            handleEntry, frequencyAdd, sourceDictnameKO,
            searchPhoneticSymbolList[], meansCollector[],
            expSynonym, expAntonym, entryImageURL[],
            hasImage, hasIdiom, ...
          }
        ]
      }
    }
  }
}
```

응답 최상위에는 `LAIMLog`, `collectionRanking`, `searchMaybek`(혹시 이거 찾으셨나요 제안) 같은 필드도 있지만 사전 표시에는 불필요해서 무시한다. 검색 결과가 없는 단어(예: 오타)에서는 `items` 배열이 비어있다.

## 3. 우리가 사용하는 핵심 필드

`searchResultMap.searchResultListMap.WORD.items[0]` 안에서 추출하는 필드:

| 필드 | 의미 | 예시 | 비고 |
|---|---|---|---|
| `handleEntry` | 표제어(검색된 영단어) | `"apple"` | 항상 존재 |
| `frequencyAdd` | 사전/난이도 표시 | `"Oxford"` | 헤더 배지로 |
| `sourceDictnameKO` | 출처 사전명 | `"옥스퍼드 영한사전"` | 푸터에 |
| `searchPhoneticSymbolList[]` | 발음 정보 배열 | 아래 ① | 미국식/영국식/통합 |
| `meansCollector[]` | 품사별 의미 묶음 | 아래 ② | 품사 수만큼 |
| `expSynonym` | 유의어 (파이프 구분 문자열) | `"race^URL\|jog^URL"` | 빈 문자열 가능 |
| `expAntonym` | 반의어 (동일 형식) | `"stop^URL\|stay^URL"` | 빈 문자열 가능 |
| `entryImageURL` | 단어 이미지 URL 배열 | `["https://..."]` | `null` 또는 빈 배열 가능 |
| `hasImage` | 이미지 표시 가능 플래그 | `0` 또는 `1` | 1일 때만 이미지 노출 |
| `hasIdiom` | 숙어 존재 플래그 | `0` 또는 `1` | 현재는 미사용 |

### ① `searchPhoneticSymbolList[]` 항목 구조

```js
{
  symbolType: "미국식" | "영국식" | "미국∙영국",
  symbolTypeCode: "US" | "GB" | "US∙GB",
  symbolValue: "ˈæpl",          // IPA 발음기호 (없을 수도 있음)
  symbolFile: "https://...mp3"  // 발음 mp3 (없을 수도 있음)
}
```

**관찰**: 
- 대부분의 단어(`run`, `take`, `abandon`, `beautiful`)는 `[미국∙영국 통합, 영국식]` 두 항목.
- 일부 단어(`apple`)는 `[미국식 IPA만, 영국식 mp3만]` 형태로 IPA·mp3가 다른 항목에 분산.
- 그래서 우리는 `symbolValue` 또는 `symbolFile` **둘 중 하나라도 있으면 표시**하고, 둘 다 비어 있으면 항목을 버린다.

### ② `meansCollector[]` 항목 구조

```js
{
  partOfSpeech: "동사",
  means: [
    {
      order: "1",
      value: "(사람·동물이) 달리다[뛰다]",
      exampleOri: "Can you <strong>run</strong> as fast as Mike?",  // 영문 예문
      exampleTrans: "너 마이크만큼 빨리 달릴 수 있니?",              // 한글 번역
      example: null,        // 사용 안 함 (별도 예문 컬렉션이지만 항상 null)
      ...
    },
    ...
  ]
}
```

**관찰**:
- 다의어는 `meansCollector` 배열 길이가 2 이상. 예: `run`/`take` → `["동사", "명사"]`.
- 단순한 단어는 1개. 예: `apple` → `["명사"]`, `beautiful` → `["형용사"]`.
- `value`에 `<span class="related_word">...</span>` 같은 부가 태그가 박혀 있을 수 있음 → 파서에서 텍스트만 추출.
- `exampleOri`에 검색어를 강조하는 `<strong>` 태그가 있음 → UI에서 그대로 살려서 시각적 강조 효과.

## 4. 부가 필드 (지금은 안 쓰지만 흥미로운 것들)

응답에는 이 외에도 80개 이상의 필드가 있다. 차후 확장 시 후보:

| 필드 | 가능한 활용 |
|---|---|
| `entryCommentNumber`, `entryLikeNumber` | 사용자 참여 지표 (숫자 표시) |
| `audioFileCount`, `videoFileCount` | "이 단어 영상 N개 있음" 알림 |
| `pageView` | 인기 단어 표시 |
| `idiomOri`, `idiomOriUrl` | 이 단어로 만들어지는 숙어 표시 |
| `expEntrySuperscript` | `apple¹`, `apple²` 같은 동음이의 첨자 |
| `dictTypeForm` | "n.[가산명사]" 같은 추가 문법 정보 |
| `meansCollector[].means[].subjectGroup` | "의학", "법률" 같은 분야 태그 |
| `searchMaybek` (응답 최상위) | 검색어 오타 시 추천 단어 |
| `meaningCount` | 다의어임을 표시 (현재는 항상 0이라 의미 약함) |

> 단어장 서버 연동 단계에서 `entryId`, `vcode`, `gdid` 같은 식별자가 동기화 키로 유용할 수 있다.

## 5. 단어 유형별 응답 차이

| 단어 | meansCollector 길이 | hasImage | expSynonym | 발음 |
|---|---|---|---|---|
| apple | 1 (명사) | ✓ | ✗ | 미/영 분리, 미국식 mp3 없음 |
| beautiful | 1 (형용사) | ✓ | ✓ (3개) | 통합형 |
| abandon | 1 (동사) | ✗ | ✗ | 통합형 |
| run | 2 (동사+명사) | ✓ | ✓ (3개) | 통합형 |
| take | 2 (동사+명사) | ✗ | ✓ (3개) | 통합형 |

→ 파서가 각 필드의 **빈 값/null/빈 배열**을 모두 안전하게 처리해야 한다.

## 6. 샘플 응답 발췌 (apple, 우리가 쓰는 부분만)

```jsonc
{
  "handleEntry": "apple",
  "frequencyAdd": "Oxford",
  "sourceDictnameKO": "옥스퍼드 영한사전",
  "hasImage": 1,
  "hasIdiom": 0,
  "expSynonym": "",
  "expAntonym": "",
  "searchPhoneticSymbolList": [
    { "symbolType": "미국식", "symbolValue": "ˈæpl", "symbolFile": "" },
    { "symbolType": "영국식", "symbolValue": "",     "symbolFile": "https://dict-dn.pstatic.net/.../C01827.mp3" }
  ],
  "meansCollector": [
    {
      "partOfSpeech": "명사",
      "means": [
        {
          "order": "",
          "value": "사과 (→<span class=\"related_word\">Adam's apple, Big Apple, ...</span>)",
          "exampleOri": "an <strong>apple</strong> pie",
          "exampleTrans": "사과[애플]파이"
        }
      ]
    }
  ],
  "entryImageURL": [
    "https://dic-phinf.pstatic.net/.../5648_getty_20070828132032.jpg"
  ]
}
```

## 7. 파싱 시 주의점

| 함정 | 대응 (parser.js에 반영됨) |
|---|---|
| `value`에 HTML 태그 박혀 있음 | `<template>` 파싱 후 `textContent`만 추출 |
| `exampleOri`의 `<strong>`은 살리고 다른 태그는 위험 | `<strong>`만 화이트리스트, 나머지는 텍스트로 |
| `expSynonym = ""`(빈 문자열) | `split` 결과를 `filter(Boolean)`로 제거 |
| `entryImageURL = null` 또는 `hasImage = 0` | 두 조건 모두 체크 후 노출 |
| `symbolValue`/`symbolFile` 둘 다 빈 항목 | 발음 배열에서 필터로 제거 |
| `searchResultMap...items`가 빈 배열 | `parseEntry`가 `null` 반환 → UI에서 "결과 없음" 표시 |
| 사용자가 입력한 검색어가 한글/숫자 | content.js에서 `^[A-Za-z]` 정규식으로 사전 차단 |

---

이 문서는 응답 구조 변경 시 함께 업데이트해야 한다. `parser.js`의 필드 매핑이 이 문서의 표와 1:1 대응한다.
