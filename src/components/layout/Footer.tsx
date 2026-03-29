import Link from 'next/link';

export function Footer() {
  return (
    <footer className="shrink-0 text-center py-4 text-[10px] text-gray-400 dark:text-white/20 border-t border-black/[0.04] dark:border-white/[0.03] space-x-4">
      <span>TeamRadar &copy; {new Date().getFullYear()}</span>
      <Link href="/impressum" className="hover:text-gray-600 dark:hover:text-white transition-colors">Impressum</Link>
      <Link href="/datenschutz" className="hover:text-gray-600 dark:hover:text-white transition-colors">Datenschutz</Link>
      <Link href="/agb" className="hover:text-gray-600 dark:hover:text-white transition-colors">AGB</Link>
    </footer>
  );
}
