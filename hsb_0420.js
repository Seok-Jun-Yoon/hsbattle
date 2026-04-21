const tierOrder = ["SSS", "SS", "S", "A", "B"];
const categoryMeta = {
  deck: {
    title: "deck tier list",
    note: "종족 버튼은 여러 개를 동시에 선택할 수 있습니다. 아무 것도 선택하지 않으면 전체 덱이 표시됩니다.",
  },
  trinket: {
    title: "장신구 tier list",
    note: "장신구는 상세에서 trinket, 핵심 카드, build, 공략, 최종덱 순서로 표시됩니다.",
  },
};

const tierListElement = document.querySelector("#tier-list");
const tribeFilterElement = document.querySelector("#tribe-filter");
const tierListTitleElement = document.querySelector("#tier-list-title");
const sectionNoteElement = document.querySelector("#section-note");
const categoryTabsElement = document.querySelector("#category-tabs");
const darkModeToggleElement = document.querySelector("#dark-mode-toggle");

const DARK_MODE_STORAGE_KEY = "hsb-dark-mode";

const allData = {
  deck: null,
  trinket: null,
};

const activeTribesByCategory = {
  deck: new Set(),
  trinket: new Set(),
};

const tribeOrderByCategory = {
  deck: [],
  trinket: [],
};

let activeCategory = "deck";

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderCardStrip(cards, heading) {
  const sectionClass = heading === "최종덱" ? "card-group is-final-deck" : "card-group";

  if (!cards.length) {
    return `
      <section class="${sectionClass}">
        <h4>${escapeHtml(heading)}</h4>
        <p class="card-strip-empty">표시할 카드가 없습니다.</p>
      </section>
    `;
  }

  return `
    <section class="${sectionClass}">
      <h4>${escapeHtml(heading)}</h4>
      <div class="card-strip">
        ${cards
          .map(
            (card) => `
              <article class="card-item">
                <div class="card-thumb">
                  <img src="${escapeHtml(card.path)}" alt="${escapeHtml(card.name)}" loading="lazy">
                </div>
              </article>
            `
          )
          .join("")}
      </div>
    </section>
  `;
}

function renderDeckMeta(tribes) {
  if (!tribes.length) {
    return "";
  }

  return `
    <div class="deck-meta">
      ${tribes.map((tribe) => `<span class="deck-tribe-chip">${escapeHtml(tribe)}</span>`).join("")}
    </div>
  `;
}

function renderGuide(guide) {
  const normalizedGuide = typeof guide === "string" ? guide.trim() : "";

  return `
    <section class="card-group">
      <h4>공략</h4>
      <p class="guide-text">${normalizedGuide ? escapeHtml(normalizedGuide).replaceAll("\n", "<br>") : "-"}</p>
    </section>
  `;
}

function renderDeck(deck, tier, index, category) {
  const detailId = `deck-detail-${category}-${tier}-${index}`;
  const tribes = Array.isArray(deck.tribes) ? deck.tribes : [];
  const trinketSection =
    category === "trinket" && deck.trinketCard
      ? renderCardStrip([deck.trinketCard], "trinket")
      : "";
  const finalDeckSection = renderCardStrip(deck.finalDeckCard ? [deck.finalDeckCard] : [], "최종덱");

  return `
    <article class="deck-card">
      <button class="deck-toggle" type="button" aria-expanded="false" aria-controls="${detailId}">
        <div>
          <h3 class="deck-name">${escapeHtml(deck.name)}</h3>
          ${renderDeckMeta(tribes)}
        </div>
        <span class="deck-toggle-indicator" aria-hidden="true"></span>
      </button>
      <div class="deck-details" id="${detailId}" hidden>
        ${trinketSection}
        ${renderCardStrip(deck.coreCards ?? [], "핵심 카드")}
        ${renderCardStrip(deck.buildCards ?? [], "build")}
        ${renderGuide(deck.guide)}
        ${finalDeckSection}
      </div>
    </article>
  `;
}

function deckMatchesFilter(deck, selectedTribes) {
  const deckTribes = Array.isArray(deck.tribes) ? deck.tribes : [];

  if (!selectedTribes.size) {
    return true;
  }

  if (!deckTribes.length) {
    return true;
  }

  return deckTribes.some((tribe) => selectedTribes.has(tribe));
}

function getFilteredDecks(category, selectedTribes) {
  const categoryData = allData[category] || {};

  return tierOrder.reduce((accumulator, tier) => {
    const tierDecks = Array.isArray(categoryData[tier]) ? categoryData[tier] : [];
    accumulator[tier] = tierDecks.filter((deck) => deckMatchesFilter(deck, selectedTribes));
    return accumulator;
  }, {});
}

function renderTierRow(tier, decks, category) {
  if (!decks.length) {
    return `
      <section class="tier-row">
        <div class="tier-row__head">
          <span class="tier-label" data-tier="${escapeHtml(tier)}">${escapeHtml(tier)}</span>
          <p class="deck-count">0 decks</p>
        </div>
        <p class="empty-copy">표시되는 덱이 없습니다.</p>
      </section>
    `;
  }

  return `
    <section class="tier-row">
      <div class="tier-row__head">
        <div>
          <span class="tier-label" data-tier="${escapeHtml(tier)}">${escapeHtml(tier)}</span>
        </div>
        <p class="deck-count">${decks.length} decks</p>
      </div>
      <div class="deck-list">
        ${decks.map((deck, index) => renderDeck(deck, tier, index, category)).join("")}
      </div>
    </section>
  `;
}

