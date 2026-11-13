import { workflow, node, links } from '@n8n-as-code/transformer';

// <workflow-map>
// Workflow : 00 Setup – Mock data (Data Tables)
// Nodes   : 15  |  Connections: 14
//
// NODE INDEX
// ──────────────────────────────────────────────────────────────────
// Property name                    Node type (short)         Flags
// HandmatigStarten                   manualTrigger
// WebhookSetupMockData               webhook
// MaakTabelBackofficeCustomers       dataTable                  [executeOnce]
// MaakTabelMoneybirdInvoices         dataTable                  [executeOnce]
// MaakTabelSlackMessages             dataTable                  [executeOnce]
// MaakTabelSubmissionLog             dataTable                  [executeOnce]
// LeegBackofficeCustomers            dataTable                  [executeOnce]
// LeegMoneybirdInvoices              dataTable                  [executeOnce]
// LeegSlackMessages                  dataTable                  [executeOnce]
// LeegSubmissionLog                  dataTable                  [executeOnce]
// BackofficeRijenMock                code                       [executeOnce]
// BackofficeInvoegen                 dataTable
// MoneybirdFacturenMock              code                       [executeOnce]
// MoneybirdFacturenInvoegen          dataTable
// Samenvatting                       code
//
// ROUTING MAP
// ──────────────────────────────────────────────────────────────────
// HandmatigStarten
//    → MaakTabelBackofficeCustomers
//      → MaakTabelMoneybirdInvoices
//        → MaakTabelSlackMessages
//          → MaakTabelSubmissionLog
//            → LeegBackofficeCustomers
//              → LeegMoneybirdInvoices
//                → LeegSlackMessages
//                  → LeegSubmissionLog
//                    → BackofficeRijenMock
//                      → BackofficeInvoegen
//                        → MoneybirdFacturenMock
//                          → MoneybirdFacturenInvoegen
//                            → Samenvatting
// WebhookSetupMockData
//    → MaakTabelBackofficeCustomers (↩ loop)
// </workflow-map>

// =====================================================================
// METADATA DU WORKFLOW
// =====================================================================

@workflow({
    id: 'DnnknaCMb2KvAIUB',
    name: '00 Setup – Mock data (Data Tables)',
    active: true,
    isArchived: false,
    settings: { executionOrder: 'v1', timezone: 'Europe/Amsterdam' },
})
export class _00SetupMockDataDataTablesWorkflow {
    // =====================================================================
    // CONFIGURATION DES NOEUDS
    // =====================================================================

    @node({
        id: 'aebc1137-59a7-42c1-b108-3d197e8ffefb',
        name: 'Handmatig starten',
        type: 'n8n-nodes-base.manualTrigger',
        version: 1,
        position: [0, -160],
    })
    HandmatigStarten = {};

    @node({
        id: 'ce2584b5-4a43-4bf8-89aa-ab740f0387e8',
        webhookId: 'a3f1c2d4-5b6e-4f70-8a91-0b2c3d4e5f61',
        name: 'Webhook setup-mock-data',
        type: 'n8n-nodes-base.webhook',
        version: 2.1,
        position: [0, 160],
    })
    WebhookSetupMockData = {
        httpMethod: 'POST',
        path: 'setup-mock-data',
        responseMode: 'lastNode',
        responseData: 'firstEntryJson',
        options: {},
    };

    @node({
        id: '80521453-2566-446f-9bd0-1d7afe3e1c2b',
        name: 'Maak tabel backoffice_customers',
        type: 'n8n-nodes-base.dataTable',
        version: 1.1,
        position: [260, 0],
        executeOnce: true,
    })
    MaakTabelBackofficeCustomers = {
        resource: 'table',
        operation: 'create',
        tableName: 'backoffice_customers',
        columns: {
            column: [
                {
                    name: 'customer_id',
                    type: 'string',
                },
                {
                    name: 'naam',
                    type: 'string',
                },
                {
                    name: 'email',
                    type: 'string',
                },
                {
                    name: 'plan',
                    type: 'string',
                },
                {
                    name: 'arr_abonnement',
                    type: 'number',
                },
                {
                    name: 'arr_addons',
                    type: 'number',
                },
                {
                    name: 'taal',
                    type: 'string',
                },
                {
                    name: 'moneybird_contact_id',
                    type: 'string',
                },
                {
                    name: 'cs_owner',
                    type: 'string',
                },
            ],
        },
        options: {
            createIfNotExists: true,
        },
    };

