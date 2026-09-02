export function OikoraMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <circle
        cx="32"
        cy="32"
        r="22"
        stroke="currentColor"
        strokeWidth="5"
        strokeDasharray="119.2 19"
        strokeLinecap="round"
        transform="rotate(-65 32 32)"
      />
      <line
        x1="32"
        y1="13"
        x2="32"
        y2="38"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
      />
    </svg>
  );
}
