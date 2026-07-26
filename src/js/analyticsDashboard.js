import Chart from 'chart.js/auto';
import { activeBlockRole, loadBlockAccess } from './pageBlocks.js';

const analyticsData = {
  phile: {
    title: 'Phile', score: 72, active: 184, unresolved: 7, best: ['Phile', 81],
    labels: ['Wk 1','Wk 2','Wk 3','Wk 4','Wk 5','Wk 6','Wk 7','Wk 8','Wk 9','Wk 10','Wk 11','Wk 12'],
    progress: [28,31,35,38,44,48,51,57,61,65,69,74], alpha: [.42,.44,.47,.46,.52,.55,.57,.61,.64,.66,.69,.73],
    resistance: [
      { name:'Kaartkeuze', friction:34, delay:22, learners:48 }, { name:'Rasterroute', friction:27, delay:31, learners:39 },
      { name:'Tegenargument', friction:23, delay:18, learners:32 }, { name:'Synapskeuze', friction:17, delay:14, learners:25 },
      { name:'Reflectiestap', friction:11, delay:9, learners:18 },
    ],
    funnel: [['Gestart',184],['Actief verkend',158],['Weerstand gepasseerd',126],['Succes bereikt',99],['Herhaling gestart',71]],
  },
  elektro: {
    title:'Elektro-Exploratiebox', score:68, active:146, unresolved:9, best:['Phile',81],
    labels:['Wk 1','Wk 2','Wk 3','Wk 4','Wk 5','Wk 6','Wk 7','Wk 8','Wk 9','Wk 10','Wk 11','Wk 12'],
    progress:[22,29,34,39,43,45,49,54,58,60,63,67], alpha:[.39,.43,.46,.48,.50,.49,.53,.56,.58,.59,.61,.65],
    resistance:[{name:'Stroomkring',friction:39,delay:35,learners:51},{name:'Componentkeuze',friction:31,delay:26,learners:44},{name:'Meetfout',friction:25,delay:29,learners:36},{name:'Schakeling',friction:19,delay:21,learners:29},{name:'Veiligheidscheck',friction:13,delay:12,learners:17}],
    funnel:[['Gestart',146],['Actief verkend',119],['Weerstand gepasseerd',88],['Succes bereikt',67],['Herhaling gestart',42]],
  },
  logica: {
    title:'Logica-Schakelbox', score:76, active:121, unresolved:4, best:['Logica-Schakelbox',84],
    labels:['Wk 1','Wk 2','Wk 3','Wk 4','Wk 5','Wk 6','Wk 7','Wk 8','Wk 9','Wk 10','Wk 11','Wk 12'],
    progress:[34,37,42,46,51,56,60,64,69,73,77,81], alpha:[.48,.50,.53,.55,.58,.61,.63,.66,.70,.72,.75,.79],
    resistance:[{name:'Waarheidstabel',friction:24,delay:19,learners:31},{name:'Poortcombinatie',friction:21,delay:23,learners:28},{name:'Foutdetectie',friction:16,delay:15,learners:22},{name:'Optimalisatie',friction:12,delay:11,learners:16},{name:'Eindcontrole',friction:8,delay:7,learners:11}],
    funnel:[['Gestart',121],['Actief verkend',109],['Weerstand gepasseerd',91],['Succes bereikt',78],['Herhaling gestart',61]],
  },
};

const cohortAdjustments = {
  all:{ label:'alle actieve lerenden', score:0, active:1, alpha:0, friction:1, funnel:1 },
  starter:{ label:'startende lerenden', score:-7, active:.46, alpha:-.08, friction:1.18, funnel:.76 },
  advanced:{ label:'gevorderde lerenden', score:8, active:.32, alpha:.07, friction:.78, funnel:.9 },
};

let developmentChart;
let resistanceChart;
let activeImpactMetric = 'friction';
let currentResistanceItems = [];

export async function initializeAnalyticsDashboard() {
  const leerbox = document.getElementById('analytics-leerbox');
  const cohort = document.getElementById('analytics-cohort');
  const period = document.getElementById('analytics-period');
  if (!leerbox || !cohort || !period) return;

  try {
    const policy = await loadBlockAccess(activeBlockRole(), 'data');
    const blocks = policy.pages?.data?.blocks;
    if (!blocks) {
      return;
    }
    applyBlockAccess(blocks);
  } catch (error) {
    showAccessError(error);
    return;
  }

  [leerbox, cohort, period].forEach((control) => control.addEventListener('change', renderDashboard));
  document.querySelectorAll('[data-analytics-view]').forEach((button) => button.addEventListener('click', () => selectView(button.dataset.analyticsView)));
  document.querySelectorAll('[data-impact-metric]').forEach((button) => button.addEventListener('click', () => {
    activeImpactMetric = button.dataset.impactMetric || 'friction';
    document.querySelectorAll('[data-impact-metric]').forEach((item) => { const active=item===button; item.classList.toggle('active',active); item.setAttribute('aria-pressed',String(active)); });
    renderResistanceChart(currentSelection());
  }));
  renderDashboard();
}