    @node({
        id: '244e8bc3-12e5-4f3e-9a06-f6fb1bc49cd0',
        name: 'Maak tabel moneybird_invoices',
        type: 'n8n-nodes-base.dataTable',
        version: 1.1,
        position: [500, 0],
        executeOnce: true,
    })
    MaakTabelMoneybirdInvoices = {
        resource: 'table',
        operation: 'create',
        tableName: 'moneybird_invoices',
        columns: {
            column: [
                {
                    name: 'mb_id',
                    type: 'string',
                },
                {
                    name: 'contact_id',
                    type: 'string',
                },
                {
                    name: 'invoice_id',
                    type: 'string',
                },
                {
                    name: 'state',
                    type: 'string',
                },
                {
                    name: 'invoice_date',
                    type: 'string',
                },
                {
                    name: 'due_date',
                    type: 'string',
                },
                {
                    name: 'currency',
                    type: 'string',
                },
                {
                    name: 'total_price_incl_tax',
                    type: 'number',
                },
                {
                    name: 'total_unpaid',
                    type: 'number',
                },
            ],
        },
        options: {
            createIfNotExists: true,
        },
    };

    @node({
        id: '2c133b6a-5808-4873-9b21-20e0508f9417',
        name: 'Maak tabel slack_messages',
        type: 'n8n-nodes-base.dataTable',
        version: 1.1,
        position: [740, 0],
        executeOnce: true,
    })
    MaakTabelSlackMessages = {
        resource: 'table',
        operation: 'create',
        tableName: 'slack_messages',
        columns: {
            column: [
                {
                    name: 'channel',
                    type: 'string',
                },
                {
                    name: 'severity',
                    type: 'string',
                },
                {
                    name: 'submission_id',
                    type: 'string',
                },
                {
                    name: 'text',
                    type: 'string',
                },
                {
                    name: 'source',
                    type: 'string',
                },
                {
                    name: 'created_at',
                    type: 'string',
                },
            ],
        },
        options: {
            createIfNotExists: true,
        },
    };

    @node({
        id: '4d486d5e-a14c-4542-b2ed-3aa0950f5f0c',
        name: 'Maak tabel submission_log',
        type: 'n8n-nodes-base.dataTable',
        version: 1.1,
        position: [980, 0],
        executeOnce: true,
    })
    MaakTabelSubmissionLog = {
        resource: 'table',
        operation: 'create',
        tableName: 'submission_log',
        columns: {
            column: [
                {
                    name: 'submission_id',
                    type: 'string',
                },
                {
                    name: 'status',
                    type: 'string',
                },
                {
                    name: 'email',
                    type: 'string',
                },
                {
                    name: 'customer_id',
                    type: 'string',
                },
                {
                    name: 'received_at',
                    type: 'string',
                },
                {
                    name: 'processed_at',
                    type: 'string',
                },
                {
                    name: 'raw_payload',
                    type: 'string',
                },
                {
                    name: 'deal_id',
                    type: 'string',
                },
                {
                    name: 'stage',
                    type: 'string',
                },
                {
                    name: 'flags',
                    type: 'string',
                },
            ],
        },
        options: {
            createIfNotExists: true,
        },
    };

    @node({
        id: '65fe637e-d46b-4b91-84de-dcc2ddfb4347',
        name: 'Leeg backoffice_customers',
        type: 'n8n-nodes-base.dataTable',
        version: 1.1,
        position: [1220, 0],
        executeOnce: true,
    })
    LeegBackofficeCustomers = {
        resource: 'table',
        operation: 'clear',
        dataTableId: {
            __rl: true,
            value: 'backoffice_customers',
            mode: 'name',
        },
    };

