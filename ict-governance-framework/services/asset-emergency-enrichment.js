/**
 * Correlate asset register rows with Break Glass privileged action audit logs.
 */
const { pool } = require('./jit-elevation');

async function fetchBreakGlassAssetCorrelations(assetIds = []) {
  if (!assetIds.length) {
    return new Map();
  }

  try {
    const { rows } = await pool.query(
      `
      SELECT DISTINCT ON (pal.target_resource_id)
        pal.target_resource_id AS asset_id,
        pal.jit_ticket_id,
        pal.timestamp AS last_emergency_action_at,
        pal.action AS last_emergency_action,
        jel.status AS ticket_status,
        jel.valid_from,
        jel.valid_until,
        jel.scope_tenant
      FROM privileged_action_logs pal
      INNER JOIN jit_elevation_ledger jel ON jel.ticket_id = pal.jit_ticket_id
      WHERE pal.is_break_glass = true
        AND pal.target_resource_id = ANY($1::varchar[])
      ORDER BY pal.target_resource_id, pal.timestamp DESC
      `,
      [assetIds]
    );

    const map = new Map();
    for (const row of rows) {
      map.set(row.asset_id, {
        is_emergency: true,
        emergency_ticket_id: row.jit_ticket_id,
        emergency_ticket_active: row.ticket_status === 'Break_Glass_Active',
        emergency_ticket_status: row.ticket_status,
        last_emergency_action_at: row.last_emergency_action_at,
        last_emergency_action: row.last_emergency_action,
        emergency_valid_from: row.valid_from,
        emergency_valid_until: row.valid_until,
        emergency_scope_tenant: row.scope_tenant
      });
    }
    return map;
  } catch (err) {
    if (err.code === '42P01') {
      return new Map();
    }
    throw err;
  }
}

function enrichAssetsWithEmergencyContext(assets, correlationMap) {
  return assets.map((asset) => {
    const correlation = correlationMap.get(asset.asset_id);
    if (!correlation) {
      return {
        ...asset,
        is_emergency: false,
        emergency_ticket_id: null,
        emergency_ticket_active: false
      };
    }

    return {
      ...asset,
      ...correlation
    };
  });
}

async function enrichAssetList(assets) {
  const assetIds = assets.map((a) => a.asset_id).filter(Boolean);
  const correlationMap = await fetchBreakGlassAssetCorrelations(assetIds);
  return enrichAssetsWithEmergencyContext(assets, correlationMap);
}

module.exports = {
  fetchBreakGlassAssetCorrelations,
  enrichAssetsWithEmergencyContext,
  enrichAssetList
};
