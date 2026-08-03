(function() {
  var isLocal = typeof window !== "undefined" && (
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname === "localhost"
  );
  var tunnelUrl = "https://intent-carries-travelers-media.trycloudflare.com/api";

  window.LEERPRET_CONFIG = Object.freeze({
    "apiBase": isLocal ? "http://127.0.0.1:47111/api" : tunnelUrl,
    "dashboardUrl": isLocal ? "http://127.0.0.1:47112/" : "https://bijbrengen.github.io/LeerpretDashboard/",
    "editorUrl": isLocal ? "http://127.0.0.1:47114/" : "https://bijbrengen.github.io/LeerboxEditor/",
    "learngameOmUrl": isLocal ? "http://127.0.0.1:47113/" : "https://bijbrengen.github.io/Learngame-Operations-Management/",
    "phileUrl": isLocal ? "http://127.0.0.1:47115/" : "https://bijbrengen.github.io/Phile/"
  });
})();
