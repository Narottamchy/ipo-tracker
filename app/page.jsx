import Link from 'next/link';
import Logo from '../components/Logo.jsx';
import IpoListClient from '../components/IpoListClient.jsx';
import { friendlyError, loadMarket } from '../lib/market.js';

export const dynamic = 'force-dynamic';

async function getInitialData() {
  try {
    const data = await loadMarket();
    return { data, error: null };
  } catch (error) {
    return { data: null, error: friendlyError(error) };
  }
}

export default async function HomePage() {
  const { data, error } = await getInitialData();

  return (
    <>
      <header className="mx-auto flex h-[70px] max-w-6xl items-center justify-between px-4 sm:h-[90px] sm:px-10">
        <Link href="/" className="focus-ring rounded-md">
          <Logo />
        </Link>
        <span className="flex items-center gap-2 text-[11px] text-ink-300 sm:text-xs">
          <span className="relative h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400 shadow-[0_0_0_4px_rgba(92,199,151,0.18)]" />
          <span className="hidden sm:inline">Live market data</span>
        </span>
      </header>
      <main className="mx-auto max-w-6xl px-4 pb-16 pt-6 sm:px-10 sm:pb-20 sm:pt-10">
        <IpoListClient initialData={data} initialError={error} />
      </main>
      <footer className="mx-auto flex max-w-6xl flex-col gap-2 border-t border-ink-800 px-4 py-6 text-[10px] text-ink-400 sm:flex-row sm:justify-between sm:px-10">
        <span>
          IPO focus <span className="mx-2 text-ink-600">/</span> Built for clarity.
        </span>
        <span>GMP is indicative and does not guarantee listing gains.</span>
      </footer>
    </>
  );
}
