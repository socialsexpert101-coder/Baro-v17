#!/usr/bin/env python3
import json,urllib.request,csv,io,re
from pathlib import Path
from datetime import datetime,timezone
OUT=Path("data");OUT.mkdir(exist_ok=True)
GPS_FILE=OUT/"gps-cache.json"
ENRICH_FILE=OUT/"enrichment.json"
JSON_URL="https://www.donneesquebec.ca/recherche/dataset/d817c9f7-76c7-44af-882d-0d673056ef86/resource/6b69360c-af8d-4c57-b5bf-1c38d5461de3/download/racj-alcool-detaillant.csv"
REG={"01":"Bas-Saint-Laurent","02":"Saguenay–Lac-Saint-Jean","03":"Capitale-Nationale","04":"Mauricie","05":"Estrie","06":"Montréal","07":"Outaouais","08":"Abitibi-Témiscamingue","09":"Côte-Nord","10":"Nord-du-Québec","11":"Gaspésie–Îles-de-la-Madeleine","12":"Chaudière-Appalaches","13":"Laval","14":"Lanaudière","15":"Laurentides","16":"Montérégie","17":"Centre-du-Québec"}
def dl(url):
 req=urllib.request.Request(url,headers={"User-Agent":"BARO-open-data-builder/4.0"})
 with urllib.request.urlopen(req,timeout=120) as r:return r.read()
def n(v):
 try:return int(float(str(v).replace(" ","").replace(",",".")))
 except:return None
def main():
 enrich={}
 if ENRICH_FILE.exists():
  try: enrich=json.loads(ENRICH_FILE.read_text(encoding="utf-8"))
  except Exception: enrich={}
 gps={}
 if GPS_FILE.exists():
  try:
   gps=json.loads(GPS_FILE.read_text(encoding="utf-8"))
  except Exception:
   gps={}
 raw=dl(JSON_URL)
 text=None
 for enc in ("utf-8-sig","latin-1"):
  try:
   text=raw.decode(enc); break
  except UnicodeDecodeError: pass
 if text is None: raise RuntimeError("Encodage RACJ inconnu")
 rows=list(csv.DictReader(io.StringIO(text)))
 grouped={}
 for r in rows:
  no=(r.get("NoEtablissement") or "").strip()
  if not no: continue
  e=grouped.setdefault(no,{"id":no,"name":(r.get("RaisonSociale") or "").strip(),"holder":(r.get("Titulaire") or "").strip(),"neq":(r.get("Neq") or "").strip(),"address":(r.get("Adresse") or "").strip(),"city":(r.get("Ville") or "").strip(),"postal":(r.get("CodePostal") or "").strip(),"regionCode":str(r.get("RegAdmin") or "").zfill(2),"types":set(),"permits":set(),"capacity":0})
  cat=(r.get("Categorie") or "").strip()
  if cat: e["types"].add(cat)
  permit=(r.get("NoPermis") or "").strip()
  if permit: e["permits"].add(permit)
  e["capacity"] += n(r.get("Capacite")) or 0
 out=[]
 today=datetime.now(timezone.utc).strftime("%Y-%m-%d")
 for e in grouped.values():
  if not any("bar" in c.lower() for c in e["types"]): continue
  reg=e["regionCode"]
  out.append({"id":e["id"],"name":e["name"],"holder":e["holder"],"neq":e["neq"],"address":e["address"],"city":e["city"],"postal":e["postal"],"regionCode":reg,"regionName":REG.get(reg,"Autre / non classée"),"permit":" · ".join(sorted(e["permits"])),"types":sorted(e["types"]),"capacity":e["capacity"] or None,"confidence":1.0,"editorialTypes":[],"foundedYear":None,"age":None,"events":None,"website":"","phone":"","sourceUpdated":today,"lat":gps.get(e["id"],{}).get("lat"),"lon":gps.get(e["id"],{}).get("lon"),"gpsSource":gps.get(e["id"],{}).get("source",""),"openingHours":enrich.get(e["id"],{}).get("openingHours",""),"website":enrich.get(e["id"],{}).get("website",""),"phone":enrich.get(e["id"],{}).get("phone",""),"liveMusic":enrich.get(e["id"],{}).get("liveMusic"),"craftBeer":enrich.get(e["id"],{}).get("craftBeer"),"breweries":enrich.get(e["id"],{}).get("breweries",[]),"enrichmentSource":enrich.get(e["id"],{}).get("source",""),"enrichmentVerified":enrich.get(e["id"],{}).get("verified",False)})
 out.sort(key=lambda x:(x["regionName"],x["city"],x["name"]))
 (OUT/"bars.json").write_text(json.dumps(out,ensure_ascii=False,separators=(",",":")),encoding="utf-8")
 meta={"updated":today,"source":"RACJ / Données Québec","license":"CC-BY 4.0","count":len(out),"sourceRows":len(rows),"sourceEstablishments":len(grouped)}
 (OUT/"meta.json").write_text(json.dumps(meta,ensure_ascii=False,indent=2),encoding="utf-8")
 if not out: raise RuntimeError("La synchronisation RACJ a produit 0 bar; déploiement annulé pour éviter une base vide.")
 print("BARO V11:",len(out),"bars · GPS cache:",sum(1 for x in out if x.get("lat") is not None))

if __name__=="__main__":main()
