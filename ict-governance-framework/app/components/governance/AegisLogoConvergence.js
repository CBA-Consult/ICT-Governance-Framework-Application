/**
 * Convergence mark — divergence converging to verified state.
 */
export default function AegisLogoConvergence({ size = 48, className = '' }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 120 120"
      width={size}
      height={size}
      fill="none"
      className={`shrink-0 ${className}`.trim()}
      aria-hidden="true"
      focusable="false"
    >
      <line x1="20" y1="60" x2="52" y2="60" stroke="#EF4444" strokeWidth="3" strokeLinecap="round" />
      <line x1="100" y1="60" x2="68" y2="60" stroke="#EF4444" strokeWidth="3" strokeLinecap="round" />
      <circle cx="60" cy="60" r="10" fill="#22C55E" />
    </svg>
  );
}
