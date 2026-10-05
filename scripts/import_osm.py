#!/usr/bin/env python3
"""BARO OSM matcher V17.1
Importe un export Overpass déjà sauvegardé. Aucun appel réseau.

Stratégie prudente, par niveaux:
A) nom exact + ville exacte
B) nom exact + code postal exact
C) nom très proche + code postal exact
D) nom très proche + numéro/rue compatibles + ville compatible

Les rapprochements faibles ou ambigus sont ignorés.
Un rapport est écrit dans data/osm-match-report.json.
"""
import argparse, difflib, json, re, unicodedata
from pathlib import Path

def norm(s):
    s=unicodedata.normalize("NFKD", s or "").encode("ascii","ignore").decode().lower()
    return re.sub(r"[^a-z0-9]+"," ",s).strip()

def postal(s):
    return re.sub(r"[^A-Z0-9]","",(s or "").upper())

def streetish(s):
    s=norm(s)
    drop={"rue","avenue","av","boulevard","boul","chemin","ch","route","rang","street","st","road","rd"}
    return " ".join(x for x in s.split() if x not in drop)

def ratio(a,b):
    a,b=norm(a),norm(b)
    return difflib.SequenceMatcher(None,a,b).ratio() if a and b else 0.0

def osm_address(t):
    num=t.get("addr:housenumber","")
    st=t.get("addr:street","")
    return f"{num} {st}".strip()

def unique_best(scored, min_score, margin=0.08):
    scored=sorted(scored,key=lambda x:x[0],reverse=True)
    if not scored or scored[0][0] < min_score:
        return None
    if len(scored)>1 and scored[0][0]-scored[1][0] < margin:
        return None
    return scored[0]

ap=argparse.ArgumentParser()
ap.add_argument("overpass_json")
args=ap.parse_args()

bars=json.loads(Path("data/bars.json").read_text(encoding="utf-8"))
osm=json.loads(Path(args.overpass_json).read_text(encoding="utf-8"))
ep=Path("data/enrichment.json"); gp=Path("data/gps-cache.json")
en=json.loads(ep.read_text(encoding="utf-8")) if ep.exists() else {}
gps=json.loads(gp.read_text(encoding="utf-8")) if gp.exists() else {}

by_name={}
by_postal={}
for b in bars:
    by_name.setdefault(norm(b.get("name")),[]).append(b)
    if postal(b.get("postal")):
        by_postal.setdefault(postal(b.get("postal")),[]).append(b)

matched_ids=set()
stats={"A_exact_name_city":0,"B_exact_name_postal":0,"C_fuzzy_name_postal":0,
       "D_fuzzy_name_address":0,"ambiguous_or_weak":0,"already_matched":0}
report=[]

for el in osm.get("elements",[]):
    t=el.get("tags",{})
    name=t.get("name","")
    if not name:
        stats["ambiguous_or_weak"]+=1
        continue
    city=t.get("addr:city") or t.get("addr:municipality") or ""
    pc=postal(t.get("addr:postcode"))
    oa=osm_address(t)
    candidates=[]
    method=None
    confidence=None

    # A: exact name + exact city
    exact=by_name.get(norm(name),[])
    a=[b for b in exact if city and norm(b.get("city"))==norm(city)]
    if len(a)==1:
        candidates=a; method="A_exact_name_city"; confidence=1.00

    # B: exact name + exact postal
    if not candidates and pc:
        bset=[b for b in exact if postal(b.get("postal"))==pc]
        if len(bset)==1:
            candidates=bset; method="B_exact_name_postal"; confidence=.99

    # C: same postal, very similar name
    if not candidates and pc:
        scored=[]
        for b in by_postal.get(pc,[]):
            nr=ratio(name,b.get("name"))
            if nr>=.88:
                scored.append((nr,b))
        best=unique_best(scored,.88,.07)
        if best:
            confidence,b=best; candidates=[b]; method="C_fuzzy_name_postal"

    # D: same/compatible city + very similar name + address evidence
    if not candidates and city and oa:
        scored=[]
        for b in bars:
            if norm(b.get("city"))!=norm(city): continue
            nr=ratio(name,b.get("name"))
            ar=ratio(streetish(oa),streetish(b.get("address")))
            # Require strong name AND meaningful address similarity.
            if nr>=.90 and ar>=.72:
                score=.70*nr+.30*ar
                scored.append((score,b))
        best=unique_best(scored,.86,.08)
        if best:
            confidence,b=best; candidates=[b]; method="D_fuzzy_name_address"

    if len(candidates)!=1:
        stats["ambiguous_or_weak"]+=1
        continue

    b=candidates[0]; bid=str(b["id"])
    if bid in matched_ids:
        stats["already_matched"]+=1
        continue
    matched_ids.add(bid); stats[method]+=1

    lat=el.get("lat") or (el.get("center") or {}).get("lat")
    lon=el.get("lon") or (el.get("center") or {}).get("lon")
    if lat is not None and lon is not None:
        gps[bid]={"lat":float(lat),"lon":float(lon),"source":"OpenStreetMap",
                  "matchMethod":method,"matchConfidence":round(float(confidence),3)}

    brewery=[x.strip() for x in re.split(r"[;,]",t.get("brewery","")) if x.strip()]
    craft=(t.get("drink:craft_beer")=="yes" or t.get("microbrewery")=="yes" or bool(brewery))
    old=en.get(bid,{})
    en[bid]={
        **old,
        "openingHours":t.get("opening_hours") or old.get("openingHours",""),
        "website":t.get("website") or t.get("contact:website") or old.get("website",""),
        "phone":t.get("phone") or t.get("contact:phone") or old.get("phone",""),
        "liveMusic": True if t.get("live_music")=="yes" else old.get("liveMusic"),
        "craftBeer": True if craft else old.get("craftBeer"),
        "breweries":brewery or old.get("breweries",[]),
        "source":"OpenStreetMap","verified":False,
        "osmType":el.get("type"),"osmId":el.get("id"),
        "matchMethod":method,"matchConfidence":round(float(confidence),3)
    }
    report.append({
        "baroId":bid,"baroName":b.get("name"),"baroCity":b.get("city"),
        "osmName":name,"osmCity":city,"osmId":el.get("id"),"osmType":el.get("type"),
        "method":method,"confidence":round(float(confidence),3)
    })

ep.write_text(json.dumps(en,ensure_ascii=False,indent=2),encoding="utf-8")
gp.write_text(json.dumps(gps,ensure_ascii=False,indent=2),encoding="utf-8")
Path("data/osm-match-report.json").write_text(
    json.dumps({"matched":len(report),"stats":stats,"matches":report},ensure_ascii=False,indent=2),
    encoding="utf-8"
)
print(f"OSM V17.1 : {len(report)} correspondances acceptées.")
for k,v in stats.items():
    print(f"  {k}: {v}")
print("Rapport: data/osm-match-report.json")
