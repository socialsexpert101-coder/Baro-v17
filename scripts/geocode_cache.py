#!/usr/bin/env python3
"""BARO GPS cache builder.
Run MANUALLY and deliberately. Public Nominatim is not intended for recurring bulk jobs.
This script is single-threaded, cached, and defaults to a small batch.
Review https://operations.osmfoundation.org/policies/nominatim/ before use.
"""
import json,time,urllib.parse,urllib.request,argparse
from pathlib import Path
P=Path("data/bars.json"); C=Path("data/gps-cache.json")
ap=argparse.ArgumentParser();ap.add_argument("--limit",type=int,default=25);ap.add_argument("--delay",type=float,default=1.1);a=ap.parse_args()
bars=json.loads(P.read_text()); cache=json.loads(C.read_text()) if C.exists() else {}
todo=[b for b in bars if b["id"] not in cache][:a.limit]
for i,b in enumerate(todo,1):
 q=", ".join(x for x in [b.get("name"),b.get("address"),b.get("city"),b.get("postal"),"Québec","Canada"] if x)
 url="https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=ca&q="+urllib.parse.quote(q)
 req=urllib.request.Request(url,headers={"User-Agent":"BARO-Quebec-geocoder/11.0 (manual cached enrichment)"})
 try:
  with urllib.request.urlopen(req,timeout=30) as r: res=json.load(r)
  if res:
   cache[b["id"]]={"lat":float(res[0]["lat"]),"lon":float(res[0]["lon"]),"source":"OpenStreetMap/Nominatim","query":q}
   C.write_text(json.dumps(cache,ensure_ascii=False,indent=2))
   print(i,b["name"],"OK")
  else: print(i,b["name"],"introuvable")
 except Exception as e: print(i,b["name"],"ERREUR",e)
 time.sleep(max(a.delay,1.05))
print("Cache GPS:",len(cache))
