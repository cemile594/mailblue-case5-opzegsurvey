import { workflow, node, links } from '@n8n-as-code/transformer';

// <workflow-map>
// Workflow : 03 Opzegsurvey – Foutafhandeling
// Nodes   : 3  |  Connections: 2
//
// NODE INDEX
// ──────────────────────────────────────────────────────────────────
// Property name                    Node type (short)         Flags
// BijFoutInOpzegworkflow             errorTrigger
// AlertOpbouwen                      code
// SlackAlertMock                     dataTable
//
// ROUTING MAP
// ──────────────────────────────────────────────────────────────────
// BijFoutInOpzegworkflow
//    → AlertOpbouwen
//      → SlackAlertMock
// </workflow-map>

// =====================================================================
// METADATA DU WORKFLOW
// =====================================================================

@workflow({
    id: 'ze8WVEIUB0woZuMt',
    name: '03 Opzegsurvey – Foutafhandeling',
    active: true,
    isArchived: false,
    settings: { executionOrder: 'v1', timezone: 'Europe/Amsterdam' },
})
export class _03OpzegsurveyFoutafhandelingWorkflow {
    // =====================================================================
    // CONFIGURATION DES NOEUDS
    // =====================================================================

    @node({
        id: '2a72bd64-a11e-4070-a025-dfb8dedc7894',
        name: 'Bij fout in opzegworkflow',
        type: 'n8n-nodes-base.errorTrigger',
        version: 1,
        position: [0, 0],
    })
    BijFoutInOpzegworkflow = {};

    @node({
        id: '2131eaca-b847-4102-a648-18c99e5ecf16',
        name: 'Alert opbouwen',
        type: 'n8n-nodes-base.code',
        version: 2,
        position: [260, 0],
    })
    AlertOpbouwen = {
        mode: 'runOnceForAllItems',
        jsCode: `const e = $input.first().json;
const exec = e.execution || {};
const wf = e.workflow || {};
const err = exec.error || {};
const lines = [
  ':rotating_light: *Opzegsurvey-verwerking mislukt*',
  'Workflow: ' + (wf.name || 'onbekend'),
  'Laatste node: ' + (exec.lastNodeExecuted || 'onbekend'),
  'Fout: ' + String(err.message || 'onbekend').slice(0, 300),
  'Execution: ' + (exec.url || exec.id || 'onbekend'),
  'Actie: open de execution, verwerk de opzegging handmatig. De ruwe inzending staat in data table submission_log (status received).'
];
return [{ json: {
  channel: '#cs-alerts',
  severity: 'critical',
  submission_id: '',
  text: lines.join('\\n'),
  source: 'error-workflow',
  created_at: new Date().toISOString()
}}];`,
    };

    @node({
        id: '3b87c922-0333-4191-bcda-65c9cb3c2505',
        name: 'Slack-alert (mock)',
        type: 'n8n-nodes-base.dataTable',
        version: 1.1,
        position: [520, 0],
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
        this.BijFoutInOpzegworkflow.out(0).to(this.AlertOpbouwen.in(0));
        this.AlertOpbouwen.out(0).to(this.SlackAlertMock.in(0));
    }
}
