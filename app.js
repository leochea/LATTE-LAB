const state = {
  data: null,
  category: "all",
  query: "",
  promotionIndex: 0,
  autoplayTimer: null,
  pointerStartX: null,
};

const elements = {
  brandLogo: document.querySelector("#brandLogo"),
  footerLogo: document.querySelector("#footerLogo"),
  promotionSection: document.querySelector("#promotionSection"),
  promotionCarousel: document.querySelector("#promotionCarousel"),
  promotionTrack: document.querySelector("#promotionTrack"),
  promotionDots: document.querySelector("#promotionDots"),
  promotionPrevious: document.querySelector("#promotionPrevious"),
  promotionNext: document.querySelector("#promotionNext"),
  tabs: document.querySelector("#categoryTabs"),
  grid: document.querySelector("#menuGrid"),
  count: document.querySelector("#menuCount"),
  empty: document.querySelector("#emptyState"),
  search: document.querySelector("#searchInput"),
  clearFilters: document.querySelector("#clearFilters"),
  qrOpen: document.querySelector("#qrOpen"),
  qrDialog: document.querySelector("#qrDialog"),
  qrClose: document.querySelector("#qrClose"),
  qrUrl: document.querySelector("#qrUrl"),
  qrImages: document.querySelectorAll(".qr-open img, .qr-dialog > img"),
  dialog: document.querySelector("#imageDialog"),
  dialogClose: document.querySelector("#dialogClose"),
  dialogImage: document.querySelector("#dialogImage"),
  dialogTitle: document.querySelector("#dialogTitle"),
  dialogKhmer: document.querySelector("#dialogKhmer"),
  dialogPrice: document.querySelector("#dialogPrice"),
};

const usdFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});
const khrFormatter = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

function formatUsd(value) {
  return `$${usdFormatter.format(value)}`;
}

function formatKhr(value) {
  return `${khrFormatter.format(value)}៛`;
}

function priceMarkup(item, className = "price") {
  const usd = item.usd == null ? "" : `<span>${formatUsd(item.usd)}</span>`;
  const khr = item.khr == null ? "" : `<small>${formatKhr(item.khr)}</small>`;
  return usd || khr ? `<strong class="${className}">${usd}${khr}</strong>` : "";
}

function normalize(value) {
  return String(value ?? "").trim().toLocaleLowerCase();
}

function currentItems() {
  if (!state.data) return [];
  return state.data.items.filter((item) => {
    const matchesCategory = state.category === "all" || item.category === state.category;
    const text = normalize(`${item.en} ${item.km} ${item.category}`);
    return matchesCategory && text.includes(normalize(state.query));
  });
}

function imageButton(item, className, eager = false) {
  if (!item.image) {
    return `<div class="${className} image-missing"><span>LATTE LAB</span></div>`;
  }

  return `
    <button
      class="${className} image-button"
      type="button"
      data-image-id="${item.id}"
      aria-label="Open ${item.en} image"
    >
      <img src="${item.image}" alt="${item.en}" ${eager ? 'loading="eager"' : 'loading="lazy"'} />
    </button>
  `;
}

function renderPromotions() {
  const promotions = state.data.promotions;
  elements.promotionSection.hidden = promotions.length === 0;
  stopAutoplay();

  if (promotions.length === 0) return;

  state.promotionIndex = Math.min(state.promotionIndex, promotions.length - 1);
  elements.promotionTrack.innerHTML = promotions
    .map(
      (item, index) => `
        <article
          class="promotion-slide"
          aria-label="${index + 1} of ${promotions.length}"
          aria-hidden="${index === state.promotionIndex ? "false" : "true"}"
        >
          ${imageButton(item, "promotion-image", index === state.promotionIndex)}
          <div class="promotion-copy">
            <p class="promotion-label">Recommended · ណែនាំ</p>
            <h2>${item.en}</h2>
            <p lang="km">${item.km || ""}</p>
            <div class="promotion-bottom">
              ${priceMarkup(item, "promotion-price")}
            </div>
          </div>
        </article>
      `,
    )
    .join("");

  elements.promotionDots.innerHTML = promotions
    .map(
      (item, index) => `
        <button
          class="carousel-dot"
          type="button"
          data-slide="${index}"
          aria-label="Show ${item.en}"
          aria-current="${index === state.promotionIndex}"
          title="${item.en}"
        ></button>
      `,
    )
    .join("");

  elements.promotionPrevious.hidden = promotions.length < 2;
  elements.promotionNext.hidden = promotions.length < 2;
  elements.promotionDots.hidden = promotions.length < 2;
  showPromotion(state.promotionIndex, false);
  startAutoplay();
}

function showPromotion(index, restart = true) {
  const promotions = state.data?.promotions ?? [];
  if (promotions.length === 0) return;

  state.promotionIndex = (index + promotions.length) % promotions.length;
  elements.promotionTrack.style.transform = `translateX(-${state.promotionIndex * 100}%)`;

  [...elements.promotionTrack.children].forEach((slide, slideIndex) => {
    slide.setAttribute("aria-hidden", String(slideIndex !== state.promotionIndex));
  });
  [...elements.promotionDots.children].forEach((dot, dotIndex) => {
    dot.setAttribute("aria-current", String(dotIndex === state.promotionIndex));
  });

  if (restart) startAutoplay();
}

function startAutoplay() {
  stopAutoplay();
  if (
    !state.data ||
    state.data.promotions.length < 2 ||
    document.hidden ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    return;
  }
  state.autoplayTimer = window.setInterval(() => showPromotion(state.promotionIndex + 1, false), 5000);
}

function stopAutoplay() {
  window.clearInterval(state.autoplayTimer);
  state.autoplayTimer = null;
}

