import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  ArrowUpRight,
  Trash2,
  CheckCircle2,
  X,
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { ClientStatus } from '../../types/crm';
import { PersistentFilterHeader, FilterDateRange } from '../common/PersistentFilterHeader';
import { BulkOperationProgress, BulkProgressState } from '../common/BulkOperationProgress';

export const ClientsListView: React.FC = () => {
  const {
    clients,
    managers,
    openClientCockpit,
    setIsCreateClientOpen,
    bulkDeleteClients,
    bulkUpdateClientsStatus,
    bulkReassignClients,
    theme
  } = useCrm();

  const isLight = theme === 'light';

  // Persistent filter state with fallback to localStorage
  const [searchQuery, setSearchQuery] = useState(() => {
    return localStorage.getItem('crm_client_search') || '';
  });
  const [selectedOwner, setSelectedOwner] = useState(() => {
    return localStorage.getItem('crm_client_owner') || 'all';
  });
  const [selectedPriority, setSelectedPriority] = useState(() => {
    return localStorage.getItem('crm_client_priority') || 'all';
  });
  const [dateRange, setDateRange] = useState<FilterDateRange>(() => {
    const saved = localStorage.getItem('crm_client_daterange');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return { preset: 'all' };
  });

  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Save persistent state
  useEffect(() => {
    localStorage.setItem('crm_client_search', searchQuery);
  }, [searchQuery]);
  useEffect(() => {
    localStorage.setItem('crm_client_owner', selectedOwner);
  }, [selectedOwner]);
  useEffect(() => {
    localStorage.setItem('crm_client_priority', selectedPriority);
  }, [selectedPriority]);
  useEffect(() => {
    localStorage.setItem('crm_client_daterange', JSON.stringify(dateRange));
  }, [dateRange]);

  // Bulk selection and progress states
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [bulkProgress, setBulkProgress] = useState<BulkProgressState | null>(null);

  useEffect(() => {
    if (toastMessage) {
      const t = setTimeout(() => setToastMessage(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toastMessage]);

  const managersList = useMemo(() => {
    return Array.from(new Set([
      ...clients.map(c => c.assignedManager).filter(Boolean),
      ...managers.map(m => m.name)
    ]));
  }, [clients, managers]);

  // Filter logic
  const isWithinDateRange = (dateStr: string | undefined, range: FilterDateRange): boolean => {
    if (range.preset === 'all' || !dateStr) return true;
    const itemTime = new Date(dateStr).getTime();
    const now = new Date('2026-09-25T00:09:00Z').getTime();

    switch (range.preset) {
      case 'today': {
        const todayStart = new Date('2026-09-25T00:00:00Z').getTime();
        return itemTime >= todayStart;
      }
      case '7days': {
        return itemTime >= now - 7 * 24 * 60 * 60 * 1000;
      }
      case '30days': {
        return itemTime >= now - 30 * 24 * 60 * 60 * 1000;
      }
      case 'quarter': {
        return itemTime >= now - 90 * 24 * 60 * 60 * 1000;
      }
      case 'custom': {
        if (range.startDate) {
          const s = new Date(range.startDate).getTime();
          if (itemTime < s) return false;
        }
        if (range.endDate) {
          const e = new Date(range.endDate).getTime() + 24 * 60 * 60 * 1000;
          if (itemTime > e) return false;
        }
        return true;
      }
      default:
        return true;
    }
  };

  const filteredClients = useMemo(() => {
    return clients.filter((c) => {
      // 1. Text Search
      const matchesSearch = !searchQuery ||
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.company && c.company.toLowerCase().includes(searchQuery.toLowerCase())) ||
        c.phone.includes(searchQuery) ||
        c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));

      // 2. Owner / Manager
      const matchesOwner = selectedOwner === 'all' || c.assignedManager === selectedOwner;

      // 3. Priority / Tier
      let matchesPriority = true;
      if (selectedPriority === 'vip') matchesPriority = c.status === 'VIP' || c.totalLTV > 800000;
      else if (selectedPriority === 'active') matchesPriority = c.status === 'Активный';
      else if (selectedPriority === 'potential') matchesPriority = c.status === 'Потенциальный' || c.status === 'Лид';

      // 4. Status
      const matchesStatus = selectedStatus === 'all' || c.status === selectedStatus;

      // 5. Date Range (checked against lastContactAt or createdAt)
      const matchesDate = isWithinDateRange(c.lastContactAt || c.createdAt, dateRange);

      return matchesSearch && matchesOwner && matchesPriority && matchesStatus && matchesDate;
    });
  }, [clients, searchQuery, selectedOwner, selectedPriority, selectedStatus, dateRange]);

  const hasActiveFilters = Boolean(
    searchQuery ||
    selectedOwner !== 'all' ||
    selectedPriority !== 'all' ||
    selectedStatus !== 'all' ||
    dateRange.preset !== 'all'
  );

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedOwner('all');
    setSelectedPriority('all');
    setSelectedStatus('all');
    setDateRange({ preset: 'all' });
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(val);
  };

  // Selection handlers
  const isAllSelected = filteredClients.length > 0 && filteredClients.every(c => selectedIds.includes(c.id));
  const isPartiallySelected = selectedIds.length > 0 && !isAllSelected;

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      const filteredIdSet = new Set(filteredClients.map(c => c.id));
      setSelectedIds(prev => prev.filter(id => !filteredIdSet.has(id)));
    } else {
      const newIds = new Set([...selectedIds, ...filteredClients.map(c => c.id)]);
      setSelectedIds(Array.from(newIds));
    }
  };

  const handleToggleSelectRow = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleClearSelection = () => {
    setSelectedIds([]);
  };

  // Simulated Async Operation with Visual Progress
  const runWithProgress = async (label: string, operation: () => void) => {
    const total = selectedIds.length;
    setBulkProgress({ current: 0, total, label });

    for (let i = 1; i <= total; i++) {
      await new Promise(r => setTimeout(r, 60));
      setBulkProgress({ current: i, total, label });
    }

    setBulkProgress({ current: total, total, label, isComplete: true });
    operation();

    setTimeout(() => {
      setBulkProgress(null);
      setSelectedIds([]);
    }, 500);
  };

  // Bulk operations
  const handleBulkStatusChange = (status: ClientStatus) => {
    if (selectedIds.length === 0) return;
    runWithProgress(`Обновление статуса: «${status}»`, () => {
      bulkUpdateClientsStatus(selectedIds, status);
      setToastMessage(`Статус изменен для ${selectedIds.length} клиентов`);
    });
  };

  const handleBulkManagerChange = (managerName: string) => {
    if (selectedIds.length === 0 || !managerName) return;
    runWithProgress(`Назначение менеджера: ${managerName}`, () => {
      bulkReassignClients(selectedIds, managerName);
      setToastMessage(`Менеджер «${managerName}» назначен для ${selectedIds.length} клиентов`);
    });
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    if (window.confirm(`Вы уверены, что хотите удалить выбранных клиентов (${selectedIds.length} шт.)?`)) {
      runWithProgress(`Удаление ${selectedIds.length} клиентов...`, () => {
        bulkDeleteClients(selectedIds);
        setToastMessage(`Удалено клиентов: ${selectedIds.length}`);
      });
    }
  };

  return (
    <div className={`flex-1 flex flex-col min-h-0 overflow-hidden relative ${
      isLight ? 'bg-[#F8F7F4] text-[#1A1A1A]' : 'bg-[#121212] text-neutral-100'
    }`}>
      {/* Visual Progress Bar during bulk operations */}
      <BulkOperationProgress progress={bulkProgress} />

      {/* Toast Alert */}
      {toastMessage && (
        <div className="absolute top-4 right-6 z-50 animate-in fade-in slide-in-from-top-3 duration-200">
          <div className={`px-4 py-2.5 rounded-xl border text-xs shadow-xl flex items-center gap-2.5 ${
            isLight ? 'bg-white border-black/[0.08] text-[#1A1A1A]' : 'bg-[#1E1E1E] border-white/[0.08] text-white'
          }`}>
            <CheckCircle2 className="w-4 h-4 text-[#2563EB] shrink-0" />
            <span className="font-medium">{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className={`px-6 py-4 border-b flex items-center justify-between shrink-0 ${
        isLight ? 'bg-white border-black/[0.08]' : 'bg-[#161616] border-white/[0.08]'
      }`}>
        <div>
          <div className="meta-label">Реестр заказчиков</div>
          <h1 className="text-base font-semibold tracking-tight mt-0.5">
            База клиентов ({clients.length})
          </h1>
        </div>

        <button
          onClick={() => setIsCreateClientOpen(true)}
          className="px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Добавить клиента</span>
        </button>
      </div>

      {/* Unified Persistent Filter Header */}
      <PersistentFilterHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Поиск по имени, компании, телефону..."
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        selectedOwner={selectedOwner}
        onOwnerChange={setSelectedOwner}
        ownersList={managersList}
        selectedPriority={selectedPriority}
        onPriorityChange={setSelectedPriority}
        priorities={[
          { id: 'vip', label: 'VIP / Высокий приоритет' },
          { id: 'active', label: 'Активные клиенты' },
          { id: 'potential', label: 'Лиды / Потенциальные' },
        ]}
        extraFilters={
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className={`border rounded-lg px-2.5 py-1.5 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#2563EB] ${
              selectedStatus !== 'all'
                ? 'bg-blue-50 border-blue-200 text-[#2563EB] dark:bg-blue-950/40 dark:border-blue-900/60 dark:text-blue-300'
                : isLight
                ? 'bg-white text-neutral-700 border-black/[0.08]'
                : 'bg-[#202020] text-neutral-300 border-white/[0.08]'
            }`}
          >
            <option value="all">Все статусы</option>
            <option value="VIP">VIP</option>
            <option value="Активный">Активный</option>
            <option value="Потенциальный">Потенциальный</option>
            <option value="Лид">Лид</option>
            <option value="В архиве">В архиве</option>
          </select>
        }
        totalCount={clients.length}
        filteredCount={filteredClients.length}
        onReset={handleResetFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Minimalist Table with Checkboxes */}
      <div className="flex-1 overflow-y-auto p-6 pb-24">
        {filteredClients.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center text-neutral-400 text-xs font-normal space-y-2">
            <div>Клиенты по заданным фильтрам не найдены</div>
            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="text-[#2563EB] font-medium hover:underline text-xs"
              >
                Сбросить примененные фильтры
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-separate border-spacing-y-2">
              <thead>
                <tr className="text-neutral-400">
                  <th className="py-1 px-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      ref={input => {
                        if (input) input.indeterminate = isPartiallySelected;
                      }}
                      onChange={handleToggleSelectAll}
                      className="rounded text-[#2563EB] focus:ring-[#2563EB] w-3.5 h-3.5 accent-[#2563EB] cursor-pointer"
                      title="Выбрать всех клиентов"
                    />
                  </th>
                  <th className="py-1 px-4 font-mono uppercase text-[10px] tracking-[0.1em]">Клиент</th>
                  <th className="py-1 px-4 font-mono uppercase text-[10px] tracking-[0.1em]">Телефон / Почта</th>
                  <th className="py-1 px-4 font-mono uppercase text-[10px] tracking-[0.1em]">Статус</th>
                  <th className="py-1 px-4 font-mono uppercase text-[10px] tracking-[0.1em]">Менеджер</th>
                  <th className="py-1 px-4 font-mono uppercase text-[10px] tracking-[0.1em] text-right">Общий LTV</th>
                  <th className="py-1 px-4 font-mono uppercase text-[10px] tracking-[0.1em] text-right">Задолженность</th>
                  <th className="py-1 px-4 font-mono uppercase text-[10px] tracking-[0.1em] text-center">Карточка</th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.map((c) => {
                  const isSelected = selectedIds.includes(c.id);

                  return (
                    <tr
                      key={c.id}
                      onClick={() => openClientCockpit(c.id)}
                      className={`transition-colors cursor-pointer group ${
                        isSelected
                          ? (isLight ? 'bg-blue-50/70 border-l-4 border-l-[#2563EB]' : 'bg-blue-950/30 border-l-4 border-l-[#2563EB]')
                          : (isLight 
                              ? 'bg-white hover:bg-neutral-50 text-[#1A1A1A]' 
                              : 'bg-[#181818] hover:bg-[#202020] text-neutral-200')
                      }`}
                    >
                      {/* Checkbox column */}
                      <td 
                        className="py-3 px-3 text-center rounded-l-lg"
                        onClick={(e) => handleToggleSelectRow(c.id, e)}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="rounded text-[#2563EB] focus:ring-[#2563EB] w-3.5 h-3.5 accent-[#2563EB] cursor-pointer"
                        />
                      </td>

                      <td className="py-3 px-4 font-normal">
                        <div className="text-[#1A1A1A] dark:text-white group-hover:text-[#2563EB] transition-colors font-medium">
                          {c.name}
                        </div>
                        {c.company && (
                          <div className="text-[11px] font-normal text-neutral-400 dark:text-neutral-500 mt-0.5">{c.company}</div>
                        )}
                      </td>

                      <td className="py-3 px-4 font-mono tabular-nums text-xs font-normal text-neutral-500">
                        <div>{c.phone}</div>
                        <div className="text-neutral-400 text-[11px] font-normal mt-0.5 truncate max-w-[160px]">{c.email}</div>
                      </td>

                      <td className="py-3 px-4 font-normal">
                        <span className={`text-[11px] px-2 py-0.5 rounded font-mono font-medium ${
                          c.status === 'VIP' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300' :
                          c.status === 'Активный' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300' :
                          c.status === 'Потенциальный' ? 'bg-sky-100 text-sky-800 dark:bg-sky-950/40 dark:text-sky-300' :
                          'bg-black/[0.05] text-neutral-600 dark:bg-white/[0.06] dark:text-neutral-300'
                        }`}>
                          {c.status}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-neutral-500 font-normal">
                        {c.assignedManager}
                      </td>

                      <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-xs text-[#1A1A1A] dark:text-neutral-100">
                        {formatCurrency(c.totalLTV)}
                      </td>

                      <td className={`py-3 px-4 text-right font-mono tabular-nums font-semibold text-xs ${
                        c.currentDebt > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-neutral-400'
                      }`}>
                        {c.currentDebt > 0 ? formatCurrency(c.currentDebt) : '—'}
                      </td>

                      <td className="py-3 px-4 rounded-r-lg text-center">
                        <span className="text-[#2563EB] group-hover:underline inline-flex items-center gap-1 font-medium text-xs font-mono">
                          ОТКРЫТЬ
                          <ArrowUpRight className="w-3 h-3" />
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ================= FLOATING BULK ACTION BAR ================= */}
      {selectedIds.length > 0 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className={`px-5 py-3 rounded-2xl border shadow-2xl flex items-center gap-3 text-xs ${
            isLight ? 'bg-white border-black/[0.1] text-[#1A1A1A]' : 'bg-[#1C1C1C] border-white/[0.1] text-white'
          }`}>
            {/* Selection badge */}
            <div className="flex items-center gap-2 pr-3 border-r border-black/[0.08] dark:border-white/[0.08]">
              <span className="w-2 h-2 rounded-full bg-[#2563EB]" />
              <span className="font-semibold font-mono">Выбрано: {selectedIds.length}</span>
              <button
                onClick={handleClearSelection}
                className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-white"
                title="Снять выбор"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Action 1: Status Change */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-neutral-400 font-mono hidden sm:inline">Статус:</span>
              <select
                defaultValue=""
                onChange={(e) => {
                  if (e.target.value) {
                    handleBulkStatusChange(e.target.value as ClientStatus);
                    e.target.value = '';
                  }
                }}
                className={`text-xs rounded-lg px-2.5 py-1.5 border font-medium focus:outline-none focus:ring-1 focus:ring-[#2563EB] cursor-pointer ${
                  isLight ? 'bg-[#F8F7F4] border-black/[0.08] text-[#1A1A1A]' : 'bg-[#252525] border-white/[0.08] text-white'
                }`}
              >
                <option value="" disabled>Изменить статус...</option>
                <option value="VIP">VIP</option>
                <option value="Активный">Активный</option>
                <option value="Потенциальный">Потенциальный</option>
                <option value="Лид">Лид</option>
                <option value="В архиве">В архиве</option>
              </select>
            </div>

            {/* Action 2: Reassign Manager */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-neutral-400 font-mono hidden sm:inline">Менеджер:</span>
              <select
                defaultValue=""
                onChange={(e) => {
                  if (e.target.value) {
                    handleBulkManagerChange(e.target.value);
                    e.target.value = '';
                  }
                }}
                className={`text-xs rounded-lg px-2.5 py-1.5 border font-medium focus:outline-none focus:ring-1 focus:ring-[#2563EB] cursor-pointer ${
                  isLight ? 'bg-[#F8F7F4] border-black/[0.08] text-[#1A1A1A]' : 'bg-[#252525] border-white/[0.08] text-white'
                }`}
              >
                <option value="" disabled>Назначить менеджера...</option>
                {managersList.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            {/* Action 3: Bulk Delete */}
            <button
              onClick={handleBulkDelete}
              className="py-1.5 px-3 rounded-lg text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 dark:hover:bg-rose-900/60 border border-rose-200/80 dark:border-rose-900/50 flex items-center gap-1.5 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Удалить</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
