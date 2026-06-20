/**
 * Aegis Control primary mark — inline SVG for crisp header rendering.
 * Source: docs/design/assets/aegis-control-logo-primary.svg
 */
export default function AegisLogoPrimary({ size = 40, className = '' }) {
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
      <path
        d="M60 10 L100 25 V55 C100 80 80 100 60 110 C40 100 20 80 20 55 V25 L60 10 Z"
        stroke="#4338CA"
        strokeWidth="3"
        strokeLinejoin="round"
        fill="#EEF2FF"
      />
      <circle
        cx="60"
        cy="60"
        r="18"
        stroke="#3B82F6"
        strokeWidth="3"
        strokeDasharray="5 4"
        fill="none"
      />
      <circle cx="60" cy="60" r="5" fill="#22C55E" />
    </svg>
  );
}