    @node({
        id: '9e7ef90f-3670-4635-b284-bc4a03b8a2d8',
        name: 'Leeg moneybird_invoices',
        type: 'n8n-nodes-base.dataTable',
        version: 1.1,
        position: [1460, 0],
        executeOnce: true,
    })
    LeegMoneybirdInvoices = {
        resource: 'table',
        operation: 'clear',
        dataTableId: {
            __rl: true,
            value: 'moneybird_invoices',
            mode: 'name',
        },
    };

    @node({
        id: 'c94634f4-1b4e-4e68-b421-cefe275d3daf',
        name: 'Leeg slack_messages',
        type: 'n8n-nodes-base.dataTable',
        version: 1.1,
        position: [1700, 0],
        executeOnce: true,
    })
    LeegSlackMessages = {
        resource: 'table',
        operation: 'clear',
        dataTableId: {
            __rl: true,
            value: 'slack_messages',
            mode: 'name',
        },
    };

    @node({
        id: '6d74007d-e6d8-4b7d-bcee-e6be8d8a73bd',
        name: 'Leeg submission_log',
        type: 'n8n-nodes-base.dataTable',
        version: 1.1,
        position: [1940, 0],
        executeOnce: true,
    })
    LeegSubmissionLog = {
        resource: 'table',
        operation: 'clear',
        dataTableId: {
            __rl: true,
            value: 'submission_log',
            mode: 'name',
        },
    };

    @node({
        id: '16351e24-1422-4330-bc05-b45bf0a32eed',
        name: 'Backoffice-rijen (mock)',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [2180, 0],
        executeOnce: true,
    })
    BackofficeRijenMock = {
        mode: 'runOnceForAllItems',
        jsCode: `// Fictieve backoffice-data uit de case (+1 extra klant voor het niet-topklant-pad)
const rows = [
  {
    "customer_id": "cust_8821",
    "naam": "Blauwdruk B.V.",
    "email": "info@blauwdruk-voorbeeld.nl",
    "plan": "Plus",
    "arr_abonnement": 1788,
    "arr_addons": 1440,
    "taal": "nl",
    "moneybird_contact_id": "mb_c_310001",
    "cs_owner": "Sanne (CS)"
  },
  {
    "customer_id": "cust_4410",
    "naam": "Northwind Studio",
    "email": "hello@northwind-example.com",
    "plan": "Pro",
    "arr_abonnement": 4200,
    "arr_addons": 0,
    "taal": "en",
    "moneybird_contact_id": "mb_c_310002",
    "cs_owner": "Mark (CS)"
  },
  {
    "customer_id": "cust_7001",
    "naam": "Bakkerij De Korrel",
    "email": "bestellen@dekorrel-voorbeeld.nl",
    "plan": "Lite",
    "arr_abonnement": 588,
    "arr_addons": 0,
    "taal": "nl",
    "moneybird_contact_id": "mb_c_310003",
    "cs_owner": "Sanne (CS)"
  }
];
return rows.map(r => ({ json: r }));`,
    };

    @node({
        id: '46a60a6a-d7bc-4b87-8a9a-d1c3b570664c',
        name: 'Backoffice invoegen',
        type: 'n8n-nodes-base.dataTable',
        version: 1.1,
        position: [2420, 0],
    })
    BackofficeInvoegen = {
        resource: 'row',
        operation: 'insert',
        dataTableId: {
            __rl: true,
            value: 'backoffice_customers',
            mode: 'name',
        },
        columns: {
            mappingMode: 'autoMapInputData',
            value: {},
            matchingColumns: [],
            schema: [],
        },
        options: {},
    };

