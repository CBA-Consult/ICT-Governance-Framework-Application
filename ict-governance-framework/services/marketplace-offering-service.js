'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const vendorRegistry = require('./vendor-registry-service');

const DATA_PATH = path.join(__dirname, '..', 'data', 'marketplace-offerings.json');

function nowIso() {
  return new Date().toISOString();
}

function loadStore() {
  if (!fs.existsSync(DATA_PATH)) {
    return { version: '1.0.0', updatedAt: nowIso(), offerings: [] };
  }
  return JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
}

function saveStore(store) {
  const payload = {
    version: store.version || '1.0.0',
    updatedAt: nowIso(),
    offerings: store.offerings || []
  };
  fs.mkdirSync(path.dirname(DATA_PATH), { recursive: true });
  fs.writeFileSync(DATA_PATH, JSON.stringify(payload, null, 2), 'utf8');
  return payload;
}

function normalizeOfferingId(name) {
  const base = String(name || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return base ? `off-${base}` : `off-${crypto.randomBytes(4).toString('hex')}`;
}

function listOfferings(filter = {}) {
  const store = loadStore();
  let offerings = store.offerings || [];
  if (filter.status) offerings = offerings.filter((o) => o.status === filter.status);
  if (filter.vendorId) offerings = offerings.filter((o) => o.vendorId === filter.vendorId);
  if (filter.category) offerings = offerings.filter((o) => o.category === filter.category);
  return offerings;
}

function getOffering(offeringId) {
  const store = loadStore();
  return (store.offerings || []).find((o) => o.offeringId === offeringId) || null;
}

function assertVendorActiveForPublish(vendorId) {
  const vendor = vendorRegistry.getVendor(vendorId);
  if (!vendor) {
    const err = new Error('Unknown vendorId');
    err.statusCode = 400;
    throw err;
  }
  if (vendor.status !== 'active') {
    const err = new Error('Vendor is not approved for marketplace use');
    err.statusCode = 409;
    throw err;
  }
  return vendor;
}

function createOffering(input = {}, meta = {}) {
  if (!input.name) {
    const err = new Error('name is required');
    err.statusCode = 400;
    throw err;
  }
  if (!input.vendorId) {
    const err = new Error('vendorId is required');
    err.statusCode = 400;
    throw err;
  }

  // Core rule: offerings are only created for approved (active) vendors.
  // This prevents ungoverned supply-side drift in the marketplace.
  assertVendorActiveForPublish(input.vendorId);

  const store = loadStore();
  const offeringId = input.offeringId || normalizeOfferingId(`${input.vendorId}-${input.name}`);
  if ((store.offerings || []).some((o) => o.offeringId === offeringId)) {
    const err = new Error('offeringId already exists');
    err.statusCode = 409;
    throw err;
  }

  const status = input.status || 'draft';

  const record = {
    offeringId,
    name: input.name,
    vendorId: input.vendorId,
    category: input.category || 'uncategorized',
    status,
    governanceMapping: input.governanceMapping || { supportedControls: [], limitations: [] },
    createdAt: nowIso(),
    createdBy: meta.actor || 'system'
  };

  store.offerings = [...(store.offerings || []), record];
  saveStore(store);
  return getOffering(offeringId);
}

function updateOffering(offeringId, patch = {}, meta = {}) {
  const store = loadStore();
  const idx = (store.offerings || []).findIndex((o) => o.offeringId === offeringId);
  if (idx < 0) {
    const err = new Error('Offering not found');
    err.statusCode = 404;
    throw err;
  }

  const current = store.offerings[idx];
  const vendorId = patch.vendorId ?? current.vendorId;
  if (patch.vendorId) {
    const vendor = vendorRegistry.getVendor(vendorId);
    if (!vendor) {
      const err = new Error('Unknown vendorId');
      err.statusCode = 400;
      throw err;
    }
  }

  const status = patch.status ?? current.status;
  if (status === 'published') {
    assertVendorActiveForPublish(vendorId);
  }

  const updated = {
    ...current,
    name: patch.name ?? current.name,
    vendorId,
    category: patch.category ?? current.category,
    status,
    governanceMapping: patch.governanceMapping ?? current.governanceMapping,
    updatedAt: nowIso(),
    updatedBy: meta.actor || 'system'
  };

  store.offerings[idx] = updated;
  saveStore(store);
  return getOffering(offeringId);
}

function publishOffering(offeringId, meta = {}) {
  return updateOffering(offeringId, { status: 'published' }, meta);
}

module.exports = {
  loadStore,
  saveStore,
  listOfferings,
  getOffering,
  createOffering,
  updateOffering,
  publishOffering
};

