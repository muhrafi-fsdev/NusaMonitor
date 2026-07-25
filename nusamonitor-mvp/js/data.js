window.NUSAMONITOR_DATA={
layers:[
{id:"all",label:"All Intelligence",icon:"◎"},
{id:"conflict",label:"Conflict & Security",icon:"⚠"},
{id:"disaster",label:"Disaster & Climate",icon:"△"},
{id:"cyber",label:"Cyber & Network",icon:"⌁"},
{id:"infrastructure",label:"Infrastructure",icon:"⌂"},
{id:"economic",label:"Economic Signals",icon:"◫"},
{id:"aviation",label:"Aviation & Maritime",icon:"✈"}
],
events:[
{id:"jkt",title:"Jakarta Urban Flood Risk",category:"disaster",severity:"high",country:"Indonesia",region:"Jakarta",lat:-6.2,lng:106.82,ageHours:3,source:"NusaMonitor Demo",summary:"Curah hujan intensif meningkatkan risiko genangan dan gangguan mobilitas di beberapa koridor perkotaan.",tags:["Indonesia","Climate","Urban"]},
{id:"natuna",title:"Maritime Activity Near Natuna",category:"aviation",severity:"medium",country:"Indonesia",region:"Natuna Sea",lat:3.7,lng:108,ageHours:9,source:"NusaMonitor Demo",summary:"Peningkatan aktivitas maritim terdeteksi pada jalur pelayaran regional. Data bersifat simulasi.",tags:["Indonesia","Maritime"]},
{id:"taiwan",title:"Elevated Activity in Taiwan Strait",category:"conflict",severity:"critical",country:"Taiwan",region:"Taiwan Strait",lat:24.1,lng:120.5,ageHours:4,source:"NusaMonitor Demo",summary:"Signal convergence menunjukkan aktivitas militer dan penerbangan yang meningkat.",tags:["Geopolitics","Military"]},
{id:"japan",title:"Seismic Activity Near Southern Japan",category:"disaster",severity:"medium",country:"Japan",region:"Kyushu",lat:31.6,lng:130.6,ageHours:17,source:"NusaMonitor Demo",summary:"Aktivitas seismik terdeteksi dalam dataset demonstrasi.",tags:["Earthquake","Asia"]},
{id:"suez",title:"Shipping Congestion Around Suez",category:"infrastructure",severity:"high",country:"Egypt",region:"Suez Canal",lat:30.58,lng:32.32,ageHours:14,source:"NusaMonitor Demo",summary:"Kepadatan pelayaran meningkatkan estimasi waktu transit dan risiko keterlambatan.",tags:["Logistics","Shipping"]},
{id:"ukraine",title:"Escalation Signal in Eastern Europe",category:"conflict",severity:"critical",country:"Ukraine",region:"Eastern Ukraine",lat:48.1,lng:37.8,ageHours:7,source:"NusaMonitor Demo",summary:"Korelasi signal keamanan, berita, dan infrastruktur menunjukkan kondisi berisiko tinggi.",tags:["Conflict","Europe"]},
{id:"cyber",title:"Cross-Region Authentication Outage",category:"cyber",severity:"high",country:"Germany",region:"Central Europe",lat:50.11,lng:8.68,ageHours:12,source:"NusaMonitor Demo",summary:"Gangguan autentikasi simulatif memengaruhi beberapa layanan digital lintas wilayah.",tags:["Cyber","Cloud"]},
{id:"oil",title:"Oil Volatility Signal",category:"economic",severity:"medium",country:"Saudi Arabia",region:"Persian Gulf",lat:25.2,lng:50.6,ageHours:21,source:"NusaMonitor Demo",summary:"Composite signal menunjukkan volatilitas energi meningkat.",tags:["Energy","Markets"]},
{id:"california",title:"Wildfire Pressure in Western US",category:"disaster",severity:"high",country:"United States",region:"California",lat:37.2,lng:-120.5,ageHours:28,source:"NusaMonitor Demo",summary:"Kondisi panas dan kering meningkatkan pressure index kebakaran hutan.",tags:["Wildfire","Climate"]},
{id:"cable",title:"Subsea Cable Degradation Signal",category:"infrastructure",severity:"medium",country:"Singapore",region:"Singapore Strait",lat:1.25,lng:103.8,ageHours:31,source:"NusaMonitor Demo",summary:"Anomali jaringan simulatif terdeteksi pada jalur konektivitas regional.",tags:["Network","Subsea Cable"]},
{id:"flight",title:"Airspace Rerouting Pattern",category:"aviation",severity:"low",country:"Turkey",region:"Eastern Mediterranean",lat:38.3,lng:32.2,ageHours:40,source:"NusaMonitor Demo",summary:"Pola rerouting penerbangan menunjukkan penyesuaian jalur.",tags:["Aviation","Transport"]},
{id:"rupiah",title:"IDR Volatility Watch",category:"economic",severity:"low",country:"Indonesia",region:"Jakarta",lat:-6.12,lng:106.9,ageHours:44,source:"NusaMonitor Demo",summary:"Market signal demo memantau volatilitas rupiah dan sentimen regional.",tags:["Indonesia","Finance"]}
],
news:[
{id:"n1",eventId:"taiwan",severity:"critical",region:"Asia-Pacific",age:"4m",title:"Multi-source signal convergence detected in Taiwan Strait monitoring area.",summary:"Military, aviation, and media signals moved above the configured watch threshold."},
{id:"n2",eventId:"jkt",severity:"high",region:"Indonesia",age:"11m",title:"Urban flood pressure elevated across Jakarta monitoring grid.",summary:"Mobility and climate indicators suggest possible localized disruption."},
{id:"n3",eventId:"cyber",severity:"high",region:"Europe",age:"19m",title:"Authentication outage pattern spans multiple regional endpoints.",summary:"The demo feed correlates cloud availability and network telemetry."},
{id:"n4",eventId:"suez",severity:"high",region:"Middle East",age:"27m",title:"Shipping congestion indicator remains above normal baseline.",summary:"Transit delays may increase supply-chain uncertainty."},
{id:"n5",eventId:"natuna",severity:"medium",region:"Indonesia",age:"34m",title:"Maritime activity watch activated near the Natuna monitoring zone.",summary:"This is simulated data prepared for the NusaMonitor MVP."},
{id:"n6",eventId:"oil",severity:"medium",region:"Global",age:"42m",title:"Energy volatility composite moved into guarded territory.",summary:"Price pressure, logistics risk, and sentiment components are rising together."}
]};