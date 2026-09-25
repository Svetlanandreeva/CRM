import React from 'react';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { useCrm } from '../../context/CrmContext';

export interface BulkProgressState {
  current: number;
  total: number;
  label: string;
  isComplete?: boolean;
}

interface BulkOperationProgressProps {
  progress: BulkProgressState | null;
}

export const BulkOperationProgress: React.FC<BulkOperationProgressProps> = ({ progress }) => {
  const { theme } = useCrm();
  const isLight = theme === 'light';

  if (!progress) return null;

  const percentage = progress.total > 0
    ? Math.min(100, Math.round((progress.current / progress.total) * 100))
    : 100;

  return (
    <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-200">
      <div className={`px-4 py-3 rounded-2xl border shadow-2xl flex flex-col gap-2 min-w-[280px] max-w-sm ${
        isLight ? 'bg-white border-black/[0.1] text-[#1A1A1A]' : 'bg-[#1C1C1C] border-white/[0.1] text-white'
      }`}>
        <div className="flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            {progress.isComplete ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            ) : (
              <Loader2 className="w-4 h-4 text-[#2563EB] animate-spin shrink-0" />
            )}
            <span className="font-semibold">{progress.label}</span>
          </div>
          <span className="font-mono text-[11px] text-neutral-400 font-semibold tabular-nums">
            {percentage}%
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1.5 bg-black/[0.06] dark:bg-white/[0.08] rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ease-out ${
              progress.isComplete ? 'bg-emerald-500' : 'bg-[#2563EB]'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400">
          <span>
            {progress.isComplete ? 'Операция завершена' : `Выполнено ${progress.current} из ${progress.total}`}
          </span>
          <span>{progress.isComplete ? 'Успешно' : 'Синхронизация...'}</span>
        </div>
      </div>
    </div>
  );
};
