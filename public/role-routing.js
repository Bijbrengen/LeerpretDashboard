(function () {
  "use strict";

  const PUBLIC_ROLE = "guest";
  const ROLE_ALIASES = { lerende: "learner", gebruiker: "user", gast: "guest" };
  const ROUTES_BY_ROLE = {
    architect: ["/", "/park", "/article", "/learningbox", "/editor", "/preview", "/data", "/service", "/help", "/settings"],
    technologist: ["/", "/park", "/article", "/learningbox", "/editor", "/preview", "/engine", "/data", "/service", "/help", "/settings"],
    user: ["/", "/park", "/article", "/learningbox", "/preview", "/service", "/help", "/settings"],
    learner: ["/", "/park", "/article", "/learningbox", "/preview", "/service", "/help", "/settings"],
    guest: ["/", "/park", "/article", "/learningbox", "/preview", "/service", "/help"],
  };
  const PUBLIC_ROUTES = new Set(["/login", "/privacy", "/404", "/404.html"]);

  function getBasePath() {
    if (typeof window === "undefined") return "";
    const pathname = window.location.pathname || "";
    if (pathname.startsWith("/LeerpretDashboard")) {
      return "/LeerpretDashboard";
    }
    return "";
  }

  function normalizeRole(value) {
    const role = ROLE_ALIASES[String(value || "").toLowerCase()] || String(value || "").toLowerCase();
    return Object.hasOwn(ROUTES_BY_ROLE, role) ? role : PUBLIC_ROLE;
  }

  function normalizePath(value) {
    let path = String(value || "/").split("?", 1)[0].replace(/\/+$/, "") || "/";
    const base = getBasePath();
    if (base && path.startsWith(base)) {
      path = path.slice(base.length) || "/";
    }
    if (path.endsWith("/index.html")) path = path.slice(0, -"/index.html".length) || "/";
    if (path === "/index.html") path = "/";
    return path;
  }

  function isLoggedOut() {
    const storedKey = localStorage.getItem("api_key") || localStorage.getItem("leerpret.apiKey") || "";
    return localStorage.getItem("leerpret.loggedOut") === "true" || !storedKey;
  }

  function activeRole() {
    const parameters = new URLSearchParams(window.location.search);
    const requested = parameters.get("role") || localStorage.getItem("active_role") || localStorage.getItem("leerpret.poc.role") || "architect";
    return isLoggedOut() ? PUBLIC_ROLE : normalizeRole(requested);
  }

  function routeAllowed(path, role) {
    const normalizedPath = normalizePath(path);
    if (PUBLIC_ROUTES.has(normalizedPath)) return true;
    return (ROUTES_BY_ROLE[normalizeRole(role)] || []).includes(normalizedPath);
  }

  function homeForRole(role) {
    const base = getBasePath();
    return `${base}/?role=${encodeURIComponent(normalizeRole(role))}`;
  }

  function routeForRole(path, role) {
    const normalizedRole = normalizeRole(role);
    const normalizedPath = normalizePath(path);
    const base = getBasePath();
    const relativeTarget = normalizedPath === "/" ? "/" : normalizedPath;
    if (!routeAllowed(normalizedPath, normalizedRole)) return homeForRole(normalizedRole);
    return `${base}${relativeTarget}?role=${encodeURIComponent(normalizedRole)}`;
  }

  function enforce() {
    const role = activeRole();
    localStorage.setItem("active_role", role);
    localStorage.setItem("leerpret.poc.role", role);
    if (!routeAllowed(window.location.pathname, role)) {
      window.location.replace(homeForRole(role));
      return false;
    }
    return true;
  }

  window.LeerpretRoleRouting = {
    PUBLIC_ROLE,
    activeRole,
    enforce,
    homeForRole,
    normalizePath,
    normalizeRole,
    routeAllowed,
    routeForRole,
  };

  enforce();
})();
