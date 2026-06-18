/**
 * Outbound alerting for Break Glass emergency activations (no silent overrides).
 */
const BREAK_GLASS_ALERT_WEBHOOK_URL = process.env.BREAK_GLASS_ALERT_WEBHOOK_URL;

async function dispatchBreakGlassAlert(payload) {
  const envelope = {
    event: 'break_glass_activated',
    severity: 'critical',
    timestamp: new Date().toISOString(),
    ...payload
  };

  console.error(
    `\n🚨 [BREAK GLASS PROTOCOL OPERATIONALIZED] Ticket: ${payload.ticketId}. ` +
    `Requestor: ${payload.requestorId}. Scope: ${payload.scopeTenant}. ` +
    `Expires: ${payload.expiresAt}. Context logged to immutable ledger.\n`
  );

  if (!BREAK_GLASS_ALERT_WEBHOOK_URL) {
    return { delivered: false, reason: 'BREAK_GLASS_ALERT_WEBHOOK_URL not configured' };
  }

  try {
    const response = await fetch(BREAK_GLASS_ALERT_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `🚨 Break Glass activated — ticket ${payload.ticketId} by ${payload.requestorId} (scope: ${payload.scopeTenant})`,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*Break Glass Emergency Protocol*\n*Ticket:* \`${payload.ticketId}\`\n*Requestor:* ${payload.requestorId}\n*Scope:* ${payload.scopeTenant}\n*Expires:* ${payload.expiresAt}`
            }
          }
        ],
        ...envelope
      })
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      console.error('[Break Glass Alert] Webhook delivery failed:', response.status, body);
      return { delivered: false, reason: `HTTP ${response.status}` };
    }

    return { delivered: true };
  } catch (err) {
    console.error('[Break Glass Alert] Webhook error:', err.message);
    return { delivered: false, reason: err.message };
  }
}

module.exports = { dispatchBreakGlassAlert };
