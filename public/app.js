(() => {
  "use strict";
  const state={layer:"overview",search:"",period:86400,data:{earthquakes:null,reports:null,alerts:null,news:null},markers:[],stream:[]};
  const colors={earthquake:"#ff596b",disaster:"#ff9c4b","weather-alert":"#f1d45b",news:"#2dd4d7"};
  const $=(s)=>document.querySelector(s);
  const els={sidebar:$("#sidebar"),layerNav:$("#layerNav"),search:$("#searchInput"),period:$("#periodSelect"),status:$("#systemStatus"),clock:$("#clock"),health:$("#sourceHealth"),stream:$("#stream"),streamFilter:$("#streamFilter"),detail:$("#detailCard"),weather:$("#weatherContent")};
  const map=L.map("map",{center:[-2.5,118],zoom:5,minZoom:4,maxZoom:12,worldCopyJump:false});
  L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",{attribution:"&copy; OpenStreetMap &copy; CARTO",subdomains:"abcd",maxZoom:19}).addTo(map);
  const markerLayer=L.layerGroup().addTo(map);

  const escapeHtml=(v)=>String(v??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");
  const formatTime=(v)=>{if(!v)return"--";const d=new Date(v);return Number.isNaN(d.valueOf())?String(v):new Intl.DateTimeFormat("id-ID",{dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Jakarta"}).format(d)};
  const fetchJson=async(url)=>{const r=await fetch(url,{headers:{accept:"application/json"}});if(!r.ok)throw new Error(`HTTP ${r.status}`);return r.json()};

  async function loadOverview(){
    els.status.textContent="SYNCING";
    const payload=await fetchJson(`/api/overview?timeperiod=${state.period}`);
    state.data.earthquakes=payload.earthquakes;state.data.reports=payload.reports;state.data.alerts=payload.alerts;state.data.news=payload.news;
    renderAll();els.status.textContent=payload.ok?"LIVE":"DEGRADED";$("#lastUpdate").textContent=formatTime(payload.updatedAt);
  }

  function sourceRows(){
    return [["BMKG Gempa",state.data.earthquakes],["BMKG Nowcast",state.data.alerts],["PetaBencana",state.data.reports],["GDELT News",state.data.news]];
  }
  function renderHealth(){els.health.innerHTML=sourceRows().map(([name,data])=>`<div class="source-row ${data?.ok?"ok":"fail"}"><i></i><span>${name}</span><em>${data?.ok?`${data.count??0} live`:"unavailable"}</em></div>`).join("");$("#sourceCount").textContent=String(sourceRows().filter(([,d])=>d?.ok).length)};

  function buildSignals(){
    const q=state.search.toLowerCase();const result=[];
    for(const e of state.data.earthquakes?.events||[]){result.push({id:e.id,type:"earthquake",title:`M${e.magnitude} · ${e.title}`,description:[e.depthKm!=null?`Kedalaman ${e.depthKm} km`:null,e.felt?`Dirasakan: ${e.felt}`:e.potential].filter(Boolean).join(" · "),time:e.occurredAt,coordinates:e.coordinates,meta:[e.dateLocal,e.source,e.kind]})}
    for(const r of state.data.reports?.reports||[]){result.push({id:r.id,type:"disaster",title:`${String(r.disasterType).toUpperCase()} · ${r.title||"Laporan bencana"}`,description:r.text||`Status: ${r.status||"-"}`,time:r.createdAt,coordinates:r.coordinates,meta:[r.sourceName,r.status,r.disasterType]})}
    for(const a of state.data.alerts?.alerts||[]){result.push({id:a.id,type:"weather-alert",title:a.title,description:a.description,time:a.publishedAt,coordinates:null,meta:[a.source,a.link]})}
    for(const n of state.data.news?.articles||[]){result.push({id:n.url,type:"news",title:n.title,description:[n.domain,n.sourceCountry,n.language].filter(Boolean).join(" · "),time:n.seenDate,coordinates:null,meta:[n.domain,n.language],url:n.url})}
    return result.filter(x=>{const layerOk=state.layer==="overview"||x.type===state.layer;const text=[x.title,x.description,...(x.meta||[])].join(" ").toLowerCase();return layerOk&&(!q||text.includes(q))}).sort((a,b)=>String(b.time||"").localeCompare(String(a.time||"")));
  }

  function renderAll(){
    renderHealth();
    $("#countEarthquake").textContent=state.data.earthquakes?.count??0;$("#countDisaster").textContent=state.data.reports?.count??0;$("#countAlert").textContent=state.data.alerts?.count??0;
    $("#metricEarthquakes").textContent=state.data.earthquakes?.count??0;$("#metricReports").textContent=state.data.reports?.count??0;$("#metricAlerts").textContent=state.data.alerts?.count??0;$("#metricNews").textContent=state.data.news?.count??0;
    state.stream=buildSignals();$("#countOverview").textContent=state.stream.length;$("#visibleCount").textContent=state.stream.length;
    $("#layerTitle").textContent={overview:"Live Overview",earthquake:"Gempa BMKG",disaster:"Laporan Bencana", "weather-alert":"Peringatan Dini Cuaca"}[state.layer]||"Indonesia Live";
    renderMarkers();renderStream();renderBrief();
  }

  function markerIcon(type){return L.divIcon({className:"marker-wrap",html:`<span class="marker-pulse" style="--marker:${colors[type]}"></span><span class="marker-core" style="--marker:${colors[type]}"></span>`,iconSize:[28,28],iconAnchor:[14,14]})}
  function renderMarkers(){markerLayer.clearLayers();state.markers=[];for(const s of state.stream.filter(x=>Array.isArray(x.coordinates))){const m=L.marker(s.coordinates,{icon:markerIcon(s.type)}).addTo(markerLayer);m.bindPopup(`<div class="popup"><h3>${escapeHtml(s.title)}</h3><p>${escapeHtml(s.description)}</p></div>`);m.on("click",()=>showDetail(s));state.markers.push(m)}}
  function renderStream(){const filter=els.streamFilter.value;const items=state.stream.filter(x=>filter==="all"||x.type===filter).slice(0,45);els.stream.innerHTML=items.length?items.map((s,i)=>`<article class="stream-item" data-index="${i}" style="--item-color:${colors[s.type]}"><i class="stream-color"></i><div><div class="stream-meta"><span>${s.type.replace("weather-alert","cuaca")}</span><span>${escapeHtml(formatTime(s.time))}</span></div><h3>${s.url?`<a href="${escapeHtml(s.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(s.title)}</a>`:escapeHtml(s.title)}</h3>${s.description?`<p>${escapeHtml(s.description)}</p>`:""}</div></article>`).join(""):`<div class="empty-box">Tidak ada data nyata yang cocok dengan filter aktif.</div>`}
  function renderBrief(){const eq=state.data.earthquakes?.count||0,rep=state.data.reports?.count||0,al=state.data.alerts?.count||0,news=state.data.news?.count||0;$("#situationBrief").textContent=`Dashboard saat ini menerima ${eq} catatan gempa BMKG, ${rep} laporan bencana PetaBencana, ${al} peringatan dini cuaca BMKG, dan ${news} artikel GDELT. Angka ini berasal langsung dari respons sumber dan dapat berubah setiap refresh.`}
  function showDetail(s){$("#detailType").textContent=s.type.toUpperCase();$("#detailTitle").textContent=s.title;$("#detailDescription").textContent=s.description||"Tidak ada deskripsi.";$("#detailMeta").innerHTML=[formatTime(s.time),...(s.meta||[])].filter(Boolean).map(x=>`<span>${escapeHtml(x)}</span>`).join("");els.detail.hidden=false;if(s.coordinates)map.flyTo(s.coordinates,Math.max(map.getZoom(),7),{duration:1})}

  async function loadWeather(adm4){els.weather.innerHTML=`<div class="empty-box">Memuat data cuaca BMKG...</div>`;const data=await fetchJson(`/api/weather?adm4=${encodeURIComponent(adm4)}`);if(!data.ok){els.weather.innerHTML=`<div class="error-box">${escapeHtml(data.error||"BMKG weather unavailable")}</div>`;return}const loc=data.location||{};$("#weatherLocation").textContent=loc.desa||loc.kecamatan||"Prakiraan Cuaca";els.weather.innerHTML=`<div class="weather-location-meta">${escapeHtml([loc.kecamatan,loc.kotkab,loc.provinsi].filter(Boolean).join(" · "))}</div><div class="forecast-list">${data.forecast.slice(0,8).map(f=>`<article class="forecast-card"><time>${escapeHtml(formatTime(f.localDateTime))}</time><strong>${escapeHtml(f.description||"-")}</strong><p>${escapeHtml(`${f.temperatureC??"-"}°C · RH ${f.humidityPercent??"-"}% · ${f.windKmh??"-"} km/j`)}</p></article>`).join("")}</div>`}

  els.layerNav.addEventListener("click",e=>{const b=e.target.closest("[data-layer]");if(!b)return;state.layer=b.dataset.layer;els.layerNav.querySelectorAll("button").forEach(x=>x.classList.toggle("active",x===b));renderAll()});
  els.search.addEventListener("input",e=>{state.search=e.target.value.trim();renderAll()});
  els.period.addEventListener("change",async e=>{state.period=Number(e.target.value);await loadOverview()});
  els.streamFilter.addEventListener("change",renderStream);
  $("#weatherForm").addEventListener("submit",async e=>{e.preventDefault();await loadWeather($("#adm4Input").value.trim())});
  $("#closeDetail").addEventListener("click",()=>els.detail.hidden=true);
  $("#fitIndonesia").addEventListener("click",()=>map.flyTo([-2.5,118],5,{duration:1}));
  $("#fitSignals").addEventListener("click",()=>{const group=L.featureGroup(state.markers);if(state.markers.length)map.fitBounds(group.getBounds().pad(.15))});
  $("#refreshButton").addEventListener("click",loadOverview);
  $("#menuButton").addEventListener("click",()=>els.sidebar.classList.toggle("open"));
  document.addEventListener("keydown",e=>{if(e.key==="/"&&!/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName)){e.preventDefault();els.search.focus()}if(e.key==="Escape"){els.detail.hidden=true;els.sidebar.classList.remove("open")}});
  setInterval(()=>{$("#clock").textContent=new Intl.DateTimeFormat("en-GB",{timeZone:"Asia/Jakarta",hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:false}).format(new Date())},1000);

  loadOverview().then(()=>loadWeather($("#adm4Input").value.trim())).catch(err=>{console.error(err);els.status.textContent="ERROR";$("#situationBrief").textContent=`Gagal menghubungkan dashboard: ${err.message}`});
})();
