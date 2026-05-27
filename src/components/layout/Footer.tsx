import { LegalLinks } from '../legal/LegalLinks';
import { DevelopedInGermanyBadge } from '../legal/DevelopedInGermanyBadge';

export function Footer() {
  return (
    <footer className="mt-auto py-12 px-6 border-t border-black/4 dark:border-white/3 bg-white dark:bg-[#0b1120]">
      <div className="max-w-4xl mx-auto flex flex-col items-center gap-8">
        <div className="flex flex-col items-center gap-2 text-center">
          <span className="text-sm font-black tracking-tight text-gray-900 dark:text-white uppercase">
            TeamRadar – VERFÜGBARKEIT IM BLICK
          </span>
          <span className="text-[10px] uppercase tracking-[0.2em] text-gray-500 dark:text-white/30 font-black">
            Professionelles Verfügbarkeitsmanagement &copy; {new Date().getFullYear()} WAMOCON GmbH
          </span>
        </div>

        <LegalLinks />

        <div className="scale-90 origin-center -mt-4">
          <DevelopedInGermanyBadge />
        </div>
      </div>
    </footer>
  );
}
