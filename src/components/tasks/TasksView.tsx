import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Phone,
  Mail,
  FileText,
  Factory,
  DollarSign,
  Calendar,
  CheckCircle2,
  Trash2,
  X,
  RotateCcw,
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { TaskPriority, TaskType } from '../../types/crm';
import { PersistentFilterHeader, FilterDateRange } from '../common/PersistentFilterHeader';
import { BulkOperationProgress, BulkProgressState } from '../common/BulkOperationProgress';

export const TasksView: React.FC = () => {
  const {
    tasks,
    managers,
    toggleTask,
    deleteTask,
    bulkDeleteTasks,
    bulkUpdateTasksStatus,
    bulkReassignTasks,
    openClientCockpit,
    setIsCreateTaskOpen,
    theme
  } = useCrm();

  const isLight = theme === 'light';

  // Persistent filter state with fallback to localStorage
  const [searchQuery, setSearchQuery] = useState(() => {
    return localStorage.getItem('crm_task_search') || '';
  });
  const [selectedOwner, setSelectedOwner] = useState(() => {
    return localStorage.getItem('crm_task_owner') || 'all';
  });
  const [selectedPriority, setSelectedPriority] = useState(() => {
    return localStorage.getItem('crm_task_priority') || 'all';
  });
  const [dateRange, setDateRange] = useState<FilterDateRange>(() => {
    const saved = localStorage.getItem('crm_task_daterange');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return { preset: 'all' };
  });

  const [activeFilter, setActiveFilter] = useState<'pending' | 'overdue' | 'completed' | 'all'>('pending');
  const [selectedType, setSelectedType] = useState<string>('all');

  // Save persistent state
  useEffect(() => {
    localStorage.setItem('crm_task_search', searchQuery);
  }, [searchQuery]);
  useEffect(() => {
    localStorage.setItem('crm_task_owner', selectedOwner);
  }, [selectedOwner]);
  useEffect(() => {
    localStorage.setItem('crm_task_priority', selectedPriority);
  }, [selectedPriority]);
  useEffect(() => {
    localStorage.setItem('crm_task_daterange', JSON.stringify(dateRange));
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

  const now = new Date('2026-09-25T00:09:00Z');

  const managersList = useMemo(() => {
    return Array.from(new Set([
      ...tasks.map(t => t.assignedTo).filter(Boolean),
      ...managers.map(m => m.name)
    ]));
  }, [tasks, managers]);

  // Date range verification for task deadline
  const isWithinDateRange = (dateStr: string | undefined, range: FilterDateRange): boolean => {
    if (range.preset === 'all' || !dateStr) return true;
    const itemTime = new Date(dateStr).getTime();
    const nowTime = now.getTime();

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

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const isOverdue = !t.completed && new Date(t.deadline) < now;

      // Status tab
      if (activeFilter === 'pending' && t.completed) return false;
      if (activeFilter === 'completed' && !t.completed) return false;
      if (activeFilter === 'overdue' && !isOverdue) return false;

      // Type
      if (selectedType !== 'all' && t.type !== selectedType) return false;

      // Text Search
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = t.title.toLowerCase().includes(q);
        const matchesClient = t.clientName ? t.clientName.toLowerCase().includes(q) : false;
        const matchesDeal = t.dealTitle ? t.dealTitle.toLowerCase().includes(q) : false;
        if (!matchesTitle && !matchesClient && !matchesDeal) return false;
      }

      // Owner / Assignee
      if (selectedOwner !== 'all' && t.assignedTo !== selectedOwner) return false;

      // Priority
      if (selectedPriority !== 'all' && t.priority !== selectedPriority) return false;

      // Date Range (matches against deadline)
      if (!isWithinDateRange(t.deadline, dateRange)) return false;

      return true;
    });
  }, [tasks, activeFilter, selectedType, searchQuery, selectedOwner, selectedPriority, dateRange]);

  const hasActiveFilters = Boolean(
    searchQuery ||
    selectedOwner !== 'all' ||
    selectedPriority !== 'all' ||
    selectedType !== 'all' ||
    dateRange.preset !== 'all'
  );

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedOwner('all');
    setSelectedPriority('all');
    setSelectedType('all');
    setDateRange({ preset: 'all' });
  };

  const getTypeIcon = (type: TaskType) => {
    switch (type) {
      case 'call': return <Phone className="w-3.5 h-3.5 text-sky-500" />;
      case 'message': return <Mail className="w-3.5 h-3.5 text-indigo-500" />;
      case 'proposal': return <FileText className="w-3.5 h-3.5 text-purple-500" />;
      case 'production': return <Factory className="w-3.5 h-3.5 text-amber-500" />;
      case 'payment': return <DollarSign className="w-3.5 h-3.5 text-emerald-500" />;
      case 'meeting': return <Calendar className="w-3.5 h-3.5 text-rose-500" />;
    }
  };

  const priorityLabels: Record<TaskPriority, { text: string; color: string }> = {
    urgent: { text: 'Срочно', color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-300' },
    high: { text: 'Высокий', color: 'text-amber-700 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-300' },
    medium: { text: 'Обычный', color: 'text-neutral-600 bg-neutral-100 dark:bg-neutral-800 dark:text-neutral-300' },
    low: { text: 'Низкий', color: 'text-neutral-400 bg-neutral-50 dark:bg-neutral-900 dark:text-neutral-500' },
  };

  // Selection logic
  const isAllSelected = filteredTasks.length > 0 && filteredTasks.every(t => selectedIds.includes(t.id));
  const isPartiallySelected = selectedIds.length > 0 && !isAllSelected;

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      const filteredIdSet = new Set(filteredTasks.map(t => t.id));
      setSelectedIds(prev => prev.filter(id => !filteredIdSet.has(id)));
    } else {
      const newIds = new Set([...selectedIds, ...filteredTasks.map(t => t.id)]);
      setSelectedIds(Array.from(newIds));
    }
  };

  const handleToggleSelectTask = (id: string, e: React.MouseEvent) => {
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
  const handleBulkComplete = (completed: boolean) => {
    if (selectedIds.length === 0) return;
    const label = completed ? `Завершение ${selectedIds.length} задач...` : `Возврат в работу...`;
    runWithProgress(label, () => {
      bulkUpdateTasksStatus(selectedIds, completed);
      setToastMessage(
        completed
          ? `Завершено задач: ${selectedIds.length}`
          : `Возвращено в работу задач: ${selectedIds.length}`
      );
    });
  };

  const handleBulkReassign = (managerName: string) => {
    if (selectedIds.length === 0 || !managerName) return;
    runWithProgress(`Назначение исполнителя: ${managerName}`, () => {
      bulkReassignTasks(selectedIds, managerName);
      setToastMessage(`Исполнитель «${managerName}» назначен для ${selectedIds.length} задач`);
    });
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    if (window.confirm(`Вы уверены, что хотите удалить выбранные задачи (${selectedIds.length} шт.)?`)) {
      runWithProgress(`Удаление ${selectedIds.length} задач...`, () => {
        bulkDeleteTasks(selectedIds);
        setToastMessage(`Удалено задач: ${selectedIds.length}`);
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
          <div className="meta-label">Диспетчер поручений</div>
          <h1 className="text-base font-semibold tracking-tight mt-0.5">
            Задачи и напоминания ({tasks.length})
          </h1>
          <p className="text-xs text-neutral-500 font-normal mt-0.5">
            Контроль звонков, КП, платежей и дедлайнов производства
          </p>
        </div>

        <button
          onClick={() => setIsCreateTaskOpen(true)}
          className="px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Новая задача</span>
        </button>
      </div>

      {/* Unified Persistent Filter Header */}
      <PersistentFilterHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Поиск по названию задачи, клиенту, сделке..."
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        selectedOwner={selectedOwner}
        onOwnerChange={setSelectedOwner}
        ownersList={managersList}
        selectedPriority={selectedPriority}
        onPriorityChange={setSelectedPriority}
        priorities={[
          { id: 'urgent', label: 'Срочно' },
          { id: 'high', label: 'Высокий приоритет' },
          { id: 'medium', label: 'Обычный приоритет' },
          { id: 'low', label: 'Низкий приоритет' },
        ]}
        extraFilters={
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className={`border rounded-lg px-2.5 py-1.5 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#2563EB] ${
              selectedType !== 'all'
                ? 'bg-blue-50 border-blue-200 text-[#2563EB] dark:bg-blue-950/40 dark:border-blue-900/60 dark:text-blue-300'
                : isLight
                ? 'bg-white border-black/[0.08] text-[#1A1A1A]'
                : 'bg-[#202020] border-white/[0.08] text-white'
            }`}
          >
            <option value="all">Все типы</option>
            <option value="call">Звонки</option>
            <option value="message">Сообщения</option>
            <option value="proposal">КП / Счета</option>
            <option value="production">Производство</option>
            <option value="payment">Оплата</option>
            <option value="meeting">Встречи</option>
          </select>
        }
        totalCount={tasks.length}
        filteredCount={filteredTasks.length}
        onReset={handleResetFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Status Segment Switcher & Select All Toolbar */}
      <div className={`px-6 py-2 border-b flex flex-wrap items-center justify-between gap-3 text-xs shrink-0 ${
        isLight ? 'bg-[#F8F7F4]/80 border-black/[0.06]' : 'bg-[#181818]/80 border-white/[0.06]'
      }`}>
        <div className="flex items-center gap-1.5 flex-wrap">
          <label className="flex items-center gap-2 mr-2 cursor-pointer font-mono text-[11px] text-neutral-500">
            <input
              type="checkbox"
              checked={isAllSelected}
              ref={input => {
                if (input) input.indeterminate = isPartiallySelected;
              }}
              onChange={handleToggleSelectAll}
              className="rounded text-[#2563EB] focus:ring-[#2563EB] w-3.5 h-3.5 accent-[#2563EB] cursor-pointer"
            />
            <span>Выбрать все в списке</span>
          </label>

          <button
            onClick={() => setActiveFilter('pending')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
              activeFilter === 'pending'
                ? 'bg-[#1A1A1A] text-white dark:bg-white dark:text-neutral-900 font-semibold'
                : 'text-neutral-500 hover:text-[#1A1A1A] dark:hover:text-white'
            }`}
          >
            Активные ({tasks.filter(t => !t.completed).length})
          </button>
          <button
            onClick={() => setActiveFilter('overdue')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
              activeFilter === 'overdue'
                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 font-semibold'
                : 'text-neutral-500 hover:text-rose-600'
            }`}
          >
            Просрочено ({tasks.filter(t => !t.completed && new Date(t.deadline) < now).length})
          </button>
          <button
            onClick={() => setActiveFilter('completed')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
              activeFilter === 'completed'
                ? 'bg-[#1A1A1A] text-white dark:bg-white dark:text-neutral-900 font-semibold'
                : 'text-neutral-500 hover:text-[#1A1A1A] dark:hover:text-white'
            }`}
          >
            Выполненные ({tasks.filter(t => t.completed).length})
          </button>
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
              activeFilter === 'all'
                ? 'bg-[#1A1A1A] text-white dark:bg-white dark:text-neutral-900 font-semibold'
                : 'text-neutral-500 hover:text-[#1A1A1A] dark:hover:text-white'
            }`}
          >
            Все ({tasks.length})
          </button>
        </div>

        {selectedIds.length > 0 && (
          <div className="flex items-center gap-2 font-mono text-xs text-[#2563EB]">
            <span>Выбрано: {selectedIds.length} из {filteredTasks.length}</span>
            <button onClick={handleClearSelection} className="text-neutral-400 hover:text-neutral-600 underline">
              Снять выбор
            </button>
          </div>
        )}
      </div>

      {/* Task Items List */}
      <div className="flex-1 overflow-y-auto p-6 pb-24 space-y-2">
        {filteredTasks.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center text-neutral-400 text-xs font-normal space-y-2">
            <div>Нет задач по выбранным критериям</div>
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
          <div className={`border rounded-xl divide-y overflow-hidden shadow-2xs ${
            isLight ? 'bg-white border-black/[0.08] divide-black/[0.04]' : 'bg-[#181818] border-white/[0.08] divide-white/[0.04]'
          }`}>
            {filteredTasks.map((task) => {
              const isOverdue = !task.completed && new Date(task.deadline) < now;
              const priorityInfo = priorityLabels[task.priority] || priorityLabels.medium;
              const isSelected = selectedIds.includes(task.id);

              return (
                <div
                  key={task.id}
                  className={`p-3.5 flex items-center justify-between gap-4 transition-colors ${
                    isSelected
                      ? (isLight ? 'bg-blue-50/70 border-l-4 border-l-[#2563EB]' : 'bg-blue-950/30 border-l-4 border-l-[#2563EB]')
                      : task.completed 
                      ? 'opacity-50 bg-black/[0.01]' 
                      : (isLight ? 'hover:bg-neutral-50' : 'hover:bg-[#202020]')
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {/* Row Checkbox */}
                    <div 
                      onClick={(e) => handleToggleSelectTask(task.id, e)}
                      className="cursor-pointer p-0.5"
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="rounded text-[#2563EB] focus:ring-[#2563EB] w-3.5 h-3.5 accent-[#2563EB] cursor-pointer"
                      />
                    </div>

                    {/* Complete toggle */}
                    <button
                      onClick={() => toggleTask(task.id)}
                      className="text-neutral-300 hover:text-emerald-600 transition-colors shrink-0"
                      title={task.completed ? 'Вернуть в активные' : 'Отметить выполненной'}
                    >
                      {task.completed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-neutral-300 hover:border-emerald-500" />
                      )}
                    </button>

                    <div className="shrink-0 p-1.5 rounded-md bg-black/[0.03] dark:bg-white/[0.05]">
                      {getTypeIcon(task.type)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-medium truncate ${
                          task.completed ? 'line-through text-neutral-400' : 'text-[#1A1A1A] dark:text-white'
                        }`}>
                          {task.title}
                        </span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-medium ${priorityInfo.color}`}>
                          {priorityInfo.text}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-neutral-500 mt-0.5">
                        {task.clientName && (
                          <button
                            onClick={() => task.clientId && openClientCockpit(task.clientId)}
                            className="text-[#2563EB] hover:underline font-medium truncate max-w-xs"
                          >
                            {task.clientName}
                          </button>
                        )}
                        <span className={`font-mono tabular-nums ${isOverdue ? 'text-rose-600 font-medium' : 'text-neutral-400 font-normal'}`}>
                          до {new Date(task.deadline).toLocaleDateString('ru-RU')}
                          {isOverdue && ' (просрочено)'}
                        </span>
                        <span className="text-neutral-400 font-normal">· {task.assignedTo}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => deleteTask(task.id)}
                    className="p-1.5 text-neutral-300 hover:text-rose-500 transition-colors shrink-0"
                    title="Удалить задачу"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
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
              <span className="font-semibold font-mono">Задач: {selectedIds.length}</span>
              <button
                onClick={handleClearSelection}
                className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-white"
                title="Снять выбор"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Action 1: Complete / Reopen */}
            <button
              onClick={() => handleBulkComplete(true)}
              className="py-1.5 px-3 rounded-lg text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-900/50 flex items-center gap-1.5 transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Выполнить</span>
            </button>

            <button
              onClick={() => handleBulkComplete(false)}
              className="py-1.5 px-3 rounded-lg text-xs font-semibold bg-neutral-100 hover:bg-neutral-200 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200 border border-black/[0.06] flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>В работу</span>
            </button>

            {/* Action 2: Reassign */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-neutral-400 font-mono hidden sm:inline">Исполнитель:</span>
              <select
                defaultValue=""
                onChange={(e) => {
                  if (e.target.value) {
                    handleBulkReassign(e.target.value);
                    e.target.value = '';
                  }
                }}
                className={`text-xs rounded-lg px-2.5 py-1.5 border font-medium focus:outline-none focus:ring-1 focus:ring-[#2563EB] cursor-pointer ${
                  isLight ? 'bg-[#F8F7F4] border-black/[0.08] text-[#1A1A1A]' : 'bg-[#252525] border-white/[0.08] text-white'
                }`}
              >
                <option value="" disabled>Назначить...</option>
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
