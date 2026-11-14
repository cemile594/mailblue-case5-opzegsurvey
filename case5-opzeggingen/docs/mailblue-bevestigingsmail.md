# MailBlue: bevestigingsmail opzegsurvey (automation)

Automation **"Opzegsurvey – bevestigingsmail (NL/EN)"** in de ActiveCampaign-trial (id 3, status: **inactief**). Hij is gebouwd via de ActiveCampaign-MCP (AI-automationbuilder) en daarna gecontroleerd en gecorrigeerd. Hij staat bewust inactief: de demo-contacten hebben verzonnen adressen. Activeren is een beslissing van Marketing.

## Opbouw

- START: tag `opzegsurvey-bevestiging` toegevoegd (**meerdere keren toegestaan**, zodat een tweede survey opnieuw een bevestiging geeft)
  - ALS: *Preferred Language* (standaardveld, id 1) **is English** (opgeslagen code `en`)
    - MAIL: "We've received your choice" (EN)
    - TAG VERWIJDEREN: `opzegsurvey-bevestiging`
  - ANDERS (Dutch, ander taal of leeg)
    - MAIL: "We hebben je keuze ontvangen" (NL)
    - TAG VERWIJDEREN: `opzegsurvey-bevestiging`

De workflow in n8n zet eerst *Preferred Language* (bij de contact sync) en daarna pas de tag. De automation leest de taal dus pas als die er al staat. Is de taal onbekend, dan vult de workflow het veld niet in. Het contact komt dan in de ANDERS-tak terecht en krijgt de NL-mail.

## Mails

**EN**: onderwerp *We've received your choice* · preheader *We've received your choice. Here's what happens next.*
```
Thank you, we've received your choice

Hello,

Thank you for completing our survey about your subscription. We've received your choice.

What happens next
We're getting started on it. If it involves a conversation or a personal offer, someone from our Customer
Success team will contact you within two working days. Otherwise, we'll let you know as soon as everything
has been arranged.

Any questions? Simply reply to this email.

Kind regards,
The MailBlue team
```

**NL**: onderwerp *We hebben je keuze ontvangen* · preheader *We hebben je keuze ontvangen. Dit gebeurt er nu.*
```
Bedankt, we hebben je keuze ontvangen

Hallo,

Bedankt voor het invullen van onze survey over je abonnement. We hebben je keuze goed ontvangen.

Wat er nu gebeurt
We gaan ermee aan de slag. Hoort er een gesprek of persoonlijk aanbod bij, dan neemt een collega van ons
Customer Success-team binnen twee werkdagen contact met je op. Anders hoor je van ons zodra alles geregeld is.

Heb je nog een vraag? Beantwoord dan gewoon deze mail.

Hartelijke groet,
Team MailBlue
```
Bewust neutraal: een klant die pauze, korting of een persoonlijk aanbod kiest, zegt niet op. De mail spreekt dus niet van "opzeggen", en nodigt ook niet uit om de survey opnieuw in te vullen.

## Wat de AI-builder fout deed, en hoe het is hersteld

1. **Een nieuw veld in plaats van het bestaande.** Voor de taalconditie maakte de builder een nieuw, leeg *tekst*veld "Preferred Language" aan (`PREFERRED_LANGUAGE_1`) en zette de conditie daarop. Een herstelopdracht via de builder maakte opnieuw zo'n veld aan. In die vorm zou iedereen de NL-mail krijgen. Hersteld door de conditie (een segment) via de API op het echte dropdownveld (id 1) te zetten. Daarna zijn de twee lege dubbele velden verwijderd.
2. **Waarde `en`, niet "English".** De API toont de waarde als "English", maar de segment-engine vergelijkt met de opgeslagen code. Gecontroleerd met een segment-match: met `en` matcht Northwind (English) en Blauwdruk (Dutch) niet. Met "English" matcht niemand.
3. **Herschreven mailteksten.** De builder schreef eigen teksten ("waarom je opzegt", "vul hem gerust opnieuw in"). Die zijn via de API vervangen door de teksten hierboven, binnen het bestaande ontwerp. De afzendernaam is "MailBlue" geworden.
