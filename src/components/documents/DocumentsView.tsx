import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Eye,
  X,
  ArrowUpRight,
  Trash2,
  CheckCircle2,
  Repeat,
  Sparkles,
  FileText,
  Bell,
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { DocumentRecord, DocumentStatus, DocumentType } from '../../types/crm';
import { PersistentFilterHeader, FilterDateRange } from '../common/PersistentFilterHeader';
import { BulkOperationProgress, BulkProgressState } from '../common/BulkOperationProgress';
import { DocumentTemplateViewer } from './DocumentTemplateViewer';
import { RecurringSchedulesList } from './RecurringSchedulesList';
import { InvoiceReminderTriggersView } from './InvoiceReminderTriggersView';

export const DocumentsView: React.FC = () => {
  const {
    documents,
    clients,
    managers,
    updateDocumentStatus,
    bulkUpdateDocumentsStatus,
    bulkDeleteDocuments,
    openClientCockpit,
    setIsCreateInvoiceOpen,
    recurringSchedules,
    setIsCreateRecurringOpen,
    contractReminderSettings,
    runInvoiceReminderTriggers,
    theme
  } = useCrm();

  const isLight = theme === 'light';

  const [docSubTab, setDocSubTab] = useState<'all' | 'recurring' | 'triggers'>('all');

  const actionableInvoicesCount = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return documents.filter((d) => {
      if (d.type !== 'invoice' || d.status === 'paid' || !d.validUntil) return false;
      const dueDate = new Date(d.validUntil);
      dueDate.setHours(0, 0, 0, 0);
      const daysUntilDue = Math.round((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntilDue <= (contractReminderSettings?.remindDaysBeforeDue || 3);
    }).length;
  }, [documents, contractReminderSettings]);

  // Persistent filter state with fallback to localStorage
  const [searchQuery, setSearchQuery] = useState(() => {
    return localStorage.getItem('crm_doc_search') || '';
  });
  const [selectedOwner, setSelectedOwner] = useState(() => {
    return localStorage.getItem('crm_doc_owner') || 'all';
  });
  const [selectedPriority, setSelectedPriority] = useState(() => {
    return localStorage.getItem('crm_doc_priority') || 'all';
  });
  const [dateRange, setDateRange] = useState<FilterDateRange>(() => {
    const saved = localStorage.getItem('crm_doc_daterange');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return { preset: 'all' };
  });

  const [activeTypeFilter, setActiveTypeFilter] = useState<'all' | DocumentType>('all');
  const [activeStatusFilter, setActiveStatusFilter] = useState<string>('all');
  const [previewDoc, setPreviewDoc] = useState<DocumentRecord | null>(null);

  // Save persistent state
  useEffect(() => {
    localStorage.setItem('crm_doc_search', searchQuery);
  }, [searchQuery]);
  useEffect(() => {
    localStorage.setItem('crm_doc_owner', selectedOwner);
  }, [selectedOwner]);
  useEffect(() => {
    localStorage.setItem('crm_doc_priority', selectedPriority);
  }, [selectedPriority]);
  useEffect(() => {
    localStorage.setItem('crm_doc_daterange', JSON.stringify(dateRange));
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

  // Date range verification
  const isWithinDateRange = (dateStr: string | undefined, range: FilterDateRange): boolean => {
    if (range.preset === 'all' || !dateStr) return true;
    const itemTime = new Date(dateStr).getTime();
    const nowTime = new Date('2026-09-25T00:09:00Z').getTime();

    switch (range.preset) {
      case 'today': {
        const todayStart = new Date('2026-09-25T00:00:00Z').getTime();
        return itemTime >= todayStart;
      }
      case '7days': {
        return itemTime >= nowTime - 7 * 24 * 60 * 60 * 1000;
      }
      case '30days': {
        return itemTime >= nowTime - 30 * 24 * 60 * 60 * 1000;
      }
      case 'quarter': {
        return itemTime >= nowTime - 90 * 24 * 60 * 60 * 1000;
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

  const filteredDocs = useMemo(() => {
    return documents.filter((d) => {
      // 1. Text Search
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesNumber = d.number.toLowerCase().includes(q);
        const matchesTitle = d.title.toLowerCase().includes(q);
        const matchesClient = d.clientName.toLowerCase().includes(q);
        if (!matchesNumber && !matchesTitle && !matchesClient) return false;
      }

      // 2. Type & Status
      if (activeTypeFilter !== 'all' && d.type !== activeTypeFilter) return false;
      if (activeStatusFilter !== 'all' && d.status !== activeStatusFilter) return false;

      // 3. Owner (find client manager)
      if (selectedOwner !== 'all') {
        const client = clients.find(c => c.id === d.clientId);
        if (!client || client.assignedManager !== selectedOwner) return false;
      }

      // 4. Priority Tier (by amount)
      if (selectedPriority !== 'all') {
        if (selectedPriority === 'high' && d.amount < 500000) return false;
        if (selectedPriority === 'medium' && (d.amount < 150000 || d.amount >= 500000)) return false;
        if (selectedPriority === 'low' && d.amount >= 150000) return false;
      }

      // 5. Date Range
      if (!isWithinDateRange(d.createdAt, dateRange)) return false;

      return true;
    });
  }, [documents, clients, searchQuery, activeTypeFilter, activeStatusFilter, selectedOwner, selectedPriority, dateRange]);

  const hasActiveFilters = Boolean(
    searchQuery ||
    activeTypeFilter !== 'all' ||
    activeStatusFilter !== 'all' ||
    selectedOwner !== 'all' ||
    selectedPriority !== 'all' ||
    dateRange.preset !== 'all'
  );

  const handleResetFilters = () => {
    setSearchQuery('');
    setActiveTypeFilter('all');
    setActiveStatusFilter('all');
    setSelectedOwner('all');
    setSelectedPriority('all');
    setDateRange({ preset: 'all' });
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(val);
  };

  const statusLabels: Record<DocumentStatus, { label: string; badgeClass: string }> = {
    draft: { label: 'Черновик', badgeClass: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300' },
    sent: { label: 'Отправлено', badgeClass: 'bg-sky-100 text-sky-800 dark:bg-sky-950/40 dark:text-sky-300' },
    viewed: { label: 'Просмотрено', badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300' },
    approved: { label: 'Согласовано', badgeClass: 'bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300' },
    paid: { label: 'Оплачено', badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300' },
  };

  const typeLabels: Record<DocumentType, string> = {
    proposal: 'КП',
    invoice: 'Счет',
    contract: 'Договор',
    act: 'Акт'
  };

  // Selection logic
  const isAllSelected = filteredDocs.length > 0 && filteredDocs.every(d => selectedIds.includes(d.id));
  const isPartiallySelected = selectedIds.length > 0 && !isAllSelected;

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      const filteredIdSet = new Set(filteredDocs.map(d => d.id));
      setSelectedIds(prev => prev.filter(id => !filteredIdSet.has(id)));
    } else {
      const newIds = new Set([...selectedIds, ...filteredDocs.map(d => d.id)]);
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

  // Simulated Async Progress Execution
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

  // Bulk actions
  const handleBulkStatusChange = (status: DocumentStatus) => {
    if (selectedIds.length === 0) return;
    runWithProgress(`Смена статуса на «${statusLabels[status].label}»`, () => {
      bulkUpdateDocumentsStatus(selectedIds, status);
      setToastMessage(`Статус изменен для ${selectedIds.length} документов`);
    });
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    if (window.confirm(`Вы уверены, что хотите удалить выбранные документы (${selectedIds.length} шт.)?`)) {
      runWithProgress(`Удаление ${selectedIds.length} документов...`, () => {
        bulkDeleteDocuments(selectedIds);
        setToastMessage(`Удалено документов: ${selectedIds.length}`);
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
      <div className={`px-6 py-4 border-b space-y-3 shrink-0 ${
        isLight ? 'bg-white border-black/[0.08]' : 'bg-[#161616] border-white/[0.08]'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <div className="meta-label">Финансовый документооборот</div>
            <h1 className="text-base font-semibold tracking-tight mt-0.5">
              КП, счета и абонентские договоры
            </h1>
            <p className="text-xs text-neutral-500 font-normal mt-0.5">
              Коммерческие предложения, выставленные счета, закрывающие акты и автоматическое выставление по расписанию
            </p>
          </div>

          <div className="flex items-center gap-2">
            {docSubTab === 'recurring' ? (
              <button
                onClick={() => setIsCreateRecurringOpen(true)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>+ Настроить автовыставление</span>
              </button>
            ) : docSubTab === 'triggers' ? (
              <button
                onClick={() => runInvoiceReminderTriggers(true)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
              >
                <Bell className="w-3.5 h-3.5" />
                <span>Проверить и отправить триггеры</span>
              </button>
            ) : (
              <button
                onClick={() => setIsCreateInvoiceOpen(true)}
                className="px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Создать документ</span>
              </button>
            )}
          </div>
        </div>

        {/* Sub-tab Navigation */}
        <div className="flex items-center gap-1 p-1 rounded-xl border border-black/[0.06] dark:border-white/[0.06] bg-black/[0.02] dark:bg-white/[0.02] w-fit text-xs">
          <button
            onClick={() => setDocSubTab('all')}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
              docSubTab === 'all'
                ? 'bg-[#2563EB] text-white shadow-2xs'
                : 'text-neutral-500 hover:text-[#1A1A1A] dark:hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Все документы ({documents.length})</span>
          </button>

          <button
            onClick={() => setDocSubTab('recurring')}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
              docSubTab === 'recurring'
                ? 'bg-purple-600 text-white shadow-2xs'
                : 'text-neutral-500 hover:text-[#1A1A1A] dark:hover:text-white'
            }`}
          >
            <Repeat className="w-3.5 h-3.5" />
            <span>Регулярные счета и автогенерация ({recurringSchedules.length})</span>
          </button>

          <button
            onClick={() => setDocSubTab('triggers')}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
              docSubTab === 'triggers'
                ? 'bg-amber-600 text-white shadow-2xs'
                : 'text-neutral-500 hover:text-[#1A1A1A] dark:hover:text-white'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Авто-триггеры по договорам</span>
            {actionableInvoicesCount > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                docSubTab === 'triggers'
                  ? 'bg-white/20 text-white'
                  : 'bg-amber-100 text-amber-900 dark:bg-amber-900/60 dark:text-amber-200'
              }`}>
                {actionableInvoicesCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main Content Area based on active subtab */}
      {docSubTab === 'recurring' ? (
        <div className="flex-1 overflow-y-auto p-6 pb-24">
          <RecurringSchedulesList onOpenCreate={() => setIsCreateRecurringOpen(true)} />
        </div>
      ) : docSubTab === 'triggers' ? (
        <div className="flex-1 overflow-y-auto p-6 pb-24">
          <InvoiceReminderTriggersView onOpenPreviewDoc={(doc) => setPreviewDoc(doc)} />
        </div>
      ) : (
        <>
          {/* Unified Persistent Filter Header */}
          <PersistentFilterHeader
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Поиск по номеру, названию, клиенту..."
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            selectedOwner={selectedOwner}
            onOwnerChange={setSelectedOwner}
            ownersList={managersList}
            selectedPriority={selectedPriority}
            onPriorityChange={setSelectedPriority}
            priorities={[
              { id: 'high', label: 'Крупный чек (> 500k ₽)' },
              { id: 'medium', label: 'Средний чек (150k–500k ₽)' },
              { id: 'low', label: 'Базовый чек (< 150k ₽)' },
            ]}
            extraFilters={
          <div className="flex items-center gap-2">
            <select
              value={activeTypeFilter}
              onChange={(e) => setActiveTypeFilter(e.target.value as any)}
              className={`border rounded-lg px-2.5 py-1.5 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#2563EB] ${
                activeTypeFilter !== 'all'
                  ? 'bg-blue-50 border-blue-200 text-[#2563EB] dark:bg-blue-950/40 dark:border-blue-900/60 dark:text-blue-300'
                  : isLight
                  ? 'bg-white border-black/[0.08] text-[#1A1A1A]'
                  : 'bg-[#202020] border-white/[0.08] text-white'
              }`}
            >
              <option value="all">Все типы</option>
              <option value="proposal">Коммерческие предложения</option>
              <option value="invoice">Счета на оплату</option>
              <option value="contract">Договоры</option>
              <option value="act">Акты выполненных работ</option>
            </select>

            <select
              value={activeStatusFilter}
              onChange={(e) => setActiveStatusFilter(e.target.value)}
              className={`border rounded-lg px-2.5 py-1.5 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#2563EB] ${
                activeStatusFilter !== 'all'
                  ? 'bg-blue-50 border-blue-200 text-[#2563EB] dark:bg-blue-950/40 dark:border-blue-900/60 dark:text-blue-300'
                  : isLight
                  ? 'bg-white border-black/[0.08] text-[#1A1A1A]'
                  : 'bg-[#202020] border-white/[0.08] text-white'
              }`}
            >
              <option value="all">Все статусы</option>
              <option value="draft">Черновики</option>
              <option value="sent">Отправленные</option>
              <option value="viewed">Просмотренные</option>
              <option value="approved">Согласованные</option>
              <option value="paid">Оплаченные</option>
            </select>
          </div>
        }
        totalCount={documents.length}
        filteredCount={filteredDocs.length}
        onReset={handleResetFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Select All Bar if items are selected */}
      {selectedIds.length > 0 && (
        <div className={`px-6 py-2 border-b flex items-center justify-between text-xs font-mono shrink-0 ${
          isLight ? 'bg-blue-50/50 border-blue-100 text-[#2563EB]' : 'bg-blue-950/20 border-blue-900/40 text-blue-300'
        }`}>
          <span>Выбрано документов: {selectedIds.length} из {filteredDocs.length}</span>
          <button onClick={handleClearSelection} className="hover:underline">
            Снять выбор
          </button>
        </div>
      )}

      {/* Clean Documents Table with Checkboxes */}
      <div className="flex-1 overflow-y-auto p-6 pb-24">
        {filteredDocs.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center text-neutral-400 text-xs font-normal space-y-2">
            <div>Нет документов по заданным фильтрам</div>
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
                      title="Выбрать все документы"
                    />
                  </th>
                  <th className="py-1 px-4 font-mono uppercase text-[10px] tracking-[0.1em]">Номер / Название</th>
                  <th className="py-1 px-4 font-mono uppercase text-[10px] tracking-[0.1em]">Клиент</th>
                  <th className="py-1 px-4 font-mono uppercase text-[10px] tracking-[0.1em]">Тип</th>
                  <th className="py-1 px-4 font-mono uppercase text-[10px] tracking-[0.1em]">Дата создания</th>
                  <th className="py-1 px-4 font-mono uppercase text-[10px] tracking-[0.1em] text-right">Сумма</th>
                  <th className="py-1 px-4 font-mono uppercase text-[10px] tracking-[0.1em]">Статус</th>
                  <th className="py-1 px-4 font-mono uppercase text-[10px] tracking-[0.1em] text-center">Просмотр</th>
                </tr>
              </thead>
              <tbody>
                {filteredDocs.map((doc) => {
                  const statusInfo = statusLabels[doc.status] || { label: doc.status, badgeClass: 'bg-neutral-100 text-neutral-700' };
                  const isSelected = selectedIds.includes(doc.id);

                  return (
                    <tr
                      key={doc.id}
                      onClick={() => setPreviewDoc(doc)}
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
                        onClick={(e) => handleToggleSelectRow(doc.id, e)}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="rounded text-[#2563EB] focus:ring-[#2563EB] w-3.5 h-3.5 accent-[#2563EB] cursor-pointer"
                        />
                      </td>

                      <td className="py-3 px-4 font-normal">
                        <div className="font-semibold text-[#1A1A1A] dark:text-white group-hover:text-[#2563EB] transition-colors flex items-center gap-2">
                          <span className="font-mono text-[#2563EB]">{doc.number}</span>
                          <span>{doc.title}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4 font-normal">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openClientCockpit(doc.clientId);
                          }}
                          className="hover:underline text-[#1A1A1A] dark:text-neutral-200 font-medium"
                        >
                          {doc.clientName}
                        </button>
                      </td>

                      <td className="py-3 px-4 font-normal">
                        <span className="font-mono text-neutral-500 uppercase text-[11px]">
                          {typeLabels[doc.type]}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-mono tabular-nums text-neutral-400 font-normal">
                        {new Date(doc.createdAt).toLocaleDateString('ru-RU')}
                      </td>

                      <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-xs text-[#1A1A1A] dark:text-neutral-100">
                        {formatCurrency(doc.amount)}
                      </td>

                      <td className="py-3 px-4 font-normal">
                        <span className={`text-[11px] px-2 py-0.5 rounded font-mono font-medium ${statusInfo.badgeClass}`}>
                          {statusInfo.label}
                        </span>
                      </td>

                      <td className="py-3 px-4 rounded-r-lg text-center">
                        <span className="text-[#2563EB] group-hover:underline inline-flex items-center gap-1 font-medium text-xs font-mono">
                          ОБЗОР
                          <Eye className="w-3 h-3" />
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
              <span className="font-semibold font-mono">Документов: {selectedIds.length}</span>
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
                    handleBulkStatusChange(e.target.value as DocumentStatus);
                    e.target.value = '';
                  }
                }}
                className={`text-xs rounded-lg px-2.5 py-1.5 border font-medium focus:outline-none focus:ring-1 focus:ring-[#2563EB] cursor-pointer ${
                  isLight ? 'bg-[#F8F7F4] border-black/[0.08] text-[#1A1A1A]' : 'bg-[#252525] border-white/[0.08] text-white'
                }`}
              >
                <option value="" disabled>Изменить статус...</option>
                <option value="draft">Черновик</option>
                <option value="sent">Отправлено</option>
                <option value="viewed">Просмотрено</option>
                <option value="approved">Согласовано</option>
                <option value="paid">Оплачено</option>
              </select>
            </div>

            {/* Action 2: Bulk Delete */}
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
      </>
      )}

      {/* Document Template Viewer Modal */}
      {previewDoc && (
        <DocumentTemplateViewer
          document={previewDoc}
          onClose={() => setPreviewDoc(null)}
          onUpdateStatus={(st) => {
            updateDocumentStatus(previewDoc.id, st);
            setPreviewDoc(prev => prev ? { ...prev, status: st } : null);
          }}
        />
      )}
    </div>
  );
};
