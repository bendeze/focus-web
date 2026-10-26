import React, { useState, useMemo } from 'react';
import {
  Search,
  Download,
  Trash2,
  X,
  RefreshCw,
} from 'lucide-react';
import type { SystemAuditLog } from '../../types';

interface AdminAuditLogsTabProps {
  auditLogs: SystemAuditLog[];
  onClearLogs?: () => void;
  onRefresh?: () => void | Promise<void>;
  isRefreshing?: boolean;
}

export const AdminAuditLogsTab: React.FC<AdminAuditLogsTabProps> = ({
  auditLogs,
  onClearLogs,
  onRefresh,
  isRefreshing,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<'all' | 'info' | 'success' | 'warning' | 'danger'>('all');

  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        log.action.toLowerCase().includes(q) ||
        log.actor.toLowerCase().includes(q) ||
        log.details.toLowerCase().includes(q) ||
        log.ip_address.includes(q);

      const matchSeverity = severityFilter === 'all' || log.severity === severityFilter;

      return matchSearch && matchSeverity;
    });
  }, [auditLogs, searchQuery, severityFilter]);

  const handleExportLogs = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(auditLogs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `focus_audit_logs_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="flex flex-col gap-5 animate-in fade-in duration-200">
      {/* 1. Minimal Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-xl font-medium tracking-tight text-white dark:text-white light:text-black">
            Audit Logs
          </h2>
          <span className="text-xs text-zinc-500 font-mono">
            {filteredLogs.length} of {auditLogs.length} events
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="h-8 px-3 rounded-xl bg-zinc-900/60 hover:bg-zinc-850 border border-zinc-800 text-xs font-mono text-zinc-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              title="Fetch latest audit logs"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-zinc-400 ${isRefreshing ? 'animate-spin text-white' : ''}`} />
              <span>{isRefreshing ? 'Syncing...' : 'Sync'}</span>
            </button>
          )}
          {onClearLogs && (
            <button
              onClick={onClearLogs}
              className="h-8 px-3 rounded-xl bg-zinc-900/60 hover:bg-red-950/40 border border-zinc-800 hover:border-red-900/50 text-xs font-mono text-zinc-400 hover:text-red-300 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          )}
          <button
            onClick={handleExportLogs}
            className="h-8 px-3.5 rounded-xl bg-zinc-900/60 hover:bg-zinc-850 border border-zinc-800 text-xs font-mono text-white flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-zinc-400" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {/* 2. Minimalist Search & Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search events, actor, IP..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8.5 pr-4 py-1.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value as any)}
          className="h-8 px-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs text-zinc-300 focus:outline-none focus:border-zinc-500 cursor-pointer"
        >
          <option value="all">All Severities</option>
          <option value="success">Success</option>
          <option value="warning">Warning</option>
          <option value="danger">Alerts</option>
          <option value="info">Info</option>
        </select>
      </div>

      {/* 3. Minimalist Audit Table */}
      <div className="rounded-2xl bg-zinc-950 border border-subtle-dark overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-subtle-dark text-zinc-400 font-mono text-[10px] tracking-wider uppercase bg-zinc-900/30">
                <th className="py-3 px-5 font-medium">Timestamp</th>
                <th className="py-3 px-5 font-medium">Event</th>
                <th className="py-3 px-5 font-medium">Actor</th>
                <th className="py-3 px-5 font-medium">Details</th>
                <th className="py-3 px-5 font-medium text-right">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900/60">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-zinc-500 font-light">
                    No audit records match the selected criteria.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-zinc-900/30 transition-colors">
                    {/* Timestamp */}
                    <td className="py-3 px-5 font-mono text-[11px] text-zinc-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>

                    {/* Action */}
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                            log.severity === 'success'
                              ? 'bg-emerald-400'
                              : log.severity === 'warning'
                              ? 'bg-amber-400'
                              : log.severity === 'danger'
                              ? 'bg-red-400'
                              : 'bg-zinc-400'
                          }`}
                        />
                        <span className="font-mono text-[11px] text-zinc-200">
                          {log.action}
                        </span>
                      </div>
                    </td>

                    {/* Actor */}
                    <td className="py-3 px-5 font-medium text-white dark:text-white light:text-black">
                      {log.actor}
                    </td>

                    {/* Details */}
                    <td className="py-3 px-5 text-zinc-400 font-light max-w-md truncate">
                      {log.details}
                    </td>

                    {/* IP */}
                    <td className="py-3 px-5 text-right font-mono text-[11px] text-zinc-500">
                      {log.ip_address}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
