export function LogoMark({ className = 'h-8 w-8' }) {
  return (
    <svg viewBox="0 0 34 34" className={className} fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true">
      <rect width="34" height="34" rx="10" fill="#175f46" />
      <path
        d="M8 21.5L14.2 15.2L18.4 19.4L26 11.5"
        stroke="#9be3bf"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M20.5 11.5H26V17" stroke="#d3f5e3" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Logo({ className = '' }) {
  return (
    <span className={`flex items-center gap-2.5 font-display text-xl font-extrabold tracking-tight text-ink-100 sm:text-2xl ${className}`}>
      <LogoMark />
      IPO<span className="font-medium text-ink-300">focus</span>
    </span>
  );
}
