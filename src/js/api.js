// Shared API and state manager for Leerpret Engine Dashboard
const API_STORAGE_KEYS = ["api_base", "leerpret.apiBase"];

function isTemporaryTunnel(value) {
  try {
    return new URL(String(value || "")).hostname.endsWith(".trycloudflare.com");
  } catch {
    return false;
  }
}

for (const key of API_STORAGE_KEYS) {
  if (isTemporaryTunnel(localStorage.getItem(key))) localStorage.removeItem(key);
}

export const state = {
  apiBase: window.LEERPRET_CONFIG.apiBase,
  editorBase: window.LEERPRET_CONFIG.editorUrl,
  organization: "local-dev",
  apiKey: "leerpret-local-dev",
  online: false,
  authorized: false,
  steps: [],
  code: null,
  simulator: null,
  poc: null,
  activeRole: localStorage.getItem("leerpret.loggedOut") === "true" ? "guest" : localStorage.getItem("leerpret.poc.role") || "architect",
  activeArticleId: localStorage.getItem("leerpret.poc.article") || "",
  activeLeerboxId: localStorage.getItem("leerpret.leerbox.id") || "",
  activeLeerboxView: localStorage.getItem("leerpret.leerbox.view") || "editor",
  activeDataView: localStorage.getItem("leerpret.data.view") || "source",
  leerboxDrafts: safeJsonParse(localStorage.getItem("leerpret.leerbox.drafts"), {}),
};

export const genericFallback = {
  message:
    "Geen connectie met de service. De frontend blijft werken, maar verdiepende helpdata, formule-uitkomsten en checklistopslag zijn nu niet beschikbaar.",
};

export const phasePalette = {
  definition: "#74405f",
  activation: "#2f80ed",
  typing: "#c78a28",
  formula: "#2f7d68",
  measurement: "#d76f56",
  "learning-box": "#248b91",
  simulation: "#6f5aa7",
};

export function initSettings() {
  const savedApi = localStorage.getItem("api_base") || localStorage.getItem("leerpret.apiBase");
  const savedEditor = localStorage.getItem("leerpret.editorBase");
  const loggedOut = localStorage.getItem("leerpret.loggedOut") === "true";
  const queryParameters = new URLSearchParams(window.location.search);
  const queryApi = queryParameters.get("api");
  const queryEditor = queryParameters.get("editor");
  const normaliseer = (waarde) => waarde.trim().replace(/\/$/, "");
  if (queryApi) {
    state.apiBase = normaliseer(queryApi);
    localStorage.setItem("api_base", state.apiBase);
    localStorage.setItem("leerpret.apiBase", state.apiBase);
    const cleanUrl = new URL(window.location.href);
    cleanUrl.searchParams.delete("api");
    window.history.replaceState({}, "", cleanUrl);
  } else if (savedApi && !isTemporaryTunnel(savedApi)) {
    state.apiBase = normaliseer(savedApi);
  }
  if (queryEditor) {
    state.editorBase = `${normaliseer(queryEditor)}/`;
    localStorage.setItem("leerpret.editorBase", state.editorBase);
  } else if (savedEditor) {
    state.editorBase = `${normaliseer(savedEditor)}/`;
  }
  state.organization = localStorage.getItem("org_id") || localStorage.getItem("leerpret.organization") || state.organization;
  state.apiKey = loggedOut ? "" : localStorage.getItem("api_key") || localStorage.getItem("leerpret.apiKey") || state.apiKey;
}

export function editorRootUrl() {
  return new URL(state.editorBase, window.location.href).toString();
}

export function saveSettings(apiBase, organization, apiKey) {
  state.apiBase = apiBase.trim().replace(/\/$/, "");
  state.organization = organization.trim();
  state.apiKey = apiKey;
  if (state.apiKey) {
    localStorage.removeItem("leerpret.loggedOut");
  }
  localStorage.setItem("api_base", state.apiBase);
  localStorage.setItem("leerpret.apiBase", state.apiBase);
  localStorage.setItem("org_id", state.organization);
  localStorage.setItem("leerpret.organization", state.organization);
  localStorage.setItem("api_key", state.apiKey);
  localStorage.setItem("leerpret.apiKey", state.apiKey);
}

export function logoutSession() {
  state.authorized = false;
  state.apiKey = "";
  state.activeRole = "guest";
  localStorage.setItem("leerpret.loggedOut", "true");
  localStorage.setItem("api_key", "");
  localStorage.setItem("leerpret.apiKey", "");
  localStorage.setItem("active_role", "guest");
  localStorage.setItem("leerpret.poc.role", "guest");
}

export function authHeaders(extra = {}) {
  const headers = { ...extra };
  if (state.organization) headers["X-Organization"] = state.organization;
  if (state.apiKey) headers["X-API-Key"] = state.apiKey;
  headers["X-Leerpret-Role"] = localStorage.getItem("active_role") || localStorage.getItem("leerpret.poc.role") || state.activeRole || "guest";
  return headers;
}

let sdkClientPromise;

async function sdkClient() {
  if (!sdkClientPromise) {
    sdkClientPromise = (async () => {
      await new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = `${state.apiBase}/sdk/sdk-loader/loader.js`;
        script.onload = resolve;
        script.onerror = () => reject(new Error("LeerpretSDK-loader kon niet worden geladen."));
        document.head.appendChild(script);
      });
      await window.LeerpretSDK.Loader.create({ base: state.apiBase }).load("api-client");
      return window.LeerpretSDK.create({
        apiBase: state.apiBase,
        clientId: "dashboard",
        loginUrl: "/login",
      });
    })();
  }
  return sdkClientPromise;
}