function applyBlockAccess(blocks) {
  const allowed = new Set(Object.keys(blocks));
  const blockByView = {
    development: 'analytics_development',
    resistance: 'analytics_resistance',
    flow: 'analytics_flow',
  };
  document.querySelector('.analytics-kpi-grid')?.toggleAttribute('hidden', !allowed.has('analytics_kpis'));
  document.querySelectorAll('[data-analytics-view]').forEach((button) => {
    button.hidden = !allowed.has(blockByView[button.dataset.analyticsView]);
  });
  document.querySelectorAll('[data-analytics-panel]').forEach((panel) => {
    panel.dataset.allowed = String(allowed.has(blockByView[panel.dataset.analyticsPanel]));
  });
  const firstAllowed = document.querySelector('[data-analytics-view]:not([hidden])');
  if (firstAllowed) selectView(firstAllowed.dataset.analyticsView);
}

function showAccessError(error) {
  const content = document.querySelector('.analytics-content');
  if (!content) return;
  content.innerHTML = `<section class="mobile-card"><span class="eyebrow">Analytics niet beschikbaar</span><h2>Toegangsrechten konden niet worden geladen</h2><p class="muted-text">Controleer de verbinding met de backend en probeer het opnieuw.</p></section>`;
  console.warn('Analytics block access could not be loaded.', error);
}

function currentSelection() {
  const box = analyticsData[document.getElementById('analytics-leerbox').value] || analyticsData.phile;
  const cohort = cohortAdjustments[document.getElementById('analytics-cohort').value] || cohortAdjustments.all;
  const weeks = Number(document.getElementById('analytics-period').value || 6);
  return { box, cohort, weeks };
}

function renderDashboard() {
  const selection = currentSelection();
  renderContext(selection);
  renderKpis(selection);
  renderDevelopmentChart(selection);
  renderFunnel(selection);
  if (document.querySelector('[data-analytics-panel="resistance"]')?.classList.contains('active')) renderResistanceChart(selection);
}

function renderContext({ box, cohort, weeks }) {
  document.getElementById('analytics-context').textContent = `${box.title} · ${cohort.label} · laatste ${weeks} weken`;
}

function renderKpis({ box, cohort }) {
  const score = clamp(Math.round(box.score + cohort.score), 0, 100);
  const active = Math.max(1, Math.round(box.active * cohort.active));
  document.getElementById('kpi-score').textContent = `${score}%`;
  document.getElementById('kpi-active').textContent = active.toLocaleString('nl-NL');
  document.getElementById('kpi-best').textContent = box.best[0];
  document.getElementById('kpi-best-score').textContent = `${box.best[1]}%`;
  document.getElementById('kpi-friction').textContent = Math.max(1, Math.round(box.unresolved * cohort.friction));
  document.getElementById('kpi-score-trend').textContent = `${score >= 72 ? '+' : ''}${(score - 67).toFixed(1).replace('.', ',')}%`;
  document.getElementById('kpi-active-trend').textContent = `+${Math.max(2, Math.round(active * .065))}`;
  document.getElementById('kpi-friction-trend').textContent = cohort.friction > 1 ? '+1' : '−2';
}

function renderDevelopmentChart({ box, cohort, weeks }) {
  const start = Math.max(0, box.labels.length - weeks);
  const labels = box.labels.slice(start);
  const progress = box.progress.slice(start).map((value) => clamp(value + cohort.score * .45, 0, 100));
  const alpha = box.alpha.slice(start).map((value) => clamp(value + cohort.alpha, 0, 1));
  const data = { labels, datasets:[
    { label:'Voortgang', data:progress, borderColor:'#008080', backgroundColor:'rgba(0,128,128,.12)', borderWidth:3, pointRadius:3, pointHoverRadius:6, tension:.32, fill:true, yAxisID:'y' },
    { label:'Alpha-waarde', data:alpha, borderColor:'#7c3aed', backgroundColor:'#7c3aed', borderWidth:2.5, pointRadius:3, pointHoverRadius:6, tension:.32, borderDash:[6,4], yAxisID:'yAlpha' },
  ]};
  if (developmentChart) { developmentChart.data=data; developmentChart.update(); }
  else developmentChart = new Chart(document.getElementById('analytics-development-chart'), { type:'line', data, options:lineOptions() });
  const delta = progress.at(-1) - progress[0];
  document.getElementById('development-insight').innerHTML = `<strong>${delta > 8 ? 'Stijgende leercurve' : delta > 3 ? 'Voorzichtige groei' : 'Risico op stagnatie'}</strong><span>${Math.round(delta)} procentpunt voortgang in de gekozen periode; alpha eindigt op ${alpha.at(-1).toFixed(2).replace('.', ',')}.</span>`;
}

