import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Flame,
  ArrowRight,
  ChevronRight,
  TrendingUp,
  Briefcase,
  Users,
  AlertTriangle,
  Clock,
  Plus,
  Calendar,
  CalendarDays,
  ChevronDown,
  RotateCcw,
  Check,
  X,
  Filter
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { DEAL_STAGES } from '../../data/mockData';

export type DateRangePreset = 
  | 'all'
  | 'today'
  | 'week'
  | 'month'
  | 'last_month'
  | 'q3'
  | 'year'
  | 'custom';

interface PresetOption {
  id: DateRangePreset;
  label: string;
  shortLabel: string;
  start: string | null;
  end: string | null;
  description: string;
}

export const DashboardView: React.FC = () => {
  const { 
    clients, 
    deals, 
    tasks, 
    openClientCockpit, 
    setCurrentTab, 
    notifications, 
    setIsCreateDealOpen,
    theme 
  } = useCrm();

  const isLight = theme === 'light';

  // System local anchor date: 2026-09-24
  const TODAY_STR = '2026-09-24';

  // Presets definition
  const presets: PresetOption[] = useMemo(() => [
    {
      id: 'all',
      label: 'Всё время',
      shortLabel: 'Всё время',
      start: null,
      end: null,
      description: 'Все данные без ограничения по датам'
    },
    {
      id: 'today',
      label: 'Сегодня (24 сен 2026)',
      shortLabel: 'Сегодня',
      start: '2026-09-24',
      end: '2026-09-24',
      description: 'Текущий рабочий день'
    },
    {
      id: 'week',
      label: 'Последние 7 дней',
      shortLabel: '7 дней',
      start: '2026-09-18',
      end: '2026-09-24',
      description: '18 — 24 сентября 2026'
    },
    {
      id: 'month',
      label: 'Этот месяц (Сентябрь 2026)',
      shortLabel: 'Сентябрь',
      start: '2026-09-01',
      end: '2026-09-30',
      description: '01 — 30 сентября 2026'
    },
    {
      id: 'last_month',
      label: 'Прошлый месяц (Август 2026)',
      shortLabel: 'Август',
      start: '2026-08-01',
      end: '2026-08-31',
      description: '01 — 31 августа 2026'
    },
    {
      id: 'q3',
      label: '3-й квартал 2026 (Q3)',
      shortLabel: '3 квартал',
      start: '2026-07-01',
      end: '2026-09-30',
      description: 'Июль — Сентябрь 2026'
    },
    {
      id: 'year',
      label: '2026 год (Весь год)',
      shortLabel: '2026 год',
      start: '2026-01-01',
      end: '2026-12-31',
      description: '01 января — 31 декабря 2026'
    }
  ], []);

  // Active date range state
  const [activePreset, setActivePreset] = useState<DateRangePreset>('all');
  const [customStart, setCustomStart] = useState<string>('2026-09-01');
  const [customEnd, setCustomEnd] = useState<string>('2026-09-24');
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsPickerOpen(false);
      }
    };
    if (isPickerOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isPickerOpen]);

  // Determine current active start and end dates
  const { currentStartDate, currentEndDate } = useMemo(() => {
    if (activePreset === 'custom') {
      return {
        currentStartDate: customStart || null,
        currentEndDate: customEnd || null
      };
    }
    const found = presets.find(p => p.id === activePreset);
    return {
      currentStartDate: found?.start || null,
      currentEndDate: found?.end || null
    };
  }, [activePreset, customStart, customEnd, presets]);

  // Helper date formatted label
  const activeRangeDisplay = useMemo(() => {
    if (activePreset === 'all') return 'Всё время (2026)';
    if (activePreset === 'today') return 'Сегодня · 24.09.2026';
    if (activePreset === 'week') return '7 дней · 18.09 — 24.09.2026';
    if (activePreset === 'month') return 'Сентябрь 2026 · 01.09 — 30.09';
    if (activePreset === 'last_month') return 'Август 2026 · 01.08 — 31.08';
    if (activePreset === 'q3') return '3 квартал · 01.07 — 30.09.2026';
    if (activePreset === 'year') return '2026 год · 01.01 — 31.12';
    if (currentStartDate && currentEndDate) {
      const s = currentStartDate.split('-').reverse().join('.');
      const e = currentEndDate.split('-').reverse().join('.');
      return `${s} — ${e}`;
    }
    return 'Выбранный период';
  }, [activePreset, currentStartDate, currentEndDate]);

  // Filter deals based on date range
  const filteredDeals = useMemo(() => {
    if (!currentStartDate && !currentEndDate) return deals;

    return deals.filter(deal => {
      const dealDate = deal.createdAt.split('T')[0];
      if (currentStartDate && dealDate < currentStartDate) return false;
      if (currentEndDate && dealDate > currentEndDate) return false;
      return true;
    });
  }, [deals, currentStartDate, currentEndDate]);

  // Filter clients based on date range
  const filteredClients = useMemo(() => {
    if (!currentStartDate && !currentEndDate) return clients;

    return clients.filter(c => {
      const clientDate = c.createdAt.split('T')[0];
      if (currentStartDate && clientDate < currentStartDate) return false;
      if (currentEndDate && clientDate > currentEndDate) return false;
      return true;
    });
  }, [clients, currentStartDate, currentEndDate]);

  // Filter tasks based on deadline/createdAt in period
  const filteredTasks = useMemo(() => {
    if (!currentStartDate && !currentEndDate) return tasks;

    return tasks.filter(t => {
      const taskDeadline = t.deadline;
      if (currentStartDate && taskDeadline < currentStartDate) return false;
      if (currentEndDate && taskDeadline > currentEndDate) return false;
      return true;
    });
  }, [tasks, currentStartDate, currentEndDate]);

  // Metrics derived from filtered data
  const totalRevenue = useMemo(() => {
    return filteredDeals
      .filter(d => d.stage === 'closed_won')
      .reduce((sum, d) => sum + d.amount, 0);
  }, [filteredDeals]);

  const activePipelineRevenue = useMemo(() => {
    return filteredDeals
      .filter(d => d.stage !== 'closed_won' && d.stage !== 'closed_lost')
      .reduce((sum, d) => sum + d.amount, 0);
  }, [filteredDeals]);

  const activeDealsCount = useMemo(() => {
    return filteredDeals.filter(d => d.stage !== 'closed_won' && d.stage !== 'closed_lost').length;
  }, [filteredDeals]);

  const overdueTasks = useMemo(() => {
    const now = new Date(TODAY_STR);
    return filteredTasks.filter(t => !t.completed && new Date(t.deadline) < now);
  }, [filteredTasks]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(val);
  };

  // Base monthly chart data with months detection
  const baseMonthlyData = useMemo(() => [
    { monthId: '2026-05', month: 'Май', revenue: 1450000, margin: 720000 },
    { monthId: '2026-06', month: 'Июн', revenue: 2100000, margin: 1050000 },
    { monthId: '2026-07', month: 'Июл', revenue: 2890000, margin: 1420000 },
    { monthId: '2026-08', month: 'Авг', revenue: 3450000, margin: 1680000 },
    { monthId: '2026-09', month: 'Сен', revenue: 4280000, margin: 2150000 },
  ], []);

  // Filter or highlight monthly bars according to current date range
  const { chartData, chartTotalRevenue, chartAvgMargin } = useMemo(() => {
    const isMonthInRange = (monthId: string) => {
      if (!currentStartDate && !currentEndDate) return true;
      const mStart = `${monthId}-01`;
      const mEnd = `${monthId}-31`;
      if (currentStartDate && mEnd < currentStartDate) return false;
      if (currentEndDate && mStart > currentEndDate) return false;
      return true;
    };

    const evaluated = baseMonthlyData.map(item => {
      const inRange = isMonthInRange(item.monthId);
      return {
        ...item,
        inRange
      };
    });

    const activeMonths = evaluated.filter(m => m.inRange);
    const totalRev = (activeMonths.length > 0 ? activeMonths : evaluated).reduce((sum, m) => sum + m.revenue, 0);
    const totalMargin = (activeMonths.length > 0 ? activeMonths : evaluated).reduce((sum, m) => sum + m.margin, 0);
    const avgMarginPct = totalRev > 0 ? Math.round((totalMargin / totalRev) * 100 * 10) / 10 : 49.8;

    return {
      chartData: evaluated,
      chartTotalRevenue: totalRev,
      chartAvgMargin: avgMarginPct
    };
  }, [baseMonthlyData, currentStartDate, currentEndDate]);

  const maxRevenue = Math.max(...baseMonthlyData.map(d => d.revenue));

  // Top active deals for summary data table (filtered by range)
  const activeDealsList = useMemo(() => {
    return filteredDeals
      .filter(d => d.stage !== 'closed_lost')
      .slice(0, 5);
  }, [filteredDeals]);

  const resetFilter = () => {
    setActivePreset('all');
    setIsPickerOpen(false);
  };

  const isFilterActive = activePreset !== 'all';

  return (
    <div className={`flex-1 overflow-y-auto p-6 lg:p-8 space-y-6 ${
      isLight ? 'bg-[#F8F7F4] text-[#1A1A1A]' : 'bg-[#121212] text-neutral-100'
    }`}>
      
      {/* Page Header with Integrated Global Date Range Picker */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="meta-label">СВОДКА АНАЛИТИКИ</div>
          <h1 className={`text-xl sm:text-2xl font-bold tracking-tight mt-1 ${isLight ? 'text-[#1A1A1A]' : 'text-white'}`}>
            SATORI CRM
          </h1>
          <p className="text-xs text-neutral-500 font-normal mt-0.5">
            Ключевые показатели воронки продаж, производства и задач на сегодня
          </p>
        </div>

        {/* Global Date Range Picker & Primary Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Global Date Range Picker Trigger & Popover */}
          <div className="relative" ref={pickerRef}>
            <button
              onClick={() => setIsPickerOpen(prev => !prev)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs border font-medium transition-all shadow-2xs ${
                isFilterActive
                  ? (isLight 
                      ? 'bg-white border-[#2563EB] text-[#2563EB] ring-1 ring-[#2563EB]/20' 
                      : 'bg-[#1E1E1E] border-[#2563EB] text-[#2563EB] ring-1 ring-[#2563EB]/30')
                  : (isLight 
                      ? 'bg-white hover:bg-neutral-50 border-black/[0.08] text-[#1A1A1A]' 
                      : 'bg-[#181818] hover:bg-[#202020] border-white/[0.08] text-neutral-200')
              }`}
              title="Выбрать период анализа"
            >
              <CalendarDays className={`w-3.5 h-3.5 ${isFilterActive ? 'text-[#2563EB]' : 'text-neutral-400'}`} />
              <div className="flex items-center gap-1.5 text-left">
                <span className="font-semibold">{activeRangeDisplay}</span>
              </div>
              <ChevronDown className="w-3 h-3 opacity-60 ml-0.5" />
            </button>

            {/* Date Range Popover Card */}
            {isPickerOpen && (
              <div className={`absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl shadow-2xl border p-4 z-50 animate-in fade-in zoom-in-95 duration-100 ${
                isLight ? 'bg-white border-black/[0.08] text-[#1A1A1A]' : 'bg-[#1A1A1A] border-white/[0.08] text-white'
              }`}>
                <div className="flex items-center justify-between pb-3 border-b border-black/[0.06] dark:border-white/[0.06]">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#2563EB]" />
                    <span className="meta-label">ПЕРИОД АНАЛИЗА</span>
                  </div>
                  <button 
                    onClick={() => setIsPickerOpen(false)}
                    className="text-neutral-400 hover:text-neutral-600 dark:hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Quick Presets List */}
                <div className="py-3 space-y-1">
                  <div className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider mb-1.5">
                    Быстрые периоды:
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {presets.map((p) => {
                      const isSelected = activePreset === p.id;
                      return (
                        <button
                          key={p.id}
                          onClick={() => {
                            setActivePreset(p.id);
                            setIsPickerOpen(false);
                          }}
                          className={`px-2.5 py-1.5 rounded-lg text-xs text-left flex items-center justify-between transition-colors border ${
                            isSelected
                              ? 'bg-[#2563EB] text-white border-[#2563EB] font-medium shadow-xs'
                              : isLight
                              ? 'bg-[#F8F7F4] hover:bg-neutral-100 border-black/[0.04] text-neutral-700'
                              : 'bg-[#222222] hover:bg-[#282828] border-white/[0.06] text-neutral-300'
                          }`}
                        >
                          <span className="truncate">{p.shortLabel}</span>
                          {isSelected && <Check className="w-3 h-3 shrink-0 ml-1" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom Date Range Inputs */}
                <div className="pt-3 border-t border-black/[0.06] dark:border-white/[0.06] space-y-2.5">
                  <div className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider">
                    Произвольный интервал:
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div>
                      <label className="text-[10px] text-neutral-500 block mb-1">С даты:</label>
                      <input
                        type="date"
                        value={customStart}
                        onChange={(e) => {
                          setCustomStart(e.target.value);
                          setActivePreset('custom');
                        }}
                        className={`w-full rounded-lg px-2.5 py-1.5 border text-xs focus:outline-none focus:ring-1 focus:ring-[#2563EB] ${
                          isLight 
                            ? 'bg-[#F8F7F4] border-black/[0.08] text-[#1A1A1A]' 
                            : 'bg-[#222222] border-white/[0.08] text-white'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-neutral-500 block mb-1">По дату:</label>
                      <input
                        type="date"
                        value={customEnd}
                        onChange={(e) => {
                          setCustomEnd(e.target.value);
                          setActivePreset('custom');
                        }}
                        className={`w-full rounded-lg px-2.5 py-1.5 border text-xs focus:outline-none focus:ring-1 focus:ring-[#2563EB] ${
                          isLight 
                            ? 'bg-[#F8F7F4] border-black/[0.08] text-[#1A1A1A]' 
                            : 'bg-[#222222] border-white/[0.08] text-white'
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {/* Popover Footer */}
                <div className="pt-3 mt-3 border-t border-black/[0.06] dark:border-white/[0.06] flex items-center justify-between">
                  <button
                    onClick={resetFilter}
                    className="text-xs font-mono text-neutral-500 hover:text-neutral-800 dark:hover:text-white flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Сбросить</span>
                  </button>
                  <button
                    onClick={() => {
                      setActivePreset('custom');
                      setIsPickerOpen(false);
                    }}
                    className="px-3.5 py-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-lg text-xs font-semibold shadow-2xs"
                  >
                    Применить
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Primary Action Button */}
          <button
            onClick={() => setIsCreateDealOpen(true)}
            className="px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Новая сделка</span>
          </button>
        </div>
      </div>

      {/* Quick Segmented Date Filter Bar & Active Filter Pill */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className={`p-1 rounded-xl border flex items-center gap-1 overflow-x-auto no-scrollbar ${
          isLight ? 'bg-white border-black/[0.08]' : 'bg-[#181818] border-white/[0.08]'
        }`}>
          <span className="meta-label px-2 text-[10px] hidden sm:inline">ПЕРИОД:</span>
          {[
            { id: 'all' as DateRangePreset, label: 'Всё время' },
            { id: 'today' as DateRangePreset, label: 'Сегодня' },
            { id: 'week' as DateRangePreset, label: '7 дней' },
            { id: 'month' as DateRangePreset, label: 'Сентябрь' },
            { id: 'q3' as DateRangePreset, label: '3 кв. (Q3)' },
            { id: 'year' as DateRangePreset, label: '2026 год' },
          ].map(p => {
            const isSelected = activePreset === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setActivePreset(p.id)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  isSelected
                    ? 'bg-[#2563EB] text-white shadow-2xs font-semibold'
                    : isLight
                    ? 'text-neutral-600 hover:text-[#1A1A1A] hover:bg-black/[0.03]'
                    : 'text-neutral-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>

        {/* Active Filter Dismissible Chip */}
        {isFilterActive && (
          <div className={`px-3 py-1 rounded-lg border text-xs flex items-center gap-2 ${
            isLight ? 'bg-blue-50/70 border-blue-200 text-[#2563EB]' : 'bg-blue-950/40 border-blue-800 text-blue-300'
          }`}>
            <span className="font-mono font-medium text-[11px]">{activeRangeDisplay}</span>
            <button
              onClick={resetFilter}
              className="hover:opacity-75 transition-opacity"
              title="Сбросить фильтр по дате"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* 4 Quiet Stat Metrics (Dynamically Filtered by Date Range) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={`p-5 rounded-xl border transition-all ${
          isLight ? 'bg-white border-black/[0.08] shadow-2xs' : 'bg-[#181818] border-white/[0.08]'
        }`}>
          <div className="flex items-center justify-between">
            <span className="meta-label">СДЕЛКИ В РАБОТЕ</span>
            <Briefcase className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-semibold font-mono tabular-nums tracking-tight text-[#1A1A1A] dark:text-white mt-2">
            {formatCurrency(activePipelineRevenue)}
          </div>
          <div className="text-xs font-normal text-neutral-500 mt-1.5 flex items-center gap-1">
            <span className="font-semibold text-neutral-700 dark:text-neutral-300 font-mono">{activeDealsCount}</span> активных проектов {isFilterActive && 'в периоде'}
          </div>
        </div>

        <div className={`p-5 rounded-xl border transition-all ${
          isLight ? 'bg-white border-black/[0.08] shadow-2xs' : 'bg-[#181818] border-white/[0.08]'
        }`}>
          <div className="flex items-center justify-between">
            <span className="meta-label">ВЫРУЧКА ЗАКРЫТЫХ</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-semibold font-mono tabular-nums tracking-tight text-emerald-600 dark:text-emerald-400 mt-2">
            {formatCurrency(totalRevenue)}
          </div>
          <div className="text-xs font-normal text-neutral-500 mt-1.5">
            {totalRevenue > 0 ? 'Успешно завершенные договоры' : 'Нет закрытых договоров в периоде'}
          </div>
        </div>

        <div className={`p-5 rounded-xl border transition-all ${
          isLight ? 'bg-white border-black/[0.08] shadow-2xs' : 'bg-[#181818] border-white/[0.08]'
        }`}>
          <div className="flex items-center justify-between">
            <span className="meta-label">БАЗА КЛИЕНТОВ</span>
            <Users className="w-4 h-4 text-[#2563EB]" />
          </div>
          <div className="text-2xl sm:text-3xl font-semibold font-mono tabular-nums tracking-tight text-[#1A1A1A] dark:text-white mt-2">
            {isFilterActive ? filteredClients.length : clients.length}
          </div>
          <div className="text-xs font-normal text-neutral-500 mt-1.5">
            {isFilterActive ? 'Клиентов с обращениями в периоде' : 'Дизайнеры, студии, заказчики'}
          </div>
        </div>

        <div className={`p-5 rounded-xl border transition-all ${
          overdueTasks.length > 0
            ? (isLight ? 'bg-rose-50/60 border-rose-200 text-rose-950' : 'bg-rose-950/20 border-rose-900/50 text-rose-200')
            : (isLight ? 'bg-white border-black/[0.08] shadow-2xs' : 'bg-[#181818] border-white/[0.08]')
        }`}>
          <div className="flex items-center justify-between">
            <span className={`meta-label ${overdueTasks.length > 0 ? 'text-rose-700 dark:text-rose-400' : ''}`}>
              ПРОСРОЧЕНО ЗАДАЧ
            </span>
            {overdueTasks.length > 0 ? (
              <AlertTriangle className="w-4 h-4 text-rose-500" />
            ) : (
              <Clock className="w-4 h-4 text-neutral-400" />
            )}
          </div>
          <div className={`text-2xl sm:text-3xl font-semibold font-mono tabular-nums tracking-tight mt-2 ${
            overdueTasks.length > 0 ? 'text-rose-700 dark:text-rose-400' : 'text-[#1A1A1A] dark:text-white'
          }`}>
            {overdueTasks.length}
          </div>
          <div className={`text-xs font-normal mt-1.5 ${overdueTasks.length > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-neutral-500'}`}>
            {overdueTasks.length > 0 ? 'Требуют оперативного внимания' : 'Все задачи в графике'}
          </div>
        </div>
      </div>

      {/* Main Grid: Attention items + Dynamics Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Urgent Attention (3 cols) */}
        <div className={`lg:col-span-3 p-5 rounded-xl border flex flex-col justify-between ${
          isLight ? 'bg-white border-black/[0.08] shadow-2xs' : 'bg-[#181818] border-white/[0.08]'
        }`}>
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-black/[0.06] dark:border-white/[0.06] mb-3">
              <span className="meta-label flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-rose-500" />
                ОПЕРАТИВНЫЕ УВЕДОМЛЕНИЯ
              </span>
              <span className="text-xs font-mono text-neutral-400">
                {notifications.filter(n => !n.read).length} новых
              </span>
            </div>

            <div className="space-y-2">
              {notifications.slice(0, 4).map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    if (item.clientId) openClientCockpit(item.clientId);
                  }}
                  className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between gap-3 ${
                    isLight 
                      ? 'bg-[#F8F7F4]/80 hover:bg-[#F2F2F2] border-black/[0.04]' 
                      : 'bg-[#222222] hover:bg-[#282828] border-white/[0.04]'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="text-xs font-medium text-[#1A1A1A] dark:text-white truncate">
                      {item.title}
                    </div>
                    <div className="text-xs font-normal text-neutral-500 truncate mt-0.5">
                      {item.description}
                    </div>
                  </div>

                  <ChevronRight className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-black/[0.06] dark:border-white/[0.06] text-right">
            <button
              onClick={() => setCurrentTab('tasks')}
              className="text-xs text-[#2563EB] hover:underline font-normal inline-flex items-center gap-1"
            >
              <span>Все задачи и дедлайны</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Revenue dynamics Chart (2 cols - Reacts to Date Range) */}
        <div className={`lg:col-span-2 p-5 rounded-xl border flex flex-col justify-between ${
          isLight ? 'bg-white border-black/[0.08] shadow-2xs' : 'bg-[#181818] border-white/[0.08]'
        }`}>
          <div className="pb-3 border-b border-black/[0.06] dark:border-white/[0.06]">
            <div className="flex items-center justify-between">
              <div className="meta-label">ДИНАМИКА ВЫРУЧКИ</div>
              <span className="text-[10px] font-mono text-neutral-400">
                {activePreset === 'all' ? 'Все месяцы' : activeRangeDisplay}
              </span>
            </div>
            <div className="text-xs font-normal text-neutral-500 mt-1">
              Выручка в фокусе: <span className="font-mono font-medium text-[#1A1A1A] dark:text-white">{formatCurrency(chartTotalRevenue)}</span>
            </div>
          </div>

          {/* Interactive Chart Bars */}
          <div className="h-40 flex items-end justify-between gap-3 pt-4">
            {chartData.map((item, idx) => {
              const heightPct = Math.round((item.revenue / maxRevenue) * 100);
              const inFocus = item.inRange;

              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                  <div
                    className={`w-full rounded-t transition-all cursor-pointer ${
                      inFocus
                        ? 'bg-[#2563EB] group-hover:bg-[#1D4ED8]'
                        : 'bg-neutral-300/60 dark:bg-neutral-700/50 opacity-40 group-hover:opacity-70'
                    }`}
                    style={{ height: `${heightPct}%` }}
                    title={`${item.month}: ${formatCurrency(item.revenue)} (маржа: ${formatCurrency(item.margin)}) ${!inFocus ? '— вне выбранного периода' : ''}`}
                  />
                  <span className={`text-[11px] font-mono font-normal transition-colors ${
                    inFocus ? 'text-neutral-700 dark:text-neutral-300 font-semibold' : 'text-neutral-400 opacity-60'
                  }`}>
                    {item.month}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="pt-3 mt-3 border-t border-black/[0.06] dark:border-white/[0.06] flex items-center justify-between text-xs text-neutral-500">
            <span>Рентабельность периода</span>
            <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">{chartAvgMargin}%</span>
          </div>
        </div>

      </div>

      {/* Summary Data Table: Active Deals (Filtered by Selected Date Range) */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between pb-1">
          <div>
            <div className="meta-label">ТЕКУЩИЕ ПРОЕКТЫ</div>
            <div className="flex items-center gap-2 mt-0.5">
              <h2 className="text-sm font-semibold text-[#1A1A1A] dark:text-white">
                Активные сделки в работе
              </h2>
              <span className="text-[11px] font-mono text-neutral-400 bg-black/[0.04] dark:bg-white/[0.06] px-2 py-0.5 rounded">
                Найдено: {activeDealsList.length}
              </span>
            </div>
          </div>
          <button
            onClick={() => setCurrentTab('deals')}
            className="text-xs font-medium text-[#2563EB] hover:underline inline-flex items-center gap-1 transition-colors"
          >
            <span>Вся воронка сделок</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {activeDealsList.length === 0 ? (
          <div className={`p-8 rounded-xl border text-center text-xs space-y-2 ${
            isLight ? 'bg-white border-black/[0.08]' : 'bg-[#181818] border-white/[0.08]'
          }`}>
            <p className="font-medium text-[#1A1A1A] dark:text-white">
              За период «{activeRangeDisplay}» сделок не найдено
            </p>
            <p className="text-neutral-400">
              Попробуйте расширить временной диапазон или выбрать другой период.
            </p>
            <button
              onClick={resetFilter}
              className="mt-2 px-3 py-1.5 bg-[#2563EB] text-white rounded-lg text-xs font-medium"
            >
              Сбросить фильтр по дате
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-separate border-spacing-y-2">
              <thead>
                <tr className="text-neutral-400">
                  <th className="py-1 px-4 font-mono uppercase text-[10px] tracking-[0.1em]">Проект</th>
                  <th className="py-1 px-4 font-mono uppercase text-[10px] tracking-[0.1em]">Заказчик</th>
                  <th className="py-1 px-4 font-mono uppercase text-[10px] tracking-[0.1em]">Статус этапа</th>
                  <th className="py-1 px-4 font-mono uppercase text-[10px] tracking-[0.1em]">Срок сдачи</th>
                  <th className="py-1 px-4 font-mono uppercase text-[10px] tracking-[0.1em] text-right">Сумма</th>
                  <th className="py-1 px-4 font-mono uppercase text-[10px] tracking-[0.1em] text-right">Маржа</th>
                </tr>
              </thead>
              <tbody>
                {activeDealsList.map((deal) => (
                  <tr
                    key={deal.id}
                    onClick={() => openClientCockpit(deal.clientId)}
                    className={`transition-colors cursor-pointer group ${
                      isLight 
                        ? 'bg-white hover:bg-neutral-50 text-[#1A1A1A]' 
                        : 'bg-[#181818] hover:bg-[#202020] text-neutral-200'
                    }`}
                  >
                    <td className="py-3 px-4 rounded-l-lg font-normal">
                      <span className="group-hover:text-[#2563EB] transition-colors font-medium">
                        {deal.title}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-normal text-neutral-500">
                      {deal.clientName}
                    </td>

                    <td className="py-3 px-4 font-normal">
                      <span className="text-xs font-normal text-neutral-600 dark:text-neutral-300">
                        {DEAL_STAGES.find(s => s.id === deal.stage)?.title || deal.stage}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-mono tabular-nums font-normal text-neutral-500">
                      {new Date(deal.deadline).toLocaleDateString('ru-RU')}
                    </td>

                    <td className="py-3 px-4 text-right font-mono tabular-nums font-normal text-[#1A1A1A] dark:text-neutral-100">
                      {formatCurrency(deal.amount)}
                    </td>

                    <td className="py-3 px-4 rounded-r-lg text-right font-mono tabular-nums font-normal text-emerald-600 dark:text-emerald-400">
                      +{formatCurrency(deal.margin)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