function renderCategories() {
  const categories = [{ name: "all", count: state.data.items.length }, ...state.data.categories];
  elements.tabs.innerHTML = categories
    .map(
      (category) => `
        <button
          class="category-tab"
          type="button"
          data-category="${category.name}"
          aria-selected="${state.category === category.name}"
        >
          <strong>${category.name === "all" ? "All Menu" : category.name}</strong>
          <small>${category.count} drinks</small>
        </button>
      `,
    )
    .join("");
}

function renderMenu() {
  const items = currentItems();
  elements.grid.innerHTML = items
    .map(
      (item, index) => `
        <article class="menu-card" data-id="${item.id}">
          <div class="card-media">
            ${imageButton(item, "card-image", index < 8)}
            <span class="type-mark">${item.category}</span>
          </div>
          <div class="card-body">
            <div class="name-stack">
              <h3>${item.en}</h3>
              <p lang="km">${item.km || ""}</p>
            </div>
            ${priceMarkup(item)}
          </div>
        </article>
      `,
    )
    .join("");

  elements.count.textContent = `${items.length} drinks · USD + KHR`;
  elements.empty.hidden = items.length !== 0;
  elements.clearFilters.disabled = state.category === "all" && normalize(state.query) === "";
}

function selectCategory(category) {
  state.category = category;
  [...elements.tabs.children].forEach((tab) => {
    tab.setAttribute("aria-selected", String(tab.dataset.category === category));
  });
  renderMenu();
}

function openImage(id) {
  const item = state.data.items.find((candidate) => candidate.id === id);
  if (!item?.fullImage) return;

  elements.dialogImage.src = item.fullImage;
  elements.dialogImage.alt = item.en;
  elements.dialogTitle.textContent = item.en;
  elements.dialogKhmer.textContent = item.km || "";
  elements.dialogPrice.innerHTML = priceMarkup(item, "dialog-price");
  elements.dialog.showModal();
}

function renderAll() {
  [elements.brandLogo, elements.footerLogo].forEach((logo) => {
    logo.hidden = !state.data.logo;
    if (state.data.logo) logo.src = state.data.logo;
  });
  renderPromotions();
  renderCategories();
  renderMenu();
  elements.qrUrl.textContent = state.data.menuUrl;
  elements.qrImages.forEach((image) => {
    image.src = `/qr.png?v=${state.data.qrVersion}`;
  });
}

async function loadMenu({ silent = false } = {}) {
  try {
    const response = await fetch("/api/menu", { cache: "no-store" });
    if (!response.ok) throw new Error(`Menu request failed: ${response.status}`);
    const data = await response.json();
    if (state.data?.version === data.version) return;
    state.data = data;
    renderAll();
  } catch (error) {
    if (!silent) {
      elements.grid.innerHTML = `<p class="load-error">Menu could not be loaded. Please refresh.</p>`;
    }
    console.error(error);
  }
}

elements.promotionPrevious.addEventListener("click", () => showPromotion(state.promotionIndex - 1));
elements.promotionNext.addEventListener("click", () => showPromotion(state.promotionIndex + 1));

elements.promotionDots.addEventListener("click", (event) => {
  const dot = event.target.closest("[data-slide]");
  if (dot) showPromotion(Number(dot.dataset.slide));
});

elements.promotionTrack.addEventListener("click", (event) => {
  const image = event.target.closest("[data-image-id]");
  if (image) openImage(Number(image.dataset.imageId));
});

elements.grid.addEventListener("click", (event) => {
  const image = event.target.closest("[data-image-id]");
  if (image) openImage(Number(image.dataset.imageId));
});

elements.tabs.addEventListener("click", (event) => {
  const tab = event.target.closest("[data-category]");
  if (tab) selectCategory(tab.dataset.category);
});

elements.search.addEventListener("input", (event) => {
  state.query = event.target.value;
  renderMenu();
});

elements.clearFilters.addEventListener("click", () => {
  state.category = "all";
  state.query = "";
  elements.search.value = "";
  renderCategories();
  renderMenu();
  elements.search.focus();
});

elements.qrOpen.addEventListener("click", () => elements.qrDialog.showModal());
elements.qrClose.addEventListener("click", () => elements.qrDialog.close());
elements.qrDialog.addEventListener("click", (event) => {
  if (event.target === elements.qrDialog) elements.qrDialog.close();
});

elements.promotionCarousel.addEventListener("pointerdown", (event) => {
  state.pointerStartX = event.clientX;
  stopAutoplay();
});

elements.promotionCarousel.addEventListener("pointerup", (event) => {
  if (state.pointerStartX === null) return;
  const distance = event.clientX - state.pointerStartX;
  state.pointerStartX = null;
  if (Math.abs(distance) > 45) showPromotion(state.promotionIndex + (distance < 0 ? 1 : -1));
  else startAutoplay();
});

elements.promotionCarousel.addEventListener("pointercancel", () => {
  state.pointerStartX = null;
  startAutoplay();
});
elements.promotionCarousel.addEventListener("mouseenter", stopAutoplay);
elements.promotionCarousel.addEventListener("mouseleave", startAutoplay);
elements.promotionCarousel.addEventListener("focusin", stopAutoplay);
elements.promotionCarousel.addEventListener("focusout", startAutoplay);

elements.dialogClose.addEventListener("click", () => elements.dialog.close());
elements.dialog.addEventListener("click", (event) => {
  if (event.target === elements.dialog) elements.dialog.close();
});
elements.dialog.addEventListener("close", () => {
  elements.dialogImage.src = "";
});

document.addEventListener("visibilitychange", startAutoplay);
window.setInterval(() => loadMenu({ silent: true }), 15000);
loadMenu();