async function sdkRequest(path, options = {}) {
  const client = await sdkClient();
  return client.request(path, {
    cache: "no-store",
    ...options,
    headers: authHeaders(options.headers || {}),
  });
}

export async function apiGet(path) {
  const response = await sdkRequest(path);
  if (!response.ok) throw await apiError(response);
  return response.json();
}

export async function apiPost(path, body, extraHeaders = {}) {
  const payload = path === "/engine/evaluate" ? withEngineRefinements(body) : body;
  const response = await sdkRequest(path, {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json", ...extraHeaders }),
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw await apiError(response);
  return response.json();
}

function withEngineRefinements(body) {
  const activeRole = localStorage.getItem("active_role") || localStorage.getItem("leerpret.poc.role") || "architect";
  if (activeRole !== "technologist" || !body || typeof body !== "object") return body;

  const enabled = localStorage.getItem("leerpret.engine.activityThresholdEnabled") !== "false";
  const thresholdValue = Number(localStorage.getItem("leerpret.engine.activityThreshold") || 0.15);
  const threshold = Number.isFinite(thresholdValue) ? Math.max(0.1, Math.min(0.2, thresholdValue)) : 0.15;
  const statement = body.STATEMENT || {};
  const action = statement.ACTION || {};
  const data = action.data && typeof action.data === "object" ? action.data : {};

  return {
    ...body,
    activity_threshold_enabled: enabled,
    activity_threshold: threshold,
    STATEMENT: {
      ...statement,
      ACTION: {
        ...action,
        data: {
          ...data,
          activity_threshold_enabled: enabled,
          activity_threshold: threshold,
        },
      },
    },
  };
}

export async function apiPut(path, body) {
  const response = await sdkRequest(path, {
    method: "PUT",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(body),
  });
  if (!response.ok) throw await apiError(response);
  return response.json();
}

async function apiError(response) {
  let detail = "";
  try {
    const payload = await response.json();
    detail = typeof payload.detail === "string" ? payload.detail : payload.detail?.message || JSON.stringify(payload.detail || payload);
  } catch (error) {
    detail = await response.text().catch(() => "");
  }
  const apiError = new Error(detail || `${response.status} ${response.statusText}`);
  apiError.status = response.status;
  return apiError;
}

export function apiRootUrl() {
  return state.apiBase.replace(/\/api\/?$/, "");
}

export async function checkHealth() {
  try {
    const health = await apiGet("/health");
    state.online = health.status === "ok";
    state.authorized = false;
    return { online: true, message: `Service verbonden: ${health.service}` };
  } catch (error) {
    state.online = false;
    state.authorized = false;
    return { online: false, message: genericFallback.message };
  }
}

export async function establishSession() {
  if (localStorage.getItem("leerpret.loggedOut") === "true") {
    state.authorized = false;
    return { authorized: false, error: "Niet ingelogd." };
  }
  try {
    const client = await sdkClient();
    try {
      const getSession = await client.request("/auth/session", { method: "GET" });
      if (getSession && getSession.authenticated) {
        state.authorized = true;
        if (getSession.user) {
          localStorage.setItem("leerpret.user", JSON.stringify(getSession.user));
        }
        if (Array.isArray(getSession.roles) && getSession.roles.length > 0) {
          const mainRole = getSession.roles.includes("architect") ? "architect" : getSession.roles[0];
          localStorage.setItem("active_role", mainRole);
          localStorage.setItem("leerpret.poc.role", mainRole);
        }
        return { authorized: true, label: getSession.user?.label || "Google-gebruiker", roles: getSession.roles };
      }
    } catch {
      // Fall back to org API key if GET session returns 401
    }

    if (!state.apiKey) {
      state.authorized = false;
      return { authorized: false, error: "Niet ingelogd." };
    }

    const response = await apiPost("/auth/session", {
      organization: state.organization,
      api_key: state.apiKey,
    });
    state.authorized = true;
    return { authorized: true, label: response.organization?.label || state.organization };
  } catch (error) {
    state.authorized = false;
    return { authorized: false, error: "Service bereikbaar, maar deze organisatie of sleutel staat niet op de whitelist." };
  }
}

export async function clearServerSession() {
  try {
    const client = await sdkClient();
    await client.request("/auth/logout", {
      method: "POST",
      headers: authHeaders(),
    });
  } catch (error) {
    // Local logout still wins if the service is unavailable.
  }
}

export function safeJsonParse(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch (error) {
    return fallback;
  }
}

export function cssEscape(value) {
  const text = String(value);
  if (typeof window !== "undefined" && window.CSS?.escape) {
    return window.CSS.escape(text);
  }
  return text.replace(/[^a-zA-Z0-9_-]/g, (char) => `\\${char}`);
}

export function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function renderMath(root = document.body) {
  if (typeof window === "undefined" || !window.MathJax?.typesetPromise) return;
  try {
    if (root && window.MathJax.typesetClear) {
      window.MathJax.typesetClear([root]);
    }
    await window.MathJax.typesetPromise(root ? [root] : undefined);
  } catch (error) {
    console.warn("MathJax render failed", error);
  }
}

export function shortArticleTitle(value) {
  return String(value)
    .replace("Leerpret ", "")
    .replace("Definitie en constructlaag", "Definitie")
    .replace("Activatie en meetbare actie", "Activatie")
    .replace("Archetypische richting", "Type")
    .replace("Formule en scoring", "Formule")
    .replace("Meting zonder verstoring", "Meting")
    .replace("Leerbox als meetbaar vat", "Leerbox")
    .replace("Simulatie en validatie", "Simulatie");
}

export function formatBytes(value) {
  const bytes = Number(value || 0);
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${bytes} B`;
}

export function shortCommit(value) {
  if (!value) return "-";
  const text = String(value);
  return text === "unknown" ? text : text.slice(0, 8);
}
