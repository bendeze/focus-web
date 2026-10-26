import React, { useState } from 'react';
import {
  Download,
  RotateCcw,
  Radio,
} from 'lucide-react';
import type { PlatformConfig } from '../../types';
import { getBaseUrl } from '../../services/api';

interface AdminSettingsTabProps {
  config: PlatformConfig;
  onUpdateConfig: (patch: Partial<PlatformConfig>) => void;
  onExportAllData: () => void;
  onResetData: () => void;
  onPingApi: () => Promise<void>;
  latencyMs: number | null;
  apiStatus: 'healthy' | 'checking' | 'degraded';
}

export const AdminSettingsTab: React.FC<AdminSettingsTabProps> = ({
  config,
  onUpdateConfig,
  onExportAllData,
  onResetData,
  onPingApi,
  latencyMs,
  apiStatus,
}) => {
  const [pinging, setPinging] = useState(false);

  const envAdminEmail = import.meta.env.VITE_ADMIN_EMAIL || 'admin@focus.app';
  const envAdminUsername = import.meta.env.VITE_ADMIN_USERNAME || 'admin';
  const apiUrl = getBaseUrl();

  const handleTestPing = async () => {
    setPinging(true);
    await onPingApi();
    setPinging(false);
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-200">
      {/* 1. Minimal Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-xl font-medium tracking-tight text-white dark:text-white light:text-black">
            Settings
          </h2>
          <span className="text-xs text-zinc-500 font-mono">
            Platform configuration & environment rules
          </span>
        </div>

        <button
          onClick={onExportAllData}
          className="h-8 px-3.5 rounded-xl bg-white text-black text-xs font-medium flex items-center gap-1.5 hover:bg-zinc-200 active:scale-98 transition-all cursor-pointer shadow-sm self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Snapshot</span>
        </button>
      </div>

      {/* 2. Grid: Feature Flags & Credentials */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left: Platform Feature Toggles */}
        <div className="p-5 rounded-2xl bg-zinc-950 border border-subtle-dark flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-400 mb-4">
              Platform Rules
            </h3>

            <div className="space-y-3">
              {/* Toggle 1: Allow Registrations */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/60">
                <div>
                  <div className="text-xs font-medium text-white">
                    Allow Registrations
                  </div>
                  <div className="text-[11px] text-zinc-500 font-light">
                    Accept new signups
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    onUpdateConfig({ allow_registrations: !config.allow_registrations })
                  }
                  className={`w-10 h-5.5 rounded-full transition-colors relative cursor-pointer ${
                    config.allow_registrations ? 'bg-white' : 'bg-zinc-800'
                  }`}
                >
                  <span
                    className={`block w-3.5 h-3.5 rounded-full transition-transform duration-200 absolute top-1 ${
                      config.allow_registrations
                        ? 'translate-x-5.5 bg-black'
                        : 'translate-x-1 bg-zinc-400'
                    }`}
                  />
                </button>
              </div>

              {/* Toggle 2: Maintenance Mode */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/60">
                <div>
                  <div className="text-xs font-medium text-white flex items-center gap-1.5">
                    <span>Maintenance Mode</span>
                    {config.maintenance_mode && (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    )}
                  </div>
                  <div className="text-[11px] text-zinc-500 font-light">
                    Lock public features with banner
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    onUpdateConfig({ maintenance_mode: !config.maintenance_mode })
                  }
                  className={`w-10 h-5.5 rounded-full transition-colors relative cursor-pointer ${
                    config.maintenance_mode ? 'bg-amber-400' : 'bg-zinc-800'
                  }`}
                >
                  <span
                    className={`block w-3.5 h-3.5 rounded-full transition-transform duration-200 absolute top-1 ${
                      config.maintenance_mode
                        ? 'translate-x-5.5 bg-black'
                        : 'translate-x-1 bg-zinc-400'
                    }`}
                  />
                </button>
              </div>

              {/* Toggle 3: Guest Mode */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/60">
                <div>
                  <div className="text-xs font-medium text-white">
                    Guest Mode
                  </div>
                  <div className="text-[11px] text-zinc-500 font-light">
                    Allow offline local Pomodoro timer
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    onUpdateConfig({ guest_mode_enabled: !config.guest_mode_enabled })
                  }
                  className={`w-10 h-5.5 rounded-full transition-colors relative cursor-pointer ${
                    config.guest_mode_enabled ? 'bg-white' : 'bg-zinc-800'
                  }`}
                >
                  <span
                    className={`block w-3.5 h-3.5 rounded-full transition-transform duration-200 absolute top-1 ${
                      config.guest_mode_enabled
                        ? 'translate-x-5.5 bg-black'
                        : 'translate-x-1 bg-zinc-400'
                    }`}
                  />
                </button>
              </div>

              {/* Default Sprint Duration */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/60">
                <div>
                  <div className="text-xs font-medium text-white">
                    Default Sprint Duration
                  </div>
                  <div className="text-[11px] text-zinc-500 font-light">
                    Timer length in minutes
                  </div>
                </div>
                <select
                  value={config.default_focus_duration}
                  onChange={(e) =>
                    onUpdateConfig({ default_focus_duration: Number(e.target.value) })
                  }
                  className="h-8 px-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none cursor-pointer"
                >
                  <option value={15}>15m</option>
                  <option value={20}>20m</option>
                  <option value={25}>25m</option>
                  <option value={45}>45m</option>
                  <option value={50}>50m</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Environment & Administrator Credentials */}
        <div className="p-5 rounded-2xl bg-zinc-950 border border-subtle-dark flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-400 mb-4">
              Administrator Environment
            </h3>

            <div className="space-y-2.5">
              <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/60">
                <span className="block text-[10px] font-mono uppercase text-zinc-500 mb-0.5">
                  VITE_ADMIN_EMAIL
                </span>
                <span className="font-mono text-xs text-white select-all">
                  {envAdminEmail}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/60">
                <span className="block text-[10px] font-mono uppercase text-zinc-500 mb-0.5">
                  VITE_ADMIN_USERNAME
                </span>
                <span className="font-mono text-xs text-white select-all">
                  {envAdminUsername}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/60">
                <span className="block text-[10px] font-mono uppercase text-zinc-500 mb-0.5">
                  VITE_ADMIN_PASSWORD
                </span>
                <span className="font-mono text-xs text-zinc-500 select-all">
                  ••••••••••••
                </span>
              </div>
            </div>

            <div className="mt-3 text-[11px] text-zinc-500 font-mono">
              Configured via <code className="text-zinc-300">web/.env</code>. Hot-reloaded on save.
            </div>
          </div>
        </div>
      </div>

      {/* 3. API Diagnostics & Reset Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* API Backend Diagnostics (2 cols) */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-zinc-950 border border-subtle-dark">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-400">
              Diagnostics
            </h3>

            <button
              onClick={handleTestPing}
              disabled={pinging}
              className="h-7 px-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-xs font-mono text-white flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Radio className={`w-3 h-3 ${pinging ? 'animate-pulse text-amber-400' : 'text-emerald-400'}`} />
              <span>{pinging ? 'Pinging...' : 'Ping'}</span>
            </button>
          </div>

          <div className="divide-y divide-zinc-900 text-xs font-mono">
            <div className="py-2 flex items-center justify-between">
              <span className="text-zinc-500">Endpoint</span>
              <span className="text-zinc-200 truncate max-w-sm">{apiUrl}</span>
            </div>
            <div className="py-2 flex items-center justify-between">
              <span className="text-zinc-500">Status</span>
              <span className="text-emerald-400 uppercase">{apiStatus}</span>
            </div>
            <div className="py-2 flex items-center justify-between">
              <span className="text-zinc-500">Latency</span>
              <span className="text-zinc-200 tabular-nums">{latencyMs ? `${latencyMs}ms` : '—'}</span>
            </div>
          </div>
        </div>

        {/* Reset / Backup Controls (1 col) */}
        <div className="p-5 rounded-2xl bg-zinc-950 border border-subtle-dark flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-400 mb-3">
              Maintenance
            </h3>

            <button
              onClick={onResetData}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-zinc-900/60 hover:bg-red-950/40 border border-zinc-800 hover:border-red-900/50 text-xs text-zinc-400 hover:text-red-300 transition-colors cursor-pointer font-mono"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Local State</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
