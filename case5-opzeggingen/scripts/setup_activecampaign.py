#!/usr/bin/env python3
"""Zet de ActiveCampaign (MailBlue) trial klaar voor case 5 — idempotent.

  python3 setup_activecampaign.py            # pipeline, stages, tag, taalveld, contacten, seed-deal
  python3 setup_activecampaign.py --reset    # opzeg-deals + demo-contact verwijderen, tag en taalveld leeg, opnieuw seeden
  python3 setup_activecampaign.py --check    # overzicht deals/notities/taken/tags (voor verificatie na de demo)

Leest AC_API_URL en AC_API_KEY uit ../../.env (nooit uit argumenten, nooit printen).
Schrijft de benodigde ID's (geen secrets) naar ../mock-data/activecampaign_ids.json.
Alleen standaardbibliotheek.
"""
import json
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent
SEED = json.loads((HERE.parent / "mock-data" / "activecampaign_seed.json").read_text())
IDS_PATH = HERE.parent / "mock-data" / "activecampaign_ids.json"
DEMO_CONTACTS_TO_DELETE = ["j.devries@voorbeeld.nl"]  # wordt door payload 3 aangemaakt


def load_env():
    env = {}
    for line in (ROOT / ".env").read_text().splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1)
            env[k.strip()] = v.strip().strip('"').strip("'")
    url, key = env.get("AC_API_URL", "").rstrip("/"), env.get("AC_API_KEY", "")
    if not url or not key:
        sys.exit("AC_API_URL / AC_API_KEY ontbreken in .env")
    return url, key


BASE, KEY = load_env()


def api(method, path, body=None, params=None):
    url = BASE + "/api/3/" + path.lstrip("/")
    if params:
        url += "?" + urllib.parse.urlencode(params)
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, method=method,
                                 headers={"Api-Token": KEY, "Content-Type": "application/json",
                                          "Accept": "application/json"})
    for attempt in range(4):
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                raw = r.read()
                return json.loads(raw) if raw else {}
        except urllib.error.HTTPError as e:
            if e.code == 429 and attempt < 3:  # AC rate limit: 5 req/s
                time.sleep(1.5)
                continue
            detail = e.read().decode(errors="replace")[:400]
            raise SystemExit(f"AC {method} {path} -> HTTP {e.code}: {detail}")


def find_or_create_pipeline():
    groups = api("GET", "dealGroups", params={"limit": 100}).get("dealGroups", [])
    for g in groups:
        if g["title"] == SEED["pipeline"]["title"]:
            return g["id"], False
    g = api("POST", "dealGroups", {"dealGroup": {
        "title": SEED["pipeline"]["title"], "currency": SEED["pipeline"]["currency"],
        "autoassign": 0, "allgroups": 1, "allusers": 1}})["dealGroup"]
    return g["id"], True


def ensure_stages(pid, new_pipeline):
    existing = api("GET", "dealStages", params={"filters[d_groupid]": pid, "limit": 100}).get("dealStages", [])
    by_title = {s["title"]: s["id"] for s in existing}
    colors = ["E5A100", "2A7DE1", "7A5AF8", "12B76A", "D92D20"]
    ids = {}
    for i, title in enumerate(SEED["stages"]):
        if title not in by_title:
            s = api("POST", "dealStages", {"dealStage": {"title": title, "group": pid, "order": i + 1,
                                                          "color": colors[i % len(colors)]}})["dealStage"]
            by_title[title] = s["id"]
        ids[title] = by_title[title]
    if new_pipeline:  # standaard-stages van een nieuwe pipeline opruimen (zijn leeg)
        for s in existing:
            if s["title"] not in SEED["stages"]:
                api("DELETE", f"dealStages/{s['id']}")
    return ids


def ensure_tags():
    ids = {}
    for name in SEED["tags"]:
        found = [t for t in api("GET", "tags", params={"search": name}).get("tags", []) if t["tag"] == name]
        if found:
            ids[name] = found[0]["id"]
        else:
            ids[name] = api("POST", "tags", {"tag": {"tag": name, "tagType": "contact",
                                                    "description": "Case 5: start bevestigingsmail opzegsurvey"}})["tag"]["id"]
    return ids


def ensure_tasktype():
    types = api("GET", "dealTasktypes").get("dealTasktypes", [])
    for t in types:
        if t["title"].lower() in ("call", "bellen", "persoonlijk contact"):
            return t["id"], t["title"]
    if types:
        return types[0]["id"], types[0]["title"]
    t = api("POST", "dealTasktypes", {"dealTasktype": {"title": "Persoonlijk contact"}})["dealTasktype"]
    return t["id"], t["title"]


def ensure_language_field():
    """Standaardveld 'Preferred Language' (dropdown, waarden nl/en). Bestaat in elk AC-account."""
    spec = SEED["language_field"]
    fields = api("GET", "fields", params={"limit": 100}).get("fields", [])
    found = [f for f in fields if f.get("perstag") == spec["perstag"] or f.get("title") == spec["title"]]
    if not found:
        sys.exit(f"Veld '{spec['title']}' niet gevonden in ActiveCampaign")
    fid = found[0]["id"]
    values = {o["value"] for o in api("GET", f"fields/{fid}").get("fieldOptions", [])}
    missing = [v for v in spec["values"] if v not in values]
    if missing:
        sys.exit(f"Veld '{spec['title']}' mist de waarde(n) {missing}")
    return fid


