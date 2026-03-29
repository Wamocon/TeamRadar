'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Clock, ShieldCheck } from 'lucide-react';

interface LegalPageShellProps {
  title: string;
  updatedAt: string;
  children: React.ReactNode;
}

export function LegalPageShell({ title, updatedAt, children }: LegalPageShellProps) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b1120] pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/80 dark:bg-[#0b1120]/80 backdrop-blur-md border-black/[0.06] dark:border-white/[0.06]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="flex h-16 items-center justify-between">
            <Link 
              href="/" 
              className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
            >
              <ArrowLeft size={16} />
              <span>Back to Dashboard</span>
            </Link>
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              <ShieldCheck size={14} />
              <span>Legal & Compliance</span>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 pt-10 sm:px-6">
        {/* Cover */}
        <div className="mb-12">
          <h1 className="text-3xl font-black text-gray-900 dark:text-white sm:text-4xl">{title}</h1>
          <div className="mt-4 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 font-medium">
            <Clock size={14} />
            <span>Last updated: {updatedAt}</span>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {children}
        </div>

        {/* Footer */}
        <footer className="mt-20 border-t border-black/[0.1] dark:border-white/[0.1] pt-8 text-center text-xs text-gray-400 dark:text-gray-500">
          <p>© {new Date().getFullYear()} TeamRadar – Powered by WAMOCON GmbH</p>
          <p className="mt-2">Mergenthalerallee 79 – 81, 65760 Eschborn</p>
        </footer>
      </main>
    </div>
  );
}

export function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-black/[0.05] dark:border-white/[0.05] bg-white dark:bg-white/[0.02] p-6 shadow-sm sm:p-8">
      <h2 className="text-lg font-bold text-gray-900 dark:text-white sm:text-xl mb-4">{title}</h2>
      <div className="space-y-3 text-sm leading-relaxed text-gray-600 dark:text-gray-400">
        {children}
      </div>
    </section>
  );
}
