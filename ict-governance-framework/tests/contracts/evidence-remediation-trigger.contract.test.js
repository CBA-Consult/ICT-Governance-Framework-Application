/**
 * @contract pillar:secops
 * Evidence divergence remediation trigger — act when cross-source trust breaks down.
 */
const {
  buildRemediationTrigger,
  evaluateRemediationSafeguards,
  enrichEscalationWithRemediationTrigger
} = require('../../services/evidence-remediation-trigger-service');
const { resolveEvidenceChain } = require('../../services/evidence-validation-engine');
const { getClientEscalation } = require('../../services/compliance-client-escalation-service');

describe('Evidence remediation trigger contracts', () => {
  it('queues remediation pipeline when evidence chain is divergent with safeguards passed', () => {
    const escalation = {
      escalationId: 'ces-test',
      tenantId: 'tenant-test',
      priority: 'High',
      evidenceChains: [{
        resolution: 'divergent',
        confidence: 'low',
        sources: [
          { type: 'azure-policy-scan', normalized: 'PASS' },
          { type: 'sentinel-query', normalized: 'FAIL' }
        ]
      }]
    };

    const trigger = buildRemediationTrigger(escalation);

    expect(trigger).not.toBeNull();
    expect(trigger.status).toBe('awaiting-approval');
    expect(trigger.triggerClass).toBe('evidence-conflict');
    expect(trigger.actionPipeline.length).toBeGreaterThan(0);
    expect(trigger.revalidationRequired).toBe(true);
    expect(trigger.requiresApproval).toBe(true);
  });

  it('blocks remediation when only partial resolution exists', () => {
    const escalation = {
      evidenceChains: [{ resolution: 'partial', confidence: 'medium', sources: [{ type: 'a' }, { type: 'b' }] }]
    };

    expect(buildRemediationTrigger(escalation)).toBeNull();
  });

  it('evaluates safeguards for multi-source divergent conflict', () => {
    const chains = [{
      resolution: 'divergent',
      confidence: 'low',
      sources: [{ type: 'graph-api' }, { type: 'sentinel-query' }]
    }];
    const result = evaluateRemediationSafeguards({ evidenceChains: chains }, chains);

    expect(result.passed).toBe(true);
    expect(result.checks.some((c) => c.id === 'multi-source-conflict' && c.passed)).toBe(true);
  });

  it('enriches Contoso divergent demo escalation with remediation trigger', () => {
    const enriched = getClientEscalation('tenant-contoso-health', 'ces-evidence-divergent-demo');
    if (!enriched) return;

    expect(enriched.evidenceAlert).toBe(true);
    expect(enriched.evidenceConflictClass).toBe('evidence-conflict');
    expect(enriched.remediationTrigger).toBeDefined();
    expect(enriched.remediationTrigger.status).toBe('awaiting-approval');
    expect(enriched.remediationTrigger.actionPipeline.some((a) => a.actionId === 'revalidate-evidence-chain')).toBe(true);
  });

  it('does not trigger remediation on consistent Contoso MFA escalation', () => {
    const enriched = getClientEscalation('tenant-contoso-health', 'ces-1781953894979-8db7422d');
    if (!enriched) return;

    expect(enriched.remediationTrigger).toBeUndefined();
    expect(enriched.evidenceAlert).toBe(false);
  });

  it('confirms divergent chain from policy pass and sentinel bypass', () => {
    const chain = resolveEvidenceChain([
      { type: 'azure-policy-scan', status: 'compliant', observedValue: '100%' },
      { type: 'graph-api', status: 'compliant', observedValue: '100% active-eligible' },
      { type: 'sentinel-query', status: 'mfa bypass detected', observedValue: 'MFA bypass events detected' }
    ]);

    expect(chain.resolution).toBe('divergent');
    expect(chain.requiresEscalation).toBe(true);
  });
});
