#!/usr/bin/env python3
"""Exporteert de n8n-workflows (bron: workflows/local/*.workflow.ts) naar n8n-JSON in ../export/.
Haalt de accountspecifieke ActiveCampaign-URL weg (vervangen door een placeholder) en gooit de
tijdelijke dev-workflow niet mee. Credentials zitten nooit in een export (alleen naam/id-verwijzing)."""
import json, re, subprocess, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "workflows" / "local"
OUT = Path(__file__).resolve().parent.parent / "export"
OUT.mkdir(exist_ok=True)
for ts in sorted(SRC.glob("0*.workflow.ts")):
    target = OUT / (ts.name.replace(".workflow.ts", ".json"))
    subprocess.run(["n8nac", "convert", str(ts), "-o", str(target), "--force"], check=True,
                   capture_output=True, env={**__import__("os").environ, "N8NAC_TELEMETRY_DISABLED": "1"})
    wf = json.loads(target.read_text())
    for n in wf.get("nodes", []):
        js = n.get("parameters", {}).get("jsCode")
        if js:
            n["parameters"]["jsCode"] = re.sub(r'"ac_base_url":"[^"]*"', '"ac_base_url":"https://<jouw-account>.api-us1.com"', js)
    target.write_text(json.dumps(wf, indent=2, ensure_ascii=False) + "\n")
    print("✔", target.relative_to(ROOT))
