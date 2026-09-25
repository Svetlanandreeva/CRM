import React from 'react';
import {
  X,
  History,
  CheckCircle2,
  FileText,
  Clock,
  ArrowUpRight,
  Sparkles,
  Download
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { RecurringScheduleExecutionLog } from '../../types/crm';

interface RecurringExecutionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  scheduleId?: string; // Optional filter to a single schedule
}

export const RecurringExecutionHistoryModal: React.FC<RecurringExecutionHistoryModalProps> = ({
  isOpen,
  onClose,
  scheduleId
}) => {
  const { recurringLogs, recurringSchedules, documents, openClientCockpit, theme } = useCrm();
  const isLight = theme === 'light';

  if (!isOpen) return null;

  const filteredLogs = scheduleId
    ? recurringLogs.filter(l => l.scheduleId === scheduleId)
    : recurringLogs;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(val);
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-black/65 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className={`rounded-2xl max-w-4xl w-full p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto border my-auto ${
        isLight ? 'bg-white border-black/[0.08] text-[#1A1A1A]' : 'bg-[#1C1C1C] border-white/[0.08] text-white'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between pb-3 border-b ${
          isLight ? 'border-black/[0.06]' : 'border-white/[0.06]'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="meta-label text-purple-600 dark:text-purple-400">ЖУРНАЛ АВТОМАТИЗАЦИИ</div>
              <h2 className="text-base font-bold tracking-tight">
                История автоматических выпусков счетов
              </h2>
            </div>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-700 dark:hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List of executions */}
        {filteredLogs.length === 0 ? (
          <div className="h-44 flex flex-col items-center justify-center text-xs text-neutral-400 space-y-1">
            <Clock className="w-6 h-6 stroke-[1.5] text-neutral-300 dark:text-neutral-600" />
            <div>Журнал пуст. Автоматические счета еще не формировались.</div>
          </div>
        ) : (
          <div className={`border rounded-xl overflow-hidden ${
            isLight ? 'border-black/[0.08]' : 'border-white/[0.08]'
          }`}>
            <table className="w-full text-left text-xs">
              <thead className={`border-b text-[10px] font-mono uppercase font-semibold ${
                isLight ? 'bg-black/[0.02] text-neutral-500 border-black/[0.08]' : 'bg-white/[0.02] text-neutral-400 border-white/[0.08]'
              }`}>
                <tr>
                  <th className="py-2.5 px-3">Дата запуска</th>
                  <th className="py-2.5 px-3">Номер счета</th>
                  <th className="py-2.5 px-3">Клиент и договор</th>
                  <th className="py-2.5 px-3 text-right">Сумма</th>
                  <th className="py-2.5 px-3">Статус</th>
                  <th className="py-2.5 px-3">Детали</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isLight ? 'divide-black/[0.04]' : 'divide-white/[0.04]'}`}>
                {filteredLogs.map((log) => {
                  const schedule = recurringSchedules.find(s => s.id === log.scheduleId);
                  const doc = documents.find(d => d.id === log.documentId);

                  return (
                    <tr key={log.id} className="hover:bg-black/[0.01] dark:hover:bg-white/[0.01]">
                      <td className="py-3 px-3 font-mono text-[11px] text-neutral-500 whitespace-nowrap">
                        {formatDate(log.executedAt)}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-purple-600 dark:text-purple-400">
                        {log.documentNumber}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-neutral-900 dark:text-white truncate max-w-xs">{log.clientName}</div>
                        {schedule && (
                          <div className="text-[10px] text-neutral-400 font-mono">
                            {schedule.contractNumber} · {schedule.contractTitle}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold tabular-nums">
                        {formatCurrency(log.amount)}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Успешно</span>
                        </span>
                      </td>
                      <td className="py-3 px-3 text-[11px] text-neutral-500">
                        {log.notes || 'Выставлен по расписанию'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 rounded-xl text-xs font-semibold transition-colors"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};
