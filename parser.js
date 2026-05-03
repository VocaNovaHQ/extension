(() => {
  function stripHtml(input) {
    if (input == null) return "";
    const tpl = document.createElement("template");
    tpl.innerHTML = String(input);
    return tpl.content.textContent || "";
  }

  function sanitizeExample(input) {
    if (input == null) return "";
    const tpl = document.createElement("template");
    tpl.innerHTML = String(input);
    const walk = (node) => {
      const out = [];
      node.childNodes.forEach((child) => {
        if (child.nodeType === Node.TEXT_NODE) {
          out.push(child.textContent);
        } else if (child.nodeType === Node.ELEMENT_NODE) {
          if (child.tagName === "STRONG") {
            out.push(`<strong>${escapeHtml(child.textContent || "")}</strong>`);
          } else {
            out.push(escapeHtml(child.textContent || ""));
          }
        }
      });
      return out.join("");
    };
    return walk(tpl.content);
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function parsePipeList(raw) {
    if (!raw || typeof raw !== "string") return [];
    return raw
      .split("|")
      .map((chunk) => {
        const [word, url] = chunk.split("^");
        return word ? { word: word.trim(), url: (url || "").trim() } : null;
      })
      .filter(Boolean);
  }

  /**
   * 네이버 IPA의 강세 기호 정규화.
   * <sup>│</sup> → ˈ (primary), <sub>│</sub> → ˌ (secondary).
   * 잔존 │ 도 ˈ 로, 그 외 HTML 태그는 모두 제거.
   */
  function normalizeIpa(input) {
    if (!input) return "";
    return String(input)
      .replace(/<sup>│<\/sup>/g, "ˈ")
      .replace(/<sub>│<\/sub>/g, "ˌ")
      .replace(/<\/?[^>]+>/g, "")
      .replace(/│/g, "ˈ")
      .trim();
  }

  function parsePronunciations(list) {
    if (!Array.isArray(list)) return [];
    return list
      .map((p) => ({
        label: stripHtml(p.symbolType) || "",
        ipa: normalizeIpa(p.symbolValue),
        audioUrl: p.symbolFile || "",
      }))
      .filter((p) => p.ipa || p.audioUrl);
  }

  function parsePartsOfSpeech(collectors) {
    if (!Array.isArray(collectors)) return [];
    return collectors
      .map((c) => {
        const meanings = (c.means || [])
          .map((m) => ({
            order: stripHtml(m.order) || "",
            definition: stripHtml(m.value),
            exampleEn: sanitizeExample(m.exampleOri),
            exampleKo: stripHtml(m.exampleTrans),
          }))
          .filter((m) => m.definition);
        return {
          pos: stripHtml(c.partOfSpeech) || "",
          meanings,
        };
      })
      .filter((p) => p.meanings.length > 0);
  }

  function parseEntry(json) {
    const item = json?.searchResultMap?.searchResultListMap?.WORD?.items?.[0];
    if (!item) return null;

    const word = stripHtml(item.handleEntry);
    if (!word) return null;

    const partsOfSpeech = parsePartsOfSpeech(item.meansCollector);
    if (partsOfSpeech.length === 0) return null;

    const images =
      item.hasImage && Array.isArray(item.entryImageURL)
        ? item.entryImageURL.filter(Boolean).slice(0, 1)
        : [];

    return {
      word,
      externalUrl: `https://en.dict.naver.com/#/search?query=${encodeURIComponent(word)}`,
      source: stripHtml(item.sourceDictnameKO) || "",
      level: stripHtml(item.frequencyAdd) || "",
      hasIdiom: !!item.hasIdiom,
      pronunciations: parsePronunciations(item.searchPhoneticSymbolList),
      partsOfSpeech,
      synonyms: parsePipeList(item.expSynonym),
      antonyms: parsePipeList(item.expAntonym),
      images,
    };
  }

  window.VocaParser = { parseEntry, sanitizeExample, escapeHtml };
})();
