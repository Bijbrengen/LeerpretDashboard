# LeerpretDashboard AI-werkkaart

Lees dit bestand voordat je wijzigingen maakt.

## Verantwoordelijkheid

Deze repository bevat uitsluitend de zelfstandige, statische Dashboard-webapp van
Leerpret. De app presenteert projectinformatie en API-data, kiest rolweergaven en
opent andere zelfstandige webapps. Domeinlogica en persistente data horen hier niet.

## Verbindingen

- `LEERPRET_API_URL`: LeerpretEngine, de enige backend/API en communicator.
- `LEERBOX_EDITOR_URL`: zelfstandige LeerboxEditor, geopend in een iframe.
- `LEARNGAME_OM_URL`: zelfstandige LEARNGame Operations Management-webapp.
- `LEERPRET_DASHBOARD_URL`: het publieke adres van deze app.

Alle locaties staan in `.env`; browsercode leest de gegenereerde
`public/runtime-config.js`. Voeg geen vaste localhost-poorten of productie-URL's aan
componenten toe.

## Belangrijke paden

- `src/`: Astro-pagina's, componenten en clientcode.
- `public/`: statische assets en gegenereerde runtimeconfiguratie.
- `tests/`: bron- en routeringstests.
- `dist/`: gegenereerde build; niet als bron aanpassen of committen.
- `scripts/`: configuratie en vaste-poort-startscripts.

## Grenzen

- API-verkeer loopt via de publieke API van LeerpretEngine.
- Importeer nooit interne Python-code of opslag uit LeerpretEngine.
- Kopieer geen documenten of onderzoeksdata uit Leerpret; haal publiceerbare data
  via de API op.
- Editor en games worden via hun publieke URL gekoppeld, niet via hun bronmappen.
- Commit of push nooit zonder expliciete toestemming van de gebruiker.

## Verificatie

```powershell
npm install
npm test
npm run build
npm run restart
```

De lokale Dashboard-URL is standaard `http://127.0.0.1:47112/`.
