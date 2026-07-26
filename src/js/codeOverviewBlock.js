import { apiGet, initSettings, escapeHtml, shortCommit } from "./api.js";

let codeStylesInjected = false;

/* Het code-overzicht is opgesplitst over drie tabbladen. Met `sections` kiest de
   aanroeper welk deel dit blok toont: de cijfers, de artikelfragmenten of de
   libraryfuncties. Zonder opgave verschijnt alles, zoals voorheen. */
export async function initCodeOverviewBlock(options = {}) {
  initSettings();
  injectCodeOverviewStyles();

  const root =
    options.root ||
    document.getElementById(options.rootId || "code-overview-block") ||
    document.querySelector("[data-code-overview-block]");
  if (!root) return;

  const gevraagd = options.sections || root.dataset.codeOverviewSections;
  const secties = new Set(
    (typeof gevraagd === "string" ? gevraagd.split(",") : gevraagd || ["metrics", "articles", "library"])
      .map((naam) => String(naam).trim())
      .filter(Boolean)
  );

  root.innerHTML = `
    <div class="mobile-card">
      <p class="muted-text">Code-overzicht laden...</p>
    </div>
  `;

  try {
    const response = await apiGet("/developer/code");
    const summary = response.summary || {};
    const articles = response.articles || [];
    const library = response.library || [];

    const delen = [];

    if (secties.has("metrics")) {
      delen.push(`
      <section class="code-metrics-strip" aria-label="Code statistieken">
        <div class="code-metric-pill"><strong>${escapeHtml(summary.linked_fragments ?? 0)}</strong><span>Artikel-fragmenten</span></div>
        <div class="code-metric-pill"><strong>${escapeHtml(summary.library_fragments ?? 0)}</strong><span>Library-fragmenten</span></div>
        <div class="code-metric-pill"><strong>${escapeHtml(shortCommit(summary.commit))}</strong><span>Git commit</span></div>
        <div class="code-metric-pill"><strong>${escapeHtml(summary.round ?? "-")}</strong><span>Ronde</span></div>
      </section>`);
    }

    if (secties.has("articles")) {
      delen.push(`
      <section class="code-articles-section">
        <span class="eyebrow">Artikel Bronfragmenten</span>
        <div class="code-articles-list">
          ${articles.length ? articles.map(renderArticleCodeCard).join("") : '<p class="muted-text">Geen gekoppelde artikelcode gevonden.</p>'}
        </div>
      </section>`);
    }

    if (secties.has("library")) {
      delen.push(`
      <section class="library-items-section">
        <span class="eyebrow">Library Functies</span>
        ${renderLibraryByCategory(library)}
      </section>`);
    }

    root.innerHTML = delen.join("");
    herstelOpenCategorieen(root);
  } catch (error) {
    root.innerHTML = `
      <div class="stale-warning error-feedback">
        <h4>Fout bij inladen code-overzicht</h4>
        <p>Kan geen data ophalen. Is de backend API actief?</p>
      </div>
    `;
  }
}

/* Ook hier de vouwstaat onthouden: het blok wordt bij elke verversing opnieuw
   opgebouwd en klapte anders steeds terug naar de standaardstand. */
const OPEN_CATEGORIEEN_SLEUTEL = "leerpret.library.opencategorieen";

function openCategorieen() {
  try {
    const opgeslagen = localStorage.getItem(OPEN_CATEGORIEEN_SLEUTEL);
    return opgeslagen === null ? null : new Set(JSON.parse(opgeslagen));
  } catch (error) {
    return null;
  }
}

function herstelOpenCategorieen(root) {
  const bewaard = openCategorieen();
  root.querySelectorAll(".library-category[data-categorie]").forEach((blok) => {
    // Geen keuze bewaard? Dan blijft de standaardstand staan: eerste open.
    if (bewaard) blok.open = bewaard.has(blok.dataset.categorie);
    blok.addEventListener("toggle", () => {
      const huidig = new Set(
        [...root.querySelectorAll(".library-category[data-categorie]")]
          .filter((item) => item.open)
          .map((item) => item.dataset.categorie)
      );
      try {
        localStorage.setItem(OPEN_CATEGORIEEN_SLEUTEL, JSON.stringify([...huidig]));
      } catch (error) {
        /* opslag niet beschikbaar */
      }
    });
  });
}

/* Libraryfuncties per type (engine_library, enzovoort), elk type uitklapbaar.
   Eén lange lijst was niet te overzien; de categorie is de natuurlijke indeling. */
function renderLibraryByCategory(library) {
  if (!library.length) return '<div class="mobile-card"><p class="muted-text">Geen algemene library code gevonden.</p></div>';

  const perCategorie = new Map();
  library.forEach((item) => {
    const categorie = item.category || "library";
    if (!perCategorie.has(categorie)) perCategorie.set(categorie, []);
    perCategorie.get(categorie).push(item);
  });

  return [...perCategorie.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([categorie, items], index) => `
      <details class="library-category" data-categorie="${escapeHtml(categorie)}" ${index === 0 ? "open" : ""}>
        <summary>
          <span class="library-category-naam">${escapeHtml(categorie)}</span>
          <span class="library-category-aantal">${items.length}</span>
        </summary>
        <div class="mobile-card">
          <div class="library-grid-list">
            ${items.map(renderLibraryItem).join("")}
          </div>
        </div>
      </details>
    `)
    .join("");
}