function renderResistanceChart({ box, cohort }) {
  const metric = activeImpactMetric;
  currentResistanceItems = box.resistance;
  const values = box.resistance.map((item) => Math.round(item[metric] * cohort.friction));
  const color = metric === 'friction' ? '#d97706' : '#7c3aed';
  const data = { labels:box.resistance.map((item)=>item.name), datasets:[{ label:metric === 'friction' ? 'Frictie-index' : 'Extra leertijd (min)', data:values, backgroundColor:box.resistance.map((_,i)=>hexToRgba(color,1-i*.11)), borderRadius:6, borderSkipped:false }]};
  if (resistanceChart) { resistanceChart.data=data; resistanceChart.options.scales.x.title.text=metric === 'friction' ? 'Frictie-index' : 'Extra minuten'; resistanceChart.update(); }
  else resistanceChart = new Chart(document.getElementById('analytics-resistance-chart'), { type:'bar', data, options:resistanceOptions() });
  updateResistanceInsight(box.resistance[0], values[0], metric);
}

function renderFunnel({ box, cohort }) {
  const stages = box.funnel.map(([label,count],index) => [label, Math.max(1,Math.round(count*cohort.active*(index ? cohort.funnel : 1)))]);
  const start = stages[0][1];
  document.getElementById('analytics-funnel').innerHTML = stages.map(([label,count],index) => {
    const percentage=Math.round(count/start*100); const previous=index?stages[index-1][1]:count; const drop=index?Math.round((previous-count)/previous*100):0;
    return `<div class="funnel-stage"><div class="funnel-label"><strong>${label}</strong><small>${count.toLocaleString('nl-NL')} lerenden</small></div><div class="funnel-track"><div class="funnel-fill" style="width:${percentage}%">${percentage}%</div></div><span class="funnel-drop">${index?`−${drop}%`:'start'}</span></div>`;
  }).join('');
  const drops=stages.slice(1).map((stage,index)=>({label:stage[0],drop:(stages[index][1]-stage[1])/stages[index][1]})).sort((a,b)=>b.drop-a.drop);
  document.getElementById('funnel-insight').innerHTML=`<strong>Belangrijkste uitvalmoment</strong><span>Voor “${drops[0].label}” valt ${Math.round(drops[0].drop*100)}% af ten opzichte van de voorgaande fase.</span>`;
}

function selectView(view) {
  document.querySelectorAll('[data-analytics-view]').forEach((button)=>{const active=button.dataset.analyticsView===view;button.classList.toggle('active',active);button.setAttribute('aria-current',active?'page':'false');});
  document.querySelectorAll('[data-analytics-panel]').forEach((panel)=>{const active=panel.dataset.analyticsPanel===view;panel.classList.toggle('active',active);panel.hidden=!active;});
  requestAnimationFrame(()=>{if(view==='resistance')renderResistanceChart(currentSelection());if(view==='development')developmentChart?.resize();});
}

function lineOptions() { return { responsive:true, maintainAspectRatio:false, interaction:{mode:'index',intersect:false}, plugins:{legend:{display:false},tooltip:{callbacks:{label:(context)=>context.dataset.yAxisID==='yAlpha'?` Alpha: ${Number(context.raw).toFixed(2)}`:` Voortgang: ${Math.round(context.raw)}%`}}}, scales:{x:{grid:{display:false},ticks:{color:'#8faeb5'}},y:{min:0,max:100,title:{display:true,text:'Voortgang %',color:'#8faeb5'},ticks:{callback:(v)=>`${v}%`,color:'#8faeb5'},grid:{color:'rgba(83,125,135,.28)'}},yAlpha:{position:'right',min:0,max:1,title:{display:true,text:'Alpha',color:'#a991ff'},ticks:{color:'#a991ff',callback:(v)=>Number(v).toFixed(1)},grid:{display:false}}} }; }
function resistanceOptions() { return { indexAxis:'y', responsive:true, maintainAspectRatio:false, onClick:(_,elements)=>{if(!elements[0])return;const index=elements[0].index;updateResistanceInsight(currentResistanceItems[index],resistanceChart.data.datasets[0].data[index],activeImpactMetric);}, plugins:{legend:{display:false},tooltip:{callbacks:{afterLabel:(context)=>`${currentResistanceItems[context.dataIndex].learners} lerenden geraakt`}}},scales:{y:{grid:{display:false},ticks:{color:'#b8ced2',font:{weight:700}}},x:{beginAtZero:true,title:{display:true,text:activeImpactMetric==='friction'?'Frictie-index':'Extra minuten',color:'#8faeb5'},ticks:{color:'#8faeb5'},grid:{color:'rgba(83,125,135,.28)'}}} }; }
function updateResistanceInsight(item,value,metric){document.getElementById('resistance-insight').innerHTML=`<strong>${item.name}</strong><span>${metric==='friction'?`Frictie-index ${value}`:`Gemiddeld ${value} minuten extra leertijd`} · ${item.learners} lerenden geraakt.</span>`;}
function clamp(value,min,max){return Math.min(max,Math.max(min,value));}
function hexToRgba(hex,alpha){const value=parseInt(hex.slice(1),16);return `rgba(${value>>16},${value>>8&255},${value&255},${Math.max(.35,alpha)})`;}
