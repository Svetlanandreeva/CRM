import React, { useState } from 'react';
import {
  Search,
  Calendar,
  User,
  AlertCircle,
  X,
  Filter,
  ChevronDown,
  RotateCcw
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';

export interface FilterDateRange {
  preset: 'all' | 'today' | '7days' | '30days' | 'quarter' | 'custom';
  startDate?: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD
}

interface PersistentFilterHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  searchPlaceholder?: string;

  // Date Range
  dateRange: FilterDateRange;
  onDateRangeChange: (range: FilterDateRange) => void;

  // Owner / Manager
  selectedOwner: string;
  onOwnerChange: (owner: string) => void;
  ownersList: string[];

  // Priority (optional)
  selectedPriority?: string;
  onPriorityChange?: (priority: string) => void;
  priorities?: { id: string; label: string; color?: string }[];

  // Extra filter slot (e.g. status dropdown, type dropdown)
  extraFilters?: React.ReactNode;

  // Counts
  totalCount: number;
  filteredCount: number;
  onReset: () => void;
  hasActiveFilters: boolean;
}

export const PersistentFilterHeader: React.FC<PersistentFilterHeaderProps> = ({
  searchQuery,
  onSearchChange,
  searchPlaceholder = 'Быстрый поиск...',
  dateRange,
  onDateRangeChange,
  selectedOwner,
  onOwnerChange,
  ownersList,
  selectedPriority,
  onPriorityChange,
  priorities,
  extraFilters,
  totalCount,
  filteredCount,
  onReset,
  hasActiveFilters
}) => {
  const { theme } = useCrm();
  const isLight = theme === 'light';

  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  const datePresets = [
    { id: 'all', label: 'Все время' },
    { id: 'today', label: 'Сегодня' },
    { id: '7days', label: '7 дней' },
    { id: '30days', label: '30 дней' },
    { id: 'quarter', label: 'Квартал' },
    { id: 'custom', label: 'Выбрать даты...' },
  ];

  const getDateLabel = () => {
    switch (dateRange.preset) {
      case 'today': return 'Сегодня';
      case '7days': return 'За 7 дней';
      case '30days': return 'За 30 дней';
      case 'quarter': return 'За квартал';
      case 'custom':
        if (dateRange.startDate && dateRange.endDate) {
          return `${dateRange.startDate} – ${dateRange.endDate}`;
        }
        return 'Диапазон дат';
      default:
        return 'Все даты';
    }
  };

  return (
    <div className={`px-6 py-2.5 border-b flex flex-col gap-2.5 shrink-0 transition-colors ${
      isLight ? 'bg-white/80 border-black/[0.08]' : 'bg-[#161616]/90 border-white/[0.08]'
    }`}>
      {/* Main Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Left: Search & Filter Pickers */}
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[320px]">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className={`w-full rounded-lg pl-8 pr-7 py-1.5 text-xs border focus:outline-none focus:ring-1 focus:ring-[#2563EB] transition-all ${
                isLight
                  ? 'bg-[#F8F7F4] border-black/[0.08] text-[#1A1A1A] placeholder-neutral-400 focus:bg-white'
                  : 'bg-[#202020] border-white/[0.08] text-white placeholder-neutral-500 focus:bg-[#252525]'
              }`}
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Date Range Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
              className={`px-2.5 py-1.5 rounded-lg border font-medium flex items-center gap-1.5 transition-colors ${
                dateRange.preset !== 'all'
                  ? 'bg-blue-50 border-blue-200 text-[#2563EB] dark:bg-blue-950/40 dark:border-blue-900/60 dark:text-blue-300'
                  : isLight
                  ? 'bg-white border-black/[0.08] text-neutral-700 hover:bg-neutral-50'
                  : 'bg-[#202020] border-white/[0.08] text-neutral-300 hover:bg-[#252525]'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>{getDateLabel()}</span>
              <ChevronDown className="w-3 h-3 text-neutral-400" />
            </button>

            {isDatePickerOpen && (
              <div className={`absolute top-full left-0 mt-1 z-50 w-64 p-3 rounded-xl border shadow-xl ${
                isLight ? 'bg-white border-black/[0.08] text-[#1A1A1A]' : 'bg-[#1C1C1C] border-white/[0.1] text-white'
              }`}>
                <div className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider mb-2">
                  Период времени
                </div>
                <div className="grid grid-cols-2 gap-1.5 mb-3">
                  {datePresets.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        onDateRangeChange({
                          ...dateRange,
                          preset: p.id as any,
                        });
                        if (p.id !== 'custom') setIsDatePickerOpen(false);
                      }}
                      className={`px-2 py-1 rounded-md text-[11px] font-medium text-left transition-colors ${
                        dateRange.preset === p.id
                          ? 'bg-[#2563EB] text-white'
                          : isLight
                          ? 'hover:bg-neutral-100 text-neutral-700'
                          : 'hover:bg-neutral-800 text-neutral-300'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                {dateRange.preset === 'custom' && (
                  <div className="pt-2 border-t border-black/[0.06] dark:border-white/[0.06] space-y-2">
                    <div>
                      <span className="text-[10px] text-neutral-400 block mb-0.5">От:</span>
                      <input
                        type="date"
                        value={dateRange.startDate || ''}
                        onChange={(e) =>
                          onDateRangeChange({ ...dateRange, startDate: e.target.value })
                        }
                        className={`w-full rounded-lg px-2 py-1 text-xs border ${
                          isLight ? 'bg-[#F8F7F4] border-black/[0.08]' : 'bg-[#252525] border-white/[0.08]'
                        }`}
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-neutral-400 block mb-0.5">До:</span>
                      <input
                        type="date"
                        value={dateRange.endDate || ''}
                        onChange={(e) =>
                          onDateRangeChange({ ...dateRange, endDate: e.target.value })
                        }
                        className={`w-full rounded-lg px-2 py-1 text-xs border ${
                          isLight ? 'bg-[#F8F7F4] border-black/[0.08]' : 'bg-[#252525] border-white/[0.08]'
                        }`}
                      />
                    </div>
                    <button
                      onClick={() => setIsDatePickerOpen(false)}
                      className="w-full mt-1 py-1 bg-[#2563EB] text-white rounded-lg text-xs font-semibold"
                    >
                      Применить
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Owner / Manager Filter */}
          <div className="flex items-center gap-1.5">
            <div className="relative">
              <select
                value={selectedOwner}
                onChange={(e) => onOwnerChange(e.target.value)}
                className={`text-xs rounded-lg pl-7 pr-3 py-1.5 border font-medium focus:outline-none focus:ring-1 focus:ring-[#2563EB] cursor-pointer ${
                  selectedOwner !== 'all'
                    ? 'bg-blue-50 border-blue-200 text-[#2563EB] dark:bg-blue-950/40 dark:border-blue-900/60 dark:text-blue-300'
                    : isLight
                    ? 'bg-white border-black/[0.08] text-neutral-700'
                    : 'bg-[#202020] border-white/[0.08] text-neutral-300'
                }`}
              >
                <option value="all">Все менеджеры</option>
                {ownersList.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              <User className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
            </div>
          </div>

          {/* Priority Filter (if provided) */}
          {priorities && onPriorityChange && (
            <div className="flex items-center gap-1.5">
              <div className="relative">
                <select
                  value={selectedPriority || 'all'}
                  onChange={(e) => onPriorityChange(e.target.value)}
                  className={`text-xs rounded-lg pl-7 pr-3 py-1.5 border font-medium focus:outline-none focus:ring-1 focus:ring-[#2563EB] cursor-pointer ${
                    selectedPriority && selectedPriority !== 'all'
                      ? 'bg-blue-50 border-blue-200 text-[#2563EB] dark:bg-blue-950/40 dark:border-blue-900/60 dark:text-blue-300'
                      : isLight
                      ? 'bg-white border-black/[0.08] text-neutral-700'
                      : 'bg-[#202020] border-white/[0.08] text-neutral-300'
                  }`}
                >
                  <option value="all">Все приоритеты</option>
                  {priorities.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </select>
                <AlertCircle className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
              </div>
            </div>
          )}

          {/* Extra View-Specific Filters (e.g. Status, Document Type) */}
          {extraFilters}
        </div>

        {/* Right: Results Count & Quick Reset */}
        <div className="flex items-center gap-3 font-mono text-[11px]">
          <div className="text-neutral-500">
            Найдено: <strong className="text-[#1A1A1A] dark:text-white">{filteredCount}</strong>
            {filteredCount !== totalCount && (
              <span className="text-neutral-400 font-normal"> из {totalCount}</span>
            )}
          </div>

          {hasActiveFilters && (
            <button
              onClick={onReset}
              className="text-[#2563EB] hover:text-[#1D4ED8] flex items-center gap-1 font-semibold transition-colors"
              title="Сбросить все фильтры"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Сбросить</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