function renderArticleCodeCard(article) {
  const checked = Boolean(article.checklist?.checked);
  const locations = (article.code_locations || []).map(renderCodeLocation).join("");
  return `
    <div class="mobile-card code-article-card">
      <div class="code-article-header">
        <span class="badge">Stap ${escapeHtml(article.order)}</span>
        <h3>${escapeHtml(article.title)}</h3>
        <div class="acceptance-status-wrap">
          <div class="acceptance-status-tag ${checked ? "checked" : "pending"}">${checked ? "Afgevinkt" : "Pending"}</div>
          <small class="acceptance-status-sub">ronde ${escapeHtml(article.checklist?.round ?? "-")} - commit ${escapeHtml(shortCommit(article.checklist?.commit))}</small>
        </div>
      </div>
      <p class="code-article-abstract">${escapeHtml(article.summary || "")}</p>
      <details class="code-locations-accordion">
        <summary>Toon ${escapeHtml(article.code_locations?.length || 0)} code-fragmenten</summary>
        <div class="locations-content-wrapper">
          ${locations || '<p class="muted-text">Geen fragmenten gekoppeld.</p>'}
        </div>
      </details>
    </div>
  `;
}

function renderCodeLocation(location) {
  return `
    <div class="code-loc-snippet">
      <div class="snippet-meta">
        <strong>${escapeHtml(location.symbol || "")}</strong>
        <small>${escapeHtml(location.path || "")}</small>
      </div>
      <p class="snippet-purpose">${escapeHtml(location.purpose || "")}</p>
      ${location.snippet ? `<pre class="snippet-pre"><code>${escapeHtml(location.snippet.text)}</code></pre>` : ""}
    </div>
  `;
}

function renderLibraryItem(item) {
  return `
    <div class="lib-func-item">
      <strong>${escapeHtml(item.symbol || "")}</strong>
      <small>${escapeHtml(item.path || "")}:${escapeHtml(item.line ?? "")}</small>
    </div>
  `;
}

function injectCodeOverviewStyles() {
  if (codeStylesInjected || document.getElementById("code-overview-block-styles")) return;
  codeStylesInjected = true;
  const style = document.createElement("style");
  style.id = "code-overview-block-styles";
  style.textContent = `
    .code-metrics-strip{display:flex;justify-content:space-between;gap:8px;margin-bottom:24px}.code-metric-pill{flex:1;background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:12px 8px;text-align:center;box-shadow:0 2px 4px rgba(0,0,0,.01)}.code-metric-pill strong{font-size:1.3rem;color:var(--teal);display:block;line-height:1.1;font-family:var(--font-heading)}.code-metric-pill span{font-size:.68rem;color:var(--muted);font-weight:600;text-transform:uppercase}
    .code-articles-list{display:flex;flex-direction:column;gap:12px;margin-bottom:24px}.code-article-card{position:relative}.code-article-header{display:flex;justify-content:space-between;align-items:flex-start;gap:12px}.code-article-header h3{font-size:1.1rem;margin:4px 0 0 0;flex:1}.acceptance-status-wrap{display:flex;flex-direction:column;align-items:flex-end;gap:2px}.acceptance-status-sub{font-size:.6rem;color:var(--muted);white-space:nowrap}.acceptance-status-tag{font-size:.68rem;font-weight:700;padding:2px 8px;border-radius:4px;text-transform:uppercase}.acceptance-status-tag.checked{background:var(--green-light);color:var(--green)}.acceptance-status-tag.pending{background:#f1f5f9;color:#475569}.code-article-abstract{font-size:.85rem;color:var(--muted);margin:8px 0 12px 0;line-height:1.4}
    .code-locations-accordion{border-top:1px solid var(--line);padding-top:8px}.code-locations-accordion summary{font-size:.82rem;font-weight:700;color:var(--teal);cursor:pointer;outline:none}.locations-content-wrapper{padding-top:12px;display:flex;flex-direction:column;gap:16px}.code-loc-snippet{border-bottom:1px dashed var(--line);padding-bottom:14px}.code-loc-snippet:last-child{border-bottom:none;padding-bottom:0}.snippet-meta{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:4px}.snippet-meta strong{font-size:.88rem;color:var(--ink)}.snippet-meta small{font-size:.72rem;color:var(--muted);word-break:break-all;text-align:right}.snippet-purpose{font-size:.8rem;color:var(--ink);margin:0 0 8px 0}.snippet-pre{background:#0f172a;color:#cbd5e1;padding:10px 14px;border-radius:8px;font-size:.75rem;overflow-x:auto;max-height:200px;border:1px solid #1e293b;margin:0}
    .library-category{border:1px solid var(--line);border-radius:12px;margin-bottom:10px;overflow:hidden}.library-category>summary{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:11px 14px;cursor:pointer;background:var(--surface-soft,#f8fafc);list-style:none}.library-category>summary::-webkit-details-marker{display:none}.library-category>summary::before{content:"▸";color:var(--muted);font-size:.8rem;transition:transform .15s ease}.library-category[open]>summary::before{transform:rotate(90deg)}.library-category-naam{flex:1;font-weight:700;font-size:.86rem;color:var(--ink);font-family:var(--font-mono,monospace)}.library-category-aantal{min-width:26px;padding:1px 8px;border-radius:999px;background:var(--panel);border:1px solid var(--line);color:var(--muted);font-size:.72rem;text-align:center}.library-category .mobile-card{border:0;border-radius:0;box-shadow:none}.library-grid-list{display:flex;flex-direction:column;gap:12px}.lib-func-item{border-bottom:1px solid var(--line);padding-bottom:8px;display:flex;flex-direction:column;gap:2px}.lib-func-item:last-child{border-bottom:none;padding-bottom:0}.lib-func-item strong{font-size:.88rem;color:var(--ink)}.lib-func-item small{font-size:.72rem;color:var(--muted)}.lib-badge{align-self:flex-start;margin-bottom:2px;font-size:.62rem}@media(min-width:768px){.code-metrics-strip{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}.library-grid-list{display:grid;grid-template-columns:1fr 1fr;gap:16px}}
  `;
  document.head.appendChild(style);
}
