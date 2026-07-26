import { apiGet, apiPut, state, initSettings, escapeHtml, phasePalette, shortArticleTitle, renderMath } from "./api.js";

let stylesInjected = false;

export async function initControlLineBlock(options = {}) {
  initSettings();
  injectControlLineStyles();

  const root =
    options.root ||
    document.getElementById(options.rootId || "developer-steps-list") ||
    document.querySelector("[data-control-line-block]");
  if (!root) return;

  const phaseTarget =
    options.phaseRoot ||
    document.getElementById(options.phaseRootId || "phase-map-svg") ||
    root.querySelector("[data-control-line-phase]");

  root.innerHTML = loadingHTML("Ontwikkelstappen laden...", "Verbinding maken met de service...");
  if (phaseTarget) {
    phaseTarget.innerHTML = loadingHTML("Fasekaart laden...", "Verbinding maken met de service...");
  }

  try {
    const response = await apiGet("/developer/steps");
    const steps = response.steps || [];
    state.steps = steps;

    if (!steps.length) {
      root.innerHTML = loadingHTML("Geen bouwstappen geladen", "Start de backend om de artikelen en controlepunten te laden.");
      if (phaseTarget) phaseTarget.innerHTML = "";
      return;
    }

    root.innerHTML = steps.map(renderStepCard).join("");
    herstelOpenStappen(root);
    bindControlLineEvents(root);
    if (phaseTarget) renderPhaseMap(phaseTarget, steps);

    renderMath(root);
  } catch (error) {
    root.innerHTML = loadingHTML("Fout bij laden van controlelijn", "Kan geen data ophalen van de backend service.", true);
    if (phaseTarget) {
      phaseTarget.innerHTML = loadingHTML("Fasekaart offline", "De fasekaart wordt uit de backendstappen opgebouwd zodra de service bereikbaar is.", true);
    }
  }
}

/* De vouwstaat per stap onthouden. Het blok wordt bij elke verversing opnieuw
   opgebouwd; zonder dit geheugen klapte alles wat je open had staan weer dicht. */
const OPEN_STAPPEN_SLEUTEL = "leerpret.controlelijn.openstappen";

function openStappen() {
  try {
    return new Set(JSON.parse(localStorage.getItem(OPEN_STAPPEN_SLEUTEL) || "[]"));
  } catch (error) {
    return new Set();
  }
}

function bewaarOpenStappen(verzameling) {
  try {
    localStorage.setItem(OPEN_STAPPEN_SLEUTEL, JSON.stringify([...verzameling]));
  } catch (error) {
    /* opslag niet beschikbaar: de vouwstaat is dan alleen niet blijvend */
  }
}

/* Alle stappen beginnen dichtgeklapt, zodat de controlelijn in één oogopslag te
   overzien is. Wat je tijdens een sessie openzet blijft bij een tussentijdse
   verversing staan, maar bij een nieuw bezoek begin je weer met een schoon overzicht. */
function herstelOpenStappen(root) {
  const open = root.dataset.stappenHersteld ? openStappen() : new Set();
  root.dataset.stappenHersteld = "ja";
  root.querySelectorAll(".step-card-fold[data-step-id]").forEach((fold) => {
    fold.open = open.has(fold.dataset.stepId);
    fold.addEventListener("toggle", () => {
      const huidig = openStappen();
      if (fold.open) huidig.add(fold.dataset.stepId);
      else huidig.delete(fold.dataset.stepId);
      bewaarOpenStappen(huidig);
    });
  });
}

