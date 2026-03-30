"use client";

import Link from "next/link";
import { FileText, ReceiptText, Shield } from "lucide-react";

const items = [
  { href: "/impressum", label: "Impressum", icon: FileText },
  { href: "/datenschutz", label: "Datenschutz", icon: Shield },
  { href: "/agb", label: "AGB", icon: ReceiptText },
] as const;

export function LegalLinks() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="text-xs font-bold text-gray-500 dark:text-white/30 hover:text-blue-600 dark:hover:text-blue-500 transition-colors uppercase tracking-widest flex items-center gap-2"
        >
          <item.icon size={12} />
          {item.label}
        </Link>
      ))}
    </div>
  );
}
