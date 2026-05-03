(() => {
  const { escapeHtml } = window.VocaParser;

  const SPEAKER_ICON = `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3 9v6h4l5 4V5L7 9H3zm13.5 3a4.5 4.5 0 0 0-2.5-4.03v8.05A4.5 4.5 0 0 0 16.5 12zM14 3.23v2.06a7 7 0 0 1 0 13.42v2.06a9 9 0 0 0 0-17.54z"/></svg>`;

  const PERSON_ICON = `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4zm0 2c-3 0-7 1.5-7 4.5V20h14v-1.5C19 15.5 15 14 12 14z"/></svg>`;

  function createCardHtml(model, options = {}) {
    const isSignedIn = !!options.isSignedIn;
    const user = options.user || null;
    return `
      <div class="voca-popup" role="dialog" aria-label="${escapeHtml(model.word)} 사전">
        <div class="voca-card-actions">
          ${user ? renderUserBadge(user) : ""}
          ${renderSaveButton(isSignedIn ? "ready" : "anon")}
        </div>

        <div class="voca-header">
          <a class="voca-title" href="${escapeHtml(model.externalUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(model.word)}</a>
          ${model.level ? `<span class="voca-level">${escapeHtml(model.level)}</span>` : ""}
        </div>

        ${renderPronunciations(model.pronunciations)}
        ${renderImage(model.images)}

        ${model.partsOfSpeech.map(renderPos).join("")}

        ${renderRelated("유의어", model.synonyms)}
        ${renderRelated("반의어", model.antonyms)}

        <div class="voca-footer">
          ${model.source ? `<span class="voca-source">${escapeHtml(model.source)}</span>` : "<span></span>"}
          <a class="voca-more" href="${escapeHtml(model.externalUrl)}" target="_blank" rel="noopener noreferrer">자세히 보기 →</a>
        </div>
      </div>
    `;
  }

  function renderUserBadge(user) {
    const tooltip = user.email || "로그인됨";
    const inner = user.avatarUrl
      ? `<img class="voca-avatar" src="${escapeHtml(user.avatarUrl)}" alt="" referrerpolicy="no-referrer" />`
      : `<div class="voca-avatar voca-avatar-fallback">${PERSON_ICON}</div>`;
    return `<div class="voca-user" data-tooltip="${escapeHtml(tooltip)}" aria-label="${escapeHtml(tooltip)}">${inner}</div>`;
  }

  const SAVE_LABELS = {
    anon: "+ 단어장에 저장",
    ready: "+ 단어장에 저장",
    saving: "저장 중…",
    saved: "✓ 저장됨",
    alreadySaved: "✓ 이미 저장됨",
    error: "다시 시도",
  };

  function renderSaveButton(state) {
    const label = SAVE_LABELS[state] || SAVE_LABELS.ready;
    const tooltip =
      state === "anon" ? "로그인해서 무료로 앱으로 공부하세요" : "";
    return `<button type="button" class="voca-save-btn" data-state="${state}"${
      tooltip ? ` data-tooltip="${escapeHtml(tooltip)}"` : ""
    }>${escapeHtml(label)}</button>`;
  }

  function setSaveButtonState(root, state, errorMessage) {
    const btn = root.querySelector(".voca-save-btn");
    if (!btn) return;
    btn.setAttribute("data-state", state);
    btn.textContent = SAVE_LABELS[state] || SAVE_LABELS.ready;
    if (state === "anon") {
      btn.setAttribute("data-tooltip", "로그인해서 무료로 앱으로 공부하세요");
    } else if (state === "error" && errorMessage) {
      btn.setAttribute("data-tooltip", errorMessage);
    } else {
      btn.removeAttribute("data-tooltip");
    }
    const isDone = state === "saved" || state === "alreadySaved" || state === "saving";
    btn.disabled = isDone;
  }

  function renderPronunciations(prons) {
    if (!prons || prons.length === 0) return "";
    const items = prons
      .map((p) => {
        const ipa = p.ipa ? `<span class="voca-pron-ipa">[${escapeHtml(p.ipa)}]</span>` : "";
        const audio = p.audioUrl
          ? `<button class="voca-audio-btn" data-audio-url="${escapeHtml(p.audioUrl)}" aria-label="${escapeHtml(p.label)} 발음 듣기" type="button">${SPEAKER_ICON}</button>`
          : "";
        const label = p.label ? `<span class="voca-pron-label">${escapeHtml(p.label)}</span>` : "";
        return `<span class="voca-pron">${label}${ipa}${audio}</span>`;
      })
      .join("");
    return `<div class="voca-pronunciations">${items}</div>`;
  }

  function renderImage(images) {
    if (!images || images.length === 0) return "";
    return `<img class="voca-image" src="${escapeHtml(images[0])}" alt="" loading="lazy" />`;
  }

  function renderPos(part) {
    return `
      <div class="voca-pos-block">
        ${part.pos ? `<div class="voca-pos-badge">${escapeHtml(part.pos)}</div>` : ""}
        ${part.meanings.map(renderMeaning).join("")}
      </div>
    `;
  }

  function renderMeaning(m) {
    const example =
      m.exampleEn || m.exampleKo
        ? `<div class="voca-example">
            ${m.exampleEn ? `<div class="voca-example-en">${m.exampleEn}</div>` : ""}
            ${m.exampleKo ? `<div class="voca-example-ko">${escapeHtml(m.exampleKo)}</div>` : ""}
          </div>`
        : "";
    return `
      <div class="voca-meaning">
        <div class="voca-order">${escapeHtml(m.order)}.</div>
        <div class="voca-meaning-body">
          <div class="voca-definition">${escapeHtml(m.definition)}</div>
          ${example}
        </div>
      </div>
    `;
  }

  function renderRelated(label, items) {
    if (!items || items.length === 0) return "";
    const chips = items
      .slice(0, 8)
      .map(
        (it) =>
          `<a class="voca-chip" href="${escapeHtml(it.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(it.word)}</a>`
      )
      .join("");
    return `
      <div class="voca-related">
        <div class="voca-related-label">${escapeHtml(label)}</div>
        <div class="voca-chips">${chips}</div>
      </div>
    `;
  }

  function renderLoading() {
    return `<div class="voca-popup"><div class="voca-loading"><div class="voca-spinner"></div>찾는 중…</div></div>`;
  }

  function renderError(word, message) {
    return `
      <div class="voca-popup">
        <div class="voca-error">
          <strong>${escapeHtml(word)}</strong>
          ${escapeHtml(message || "결과를 찾지 못했습니다.")}
        </div>
      </div>
    `;
  }

  function bindAudioButtons(root) {
    root.querySelectorAll(".voca-audio-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const url = btn.getAttribute("data-audio-url");
        if (!url) return;
        try {
          const audio = new Audio(url);
          audio.play().catch(() => {});
        } catch (_) {}
      });
    });
  }

  function bindSaveButton(root, onClick) {
    const btn = root.querySelector(".voca-save-btn");
    if (!btn) return;
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (btn.disabled) return;
      onClick(btn);
    });
  }

  window.VocaPopup = {
    createCardHtml,
    renderLoading,
    renderError,
    bindAudioButtons,
    bindSaveButton,
    setSaveButtonState,
  };
})();
