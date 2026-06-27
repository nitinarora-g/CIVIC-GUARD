import React, { useEffect, useRef } from 'react';
import { Terminal, Shield, RefreshCw } from 'lucide-react';
import { SystemLog } from '../types';

interface LoggerViewProps {
  logs: SystemLog[];
  onClear: () => void;
}

export default function LoggerView({ logs, onClear }: LoggerViewProps) {
  const terminalEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const getTypeStyle = (type: SystemLog['type']) => {
    switch (type) {
      case 'auth':
        return 'text-brand-cyan font-semibold';
      case 'database':
        return 'text-emerald-400 font-semibold';
      case 'geofence':
        return 'text-purple-400 font-semibold';
      case 'rewards':
        return 'text-brand-coin font-semibold';
      case 'challenge':
        return 'text-rose-400 font-semibold';
      default:
        return 'text-brand-text-dim';
    }
  };

  return (
    <div className="flex flex-col bg-[#0C0C0C] rounded-xl border border-brand-border shadow-2xl overflow-hidden font-mono text-xs text-brand-text-main h-full max-h-[460px] animate-fade-in" id="logger-view-terminal">
      {/* Terminal Header */}
      <div className="bg-[#141414] px-4 py-2.5 flex items-center justify-between border-b border-brand-border">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-brand-cyan animate-pulse" />
          <span className="font-semibold text-brand-text-main">DevConsole — DB & Geofence Logs</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] bg-brand-dark-bg text-brand-text-dim px-2 py-0.5 rounded flex items-center gap-1 border border-brand-border">
            <Shield className="h-3 w-3 text-brand-cyan" /> ST_DistanceSphere active
          </span>
          <button
            onClick={onClear}
            className="text-brand-text-dim hover:text-brand-text-main p-1 hover:bg-brand-dark-bg rounded transition-colors"
            title="Clear Console"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Logs Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2.5 min-h-[300px] max-h-[380px] no-scrollbar select-text selection:bg-brand-cyan/25">
        {logs.length === 0 ? (
          <div className="text-brand-text-dim text-center py-10">
            No system logs captured yet. Trigger actions in the Mobile Simulator on the right to view spatial checks!
          </div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="leading-relaxed border-b border-brand-border/40 pb-1.5 hover:bg-brand-dark-bg/30 transition-colors">
              <span className="text-brand-text-dim mr-2 font-light">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
              <span className={`uppercase mr-2 ${getTypeStyle(log.type)}`}>
                {`[${log.type}]`}
              </span>
              <span className="text-brand-text-main">{log.message}</span>
              {log.details && (
                <pre className="mt-1.5 pl-4 text-brand-text-dim text-[10px] bg-brand-dark-bg/80 p-2 rounded overflow-x-auto border-l-2 border-brand-cyan/40 no-scrollbar">
                  {JSON.stringify(log.details, null, 2)}
                </pre>
              )}
            </div>
          ))
        )}
        <div ref={terminalEndRef} />
      </div>
    </div>
  );
}
