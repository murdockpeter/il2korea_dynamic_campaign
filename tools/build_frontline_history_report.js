const fs = require('fs');
const path = require('path');
const { readLocalGoogleMapsKey } = require('./local_google_maps_key');

const root = path.resolve(__dirname, '..');
const input = path.join(root, 'campaign', 'historical-frontline.json');
const situationInput = path.join(root, 'campaign', 'current-situation.json');
const outputDir = path.join(root, 'reports');
const output = path.join(outputDir, 'historical-frontline.html');
const history = JSON.parse(fs.readFileSync(input, 'utf8'));
const situation = JSON.parse(fs.readFileSync(situationInput, 'utf8'));
const mapsCredential = readLocalGoogleMapsKey(root);
const googleMapsApiKey = mapsCredential.key;

const esc = (value) => String(value ?? '')
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;').replaceAll("'", '&#039;');

const clamp = (value) => Math.max(5, Math.min(98, Math.round(value)));
const roman = ['I', 'II', 'III', 'IV'];
const effectivenessModifiers = {
  UN: [8, 4, 0, -8, -12, -6, 10, 16],
  DPRK: [6, 3, 0, -5, -11, -17, -34, -44]
};

function hash(text) {
  let value = 2166136261;
  for (const char of text) {
    value ^= char.charCodeAt(0);
    value = Math.imul(value, 16777619);
  }
  return value >>> 0;
}

function spread(key, scale) {
  return ((hash(key) % 10000) / 9999 - 0.5) * scale;
}

const trackedBattalions = situation.formations.flatMap((formation) => {
  return Array.from({ length: formation.battalions }, (_, index) => {
    const name = formation.battalions === 1
      ? formation.regiment
      : `${roman[index] || index + 1}/${formation.regiment}`;
    const baseEffectiveness = Math.round(
      formation.strength * 0.45 + formation.cohesion * 0.35 + formation.supply * 0.20
    );
    return {
      id: `${formation.side}_${formation.division}_${name}`.replace(/[^A-Za-z0-9]+/g, '_'),
      side: formation.side,
      nationality: formation.nationality,
      sector: formation.sector,
      division: formation.division,
      regiment: formation.regiment,
      battalion: name,
      posture: formation.posture,
      note: formation.note,
      basis: formation.basis,
      baseEffectiveness,
      confidence: formation.confidence
    };
  });
});

const unitTracks = trackedBattalions.map((unit) => {
  const formationKey = `${unit.side}|${unit.division}|${unit.regiment}`;
  const battalionKey = `${formationKey}|${unit.battalion}`;
  const frames = history.frames.map((frame, frameIndex) => {
    const zone = frame.unitZones[unit.side][unit.sector];
    const latitude = zone[0]
      + spread(`${formationKey}|lat`, 0.18)
      + spread(`${battalionKey}|${frame.date}|lat`, 0.055);
    let longitude = zone[1]
      + spread(`${formationKey}|lng`, 0.29)
      + spread(`${battalionKey}|${frame.date}|lng`, 0.075);
    if (unit.sector === 'EAST') longitude = Math.min(longitude, zone[1] + 0.035);
    const variation = spread(`${battalionKey}|${frame.date}|effect`, 9);
    const effectiveness = clamp(
      unit.baseEffectiveness + effectivenessModifiers[unit.side][frameIndex] + variation
    );
    const isTaskForceSmith = unit.division === '24th Infantry Division';
    const visible = !isTaskForceSmith || (frame.date >= '1950-07-04' && frame.date <= '1950-07-20');
    return {
      position: [Number(latitude.toFixed(4)), Number(longitude.toFixed(4))],
      effectiveness,
      confidence: clamp(unit.confidence - Math.abs(frameIndex - 2) * 4),
      visible
    };
  });
  return { ...unit, frames };
});

const timelineCards = history.frames.map((frame, index) => `
  <button class="timeline-card${frame.campaignNow ? ' campaign-now' : ''}" data-frame="${index}">
    <span class="timeline-date">${esc(frame.date.slice(5).replace('-', ' / '))}</span>
    <strong>${esc(frame.label)}</strong>
    <small>${esc(frame.initiative)} initiative</small>
  </button>`).join('');

