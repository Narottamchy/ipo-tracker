import { CheckCircle2, Clock, TrendingUp } from 'lucide-react';

const STYLES = {
  O: 'bg-brand-900/60 text-brand-300 border-brand-700/60',
  CT: 'bg-amber-400/10 text-amber-400 border-amber-400/30',
  U: 'bg-ink-700/60 text-ink-200 border-ink-600',
  C: 'bg-ink-800 text-ink-400 border-ink-600',
};

const ICONS = {
  O: TrendingUp,
  CT: Clock,
  U: Clock,
  C: CheckCircle2,
};

export default function StatusBadge({ statusCode, status }) {
  const Icon = ICONS[statusCode] || TrendingUp;
  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-md border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${STYLES[statusCode] || STYLES.U}`}
    >
      <Icon className="h-2.5 w-2.5 shrink-0" aria-hidden="true" />
      {status}
    </span>
  );
}
