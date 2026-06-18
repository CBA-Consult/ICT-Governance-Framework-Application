/**
 * SecOps SLA targets — audit-facing definitions (env-tunable)
 */
const SLA_TARGETS_MS = {
  CRITICAL: {
    detectToTicketMs: Number(process.env.SLA_CRITICAL_DETECT_TO_TICKET_MS) || 5 * 60 * 1000,
    ticketToAckMs: Number(process.env.SLA_CRITICAL_TICKET_TO_ACK_MS) || 5 * 60 * 1000,
    mttrMs: Number(process.env.SLA_CRITICAL_MTTR_MS) || 60 * 60 * 1000
  },
  HIGH: {
    detectToTicketMs: Number(process.env.SLA_HIGH_DETECT_TO_TICKET_MS) || 15 * 60 * 1000,
    ticketToAckMs: Number(process.env.SLA_HIGH_TICKET_TO_ACK_MS) || 15 * 60 * 1000,
    mttrMs: Number(process.env.SLA_HIGH_MTTR_MS) || 4 * 60 * 60 * 1000
  },
  MEDIUM: {
    detectToTicketMs: Number(process.env.SLA_MEDIUM_DETECT_TO_TICKET_MS) || 60 * 60 * 1000,
    ticketToAckMs: Number(process.env.SLA_MEDIUM_TICKET_TO_ACK_MS) || 60 * 60 * 1000,
    mttrMs: Number(process.env.SLA_MEDIUM_MTTR_MS) || 24 * 60 * 60 * 1000
  },
  LOW: {
    detectToTicketMs: Number(process.env.SLA_LOW_DETECT_TO_TICKET_MS) || 24 * 60 * 60 * 1000,
    ticketToAckMs: Number(process.env.SLA_LOW_TICKET_TO_ACK_MS) || 24 * 60 * 60 * 1000,
    mttrMs: Number(process.env.SLA_LOW_MTTR_MS) || 72 * 60 * 60 * 1000
  }
};

function enrichIncidentWithSla(incident) {
  const targets = SLA_TARGETS_MS[incident.severity] || SLA_TARGETS_MS.HIGH;
  const detectedAt = incident.detected_at ? new Date(incident.detected_at).getTime() : null;
  const acknowledgedAt = incident.acknowledged_at ? new Date(incident.acknowledged_at).getTime() : null;
  const resolvedAt = incident.resolved_at ? new Date(incident.resolved_at).getTime() : null;
  const now = Date.now();

  const timeToAcknowledgeMs = detectedAt && acknowledgedAt ? acknowledgedAt - detectedAt : null;
  const timeToResolveMs = detectedAt && resolvedAt ? resolvedAt - detectedAt : null;
  const timeSinceDetectMs = detectedAt ? (resolvedAt || now) - detectedAt : null;

  const ackBreached = timeToAcknowledgeMs != null
    ? timeToAcknowledgeMs > targets.ticketToAckMs
    : (!acknowledgedAt && detectedAt && (now - detectedAt) > targets.ticketToAckMs);

  const mttrBreached = timeToResolveMs != null
    ? timeToResolveMs > targets.mttrMs
    : (detectedAt && !resolvedAt && (now - detectedAt) > targets.mttrMs);

  return {
    ...incident,
    sla_targets: targets,
    time_to_acknowledge_ms: timeToAcknowledgeMs,
    time_to_resolve_ms: timeToResolveMs,
    sla_ack_breached: ackBreached,
    sla_mttr_breached: mttrBreached,
    sla_breached: incident.sla_breached || ackBreached || mttrBreached
  };
}

module.exports = {
  SLA_TARGETS_MS,
  enrichIncidentWithSla
};
