import Link from 'next/link';
import Logo from '../components/Logo.jsx';

export const metadata = {
  title: 'Page not found',
  description: 'This page does not exist, or the IPO has already listed.',
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <>
      <header className="mx-auto flex h-[70px] max-w-6xl items-center px-4 sm:h-[90px] sm:px-10">
        <Link href="/" className="focus-ring rounded-md">
          <Logo />
        </Link>
      </header>
      <main className="mx-auto max-w-2xl px-4 pb-24 pt-16 text-center sm:px-10">
        <p className="text-[10px] font-bold tracking-[0.2em] text-brand-400">404</p>
        <h1 className="mt-3 font-display text-3xl font-semibold text-ink-100 sm:text-4xl">This IPO page isn&apos;t available</h1>
        <p className="mt-3 text-sm text-ink-300">
          The IPO may have already listed, or the link is incorrect. Live and upcoming IPOs are on the home page.
        </p>
        <Link
          href="/"
          className="focus-ring mt-7 inline-flex min-h-[44px] items-center rounded-lg border border-brand-600 bg-brand-700 px-5 text-sm font-semibold text-white transition hover:bg-brand-600"
        >
          See all IPOs
        </Link>
      </main>
    </>
  );
}