def tag_ids_by_name(names):
    ids = []
    for name in names:
        ids += [t["id"] for t in api("GET", "tags", params={"search": name}).get("tags", []) if t["tag"] == name]
    return ids


def language_value(cid, fid):
    for fv in api("GET", f"contacts/{cid}/fieldValues").get("fieldValues", []):
        if str(fv["field"]) == str(fid):
            return fv
    return None


def sync_contact(c):
    return api("POST", "contact/sync", {"contact": c})["contact"]["id"]


def contact_id_by_email(email):
    cs = api("GET", "contacts", params={"email": email}).get("contacts", [])
    return cs[0]["id"] if cs else None


def pipeline_deals(pid):
    return api("GET", "deals", params={"filters[group]": pid, "limit": 100}).get("deals", [])


def seed_existing_deals(pid, stage_ids, owner_id):
    for d in SEED["existing_deals"]:
        cid = contact_id_by_email(d["contact_email"])
        if any(x["contact"] == str(cid) and x["status"] == "0" for x in pipeline_deals(pid)):
            continue
        deal = api("POST", "deals", {"deal": {
            "title": d["title"], "contact": cid, "value": d["value_eur"] * 100, "currency": "eur",
            "group": pid, "stage": stage_ids[d["stage"]], "owner": owner_id, "status": 0}})["deal"]
        api("POST", f"deals/{deal['id']}/notes", {"note": {"note": d["note"]}})
        print(f"  seed-deal aangemaakt: {deal['id']} — {d['title']}")


def reset(pid, tag_ids, field_id):
    for d in pipeline_deals(pid):
        api("DELETE", f"deals/{d['id']}")
        print(f"  deal verwijderd: {d['id']} {d['title']}")
    for email in DEMO_CONTACTS_TO_DELETE:
        cid = contact_id_by_email(email)
        if cid:
            api("DELETE", f"contacts/{cid}")
            print(f"  demo-contact verwijderd: {email}")
    wanted = set(map(str, list(tag_ids.values()) + tag_ids_by_name(SEED.get("legacy_tags", []))))
    for c in SEED["contacts"]:
        cid = contact_id_by_email(c["email"])
        if not cid:
            continue
        for ct in api("GET", f"contacts/{cid}/contactTags").get("contactTags", []):
            if str(ct["tag"]) in wanted:
                api("DELETE", f"contactTags/{ct['id']}")
        fv = language_value(cid, field_id)  # taalveld leeg, zodat de demo laat zien dat de workflow het vult
        if fv and fv.get("value"):
            api("DELETE", f"fieldValues/{fv['id']}")


def check(ids):
    pid = ids["pipeline_id"]
    stage_name = {v: k for k, v in ids["stages"].items()}
    deals = pipeline_deals(pid)
    print(f"\nDeals in '{SEED['pipeline']['title']}': {len(deals)}")
    for d in deals:
        contact = api("GET", f"contacts/{d['contact']}")["contact"]
        notes = api("GET", f"deals/{d['id']}/notes").get("notes", [])
        tasks = api("GET", "dealTasks", params={"filters[relid]": d["id"], "filters[reltype]": "Deal"}).get("dealTasks", [])
        tasks = [t for t in tasks if str(t.get("relid")) == str(d["id"])]
        tags = [ct["tag"] for ct in api("GET", f"contacts/{d['contact']}/contactTags").get("contactTags", [])]
        tag_names = [k for k, v in ids["tags"].items() if str(v) in map(str, tags)]
        fv = language_value(d["contact"], ids["field_preferred_language"])
        taal = (fv or {}).get("value") or "-"
        print(f"- #{d['id']} {d['title']}\n    stage={stage_name.get(d['stage'], d['stage'])} | "
              f"waarde=€{int(d['value'])/100:,.0f} | contact={contact['email']} | status={'open' if d['status']=='0' else d['status']}\n"
              f"    notities={len(notes)} | taken={len(tasks)} | tags={tag_names} | Preferred Language={taal}")
        for t in tasks:
            print(f"      taak: {t.get('title')} (deadline {t.get('duedate','')[:10]})")


def main():
    pid, new = find_or_create_pipeline()
    print(f"pipeline {pid} ({'nieuw' if new else 'bestond al'})")
    stage_ids = ensure_stages(pid, new)
    tag_ids = ensure_tags()
    field_id = ensure_language_field()
    owner_id = api("GET", "users/me")["user"]["id"]
    tasktype_id, tasktype_title = ensure_tasktype()
    ids = {
        "pipeline_id": pid,
        "stages": stage_ids,
        "tags": tag_ids,
        "field_preferred_language": field_id,
        "owner_id": owner_id,
        "tasktype_id": tasktype_id,
        "tasktype_title": tasktype_title,
    }
    IDS_PATH.write_text(json.dumps(ids, indent=2, ensure_ascii=False) + "\n")
    if "--check" in sys.argv:
        check(ids)
        return
    if "--reset" in sys.argv:
        reset(pid, tag_ids, field_id)
    for c in SEED["contacts"]:
        sync_contact(c)
    seed_existing_deals(pid, stage_ids, owner_id)
    print(json.dumps(ids, indent=2, ensure_ascii=False))
    print(f"\nID's geschreven naar {IDS_PATH}")


if __name__ == "__main__":
    main()
