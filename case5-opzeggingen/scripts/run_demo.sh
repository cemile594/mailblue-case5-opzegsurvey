#!/usr/bin/env bash
# Demo case 5: stuurt de voorbeeld-payloads naar de webhook en toont daarna de stand in ActiveCampaign.
#   ./run_demo.sh            -> payload 1-3 (de case)
#   ./run_demo.sh --extra    -> ook 4 (kleine klant), 5 (duplicaat van 1) en 6 (prompt-injectie)
#   ./run_demo.sh --reset    -> eerst ActiveCampaign + Data Tables terugzetten naar de beginstand
set -euo pipefail
cd "$(dirname "$0")/.."
N8N="${N8N_URL:-http://127.0.0.1:5690}"
reset=0; extra=0
for a in "$@"; do case "$a" in --reset) reset=1 ;; --extra) extra=1 ;; esac; done

if [ "$reset" = 1 ]; then
  echo "↺ Reset ActiveCampaign (opzeg-deals, demo-contact, tags) + seed-deal Northwind"
  python3 scripts/setup_activecampaign.py --reset >/dev/null
  echo "↺ Reset Data Tables (backoffice, MoneyBird-mock, slack_messages, submission_log)"
  curl -s -X POST "$N8N/webhook/setup-mock-data"; echo
fi

send() {
  printf '\n▶ %s\n  ' "$1"
  curl -s -w '  [HTTP %{http_code}]\n' -X POST -H 'Content-Type: application/json' \
       --data @"payloads/$1.json" "$N8N/webhook/opzegsurvey"
  sleep "${PAUZE:-10}"   # verwerking loopt na de 202 door (MoneyBird, AI, ActiveCampaign)
}

send 01-korting-nl
send 02-pauze-aanbod-en
send 03-opzegging-onvolledig
if [ "$extra" = 1 ]; then
  send 04-kleine-klant-pauze
  send 05-duplicaat-van-01
  send 06-prompt-injectie
fi

echo; echo "══ Stand in ActiveCampaign ══"
python3 scripts/setup_activecampaign.py --check
