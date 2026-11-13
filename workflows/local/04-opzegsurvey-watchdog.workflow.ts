import { workflow, node, links } from '@n8n-as-code/transformer';

// <workflow-map>
// Workflow : 04 Opzegsurvey – Watcher
// Nodes   : 7  |  Connections: 6
//
// NODE INDEX
// ──────────────────────────────────────────────────────────────────
// Property name                    Node type (short)         Flags
// Elke15Minuten                      scheduleTrigger
// HandmatigStarten                   manualTrigger
// OnverwerkteInzendingen             dataTable                  [alwaysOutput]
// OuderDan10Minuten                  code
// SlackAlertMock                     dataTable
// PerInzending                       code
// MarkeerAlsGemeld                   dataTable
//
// ROUTING MAP
// ──────────────────────────────────────────────────────────────────
// Elke15Minuten
//    → OnverwerkteInzendingen
//      → OuderDan10Minuten
//        → SlackAlertMock
//          → PerInzending
//            → MarkeerAlsGemeld
// HandmatigStarten
//    → OnverwerkteInzendingen (↩ loop)
// </workflow-map>

// =====================================================================
// METADATA DU WORKFLOW
// =====================================================================

@workflow({
    id: '1xoGEkyEVSpVCP3n',
    name: '04 Opzegsurvey – Watcher',
    active: true,
    isArchived: false,
    settings: { executionOrder: 'v1', timezone: 'Europe/Amsterdam', binaryMode: 'separate' },
})
export class _04OpzegsurveyWatcherWorkflow {
    // =====================================================================
    // CONFIGURATION DES NOEUDS
    // =====================================================================

    @node({
        id: 'ba064b4a-12f1-429d-98e2-903701ad4631',
        name: 'Elke 15 minuten',
        type: 'n8n-nodes-base.scheduleTrigger',
        version: 1.2,
        position: [0, -96],
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
        position: [0, 96],
    })
    HandmatigStarten = {};

    @node({
        id: '90a0b357-f11b-4628-80a6-2606796ddaae',
        name: 'Onverwerkte inzendingen',
        type: 'n8n-nodes-base.dataTable',
        version: 1.1,
        position: [256, 0],
        alwaysOutputData: true,
        notes: 'Alles wat binnenkwam (status received) maar nooit op processed is gezet.',
    })
    OnverwerkteInzendingen = {
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
        position: [528, 0],
        notes: 'Geeft 0 items terug als alles in orde is, dan stopt de flow vanzelf.',
    })
    OuderDan10Minuten = {
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
  text: ':warning: *' + vast.length + ' opzegging(en) niet volledig verwerkt*\\n' + regels.join('\\n') + '\\nActie: verwerk handmatig of herstart de inzending; ruwe payload staat in submission_log (status nu escalated, je krijgt deze melding één keer).',
  source: 'watchdog',
  created_at: new Date().toISOString()
}}];`,
    };

    @node({
        id: '210e1844-c6a3-45b6-acaf-f7f1519057a9',
        name: 'Slack-alert (mock)',
        type: 'n8n-nodes-base.dataTable',
        version: 1.1,
        position: [784, 0],
    })
    SlackAlertMock = {
        dataTableId: {
            __rl: true,
            value: 'c5_slack_messages',
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
        id: '7d3c2a10-5e4f-4b6a-9c8d-1f2e3a4b5c6d',
        name: 'Per inzending',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [1040, 0],
        notes: 'Eén item per gemelde inzending, zodat de volgende stap ze allemaal markeert.',
    })
    PerInzending = {
        jsCode: `const ids = String($('Ouder dan 10 minuten?').first().json.submission_id || '').split(',').filter(Boolean);
return ids.map(id => ({ json: { submission_id: id } }));`,
    };

    @node({
        id: '8e4d3b21-6f5a-4c7b-8d9e-2a3b4c5d6e7f',
        name: 'Markeer als gemeld',
        type: 'n8n-nodes-base.dataTable',
        version: 1.1,
        position: [1296, 0],
        notes: 'Status received -> escalated: CS is gewaarschuwd, dus de watchdog meldt deze inzending niet elk kwartier opnieuw. De rij blijft in submission_log staan tot iemand hem afhandelt.',
    })
    MarkeerAlsGemeld = {
        operation: 'update',
        dataTableId: {
            __rl: true,
            value: 'submission_log',
            mode: 'name',
        },
        matchType: 'allConditions',
        filters: {
            conditions: [
                {
                    keyName: 'submission_id',
                    keyValue: '={{ $json.submission_id }}',
                },
            ],
        },
        columns: {
            mappingMode: 'defineBelow',
            value: {
                status: 'escalated',
            },
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
        this.SlackAlertMock.out(0).to(this.PerInzending.in(0));
        this.PerInzending.out(0).to(this.MarkeerAlsGemeld.in(0));
    }
}
