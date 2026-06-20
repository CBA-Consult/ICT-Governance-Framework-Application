/** Contoso MFA demo — mirrors live escalation + evidence chain behavior */
export const WIZARD_DEMO = {
  tenantId: 'tenant-contoso-health',
  requirementId: 'identity-mfa-requirement',
  planId: 'mfa-redeploy-plan',
  escalationId: 'ces-evidence-divergent-demo',
  extraction: {
    requirements: 14,
    controls: 22,
    gaps: 9
  },
  insight: {
    title: 'MFA Enforcement',
    requirementId: 'identity-mfa-requirement',
    status: 'partial',
    aggregateEnrollment: '72%',
    detail: 'Missing enforcement on active-eligible users — aggregate metrics mask runtime bypass.'
  },
  evidenceSources: [
    { source: 'Graph API', result: 'PASS', detail: '100% active-eligible users' },
    { source: 'Azure Policy', result: 'PASS', detail: 'Context-adjusted compliant' },
    { source: 'Sentinel', result: 'FAIL', detail: 'Login bypass detected' }
  ],
  evidenceChain: {
    resolution: 'divergent',
    confidence: 'low'
  },
  remediationSteps: [
    { stepId: 'reapply-ca-policy', label: 'Restore — redeploy CA policy' },
    { stepId: 'invalidate-sessions', label: 'Contain — invalidate sessions' },
    { stepId: 'revalidate', label: 'Verify — re-check evidence chain' }
  ]
};

export const WIZARD_STEPS = [
  'upload',
  'extraction',
  'insight',
  'escalation',
  'remediation',
  'outcome'
];

export const WIZARD_STEP_LABELS = {
  upload: 'Upload',
  extraction: 'Extract',
  insight: 'Insight',
  escalation: 'Validate',
  remediation: 'Remediate',
  outcome: 'Verified'
};
