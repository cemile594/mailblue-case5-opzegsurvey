# Toelichting case 5: opzeggingen slim routeren

**Opbouw.** Eén hoofdworkflow (02) die één inzending lineair afhandelt, met drie kleine hulpworkflows: een MoneyBird-mock (01), een error-workflow (03) en een watchdog (04). Bewust geen opsplitsing in sub-workflows: voor CS en voor een reviewer is één doorlopend canvas met sticky notes per fase (ontvangen → verrijken → regels → CRM → signalen) het makkelijkst te volgen.
- **Alle business-regels in één Code-node** ("Routing bepalen") in plaats van verspreid over tientallen IF- en filter-nodes. De regels zijn zo op één plek te lezen, te testen en aan te passen. Ook de drempel van € 3.000 staat in een Config-node.
- **ActiveCampaign is echt gekoppeld (trial).** De backoffice is een n8n Data Table. MoneyBird is een mock-API met hetzelfde endpoint, dezelfde filter en hetzelfde antwoordformaat als de echte, zodat productie alleen een andere URL en credential vraagt. Slack is een mock-tabel.

**Belangrijkste keuzes.**
- **Eerst loggen, dan pas "202 ontvangen".** De ruwe inzending staat in `submission_log` voordat er iets mis kan gaan. Een watchdog meldt alles wat niet binnen 10 minuten op `processed` staat.
- **Ontbrekende data is een aandachtspunt, geen stop.** Normalisatie levert een lijst `issues` die in de deal-notitie en in één CS-taak terechtkomt.
- **Eén deal per klant.** Meerdere keuzes worden één stage volgens de prioriteit persoonlijk aanbod > pauze > korting > opzegging. Een bestaande open opzeg-deal wordt bijgewerkt.
- **Taal als veld, bevestiging als tag.** De taal komt in het standaardveld *Preferred Language* (blijvend, en zichtbaar voor CS). Eén tag start één automation, die op dat veld NL of EN kiest. Een veld alleen werkt niet als trigger, want bij een gelijkblijvende taal start er niets.
- **Topklant op ARR incl. add-ons.** Daardoor is Blauwdruk (€ 1.788 + € 1.440) een topklant, en dat zou je met alleen het abonnement missen.

**Edge cases die wel zijn afgevangen**
- Klant niet gevonden: zoeken op e-mail, daarna stage *Te verifiëren* + taak + alert.
- `customer_id` of taal ontbreekt.
- Keuze als lijst, onbekend of leeg.
- Pauze langer dan 4 maanden (begrensd en gemarkeerd).
- MoneyBird plat: 3 pogingen, daarna "controleer handmatig".
- Openstaande factuur bij pauze of korting.
- Dubbele webhook (idempotent op `submission_id`).
- AI-fout, AI-onzin of prompt-injectie.
- Meerdere open opzeg-deals bij één klant.

**Edge cases die bewust niet zijn afgevangen**
- Twee gelijktijdige inzendingen van dezelfde klant. Dat is een race condition: de oplossing is een queue of lock.
- Automatische herverwerking van mislukte inzendingen: de watchdog meldt ze wel.
- Een klant zonder e-mail én zonder `customer_id`: die komt via de error-workflow en het log bij CS terecht.
- Valuta en deelbetalingen.
- Een tweede bevestigingsmail bij een tag die al bestaat.

**Eerst regelen vóór productie**
1. Webhook beveiligen met een header-secret of signature.
2. Monitoring: de error-workflow en watchdog naar echte Slack en een dagelijkse samenvatting.
3. Rechten: een eigen AC-API-gebruiker met minimale scope, en credentials in de n8n-vault.
4. In de AC-automation de bevestigingstag als laatste stap weer verwijderen, zodat een volgende survey opnieuw een bevestiging stuurt.
5. Bewaartermijn van `submission_log` (AVG).
6. Een korte CS-instructie: wat betekent elke stage, en wat doe je met een taak "Te verifiëren".

**Hoe ik AI heb ingezet.** Ik heb met Claude Code gebouwd, via n8n-as-code: workflows als TypeScript in Git, geverifieerd tegen de node-schema's en naar n8n gepusht. Waar ik de output heb bijgestuurd:
1. De tool zette error-uitgangen weg als een verbindingstype dat n8n niet kent. Na controle in de n8n-broncode heb ik dat aangepast naar de juiste output-index.
2. Een webhook met een padparameter bleek een extra ID in de URL te krijgen. Ik heb er een vast pad van gemaakt dat op de MoneyBird-URL lijkt.
3. Bij de prompt-injectietest nam het model de injectietekst letterlijk over als "samenvatting". Daar zijn het veld `bruikbaar` en een regex-check bijgekomen.
4. Tests tegen de echte API's leverden twee dingen op die nergens in de docs stonden. ActiveCampaign haalt tekens als `|` en `⚠` uit notities, dus de opmaak is aangepast. En in n8n 2.x start een error-workflow alleen als hij zelf actief is: de faaltest liet dat zien, en is daarna opnieuw gedraaid.
5. Notitieteksten heb ik herschreven nadat ik de echte output had gelezen. Deal-waardes gaan in centen: dat heb ik nagekeken in de broncode van de AC-node.