const sourceLinks = history.sources.map((source, index) => `
  <li><span>${String(index + 1).padStart(2, '0')}</span><a href="${esc(source.url)}">${esc(source.label)}</a></li>`).join('');

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(history.title)} — ${esc(history.subtitle)}</title>
<style>
:root{--night:#12272c;--night2:#1e3a3e;--paper:#eee7d1;--sheet:#faf6e8;--ink:#202a25;--muted:#697269;--line:#c6b993;--gold:#c89b49;--red:#9b2f36;--blue:#315f91;--gray:#747b75;--green:#467453;--orange:#b06b28}*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:#101e21;color:var(--ink);font:14px/1.5 "Segoe UI",Arial,sans-serif;background-image:radial-gradient(#405154 1px,transparent 1px);background-size:24px 24px}.page{max-width:1650px;margin:24px auto;background:var(--paper);border:1px solid #4b5a56;box-shadow:0 30px 100px #0009}.masthead{position:relative;overflow:hidden;background:linear-gradient(120deg,#10262b,#27464a);color:#f5efd9;padding:30px 40px 25px;border-bottom:6px solid var(--gold)}.masthead:after{content:"1950";position:absolute;right:20px;top:-45px;font:900 150px Georgia;color:#fff;opacity:.035}.eyebrow{font-size:10px;font-weight:900;letter-spacing:2.3px;color:#dbb465}.masthead h1{font:700 clamp(36px,5vw,66px)/.95 Georgia;margin:10px 0}.subtitle{font-size:17px;letter-spacing:1px;color:#becdca}.mast-meta{display:flex;gap:35px;flex-wrap:wrap;margin-top:20px;padding-top:15px;border-top:1px solid #ffffff2b}.mast-meta span{display:block;font-size:9px;letter-spacing:1.5px;text-transform:uppercase;color:#8ea7a4}.mast-meta b{color:#fff}.print{position:absolute;right:35px;bottom:24px;background:var(--gold);color:#17272a;border:0;padding:10px 16px;font-weight:900;cursor:pointer}.body{padding:27px 32px 42px}.intro{display:grid;grid-template-columns:auto 1fr;gap:18px;background:#dfd4b5;border-left:5px solid var(--gold);padding:16px 18px}.intro b{font:700 20px Georgia}.intro p{margin:1px 0;color:#50594f}.atlas{display:grid;grid-template-columns:230px minmax(600px,1fr) 370px;gap:15px;margin-top:22px}.timeline{display:flex;flex-direction:column;gap:7px}.timeline-heading{padding:7px 2px 10px;border-bottom:2px solid #756a51}.timeline-heading span{display:block;font-size:9px;letter-spacing:1.5px;text-transform:uppercase;color:#73786d}.timeline-heading b{font:700 18px Georgia}.timeline-card{position:relative;text-align:left;border:1px solid #b9ad8d;background:#f7f2e4;padding:12px 12px 12px 48px;color:var(--ink);cursor:pointer;min-height:69px;transition:.18s ease}.timeline-card:before{content:"";position:absolute;left:23px;top:-8px;bottom:-8px;border-left:2px solid #ab9c76}.timeline-card:after{content:"";position:absolute;left:17px;top:27px;width:11px;height:11px;border-radius:50%;background:#b6a681;border:3px solid var(--paper)}.timeline-card:hover{transform:translateX(3px);background:#fffaf0}.timeline-card.active{background:#203b40;color:#f3edda;border-color:#152b2f}.timeline-card.active:after{background:var(--gold)}.timeline-card.campaign-now{box-shadow:inset 4px 0 var(--gold)}.timeline-card.campaign-now strong:after{content:" CAMPAIGN NOW";display:inline-block;color:#be8d36;font:800 8px "Segoe UI";letter-spacing:.7px;margin-left:5px}.timeline-date{position:absolute;left:5px;top:13px;font-size:9px;font-weight:900;color:#9b7538;writing-mode:vertical-rl}.timeline-card strong,.timeline-card small{display:block}.timeline-card strong{font:700 15px Georgia}.timeline-card small{margin-top:5px;color:#73796f;font-size:10px}.timeline-card.active small{color:#aabcb7}.map-column{background:#1c3033;padding:11px;align-self:start;box-shadow:0 10px 30px #22312d44}.history-map{height:760px;background:#23393d}.map-fallback{height:100%;display:grid;place-content:center;text-align:center;color:#e8dfca;padding:45px}.map-fallback b{font:700 25px Georgia}.map-fallback span{max-width:480px;color:#b6c5c0;margin-top:8px}.map-legend{background:#fbf6e6f2;border:1px solid #71664d;border-radius:3px;box-shadow:0 3px 12px #0005;margin:12px;padding:10px 12px;color:#24302c;font:11px/1.65 "Segoe UI"}.map-legend b{display:block;font:700 14px Georgia}.legend-line{display:inline-block;width:25px;height:4px;vertical-align:middle;margin-right:7px}.legend-line.red{background:repeating-linear-gradient(90deg,var(--red) 0 7px,transparent 7px 11px)}.legend-line.blue{background:repeating-linear-gradient(90deg,var(--blue) 0 7px,transparent 7px 11px)}.legend-dot{display:inline-block;width:10px;height:10px;border-radius:50%;margin:0 8px 0 2px}.legend-dot.green{background:var(--green)}.legend-dot.orange{background:var(--orange)}.controls{display:grid;grid-template-columns:auto 1fr auto;gap:12px;align-items:center;background:#12262b;color:#e8e1cf;padding:13px 10px 4px}.play{width:42px;height:42px;border-radius:50%;border:1px solid #d2ab62;background:#c89b49;color:#13272b;font-size:18px;cursor:pointer}.slider{accent-color:#c89b49;width:100%}.counter{font-size:11px;color:#a9bab6}.slider-labels{grid-column:2;display:flex;justify-content:space-between;font-size:8px;color:#829792}.brief{display:flex;flex-direction:column;gap:12px}.date-panel{background:#203a3f;color:#f4eedc;padding:19px;border-top:5px solid var(--red)}.date-panel.un{border-color:var(--blue)}.date-panel.contested{border-color:var(--gold)}.date-panel span{display:block;color:#a8bbb6;font-size:9px;letter-spacing:1.5px;text-transform:uppercase}.date-panel b{display:block;font:700 30px Georgia}.date-panel strong{display:block;color:#e0bc75;margin-top:3px}.brief h2{font:700 25px/1.1 Georgia;margin:0}.narrative{background:var(--sheet);border:1px solid var(--line);padding:18px}.narrative p{color:#515a50;margin-bottom:0}.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.stat{background:#e1d7bc;border:1px solid #bdae88;padding:12px}.stat span{font-size:8px;text-transform:uppercase;letter-spacing:1px;color:#6b7067}.stat b{display:block;font:700 21px Georgia}.pressure-track{height:7px;background:#cdc4ac;margin-top:7px}.pressure-track i{display:block;height:100%;background:var(--red)}.airfield-highlight{background:#f9f5e8;border:1px solid var(--line);padding:15px}.airfield-highlight h3{font:700 18px Georgia;margin:0 0 7px}.airfield-highlight p{margin:4px 0;color:#596158}.status-key{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:7px}.pill{display:inline-block;padding:3px 7px;border-radius:12px;color:#fff;font-size:8px;font-weight:900;letter-spacing:.5px}.pill.sustained{background:var(--green)}.pill.staging{background:var(--blue)}.pill.fragile{background:var(--orange)}.pill.limited,.pill.repair{background:var(--gray)}.pill.evacuated,.pill.enemy{background:var(--red)}.section-title{display:flex;justify-content:space-between;align-items:end;border-bottom:2px solid #776c52;margin:33px 0 14px;padding-bottom:7px}.section-title h2{font:700 27px Georgia;margin:0}.section-title p{font-size:11px;color:#697067;margin:0}.airfield-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}.airfield-card{background:#faf6e9;border:1px solid var(--line);border-top:4px solid var(--gray);padding:14px}.airfield-card.sustained{border-top-color:var(--green)}.airfield-card.staging{border-top-color:var(--blue)}.airfield-card.fragile{border-top-color:var(--orange)}.airfield-card.enemy,.airfield-card.evacuated{border-top-color:var(--red)}.airfield-card h3{font:700 17px Georgia;margin:7px 0 2px}.airfield-card .k{font-size:9px;letter-spacing:1.2px;color:#70766c}.airfield-card p{font-size:11px;color:#596057}.airfield-card .detail{font-weight:700;color:#313b35}.sources{columns:2;list-style:none;padding:0}.sources li{display:flex;gap:10px;break-inside:avoid;margin-bottom:8px}.sources span{font-weight:900;color:#a17834}.sources a{color:#28556d;text-decoration:none;border-bottom:1px solid #28556d44}.method{background:#ded3b4;border:1px solid #b6a985;padding:17px}.method h3{font:700 18px Georgia;margin:0 0 5px}.footer{background:#14292d;color:#9eb1ac;padding:16px 32px;display:flex;justify-content:space-between;font-size:10px}.footer b{color:#d5b46d}
@media(max-width:1250px){.atlas{grid-template-columns:190px 1fr}.brief{grid-column:1/-1;display:grid;grid-template-columns:repeat(3,1fr)}.narrative{grid-column:span 2}.airfield-grid{grid-template-columns:repeat(2,1fr)}}@media(max-width:760px){.body{padding:18px}.masthead{padding:25px 20px}.print{position:static;margin-top:15px}.atlas{grid-template-columns:1fr}.timeline{display:grid;grid-template-columns:1fr 1fr}.timeline-heading{grid-column:1/-1}.map-column{grid-column:1}.history-map{height:590px}.brief{display:flex}.airfield-grid{grid-template-columns:1fr}.sources{columns:1}.footer{display:block}}
@page{size:A4 landscape;margin:9mm}@media print{body{background:#fff;font-size:9px}.page{margin:0;max-width:none;box-shadow:none;border:0}.masthead{padding:12px 20px}.masthead h1{font-size:32px}.print,.controls{display:none}.body{padding:10px 14px}.intro{padding:8px}.atlas{grid-template-columns:120px 1fr 250px;gap:7px}.timeline-card{padding:6px 5px 6px 28px;min-height:45px}.timeline-card:before,.timeline-card:after{display:none}.timeline-date{left:3px}.history-map{height:155mm}.brief{display:flex}.narrative,.date-panel,.airfield-highlight{padding:8px}.stats{gap:3px}.airfield-grid{grid-template-columns:repeat(4,1fr);gap:4px}.airfield-card{padding:7px;break-inside:avoid}.section-title{margin:14px 0 7px}.sources{columns:2}.footer{padding:8px 14px}}
.unit-control{background:#fbf6e8f2;border:1px solid #71664d;border-radius:3px;box-shadow:0 3px 12px #0005;margin:12px;padding:11px 12px;min-width:205px;color:#24302c;font:11px/1.5 "Segoe UI"}.unit-control b{display:block;font:700 14px Georgia;margin-bottom:5px}.unit-control label{display:flex;align-items:center;gap:7px;margin:4px 0;cursor:pointer}.unit-control input{accent-color:#bd9348}.unit-count{border-top:1px solid #bcb092;margin-top:7px;padding-top:6px;font-weight:800}.unit-symbol{position:relative;display:inline-block;width:20px;height:20px;border-radius:50%;vertical-align:middle;margin-right:6px;border:5px solid}.unit-symbol.un{border-color:#315f91}.unit-symbol.dprk{border-color:#9b2f36}.unit-symbol:after{content:"";position:absolute;inset:1px;border-radius:50%;background:#467453}.ce-key{display:grid;grid-template-columns:1fr 1fr;gap:3px;margin-top:7px}.ce-key span:before{content:"";display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:4px}.ce-key .effective:before{background:#467453}.ce-key .degraded:before{background:#d1a13d}.ce-key .fragile:before{background:#d37431}.ce-key .critical:before{background:#9e3036}.unit-method{font-size:10px;color:#666d64;margin-top:6px;max-width:190px}@media print{.unit-control{padding:5px;min-width:150px}}
</style></head><body><main class="page">
<header class="masthead"><div class="eyebrow">${esc(history.classification)}</div><h1>${esc(history.title)}</h1><div class="subtitle">${esc(history.subtitle)} · Front lines, battalions, turning points, and the airfields behind them</div><div class="mast-meta"><div><span>Coverage</span><b>Opening invasion to the UN crossing</b></div><div><span>Frames</span><b>${history.frames.length} dated operational snapshots</b></div><div><span>Tracked forces</span><b>${unitTracks.length} battalion equivalents</b></div><div><span>Map basis</span><b>Google terrain · historical overlays</b></div></div><button class="print" onclick="window.print()">PRINT ATLAS</button></header>
<div class="body"><section class="intro"><b>A moving front, not a fixed border</b><p>Drag the date control or press play to follow the North Korean advance, the contraction into the Pusan Perimeter, and the UN counteroffensive. Every line is an operational-scale reconstruction from historical narratives. Battalion markers use stable, deterministic dispersion around sector estimates so they remain varied without moving randomly on every load.</p></section>
<section class="atlas"><nav class="timeline"><div class="timeline-heading"><span>Select a situation</span><b>Campaign chronology</b></div>${timelineCards}</nav><div class="map-column"><div id="historyMap" class="history-map"><div class="map-fallback"><b>Loading historical map…</b><span>Google terrain supplies the geographic base; all military overlays are campaign reconstructions.</span></div></div><div class="controls"><button id="play" class="play" aria-label="Play timeline">▶</button><input id="frameSlider" class="slider" type="range" min="0" max="${history.frames.length - 1}" value="2" step="1" aria-label="Historical situation date"><span id="counter" class="counter"></span><div class="slider-labels">${history.frames.map((f) => `<span>${esc(f.date.slice(5))}</span>`).join('')}</div></div></div><aside class="brief"><div id="datePanel" class="date-panel"><span>Operational situation</span><b id="frameDate"></b><strong id="frameLabel"></strong></div><article class="narrative"><h2 id="headline"></h2><p id="summary"></p></article><div class="stats"><div class="stat"><span>Initiative</span><b id="initiative"></b></div><div class="stat"><span>Enemy pressure</span><b id="pressure"></b><div class="pressure-track"><i id="pressureBar"></i></div></div><div class="stat"><span>Usable Korean fields</span><b id="usableCount"></b></div></div><article class="airfield-highlight"><h3>Airfield picture</h3><p id="airfieldSummary"></p><div class="status-key"><span><i class="pill sustained">SUSTAINED</i></span><span><i class="pill staging">STAGING</i></span><span><i class="pill fragile">FRAGILE</i></span><span><i class="pill enemy">LOST / EVAC</i></span></div></article></aside></section>
<div class="section-title"><h2>Airfields at the selected date</h2><p>Status changes with the historical slider</p></div><section id="airfieldGrid" class="airfield-grid"></section>
<div class="section-title"><h2>Sources and cartographic method</h2><p>Official narrative anchors; deliberately approximate lines and unit positions</p></div><ol class="sources">${sourceLinks}</ol><aside class="method"><h3>Interpretation note</h3><p>These snapshots interpolate between documented city captures, withdrawals, defensive alignments, and named operational axes. In the mobile opening campaign there was rarely an unbroken front. Bypassed units, reconnaissance screens, refugees, infiltrators, and road-bound columns could exist on either side of the displayed line. Battalion locations before and after 4 July are campaign reconstructions derived from sector anchors, not claimed historical coordinates or an exhaustive theater order of battle. Combat-effectiveness values propagate the 4 July campaign ledger backward and forward with side-specific attrition and recovery trends plus small deterministic battalion variation. Airfield “viability” means practical operational use for the indicated period, not merely the existence of a runway.</p></aside></div>
<footer class="footer"><span><b>${esc(history.classification)}</b> · Generated from campaign/historical-frontline.json</span><span>Black Scorpions campaign historical reference</span></footer></main>
<script>
const HISTORY=${JSON.stringify(history)};
const UNIT_TRACKS=${JSON.stringify(unitTracks)};
const GOOGLE_MAPS_API_KEY=${JSON.stringify(googleMapsApiKey)};
const colors={DPRK:'#9b2f36',UN:'#315f91',CONTESTED:'#bd9348',SUSTAINED:'#467453',STAGING:'#315f91',FRAGILE:'#b06b28',LIMITED:'#747b75',REPAIR:'#747b75',EVACUATED:'#9b2f36',ENEMY:'#6f1f27'};
let map,info,overlays=[],markers=[],unitMarkers=[],unitControl=null,frameIndex=2,timer=null;
const unitVisibility={UN:true,DPRK:true};
const slider=document.querySelector('#frameSlider'),play=document.querySelector('#play'),cards=[...document.querySelectorAll('.timeline-card')];
const dateText=(iso)=>new Date(iso+'T12:00:00').toLocaleDateString('en-US',{day:'numeric',month:'long',year:'numeric'});
function statusAt(airfield,date){return airfield.states.filter(item=>item.date<=date).at(-1)||{status:'LIMITED',detail:'Status unknown'}}
function escapeHtml(value){return String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]))}
function mapFailure(message){document.querySelector('#historyMap').innerHTML='<div class="map-fallback"><b>Historical map unavailable</b><span>'+escapeHtml(message)+'</span><span>The dated narrative and airfield history remain available.</span></div>'}
function renderAirfields(frame){const states=HISTORY.airfields.map(field=>({field,state:statusAt(field,frame.date)}));const usable=states.filter(item=>item.field.kNumber!=='JAPAN'&&['SUSTAINED','STAGING','FRAGILE'].includes(item.state.status));document.querySelector('#usableCount').textContent=usable.length;document.querySelector('#airfieldSummary').textContent=usable.length?usable.map(item=>item.field.kNumber+' '+item.field.name+' — '+item.state.detail).join('. ')+' Itazuke remains the dependable Japan-based hub.':'No dependable peninsula fighter field is available; combat aviation remains based primarily in Japan.';document.querySelector('#airfieldGrid').innerHTML=states.map(({field,state})=>'<article class="airfield-card '+state.status.toLowerCase()+'"><span class="pill '+state.status.toLowerCase()+'">'+state.status+'</span><h3>'+escapeHtml(field.name)+'</h3><div class="k">'+escapeHtml(field.kNumber)+'</div><p class="detail">'+escapeHtml(state.detail)+'</p><p>'+escapeHtml(field.note)+'</p></article>').join('');if(!map)return;markers.forEach(marker=>marker.setMap(null));markers=states.map(({field,state})=>{const marker=new google.maps.Marker({map,position:{lat:field.position[0],lng:field.position[1]},title:field.kNumber+' '+field.name,label:{text:field.kNumber==='JAPAN'?'J':field.kNumber.replace('K-',''),color:'#fff',fontSize:'9px',fontWeight:'800'},icon:{path:google.maps.SymbolPath.CIRCLE,fillColor:colors[state.status],fillOpacity:1,strokeColor:'#fff7df',strokeWeight:2,scale:12},zIndex:10});marker.addListener('click',()=>{info.setContent('<div style="max-width:250px"><b>'+escapeHtml(field.kNumber+' · '+field.name)+'</b><br><strong style="color:'+colors[state.status]+'">'+state.status+'</strong> — '+escapeHtml(state.detail)+'<br><small>'+escapeHtml(field.note)+'</small></div>');info.open({map,anchor:marker})});return marker})}
function drawFrame(frame,index){if(!map)return;overlays.forEach(item=>item.setMap(null));overlays=[];const currentColor=colors[frame.initiative]||colors.CONTESTED;for(let i=0;i<index;i++){overlays.push(new google.maps.Polyline({map,path:HISTORY.frames[i].line.map(([lat,lng])=>({lat,lng})),strokeColor:'#4c5550',strokeOpacity:.18,strokeWeight:2,clickable:false,zIndex:1}))}const path=frame.line.map(([lat,lng])=>({lat,lng}));const northShade=[...path,{lat:38.75,lng:129.55},{lat:38.75,lng:125.10}];const southShade=[...path,{lat:34.65,lng:129.55},{lat:34.65,lng:125.10}];overlays.push(new google.maps.Polygon({map,paths:frame.initiative==='UN'?southShade:northShade,fillColor:currentColor,fillOpacity:.11,strokeOpacity:0,clickable:false,zIndex:0}));const dash={path:'M 0,-1 0,1',strokeOpacity:1,strokeColor:currentColor,strokeWeight:4,scale:3};overlays.push(new google.maps.Polyline({map,path,strokeOpacity:0,icons:[{icon:dash,offset:'0',repeat:'17px'}],clickable:false,zIndex:5}));if(frame.secondary){overlays.push(new google.maps.Polygon({map,paths:frame.secondary.map(([lat,lng])=>({lat,lng})),fillColor:colors.UN,fillOpacity:.25,strokeColor:colors.UN,strokeWeight:3,zIndex:6}))}map.panTo({lat:frame.view.lat,lng:frame.view.lng});map.setZoom(frame.view.zoom)}
function selectFrame(index,moveMap=true){frameIndex=Number(index);const frame=HISTORY.frames[frameIndex];slider.value=frameIndex;cards.forEach((card,i)=>card.classList.toggle('active',i===frameIndex));document.querySelector('#frameDate').textContent=dateText(frame.date);document.querySelector('#frameLabel').textContent=frame.label;document.querySelector('#headline').textContent=frame.headline;document.querySelector('#summary').textContent=frame.summary;document.querySelector('#initiative').textContent=frame.initiative;document.querySelector('#pressure').textContent=frame.pressure+'%';document.querySelector('#pressureBar').style.width=frame.pressure+'%';document.querySelector('#counter').textContent=(frameIndex+1)+' / '+HISTORY.frames.length;const panel=document.querySelector('#datePanel');panel.className='date-panel '+frame.initiative.toLowerCase();renderAirfields(frame);if(moveMap)drawFrame(frame,frameIndex)}
function effectivenessColor(value){if(value>=75)return'#467453';if(value>=55)return'#d1a13d';if(value>=35)return'#d37431';return'#9e3036'}
function unitIcon(side,effectiveness){const ring=side==='UN'?colors.UN:colors.DPRK,core=effectivenessColor(effectiveness);const svg='<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 22 22"><circle cx="11" cy="11" r="9.5" fill="'+ring+'" stroke="#fff8e5" stroke-width="1.5"/><circle cx="11" cy="11" r="5.2" fill="'+core+'" stroke="#fff8e5" stroke-width="1.2"/></svg>';return{url:'data:image/svg+xml;charset=UTF-8,'+encodeURIComponent(svg),scaledSize:new google.maps.Size(22,22),anchor:new google.maps.Point(11,11)}}
function installUnitControl(){if(unitControl||!map)return;unitControl=document.createElement('div');unitControl.className='unit-control';unitControl.innerHTML='<b>Battalion overlays</b><label><input id="showUN" type="checkbox" checked><span class="unit-symbol un"></span>UN / ROK</label><label><input id="showDPRK" type="checkbox" checked><span class="unit-symbol dprk"></span>DPRK</label><div class="ce-key"><span class="effective">75+ effective</span><span class="degraded">55–74 degraded</span><span class="fragile">35–54 fragile</span><span class="critical">&lt;35 critical</span></div><div id="unitCount" class="unit-count"></div><div class="unit-method">Outer ring = side. Inner core = combat effectiveness. Dispersion is deterministic campaign estimation.</div>';map.controls[google.maps.ControlPosition.RIGHT_TOP].push(unitControl);unitControl.querySelector('#showUN').addEventListener('change',event=>{unitVisibility.UN=event.target.checked;renderUnits(HISTORY.frames[frameIndex])});unitControl.querySelector('#showDPRK').addEventListener('change',event=>{unitVisibility.DPRK=event.target.checked;renderUnits(HISTORY.frames[frameIndex])})}
function renderUnits(frame){if(!map)return;installUnitControl();unitMarkers.forEach(marker=>marker.setMap(null));unitMarkers=[];let visible=0;for(const unit of UNIT_TRACKS){const state=unit.frames[frameIndex];if(!state.visible||!unitVisibility[unit.side])continue;visible++;const marker=new google.maps.Marker({map,position:{lat:state.position[0],lng:state.position[1]},title:unit.battalion+' · '+unit.division,icon:unitIcon(unit.side,state.effectiveness),opacity:.55+state.confidence/225,zIndex:unit.side==='UN'?18:17});marker.addListener('click',()=>{const ceLabel=state.effectiveness>=75?'Effective':state.effectiveness>=55?'Degraded':state.effectiveness>=35?'Fragile':'Critical';info.setContent('<div style="max-width:285px"><b>'+escapeHtml(unit.battalion)+'</b><br><span style="color:'+(unit.side==='UN'?colors.UN:colors.DPRK)+';font-weight:800">'+escapeHtml(unit.side+' · '+unit.nationality)+'</span><br>'+escapeHtml(unit.division)+'<hr style="border:0;border-top:1px solid #ddd"><b style="color:'+effectivenessColor(state.effectiveness)+'">'+state.effectiveness+' · '+ceLabel+'</b> combat effectiveness<br><small>Sector: '+escapeHtml(unit.sector)+' · Intel confidence: '+state.confidence+'%</small><br><small>'+escapeHtml(unit.basis)+'</small></div>');info.open({map,anchor:marker})});unitMarkers.push(marker)}const count=unitControl.querySelector('#unitCount');if(count)count.textContent=visible+' battalions shown'}
const renderAirfieldsBase=renderAirfields;
renderAirfields=(frame)=>{renderAirfieldsBase(frame);renderUnits(frame)};
function stop(){clearInterval(timer);timer=null;play.textContent='▶';play.setAttribute('aria-label','Play timeline')}
function togglePlay(){if(timer){stop();return}play.textContent='Ⅱ';play.setAttribute('aria-label','Pause timeline');timer=setInterval(()=>{if(frameIndex>=HISTORY.frames.length-1){stop();return}selectFrame(frameIndex+1)},1900)}
slider.addEventListener('input',()=>{stop();selectFrame(slider.value)});play.addEventListener('click',togglePlay);cards.forEach((card,index)=>card.addEventListener('click',()=>{stop();selectFrame(index)}));
window.gm_authFailure=()=>mapFailure('Google rejected the Maps credential. Check Maps JavaScript API access and localhost website restrictions.');
window.initHistoryMap=()=>{map=new google.maps.Map(document.querySelector('#historyMap'),{center:{lat:37.0,lng:127.8},zoom:7,mapTypeId:'terrain',streetViewControl:false,fullscreenControl:true,mapTypeControl:true,gestureHandling:'greedy',controlSize:28});info=new google.maps.InfoWindow();const legend=document.createElement('div');legend.className='map-legend';legend.innerHTML='<b>Historical overlay</b><div><i class="legend-line red"></i>DPRK initiative/front</div><div><i class="legend-line blue"></i>UN initiative/front</div><div><i class="legend-dot green"></i>Sustained airfield</div><div><i class="legend-dot orange"></i>Fragile airfield</div><small>Faint lines show earlier selected-date alignments.</small>';map.controls[google.maps.ControlPosition.LEFT_BOTTOM].push(legend);selectFrame(frameIndex)};
selectFrame(frameIndex,false);
if(GOOGLE_MAPS_API_KEY){const loader=document.createElement('script');loader.src='https://maps.googleapis.com/maps/api/js?key='+encodeURIComponent(GOOGLE_MAPS_API_KEY)+'&callback=initHistoryMap&v=weekly&loading=async&region=KR&language=en';loader.async=true;loader.onerror=()=>mapFailure('The Google Maps script could not be loaded.');document.head.appendChild(loader)}else{mapFailure('Set GOOGLE_MAPS_API_KEY and rebuild with npm run report:history.')}
</script></body></html>`;

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(output, html, 'utf8');
console.log(`Wrote ${output}`);
console.log(`${history.frames.length} historical front snapshots and ${history.airfields.length} tracked airfields.`);
console.log(`${unitTracks.length} battalion tracks derived from the current campaign order of battle.`);
console.log(googleMapsApiKey ? `Google Maps enabled from ${mapsCredential.source}.` : 'Google Maps key absent; wrote safe fallback.');
