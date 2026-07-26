/*
 * Zinnenlijst op Nederlandse brontekst.
 *
 * Veel chrome-teksten worden pas door JavaScript gezet (actieve rol, verbindings-
 * status, de tellers in de statusbalk) of komen uit de frontmatter van een pagina.
 * Die zijn niet met een data-i18n-attribuut te markeren. Deze lijst vertaalt zulke
 * teksten op hun Nederlandse brontekst, binnen de chrome-containers uit i18n.js.
 *
 * Productnamen (Leerpret, Leerbox, Leerpretpark, Leerpretarchitect,
 * Leerprettechnoloog) blijven onvertaald en staan hier dus niet in.
 */

export const phrases = {
  // Instellingenpaneel
  "Toegang": { en: "Access", es: "Acceso", de: "Zugang" },
  "Privacy & data": { en: "Privacy & data", es: "Privacidad y datos", de: "Datenschutz & Daten" },
  "Engine-verfijningen": { en: "Engine refinements", es: "Ajustes finos del motor", de: "Engine-Verfeinerungen" },
  "Activiteitsdrempel toepassen": { en: "Apply activity threshold", es: "Aplicar el umbral de actividad", de: "Aktivitätsschwelle anwenden" },
  "(activiteitsdrempel)": { en: "(activity threshold)", es: "(umbral de actividad)", de: "(Aktivitätsschwelle)" },
  "Login": { en: "Log in", es: "Iniciar sesión", de: "Anmelden" },
  "Logout": { en: "Log out", es: "Cerrar sesión", de: "Abmelden" },
  "Service": { en: "Service", es: "Servicio", de: "Service" },
  "Taal": { en: "Language", es: "Idioma", de: "Sprache" },

  // Paginatitels
  "Home": { en: "Home", es: "Inicio", de: "Start" },
  "Artikel": { en: "Article", es: "Artículo", de: "Artikel" },
  "Data": { en: "Data", es: "Datos", de: "Daten" },
  "Editor": { en: "Editor", es: "Editor", de: "Editor" },
  "Engine": { en: "Engine", es: "Motor", de: "Engine" },
  "HELP": { en: "HELP", es: "AYUDA", de: "HILFE" },
  "Inloggen": { en: "Log in", es: "Iniciar sesión", de: "Anmelden" },
  "Preview": { en: "Preview", es: "Vista previa", de: "Vorschau" },
  "Instellingen": { en: "Settings", es: "Ajustes", de: "Einstellungen" },

  // Paginabeschrijvingen
  "Verken de onderdelen en kies vanuit het overzicht waar je verder wilt werken.": {
    en: "Explore the sections and choose from the overview where you want to continue.",
    es: "Explora las secciones y elige desde el resumen dónde quieres continuar.",
    de: "Erkunde die Bereiche und wähle aus der Übersicht, wo du weiterarbeiten willst." },
  "Bekijk de leerboxen als attracties en open er een om de leerervaring te onderzoeken.": {
    en: "View the Leerboxen as attractions and open one to examine the learning experience.",
    es: "Mira las Leerboxen como atracciones y abre una para examinar la experiencia de aprendizaje.",
    de: "Betrachte die Leerboxen als Attraktionen und öffne eine, um die Lernerfahrung zu untersuchen." },
  "Bekijk de publicatiestatus, lees artikelen en voer beoordelingen uit vanuit je rol.": {
    en: "Check the publication status, read articles and carry out reviews from your role.",
    es: "Consulta el estado de publicación, lee artículos y realiza valoraciones desde tu rol.",
    de: "Sieh den Publikationsstatus, lies Artikel und führe Bewertungen aus deiner Rolle aus." },
  "Kies een leerbox om relaties te bekijken, te simuleren of in de editor te openen.": {
    en: "Choose a Leerbox to view relations, run simulations or open it in the editor.",
    es: "Elige una Leerbox para ver relaciones, simular o abrirla en el editor.",
    de: "Wähle eine Leerbox, um Beziehungen zu sehen, zu simulieren oder sie im Editor zu öffnen." },
  "Ontwerp een leerbox, importeer bronnen en werk met de AI-assistent aan de inhoud.": {
    en: "Design a Leerbox, import sources and work on the content with the AI assistant.",
    es: "Diseña una Leerbox, importa fuentes y trabaja el contenido con el asistente de IA.",
    de: "Entwirf eine Leerbox, importiere Quellen und arbeite mit dem KI-Assistenten am Inhalt." },
  "Test de gekozen leerbox zoals een lerende die ziet en controleer de interacties.": {
    en: "Test the chosen Leerbox as a learner sees it and check the interactions.",
    es: "Prueba la Leerbox elegida tal como la ve un aprendiz y comprueba las interacciones.",
    de: "Teste die gewählte Leerbox so, wie eine lernende Person sie sieht, und prüfe die Interaktionen." },
  "Bereken leerpret, bekijk de formule en test de technische engineblokken.": {
    en: "Calculate Leerpret, inspect the formula and test the technical engine blocks.",
    es: "Calcula el Leerpret, consulta la fórmula y prueba los bloques técnicos del motor.",
    de: "Berechne Leerpret, sieh dir die Formel an und teste die technischen Engine-Blöcke." },
  "Onderzoek bron-, test- en rapportdata en controleer hoe de gegevens samenhangen.": {
    en: "Examine source, test and report data and check how the data connects.",
    es: "Examina los datos de origen, de prueba y de informe y comprueba cómo se relacionan.",
    de: "Untersuche Quell-, Test- und Berichtsdaten und prüfe, wie die Daten zusammenhängen." },
  "Beheer servicefuncties, test API-verzoeken en voer leerboxsimulaties uit.": {
    en: "Manage service functions, test API requests and run Leerbox simulations.",
    es: "Gestiona las funciones de servicio, prueba peticiones API y ejecuta simulaciones de Leerbox.",
    de: "Verwalte Servicefunktionen, teste API-Anfragen und führe Leerbox-Simulationen aus." },
  "Lees uitleg over de begrippen en vind ondersteuning per dashboardonderdeel.": {
    en: "Read explanations of the concepts and find support for each dashboard section.",
    es: "Lee explicaciones de los conceptos y encuentra ayuda por sección del panel.",
    de: "Lies Erklärungen zu den Begriffen und finde Unterstützung je Dashboard-Bereich." },
  "Meld je veilig aan om persoonlijke rollen en beveiligde functies te gebruiken.": {
    en: "Sign in securely to use personal roles and protected functions.",
    es: "Inicia sesión de forma segura para usar roles personales y funciones protegidas.",
    de: "Melde dich sicher an, um persönliche Rollen und geschützte Funktionen zu nutzen." },
  "Zo verwerkt de Leerpret-engine actiereeksen volgens privacy by design.": {
    en: "This is how the Leerpret engine processes action sequences by privacy by design.",
    es: "Así procesa el motor Leerpret las secuencias de acciones según privacy by design.",
    de: "So verarbeitet die Leerpret-Engine Aktionsfolgen nach Privacy by Design." },
  "Stel de serviceverbinding en toegangsrechten voor rollen en informatie in.": {
    en: "Configure the service connection and the access rights for roles and information.",
    es: "Configura la conexión de servicio y los permisos de acceso para roles e información.",
    de: "Stelle die Serviceverbindung und die Zugriffsrechte für Rollen und Informationen ein." },

  // Statusbalk
  "Actieve pagina": { en: "Active page", es: "Página activa", de: "Aktive Seite" },
  "Actieve rol": { en: "Active role", es: "Rol activo", de: "Aktive Rolle" },
  "Verbinding maken...": { en: "Connecting...", es: "Conectando...", de: "Verbindung wird hergestellt..." },
  "Ingelogd": { en: "Signed in", es: "Sesión iniciada", de: "Angemeldet" },
  "Niet ingelogd": { en: "Not signed in", es: "Sesión no iniciada", de: "Nicht angemeldet" },

  // Rollen
  "Leerattractie": { en: "Learning attraction", es: "Atracción de aprendizaje", de: "Lernattraktion" },
  "Lerende": { en: "Learner", es: "Aprendiz", de: "Lernende" },
  "Gast": { en: "Guest", es: "Invitado", de: "Gast" },

  // Tellers in de statusbalk
  "Leerpretparken": { en: "Leerpret parks", es: "Parques Leerpret", de: "Leerpret-Parks" },
  "Leerattracties": { en: "Learning attractions", es: "Atracciones de aprendizaje", de: "Lernattraktionen" },
  "Leerboxen": { en: "Leerboxen", es: "Leerboxen", de: "Leerboxen" },
  "Leerobjecten": { en: "Learning objects", es: "Objetos de aprendizaje", de: "Lernobjekte" },
  "Leerobjecttypen": { en: "Learning object types", es: "Tipos de objeto de aprendizaje", de: "Lernobjekttypen" },
  "Routes": { en: "Routes", es: "Rutas", de: "Routen" },
  "Bronnen": { en: "Sources", es: "Fuentes", de: "Quellen" },
  "Onderdelen": { en: "Sections", es: "Secciones", de: "Bereiche" },
  "Rollen": { en: "Roles", es: "Roles", de: "Rollen" },
  "Pagina's": { en: "Pages", es: "Páginas", de: "Seiten" },
  "Artikelen": { en: "Articles", es: "Artículos", de: "Artikel" },
  "Gepubliceerd": { en: "Published", es: "Publicados", de: "Veröffentlicht" },
  "Open": { en: "Open", es: "Abiertos", de: "Offen" },
  "Onderwerpen": { en: "Topics", es: "Temas", de: "Themen" },
  "Afbeeldingen": { en: "Images", es: "Imágenes", de: "Bilder" },
  "Groepen": { en: "Groups", es: "Grupos", de: "Gruppen" },
  "JSON-bestanden": { en: "JSON files", es: "Archivos JSON", de: "JSON-Dateien" },
  "Datasetgroepen": { en: "Dataset groups", es: "Grupos de conjuntos de datos", de: "Datensatzgruppen" },
  "Codefragmenten": { en: "Code fragments", es: "Fragmentos de código", de: "Codefragmente" },
  "Gedragsmarkers": { en: "Behaviour markers", es: "Marcadores de conducta", de: "Verhaltensmarker" },
  "Archetypen": { en: "Archetypes", es: "Arquetipos", de: "Archetypen" }
};
