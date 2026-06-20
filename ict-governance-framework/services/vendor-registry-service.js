'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '..', 'data', 'vendor-registry.json');

function nowIso() {
  return new Date().toISOString();
}

function loadRegistry() {
  if (!fs.existsSync(DATA_PATH)) {
    return { version: '1.0.0', updatedAt: nowIso(), vendors: [] };
  }
  return JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
}

function saveRegistry(registry) {
  const payload = {
    version: registry.version || '1.0.0',
    updatedAt: nowIso(),
    vendors: registry.vendors || []
  };
  fs.mkdirSync(path.dirname(DATA_PATH), { recursive: true });
  fs.writeFileSync(DATA_PATH, JSON.stringify(payload, null, 2), 'utf8');
  return payload;
}

function vendorOnboardingTemplate() {
  return [
    { stepId: 'company-profile', label: 'Company profile verified', required: true },
    { stepId: 'security-attestation', label: 'Security & compliance attestation received', required: true },
    { stepId: 'data-processing', label: 'DPA / data processing terms reviewed', required: true },
    { stepId: 'support-sla', label: 'Support & SLA terms agreed', required: true },
    { stepId: 'catalog-approved', label: 'Marketplace catalog approved', required: true }
  ];
}

function normalizeVendorId(displayName) {
  const base = String(displayName || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return base ? `vendor-${base}` : `vendor-${crypto.randomBytes(4).toString('hex')}`;
}

function computeOnboardingProgress(onboarding) {
  const checklist = onboarding?.checklist || [];
  const completed = new Set(onboarding?.completedStepIds || []);
  const required = checklist.filter((s) => s.required !== false);
  const requiredDone = required.filter((s) => completed.has(s.stepId)).length;
  const percent = required.length ? Math.round((requiredDone / required.length) * 100) : 0;
  const complete = required.length ? requiredDone === required.length : false;
  return { percent, complete, requiredTotal: required.length, requiredDone };
}

function listVendors(filter = {}) {
  const registry = loadRegistry();
  let vendors = registry.vendors || [];
  if (filter.status) {
    vendors = vendors.filter((v) => v.status === filter.status);
  }
  return vendors.map((v) => ({
    ...v,
    onboardingProgress: computeOnboardingProgress(v.onboarding)
  }));
}

function getVendor(vendorId) {
  const registry = loadRegistry();
  const v = (registry.vendors || []).find((x) => x.vendorId === vendorId);
  if (!v) return null;
  return { ...v, onboardingProgress: computeOnboardingProgress(v.onboarding) };
}

function createVendor(input = {}, meta = {}) {
  if (!input.displayName) {
    const err = new Error('displayName is required');
    err.statusCode = 400;
    throw err;
  }

  const registry = loadRegistry();
  const vendorId = input.vendorId || normalizeVendorId(input.displayName);
  if ((registry.vendors || []).some((v) => v.vendorId === vendorId)) {
    const err = new Error('vendorId already exists');
    err.statusCode = 409;
    throw err;
  }

  const record = {
    vendorId,
    displayName: input.displayName,
    legalName: input.legalName || input.displayName,
    website: input.website || null,
    contact: {
      email: input.contact?.email || null
    },
    status: 'onboarding',
    onboarding: {
      checklist: vendorOnboardingTemplate(),
      completedStepIds: [],
      completedAt: null,
      completedBy: null
    },
    createdAt: nowIso(),
    createdBy: meta.actor || 'system'
  };

  registry.vendors = [...(registry.vendors || []), record];
  saveRegistry(registry);
  return getVendor(vendorId);
}

function updateVendor(vendorId, patch = {}, meta = {}) {
  const registry = loadRegistry();
  const idx = (registry.vendors || []).findIndex((v) => v.vendorId === vendorId);
  if (idx < 0) {
    const err = new Error('Vendor not found');
    err.statusCode = 404;
    throw err;
  }

  const current = registry.vendors[idx];
  const updated = {
    ...current,
    displayName: patch.displayName ?? current.displayName,
    legalName: patch.legalName ?? current.legalName,
    website: patch.website ?? current.website,
    contact: {
      ...current.contact,
      ...(patch.contact || {})
    },
    status: patch.status ?? current.status,
    updatedAt: nowIso(),
    updatedBy: meta.actor || 'system'
  };

  registry.vendors[idx] = updated;
  saveRegistry(registry);
  return getVendor(vendorId);
}

function completeVendorOnboardingStep(vendorId, stepId, meta = {}) {
  const registry = loadRegistry();
  const idx = (registry.vendors || []).findIndex((v) => v.vendorId === vendorId);
  if (idx < 0) {
    const err = new Error('Vendor not found');
    err.statusCode = 404;
    throw err;
  }

  const vendor = registry.vendors[idx];
  const checklist = vendor.onboarding?.checklist || vendorOnboardingTemplate();
  if (!checklist.some((s) => s.stepId === stepId)) {
    const err = new Error('Unknown onboarding stepId');
    err.statusCode = 400;
    throw err;
  }

  const completed = new Set(vendor.onboarding?.completedStepIds || []);
  completed.add(stepId);

  vendor.onboarding = {
    checklist,
    completedStepIds: Array.from(completed),
    completedAt: vendor.onboarding?.completedAt || null,
    completedBy: vendor.onboarding?.completedBy || null
  };

  const progress = computeOnboardingProgress(vendor.onboarding);
  if (progress.complete) {
    vendor.status = 'active';
    vendor.onboarding.completedAt = nowIso();
    vendor.onboarding.completedBy = meta.actor || 'system';
  }

  vendor.updatedAt = nowIso();
  vendor.updatedBy = meta.actor || 'system';

  registry.vendors[idx] = vendor;
  saveRegistry(registry);
  return getVendor(vendorId);
}

module.exports = {
  loadRegistry,
  saveRegistry,
  listVendors,
  getVendor,
  createVendor,
  updateVendor,
  completeVendorOnboardingStep,
  vendorOnboardingTemplate
};

