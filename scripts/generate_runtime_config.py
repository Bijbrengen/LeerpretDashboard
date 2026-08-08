from __future__ import annotations

import os
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def dotenv(path: Path) -> dict[str, str]:
    values: dict[str, str] = {}
    if not path.is_file():
        return values
    for raw_line in path.read_text(encoding="utf-8-sig").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        values[key.strip()] = value.strip().strip('"').strip("'")
    return values


def setting(name: str, defaults: dict[str, str], local: dict[str, str]) -> str:
    return os.getenv(name) or local.get(name) or defaults.get(name) or ""


defaults = dotenv(ROOT / ".env.example")
local = dotenv(ROOT / ".env")

config = {
    "localApiBase": setting("LEERPRET_API_URL", defaults, local),
    "localDashboardUrl": setting("LEERPRET_DASHBOARD_URL", defaults, local),
    "localEditorUrl": setting("LEERBOX_EDITOR_URL", defaults, local),
    "localLearngameOmUrl": setting("LEARNGAME_OM_URL", defaults, local),
    "localPhileUrl": setting("PHILE_URL", defaults, local),
    "productionApiBase": setting("LEERPRET_PRODUCTION_API_URL", defaults, local),
    "productionDashboardUrl": setting("LEERPRET_PRODUCTION_DASHBOARD_URL", defaults, local),
    "productionEditorUrl": setting("LEERBOX_EDITOR_PRODUCTION_URL", defaults, local),
    "productionLearngameOmUrl": setting("LEARNGAME_OM_PRODUCTION_URL", defaults, local),
    "productionPhileUrl": setting("PHILE_PRODUCTION_URL", defaults, local),
}
serialized = json.dumps(config, ensure_ascii=False, indent=2).replace("\n", "\n  ")

payload = f"""(function() {{
  var endpoints = Object.freeze({serialized});
  var isLocal = typeof window !== "undefined" && (
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname === "localhost"
  );
  window.LEERPRET_CONFIG = Object.freeze({{
    apiBase: isLocal ? endpoints.localApiBase : endpoints.productionApiBase,
    dashboardUrl: isLocal ? endpoints.localDashboardUrl : endpoints.productionDashboardUrl,
    editorUrl: isLocal ? endpoints.localEditorUrl : endpoints.productionEditorUrl,
    learngameOmUrl: isLocal ? endpoints.localLearngameOmUrl : endpoints.productionLearngameOmUrl,
    phileUrl: isLocal ? endpoints.localPhileUrl : endpoints.productionPhileUrl
  }});
}})();
"""

targets = [
    ROOT / "public" / "runtime-config.js",
    ROOT / "dist" / "runtime-config.js",
]
for target in targets:
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(payload, encoding="utf-8")
    print(f"Runtimeconfiguratie geschreven: {target}")
