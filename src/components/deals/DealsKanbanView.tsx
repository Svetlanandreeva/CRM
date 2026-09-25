import React, { useState, useEffect } from 'react';
import {
  Plus,
  ArrowRight,
  ArrowLeft,
  X,
  Briefcase,
  Clock,
  CheckCircle2,
  Calendar,
  AlertCircle,
  GripVertical,
  CheckSquare,
  Sparkles,
  User,
  ArrowUpRight
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { Deal, DealStage, TaskPriority, TaskType } from '../../types/crm';
import { DEAL_STAGES, MANAGERS } from '../../data/mockData';

interface FollowUpPromptState {
  deal: Deal;
  prevStage: DealStage;
  newStage: DealStage;
}

export const DealsKanbanView: React.FC = () => {
  const {
    deals,
    updateDealStage,
    addTask,
    setIsCreateDealOpen,
    openClientCockpit,
    theme
  } = useCrm();

  const isLight = theme === 'light';
  const [activeModalDeal, setActiveModalDeal] = useState<Deal | null>(null);

  // Drag and Drop state
  const [draggedDealId, setDraggedDealId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<DealStage | null>(null);

  // Follow-up task prompt state
  const [followUpPrompt, setFollowUpPrompt] = useState<FollowUpPromptState | null>(null);
  const [followUpTitle, setFollowUpTitle] = useState('');
  const [followUpPriority, setFollowUpPriority] = useState<TaskPriority>('high');
  const [followUpType, setFollowUpType] = useState<TaskType>('call');
  const [followUpDeadline, setFollowUpDeadline] = useState('');
  const [followUpAssignee, setFollowUpAssignee] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Auto-dismiss toast
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(val);
  };

  // Human-readable Last Modified formatter
  const formatLastModified = (isoString?: string) => {
    if (!isoString) return 'только что';
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);

      if (diffMins < 1) return 'только что';
      if (diffMins < 60) return `${diffMins} мин назад`;
      if (diffHours < 24) return `${diffHours} ч назад`;
      return date.toLocaleDateString('ru-RU', { 
        day: '2-digit', 
        month: '2-digit', 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch {
      return 'недавно';
    }
  };

  // Forward stages in kanban columns (excluding closed_lost)
  const kanbanStages = DEAL_STAGES.filter(s => s.id !== 'closed_lost');

  // Overall pipeline metrics for proportion calculations
  const totalPipelineValue = deals
    .filter(d => d.stage !== 'closed_lost')
    .reduce((sum, d) => sum + d.amount, 0);

  const totalPipelineMargin = deals
    .filter(d => d.stage !== 'closed_lost')
    .reduce((sum, d) => sum + d.margin, 0);

  const getNextStage = (current: DealStage): DealStage | null => {
    const idx = kanbanStages.findIndex(s => s.id === current);
    if (idx >= 0 && idx < kanbanStages.length - 1) {
      return kanbanStages[idx + 1].id;
    }
    return null;
  };

  const getPrevStage = (current: DealStage): DealStage | null => {
    const idx = kanbanStages.findIndex(s => s.id === current);
    if (idx > 0) {
      return kanbanStages[idx - 1].id;
    }
    return null;
  };

  // Context-aware smart presets for follow-up tasks when moving stage
  const getStageTaskPreset = (stageId: DealStage, deal: Deal): {
    title: string;
    type: TaskType;
    priority: TaskPriority;
    daysOffset: number;
  } => {
    switch (stageId) {
      case 'contacted':
        return {
          title: `Уточнить ТЗ и пожелания по материалам: ${deal.title}`,
          type: 'call',
          priority: 'high',
          daysOffset: 1,
        };
      case 'calculation':
        return {
          title: `Подготовить расчёт спецификации и себестоимости: ${deal.title}`,
          type: 'proposal',
          priority: 'high',
          daysOffset: 2,
        };
      case 'proposal_sent':
        return {
          title: `Получить обратную связь по отправленному КП: ${deal.title}`,
          type: 'call',
          priority: 'medium',
          daysOffset: 3,
        };
      case 'negotiation':
        return {
          title: `Согласовать финальный договор и график оплат: ${deal.title}`,
          type: 'meeting',
          priority: 'urgent',
          daysOffset: 2,
        };
      case 'prepayment':
        return {
          title: `Проконтролировать поступление предоплаты 50%: ${deal.title}`,
          type: 'payment',
          priority: 'urgent',
          daysOffset: 1,
        };
      case 'production':
        return {
          title: `Передать чертежи в цех и запустить закупку материалов: ${deal.title}`,
          type: 'production',
          priority: 'urgent',
          daysOffset: 1,
        };
      case 'ready':
        return {
          title: `ОТК контроль качества изделий и фотоотчет клиенту: ${deal.title}`,
          type: 'message',
          priority: 'high',
          daysOffset: 1,
        };
      case 'shipped':
        return {
          title: `Запросить подписанный акт приемки и отзыв: ${deal.title}`,
          type: 'message',
          priority: 'medium',
          daysOffset: 3,
        };
      case 'closed_won':
        return {
          title: `Запросить профессиональные фото интерьера у заказчика: ${deal.clientName}`,
          type: 'message',
          priority: 'low',
          daysOffset: 7,
        };
      case 'closed_lost':
        return {
          title: `Зафиксировать причину отказа и запланировать ре-контакт: ${deal.title}`,
          type: 'call',
          priority: 'low',
          daysOffset: 60,
        };
      default:
        return {
          title: `Следующее действие по сделке: ${deal.title}`,
          type: 'call',
          priority: 'medium',
          daysOffset: 2,
        };
    }
  };

  // Trigger stage update & auto-update timestamp & launch follow-up task prompt
  const moveDealToStage = (deal: Deal, targetStageId: DealStage) => {
    if (deal.stage === targetStageId) return;

    const prevStage = deal.stage;

    // 1. Auto-update stage and 'Last Modified' timestamp
    updateDealStage(deal.id, targetStageId);

    // 2. Prepare contextual follow-up task prompt
    const preset = getStageTaskPreset(targetStageId, deal);
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + preset.daysOffset);
    const deadlineStr = targetDate.toISOString().split('T')[0];

    const prevStageInfo = DEAL_STAGES.find(s => s.id === prevStage);
    const newStageInfo = DEAL_STAGES.find(s => s.id === targetStageId);

    setFollowUpTitle(preset.title);
    setFollowUpType(preset.type);
    setFollowUpPriority(preset.priority);
    setFollowUpDeadline(deadlineStr);
    setFollowUpAssignee(deal.assignedManager || MANAGERS[0].name);

    setFollowUpPrompt({
      deal: { ...deal, stage: targetStageId, updatedAt: new Date().toISOString() },
      prevStage,
      newStage: targetStageId
    });

    setToastMessage(`Сделка перемещена: ${prevStageInfo?.title || prevStage} → ${newStageInfo?.title || targetStageId}. Время изменения обновлено.`);
  };

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, deal: Deal) => {
    e.dataTransfer.setData('text/plain', deal.id);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedDealId(deal.id);
  };

  const handleDragEnd = () => {
    setDraggedDealId(null);
    setDragOverStage(null);
  };

  const handleDragOver = (e: React.DragEvent, stageId: DealStage) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverStage !== stageId) {
      setDragOverStage(stageId);
    }
  };

  const handleDragLeave = (e: React.DragEvent, stageId: DealStage) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      if (dragOverStage === stageId) {
        setDragOverStage(null);
      }
    }
  };

  const handleDrop = (e: React.DragEvent, targetStageId: DealStage) => {
    e.preventDefault();
    const dealId = e.dataTransfer.getData('text/plain') || draggedDealId;
    setDraggedDealId(null);
    setDragOverStage(null);

    if (!dealId) return;
    const deal = deals.find(d => d.id === dealId);
    if (!deal || deal.stage === targetStageId) return;

    moveDealToStage(deal, targetStageId);
  };

  // Save the scheduled follow-up task
  const handleSaveFollowUpTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!followUpPrompt || !followUpTitle.trim()) return;

    const { deal } = followUpPrompt;

    addTask({
      clientId: deal.clientId,
      clientName: deal.clientName,
      dealId: deal.id,
      dealTitle: deal.title,
      title: followUpTitle.trim(),
      type: followUpType,
      priority: followUpPriority,
      deadline: followUpDeadline || new Date(Date.now() + 86400000).toISOString().split('T')[0],
      assignedTo: followUpAssignee || deal.assignedManager || MANAGERS[0].name
    });

    setFollowUpPrompt(null);
    setToastMessage(`✓ Задача успешно запланирована по сделке «${deal.title}»`);
  };

  const handleSkipFollowUp = () => {
    setFollowUpPrompt(null);
  };

  return (
    <div className={`flex-1 flex flex-col min-h-0 overflow-hidden relative ${
      isLight ? 'bg-[#F8F7F4] text-[#1A1A1A]' : 'bg-[#121212] text-neutral-100'
    }`}>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute top-4 right-6 z-50 animate-in fade-in slide-in-from-top-3 duration-200">
          <div className={`px-4 py-2.5 rounded-xl border text-xs shadow-xl flex items-center gap-2.5 ${
            isLight ? 'bg-white border-black/[0.08] text-[#1A1A1A]' : 'bg-[#1E1E1E] border-white/[0.08] text-white'
          }`}>
            <CheckCircle2 className="w-4 h-4 text-[#2563EB] shrink-0" />
            <span className="font-medium">{toastMessage}</span>
            <button onClick={() => setToastMessage(null)} className="text-neutral-400 hover:text-neutral-600 ml-1">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Top Bar with Clear Typographic Hierarchy */}
      <div className={`h-16 px-6 border-b flex items-center justify-between shrink-0 ${
        isLight ? 'bg-white border-black/[0.08]' : 'bg-[#161616] border-white/[0.08]'
      }`}>
        <div className="flex items-center gap-3">
          <div>
            <div className="meta-label">ВОРОНКА ПРОДАЖ · DRAG & DROP</div>
            <h1 className={`text-base font-semibold tracking-tight mt-0.5 ${isLight ? 'text-[#1A1A1A]' : 'text-white'}`}>
              Сделки в работе ({deals.length})
            </h1>
          </div>
          
          {/* Top Pipeline Aggregates */}
          <div className="hidden lg:flex items-center gap-2 pl-3 border-l border-black/[0.08] dark:border-white/[0.08] font-mono text-xs">
            <div className="px-2.5 py-1 rounded-md bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.04] dark:border-white/[0.04]">
              <span className="text-neutral-400 text-[10px] uppercase tracking-wider mr-1.5">Воронка:</span>
              <span className="font-semibold text-[#1A1A1A] dark:text-white tabular-nums">{formatCurrency(totalPipelineValue)}</span>
            </div>
            <div className="px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300">
              <span className="text-[10px] uppercase tracking-wider opacity-75 mr-1.5">Маржа:</span>
              <span className="font-semibold tabular-nums">+{formatCurrency(totalPipelineMargin)}</span>
            </div>
          </div>

          <span className="hidden xl:inline-flex text-[11px] font-mono text-neutral-400 border border-black/[0.06] dark:border-white/[0.06] px-2.5 py-1 rounded-md bg-black/[0.02] dark:bg-white/[0.02]">
            Перетаскивайте карточки между колонками
          </span>
        </div>

        <button
          onClick={() => setIsCreateDealOpen(true)}
          className="px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Новая сделка</span>
        </button>
      </div>

      {/* Kanban Board with Drag and Drop Support */}
      <div className="flex-1 overflow-x-auto p-5 flex gap-4 items-start select-none">
        {kanbanStages.map((stage) => {
          const stageDeals = deals.filter(d => d.stage === stage.id);
          const stageTotal = stageDeals.reduce((sum, d) => sum + d.amount, 0);
          const stageTotalMargin = stageDeals.reduce((sum, d) => sum + d.margin, 0);
          const shareOfPipeline = totalPipelineValue > 0 ? Math.round((stageTotal / totalPipelineValue) * 100) : 0;
          const isTargetDrop = dragOverStage === stage.id;

          return (
            <div
              key={stage.id}
              onDragOver={(e) => handleDragOver(e, stage.id)}
              onDragEnter={() => setDragOverStage(stage.id)}
              onDragLeave={(e) => handleDragLeave(e, stage.id)}
              onDrop={(e) => handleDrop(e, stage.id)}
              className={`w-72 shrink-0 rounded-xl flex flex-col max-h-full border transition-all duration-150 ${
                isTargetDrop
                  ? (isLight 
                      ? 'bg-blue-50/70 border-[#2563EB] ring-2 ring-[#2563EB]/20 shadow-md' 
                      : 'bg-[#1E2638] border-[#2563EB] ring-2 ring-[#2563EB]/30 shadow-md')
                  : (isLight 
                      ? 'bg-white/80 border-black/[0.08]' 
                      : 'bg-[#161616] border-white/[0.08]')
              }`}
            >
              {/* Column Top Summary Card: Stage Deals Count & Aggregate Value */}
              <div className="p-3 border-b border-black/[0.06] dark:border-white/[0.06]">
                <div className={`p-3 rounded-xl border transition-all ${
                  stageDeals.length > 0
                    ? (isLight 
                        ? 'bg-white border-black/[0.08] shadow-2xs' 
                        : 'bg-[#1E1E1E] border-white/[0.08]')
                    : (isLight 
                        ? 'bg-black/[0.02] border-dashed border-black/[0.06]' 
                        : 'bg-white/[0.02] border-dashed border-white/[0.06]')
                }`}>
                  {/* Stage Title, Color Dot, and Deals Count Badge */}
                  <div className="flex items-center justify-between gap-1.5 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs" style={{ backgroundColor: stage.color }} />
                      <span className="text-xs font-semibold text-[#1A1A1A] dark:text-neutral-100 truncate">
                        {stage.title}
                      </span>
                    </div>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold tabular-nums shrink-0 ${
                      stageDeals.length > 0
                        ? 'bg-[#2563EB]/10 text-[#2563EB]'
                        : 'text-neutral-400 bg-black/[0.03] dark:bg-white/[0.04]'
                    }`}>
                      {stageDeals.length} {stageDeals.length === 1 ? 'сделка' : stageDeals.length >= 2 && stageDeals.length <= 4 ? 'сделки' : 'сделок'}
                    </span>
                  </div>

                  {/* Aggregate Value for that specific stage */}
                  <div className="pt-1.5 border-t border-black/[0.04] dark:border-white/[0.04]">
                    <div className="text-[9px] font-mono uppercase tracking-[0.1em] text-neutral-400">
                      ОБЪЁМ ЭТАПА
                    </div>
                    <div className="text-base font-bold font-mono tabular-nums text-[#1A1A1A] dark:text-white mt-0.5">
                      {formatCurrency(stageTotal)}
                    </div>
                  </div>

                  {/* Aggregate Margin & Share of Pipeline */}
                  <div className="mt-2 pt-2 border-t border-black/[0.04] dark:border-white/[0.04] flex items-center justify-between text-[10px] font-mono">
                    <span className="text-neutral-400">
                      {shareOfPipeline}% от воронки
                    </span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                      {stageTotalMargin > 0 ? `+${formatCurrency(stageTotalMargin)}` : '0 ₽ маржи'}
                    </span>
                  </div>

                  {/* Visual Progress Bar in Stage Color */}
                  <div className="mt-1.5 h-1 w-full bg-black/[0.04] dark:bg-white/[0.06] rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-300"
                      style={{ 
                        width: `${stageDeals.length > 0 ? Math.max(shareOfPipeline, 8) : 0}%`,
                        backgroundColor: stage.color 
                      }} 
                    />
                  </div>
                </div>
              </div>

              {/* Cards Container with Drop Zone feedback */}
              <div className="flex-1 p-2.5 space-y-2.5 overflow-y-auto min-h-[140px]">
                {stageDeals.length === 0 ? (
                  <div className={`h-24 flex flex-col items-center justify-center text-xs font-mono transition-colors rounded-lg border-2 border-dashed ${
                    isTargetDrop
                      ? 'border-[#2563EB] text-[#2563EB] bg-[#2563EB]/[0.04]'
                      : 'border-transparent text-neutral-400'
                  }`}>
                    {isTargetDrop ? (
                      <span className="font-semibold">Отпустите для переноса</span>
                    ) : (
                      <span>НЕТ СДЕЛОК</span>
                    )}
                  </div>
                ) : (
                  <>
                    {stageDeals.map((deal) => {
                      const nextStageId = getNextStage(deal.stage);
                      const prevStageId = getPrevStage(deal.stage);
                      const isDraggingThis = draggedDealId === deal.id;

                      return (
                        <div
                          key={deal.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, deal)}
                          onDragEnd={handleDragEnd}
                          onClick={() => setActiveModalDeal(deal)}
                          className={`p-3.5 rounded-xl border cursor-grab active:cursor-grabbing transition-all space-y-2.5 group shadow-2xs relative ${
                            isDraggingThis
                              ? 'opacity-40 scale-[0.98] ring-2 ring-[#2563EB]'
                              : isLight 
                              ? 'bg-white hover:bg-neutral-50/90 border-black/[0.08] hover:border-[#2563EB]' 
                              : 'bg-[#1A1A1A] hover:bg-[#222222] border-white/[0.08] hover:border-[#2563EB]'
                          }`}
                        >
                          {/* Header: Drag Grip & Title */}
                          <div className="flex items-start justify-between gap-1.5">
                            <div className="flex items-start gap-1 min-w-0">
                              <GripVertical className="w-3.5 h-3.5 text-neutral-400 group-hover:text-[#2563EB] shrink-0 mt-0.5 opacity-60 group-hover:opacity-100 transition-opacity" />
                              <div className="text-xs font-semibold text-[#1A1A1A] dark:text-white group-hover:text-[#2563EB] transition-colors leading-snug truncate">
                                {deal.title}
                              </div>
                            </div>
                          </div>

                          {/* Client Name link */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openClientCockpit(deal.clientId);
                            }}
                            className="text-xs font-normal text-neutral-500 hover:text-[#2563EB] transition-colors block truncate pl-4"
                          >
                            {deal.clientName}
                          </button>

                          {/* Amount & Margin */}
                          <div className="flex items-center justify-between text-xs font-mono tabular-nums pt-1 pl-4">
                            <span className="font-semibold text-[#1A1A1A] dark:text-white">{formatCurrency(deal.amount)}</span>
                            <span className="text-emerald-600 dark:text-emerald-400 font-medium">+{formatCurrency(deal.margin)}</span>
                          </div>

                          {/* Stage Controls & Auto-updated 'Last Modified' timestamp */}
                          <div 
                            className="flex items-center justify-between pt-2 border-t border-black/[0.06] dark:border-white/[0.06] text-xs text-neutral-500" 
                            onClick={(e) => e.stopPropagation()}
                          >
                            {/* Prominently visible 'Last Modified' timestamp */}
                            <div 
                              className="flex items-center gap-1 text-[10px] font-mono text-neutral-400"
                              title={`Последнее изменение: ${deal.updatedAt ? new Date(deal.updatedAt).toLocaleString('ru-RU') : 'не указано'}`}
                            >
                              <Clock className="w-3 h-3 text-neutral-400" />
                              <span>{formatLastModified(deal.updatedAt)}</span>
                            </div>

                            {/* Quick Next/Prev Step Buttons */}
                            <div className="flex items-center gap-1">
                              {prevStageId && (
                                <button
                                  onClick={() => moveDealToStage(deal, prevStageId)}
                                  className="p-1 text-neutral-400 hover:text-[#1A1A1A] dark:hover:text-neutral-200 rounded hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition-colors"
                                  title="Переместить на шаг назад"
                                >
                                  <ArrowLeft className="w-3.5 h-3.5" />
                                </button>
                              )}
                              {nextStageId && (
                                <button
                                  onClick={() => moveDealToStage(deal, nextStageId)}
                                  className="px-2 py-0.5 bg-black/[0.05] dark:bg-white/[0.08] hover:bg-[#2563EB] hover:text-white dark:hover:bg-[#2563EB] dark:hover:text-white rounded text-xs font-medium transition-colors flex items-center gap-1 text-neutral-700 dark:text-neutral-300 font-mono"
                                  title="Переместить на следующий этап"
                                >
                                  <span>ВПЕРЁД</span>
                                  <ArrowRight className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* Additional drop target indicator when hovering */}
                    {isTargetDrop && (
                      <div className="p-3 rounded-xl border-2 border-dashed border-[#2563EB] bg-[#2563EB]/[0.05] text-[#2563EB] text-center text-xs font-mono font-medium animate-pulse">
                        + Переместить в «{stage.title}»
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ================= FOLLOW-UP TASK PROMPT MODAL ================= */}
      {followUpPrompt && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className={`rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl border animate-in fade-in zoom-in-95 duration-150 ${
            isLight ? 'bg-white border-black/[0.08] text-[#1A1A1A]' : 'bg-[#181818] border-white/[0.08] text-white'
          }`}>
            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-black/[0.06] dark:border-white/[0.06]">
              <div>
                <div className="meta-label flex items-center gap-1.5 text-[#2563EB]">
                  <Sparkles className="w-3.5 h-3.5" />
                  ЭТАП ОБНОВЛЁН · СЛЕДУЮЩИЙ ШАГ
                </div>
                <h2 className="text-base font-semibold mt-1">Запланировать задачу по сделке</h2>
                <div className="text-xs text-neutral-500 mt-0.5">
                  «{followUpPrompt.deal.title}» · {followUpPrompt.deal.clientName}
                </div>
              </div>
              <button 
                onClick={handleSkipFollowUp} 
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-white"
                title="Закрыть без создания задачи"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Stage Transition Visual Indicator */}
            <div className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
              isLight ? 'bg-[#F8F7F4] border-black/[0.06]' : 'bg-[#222222] border-white/[0.06]'
            }`}>
              <div className="flex items-center gap-2">
                <span className="text-neutral-400">Переход:</span>
                <span className="font-medium text-neutral-600 dark:text-neutral-300">
                  {DEAL_STAGES.find(s => s.id === followUpPrompt.prevStage)?.title || followUpPrompt.prevStage}
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-[#2563EB]" />
                <span className="font-semibold text-[#2563EB]">
                  {DEAL_STAGES.find(s => s.id === followUpPrompt.newStage)?.title || followUpPrompt.newStage}
                </span>
              </div>
              <span className="text-[10px] font-mono text-neutral-400">
                Время: {formatLastModified(followUpPrompt.deal.updatedAt)}
              </span>
            </div>

            {/* Task Form */}
            <form onSubmit={handleSaveFollowUpTask} className="space-y-4 text-xs">
              <div>
                <label className="meta-label mb-1.5">Тема задачи:</label>
                <input
                  type="text"
                  required
                  value={followUpTitle}
                  onChange={(e) => setFollowUpTitle(e.target.value)}
                  placeholder="Что необходимо сделать..."
                  className={`w-full rounded-xl p-3 text-xs border focus:outline-none focus:ring-1 focus:ring-[#2563EB] ${
                    isLight ? 'bg-[#F8F7F4] border-black/[0.08] text-[#1A1A1A]' : 'bg-[#222222] border-white/[0.08] text-white'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Priority */}
                <div>
                  <label className="meta-label mb-1.5">Приоритет:</label>
                  <select
                    value={followUpPriority}
                    onChange={(e) => setFollowUpPriority(e.target.value as TaskPriority)}
                    className={`w-full rounded-lg p-2 text-xs border focus:outline-none focus:ring-1 focus:ring-[#2563EB] font-medium ${
                      isLight ? 'bg-[#F8F7F4] border-black/[0.08] text-[#1A1A1A]' : 'bg-[#222222] border-white/[0.08] text-white'
                    }`}
                  >
                    <option value="urgent">Срочно (Urgent)</option>
                    <option value="high">Высокий (High)</option>
                    <option value="medium">Средний (Medium)</option>
                    <option value="low">Низкий (Low)</option>
                  </select>
                </div>

                {/* Deadline */}
                <div>
                  <label className="meta-label mb-1.5">Дедлайн:</label>
                  <input
                    type="date"
                    required
                    value={followUpDeadline}
                    onChange={(e) => setFollowUpDeadline(e.target.value)}
                    className={`w-full rounded-lg p-2 text-xs font-mono border focus:outline-none focus:ring-1 focus:ring-[#2563EB] ${
                      isLight ? 'bg-[#F8F7F4] border-black/[0.08] text-[#1A1A1A]' : 'bg-[#222222] border-white/[0.08] text-white'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Task Type */}
                <div>
                  <label className="meta-label mb-1.5">Тип действия:</label>
                  <select
                    value={followUpType}
                    onChange={(e) => setFollowUpType(e.target.value as TaskType)}
                    className={`w-full rounded-lg p-2 text-xs border focus:outline-none focus:ring-1 focus:ring-[#2563EB] ${
                      isLight ? 'bg-[#F8F7F4] border-black/[0.08] text-[#1A1A1A]' : 'bg-[#222222] border-white/[0.08] text-white'
                    }`}
                  >
                    <option value="call">Телефонный звонок</option>
                    <option value="message">Сообщение / WhatsApp</option>
                    <option value="meeting">Встреча / Замер</option>
                    <option value="proposal">Подготовка КП / Расчёт</option>
                    <option value="payment">Контроль оплаты</option>
                    <option value="production">Производственный контроль</option>
                  </select>
                </div>

                {/* Assignee */}
                <div>
                  <label className="meta-label mb-1.5">Ответственный:</label>
                  <select
                    value={followUpAssignee}
                    onChange={(e) => setFollowUpAssignee(e.target.value)}
                    className={`w-full rounded-lg p-2 text-xs border focus:outline-none focus:ring-1 focus:ring-[#2563EB] ${
                      isLight ? 'bg-[#F8F7F4] border-black/[0.08] text-[#1A1A1A]' : 'bg-[#222222] border-white/[0.08] text-white'
                    }`}
                  >
                    {MANAGERS.map(m => (
                      <option key={m.id} value={m.name}>{m.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-black/[0.06] dark:border-white/[0.06]">
                <button
                  type="button"
                  onClick={handleSkipFollowUp}
                  className="px-4 py-2 text-xs font-mono text-neutral-500 hover:text-neutral-800 dark:hover:text-white transition-colors"
                >
                  ПРОПУСТИТЬ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
                >
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span>Создать задачу</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= EXISTING DEAL DETAILS MODAL ================= */}
      {activeModalDeal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className={`rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl border ${
            isLight ? 'bg-white border-black/[0.08] text-[#1A1A1A]' : 'bg-[#181818] border-white/[0.08] text-white'
          }`}>
            <div className="flex items-start justify-between pb-3 border-b border-black/[0.06] dark:border-white/[0.06]">
              <div>
                <div className="meta-label">Карточка сделки</div>
                <h2 className="text-base font-semibold mt-1">{activeModalDeal.title}</h2>
                <button
                  onClick={() => {
                    openClientCockpit(activeModalDeal.clientId);
                    setActiveModalDeal(null);
                  }}
                  className="text-xs text-[#2563EB] hover:underline mt-0.5 block font-mono"
                >
                  Клиент: {activeModalDeal.clientName} → В карточку
                </button>
              </div>
              <button onClick={() => setActiveModalDeal(null)} className="text-neutral-400 hover:text-neutral-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-[#F8F7F4] dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.06]">
                <div className="meta-label">Сумма</div>
                <div className="font-mono font-semibold text-sm text-[#1A1A1A] dark:text-white mt-1">{formatCurrency(activeModalDeal.amount)}</div>
              </div>
              <div className="p-3 rounded-lg bg-[#F8F7F4] dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.06]">
                <div className="meta-label">Себестоимость</div>
                <div className="font-mono font-semibold text-sm text-neutral-700 dark:text-neutral-300 mt-1">{formatCurrency(activeModalDeal.primeCost)}</div>
              </div>
              <div className="p-3 rounded-lg bg-[#F8F7F4] dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.06]">
                <div className="meta-label">Маржа</div>
                <div className="font-mono font-semibold text-sm text-emerald-600 dark:text-emerald-400 mt-1">{formatCurrency(activeModalDeal.margin)}</div>
              </div>
            </div>

            {/* Stage Selector */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="meta-label">ЭТАП СДЕЛКИ:</span>
                <span className="text-[10px] font-mono text-neutral-400">
                  Изменено: {formatLastModified(activeModalDeal.updatedAt)}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {DEAL_STAGES.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      moveDealToStage(activeModalDeal, s.id);
                      setActiveModalDeal({ ...activeModalDeal, stage: s.id, updatedAt: new Date().toISOString() });
                    }}
                    className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${
                      activeModalDeal.stage === s.id
                        ? 'bg-[#2563EB] text-white shadow-2xs font-semibold'
                        : 'bg-black/[0.05] dark:bg-white/[0.06] text-neutral-700 dark:text-neutral-300 hover:bg-black/[0.1] dark:hover:bg-white/[0.1]'
                    }`}
                  >
                    {s.title}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-4 border-t border-black/[0.06] dark:border-white/[0.06]">
              <button
                onClick={() => {
                  moveDealToStage(activeModalDeal, 'closed_lost');
                  setActiveModalDeal(null);
                }}
                className="px-3.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors font-medium font-mono"
              >
                ОТКАЗ
              </button>
              <button
                onClick={() => setActiveModalDeal(null)}
                className="px-4 py-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-lg text-xs font-semibold transition-colors shadow-2xs"
              >
                Готово
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
