/**
 * Client hook for DR drill state transitions → executive measurement plan KPI patch.
 */
export async function handleDrillStateTransition(assetId, newState, token) {
  if (newState !== 'DR_Hydrated') {
    return { patched: false };
  }

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };

  const response = await fetch('/api/governance/measurement-plan/patch', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      metricCode: 'KPI-GOV-AUTOMATION-TARGET',
      incrementValue: 1.2,
      newState,
      assetId,
      context: `Asset state change automated sync for asset reference: ${assetId}`
    })
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || 'Failed to patch measurement plan metric');
  }

  return response.json();
}

export function mapApiAssetToRegisterRow(row) {
  const tags = typeof row.tags === 'string' ? JSON.parse(row.tags) : (row.tags || {});
  const envTag = (tags.environment || '').toLowerCase();

  return {
    id: row.asset_id,
    name: row.name,
    type: row.resource_type,
    provider: row.provider,
    environment: envTag === 'disaster-recovery' ? 'Disaster-Recovery' : (envTag === 'shadow-it' ? 'Shadow IT' : 'Production'),
    drStatus: row.dr_status || 'Stable',
    assetOrigin: row.asset_origin || 'Managed',
    validationPosture: row.validation_posture || 'Verified',
    lastDrill: row.last_dr_drill_timestamp
      ? new Date(row.last_dr_drill_timestamp).toLocaleString()
      : '—',
    auditRef: row.dr_audit_ledger_reference || row.casb_source_id || '—',
    complianceState: row.compliance_state,
    tenantName: row.tenant_name || row.tenant_id,
    rtoSeconds: row.rto_seconds,
    rpoFlagTriggered: row.rpo_flag_triggered,
    casbRiskScore: row.casb_risk_score,
    casbDiscoveredAt: row.casb_discovered_at
      ? new Date(row.casb_discovered_at).toLocaleString()
      : null
  };
}

/**
 * Request time-bounded GlobalAdministrator JIT context (when enforcement is enabled).
 */
export async function requestJitElevation({ justification, scopeTenant = 'tenant-01', token }) {
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };

  const response = await fetch('/api/auth/jit/elevate', {
    method: 'POST',
    headers,
    body: JSON.stringify({ justification, scopeTenant })
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || 'Failed to obtain JIT elevation context');
  }

  const data = await response.json();
  return data.jitContextToken;
}

/**
 * Out-of-band Break Glass activation when cloud identity verification is degraded.
 * Does not require a standing access token — only the configured emergency secret.
 */
export async function activateBreakGlassEmergency({
  breakGlassKey,
  justification,
  requestorId,
  scopeTenant = 'tenant-01'
}) {
  const response = await fetch('/api/auth/jit/emergency/activate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ breakGlassKey, justification, requestorId, scopeTenant })
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || 'Break Glass emergency activation failed');
  }

  return response.json();
}

/**
 * Compliance-owner manual cryptographic reconciliation for a break-glass JIT ticket.
 */
export async function runManualLedgerReconciliation(ticketId, token, options = {}) {
  let jitContextToken = options.jitContextToken;

  const executeReconcile = () => fetch('/api/auth/jit/emergency/reconcile', {
    method: 'POST',
    headers: buildAuthHeaders(token, jitContextToken),
    body: JSON.stringify({ ticketId })
  });

  let response = await executeReconcile();

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    if (body.code === 'JIT_CONTEXT_MISSING' && !jitContextToken) {
      jitContextToken = await requestJitElevation({
        justification: options.justification
          || `Manual cryptographic audit sweep for emergency ticket ${ticketId}`,
        scopeTenant: options.scopeTenant || 'tenant-01',
        token
      });
      response = await executeReconcile();
    }

    if (!response.ok) {
      const retryBody = await response.json().catch(() => body);
      throw new Error(retryBody.error || 'Manual ledger reconciliation failed');
    }
  }

  return response.json();
}

function buildAuthHeaders(token, jitContextToken) {
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(jitContextToken ? { 'X-JIT-Context': `Bearer ${jitContextToken}` } : {})
  };
}

/**
 * Promote shadow IT asset to Verified/Managed after onboarding confirmation.
 */
export async function promoteAssetValidation(assetId, token, options = {}) {
  let jitContextToken = options.jitContextToken;

  const executePromote = () => fetch('/api/assets/validation/promote', {
    method: 'POST',
    headers: buildAuthHeaders(token, jitContextToken),
    body: JSON.stringify({
      assetId,
      validationPosture: 'Verified',
      onboardingTemplate: 'blueprint-templates/saas-onboarding.bicep',
      complianceState: 'Compliant'
    })
  });

  let response = await executePromote();

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    if (body.code === 'JIT_CONTEXT_MISSING' && !jitContextToken) {
      jitContextToken = await requestJitElevation({
        justification: options.justification
          || `CASB shadow IT infrastructure promotion to Managed track for ${assetId}`,
        scopeTenant: options.scopeTenant || 'tenant-01',
        token
      });
      response = await executePromote();
    }
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || 'Failed to promote asset validation posture');
  }

  return response.json();
}

/**
 * Approve or reject a pending FAIR calibration adjustment (compliance.manage + JIT when enforced).
 */
export async function submitCalibrationGovernanceAction({
  approvalId,
  action,
  notes,
  token,
  jitContextToken: initialJitToken,
  justification,
  scopeTenant = 'tenant-01'
}) {
  const endpoint =
    action === 'reject'
      ? '/api/governance/risk/calibration/reject'
      : '/api/governance/risk/calibration/approve';

  let jitContextToken = initialJitToken;

  const execute = () =>
    fetch(endpoint, {
      method: 'POST',
      headers: buildAuthHeaders(token, jitContextToken),
      body: JSON.stringify({
        approval_id: approvalId,
        ...(notes ? { notes } : {})
      })
    });

  let response = await execute();

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    if (body.code === 'JIT_CONTEXT_MISSING' && !jitContextToken) {
      jitContextToken = await requestJitElevation({
        justification:
          justification ||
          `FAIR calibration ${action} for pending adjustment #${approvalId}`,
        scopeTenant,
        token
      });
      response = await execute();
    }

    if (!response.ok) {
      const retryBody = await response.json().catch(() => body);
      throw new Error(retryBody.error || `Calibration ${action} failed`);
    }
  }

  return response.json();
}
