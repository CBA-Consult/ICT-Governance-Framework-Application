/**
 * Multi-source mark — independent evidence rings converging to verified truth.
 */
export default function AegisLogoMultisource({ size = 48, className = '' }) {
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
      <circle cx="60" cy="60" r="28" stroke="#3B82F6" strokeWidth="2" fill="none" />
      <circle cx="60" cy="60" r="20" stroke="#F59E0B" strokeWidth="2" fill="none" />
      <circle cx="60" cy="60" r="12" stroke="#EF4444" strokeWidth="2" fill="none" />
      <circle cx="60" cy="60" r="5" fill="#22C55E" />
    </svg>
  );
}