function renderStepCard(step) {
  const checked = Boolean(step.checklist?.checked);
  const note = step.checklist?.note || "";
  const runtimeStatus = step.verification?.runtime?.status || step.verification?.status || "not_run";
  const latexLines = (step.latex || []).map((line) => `<li>\\(${escapeHtml(line)}\\)</li>`).join("");
  const concepts = (step.concepts || []).slice(0, 4).map(renderConcept).join("");
  const codeLocations = (step.code_locations || []).map(renderCodeLocation).join("");
  const imageLinks = (step.images || []).map(renderImageLink).join("");
  const assertions = (step.verification?.runtime?.assertions || []).map(renderAssertion).join("") || "<li>Nog geen assertions uitgevoerd</li>";
  const testSummary = renderTestSummary(step.verification?.runtime?.summary);

  return `
    <article class="step-card-item" id="step-card-${escapeHtml(step.id)}">
      <details class="step-card-fold" data-step-id="${escapeHtml(step.id)}">
        <summary class="step-card-header">
          <span class="badge ${escapeHtml(runtimeStatus)}">Stap ${escapeHtml(step.order)} - ${escapeHtml(runtimeStatus)}</span>
          <h3>${escapeHtml(step.title)}</h3>
          <p class="eyebrow-text">${escapeHtml(step.article || "Kernartikel")}</p>
          <p class="step-desc-text">${escapeHtml(step.core_question || step.summary || "")}</p>
        </summary>
        <div class="step-card-fold-body">

      ${renderVisualCard(step)}

      <div class="step-accordance-panel">
        <label class="accord-checkbox-label">
          <input type="checkbox" class="step-check" data-step-id="${escapeHtml(step.id)}" ${checked ? "checked" : ""}>
          <span>Akkoord</span>
        </label>
        <div class="input-group-note">
          <input type="text" class="step-note" data-step-id="${escapeHtml(step.id)}" value="${escapeHtml(note)}" placeholder="Reviewnotitie">
        </div>
        <button class="btn btn-primary btn-sm btn-save-step" data-step-id="${escapeHtml(step.id)}">Opslaan</button>
      </div>

      <details class="step-details-accordion">
        <summary>Toon theorie, code & assertions</summary>
        <div class="accordion-content">
          <div class="content-block">
            <h4>Theorie en Formules</h4>
            <ul class="formula-bullet-list">${latexLines}</ul>
            <h4>Begrippen</h4>
            <ul class="concepts-bullet-list">${concepts}</ul>
          </div>

          <div class="content-block">
            <h4>Gekoppelde Code</h4>
            <div class="locations-flex">${codeLocations || '<p class="muted-text">Geen codekoppeling gevonden.</p>'}</div>
          </div>

          <div class="content-block">
            <h4>Visuele bronnen via service</h4>
            <div class="step-image-links">${imageLinks || '<p class="muted-text">Geen visuele bronnen gekoppeld.</p>'}</div>
          </div>

          <div class="content-block">
            <h4>Asserties</h4>
            <ul class="assertions-bullet-list">${assertions}</ul>
            ${testSummary}
            <div class="test-actions-row">
              <button class="btn btn-secondary btn-sm btn-show-json" data-step-id="${escapeHtml(step.id)}">Toon JSON data</button>
              <button class="btn btn-primary btn-sm btn-run-visual" data-step-id="${escapeHtml(step.id)}">Run visueel</button>
            </div>
            <pre class="step-json-block" id="json-block-${escapeHtml(step.id)}" hidden><code>Laden...</code></pre>
            <div class="visual-test-output" id="visual-output-${escapeHtml(step.id)}"></div>
          </div>
        </div>
      </details>

        </div>
      </details>
    </article>
  `;
}

function bindControlLineEvents(root) {
  root.querySelectorAll(".btn-save-step").forEach((button) => {
    button.addEventListener("click", () => saveChecklistRow(button.getAttribute("data-step-id"), root));
  });
  root.querySelectorAll(".btn-show-json").forEach((button) => {
    button.addEventListener("click", () => toggleJsonData(button.getAttribute("data-step-id"), root));
  });
  root.querySelectorAll(".btn-run-visual").forEach((button) => {
    button.addEventListener("click", () => runVisualStepTest(button.getAttribute("data-step-id"), root));
  });
}