function renderTierList(category) {
  const filteredDecks = getFilteredDecks(category, activeTribesByCategory[category]);
  const rows = tierOrder.map((tier) => renderTierRow(tier, filteredDecks[tier], category));
  tierListElement.innerHTML = rows.join("");
}

function renderTribeButtons(category) {
  const tribeOrder = tribeOrderByCategory[category] || [];
  const selected = activeTribesByCategory[category];

  tribeFilterElement.innerHTML = tribeOrder
    .map(
      (tribe) => `
        <button
          class="tribe-filter__button${selected.has(tribe) ? " is-active" : ""}"
          type="button"
          data-tribe="${escapeHtml(tribe)}"
          aria-pressed="${selected.has(tribe) ? "true" : "false"}"
        >
          ${escapeHtml(tribe)}
        </button>
      `
    )
    .join("");
}

function renderCategoryTabs() {
  if (!categoryTabsElement) {
    return;
  }

  const buttons = categoryTabsElement.querySelectorAll(".category-tab");
  for (const button of buttons) {
    const category = button.dataset.category;
    const isActive = category === activeCategory;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-selected", isActive ? "true" : "false");
  }
}

function rerenderActiveCategory() {
  if (!allData[activeCategory]) {
    return;
  }

  const meta = categoryMeta[activeCategory];
  if (tierListTitleElement && meta) {
    tierListTitleElement.textContent = meta.title;
  }
  if (sectionNoteElement && meta) {
    sectionNoteElement.textContent = meta.note;
  }

  renderCategoryTabs();
  renderTribeButtons(activeCategory);
  renderTierList(activeCategory);
}

function bindDeckToggles() {
  tierListElement.addEventListener("click", (event) => {
    const toggle = event.target.closest(".deck-toggle");

    if (!toggle) {
      return;
    }

    const deckCard = toggle.closest(".deck-card");
    const details = deckCard?.querySelector(".deck-details");

    if (!deckCard || !details) {
      return;
    }

    const isOpen = deckCard.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(isOpen));
    details.hidden = !isOpen;
  });
}

function bindTribeFilter() {
  tribeFilterElement.addEventListener("click", (event) => {
    const button = event.target.closest("[data-tribe]");

    if (!button) {
      return;
    }

    const selectedTribe = button.dataset.tribe;

    if (!selectedTribe) {
      return;
    }

    const selectedSet = activeTribesByCategory[activeCategory];

    if (selectedSet.has(selectedTribe)) {
      selectedSet.delete(selectedTribe);
    } else {
      selectedSet.add(selectedTribe);
    }

    rerenderActiveCategory();
  });
}

function bindCategoryTabs() {
  if (!categoryTabsElement) {
    return;
  }

  categoryTabsElement.addEventListener("click", (event) => {
    const button = event.target.closest("[data-category]");

    if (!button) {
      return;
    }

    const nextCategory = button.dataset.category;

    if (!nextCategory || !allData[nextCategory] || nextCategory === activeCategory) {
      return;
    }

    activeCategory = nextCategory;
    rerenderActiveCategory();
  });
}

function setupDarkMode() {
  const savedPreference = localStorage.getItem(DARK_MODE_STORAGE_KEY);
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const shouldUseDarkMode = savedPreference ? savedPreference === "dark" : prefersDark;

  document.body.classList.toggle("is-dark", shouldUseDarkMode);
}

function bindDarkModeToggle() {
  if (!darkModeToggleElement) {
    return;
  }

  darkModeToggleElement.addEventListener("click", () => {
    const useDarkMode = !document.body.classList.contains("is-dark");
    document.body.classList.toggle("is-dark", useDarkMode);
    localStorage.setItem(DARK_MODE_STORAGE_KEY, useDarkMode ? "dark" : "light");
  });
}

function getTribeOrder(categoryData) {
  const tribes = new Set();

  for (const tier of tierOrder) {
    const tierDecks = Array.isArray(categoryData[tier]) ? categoryData[tier] : [];
    for (const deck of tierDecks) {
      for (const tribe of Array.isArray(deck.tribes) ? deck.tribes : []) {
        if (tribe) {
          tribes.add(tribe);
        }
      }
    }
  }

  return [...tribes].sort((a, b) => a.localeCompare(b, "ko"));
}

function initializeData(payload) {
  const deckData = payload?.deck && typeof payload.deck === "object" ? payload.deck : payload;
  const trinketData = payload?.trinket && typeof payload.trinket === "object" ? payload.trinket : window.TRINKET_DATA;

  if (deckData && typeof deckData === "object") {
    allData.deck = deckData;
    tribeOrderByCategory.deck = getTribeOrder(deckData);
  }

  if (trinketData && typeof trinketData === "object") {
    allData.trinket = trinketData;
    tribeOrderByCategory.trinket = getTribeOrder(trinketData);
  }

  if (!allData[activeCategory]) {
    activeCategory = allData.deck ? "deck" : "trinket";
  }

  rerenderActiveCategory();
}

function renderLoadError(message) {
  tierListElement.innerHTML = `
    <article class="loading-card">
      ${escapeHtml(message)}
    </article>
  `;
}

async function loadData() {
  const inlineData = window.HSB_DATA || window.DECK_DATA;

  if (inlineData && typeof inlineData === "object") {
    initializeData(inlineData);
    return;
  }

  try {
    const response = await fetch("./deck-data.json");

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const payload = await response.json();
    initializeData(payload);
  } catch (error) {
    renderLoadError("데이터를 불러오지 못했습니다. deck-data.js 또는 deck-data.json 상태를 확인해 주세요.");
    console.error("data load failed:", error);
  }
}

bindDeckToggles();
bindTribeFilter();
bindCategoryTabs();
setupDarkMode();
bindDarkModeToggle();
loadData();
