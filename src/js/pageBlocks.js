const blockAccessPromises = new Map();

function normalizeRole(value) {
  const aliases = { gebruiker: "user", lerende: "learner", gast: "guest" };
  return aliases[String(value || "").toLowerCase()] || String(value || "guest").toLowerCase();
}

export function activeBlockRole() {
  return normalizeRole(
    new URLSearchParams(window.location.search).get("role") ||
    localStorage.getItem("active_role") ||
    localStorage.getItem("leerpret.poc.role") ||
    "guest"
  );
}

export async function loadBlockAccess(role = activeBlockRole(), pageId = "") {
  const apiBase = (
    localStorage.getItem("api_base")
    || localStorage.getItem("leerpret.apiBase")
    || window.LEERPRET_CONFIG.apiBase
  ).replace(/\/$/, "");
  const key = `${apiBase}:${role}:${pageId}`;
  if (!blockAccessPromises.has(key)) {
    const query = new URLSearchParams({ role });
    if (pageId) query.set("page", pageId);
    blockAccessPromises.set(
      key,
      import("./api.js").then(({ apiGet }) => apiGet(`/access/blocks?${query}`))
    );
  }
  return blockAccessPromises.get(key);
}

export class PageBlockController {
  constructor(root, configuration, role = activeBlockRole()) {
    this.root = root;
    this.pageId = root.dataset.pageBlocks;
    this.page = configuration.pages?.[this.pageId] || { blocks: {} };
    this.role = role;
    this.menuItems = [...root.querySelectorAll(".page-block-menu-item[data-block-id]")];
    this.contentItems = [...root.querySelectorAll(".page-block-content-item[data-block-id]")];
    this.activeBlock = null;
  }

  initialize() {
    const allowedIds = new Set(Object.keys(this.page.blocks || {}));

    this.menuItems.forEach((item) => {
      item.hidden = !allowedIds.has(item.dataset.blockId);
      item.addEventListener("click", () => this.select(item.dataset.blockId, true));
    });
    this.contentItems.forEach((item) => {
      item.hidden = !allowedIds.has(item.dataset.blockId);
    });

    const requested = new URLSearchParams(window.location.search).get("block");
    const stored = localStorage.getItem(`leerpret.blocks.${this.pageId}`);
    const visibleMenuIds = this.menuItems.filter((item) => !item.hidden).map((item) => item.dataset.blockId);
    const initial = [requested, stored, this.page.default, visibleMenuIds[0]].find((id) => id && allowedIds.has(id));
    if (initial) this.select(initial, false);
    return this;
  }

  select(blockId, updateUrl = false) {
    const menuItem = this.menuItems.find((item) => item.dataset.blockId === blockId && !item.hidden);
    const contentItem = this.contentItems.find((item) => item.dataset.blockId === blockId && !item.hidden);
    if (!menuItem || !contentItem) return false;

    this.activeBlock = blockId;
    this.menuItems.forEach((item) => {
      const active = item === menuItem;
      item.classList.toggle("active", active);
      item.setAttribute("aria-current", active ? "page" : "false");
    });
    this.contentItems.forEach((item) => {
      const active = item === contentItem;
      item.classList.toggle("active", active);
      item.hidden = !active;
    });
    localStorage.setItem(`leerpret.blocks.${this.pageId}`, blockId);
    if (updateUrl) {
      const url = new URL(window.location.href);
      url.searchParams.set("block", blockId);
      history.replaceState({}, "", url);
    }
    this.root.dispatchEvent(new CustomEvent("page-block-change", { detail: { blockId, role: this.role } }));
    return true;
  }
}

export async function initializePageBlocks() {
  const roots = [...document.querySelectorAll("[data-page-blocks]")];
  if (!roots.length) return [];
  const role = activeBlockRole();
  return Promise.all(roots.map(async (root) => {
    const configuration = await loadBlockAccess(role, root.dataset.pageBlocks);
    return new PageBlockController(root, configuration, role).initialize();
  }));
}
