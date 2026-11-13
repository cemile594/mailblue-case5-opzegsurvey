# MailBlue — case study AI & Automation developer

| Case | Uitwerking |
|---|---|
| **Case 5 — Opzeggingen slim routeren** (gebouwd in n8n) | [`case5-opzeggingen/`](case5-opzeggingen/) · [toelichting](case5-opzeggingen/TOELICHTING.md) · [workflow-exports](case5-opzeggingen/export/) · [screenshots](case5-opzeggingen/screenshots/) |

## Repo-indeling

- `case5-opzeggingen/`: de uitwerking. README met context en ontwerp, toelichting, mock-data, testpayloads, scripts, n8n-JSON-exports en screenshots.
- `workflows/local/`: de bron van de n8n-workflows als TypeScript ([n8n-as-code](https://github.com/EtienneLescot/n8n-as-code)). Ze worden gepusht naar een lokale n8n 2.47-instance.
- `AGENTS.md`, `.agents/`, `.github/agents/`: context die n8n-as-code genereert voor de AI-assistent (Claude Code) waarmee is gebouwd.

Alle klant- en factuurdata is fictief. Er staan geen credentials in deze repo.
