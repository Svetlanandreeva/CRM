import React, { useState } from 'react';
import {
  Repeat,
  Plus,
  Play,
  Pause,
  Trash2,
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
  Building2,
  FileText,
  Send,
  AlertCircle,
  History,
  ArrowUpRight,
  TrendingUp,
  RefreshCw,
  Search,
  Filter,
  X
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { RecurringInvoiceSchedule, ProposalTemplateId } from '../../types/crm';
import { PROPOSAL_TEMPLATES } from '../../data/mockData';
import { RecurringExecutionHistoryModal } from './RecurringExecutionHistoryModal';

interface RecurringSchedulesListProps {
  onOpenCreate: () => void;
}

export const RecurringSchedulesList: React.FC<RecurringSchedulesListProps> = ({ onOpenCreate }) => {
  const {
    recurringSchedules,
    recurringLogs,
    schedulerSettings,
    updateSchedulerSettings,
    toggleRecurringScheduleStatus,
    deleteRecurringSchedule,
    triggerRecurringScheduleNow,
    runAutomatedSchedulerCheck,
    openClientCockpit,
    theme
  } = useCrm();

  const isLight = theme === 'light';

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'paused'>('all');
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedHistoryScheduleId, setSelectedHistoryScheduleId] = useState<string | undefined>(undefined);
  const [checkingNow, setCheckingNow] = useState(false);
  const [checkResultToast, setCheckResultToast] = useState<string | null>(null);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(val);
  };

  const handleManualCheck = () => {
    setCheckingNow(true);
    setTimeout(() => {
      const res = runAutomatedSchedulerCheck();
      setCheckingNow(false);
      if (res.triggeredCount > 0) {
        setCheckResultToast(`✓ Автоматически сформировано ${res.triggeredCount} счетов по подошедшим срокам!`);
      } else {
        setCheckResultToast(`✓ Все расписания актуальны. Новых счетов к выпуску на текущую дату нет.`);
      }
      setTimeout(() => setCheckResultToast(null), 4000);
    }, 600);
  };

  const handleTriggerSingle = (schedule: RecurringInvoiceSchedule) => {
    const doc = triggerRecurringScheduleNow(schedule.id);
    if (doc) {
      setCheckResultToast(`✓ Сформирован счет ${doc.number} по договору ${schedule.contractNumber} (${formatCurrency(doc.amount)})`);
      setTimeout(() => setCheckResultToast(null), 4000);
    }
  };

  // Filtered schedules
  const filteredSchedules = recurringSchedules.filter((sch) => {
    const matchesSearch =
      sch.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sch.contractNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sch.contractTitle.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' || sch.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Calculate MRR (Monthly Recurring Revenue)
  const totalMRR = recurringSchedules
    .filter(s => s.status === 'active')
    .reduce((sum, s) => {
      if (s.frequency === 'monthly') return sum + s.amount;
      if (s.frequency === 'quarterly') return sum + (s.amount / 3);
      if (s.frequency === 'biweekly') return sum + (s.amount * 2);
      if (s.frequency === 'weekly') return sum + (s.amount * 4.3);
      if (s.frequency === 'annually') return sum + (s.amount / 12);
      return sum;
    }, 0);

  const activeCount = recurringSchedules.filter(s => s.status === 'active').length;

  const getFrequencyLabel = (freq: string, day: number) => {
    switch (freq) {
      case 'monthly':
        return `Ежемесячно (${day}-го числа)`;
      case 'quarterly':
        return `Раз в квартал (${day}-го числа)`;
      case 'biweekly':
        return 'Раз в 2 недели';
      case 'weekly':
        return 'Еженедельно';
      case 'annually':
        return 'Ежегодно';
      default:
        return freq;
    }
  };

  const getDaysUntil = (nextDateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(nextDateStr);
    target.setHours(0, 0, 0, 0);

    const diffMs = target.getTime() - today.getTime();
    const diffDays = Math.round(diffMs / 86400000);

    if (diffDays < 0) return 'Срок наступил';
    if (diffDays === 0) return 'Сегодня';
    if (diffDays === 1) return 'Завтра';
    return `Через ${diffDays} дн.`;
  };

  return (
    <div className="space-y-5">
      {/* Toast Alert */}
      {checkResultToast && (
        <div className="p-3 rounded-xl bg-purple-600 text-white text-xs font-semibold shadow-lg flex items-center justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{checkResultToast}</span>
          </div>
          <button onClick={() => setCheckResultToast(null)} className="text-white/80 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Recurring Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Metric 1: MRR */}
        <div className={`p-4 rounded-2xl border space-y-1 ${
          isLight ? 'bg-white border-black/[0.08]' : 'bg-[#181818] border-white/[0.08]'
        }`}>
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-[10px] font-mono uppercase tracking-wider">Регулярный оборот (MRR)</span>
            <TrendingUp className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="text-xl font-bold font-mono text-purple-600 dark:text-purple-400">
            {formatCurrency(totalMRR)}
          </div>
          <div className="text-[11px] text-neutral-500">
            По {activeCount} активным абонентским договорам
          </div>
        </div>

        {/* Metric 2: Active Schedules */}
        <div className={`p-4 rounded-2xl border space-y-1 ${
          isLight ? 'bg-white border-black/[0.08]' : 'bg-[#181818] border-white/[0.08]'
        }`}>
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-[10px] font-mono uppercase tracking-wider">Активные контракты</span>
            <Repeat className="w-4 h-4 text-[#2563EB]" />
          </div>
          <div className="text-xl font-bold font-mono text-[#1A1A1A] dark:text-white">
            {activeCount} <span className="text-xs text-neutral-400 font-normal">из {recurringSchedules.length}</span>
          </div>
          <div className="text-[11px] text-neutral-500">
            {recurringSchedules.length - activeCount} на паузе
          </div>
        </div>

        {/* Metric 3: Automated Total Billed */}
        <div className={`p-4 rounded-2xl border space-y-1 ${
          isLight ? 'bg-white border-black/[0.08]' : 'bg-[#181818] border-white/[0.08]'
        }`}>
          <div className="flex items-center justify-between text-neutral-400">
            <span className="text-[10px] font-mono uppercase tracking-wider">Выставлено авто-счетов</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold font-mono text-emerald-600">
            {recurringSchedules.reduce((s, it) => s + it.totalExecutedCount, 0)} счетов
          </div>
          <div className="text-[11px] text-neutral-500 font-mono">
            на {formatCurrency(recurringSchedules.reduce((s, it) => s + it.totalExecutedAmount, 0))}
          </div>
        </div>

        {/* Metric 4: Engine Status & Manual Trigger */}
        <div className={`p-4 rounded-2xl border space-y-2 flex flex-col justify-between ${
          isLight ? 'bg-white border-black/[0.08]' : 'bg-[#181818] border-white/[0.08]'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">Планировщик CRM</span>
            <span className={`inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
              schedulerSettings.enabled
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                : 'bg-neutral-200 text-neutral-600'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${schedulerSettings.enabled ? 'bg-emerald-500 animate-pulse' : 'bg-neutral-400'}`} />
              <span>{schedulerSettings.enabled ? 'АКТИВЕН' : 'ОТКЛЮЧЕН'}</span>
            </span>
          </div>

          <button
            onClick={handleManualCheck}
            disabled={checkingNow}
            className={`w-full py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
              isLight
                ? 'bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200'
                : 'bg-purple-950/40 hover:bg-purple-900/60 text-purple-300 border-purple-800/60'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${checkingNow ? 'animate-spin' : ''}`} />
            <span>{checkingNow ? 'Проверка...' : 'Проверить сроки сейчас'}</span>
          </button>
        </div>
      </div>

      {/* Control Bar: Search, Filters & Action Buttons */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-lg">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по клиенту, номеру договора или предмету..."
              className={`w-full pl-8 pr-3 py-2 rounded-xl text-xs border font-medium focus:outline-none focus:ring-1 focus:ring-[#2563EB] ${
                isLight ? 'bg-white border-black/[0.08]' : 'bg-[#1E1E1E] border-white/[0.08]'
              }`}
            />
          </div>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className={`rounded-xl px-3 py-2 text-xs border font-semibold focus:outline-none focus:ring-1 focus:ring-[#2563EB] ${
              isLight ? 'bg-white border-black/[0.08]' : 'bg-[#1E1E1E] border-white/[0.08]'
            }`}
          >
            <option value="all">Все статусы</option>
            <option value="active">Только активные</option>
            <option value="paused">На паузе</option>
          </select>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* History modal button */}
          <button
            onClick={() => {
              setSelectedHistoryScheduleId(undefined);
              setIsHistoryModalOpen(true);
            }}
            className={`px-3.5 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              isLight
                ? 'bg-white hover:bg-neutral-50 border-black/[0.08] text-neutral-700'
                : 'bg-[#1E1E1E] hover:bg-[#252525] border-white/[0.08] text-neutral-200'
            }`}
          >
            <History className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            <span>Журнал автовыпусков ({recurringLogs.length})</span>
          </button>

          {/* Add schedule button */}
          <button
            onClick={onOpenCreate}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>+ Настроить автовыставление</span>
          </button>
        </div>
      </div>

      {/* Schedules Cards Grid / List */}
      {filteredSchedules.length === 0 ? (
        <div className="h-48 flex flex-col items-center justify-center text-xs text-neutral-400 space-y-2 border border-dashed rounded-2xl border-black/[0.08] dark:border-white/[0.08]">
          <Repeat className="w-6 h-6 stroke-[1.5] text-neutral-300 dark:text-neutral-600" />
          <div>Регулярные графики счетов не найдены</div>
          <button
            onClick={onOpenCreate}
            className="text-purple-600 font-semibold hover:underline"
          >
            Создать первый график автовыставления
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSchedules.map((schedule) => {
            const tmplMeta = PROPOSAL_TEMPLATES.find(t => t.id === schedule.templateId);
            const isPaused = schedule.status === 'paused';
            const daysLabel = getDaysUntil(schedule.nextRunDate);

            return (
              <div
                key={schedule.id}
                className={`p-5 rounded-2xl border flex flex-col justify-between gap-4 transition-all relative ${
                  isPaused
                    ? isLight
                      ? 'bg-neutral-50/80 border-black/[0.06] opacity-80'
                      : 'bg-[#181818]/60 border-white/[0.06] opacity-80'
                    : isLight
                    ? 'bg-white border-black/[0.08] shadow-2xs hover:border-black/20'
                    : 'bg-[#181818] border-white/[0.08] shadow-2xs hover:border-white/20'
                }`}
              >
                {/* Top: Status & Contract Header */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-purple-600 dark:text-purple-400">
                        {schedule.contractNumber}
                      </span>
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                        schedule.status === 'active'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                      }`}>
                        {schedule.status === 'active' ? 'АКТИВЕН' : 'НА ПАУЗЕ'}
                      </span>
                    </div>

                    {/* Next due countdown badge */}
                    <div className="flex items-center gap-1 font-mono text-[11px]">
                      <Clock className="w-3.5 h-3.5 text-neutral-400" />
                      <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                        {new Date(schedule.nextRunDate).toLocaleDateString('ru-RU')}
                      </span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                        daysLabel === 'Сегодня' || daysLabel === 'Срок наступил'
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-black/[0.04] dark:bg-white/[0.06] text-neutral-500'
                      }`}>
                        ({daysLabel})
                      </span>
                    </div>
                  </div>

                  <h3 className="font-bold text-sm text-[#1A1A1A] dark:text-white leading-snug">
                    {schedule.contractTitle}
                  </h3>

                  {/* Client Info */}
                  <div className="flex items-center justify-between text-xs text-neutral-500">
                    <button
                      type="button"
                      onClick={() => openClientCockpit(schedule.clientId)}
                      className="font-medium text-neutral-800 dark:text-neutral-200 hover:text-[#2563EB] hover:underline flex items-center gap-1"
                    >
                      <Building2 className="w-3.5 h-3.5 text-neutral-400" />
                      <span className="truncate max-w-[220px]">{schedule.clientName}</span>
                      <ArrowUpRight className="w-3 h-3 opacity-60" />
                    </button>

                    <span className="text-[11px] font-mono text-neutral-400">
                      {getFrequencyLabel(schedule.frequency, schedule.billingDay)}
                    </span>
                  </div>
                </div>

                {/* Items & Amount Summary Plate */}
                <div className={`p-3 rounded-xl border text-xs space-y-2 ${
                  isLight ? 'bg-[#F8F7F4] border-black/[0.04]' : 'bg-[#202020] border-white/[0.04]'
                }`}>
                  <div className="flex items-baseline justify-between">
                    <span className="text-[10px] text-neutral-400 uppercase font-mono">Сумма регулярного счета:</span>
                    <span className="text-base font-bold font-mono text-purple-600 dark:text-purple-400">
                      {formatCurrency(schedule.amount)}
                    </span>
                  </div>

                  {/* Single item preview */}
                  <div className="text-[11px] text-neutral-600 dark:text-neutral-300 truncate">
                    {schedule.items[0]?.title} {schedule.items.length > 1 ? `(+ еще ${schedule.items.length - 1} поз.)` : ''}
                  </div>

                  {/* Flags (Email, CRM, Template) */}
                  <div className="flex items-center gap-2 pt-1 border-t border-black/[0.04] dark:border-white/[0.04] flex-wrap text-[10px] font-mono">
                    <span className="px-1.5 py-0.5 rounded bg-black/[0.04] dark:bg-white/[0.06] text-neutral-600 dark:text-neutral-400">
                      Шаблон: {tmplMeta?.badge || '1С / ГОСТ'}
                    </span>
                    {schedule.autoSendEmail ? (
                      <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 flex items-center gap-1">
                        <Send className="w-2.5 h-2.5" />
                        <span>Авто-email</span>
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-500">
                        Черновик в CRM
                      </span>
                    )}
                    <span className="text-neutral-400 ml-auto">
                      Выставлено: {schedule.totalExecutedCount} раз ({formatCurrency(schedule.totalExecutedAmount)})
                    </span>
                  </div>
                </div>

                {/* Action Controls */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-black/[0.06] dark:border-white/[0.06]">
                  {/* Left: History & Pause buttons */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedHistoryScheduleId(schedule.id);
                        setIsHistoryModalOpen(true);
                      }}
                      className="p-1.5 text-neutral-500 hover:text-purple-600 rounded-lg hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition-colors"
                      title="История выпусков этого контракта"
                    >
                      <History className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleRecurringScheduleStatus(schedule.id)}
                      className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-colors ${
                        isPaused
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                          : 'bg-neutral-100 text-neutral-700 border-neutral-200 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700'
                      }`}
                    >
                      {isPaused ? <Play className="w-3 h-3 fill-current" /> : <Pause className="w-3 h-3" />}
                      <span>{isPaused ? 'Возобновить' : 'Приостановить'}</span>
                    </button>
                  </div>

                  {/* Right: Trigger Single Run now & Delete */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleTriggerSingle(schedule)}
                      className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors"
                      title="Сформировать следующий счет не дожидаясь наступления даты"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Выставить счет сейчас</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Удалить регулярный график по договору ${schedule.contractNumber}?`)) {
                          deleteRecurringSchedule(schedule.id);
                        }
                      }}
                      className="p-1.5 text-neutral-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      title="Удалить график"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* History Modal */}
      <RecurringExecutionHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        scheduleId={selectedHistoryScheduleId}
      />
    </div>
  );
};