function renderPhaseMap(container, steps) {
  const points = steps.map((step, index) => ({
    step,
    x: 90 + index * 135,
    y: index % 2 === 0 ? 215 : 120,
  }));
  const path = points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
  const width = Math.max(1000, 90 + points.length * 135 + 90);
  container.innerHTML = `
    <svg class="phase-svg" viewBox="0 0 ${width} 360" role="img" aria-label="Lineaire Leerpret bouwlijn">
      <path class="phase-path" d="${path}"></path>
      ${points.map(renderPhasePoint).join("")}
    </svg>
  `;
  container.querySelectorAll("[data-phase-step]").forEach((node) => {
    node.addEventListener("click", () => scrollToStep(node.dataset.phaseStep));
    node.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        scrollToStep(node.dataset.phaseStep);
      }
    });
  });
}

function renderPhasePoint({ step, x, y }) {
  const color = phasePalette[step.id] || "#2f7d68";
  const status = step.verification?.runtime?.status || step.verification?.status || "not_run";
  const cardY = y > 170 ? y - 118 : y + 34;
  return `
    <g class="phase-link" data-phase-step="${escapeHtml(step.id)}" tabindex="0">
      <rect class="phase-card" x="${x - 62}" y="${cardY}" width="124" height="82" rx="8"></rect>
      <circle class="phase-node" cx="${x}" cy="${y}" r="28" fill="${escapeHtml(color)}"></circle>
      <text x="${x}" y="${cardY + 28}" text-anchor="middle" font-size="17">${escapeHtml(step.order)}. ${escapeHtml(shortArticleTitle(step.article || step.title))}</text>
      <text class="phase-sub" x="${x}" y="${cardY + 54}" text-anchor="middle">${escapeHtml(status)}</text>
    </g>
  `;
}

function renderVisualCard(step) {
  const color = phasePalette[step.id] || "#2f7d68";
  return `
    <div class="visual-card">
      ${phaseIcon(step.id, color)}
      <div>
        <strong>${escapeHtml(step.article || step.title)}</strong>
        <p>${escapeHtml(step.summary || "")}</p>
      </div>
    </div>
  `;
}

function phaseIcon(stepId, color) {
  const label = String(stepId || "?").slice(0, 2).toUpperCase();
  return `
    <svg class="phase-icon" viewBox="0 0 64 64" aria-hidden="true">
      <rect x="8" y="8" width="48" height="48" rx="14" fill="${escapeHtml(color)}" opacity="0.14"></rect>
      <path d="M20 42 V22 L32 16 L44 22 V42 L32 48 Z" fill="none" stroke="${escapeHtml(color)}" stroke-width="4" stroke-linejoin="round"></path>
      <circle cx="32" cy="32" r="7" fill="${escapeHtml(color)}"></circle>
      <text x="32" y="36" text-anchor="middle" fill="#fff" font-size="8" font-weight="800">${escapeHtml(label)}</text>
    </svg>
  `;
}

function renderConcept(concept) {
  return `
    <li>
      <strong>${escapeHtml(concept.title)}</strong>
      <span>${escapeHtml(concept.explanation || "")}</span>
    </li>
  `;
}

function renderCodeLocation(location) {
  return `
    <div class="code-location-pill">
      <strong>${escapeHtml(location.symbol || "")}</strong>
      <small>${escapeHtml(location.path || "")}</small>
      <p>${escapeHtml(location.purpose || "")}</p>
    </div>
  `;
}

function renderImageLink(image) {
  const url = `${state.apiBase}/help/assets/${encodeURIComponent(image)}`;
  return `<a href="${url}" target="_blank" rel="noopener" title="${escapeHtml(image)}"><img src="${url}" alt=""></a>`;
}

function renderAssertion(assertion) {
  return `
    <li class="${assertion.passed ? "passed" : "failed"}">
      <span class="assert-badge">${assertion.passed ? "OK" : "FAIL"}</span>
      <div class="assert-text">
        <strong>${escapeHtml(assertion.label || assertion.path || "")}</strong>
        <small>${escapeHtml(assertion.path || "")}</small>
      </div>
    </li>
  `;
}

