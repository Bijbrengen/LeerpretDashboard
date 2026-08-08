(function() {
  var endpoints = Object.freeze({
    "localApiBase": "http://127.0.0.1:47111/api",
    "localDashboardUrl": "http://127.0.0.1:47112/",
    "localEditorUrl": "http://127.0.0.1:47114/",
    "localLearngameOmUrl": "http://127.0.0.1:47113/",
    "localPhileUrl": "http://127.0.0.1:47115/",
    "productionApiBase": "https://api.leerpretpark.nl/api",
    "productionDashboardUrl": "https://bijbrengen.github.io/LeerpretDashboard/",
    "productionEditorUrl": "https://bijbrengen.github.io/LeerboxEditor/",
    "productionLearngameOmUrl": "https://bijbrengen.github.io/Learngame-Operations-Management/",
    "productionPhileUrl": "https://bijbrengen.github.io/Phile/"
  });
  var isLocal = typeof window !== "undefined" && (
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname === "localhost"
  );
  window.LEERPRET_CONFIG = Object.freeze({
    apiBase: isLocal ? endpoints.localApiBase : endpoints.productionApiBase,
    dashboardUrl: isLocal ? endpoints.localDashboardUrl : endpoints.productionDashboardUrl,
    editorUrl: isLocal ? endpoints.localEditorUrl : endpoints.productionEditorUrl,
    learngameOmUrl: isLocal ? endpoints.localLearngameOmUrl : endpoints.productionLearngameOmUrl,
    phileUrl: isLocal ? endpoints.localPhileUrl : endpoints.productionPhileUrl
  });
})();
