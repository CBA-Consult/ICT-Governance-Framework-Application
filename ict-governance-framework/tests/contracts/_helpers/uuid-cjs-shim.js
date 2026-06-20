/** CJS shim for Jest — uuid v14+ is ESM-only */
function v4() {
  return `00000000-0000-4000-8000-${Math.random().toString(16).slice(2, 14).padEnd(12, '0')}`;
}

module.exports = { v4, default: v4 };
