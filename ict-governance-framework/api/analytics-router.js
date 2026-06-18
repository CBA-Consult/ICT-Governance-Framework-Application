/**
 * Governance analytics API — Break Glass reconciliation trend streams.
 */
const express = require('express');
const { authenticateToken, requirePermissions } = require('../middleware/auth');
const { getBreakGlassAnalytics } = require('../services/break-glass-analytics');

const router = express.Router();

/**
 * GET /api/analytics/break-glass/trend
 * 30-day privileged action volume buckets + audit integrity KPI score.
 */
router.get(
  '/break-glass/trend',
  authenticateToken,
  requirePermissions(['governance.read']),
  async (req, res) => {
    const days = Math.min(Math.max(parseInt(req.query.days, 10) || 30, 7), 90);

    try {
      const analytics = await getBreakGlassAnalytics(days);

      res.status(200).json({
        success: true,
        trend: analytics.trend,
        currentKpiScore: analytics.currentKpiScore,
        emergencyTotal: analytics.emergencyTotal,
        standardJitTotal: analytics.standardJitTotal,
        metricCode: analytics.metricCode,
        snapshot: analytics.snapshot,
        windowDays: analytics.windowDays,
        attestation_timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('[Analytics Aggregation Exception]:', error.message);
      res.status(500).json({
        error: 'Systemic failure compiling timeline analytics.',
        code: 'BREAK_GLASS_ANALYTICS_ERROR',
        details: error.message
      });
    }
  }
);

module.exports = router;
