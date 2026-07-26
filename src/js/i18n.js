/*
 * Vertaallaag voor het Leerpret-dashboard.
 *
 * Werkwijze
 * ---------
 * 1. Markeer tekst in een .astro-bestand met een van deze attributen:
 *      data-i18n="nav.editor"                -> vervangt de tekstinhoud
 *      data-i18n-title="hud.control"         -> vervangt het title-attribuut
 *      data-i18n-aria-label="aria.settings"  -> vervangt aria-label
 *      data-i18n-placeholder="form.search"   -> vervangt placeholder
 *    De Nederlandse tekst blijft gewoon in de HTML staan; die is de bron.
 * 2. Zet dezelfde sleutel in catalogs/nl.js met de Nederlandse tekst.
 * 3. Vul dezelfde sleutel in catalogs/en.js, es.js en de.js.
 *
 * Een lege of ontbrekende vertaling valt automatisch terug op het Nederlands,
 * dus een halfvolle catalogus levert nooit lege schermen op.
 */

import { messages as nl } from './catalogs/nl.js';
import { messages as en } from './catalogs/en.js';
import { messages as es } from './catalogs/es.js';
import { messages as de } from './catalogs/de.js';
import { phrases } from './catalogs/phrases.js';

export const DEFAULT_LANGUAGE = 'nl';
export const LANGUAGE_STORAGE_KEY = 'leerpret.language';

export const LANGUAGES = [
  { code: 'nl', label: 'Nederlands' },
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'de', label: 'Deutsch' }
];

const catalogs = { nl, en, es, de };

export function currentLanguage() {
  const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  return catalogs[stored] ? stored : DEFAULT_LANGUAGE;
}

export function t(key, replacements = {}) {
  const active = catalogs[currentLanguage()] || {};
  const fallback = catalogs[DEFAULT_LANGUAGE] || {};
  const template = active[key] || fallback[key] || '';
  return Object.entries(replacements).reduce(
    (text, [name, value]) => text.replaceAll(`{${name}}`, value),
    template
  );
}

const ATTRIBUTE_TARGETS = [
  ['data-i18n-title', 'title'],
  ['data-i18n-aria-label', 'aria-label'],
  ['data-i18n-placeholder', 'placeholder']
];

/*
 * Containers waarin de zinnenlijst mag werken: alleen chrome, nooit de inhoud
 * van een leerbox. Zo blijft de vertaling beperkt tot de interface.
 */
const CHROME_CONTAINERS = [
  'header.app-titlebar',
  '.control-dock',
  '.editor-page-menu',
  '.workbench-tabs-bar'
];

/*
 * De Nederlandse brontekst per tekstknoop, onthouden bij de eerste vertaling.
 * Zonder dit geheugen zou een tweede taalwissel de brontekst niet meer vinden
 * (die is dan immers al vervangen) en zouden talen door elkaar gaan lopen.
 */
const originals = new WeakMap();

/** Vertaalt losse tekstknopen die op hun Nederlandse brontekst herkend worden. */
function applyPhrases(language) {
  CHROME_CONTAINERS.forEach((selector) => {
    document.querySelectorAll(selector).forEach((container) => {
      const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
      const pending = [];
      while (walker.nextNode()) pending.push(walker.currentNode);

      pending.forEach((node) => {
        const remembered = originals.get(node);
        const source = remembered ?? node.nodeValue;
        const key = source.trim();
        if (!phrases[key]) return;
        if (!remembered) originals.set(node, source);
        const translation = language === DEFAULT_LANGUAGE ? key : phrases[key][language];
        if (translation) node.nodeValue = source.replace(key, translation);
      });
    });
  });
}

/** Past de actieve taal toe op alle gemarkeerde elementen binnen root. */
export function applyTranslations(root = document) {
  const language = currentLanguage();
  if (root === document) document.documentElement.lang = language;

  root.querySelectorAll('[data-i18n]').forEach((element) => {
    const text = t(element.getAttribute('data-i18n'));
    if (text) element.textContent = text;
  });

  ATTRIBUTE_TARGETS.forEach(([source, target]) => {
    root.querySelectorAll(`[${source}]`).forEach((element) => {
      const text = t(element.getAttribute(source));
      if (text) element.setAttribute(target, text);
    });
  });

  applyPhrases(language);
}

/**
 * Slaat de taal op en vertaalt de interface.
 *
 * De inhoud van de leerboxen blijft bewust eentalig: de ingebedde editor en de
 * browserleerbox krijgen de taalkeuze niet doorgestuurd. Een leerbox is een
 * ontwerp in de taal van zijn maker, niet een te vertalen interface.
 */
export function setLanguage(language) {
  if (!catalogs[language]) return;
  localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  applyTranslations();
}
