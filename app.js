let B=[],N=60,selectedRegions=new Set(),randomSeed=0;const $=x=>document.getElementById(x);
async function init(){B=await fetch("data/bars.json",{cache:"no-store"}).then(r=>r.json()).catch(()=>[]);let m=await fetch("data/meta.json",{cache:"no-store"}).then(r=>r.json()).catch(()=>({}));$("total").textContent=B.length.toLocaleString("fr-CA");$("cities").textContent=new Set(B.map(x=>x.city).filter(Boolean)).size.toLocaleString("fr-CA");$("holders").textContent=new Set(B.map(x=>x.holder).filter(Boolean)).size.toLocaleString("fr-CA");$("sync").textContent=m.updated||"—";fill();render();regions();old()}
const uniq=a=>[...new Set(a.filter(Boolean))].sort((a,b)=>String(a).localeCompare(String(b),"fr"));
function fill(){let types=uniq(B.flatMap(x=>x.editorialTypes?.length?x.editorialTypes:x.types||[]));$("type").innerHTML='<option value="">Tous</option>'+types.map(x=>`<option>${esc(x)}</option>`).join("");updateCities();buildRegionMenu()}
function buildRegionMenu(){let rs=uniq(B.map(x=>x.regionName));$("regionMenu").innerHTML=`<div class="region-menu-head"><b>Sélection multiple</b><button onclick="clearRegions(event)">Tout effacer</button></div>`+rs.map(r=>`<label><input type="checkbox" value="${escAttr(r)}" ${selectedRegions.has(r)?"checked":""} onchange="regionCheck(this)"><span>${esc(r)}</span><small>${B.filter(x=>x.regionName===r).length.toLocaleString("fr-CA")}</small></label>`).join("")}
function toggleRegions(e){e.stopPropagation();$("regionMenu").classList.toggle("on")}document.addEventListener("click",e=>{if(!e.target.closest(".region-filter"))$("regionMenu")?.classList.remove("on")});
function regionCheck(el){el.checked?selectedRegions.add(el.value):selectedRegions.delete(el.value);updateRegionUI();updateCities();render();regions()}
function clearRegions(e){e?.preventDefault();e?.stopPropagation();selectedRegions.clear();buildRegionMenu();updateRegionUI();updateCities();render();regions()}
function updateRegionUI(){let n=selectedRegions.size;$("regionButton").textContent=n?`${n} région${n>1?"s":""} sélectionnée${n>1?"s":""} ▾`:"Toutes les régions ▾";$("activeRegions").innerHTML=[...selectedRegions].map(r=>`<button onclick="removeRegion('${escAttr(r)}')">${esc(r)} ×</button>`).join("")}
function removeRegion(r){selectedRegions.delete(r);buildRegionMenu();updateRegionUI();updateCities();render();regions()}
function updateCities(){let current=$("city")?.value||"",src=selectedRegions.size?B.filter(b=>selectedRegions.has(b.regionName)):B,cities=uniq(src.map(x=>x.city));$("city").innerHTML='<option value="">Toutes</option>'+cities.map(x=>`<option ${x===current?"selected":""}>${esc(x)}</option>`).join("");if(!cities.includes(current))$("city").value=""}
function filtered(){let q=$("q").value.toLowerCase(),t=$("type").value,c=$("city").value,cap=+$("capacity").value||0,s=$("sort").value;let x=B.filter(b=>(!q||[b.name,b.city,b.address,b.holder,b.neq,b.regionName].join(" ").toLowerCase().includes(q))&&(!selectedRegions.size||selectedRegions.has(b.regionName))&&(!c||b.city===c)&&(!t||(b.editorialTypes?.length?b.editorialTypes:b.types||[]).includes(t))&&(!cap||(b.capacity||0)>=cap));x.sort((u,v)=>s==="capacity"?(v.capacity||0)-(u.capacity||0):s==="confidence"?(v.confidence||0)-(u.confidence||0):s==="random"?hash(String(u.id)+randomSeed)-hash(String(v.id)+randomSeed):String(u.name||"").localeCompare(String(v.name||""),"fr"));return x}
function render(){let x=filtered();$("result").textContent=x.length.toLocaleString("fr-CA")+" résultat"+(x.length>1?"s":"");$("cards").innerHTML=x.slice(0,N).map(card).join("")||'<div class="empty">Aucun résultat avec ces filtres.</div>';$("more").style.display=x.length>N?"block":"none"}
function card(b){let cls=b.confidence>=.9?"official":b.confidence>=.7?"verified":"unknown",lab=b.confidence>=.9?"OFFICIEL":b.confidence>=.7?"ENRICHI":"À CONFIRMER";return `<article class="card" onclick="openBar('${escAttr(b.id)}')"><div class="card-glow"></div><div class="top"><h3>${esc(b.name||"Établissement")}</h3><span class="score ${cls}">${lab}</span></div><div class="place">📍 ${esc(b.city||"")} · ${esc(b.regionName||"")}</div><div class="tags">${(b.editorialTypes?.length?b.editorialTypes:b.types||[]).slice(0,3).map(t=>`<span class="tag">${esc(t)}</span>`).join("")}</div><div class="meta"><span>${b.capacity?`👥 ${Number(b.capacity).toLocaleString("fr-CA")}`:"Capacité —"}</span><strong>${b.holder?"✓ Titulaire identifié":"○ À compléter"}</strong></div></article>`}
function openBar(id){let b=B.find(x=>String(x.id)===String(id));if(!b)return;let cls=b.confidence>=.9?"official":b.confidence>=.7?"verified":"unknown";$("detail").innerHTML=`<div class="detail"><span class="eyebrow">${esc((b.editorialTypes?.length?b.editorialTypes:b.types||[]).join(" · ").toUpperCase())}</span><h2>${esc(b.name||"Établissement")}</h2><p class="sub">📍 ${esc(b.address||"")}<br>${esc(b.city||"")} · ${esc(b.postal||"")}<br>${esc(b.regionName||"")}</p><div class="row"><b>Titulaire du permis</b>${esc(b.holder||"Non indiqué")}<div class="confidence ${cls}">${b.confidence>=.9?"🟢 Donnée officielle":b.confidence>=.7?"🔵 Information enrichie":"🟡 À confirmer"}</div></div><div class="row"><b>Permis</b>${esc(b.permit||"")}<br>${b.capacity?`Capacité : ${Number(b.capacity).toLocaleString("fr-CA")} personnes`:"Capacité non indiquée"}</div><div class="row"><b>Historique</b>${b.foundedYear?`Fondé en ${b.foundedYear} · ${b.age} ans`:"Année de fondation non renseignée."}</div><div class="row"><b>Programmation</b>${b.events?Object.entries(b.events).map(([d,e])=>`<div>${esc(d)} — ${esc(e)}</div>`).join(""):"Programmation non renseignée."}</div><div class="source">Source principale : RACJ / Données Québec. Les enrichissements éditoriaux sont séparés des données officielles.</div></div>`;$("modal").classList.add("on")}
function regions(){let rs=uniq(B.map(x=>x.regionName));$("regionsGrid").innerHTML=rs.map(r=>`<div class="region ${selectedRegions.has(r)?"selected":""}" onclick="toggleRegionCard('${escAttr(r)}')"><b>${selectedRegions.has(r)?"✓ ":""}${esc(r)}</b><span>${B.filter(x=>x.regionName===r).length.toLocaleString("fr-CA")} établissements</span></div>`).join("")}
function toggleRegionCard(r){selectedRegions.has(r)?selectedRegions.delete(r):selectedRegions.add(r);buildRegionMenu();updateRegionUI();updateCities();render();regions();document.querySelector("#explorer").scrollIntoView({behavior:"smooth"})}
function old(){let x=B.filter(b=>b.foundedYear).sort((a,b)=>a.foundedYear-b.foundedYear).slice(0,6);$("old").innerHTML=x.length?x.map(card).join(""):`<div class="empty">L'ancienneté apparaîtra ici à mesure que les données historiques seront vérifiées.</div>`}
function buildRoute(){let pool=filtered(),count=+$("routeCount").value;if(!pool.length){$("route").innerHTML='<b>Aucun établissement disponible.</b><span>Élargis tes filtres pour créer une virée.</span>';return}let chosen=[],cities=new Set();for(let b of shuffle(pool)){if(chosen.length>=count)break;if(!cities.has(b.city)||pool.length<count*2){chosen.push(b);cities.add(b.city)}}for(let b of shuffle(pool)){if(chosen.length>=count)break;if(!chosen.includes(b))chosen.push(b)}$("route").className="route-list";$("route").innerHTML=chosen.map((b,i)=>`<div class="route-stop" onclick="openBar('${escAttr(b.id)}')"><span>${i+1}</span><div><b>${esc(b.name)}</b><small>${esc(b.city)} · ${esc(b.regionName)}</small></div>${i<chosen.length-1?'<i>↓</i>':''}</div>`).join("")+`<div class="route-note">🧭 Parcours découverte : ordre suggéré aléatoirement. BARO n'estime pas encore les distances routières.</div>`;$("decouverte").scrollIntoView({behavior:"smooth"})}
function goDiscovery(){document.querySelector("#decouverte").scrollIntoView({behavior:"smooth"});setTimeout(buildRoute,350)}function shuffle(a){let x=[...a];for(let i=x.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));[x[i],x[j]]=[x[j],x[i]]}return x}function hash(s){let h=0;for(let c of s)h=(h*31+c.charCodeAt(0))|0;return h}
function quick(x){$("q").value=x;render();document.querySelector("#explorer").scrollIntoView({behavior:"smooth"})}function filterTag(x){if([...$("type").options].some(o=>o.value===x))$("type").value=x;else $("q").value=x;render();document.querySelector("#explorer").scrollIntoView({behavior:"smooth"})}function more(){N+=60;render()}function closeModal(id="modal"){const el=$(id);if(el){el.classList.remove("on");el.classList.remove("show");}}function openSources(){$("detail").innerHTML=`<div class="detail"><span class="eyebrow">TRANSPARENCE</span><h2>Comment BARO construit ses fiches</h2><p class="sub">La base principale provient du registre des titulaires de permis de détaillant d'alcool de la RACJ publié sur Données Québec.</p><div class="row"><b>🟢 Couche officielle</b>Établissement, titulaire, NEQ, adresse, municipalité, région, permis et capacité lorsque disponibles.</div><div class="row"><b>🔵 Couche enrichie</b>Historique, site, téléphone, catégories éditoriales, événements et futures coordonnées GPS sont conservés comme enrichissements.</div><div class="row"><b>🧭 Itinéraires</b>Le mode Découverte utilise les établissements correspondant à tes filtres. La V4 crée une sélection, sans prétendre calculer un trajet routier optimisé.</div><div class="source">Les photos d'ambiance sont décoratives et ne représentent pas les établissements listés.</div></div>`;$("modal").classList.add("on")}function esc(x){return String(x??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]))}function escAttr(x){return esc(x).replace(/'/g,"&#39;")}init();

/* BARO V5 — couche personnelle locale */
let PROFILE=loadLocal("baroProfile",{name:"",home:""}),FAVS=new Set(loadLocal("baroFavorites",[])),TOURS=loadLocal("baroTours",[]),CURRENT_ROUTE=[];
function loadLocal(k,d){try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}}
function saveLocal(k,v){localStorage.setItem(k,JSON.stringify(v))}
function microStatus(b){let hay=[b.name,...(b.editorialTypes||[]),...(b.types||[]),b.microbrewery,b.craftBeer,b.beer].filter(Boolean).join(" ").toLowerCase();if(b.craftBeer===true||b.microbrewery===true||/microbrass|bière artisan|biere artisan/.test(hay))return "yes";if(b.craftBeer===false||b.microbrewery===false)return "no";return "unknown"}
const _filtered=filtered;filtered=function(){let x=_filtered();return $("microbeer")?.checked?x.filter(b=>microStatus(b)==="yes"):x}
const _card=card;card=function(b){let html=_card(b),st=microStatus(b),badge=st==="yes"?'<span class="beer-badge">🍺 Bières de microbrasserie</span>':st==="no"?'<span class="beer-badge unknown">🍺 Micro : non indiqué</span>':'<span class="beer-badge unknown">🍺 Micro : à vérifier</span>',fav=FAVS.has(String(b.id));return html.replace('</div><div class="meta">',badge+'</div><div class="meta">').replace('</article>',`<button class="favorite ${fav?'on':''}" onclick="event.stopPropagation();toggleFavorite('${escAttr(b.id)}')" title="Favori">${fav?'♥':'♡'}</button></article>`)}
function toggleFavorite(id){id=String(id);FAVS.has(id)?FAVS.delete(id):FAVS.add(id);saveLocal("baroFavorites",[...FAVS]);updateFavCount();render();toast(FAVS.has(id)?"Ajouté aux favoris":"Retiré des favoris")}
function updateFavCount(){let e=$("favCount");if(e)e.textContent=FAVS.size?`(${FAVS.size})`:""}
const _init=init;init=async function(){await _init();updateFavCount()}
const _openBar=openBar;openBar=function(id){_openBar(id);let b=B.find(x=>String(x.id)===String(id));if(!b)return;let st=microStatus(b),txt=st==="yes"?"🍺 Oui — indication disponible dans les données/enrichissements BARO":st==="no"?"Aucune offre microbrasserie indiquée":"À vérifier — BARO ne dispose pas encore d'une source vérifiée pour cet établissement";let d=$("detail");d.innerHTML=d.innerHTML.replace('<div class="source">',`<div class="row"><b>Bières de microbrasserie</b>${txt}<div class="micro-legend">Cette information est distincte des données officielles RACJ et doit être enrichie/vérifiée établissement par établissement.</div></div><div class="row"><b>Mon BARO</b><div class="profile-actions"><button onclick="toggleFavorite('${escAttr(id)}');openBar('${escAttr(id)}')">${FAVS.has(String(id))?'♥ Retirer des favoris':'♡ Ajouter aux favoris'}</button><button onclick="quickAddTour('${escAttr(id)}')">＋ Ajouter à une tournée</button></div></div><div class="source">`)}
const _buildRoute=buildRoute;buildRoute=function(){_buildRoute();let pool=filtered(),count=+$('routeCount').value;CURRENT_ROUTE=[];let nodes=[...document.querySelectorAll('#route .route-stop')];for(let n of nodes){let name=n.querySelector('b')?.textContent,b=B.find(x=>x.name===name);if(b)CURRENT_ROUTE.push(String(b.id))}if(CURRENT_ROUTE.length){$('route').insertAdjacentHTML('beforeend','<button onclick="saveCurrentRoute()">💾 Sauvegarder cette tournée</button>')}}
function saveCurrentRoute(){if(!CURRENT_ROUTE.length)return;let name=prompt("Nom de cette tournée",`Tournée ${TOURS.length+1}`);if(!name)return;TOURS.push({id:Date.now(),name,barIds:[...CURRENT_ROUTE],created:new Date().toISOString()});saveLocal("baroTours",TOURS);toast("Tournée sauvegardée")}
function quickAddTour(id){if(!TOURS.length){TOURS.push({id:Date.now(),name:"Ma première tournée",barIds:[String(id)],created:new Date().toISOString()})}else if(!TOURS[0].barIds.includes(String(id)))TOURS[0].barIds.push(String(id));saveLocal("baroTours",TOURS);toast("Ajouté à "+TOURS[0].name)}
function openProfile(tab="favorites"){$("detail").innerHTML=`<div class="detail"><span class="eyebrow">👤 MON BARO</span><h2>${PROFILE.name?esc(PROFILE.name):"Ton espace personnel"}</h2><p class="sub">Tes favoris et tournées sont enregistrés sur cet appareil. Aucun compte serveur n'est requis dans cette version.</p><div class="profile-tabs"><button class="${tab==='favorites'?'on':''}" onclick="openProfile('favorites')">♥ Favoris (${FAVS.size})</button><button class="${tab==='tours'?'on':''}" onclick="openProfile('tours')">🧭 Tournées (${TOURS.length})</button><button class="${tab==='settings'?'on':''}" onclick="openProfile('settings')">⚙ Profil</button></div><div id="profileContent">${profileContent(tab)}</div><div class="source">V5 : profil local au navigateur. Une future version pourra proposer une authentification cloud pour synchroniser plusieurs appareils.</div></div>`;$('modal').classList.add('on')}
function profileContent(tab){if(tab==='settings')return `<div class="profile-form"><label>Nom ou pseudo<input id="profileName" value="${escAttr(PROFILE.name||'')}" placeholder="Ex. Alex"></label><label>Ville de départ préférée<input id="profileHome" value="${escAttr(PROFILE.home||'')}" placeholder="Ex. Montréal"></label><button onclick="saveProfile()">Enregistrer mon profil</button></div>`;if(tab==='tours')return TOURS.length?`<div class="profile-list">${TOURS.map(t=>`<div class="tour-card"><div><b>${esc(t.name)}</b><small>${t.barIds.length} arrêt${t.barIds.length>1?'s':''}</small></div><div class="profile-actions"><button onclick="showTour(${t.id})">Voir</button><button onclick="deleteTour(${t.id})">Supprimer</button></div></div>`).join('')}</div><button onclick="newTour()">＋ Nouvelle tournée</button>`:'<div class="empty">Aucune tournée sauvegardée. Génère un itinéraire découverte puis sauvegarde-le.</div><button onclick="newTour()">＋ Nouvelle tournée</button>';let bars=B.filter(b=>FAVS.has(String(b.id)));return bars.length?`<div class="profile-list">${bars.map(b=>`<div class="profile-item"><div><b>${esc(b.name)}</b><small>${esc(b.city)} · ${esc(b.regionName)}</small></div><div class="profile-actions"><button onclick="openBar('${escAttr(b.id)}')">Voir</button><button onclick="quickAddTour('${escAttr(b.id)}')">＋ Tournée</button></div></div>`).join('')}</div>`:'<div class="empty">Aucun favori pour le moment. Utilise ♡ sur les fiches de bars.</div>'}
function saveProfile(){PROFILE={name:$('profileName').value.trim(),home:$('profileHome').value.trim()};saveLocal('baroProfile',PROFILE);toast('Profil enregistré');openProfile('settings')}
function newTour(){let name=prompt('Nom de la tournée',`Tournée ${TOURS.length+1}`);if(!name)return;TOURS.push({id:Date.now(),name,barIds:[],created:new Date().toISOString()});saveLocal('baroTours',TOURS);openProfile('tours')}
function deleteTour(id){TOURS=TOURS.filter(t=>t.id!==id);saveLocal('baroTours',TOURS);openProfile('tours')}
function showTour(id){let t=TOURS.find(x=>x.id===id);if(!t)return;let bars=t.barIds.map(id=>B.find(b=>String(b.id)===String(id))).filter(Boolean);$('profileContent').innerHTML=`<button onclick="openProfile('tours')">← Mes tournées</button><h3>${esc(t.name)}</h3><div class="profile-list">${bars.map((b,i)=>`<div class="profile-item"><div><b>${i+1}. ${esc(b.name)}</b><small>${esc(b.city)} · ${esc(b.regionName)}</small></div><button onclick="openBar('${escAttr(b.id)}')">Voir</button></div>`).join('')||'<div class="empty">Tournée vide.</div>'}</div>`}
function toast(s){let t=$('toast');t.innerHTML=`<div class="saved-toast">${esc(s)}</div>`;setTimeout(()=>t.innerHTML='',1800)}

/* BARO V6 — cartes externes, partage et gestion avancée des tournées */
function placeText(b){return [b.name,b.address,b.city,'Québec'].filter(Boolean).join(', ')}
function mapsSearch(id){let b=B.find(x=>String(x.id)===String(id));if(!b)return;window.open('https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(placeText(b)),'_blank','noopener')}
function openTourMaps(ids){let bars=ids.map(id=>B.find(b=>String(b.id)===String(id))).filter(Boolean);if(!bars.length)return;if(bars.length===1)return mapsSearch(bars[0].id);let origin=placeText(bars[0]),destination=placeText(bars[bars.length-1]),mid=bars.slice(1,-1).slice(0,3).map(placeText);let url='https://www.google.com/maps/dir/?api=1&origin='+encodeURIComponent(origin)+'&destination='+encodeURIComponent(destination)+'&travelmode=walking';if(mid.length)url+='&waypoints='+mid.map(encodeURIComponent).join('%7C');window.open(url,'_blank','noopener')}
function shareTour(id){let t=TOURS.find(x=>x.id===id);if(!t)return;let bars=t.barIds.map(id=>B.find(b=>String(b.id)===String(id))).filter(Boolean),txt='🍻 '+t.name+' — BARO\n'+bars.map((b,i)=>`${i+1}. ${b.name} — ${b.city}`).join('\n');if(navigator.share)navigator.share({title:t.name,text:txt}).catch(()=>{});else navigator.clipboard?.writeText(txt).then(()=>toast('Tournée copiée'))}
function renameTour(id){let t=TOURS.find(x=>x.id===id);if(!t)return;let n=prompt('Nouveau nom',t.name);if(!n)return;t.name=n.trim()||t.name;saveLocal('baroTours',TOURS);openProfile('tours')}
const _showTourV5=showTour;showTour=function(id){let t=TOURS.find(x=>x.id===id);if(!t)return;let bars=t.barIds.map(id=>B.find(b=>String(b.id)===String(id))).filter(Boolean);$('profileContent').innerHTML=`<button onclick="openProfile('tours')">← Mes tournées</button><h3>${esc(t.name)}</h3><div class="tour-toolbar"><button onclick="openTourMaps(${JSON.stringify(t.barIds).replace(/"/g,'&quot;')})">🗺️ Ouvrir dans Google Maps</button><button onclick="shareTour(${t.id})">↗ Partager</button><button onclick="renameTour(${t.id})">✎ Renommer</button></div><div class="profile-list">${bars.map((b,i)=>`<div class="profile-item"><div><b>${i+1}. ${esc(b.name)}</b><small>${esc(b.city)} · ${esc(b.regionName)}</small></div><div class="profile-actions"><button onclick="mapsSearch('${escAttr(b.id)}')">📍 Carte</button><button onclick="openBar('${escAttr(b.id)}')">Voir</button><button onclick="removeFromTour(${t.id},'${escAttr(b.id)}')">×</button></div></div>`).join('')||'<div class="empty">Tournée vide.</div>'}</div>`}
function removeFromTour(tid,bid){let t=TOURS.find(x=>x.id===tid);if(!t)return;t.barIds=t.barIds.filter(x=>String(x)!==String(bid));saveLocal('baroTours',TOURS);showTour(tid)}
const _openBarV5=openBar;openBar=function(id){_openBarV5(id);let d=$('detail');if(d)d.innerHTML=d.innerHTML.replace('<div class="source">',`<div class="row"><b>Carte & sortie</b><div class="profile-actions"><button onclick="mapsSearch('${escAttr(id)}')">📍 Voir dans Google Maps</button></div></div><div class="source">`)}
const _buildRouteV5=buildRoute;buildRoute=function(){_buildRouteV5();if(CURRENT_ROUTE.length)$('route').insertAdjacentHTML('beforeend',`<button onclick='openTourMaps(${JSON.stringify(CURRENT_ROUTE)})'>🗺️ Ouvrir le parcours dans Google Maps</button>`)}


const BARO_THEMES=[{"id": "afterhours", "name": "After Hours", "bg": "#09070c", "accent": "#ffbd38", "accent2": "#ff477e"}, {"id": "neon", "name": "Néon Montréal", "bg": "#080b18", "accent": "#00e5ff", "accent2": "#ff3df2"}, {"id": "speakeasy", "name": "Speakeasy", "bg": "#100c08", "accent": "#d6a85f", "accent2": "#7b2d26"}, {"id": "irish", "name": "Pub irlandais", "bg": "#07130d", "accent": "#78c56b", "accent2": "#e2b95f"}, {"id": "tiki", "name": "Tiki", "bg": "#071716", "accent": "#35d0ba", "accent2": "#ff8b4a"}, {"id": "rooftop", "name": "Rooftop", "bg": "#0c1320", "accent": "#ffcc70", "accent2": "#7ab8ff"}, {"id": "jazz", "name": "Jazz Club", "bg": "#100811", "accent": "#d59bff", "accent2": "#f0b34f"}, {"id": "rock", "name": "Rock Bar", "bg": "#0b0b0b", "accent": "#f04c4c", "accent2": "#c6c6c6"}, {"id": "country", "name": "Country", "bg": "#171009", "accent": "#d89a52", "accent2": "#70a06a"}, {"id": "disco", "name": "Disco", "bg": "#13091b", "accent": "#ff4fd8", "accent2": "#7d5cff"}, {"id": "retro80", "name": "Années 80", "bg": "#090d24", "accent": "#00f0ff", "accent2": "#ff2fa5"}, {"id": "retro90", "name": "Années 90", "bg": "#15112a", "accent": "#a8ff60", "accent2": "#ff6cc7"}, {"id": "arcade", "name": "Arcade", "bg": "#080814", "accent": "#6cffea", "accent2": "#a95cff"}, {"id": "sports", "name": "Sports Bar", "bg": "#07151b", "accent": "#53d3ff", "accent2": "#67e06f"}, {"id": "micro", "name": "Microbrasserie", "bg": "#11140b", "accent": "#e0a83b", "accent2": "#7eb35c"}, {"id": "chalet", "name": "Chalet", "bg": "#18110d", "accent": "#efb46b", "accent2": "#a35b3d"}, {"id": "winter", "name": "Après-ski", "bg": "#0b1621", "accent": "#a9dcff", "accent2": "#f5f7ff"}, {"id": "beach", "name": "Beach Bar", "bg": "#061b21", "accent": "#54dfd0", "accent2": "#ffd166"}, {"id": "latin", "name": "Latin Night", "bg": "#210a0d", "accent": "#ff6b35", "accent2": "#ffd23f"}, {"id": "electro", "name": "Électro", "bg": "#090818", "accent": "#735cff", "accent2": "#20f7d4"}, {"id": "house", "name": "House", "bg": "#0b1016", "accent": "#f7d154", "accent2": "#5b8cff"}, {"id": "techno", "name": "Techno", "bg": "#080808", "accent": "#d9ff3f", "accent2": "#b3b3b3"}, {"id": "punk", "name": "Punk", "bg": "#111111", "accent": "#ff334f", "accent2": "#f3f3f3"}, {"id": "metal", "name": "Metal", "bg": "#080808", "accent": "#c6c6c6", "accent2": "#8b1e2d"}, {"id": "bourbon", "name": "Bourbon", "bg": "#1a0e08", "accent": "#e4a04a", "accent2": "#8d3d24"}, {"id": "wine", "name": "Bar à vin", "bg": "#170b11", "accent": "#e0819d", "accent2": "#c7a56b"}, {"id": "cocktail", "name": "Cocktail", "bg": "#100b18", "accent": "#ff86c8", "accent2": "#7ee4d6"}, {"id": "lounge", "name": "Lounge", "bg": "#0b1015", "accent": "#b99cff", "accent2": "#65d5cf"}, {"id": "quebec", "name": "Québec bleu", "bg": "#071224", "accent": "#6fb6ff", "accent2": "#f2c14e"}, {"id": "festival", "name": "Festival", "bg": "#120a1d", "accent": "#ffbd38", "accent2": "#ff477e"}];
function applyTheme(id,save=true){
  const t=BARO_THEMES.find(x=>x.id===id)||BARO_THEMES[0];
  document.documentElement.style.setProperty("--bg",t.bg);
  document.documentElement.style.setProperty("--gold",t.accent);
  document.documentElement.style.setProperty("--pink",t.accent2);
  document.body.dataset.theme=t.id;
  if(save)localStorage.setItem("baroTheme",t.id);
  document.querySelectorAll(".theme-card").forEach(x=>x.classList.toggle("active",x.dataset.theme===t.id));
}
function openThemes(){
  $("themeGrid").innerHTML=BARO_THEMES.map(t=>`<button class="theme-card" data-theme="${t.id}" onclick="applyTheme('${t.id}')"><span class="theme-preview" style="background:linear-gradient(135deg,${t.bg},${t.accent} 55%,${t.accent2})"></span><b>${esc(t.name)}</b><small>${t.id==="afterhours"?"BARO original":"Ambiance "+esc(t.name)}</small></button>`).join("");
  applyTheme(localStorage.getItem("baroTheme")||"afterhours",false); $("themeModal").classList.add("on");
}
function youtubePlaylistId(v){
  try { const u=new URL(v); const id=u.searchParams.get("list"); if(id)return id; }
  catch(e){}
  const raw=String(v||"").trim();
  return /^PL[\w-]+$/.test(raw)?raw:"";
}
function loadYouTubePlaylist(){
  const raw=$("ytUrl").value.trim(), id=youtubePlaylistId(raw);
  if(!id){ $("ytStatus").textContent="Adresse non reconnue. Colle une URL de playlist YouTube contenant « list=… »."; return; }
  localStorage.setItem("baroYouTubePlaylist",JSON.stringify({url:raw,id}));
  renderYouTube(id); $("ytStatus").textContent="Playlist chargée ✓";
}
function renderYouTube(id){
  $("ytPlayerWrap").innerHTML=`<iframe title="Playlist YouTube BARO" src="https://www.youtube.com/embed?listType=playlist&list=${encodeURIComponent(id)}&playsinline=1" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`;
}
function restoreYouTubePlaylist(){
  try{const p=JSON.parse(localStorage.getItem("baroYouTubePlaylist")||"null");if(p?.id){$("ytUrl").value=p.url||p.id;renderYouTube(p.id);$("ytStatus").textContent="Playlist BARO sauvegardée ✓";}}catch(e){}
}
function clearYouTubePlaylist(){localStorage.removeItem("baroYouTubePlaylist");$("ytUrl").value="";$("ytStatus").textContent="Aucune playlist chargée.";$("ytPlayerWrap").innerHTML='<div class="jukebox-empty">♫<br><small>Ta playlist apparaîtra ici</small></div>';}
function openYouTubePlaylist(){try{const p=JSON.parse(localStorage.getItem("baroYouTubePlaylist")||"null");if(p?.url)window.open(p.url,"_blank","noopener");}catch(e){}}
applyTheme(localStorage.getItem("baroTheme")||"afterhours",false);


function musicLibrary(){try{return JSON.parse(localStorage.getItem("baroMusicLibrary")||"[]")}catch(e){return []}}
function saveMusicLibrary(x){localStorage.setItem("baroMusicLibrary",JSON.stringify(x))}
function setMusicMood(m){$("playlistMood").value=m}
function saveYouTubePlaylist(){
 const url=$("ytUrl").value.trim(),id=youtubePlaylistId(url); if(!id){$("ytStatus").textContent="URL de playlist YouTube non reconnue.";return}
 const name=$("playlistName").value.trim()||("Playlist "+(musicLibrary().length+1)),mood=$("playlistMood").value;
 let a=musicLibrary();a.push({key:Date.now(),name,mood,url,id});saveMusicLibrary(a);localStorage.setItem("baroActivePlaylist",String(a[a.length-1].key));renderPlaylistLibrary();playSavedPlaylist(a[a.length-1].key)
}
function renderPlaylistLibrary(){
 let a=musicLibrary(),active=localStorage.getItem("baroActivePlaylist");
 $("playlistLibrary").innerHTML=a.length?a.map(p=>`<div class="playlist-row ${String(p.key)===active?"active":""}"><button class="playlist-main" onclick="playSavedPlaylist(${p.key})"><b>▶ ${esc(p.name)}</b><small>${esc(p.mood)}</small></button><button title="Associer à la tournée active" onclick="attachPlaylistToCurrentTour(${p.key})">🧭</button><button title="Supprimer" onclick="deletePlaylist(${p.key})">×</button></div>`).join(""):'<div class="empty-music">Aucune playlist sauvegardée. Ajoute ta première ambiance BARO.</div>'
}
function playSavedPlaylist(k){let p=musicLibrary().find(x=>x.key===k);if(!p)return;localStorage.setItem("baroActivePlaylist",String(k));localStorage.setItem("baroYouTubePlaylist",JSON.stringify(p));renderYouTube(p.id);$("ytStatus").textContent=`${p.name} · ${p.mood}`;renderPlaylistLibrary()}
function deletePlaylist(k){let a=musicLibrary().filter(x=>x.key!==k);saveMusicLibrary(a);if(localStorage.getItem("baroActivePlaylist")===String(k)){localStorage.removeItem("baroActivePlaylist");stopYouTube()}renderPlaylistLibrary()}
function stopYouTube(){$("ytPlayerWrap").innerHTML='<div class="jukebox-empty">♫<br><small>Lecture arrêtée</small></div>'}
function attachPlaylistToCurrentTour(k){
 let p=musicLibrary().find(x=>x.key===k);if(!p)return;
 let tours;try{tours=JSON.parse(localStorage.getItem("baroTours")||"[]")}catch(e){tours=[]}
 if(!tours.length){$("ytStatus").textContent="Crée d’abord une tournée dans Mon BARO.";return}
 let idx=tours.length-1;tours[idx].playlistKey=k;tours[idx].playlistName=p.name;localStorage.setItem("baroTours",JSON.stringify(tours));$("ytStatus").textContent=`♫ ${p.name} associée à « ${tours[idx].name||"ta tournée"} » ✓`
}
function openMusic(){ $("musicModal").classList.add("on");renderPlaylistLibrary();let k=localStorage.getItem("baroActivePlaylist");if(k)playSavedPlaylist(Number(k));}


let baroMap,baroMarkers=[],myLocation=null;
function initBaroMap(){if(!window.L||baroMap)return;baroMap=L.map("baroMap").setView([46.8,-71.8],6);L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:18,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'}).addTo(baroMap)}
function locateMe(){initBaroMap();if(!navigator.geolocation){alert("Géolocalisation non disponible.");return}navigator.geolocation.getCurrentPosition(p=>{myLocation=[p.coords.latitude,p.coords.longitude];L.marker(myLocation).addTo(baroMap).bindPopup("📍 Ma position").openPopup();baroMap.setView(myLocation,13)},()=>alert("BARO n’a pas reçu l’autorisation d’utiliser ta position."),{enableHighAccuracy:true,timeout:10000})}
function mapCurrentDiscovery(){initBaroMap();let items=[];try{items=JSON.parse(localStorage.getItem("baroLastDiscovery")||"[]")}catch(e){}if(!items.length){document.querySelector("#decouverte")?.scrollIntoView({behavior:"smooth"});alert("Génère d’abord un itinéraire Découverte. Les étapes seront ensuite prêtes pour la carte.");return}alert("La carte V9 est prête. Les coordonnées exactes seront ajoutées progressivement à la base BARO; les étapes sans GPS continuent de fonctionner via Google Maps par adresse.")}
function openPlanner(){$("plannerModal").classList.add("on");let d=new Date();$("planStart").value=d.toISOString().slice(0,10);let e=new Date(d);e.setDate(e.getDate()+7);$("planEnd").value=e.toISOString().slice(0,10)}
function createLongPlan(){
 let s=new Date($("planStart").value+"T12:00:00"),e=new Date($("planEnd").value+"T12:00:00");if(isNaN(s)||isNaN(e)||e<s){$("planPreview").textContent="Choisis une période valide.";return}
 let cadence=$("planCadence").value,dates=[],d=new Date(s),guard=0;
 while(d<=e&&guard++<400){let ok=cadence==="daily"||(cadence==="weekends"&&(d.getDay()===0||d.getDay()===6))||(cadence==="weekly"&&d.getDay()===s.getDay())||(cadence==="monthly"&&d.getDate()===s.getDate());if(ok)dates.push(new Date(d));d.setDate(d.getDate()+1)}
 let name=$("planName").value.trim()||"Roadtrip BARO",plans;try{plans=JSON.parse(localStorage.getItem("baroLongPlans")||"[]")}catch(x){plans=[]}
 let plan={id:Date.now(),name,start:$("planStart").value,end:$("planEnd").value,cadence,dates:dates.map(x=>x.toISOString().slice(0,10))};plans.push(plan);localStorage.setItem("baroLongPlans",JSON.stringify(plans));
 $("planPreview").innerHTML=`<h3>${esc(name)}</h3><p>${dates.length} sortie${dates.length>1?"s":""} planifiée${dates.length>1?"s":""}</p><div class="date-chips">${dates.slice(0,40).map(x=>`<span>${x.toLocaleDateString("fr-CA",{day:"numeric",month:"short",year:"numeric"})}</span>`).join("")}</div>${dates.length>40?"<small>… et "+(dates.length-40)+" autres dates</small>":""}`
}
document.addEventListener("DOMContentLoaded",()=>setTimeout(initBaroMap,250));


let mappedBars=[];
function barQuery(b){return [b.name,b.address,b.city,b.postal,"Québec","Canada"].filter(Boolean).join(", ")}
function pseudoCoord(b){
 /* Approximation municipale uniquement pour visualisation; jamais présentée comme coordonnée officielle d'un établissement. */
 const centers={"Montréal":[45.5019,-73.5674],"Québec":[46.8139,-71.2080],"Laval":[45.6066,-73.7124],"Gatineau":[45.4765,-75.7013],"Sherbrooke":[45.4042,-71.8929],"Trois-Rivières":[46.3430,-72.5430],"Saguenay":[48.4284,-71.0685],"Lévis":[46.7382,-71.2465],"Drummondville":[45.8839,-72.4843]};
 return centers[b.city]||null
}
function filteredForMap(){
 try{if(typeof filtered==="function")return filtered().slice(0,250)}catch(e){}
 let q=($("q")?.value||"").toLowerCase();return B.filter(b=>!q||JSON.stringify(b).toLowerCase().includes(q)).slice(0,250)
}
function clearBaroMarkers(){baroMarkers.forEach(m=>baroMap.removeLayer(m));baroMarkers=[]}
function mapFilteredBars(){
 initBaroMap();clearBaroMarkers();mappedBars=[];let bounds=[];
 filteredForMap().forEach(b=>{let c=(b.lat&&b.lon)?[b.lat,b.lon]:pseudoCoord(b);if(!c)return;let exact=!!(b.lat&&b.lon),m=L.marker(c).addTo(baroMap).bindPopup(`<b>${esc(b.name)}</b><br>${esc(b.city||"")}<br><small>${exact?"Coordonnée BARO":"Position municipale approximative"}</small><br><a target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(barQuery(b))}">Ouvrir l’adresse ↗</a>`);baroMarkers.push(m);mappedBars.push({...b,_coord:c,_exact:exact});bounds.push(c)});
 if(bounds.length)baroMap.fitBounds(bounds,{padding:[25,25],maxZoom:13});else alert("Aucun établissement cartographiable dans cette sélection.")
}
function hav(a,b){const R=6371,d=Math.PI/180,dla=(b[0]-a[0])*d,dlo=(b[1]-a[1])*d,x=Math.sin(dla/2)**2+Math.cos(a[0]*d)*Math.cos(b[0]*d)*Math.sin(dlo/2)**2;return 2*R*Math.asin(Math.sqrt(x))}
function optimizeMappedRoute(){
 if(mappedBars.length<2){mapFilteredBars();if(mappedBars.length<2)return}
 let remaining=[...mappedBars],start=myLocation||remaining[0]._coord,ordered=[],cur=start,total=0;
 while(remaining.length){remaining.sort((a,b)=>hav(cur,a._coord)-hav(cur,b._coord));let n=remaining.shift();total+=hav(cur,n._coord);ordered.push(n);cur=n._coord}
 mappedBars=ordered;clearBaroMarkers();let pts=[];ordered.forEach((b,i)=>{let m=L.marker(b._coord).addTo(baroMap).bindPopup(`<b>${i+1}. ${esc(b.name)}</b><br>${esc(b.city||"")}`);baroMarkers.push(m);pts.push(b._coord)});if(myLocation)pts.unshift(myLocation);let line=L.polyline(pts,{weight:4,opacity:.7}).addTo(baroMap);baroMarkers.push(line);baroMap.fitBounds(line.getBounds(),{padding:[25,25]});alert(`Parcours réordonné par proximité approximative · ${total.toFixed(1)} km à vol d’oiseau. Pour la navigation routière réelle, ouvre les étapes dans Google Maps.`)
}


let enrichFilter="";
function toggleEnrichFilter(x){enrichFilter=enrichFilter===x?"":x;render()}
function enrichmentMatch(b){if(!enrichFilter)return true;if(enrichFilter==="craft")return b.craftBeer===true;if(enrichFilter==="live")return b.liveMusic===true;if(enrichFilter==="hours")return !!b.openingHours;return true}
function openEnrichment(){let craft=B.filter(x=>x.craftBeer===true).length,live=B.filter(x=>x.liveMusic===true).length,hours=B.filter(x=>x.openingHours).length,web=B.filter(x=>x.website).length;$("enrichStats").innerHTML=`<div><b>${craft}</b><span>🍺 craft</span></div><div><b>${live}</b><span>🎸 live</span></div><div><b>${hours}</b><span>🕒 horaires</span></div><div><b>${web}</b><span>🌐 sites</span></div>`;$("enrichModal").classList.add("on")}

function openOsmInfo(){$("osmModal").classList.add("on")}


let radioOn=false,radioTimer=null,radioIndex=0;
const RADIO_BLOCKS=[
 {h:[6,10],show:"☕ Réveil BARO",line:"Café, lendemain de veille et découvertes tranquilles.",mood:"Chill"},
 {h:[10,16],show:"🍺 BARO de jour",line:"Terrasses, microbrasseries et bonnes adresses.",mood:"Québécois"},
 {h:[16,19],show:"🥂 L’Apéro BARO",line:"Le Québec se prépare à sortir.",mood:"Party"},
 {h:[19,22],show:"🎙️ BARO Prime",line:"Les tournées commencent. Monte le son.",mood:"Rock"},
 {h:[22,24],show:"🔥 BARO Nuit",line:"Animation et musique de l’heure.",mood:"Électro"},
 {h:[0,3],show:"🌙 After BARO",line:"La nuit continue.",mood:"Party"},
 {h:[3,6],show:"🌌 Dernier verre",line:"Ambiance nocturne plus douce.",mood:"Chill"}
];
function currentRadioBlock(){let h=new Date().getHours();return RADIO_BLOCKS.find(x=>x.h[0]<=h&&h<x.h[1])||RADIO_BLOCKS[0]}
function radioPlaylistForMood(m){let a=musicLibrary();return a.find(x=>x.mood===m)||a[0]}
function updateRadio(){
 let b=currentRadioBlock(),now=new Date();$("radioClock").textContent=now.toLocaleTimeString("fr-CA",{hour:"2-digit",minute:"2-digit"})+" · "+now.toLocaleDateString("fr-CA",{weekday:"long",day:"numeric",month:"long"});
 $("radioShow").textContent=b.show;$("radioLine").textContent=b.line;$("radioMiniText").textContent=b.show.replace(/^[^ ]+ /,"");
 $("radioSchedule").innerHTML=RADIO_BLOCKS.map(x=>`<div class="radio-slot ${x===b?"active":""}"><b>${String(x.h[0]).padStart(2,"0")}h–${String(x.h[1]).padStart(2,"0")}h</b><span>${x.show}</span><small>${x.mood}</small></div>`).join("");
}
function openRadio(){$("radioModal").classList.add("on");updateRadio()}
function startRadio(){
 let b=currentRadioBlock(),p=radioPlaylistForMood(b.mood);radioOn=true;$("radioMini").hidden=false;$("radioPlay").textContent="⏸ Pause";$("radioMiniPlay").textContent="⏸";
 if(p){$("radioPlayer").innerHTML=`<iframe allow="autoplay; encrypted-media" allowfullscreen src="https://www.youtube.com/embed?listType=playlist&list=${encodeURIComponent(p.id)}&playsinline=1&autoplay=1"></iframe>`}
 else {$("radioPlayer").innerHTML='<div class="radio-empty">♫ Ajoute une playlist dans BARO Jukebox pour donner une bande-son à Radio BARO Live.</div>'}
 updateRadio();clearInterval(radioTimer);radioTimer=setInterval(updateRadio,30000)
}
function stopRadio(){radioOn=false;$("radioPlayer").innerHTML="";$("radioPlay").textContent="▶ Lancer Radio BARO";$("radioMiniPlay").textContent="▶";clearInterval(radioTimer)}
function toggleRadio(){radioOn?stopRadio():startRadio()}
function nextRadioBlock(){radioIndex=(radioIndex+1)%RADIO_BLOCKS.length;let target=RADIO_BLOCKS[radioIndex],p=radioPlaylistForMood(target.mood);$("radioShow").textContent=target.show;$("radioLine").textContent=target.line;if(p){$("radioPlayer").innerHTML=`<iframe allow="autoplay; encrypted-media" allowfullscreen src="https://www.youtube.com/embed?listType=playlist&list=${encodeURIComponent(p.id)}&playsinline=1&autoplay=1"></iframe>`}}


let baroVoice=localStorage.getItem("baroVoice")!=="off";
function toggleVoice(){baroVoice=!baroVoice;localStorage.setItem("baroVoice",baroVoice?"on":"off");$("voiceBtn").textContent=baroVoice?"🔊 Voix : ON":"🔇 Voix : OFF"}
function baroCity(){let p={};try{p=JSON.parse(localStorage.getItem("baroProfile")||"{}")}catch(e){}return p.city||p.startCity||"Québec"}
function baroPick(){
 let city=baroCity(),pool=B.filter(x=>!city||city==="Québec"||x.city===city);if(!pool.length)pool=B;
 return pool.length?pool[Math.floor(Math.random()*Math.min(pool.length,80))]:null
}
function hostText(){
 let b=currentRadioBlock(),city=baroCity(),pick=baroPick(),h=new Date().getHours(),lead=h>=16?"La soirée prend forme":"On prépare la prochaine sortie";
 let craft=pick&&pick.craftBeer===true?" La fiche BARO indique aussi une offre craft enrichie.":"";
 return `${lead} à ${city}. ${b.line}${pick?` Côté découverte, garde un œil sur ${pick.name}${pick.city?" à "+pick.city:""}.`:""}${craft}`;
}
function speakBaro(t){
 if(!baroVoice||!("speechSynthesis" in window))return;
 speechSynthesis.cancel();let u=new SpeechSynthesisUtterance(t);u.lang="fr-CA";u.rate=.98;u.pitch=.92;speechSynthesis.speak(u)
}
function baroAnnounce(){
 let t=hostText(),p=baroPick();$("hostSpeech").textContent=t;$("hostCity").textContent=baroCity();$("hostMoment").textContent=currentRadioBlock().show.replace(/^[^ ]+ /,"");$("hostPick").textContent=p?p.name:"À découvrir";speakBaro(t)
}
const _startRadio=startRadio;startRadio=function(){_startRadio();baroAnnounce()}
document.addEventListener("DOMContentLoaded",()=>{setTimeout(()=>{if($("voiceBtn"))$("voiceBtn").textContent=baroVoice?"🔊 Voix : ON":"🔇 Voix : OFF"},400)})


const BARO_CITY_COORDS={"Montréal":[45.5019,-73.5674],"Québec":[46.8139,-71.2080],"Laval":[45.6066,-73.7124],"Gatineau":[45.4765,-75.7013],"Sherbrooke":[45.4042,-71.8929],"Trois-Rivières":[46.3430,-72.5430],"Saguenay":[48.4284,-71.0685],"Lévis":[46.7382,-71.2465],"Drummondville":[45.8839,-72.4843]};
let baroWeather=null;
async function refreshBaroLive(){
 let city=baroCity(),c=BARO_CITY_COORDS[city];renderTonight(city);renderLiveEvents(city);
 if(!c){$("liveWeather").textContent=`${city} · météo non configurée`;$("liveWeatherDetail").textContent="La météo n’est pas devinée : BARO attend des coordonnées fiables pour cette ville.";return}
 $("liveWeather").textContent="Chargement…";
 try{
  let u=`https://api.open-meteo.com/v1/forecast?latitude=${c[0]}&longitude=${c[1]}&current=temperature_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&hourly=precipitation_probability&forecast_days=1&timezone=auto`;
  let r=await fetch(u);if(!r.ok)throw Error("HTTP "+r.status);let d=await r.json(),w=d.current||{};baroWeather={city,...w};
  let icon=weatherIcon(w.weather_code);$("liveWeather").textContent=`${icon} ${city} · ${Math.round(w.temperature_2m)} °C`;
  $("liveWeatherDetail").textContent=`Ressenti ${Math.round(w.apparent_temperature)} °C · vent ${Math.round(w.wind_speed_10m)} km/h · précipitations ${w.precipitation??0} mm`;
 }catch(e){$("liveWeather").textContent=`${city} · météo indisponible`;$("liveWeatherDetail").textContent="La source météo n’a pas répondu. Les autres fonctions BARO restent disponibles."}
}
function weatherIcon(c){if(c==null)return"🌦️";if(c===0)return"☀️";if(c<=3)return"⛅";if([45,48].includes(c))return"🌫️";if(c>=51&&c<=67)return"🌧️";if(c>=71&&c<=77)return"🌨️";if(c>=80&&c<=82)return"🌦️";if(c>=95)return"⛈️";return"🌦️"}
function renderTonight(city){
 let p=B.filter(x=>city==="Québec"||x.city===city);p.sort((a,b)=>(b.liveMusic===true)-(a.liveMusic===true)||(b.craftBeer===true)-(a.craftBeer===true));
 $("tonightBars").innerHTML=p.slice(0,4).map(x=>`<button class="tonight-row" onclick="openBar('${x.id}')"><b>${esc(x.name)}</b><span>${x.liveMusic===true?"🎸 Live ":""}${x.craftBeer===true?"🍺 Craft":""}</span></button>`).join("")||"<p>Aucun résultat dans cette ville.</p>"
}
function renderLiveEvents(city){
 let ev=[];try{ev=JSON.parse(localStorage.getItem("baroVerifiedEvents")||"[]")}catch(e){}
 ev=ev.filter(x=>!x.city||x.city===city);$("liveEvents").innerHTML=ev.length?ev.slice(0,5).map(x=>`<div class="event-row"><b>${esc(x.title)}</b><span>${esc(x.venue||"")} · ${esc(x.date||"")}</span></div>`).join(""):"Aucun événement vérifié chargé pour l’instant."
}
const _hostText=hostText;hostText=function(){let t=_hostText();if(baroWeather)t+=` Côté météo à ${baroWeather.city}, il fait ${Math.round(baroWeather.temperature_2m)} degrés, ressenti ${Math.round(baroWeather.apparent_temperature)}.`;return t}
document.addEventListener("DOMContentLoaded",()=>setTimeout(refreshBaroLive,650));


function nightScore(b,mood){
 let s=Math.random()*1.5;if(b.city===baroCity())s+=4;if(b.liveMusic===true)s+=(mood==="live"?7:2);if(b.craftBeer===true)s+=(mood==="craft"?7:2);if(b.openingHours)s+=1;if(b.website)s+=.5;
 if(mood==="chill"&&b.capacity&&b.capacity<150)s+=2;if(mood==="party"&&b.capacity&&b.capacity>150)s+=2;
 if(baroWeather&&baroWeather.precipitation>0&&b.city===baroWeather.city)s+=.5;
 return s
}
function makeNightPlans(mood){
 let city=baroCity(),pool=B.filter(b=>city==="Québec"||b.city===city);if(pool.length<6)pool=B.filter(b=>b.regionName==="Montréal"||b.regionName==="Capitale-Nationale"||b.city===city);if(!pool.length)pool=B;
 pool=[...pool].sort((a,b)=>nightScore(b,mood)-nightScore(a,mood)).slice(0,18);
 let names=mood==="craft"?["La tournée houblonnée","Craft & découvertes","Le circuit des pintes"]:mood==="live"?["La soirée live","Scène & dernier verre","BARO en musique"]:mood==="chill"?["Soirée tranquille","Verres & conversation","Le BARO doux"]:mood==="party"?["La grosse soirée","BARO Prime","La nuit commence ici"]:["Le choix BARO","La virée surprise","Carte blanche"];
 let plans=[0,1,2].map((n)=>({name:names[n],bars:pool.slice(n*3,n*3+3)})).filter(p=>p.bars.length);
 $("nightPlans").innerHTML=plans.map((p,i)=>`<article class="night-plan"><div class="night-head"><span>PLAN ${i+1}</span><h3>${p.name}</h3><small>${city} · ${weatherNightHint()}</small></div>${p.bars.map((b,j)=>`<button class="night-stop" onclick="openBar('${b.id}')"><i>${j+1}</i><span><b>${esc(b.name)}</b><small>${esc(b.city||"")} ${b.liveMusic===true?" · 🎸":""}${b.craftBeer===true?" · 🍺":""}</small></span></button>`).join("")}<div class="night-actions"><button onclick='saveNightPlan(${JSON.stringify(p.bars.map(b=>b.id))},"${p.name.replaceAll('"',"&quot;")}")'>♡ Sauvegarder</button><button onclick='openNightRoute(${JSON.stringify(p.bars.map(b=>b.id))})'>↗ Itinéraire</button></div></article>`).join("")
}
function weatherNightHint(){if(!baroWeather)return"météo en attente";if((baroWeather.precipitation||0)>0)return"🌧️ plan adapté à une soirée humide";if((baroWeather.temperature_2m||0)>=18)return"🌤️ belle soirée pour sortir";return`🌡️ ${Math.round(baroWeather.temperature_2m)} °C`}
function idsBars(ids){return ids.map(id=>B.find(b=>String(b.id)===String(id))).filter(Boolean)}
function saveNightPlan(ids,name){let bars=idsBars(ids),tours;try{tours=JSON.parse(localStorage.getItem("baroTours")||"[]")}catch(e){tours=[]}tours.push({id:Date.now(),name,bars:bars.map(b=>b.id),created:new Date().toISOString(),source:"BARO Match"});localStorage.setItem("baroTours",JSON.stringify(tours));alert(`« ${name} » sauvegardé dans tes tournées BARO.`)}
function openNightRoute(ids){let bars=idsBars(ids);if(!bars.length)return;let dest=encodeURIComponent(barQuery(bars[bars.length-1])),way=bars.slice(0,-1).map(b=>encodeURIComponent(barQuery(b))).join("%7C");window.open(`https://www.google.com/maps/dir/?api=1&destination=${dest}${way?"&waypoints="+way:""}`,"_blank","noopener")}


// ===== BARO JUKEBOX 3.0 =====
const BARO_MUSIC_STYLES = [
 ["Party","party hits playlist"],["Rock","rock classics playlist"],["Québécois","musique québécoise playlist"],
 ["Country","country party playlist"],["Électro","electro house playlist"],["Latino","latin party playlist"],
 ["Jazz","jazz bar playlist"],["Lounge","lounge chill playlist"],["Années 80","80s party playlist"],
 ["Années 90","90s party playlist"],["Punk / Metal","punk metal playlist"],["Après-ski","apres ski party playlist"]
];
let baroMusicStyle=localStorage.getItem("baroMusicStyle")||"Party";

function openMusic(){
 const el=$("jukeboxHome");
 if(!el) return;
 el.classList.remove("minimized");
 $("jukeboxMini")?.classList.remove("on");
 $("jukeboxBody").style.display="";
 $("jukeboxMinBtn").textContent="Réduire ↓";
 renderBaroMusicStyles(); renderPlaylistLibrary();
 el.scrollIntoView({behavior:"smooth",block:"start"});
}
function toggleJukeboxMinimize(force){
 const home=$("jukeboxHome"), mini=$("jukeboxMini"), body=$("jukeboxBody");
 if(!home||!mini||!body)return;
 const minimize=typeof force==="boolean"?force:!home.classList.contains("minimized");
 home.classList.toggle("minimized",minimize);
 body.style.display=minimize?"none":"";
 mini.classList.toggle("on",minimize);
 $("jukeboxMinBtn").textContent=minimize?"Agrandir ↑":"Réduire ↓";
 if(!minimize) home.scrollIntoView({behavior:"smooth",block:"center"});
}
function renderBaroMusicStyles(){
 const box=$("baroMusicStyles"); if(!box)return;
 box.innerHTML=BARO_MUSIC_STYLES.map(([s])=>`<button class="music-chip ${s===baroMusicStyle?"active":""}" onclick="selectBaroMusicStyle('${s.replaceAll("'","\\'")}')">${s}</button>`).join("");
 updateBaroRecommendation();
}
function selectBaroMusicStyle(s){
 baroMusicStyle=s; localStorage.setItem("baroMusicStyle",s); renderBaroMusicStyles();
}
function updateBaroRecommendation(){
 const item=BARO_MUSIC_STYLES.find(x=>x[0]===baroMusicStyle)||BARO_MUSIC_STYLES[0];
 if($("baroRecTitle")) $("baroRecTitle").textContent=`BARO recommande · ${item[0]}`;
 if($("baroRecText")) $("baroRecText").textContent=`Découvre des playlists YouTube ${item[0]} puis sauvegarde celle que tu préfères dans ton Jukebox BARO.`;
}
function openBaroRecommendation(){
 const item=BARO_MUSIC_STYLES.find(x=>x[0]===baroMusicStyle)||BARO_MUSIC_STYLES[0];
 window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(item[1])}`,"_blank","noopener");
}
function updateMiniPlayer(text){
 if($("jukeboxMiniText")) $("jukeboxMiniText").textContent=text||"Jukebox prêt";
}
function playSavedPlaylist(key){
 const lib=getMusicLibrary(), p=lib.find(x=>x.key===key); if(!p)return;
 localStorage.setItem("baroActivePlaylist",String(key));
 $("youtubePlaylist").value=p.id||"";
 $("youtubePlayer").src=`https://www.youtube.com/embed/videoseries?list=${encodeURIComponent(p.id)}&playsinline=1&autoplay=1`;
 updateMiniPlayer(`${p.name||"Playlist"} · ${p.category||"BARO"}`);
 renderPlaylistLibrary();
}
function stopPlaylist(){
 const f=$("youtubePlayer"); if(f)f.src="";
 localStorage.removeItem("baroActivePlaylist"); updateMiniPlayer("Jukebox prêt");
}
function openPlaylistYouTube(){
 const id=extractPlaylistId($("youtubePlaylist")?.value||"");
 if(id) window.open(`https://www.youtube.com/playlist?list=${encodeURIComponent(id)}`,"_blank","noopener");
}
document.addEventListener("DOMContentLoaded",()=>{renderBaroMusicStyles();renderPlaylistLibrary();});


// ===== BARO JUKEBOX 3.1 — compatibility/fix =====
function getMusicLibrary(){ return musicLibrary(); }
function extractPlaylistId(v){ return youtubePlaylistId(v||""); }

function savePlaylist(){
  const input=$("youtubePlaylist");
  const status=$("baroJukeboxStatus");
  const raw=(input?.value||"").trim();
  const id=extractPlaylistId(raw);
  if(!id){
    if(status) status.textContent="Lien non reconnu. Colle une URL de playlist YouTube contenant list=PL…";
    else alert("Lien non reconnu. Colle une URL de playlist YouTube contenant list=PL…");
    return;
  }
  const name=($("playlistName")?.value||"").trim()||`Playlist ${musicLibrary().length+1}`;
  const category=$("playlistCategory")?.value||"Autre";
  const url=raw.startsWith("http")?raw:`https://www.youtube.com/playlist?list=${encodeURIComponent(id)}`;
  const a=musicLibrary();
  const item={key:Date.now(),name,mood:category,category,url,id};
  a.push(item);
  saveMusicLibrary(a);
  localStorage.setItem("baroActivePlaylist",String(item.key));
  if(status) status.textContent=`${name} sauvegardée ✓`;
  playSavedPlaylist(item.key);
}
function playSavedPlaylist(key){
  const p=musicLibrary().find(x=>x.key===key); if(!p)return;
  localStorage.setItem("baroActivePlaylist",String(key));
  localStorage.setItem("baroYouTubePlaylist",JSON.stringify(p));
  const f=$("youtubePlayer");
  if(f) f.src=`https://www.youtube.com/embed/videoseries?list=${encodeURIComponent(p.id)}&playsinline=1&autoplay=1`;
  if($("youtubePlaylist")) $("youtubePlaylist").value=p.url||p.id;
  updateMiniPlayer(`${p.name||"Playlist"} · ${p.category||p.mood||"BARO"}`);
  renderPlaylistLibrary();
}
function renderPlaylistLibrary(){
  const box=$("playlistLibrary"); if(!box)return;
  const a=musicLibrary(),active=localStorage.getItem("baroActivePlaylist");
  box.innerHTML=a.length?a.map(p=>`<div class="playlist-row ${String(p.key)===active?"active":""}">
    <button class="playlist-main" onclick="playSavedPlaylist(${p.key})"><b>▶ ${esc(p.name)}</b><small>${esc(p.category||p.mood||"Autre")}</small></button>
    <button title="Associer à la tournée active" onclick="attachPlaylistToCurrentTour(${p.key})">🧭</button>
    <button title="Supprimer" onclick="deletePlaylist(${p.key})">×</button>
  </div>`).join(""):'<div class="empty-music">Aucune playlist sauvegardée. Ajoute ta première ambiance BARO.</div>';
}
function deletePlaylist(k){
  const a=musicLibrary().filter(x=>x.key!==k); saveMusicLibrary(a);
  if(localStorage.getItem("baroActivePlaylist")===String(k)){localStorage.removeItem("baroActivePlaylist");stopPlaylist();}
  renderPlaylistLibrary();
}

// ===== BARO V17.4 — Simple / Advanced search =====
let baroSearchMode=localStorage.getItem("baroSearchMode")||"quick";
let quickVibe=localStorage.getItem("baroQuickVibe")||"";

function setSearchMode(mode){
 baroSearchMode=mode; localStorage.setItem("baroSearchMode",mode);
 $("quickModeBtn")?.classList.toggle("active",mode==="quick");
 $("advancedModeBtn")?.classList.toggle("active",mode==="advanced");
 if($("quickSearchPanel")) $("quickSearchPanel").style.display=mode==="quick"?"":"none";
 $("advancedIdentity")?.classList.toggle("on",mode==="advanced");
 $("advancedCockpit")?.classList.toggle("baro-hidden",mode!=="advanced");
}
function setupExperienceGrid(){
 document.querySelectorAll("#experienceGrid button").forEach(btn=>{
   btn.classList.toggle("active",btn.dataset.vibe===quickVibe);
   btn.addEventListener("click",()=>{
     quickVibe=btn.dataset.vibe; localStorage.setItem("baroQuickVibe",quickVibe);
     document.querySelectorAll("#experienceGrid button").forEach(x=>x.classList.toggle("active",x===btn));
   });
 });
 document.querySelectorAll(".identity-chips button").forEach(btn=>btn.addEventListener("click",()=>btn.classList.toggle("active")));
}
function runQuickBaroSearch(){
 const place=($("quickPlace")?.value||"").trim();
 const search=$("search");
 if(search && place){search.value=place;search.dispatchEvent(new Event("input",{bubbles:true}));}
 // Apply only claims supported by existing BARO fields. Other vibes guide discovery, not factual filtering.
 if(quickVibe==="micro"){
   const craft=$("quickCraft"); if(craft && !craft.classList.contains("active")) craft.click();
 } else if(quickVibe==="live"){
   const live=$("quickLive"); if(live && !live.classList.contains("active")) live.click();
 }
 const note=$("quickSearchNote");
 if(note) note.textContent=quickVibe?`BARO cherche « ${quickVibe} »${place?` autour de ${place}`:""}. Les caractéristiques non vérifiées ne sont pas inventées.`:"Choisis une ambiance pour lancer ta recherche.";
 const results=document.querySelector(".results, #results, #cards");
 if(results) results.scrollIntoView({behavior:"smooth",block:"start"});
}
document.addEventListener("DOMContentLoaded",()=>{setupExperienceGrid();setSearchMode(baroSearchMode);});
