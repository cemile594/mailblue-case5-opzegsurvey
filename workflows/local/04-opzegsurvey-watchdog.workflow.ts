import { workflow, node, links } from '@n8n-as-code/transformer';

// <workflow-map>
// Workflow : 04 Opzegsurvey – Watchdog
// Nodes   : 5  |  Connections: 4
//
// NODE INDEX
// ──────────────────────────────────────────────────────────────────
// Property name                    Node type (short)         Flags
// Elke15Minuten                      scheduleTrigger
// HandmatigStarten                   manualTrigger
// OnverwerkteInzendingen             dataTable                  [alwaysOutput]
// OuderDan10Minuten                  code
// SlackAlertMock                     dataTable
//
// ROUTING MAP
// ──────────────────────────────────────────────────────────────────
// Elke15Minuten
//    → OnverwerkteInzendingen
//      → OuderDan10Minuten
//        → SlackAlertMock
// HandmatigStarten
//    → OnverwerkteInzendingen (↩ loop)
// </workflow-map>

// =====================================================================
// METADATA DU WORKFLOW
// =====================================================================

@workflow({
    id: '1xoGEkyEVSpVCP3n',
    name: '04 Opzegsurvey – Watchdog',
    active: true,
    isArchived: false,
    settings: { executionOrder: 'v1', timezone: 'Europe/Amsterdam' },
})
export class _04OpzegsurveyWatchdogWorkflow {
    // =====================================================================
    // CONFIGURATION DES NOEUDS
    // =====================================================================

    @node({
        id: 'ba064b4a-12f1-429d-98e2-903701ad4631',
        name: 'Elke 15 minuten',
        type: 'n8n-nodes-base.scheduleTrigger',
        version: 1.2,
        position: [0, -100],
    })
    Elke15Minuten = {
        rule: {
            interval: [
                {
                    field: 'minutes',
                    minutesInterval: 15,
                },
            ],
        },
    };

    @node({
        id: 'c9178601-b333-4223-9e22-5e4ab309322f',
        name: 'Handmatig starten',
        type: 'n8n-nodes-base.manualTrigger',
        version: 1,
        position: [0, 100],
    })
    HandmatigStarten = {};

    @node({
        id: '90a0b357-f11b-4628-80a6-2606796ddaae',
        name: 'Onverwerkte inzendingen',
        type: 'n8n-nodes-base.dataTable',
        version: 1.1,
        position: [260, 0],
        alwaysOutputData: true,
        notes: 'Alles wat binnenkwam (status received) maar nooit op processed is gezet.',
    })
    OnverwerkteInzendingen = {
        resource: 'row',
        operation: 'get',
        dataTableId: {
            __rl: true,
            value: 'submission_log',
            mode: 'name',
        },
        matchType: 'allConditions',
        filters: {
            conditions: [
                {
                    keyName: 'status',
                    condition: 'eq',
                    keyValue: 'received',
                },
            ],
        },
        returnAll: true,
    };

    @node({
        id: 'e4136112-7c00-4b0e-8ddd-75cbb3035f47',
        name: 'Ouder dan 10 minuten?',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [520, 0],
        notes: 'Geeft 0 items terug als alles in orde is, dan stopt de flow vanzelf.',
    })
    OuderDan10Minuten = {
        mode: 'runOnceForAllItems',
        jsCode: `const grens = Date.now() - 10 * 60 * 1000;
const vast = $input.all()
  .map(i => i.json)
  .filter(r => r.submission_id && r.received_at && new Date(r.received_at).getTime() < grens);
if (vast.length === 0) return [];
const regels = vast.map(r => '• ' + r.submission_id + ' (' + (r.email || 'geen e-mail') + ', ontvangen ' + r.received_at + ')');
return [{ json: {
  channel: '#cs-alerts',
  severity: 'critical',
  submission_id: vast.map(r => r.submission_id).join(','),
  text: ':warning: *' + vast.length + ' opzegging(en) niet volledig verwerkt*\\n' + regels.join('\\n') + '\\nActie: verwerk handmatig of herstart de inzending; ruwe payload staat in submission_log.',
  source: 'watchdog',
  created_at: new Date().toISOString()
}}];`,
    };

    @node({
        id: '210e1844-c6a3-45b6-acaf-f7f1519057a9',
        name: 'Slack-alert (mock)',
        type: 'n8n-nodes-base.dataTable',
        version: 1.1,
        position: [780, 0],
    })
    SlackAlertMock = {
        resource: 'row',
        operation: 'insert',
        dataTableId: {
            __rl: true,
            value: 'slack_messages',
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

    // =====================================================================
    // ROUTAGE ET CONNEXIONS
    // =====================================================================

    @links()
    defineRouting() {
        this.Elke15Minuten.out(0).to(this.OnverwerkteInzendingen.in(0));
        this.HandmatigStarten.out(0).to(this.OnverwerkteInzendingen.in(0));
        this.OnverwerkteInzendingen.out(0).to(this.OuderDan10Minuten.in(0));
        this.OuderDan10Minuten.out(0).to(this.SlackAlertMock.in(0));
    }
}
