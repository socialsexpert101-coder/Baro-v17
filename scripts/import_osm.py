#!/usr/bin/env python3
"""Import a SAVED Overpass JSON response into BARO caches.
No network calls are made here. Matching is conservative: normalized name + normalized city.
"""
import json,re,unicodedata,argparse
from pathlib import Path
def norm(s):
 s=unicodedata.normalize("NFKD",s or "").encode("ascii","ignore").decode().lower()
 return re.sub(r"[^a-z0-9]+"," ",s).strip()
ap=argparse.ArgumentParser()
ap.add_argument("overpass_json",help="Saved Overpass JSON file")
args=ap.parse_args()
bars=json.loads(Path("data/bars.json").read_text(encoding="utf-8"))
osm=json.loads(Path(args.overpass_json).read_text(encoding="utf-8"))
ep=Path("data/enrichment.json"); gp=Path("data/gps-cache.json")
en=json.loads(ep.read_text(encoding="utf-8")) if ep.exists() else {}
gps=json.loads(gp.read_text(encoding="utf-8")) if gp.exists() else {}
idx={}
for b in bars: idx.setdefault((norm(b.get("name")),norm(b.get("city"))),[]).append(b)
matched=ambiguous=0
for el in osm.get("elements",[]):
 t=el.get("tags",{}); name=t.get("name",""); city=t.get("addr:city") or t.get("addr:municipality") or ""
 candidates=idx.get((norm(name),norm(city)),[])
 if len(candidates)!=1:
  if len(candidates)>1: ambiguous+=1
  continue
 b=candidates[0]; bid=str(b["id"])
 lat=el.get("lat") or (el.get("center") or {}).get("lat"); lon=el.get("lon") or (el.get("center") or {}).get("lon")
 if lat is not None and lon is not None: gps[bid]={"lat":float(lat),"lon":float(lon),"source":"OpenStreetMap"}
 brewery=[x.strip() for x in re.split(r"[;,]",t.get("brewery","")) if x.strip()]
 craft=(t.get("drink:craft_beer")=="yes" or t.get("microbrewery")=="yes" or bool(brewery))
 en[bid]={
  **en.get(bid,{}),
  "openingHours":t.get("opening_hours",""),
  "website":t.get("website") or t.get("contact:website",""),
  "phone":t.get("phone") or t.get("contact:phone",""),
  "liveMusic": True if t.get("live_music")=="yes" else en.get(bid,{}).get("liveMusic"),
  "craftBeer": True if craft else en.get(bid,{}).get("craftBeer"),
  "breweries":brewery or en.get(bid,{}).get("breweries",[]),
  "source":"OpenStreetMap",
  "verified":False,
  "osmType":el.get("type"),"osmId":el.get("id")
 }
 matched+=1
ep.write_text(json.dumps(en,ensure_ascii=False,indent=2),encoding="utf-8")
gp.write_text(json.dumps(gps,ensure_ascii=False,indent=2),encoding="utf-8")
print(f"OSM import: {matched} correspondances uniques; {ambiguous} ambiguës ignorées.")
