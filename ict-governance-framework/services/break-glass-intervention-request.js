/**
 * Persist Break Glass GA intervention requests into the feedback / escalation queue.
 */
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const ESCALATION_MATRIX = {
  Critical: { role: 'Domain Owner', assignee: 'domain-owner@company.com' }
};

function buildDescription(payload, actorLabel) {
  return [
    'BREAK GLASS — Global Administrator intervention request',
    '',
    `Submitted by: ${actorLabel}`,
    `Tenant / scope: ${payload.tenantScope || '—'}`,
    `Affected identity: ${payload.affectedIdentity}`,
    `Lockout type: ${payload.lockoutType}`,
    `Incident reference: ${payload.incidentReference || '—'}`,
    `Contact: ${payload.contactInfo || '—'}`,
    '',
    'Business justification:',
    payload.businessJustification,
    '',
    'Acknowledged: audit team review required prior/during procedure.',
    'Acknowledged: temporary MFA / access may supersede previous factors until closeout.',
    '',
    'Status: AWAITING AUDIT REVIEW — do not activate break glass until approved.'
  ].join('\n');
}

async function submitBreakGlassInterventionRequest(payload, actor) {
  const {
    tenantScope,
    affectedIdentity,
    lockoutType,
    incidentReference,
    businessJustification,
    contactInfo
  } = payload;

  if (!affectedIdentity?.trim() || !businessJustification?.trim()) {
    const err = new Error('affectedIdentity and businessJustification are required');
    err.statusCode = 400;
    throw err;
  }

  const actorLabel =
    actor?.display_name ||
    [actor?.first_name, actor?.last_name].filter(Boolean).join(' ') ||
    actor?.username ||
    actor?.user_id ||
    'unknown';

  const feedbackId = `FB-BG-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  const subject = `Break Glass GA intervention — ${affectedIdentity.trim()}`;
  const description = buildDescription(
    {
      tenantScope,
      affectedIdentity: affectedIdentity.trim(),
      lockoutType,
      incidentReference,
      businessJustification: businessJustification.trim(),
      contactInfo
    },
    actorLabel
  );

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const feedbackResult = await client.query(
      `
      INSERT INTO feedback_submissions (
        feedback_id, category, priority, subject, description,
        contact_info, anonymous, attachments, status, submitted_date,
        acknowledgment_sent, first_response_date, resolution_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
      `,
      [
        feedbackId,
        'Security',
        'Critical',
        subject,
        description,
        contactInfo || actor?.email || null,
        false,
        JSON.stringify([]),
        'Open',
        new Date(),
        false,
        null,
        null
      ]
    );

    await client.query(
      `
      INSERT INTO feedback_activity_log (
        feedback_id, activity_type, description, created_by, created_date
      ) VALUES ($1, $2, $3, $4, $5)
      `,
      [
        feedbackId,
        'Submitted',
        'Break Glass GA intervention request — audit review required before activation',
        actorLabel,
        new Date()
      ]
    );

    const escalationId = `ESC-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const target = ESCALATION_MATRIX.Critical;

    await client.query(
      `
      INSERT INTO escalations (
        escalation_id, feedback_id, escalation_level, escalated_to,
        escalated_to_role, escalation_reason, escalation_date,
        status, priority, category
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `,
      [
        escalationId,
        feedbackId,
        1,
        target.assignee,
        target.role,
        `Break Glass intervention for ${affectedIdentity.trim()} (${tenantScope || 'tenant scope not specified'}) — audit review required`,
        new Date(),
        'Open',
        'Critical',
        'Security'
      ]
    );

    await client.query(
      'UPDATE feedback_submissions SET escalation_level = 1, assigned_to = $2 WHERE feedback_id = $1',
      [feedbackId, target.assignee]
    );

    await client.query('COMMIT');

    return {
      feedbackId,
      escalationId,
      message: 'Break Glass intervention request queued for audit review'
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = {
  submitBreakGlassInterventionRequest
};