    @node({
        id: 'b9dd6734-a31a-4558-8c23-622dc050c1cd',
        name: 'MoneyBird-facturen (mock)',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [2660, 0],
        executeOnce: true,
    })
    MoneybirdFacturenMock = {
        mode: 'runOnceForAllItems',
        jsCode: `// Fictieve MoneyBird sales invoices (velden zoals de echte API; 'id' heet hier mb_id omdat data tables zelf een id-kolom hebben)
const rows = [
  {
    "mb_id": "mb_inv_900101",
    "contact_id": "mb_c_310001",
    "invoice_id": "2026-0412",
    "state": "late",
    "invoice_date": "2026-08-13",
    "due_date": "2026-09-12",
    "currency": "EUR",
    "total_price_incl_tax": 149.0,
    "total_unpaid": 149.0
  },
  {
    "mb_id": "mb_inv_900102",
    "contact_id": "mb_c_310001",
    "invoice_id": "2026-0377",
    "state": "paid",
    "invoice_date": "2026-07-13",
    "due_date": "2026-08-12",
    "currency": "EUR",
    "total_price_incl_tax": 149.0,
    "total_unpaid": 0.0
  },
  {
    "mb_id": "mb_inv_900201",
    "contact_id": "mb_c_310002",
    "invoice_id": "2026-0450",
    "state": "paid",
    "invoice_date": "2026-10-01",
    "due_date": "2026-10-31",
    "currency": "EUR",
    "total_price_incl_tax": 4200.0,
    "total_unpaid": 0.0
  },
  {
    "mb_id": "mb_inv_900301",
    "contact_id": "mb_c_310003",
    "invoice_id": "2026-0488",
    "state": "open",
    "invoice_date": "2026-10-20",
    "due_date": "2026-11-19",
    "currency": "EUR",
    "total_price_incl_tax": 49.0,
    "total_unpaid": 49.0
  }
];
return rows.map(r => ({ json: r }));`,
    };

    @node({
        id: '0888e67a-cddd-45b4-9e62-17c80e818ff3',
        name: 'MoneyBird-facturen invoegen',
        type: 'n8n-nodes-base.dataTable',
        version: 1.1,
        position: [2900, 0],
    })
    MoneybirdFacturenInvoegen = {
        resource: 'row',
        operation: 'insert',
        dataTableId: {
            __rl: true,
            value: 'moneybird_invoices',
            mode: 'name',
        },
        columns: {
            mappingMode: 'autoMapInputData',
            value: {},
            matchingColumns: [],
            schema: [],
        },
        options: {},
    };

    @node({
        id: '5ea7d94e-c9ef-4928-aeef-4eedf4ce5310',
        name: 'Samenvatting',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [3140, 0],
    })
    Samenvatting = {
        mode: 'runOnceForAllItems',
        jsCode: `return [{ json: {
  status: 'ok',
  tabellen: ['backoffice_customers', 'moneybird_invoices', 'slack_messages', 'submission_log'],
  backoffice_rijen: $('Backoffice-rijen (mock)').all().length,
  moneybird_rijen: $input.all().length,
  opmerking: 'slack_messages en submission_log zijn geleegd (demo-reset).'
}}];`,
    };

    // =====================================================================
    // ROUTAGE ET CONNEXIONS
    // =====================================================================

    @links()
    defineRouting() {
        this.HandmatigStarten.out(0).to(this.MaakTabelBackofficeCustomers.in(0));
        this.WebhookSetupMockData.out(0).to(this.MaakTabelBackofficeCustomers.in(0));
        this.MaakTabelBackofficeCustomers.out(0).to(this.MaakTabelMoneybirdInvoices.in(0));
        this.MaakTabelMoneybirdInvoices.out(0).to(this.MaakTabelSlackMessages.in(0));
        this.MaakTabelSlackMessages.out(0).to(this.MaakTabelSubmissionLog.in(0));
        this.MaakTabelSubmissionLog.out(0).to(this.LeegBackofficeCustomers.in(0));
        this.LeegBackofficeCustomers.out(0).to(this.LeegMoneybirdInvoices.in(0));
        this.LeegMoneybirdInvoices.out(0).to(this.LeegSlackMessages.in(0));
        this.LeegSlackMessages.out(0).to(this.LeegSubmissionLog.in(0));
        this.LeegSubmissionLog.out(0).to(this.BackofficeRijenMock.in(0));
        this.BackofficeRijenMock.out(0).to(this.BackofficeInvoegen.in(0));
        this.BackofficeInvoegen.out(0).to(this.MoneybirdFacturenMock.in(0));
        this.MoneybirdFacturenMock.out(0).to(this.MoneybirdFacturenInvoegen.in(0));
        this.MoneybirdFacturenInvoegen.out(0).to(this.Samenvatting.in(0));
    }
}