function renderTestSummary(summary) {
  if (!summary) return "";
  return `
    <dl class="result-summary">
      <div><dt>Score</dt><dd>${escapeHtml(summary.learning_value ?? "-")}</dd></div>
      <div><dt>Type</dt><dd>${escapeHtml(summary.analytic_archetype ?? "-")}</dd></div>
      <div><dt>Status</dt><dd>${escapeHtml(summary.status ?? "-")}</dd></div>
    </dl>
  `;
}

async function saveChecklistRow(stepId, root) {
  const card = root.querySelector(`#step-card-${cssId(stepId)}`);
  if (!card) return;
  const checked = card.querySelector(".step-check").checked;
  const note = card.querySelector(".step-note").value;
  const button = card.querySelector(".btn-save-step");
  button.disabled = true;
  button.textContent = "...";
  try {
    await apiPut(`/developer/checklist/${encodeURIComponent(stepId)}`, { checked, note });
    button.textContent = "Bewaard";
    setTimeout(() => { button.textContent = "Opslaan"; }, 1200);
  } catch {
    localStorage.setItem(`leerpret.check.${stepId}`, JSON.stringify({ checked, note }));
    button.textContent = "Lokaal bewaard";
    setTimeout(() => { button.textContent = "Opslaan"; }, 1400);
  } finally {
    button.disabled = false;
  }
}

async function toggleJsonData(stepId, root) {
  const block = root.querySelector(`#json-block-${cssId(stepId)}`);
  if (!block) return;
  if (!block.hidden) {
    block.hidden = true;
    return;
  }
  block.hidden = false;
  block.querySelector("code").textContent = "Laden...";
  try {
    const response = await apiGet(`/developer/test-data/${encodeURIComponent(stepId)}`);
    block.querySelector("code").textContent = JSON.stringify(response, null, 2);
  } catch {
    block.querySelector("code").textContent = "Fout bij laden van testdata.";
  }
}

async function runVisualStepTest(stepId, root) {
  const output = root.querySelector(`#visual-output-${cssId(stepId)}`);
  if (!output) return;
  output.innerHTML = '<div class="visual-test-loading">Test wordt uitgevoerd...</div>';
  output.style.display = "block";
  try {
    const response = await apiGet(`/developer/step-tests/${encodeURIComponent(stepId)}`);
    const status = response.status || "unknown";
    output.innerHTML = `
      <div class="visual-card-result ${escapeHtml(status)}">
        <div class="result-header">
          <span class="badge ${escapeHtml(status)}">${escapeHtml(status)}</span>
          <strong>Resultaat: ${escapeHtml(response.label || stepId)}</strong>
        </div>
        <pre class="json-preview">${escapeHtml(JSON.stringify(response.response || {}, null, 2))}</pre>
        <ul class="assertions-bullet-list">
          ${(response.assertions || []).map(renderAssertion).join("")}
        </ul>
      </div>
    `;
  } catch (error) {
    output.innerHTML = `<div class="visual-test-error">Fout bij uitvoeren test: ${escapeHtml(error.message || error)}</div>`;
  }
}

/* De PDF per stap is vervallen: het tabblad PDF toont hem al, en daar is tussendoor
   naartoe te springen. Daarmee verdwenen ook togglePdfDrawer, openPdf en downloadPdf. */

function scrollToStep(stepId) {
  const card = document.getElementById(`step-card-${cssId(stepId)}`);
  if (!card) return;
  // De stapkaart begint dichtgeklapt; springen zonder openklappen zou aanvoelen
  // alsof er niets gebeurt. Eerst de kaart, dan het detailblok erbinnen.
  const fold = card.querySelector(".step-card-fold");
  if (fold) fold.open = true;
  card.querySelector(".step-details-accordion")?.setAttribute("open", "");
  card.scrollIntoView({ behavior: "smooth", block: "start" });
}

