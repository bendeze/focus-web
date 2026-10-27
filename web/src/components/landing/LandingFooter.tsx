import React from 'react';
import { Mail } from 'lucide-react';

export const LandingFooter: React.FC = () => {
  return (
    <footer className="relative w-full bg-black/60 dark:bg-black/80 light:bg-[#f0efea] select-none pt-8 pb-12">
      {/* Top Dashed Divider Line */}
      <div className="dash-x h-px w-full mb-10" />

      {/* Terra Industries Architectural Vertical Hairline Guides */}
      <span className="dash-y pointer-events-none absolute inset-y-0 left-6 sm:left-10 lg:left-16 hidden md:block w-px" />
      <span className="dash-y pointer-events-none absolute inset-y-0 right-6 sm:right-10 lg:right-16 hidden md:block w-px" />

      <div className="max-w-6xl mx-auto px-6 sm:px-12 flex flex-col sm:flex-row items-center justify-between gap-8">
        
        {/* Falcon Brand & Classification */}
        <div className="flex items-center gap-3.5">
          <div className="grid size-9 place-items-center rounded-lg bg-white/10 dark:bg-white/10 light:bg-black text-white dark:text-white light:text-white shadow-xs">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
              <polygon points="12,5 21,19 3,19" />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="text-[14px] font-bold tracking-tight text-white dark:text-white light:text-black">
              FALCON
            </span>
            <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">
              SOFTWARE & IT ARCHITECTURE
            </span>
          </div>
        </div>

        {/* Contact and Socials (Terra Industries Icon Tile Badges) */}
        <div className="flex items-center gap-3">
          
          {/* Email Contact */}
          <a
            href="mailto:contact@falcon.dev"
            title="Email Falcon"
            aria-label="Email Falcon"
            className="grid size-[42px] place-items-center rounded-lg border border-white/10 dark:border-white/10 light:border-black/10 bg-white/5 dark:bg-white/5 light:bg-white/70 text-zinc-400 hover:text-white dark:hover:text-white light:hover:text-black hover:scale-105 active:scale-95 transition-all"
          >
            <Mail className="w-4 h-4" />
          </a>

          {/* X / Twitter */}
          <a
            href="https://x.com"
            target="_blank"
            rel="noopener noreferrer"
            title="X (Twitter)"
            aria-label="X (Twitter)"
            className="grid size-[42px] place-items-center rounded-lg border border-white/10 dark:border-white/10 light:border-black/10 bg-white/5 dark:bg-white/5 light:bg-white/70 text-zinc-400 hover:text-white dark:hover:text-white light:hover:text-black hover:scale-105 active:scale-95 transition-all"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </a>

          {/* LinkedIn */}
          <a
            href="https://linkedin.com"
            target="_blank"
            rel="noopener noreferrer"
            title="LinkedIn"
            aria-label="LinkedIn"
            className="grid size-[42px] place-items-center rounded-lg border border-white/10 dark:border-white/10 light:border-black/10 bg-white/5 dark:bg-white/5 light:bg-white/70 text-zinc-400 hover:text-white dark:hover:text-white light:hover:text-black hover:scale-105 active:scale-95 transition-all"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
              <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
            </svg>
          </a>
        </div>

      </div>

      {/* Bottom Hairline & Legal */}
      <div className="dash-x h-px w-full mt-10 mb-6" />
      <div className="max-w-6xl mx-auto px-6 sm:px-12 flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-zinc-500 gap-2">
        <span>All Rights Reserved © 2026 Falcon.</span>
        <span>FOCUS SYSTEM · BUILD 2026.10</span>
      </div>
    </footer>
  );
};
