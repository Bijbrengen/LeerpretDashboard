from __future__ import annotations

import os
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

api_url = setting("LEERPRET_API_URL", defaults, local) or "http://127.0.0.1:47111/api"
dashboard_url = setting("LEERPRET_DASHBOARD_URL", defaults, local) or "http://127.0.0.1:47112/"
editor_url = setting("LEERBOX_EDITOR_URL", defaults, local) or "http://127.0.0.1:47114/"
learngame_om_url = setting("LEARNGAME_OM_URL", defaults, local) or "http://127.0.0.1:47113/"
phile_url = setting("PHILE_URL", defaults, local) or "http://127.0.0.1:47115/"
tunnel_url = os.getenv("LEERPRET_TUNNEL_URL") or "https://intent-carries-travelers-media.trycloudflare.com/api"

payload = f"""(function() {{
  var isLocal = typeof window !== "undefined" && (
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname === "localhost"
  );
  var tunnelUrl = "{tunnel_url}";

  window.LEERPRET_CONFIG = Object.freeze({{
    "apiBase": isLocal ? "{api_url}" : tunnelUrl,
    "dashboardUrl": isLocal ? "{dashboard_url}" : "https://bijbrengen.github.io/LeerpretDashboard/",
    "editorUrl": isLocal ? "{editor_url}" : "https://bijbrengen.github.io/LeerboxEditor/",
    "learngameOmUrl": isLocal ? "{learngame_om_url}" : "https://bijbrengen.github.io/Learngame-Operations-Management/",
    "phileUrl": isLocal ? "{phile_url}" : "https://bijbrengen.github.io/Phile/"
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