function loadingHTML(title, subtitle, error = false) {
  return `
    <div class="park-empty-state ${error ? "error" : ""}">
      <strong>${escapeHtml(title)}</strong>
      <span>${escapeHtml(subtitle)}</span>
    </div>
  `;
}

function cssId(value) {
  if (window.CSS?.escape) return window.CSS.escape(String(value));
  return String(value).replace(/[^a-zA-Z0-9_-]/g, "\\$&");
}

function injectControlLineStyles() {
  if (stylesInjected || document.getElementById("control-line-block-styles")) return;
  stylesInjected = true;
  const style = document.createElement("style");
  style.id = "control-line-block-styles";
  style.textContent = `
    .phase-map{border:1px solid var(--line);border-radius:12px;background:var(--panel);padding:16px;margin-bottom:20px;overflow-x:auto}.phase-map-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px}.phase-map-head h3{margin:2px 0 0 0;font-size:1.1rem}.phase-map-svg{margin-top:10px;min-height:260px}.phase-svg{width:100%;min-width:640px;min-height:260px;display:block}.phase-link{cursor:pointer}.phase-link text{font-weight:700;fill:var(--ink)}.phase-link .phase-sub{font-size:12px;font-weight:500;fill:var(--muted)}.phase-card{fill:#fff;stroke:var(--line);stroke-width:1.5}.phase-node{stroke:white;stroke-width:4}.phase-path{fill:none;stroke:#9db3c4;stroke-width:5;stroke-linecap:round}
    .steps-container,.control-line-steps{display:flex;flex-direction:column;gap:16px}.step-card-item{background:var(--panel);border:1px solid var(--line);border-radius:16px;padding:16px;box-shadow:0 2px 6px rgba(0,0,0,.015)}.step-card-fold>summary.step-card-header{margin:0;padding:2px 0 2px 22px;position:relative;cursor:pointer;list-style:none}.step-card-fold>summary::-webkit-details-marker{display:none}.step-card-fold>summary::before{content:"▸";position:absolute;left:2px;top:3px;color:var(--muted);font-size:.9rem;transition:transform .15s ease}.step-card-fold[open]>summary::before{transform:rotate(90deg)}.step-card-fold[open]>summary.step-card-header{margin-bottom:12px}.step-card-fold-body{padding-top:4px}.step-card-header{margin-bottom:12px}.step-card-header h3{font-size:1.2rem;margin:4px 0 2px 0}.eyebrow-text{font-size:.76rem;color:var(--muted);font-weight:600;margin:0 0 6px 0}.step-desc-text{font-size:.85rem;color:var(--ink);margin:0;line-height:1.45}.visual-card{display:flex;align-items:center;gap:14px;padding:12px;margin:12px 0;border:1px solid var(--line);border-radius:12px;background:var(--surface-soft,#f8fafc)}.phase-icon{width:56px;height:56px;flex:0 0 56px}.visual-card strong{color:var(--ink);font-size:.95rem}.visual-card p{margin:3px 0 0 0;color:var(--muted);font-size:.82rem;line-height:1.4}
    .step-accordance-panel{display:flex;align-items:center;gap:10px;border-top:1px solid var(--line);padding-top:12px;margin-bottom:12px}.accord-checkbox-label{display:flex;align-items:center;gap:6px;font-size:.85rem;font-weight:700;cursor:pointer;min-height:48px}.accord-checkbox-label input{width:20px;height:20px;accent-color:var(--green)}.input-group-note{flex:1}.input-group-note input{width:100%;border:1px solid var(--line);border-radius:8px;padding:8px 10px;font-size:.85rem;outline:none}.btn-save-step{width:auto;margin:0;min-height:38px;padding:8px 14px;font-size:.85rem}.step-details-accordion{border-top:1px solid var(--line);padding-top:8px;margin-bottom:12px}.step-details-accordion summary{font-size:.82rem;font-weight:700;color:var(--muted);cursor:pointer;padding:4px 0;outline:none}.accordion-content{padding-top:10px;display:flex;flex-direction:column;gap:16px}.content-block h4{font-size:.88rem;margin:0 0 6px 0;text-transform:uppercase;letter-spacing:.05em;color:var(--muted)}
    .formula-bullet-list,.concepts-bullet-list,.assertions-bullet-list{list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:8px}.formula-bullet-list li{font-size:1rem;background:var(--bg);border:1px solid var(--line);border-radius:8px;padding:8px;text-align:center;overflow-x:auto}.concepts-bullet-list li{display:flex;flex-direction:column;font-size:.85rem}.concepts-bullet-list strong{font-size:.82rem;color:var(--ink)}.concepts-bullet-list span{font-size:.76rem;color:var(--muted)}.locations-flex{display:flex;flex-direction:column;gap:8px}.code-location-pill{background:var(--surface-soft,#f8fafc);border:1px solid var(--line);border-radius:8px;padding:8px 10px}.code-location-pill strong{font-size:.82rem;color:var(--ink);display:block}.code-location-pill small{font-size:.72rem;color:var(--muted);display:block;word-break:break-all}.code-location-pill p{margin:4px 0 0 0;font-size:.76rem;color:var(--ink)}
    .step-image-links{display:flex;flex-wrap:wrap;gap:10px}.step-image-links a{display:block;width:92px;aspect-ratio:4/3;border:1px solid var(--line);border-radius:8px;overflow:hidden;background:var(--surface-soft,#f8fafc)}.step-image-links img{width:100%;height:100%;object-fit:cover;display:block}.assertions-bullet-list li{display:flex;align-items:center;gap:8px;font-size:.82rem;background:var(--bg);padding:6px 10px;border-radius:8px;border:1px solid var(--line)}.assertions-bullet-list li.passed{border-left:4px solid var(--green)}.assertions-bullet-list li.failed{border-left:4px solid var(--coral)}.assert-badge{font-size:.65rem;font-weight:800;padding:2px 6px;border-radius:4px}.passed .assert-badge{background:#ccfbf1;color:#115e59}.failed .assert-badge{background:#fee2e2;color:#991b1b}.assert-text{display:flex;flex-direction:column}.assert-text strong{font-size:.8rem}.assert-text small{font-size:.7rem;color:var(--muted)}
    .test-actions-row{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px}.step-json-block{background:#0f172a;color:#cbd5e1;padding:10px;border-radius:8px;font-size:.75rem;overflow-x:auto;margin-top:10px}.visual-test-output{display:none;margin-top:12px}.visual-test-loading,.visual-test-error{font-size:.82rem;color:var(--muted);text-align:center;padding:10px;background:var(--bg);border-radius:8px;border:1px solid var(--line)}.visual-card-result{border:1px solid var(--line);border-radius:10px;background:#faf5ff;padding:12px}.visual-card-result.passed{border-color:var(--green-border);background:var(--green-light)}.visual-card-result.failed{border-color:var(--bad-line);background:var(--bad)}.result-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;font-size:.82rem}.json-preview{background:#0f172a;color:#e2e8f0;padding:8px;border-radius:6px;font-size:.72rem;overflow-x:auto;max-height:150px;margin-bottom:8px}
    .result-summary{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:10px 0 0 0}.result-summary div{background:var(--bg);border:1px solid var(--line);border-radius:8px;padding:6px 8px;text-align:center}.result-summary dt{font-size:.65rem;text-transform:uppercase;letter-spacing:.04em;color:var(--muted);margin:0}.result-summary dd{margin:2px 0 0 0;font-size:.85rem;font-weight:700;color:var(--ink)}@media(min-width:768px){.step-card-item{padding:24px}}
  `;
  document.head.appendChild(style);
}
