/**
 * @contract pillar:secops
 * Manual remediation orchestration — deterministic execution, lifecycle states, and audit lineage.
 */
const path = require('path');
const fs = require('fs');
const {
  loadRemediationPlan,
  executeRemediation,
  getRemediationRun,
  listRemediationRuns,
  closeRemediationRun
} = require('../../services/remediation-orchestrator-service');
const {
  canTransition,
  REMEDIATION_STATES,
  isVerifiedEvidenceChain
} = require('../../services/remediation-state-machine');

const TENANT = 'tenant-contoso-health';
const RUNS_DIR = path.join(
  __dirname,
  '../../../adpa/tenants',
  TENANT,
  'remediation-runs'
);

describe('Remediation orchestration contracts', () => {
  const createdRunIds = [];

  afterAll(() => {
    for (const id of createdRunIds) {
      const file = path.join(RUNS_DIR, `${id}.json`);
      if (fs.existsSync(file)) fs.unlinkSync(file);
    }
  });

  it('loads deterministic MFA redeploy plan from bridge', () => {
    const plan = loadRemediationPlan('mfa-redeploy-plan');

    expect(plan).not.toBeNull();
    expect(plan.requirementId).toBe('identity-mfa-requirement');
    expect(plan.steps).toHaveLength(3);
    expect(plan.steps.map((s) => s.stepId)).toEqual([
      'reapply-ca-policy',
      'invalidate-sessions',
      'revalidate'
    ]);
    expect(plan.triggerMode).toBe('manual-only');
  });

  it('executes all steps and reaches verified when evidence chain is consistent', async () => {
    const plan = loadRemediationPlan('mfa-redeploy-plan');
    const run = await executeRemediation(plan, {
      tenantId: TENANT,
      requirementId: 'identity-mfa-requirement',
      planId: 'mfa-redeploy-plan',
      escalationId: 'ces-evidence-divergent-demo',
      executedBy: 'contract-test@example.com'
    });
    createdRunIds.push(run.remediationRunId);

    expect(run.status).toBe('verified');
    expect(run.executedSteps).toHaveLength(3);
    expect(run.executedSteps.every((s) => s.success)).toBe(true);
    expect(run.lineageId).toBeTruthy();
    expect(run.triggerMode).toBe('manual');
    expect(isVerifiedEvidenceChain(run.finalValidation)).toBe(true);
    expect(run.finalValidation.evidenceChain.resolution).toBe('consistent');
    expect(run.finalValidation.evidenceChain.confidence).toBe('high');
  });

  it('records governed lifecycle transitions in statusHistory', async () => {
    const plan = loadRemediationPlan('mfa-redeploy-plan');
    const run = await executeRemediation(plan, {
      tenantId: TENANT,
      requirementId: 'identity-mfa-requirement',
      planId: 'mfa-redeploy-plan',
      executedBy: 'contract-test@example.com'
    });
    createdRunIds.push(run.remediationRunId);

    expect(run.statusHistory.map((h) => h.status)).toEqual([
      'pending',
      'running',
      'completed',
      'verified'
    ]);
    expect(run.statusHistory.every((h) => h.at && h.by)).toBe(true);
  });

  it('persists remediation run for audit lineage', async () => {
    const plan = loadRemediationPlan('mfa-redeploy-plan');
    const run = await executeRemediation(plan, {
      tenantId: TENANT,
      requirementId: 'identity-mfa-requirement',
      planId: 'mfa-redeploy-plan',
      executedBy: 'contract-test@example.com'
    });
    createdRunIds.push(run.remediationRunId);

    const stored = getRemediationRun(TENANT, run.remediationRunId);
    expect(stored.remediationRunId).toBe(run.remediationRunId);
    expect(stored.status).toBe('verified');
    expect(stored.executedBy).toBe('contract-test@example.com');

    const runs = listRemediationRuns(TENANT);
    expect(runs.some((r) => r.remediationRunId === run.remediationRunId)).toBe(true);
  });

  it('closes verified runs and rejects close from non-verified states', async () => {
    const plan = loadRemediationPlan('mfa-redeploy-plan');
    const run = await executeRemediation(plan, {
      tenantId: TENANT,
      requirementId: 'identity-mfa-requirement',
      executedBy: 'contract-test@example.com'
    });
    createdRunIds.push(run.remediationRunId);

    const closed = closeRemediationRun(TENANT, run.remediationRunId, {
      by: 'operator@example.com',
      reason: 'escalation-resolved'
    });

    expect(closed.status).toBe('closed');
    expect(closed.closedBy).toBe('operator@example.com');
    expect(closed.statusHistory.map((h) => h.status)).toContain('closed');

    expect(() => closeRemediationRun(TENANT, run.remediationRunId, { by: 'operator@example.com' }))
      .toThrow(/must be verified/);
  });

  it('enforces valid state transitions in the state machine', () => {
    expect(REMEDIATION_STATES).toContain('verified');
    expect(canTransition(null, 'pending')).toBe(true);
    expect(canTransition('pending', 'running')).toBe(true);
    expect(canTransition('running', 'completed')).toBe(true);
    expect(canTransition('completed', 'verified')).toBe(true);
    expect(canTransition('verified', 'closed')).toBe(true);
    expect(canTransition('running', 'verified')).toBe(false);
    expect(canTransition('failed', 'closed')).toBe(false);
  });

  it('stops on first failed step and transitions to failed', async () => {
    const plan = loadRemediationPlan('mfa-redeploy-plan');
    const brokenPlan = {
      ...plan,
      steps: [
        { stepId: 'bad-step', type: 'unknown-type' }
      ]
    };

    let failedRunId;
    try {
      await executeRemediation(brokenPlan, {
        tenantId: TENANT,
        requirementId: 'identity-mfa-requirement',
        executedBy: 'contract-test@example.com'
      });
    } catch (err) {
      expect(err.message).toMatch(/Unknown step type/);
    }

    const runs = listRemediationRuns(TENANT);
    const failed = runs.find((r) => r.status === 'failed' && r.error?.includes('Unknown step type'));
    expect(failed).toBeDefined();
    failedRunId = failed.remediationRunId;
    createdRunIds.push(failedRunId);

    expect(failed.statusHistory.map((h) => h.status)).toEqual(['pending', 'running', 'failed']);
  });
});
