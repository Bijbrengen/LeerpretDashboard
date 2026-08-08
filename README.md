# LeerpretDashboard

LeerpretDashboard is de zelfstandige, statische gebruikersinterface van het
Leerpret-ecosysteem. De repository bevat de Astro-broncode, statische assets,
routering en presentatielogica. Het Dashboard is geen backend en bevat geen
domeinopslag.

## Plaats in het ecosysteem

| Repository | Verantwoordelijkheid | Lokale URL |
|---|---|---|
| `Leerpret` | SNN VIA-projectinformatie, documenten, onderzoek, administratie en publicatiebronnen | geen applicatieservice |
| `LeerpretEngine` | Backend/API, domeinlogica, opslag en communicatie tussen de apps | `http://127.0.0.1:47111/api` |
| `LeerpretDashboard` | Deze statische cockpit en de rolweergaven | `http://127.0.0.1:47112/` |
| `Learngame Operations Management` | Zelfstandige LEARNGame-webapp | `http://127.0.0.1:47113/` |
| `LeerboxEditor` | Zelfstandige statische Leerbox-editor | `http://127.0.0.1:47114/` |

De browser laadt het Dashboard rechtstreeks. Het Dashboard communiceert voor
dynamische data uitsluitend met de publieke API van LeerpretEngine. De Editor en
LEARNGame worden via hun eigen publieke URL geopend; de Editor kan in een iframe
worden getoond. LeerpretEngine is dus de communicator, niet de HTML-host van deze
app.

## Configuratie

Kopieer `.env.example` naar `.env` en pas bij migratie alleen de waarden daar aan.
`scripts/generate_runtime_config.py` vertaalt de relevante waarden naar
`public/runtime-config.js`. Lokale adressen komen uit `LEERPRET_API_URL` en de
overige lokale URL-variabelen; de gepubliceerde versie gebruikt afzonderlijke
`*_PRODUCTION_*`-waarden. Daardoor kan een lokale generatie nooit ongemerkt een
localhostadres of tijdelijke tunnel naar GitHub Pages publiceren.

De belangrijkste instelling is:

```dotenv
LEERPRET_DASHBOARD_URL=http://127.0.0.1:47112/
```

De start- en herstartscripts wijken nooit uit naar een andere poort. `npm run
start` stopt bij een bezette poort; `npm run restart` beëindigt eerst het proces op
de ingestelde Dashboard-poort.

## Installeren, testen en starten

```powershell
cd D:\repos\LeerpretDashboard
npm install
npm test
npm run build
npm run restart
```

Open daarna `http://127.0.0.1:47112/`.

Voor Astro-ontwikkeling is `npm run dev` beschikbaar. De definitieve lokale
controle hoort via `npm run build` en de statische server te gebeuren, omdat dat
overeenkomt met de manier waarop deze pure view wordt gepubliceerd.

## Bronstructuur

- `src/pages/`: pagina-ingangen en rolroutes.
- `src/components/`: herbruikbare Dashboard-onderdelen.
- `src/layouts/`: gedeelde pagina-opmaak.
- `src/scripts/`: browsergedrag en API-integratie.
- `public/`: direct gepubliceerde assets.
- `tests/`: snelle contracttests op routering, symbolen en datastructuur.
- `scripts/`: runtimeconfiguratie en vaste-poort-server.
- `dist/`: gegenereerde, genegeerde productiebuild.

## Ontwerpregels

- Geen API-sleutels of backendlogica in deze repository.
- Geen rechtstreekse imports uit andere repositories.
- Geen harde poorten of URL's in Astro-, JavaScript- of CSS-bronnen; gebruik `.env`
  en `window.LEERPRET_CONFIG`.
- Publiceerbare documenten en projectadministratie blijven in `Leerpret`.
- Dynamische gegevens, opslag en acties lopen via `LeerpretEngine`.
- De Editor en games blijven zelfstandig deploybaar.

## Git

De remote is `https://github.com/Bijbrengen/LeerpretDashboard.git`. Wijzigingen
worden niet automatisch gecommit of gepusht; dat gebeurt alleen na expliciete
toestemming.
