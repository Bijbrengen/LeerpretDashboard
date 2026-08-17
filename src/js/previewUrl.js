const STANDALONE_PREVIEW_CONFIG = Object.freeze({
  phile: "phileUrl",
  "learngame-operations-management": "learngameOmUrl",
});

export function previewUrlForTwin(twin, options = {}) {
  const apiRoot = String(options.apiRoot || "").replace(/\/+$/, "");
  const apiBase = String(options.apiBase || "").replace(/\/+$/, "");
  const role = String(options.role || "guest");
  const generated = options.generatedPreview;
  const slug = String(twin?.id || "").replace(/^leerbox-/, "");
  let url;

  if (generated?.preview_url) {
    url = new URL(generated.preview_url, `${apiRoot}/`);
  } else {
    const configKey = STANDALONE_PREVIEW_CONFIG[slug];
    const configuredUrl = configKey ? options.config?.[configKey] : "";
    if (configuredUrl) {
      url = new URL(configuredUrl);
      if (apiBase) url.searchParams.set("api", apiBase);
    } else {
      url = new URL(`${apiRoot}/tools/leerbox/${encodeURIComponent(slug)}/`);
    }
  }

  url.searchParams.set("role", role);
  return url;
}
