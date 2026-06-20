/**
 * Verification checkpoint helpers for contract / regression tests.
 */
const crypto = require('crypto');

function getVerificationRunId() {
  return process.env.VERIFICATION_RUN_ID || null;
}

function getVerificationCorrelationId() {
  return process.env.VERIFICATION_RUN_ID || crypto.randomUUID();
}

function verificationIngestOptions(correlationId = getVerificationCorrelationId()) {
  return {
    correlationId,
    headers: getVerificationRunId()
      ? { 'x-verification-run-id': getVerificationRunId() }
      : {}
  };
}

module.exports = {
  getVerificationRunId,
  getVerificationCorrelationId,
  verificationIngestOptions
};
