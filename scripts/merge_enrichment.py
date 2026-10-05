#!/usr/bin/env python3
"""Merge a reviewed BARO enrichment JSON file into data/enrichment.json.
Input must be keyed by RACJ establishment id. This does not scrape websites.
"""
import json,argparse
from pathlib import Path
ap=argparse.ArgumentParser();ap.add_argument("input");a=ap.parse_args()
dst=Path("data/enrichment.json"); base=json.loads(dst.read_text()) if dst.exists() else {}
inc=json.loads(Path(a.input).read_text())
allowed={"openingHours","website","phone","liveMusic","craftBeer","breweries","source","verified","updated"}
for k,v in inc.items():
 if not isinstance(v,dict): continue
 base.setdefault(str(k),{}).update({x:y for x,y in v.items() if x in allowed})
dst.write_text(json.dumps(base,ensure_ascii=False,indent=2))
print("BARO enrichments:",len(base))
