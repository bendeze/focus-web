import React, { useState, useEffect } from 'react';
import { Smartphone, Monitor, Download, ArrowRight, Check, Loader2 } from 'lucide-react';

interface LandingEcosystemProps {
  onEnterApp: () => void;
}

const DEFAULT_FALLBACK_APK = 'https://github.com/bendeze/focus-app/releases/download/main/focus-app-v1.0.0.apk';
const RELEASES_API_URL = 'https://api.github.com/repos/bendeze/focus-app/releases/latest';

export const LandingEcosystem: React.FC<LandingEcosystemProps> = ({ onEnterApp }) => {
  const [downloadUrl, setDownloadUrl] = useState<string>(DEFAULT_FALLBACK_APK);
  const [versionTag, setVersionTag] = useState<string>('v1.0.0');
  const [fileSize, setFileSize] = useState<string>('');
  const [isDownloading, setIsDownloading] = useState<boolean>(false);

  // Automatically fetch the latest released APK asset on component mount
  useEffect(() => {
    let isMounted = true;

    const fetchLatestRelease = async () => {
      try {
        // Read from local cache if previously resolved
        const cached = localStorage.getItem('focus_latest_apk_cache');
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            if (parsed.downloadUrl && isMounted) {
              setDownloadUrl(parsed.downloadUrl);
              if (parsed.versionTag) setVersionTag(parsed.versionTag);
              if (parsed.fileSize) setFileSize(parsed.fileSize);
            }
          } catch {
            // ignore cache parse error
          }
        }

        const res = await fetch(RELEASES_API_URL, {
          headers: { Accept: 'application/vnd.github.v3+json' },
        });

        if (!res.ok) return;
        const data = await res.json();

        // Find the APK file among the published release assets
        interface ReleaseAsset {
          name?: string;
          browser_download_url?: string;
          size?: number;
        }

        const apkAsset = Array.isArray(data.assets)
          ? data.assets.find((asset: ReleaseAsset) =>
              asset.name?.toLowerCase().endsWith('.apk')
            )
          : null;

        if (apkAsset?.browser_download_url && isMounted) {
          const directUrl = apkAsset.browser_download_url;
          const tag = data.tag_name || 'Latest';
          const sizeMb = apkAsset.size
            ? `${(apkAsset.size / (1024 * 1024)).toFixed(1)} MB`
            : '';

          setDownloadUrl(directUrl);
          setVersionTag(tag);
          setFileSize(sizeMb);

          localStorage.setItem(
            'focus_latest_apk_cache',
            JSON.stringify({
              downloadUrl: directUrl,
              versionTag: tag,
              fileSize: sizeMb,
              timestamp: Date.now(),
            })
          );
        }
      } catch {
        // Keep default fallback URL on network or rate limit failure
      }
    };

    fetchLatestRelease();

    return () => {
      isMounted = false;
    };
  }, []);

  // Programmatically trigger direct APK download without sending users to GitHub
  const handleDownloadApk = async () => {
    setIsDownloading(true);

    let targetUrl = downloadUrl;

    // If downloadUrl was not resolved yet, fetch immediately
    if (!targetUrl || targetUrl === DEFAULT_FALLBACK_APK) {
      try {
        const res = await fetch(RELEASES_API_URL);
        if (res.ok) {
          const data = await res.json();
          const apkAsset = data.assets?.find((a: { name?: string; browser_download_url?: string }) =>
            a.name?.toLowerCase().endsWith('.apk')
          );
          if (apkAsset?.browser_download_url) {
            targetUrl = apkAsset.browser_download_url;
            setDownloadUrl(targetUrl);
          }
        }
      } catch {
        targetUrl = DEFAULT_FALLBACK_APK;
      }
    }

    // Trigger direct binary download
    const link = document.createElement('a');
    link.href = targetUrl;
    link.setAttribute('download', 'focus-app.apk');
    link.setAttribute('rel', 'noopener noreferrer');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      setIsDownloading(false);
    }, 2200);
  };

  return (
    <section
      id="solution"
      className="relative w-full py-20 px-6 sm:px-12 max-w-6xl mx-auto select-none"
    >
      {/* Top Dashed Divider */}
      <div className="dash-x h-px w-full mb-12" />

      {/* Terra Industries Architectural Vertical Hairline Guides */}
      <span className="dash-y pointer-events-none absolute inset-y-0 left-6 sm:left-10 lg:left-16 hidden md:block w-px" />
      <span className="dash-y pointer-events-none absolute inset-y-0 right-6 sm:right-10 lg:right-16 hidden md:block w-px" />

      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-16">
        <p className="text-[14px] sm:text-[14px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-500 light:text-[#7d7d7d] mb-3">
          MULTI-SURFACE ECOSYSTEM
        </p>
        <h2 className="text-[clamp(32px,4.5vw,52px)] font-semibold leading-[1.12] tracking-[-0.04em] text-white dark:text-white light:text-black">
          From your desk <span className="font-normal text-zinc-400 dark:text-zinc-400 light:text-[#7d7d7d]">to your pocket</span>.
        </h2>
        <p className="mt-4 text-[16px] sm:text-[14px] font-normal leading-relaxed tracking-[-0.03em] text-zinc-400 dark:text-zinc-400 light:text-[#7d7d7d]">
          Uninterrupted flow whether you are working in your workstation browser or on your mobile device.
        </p>
      </div>

      {/* Two Terra Industries Architectural Cards: Web & Android */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
        
        {/* Card 1: Focus Web Cockpit */}
        <div className="relative p-8 sm:p-10 rounded-none bg-black/80 dark:bg-black/50 light:bg-white/50 border border-white/10 dark:border-white/10 light:border-black/10 shadow-2xl flex flex-col justify-between">
          {/* Corner Brackets */}
          <span className="absolute size-6 border-white/30 dark:border-white/30 light:border-black/20 -left-2 -top-2 border-l-2 border-t-2 pointer-events-none" />
          <span className="absolute size-6 border-white/30 dark:border-white/30 light:border-black/20 -right-2 -top-2 border-r-2 border-t-2 pointer-events-none" />

          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="size-12 rounded-xl bg-white/5 dark:bg-white/5 light:bg-black/5 border border-white/10 dark:border-white/10 light:border-black/10 flex items-center justify-center text-white dark:text-white light:text-black">
                <Monitor className="w-5 h-5" />
              </div>
            </div>

            <h3 className="text-2xl sm:text-3xl font-semibold tracking-[-0.03em] text-white dark:text-white light:text-black mb-3">
              Focus Web Cockpit
            </h3>

            <p className="text-[15px] text-zinc-400 dark:text-zinc-400 light:text-[#7d7d7d] font-normal leading-relaxed mb-6">
              Full-screen Pomodoro cockpit, 7-day flow analytics, backlog orchestration, and harmonic acoustic chimes directly in your modern browser.
            </p>

            {/* Terra Industries Technical Specifications Grid */}
            <dl className="grid grid-cols-2 border-l border-t border-white/10 dark:border-white/10 light:border-black/10 mb-8 rounded-lg overflow-hidden">
              <div className="p-3.5 border-r border-b border-white/10 dark:border-white/10 light:border-black/10">
                <dt className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">Deployment</dt>
                <dd className="text-[13px] font-semibold text-white dark:text-white light:text-black mt-0.5">Static Single Page</dd>
              </div>
              <div className="p-3.5 border-r border-b border-white/10 dark:border-white/10 light:border-black/10">
                <dt className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">Storage Engine</dt>
                <dd className="text-[13px] font-semibold text-white dark:text-white light:text-black mt-0.5">IndexedDB + Local</dd>
              </div>
              <div className="p-3.5 border-r border-b border-white/10 dark:border-white/10 light:border-black/10 col-span-2">
                <dt className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">Audio Synthesis</dt>
                <dd className="text-[13px] font-semibold text-white dark:text-white light:text-black mt-0.5">HTML5 Web Audio Polyphony</dd>
              </div>
            </dl>
          </div>

          <button
            onClick={onEnterApp}
            className="group w-full inline-flex h-13 items-center justify-between px-7 rounded-full bg-white dark:bg-white light:bg-black text-black dark:text-black light:text-white font-bold text-sm tracking-wide transition-all hover:scale-[1.02] active:scale-[0.98] shadow-md cursor-pointer"
          >
            <span>Launch Web App</span>
            <span className="grid size-7 place-items-center rounded-full bg-black dark:bg-black light:bg-white text-white dark:text-white light:text-black transition-transform group-hover:translate-x-1">
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </button>
        </div>

        {/* Card 2: Focus Android Companion */}
        <div className="relative p-8 sm:p-10 rounded-none bg-black/80 dark:bg-black/50 light:bg-white/50 border border-white/10 dark:border-white/10 light:border-black/10 shadow-2xl flex flex-col justify-between">
          {/* Corner Brackets */}
          <span className="absolute size-6 border-white/30 dark:border-white/30 light:border-black/20 -left-2 -top-2 border-l-2 border-t-2 pointer-events-none" />
          <span className="absolute size-6 border-white/30 dark:border-white/30 light:border-black/20 -right-2 -top-2 border-r-2 border-t-2 pointer-events-none" />

          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="size-12 rounded-xl bg-white/5 dark:bg-white/5 light:bg-black/5 border border-white/10 dark:border-white/10 light:border-black/10 flex items-center justify-center text-white dark:text-white light:text-black">
                <Smartphone className="w-5 h-5" />
              </div>
            </div>

            <h3 className="text-2xl sm:text-3xl font-semibold tracking-[-0.03em] text-white dark:text-white light:text-black mb-3">
              Focus Android
            </h3>

            <p className="text-[15px] text-zinc-400 dark:text-zinc-400 light:text-[#7d7d7d] font-normal leading-relaxed mb-6">
              Dedicated native companion with precision tactile haptic feedback, background alarm triggers, and local-first autonomy.
            </p>

            {/* Terra Industries Technical Specifications Grid */}
            <dl className="grid grid-cols-2 border-l border-t border-white/10 dark:border-white/10 light:border-black/10 mb-8 rounded-lg overflow-hidden">
              <div className="p-3.5 border-r border-b border-white/10 dark:border-white/10 light:border-black/10">
                <dt className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">Platform</dt>
                <dd className="text-[13px] font-semibold text-white dark:text-white light:text-black mt-0.5">Android 8.0+ (APK)</dd>
              </div>
              <div className="p-3.5 border-r border-b border-white/10 dark:border-white/10 light:border-black/10">
                <dt className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">Distribution</dt>
                <dd className="text-[13px] font-semibold text-white dark:text-white light:text-black mt-0.5">
                  {versionTag} {fileSize ? `(${fileSize})` : 'Direct APK'}
                </dd>
              </div>
              <div className="p-3.5 border-r border-b border-white/10 dark:border-white/10 light:border-black/10 col-span-2">
                <dt className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">Autonomy</dt>
                <dd className="text-[13px] font-semibold text-white dark:text-white light:text-black mt-0.5">100% Offline Standalone</dd>
              </div>
            </dl>
          </div>

          {/* Automated Direct APK Download Button */}
          <button
            onClick={handleDownloadApk}
            disabled={isDownloading}
            className="group w-full inline-flex h-13 items-center justify-between px-7 rounded-full border border-white/20 dark:border-white/20 light:border-black/20 bg-white/5 dark:bg-white/5 light:bg-white/60 text-white dark:text-white light:text-black font-bold text-sm tracking-wide hover:border-white/40 dark:hover:border-white/40 light:hover:border-black/40 transition-all cursor-pointer backdrop-blur-md disabled:opacity-75"
            title="Download the latest Android APK directly"
          >
            <div className="flex items-center gap-2.5">
              <span>{isDownloading ? 'Downloading APK...' : 'Download Android APK'}</span>
              {versionTag && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 dark:bg-white/10 light:bg-black/10 text-zinc-300 dark:text-zinc-300 light:text-zinc-700 font-semibold">
                  {versionTag}
                </span>
              )}
            </div>
            <span className="grid size-7 place-items-center rounded-full bg-white/10 dark:bg-white/10 light:bg-black/10 text-current transition-transform group-hover:translate-y-0.5">
              {isDownloading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
            </span>
          </button>
        </div>

      </div>

      {/* Bottom Dashed Divider */}
      <div className="dash-x h-px w-full mt-16 sm:mt-24" />
    </section>
  );
};
