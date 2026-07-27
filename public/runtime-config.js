(function() {
  var isLocal = typeof window !== "undefined" && (
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname === "localhost"
  );
  var tunnelUrl = "https://slimy-masks-glow.loca.lt/api";
  
  window.LEERPRET_CONFIG = Object.freeze({
    "apiBase": isLocal ? "http://127.0.0.1:47111/api" : tunnelUrl,
    "dashboardUrl": isLocal ? "http://127.0.0.1:47112/" : "https://bijbrengen.github.io/LeerpretDashboard/",
    "editorUrl": "http://127.0.0.1:47114/",
    "learngameOmUrl": "http://127.0.0.1:47113/"
  });
})();
