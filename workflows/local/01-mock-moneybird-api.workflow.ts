import { workflow, node, links } from '@n8n-as-code/transformer';

// <workflow-map>
// Workflow : 01 Mock – MoneyBird API
// Nodes   : 7  |  Connections: 6
//
// NODE INDEX
// ──────────────────────────────────────────────────────────────────
// Property name                    Node type (short)         Flags
// GetSalesInvoices                   webhook
// AuthFilterLezen                    code
// Geautoriseerd                      if
// FacturenOphalen                    dataTable                  [alwaysOutput]
// NaarMoneybirdFormaat               code
// AntwoordFacturen                   respondToWebhook
// Antwoord401                        respondToWebhook
//
// ROUTING MAP
// ──────────────────────────────────────────────────────────────────
// GetSalesInvoices
//    → AuthFilterLezen
//      → Geautoriseerd
//        → FacturenOphalen
//          → NaarMoneybirdFormaat
//            → AntwoordFacturen
//       .out(1) → Antwoord401
// </workflow-map>

// =====================================================================
// METADATA DU WORKFLOW
// =====================================================================

@workflow({
    id: 'sklEkPPVQBg569o6',
    name: '01 Mock – MoneyBird API',
    active: true,
    isArchived: false,
    settings: { executionOrder: 'v1', timezone: 'Europe/Amsterdam' },
})
export class _01MockMoneybirdApiWorkflow {
    // =====================================================================
    // CONFIGURATION DES NOEUDS
    // =====================================================================

    @node({
        id: '7dadd987-f661-4a01-9869-a5c30110f86f',
        webhookId: 'b7e2d1c0-4a5b-4c6d-9e8f-1a2b3c4d5e6f',
        name: 'GET sales_invoices',
        type: 'n8n-nodes-base.webhook',
        version: 2.1,
        position: [0, 0],
    })
    GetSalesInvoices = {
        httpMethod: 'GET',
        path: 'mock-moneybird/api/v2/adm-mailblue/sales_invoices',
        responseMode: 'responseNode',
        options: {},
    };

    @node({
        id: 'ca4eb705-7244-48c1-8597-e7d7e7403905',
        name: 'Auth & filter lezen',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [240, 0],
    })
    AuthFilterLezen = {
        mode: 'runOnceForAllItems',
        jsCode: `const req = $input.first().json;
const auth = String((req.headers || {}).authorization || '');
const filter = String((req.query || {}).filter || '');
// MoneyBird-filtersyntax: "state:open|late,contact_id:123"
const parts = {};
for (const p of filter.split(',')) {
  const i = p.indexOf(':');
  if (i > 0) parts[p.slice(0, i).trim()] = p.slice(i + 1).trim();
}
return [{ json: {
  authorized: auth.startsWith('Bearer ') && auth.length > 7,
  contact_id: parts.contact_id || '',
  states: parts.state ? parts.state.split('|') : [],
  administration_id: 'adm-mailblue'
}}];`,
    };

    @node({
        id: '9c7e74d8-ccb9-4807-b16a-f1aa09cc12f8',
        name: 'Geautoriseerd?',
        type: 'n8n-nodes-base.if',
        version: 2.3,
        position: [480, 0],
    })
    Geautoriseerd = {
        conditions: {
            combinator: 'and',
            options: {
                caseSensitive: true,
                leftValue: '',
                typeValidation: 'strict',
                version: 3,
            },
            conditions: [
                {
                    leftValue: '={{ $json.authorized }}',
                    rightValue: true,
                    operator: {
                        type: 'boolean',
                        operation: 'true',
                        singleValue: true,
                    },
                },
            ],
        },
        looseTypeValidation: false,
        options: {},
    };

    @node({
        id: '22547f49-f305-45e6-854b-8143716c6b41',
        name: 'Facturen ophalen',
        type: 'n8n-nodes-base.dataTable',
        version: 1.1,
        position: [720, -100],
        alwaysOutputData: true,
    })
    FacturenOphalen = {
        resource: 'row',
        operation: 'get',
        dataTableId: {
            __rl: true,
            value: 'moneybird_invoices',
            mode: 'name',
        },
        matchType: 'allConditions',
        filters: {
            conditions: [
                {
                    keyName: 'contact_id',
                    condition: 'eq',
                    keyValue: "={{ $json.contact_id || '__geen__' }}",
                },
            ],
        },
        returnAll: true,
    };

    @node({
        id: '8fec4338-854c-4301-9c4f-3b549036b3a6',
        name: 'Naar MoneyBird-formaat',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [960, -100],
    })
    NaarMoneybirdFormaat = {
        mode: 'runOnceForAllItems',
        jsCode: `const req = $('Auth & filter lezen').first().json;
const states = req.states;
const invoices = $input.all()
  .map(i => i.json)
  .filter(r => r.mb_id)
  .filter(r => states.length === 0 || states.includes(r.state))
  .map(r => ({
    id: r.mb_id,
    administration_id: req.administration_id,
    contact_id: r.contact_id,
    invoice_id: r.invoice_id,
    state: r.state,
    invoice_date: r.invoice_date,
    due_date: r.due_date,
    currency: r.currency,
    total_price_incl_tax: Number(r.total_price_incl_tax).toFixed(2),
    total_unpaid: Number(r.total_unpaid).toFixed(2)
  }));
return [{ json: { invoices } }];`,
    };

    @node({
        id: 'ea01cd7c-b3ba-4653-bb70-598b25510296',
        name: 'Antwoord: facturen',
        type: 'n8n-nodes-base.respondToWebhook',
        version: 1.5,
        position: [1200, -100],
    })
    AntwoordFacturen = {
        respondWith: 'json',
        responseBody: '={{ JSON.stringify($json.invoices) }}',
        options: {
            responseCode: 200,
        },
    };

    @node({
        id: '5a32ef5c-4ca1-4c41-9612-b57931f748fa',
        name: 'Antwoord: 401',
        type: 'n8n-nodes-base.respondToWebhook',
        version: 1.5,
        position: [720, 120],
    })
    Antwoord401 = {
        respondWith: 'json',
        responseBody: '{ "error": "Unauthorized", "symbol": "unauthorized" }',
        options: {
            responseCode: 401,
        },
    };

    // =====================================================================
    // ROUTAGE ET CONNEXIONS
    // =====================================================================

    @links()
    defineRouting() {
        this.GetSalesInvoices.out(0).to(this.AuthFilterLezen.in(0));
        this.AuthFilterLezen.out(0).to(this.Geautoriseerd.in(0));
        this.Geautoriseerd.out(0).to(this.FacturenOphalen.in(0));
        this.Geautoriseerd.out(1).to(this.Antwoord401.in(0));
        this.FacturenOphalen.out(0).to(this.NaarMoneybirdFormaat.in(0));
        this.NaarMoneybirdFormaat.out(0).to(this.AntwoordFacturen.in(0));
    }
}
