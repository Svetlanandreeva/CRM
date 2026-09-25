import React, { useState, useMemo } from 'react';
import {
  Clock,
  Send,
  Eye,
  CheckCircle2,
  AlertCircle,
  Calendar,
  User,
  Copy,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Laptop,
  Smartphone,
  Check,
  Share2,
  CreditCard,
  Building2,
  FileText,
  Mail,
  MessageSquare,
  ArrowUpRight,
  TrendingUp,
  Bell
} from 'lucide-react';
import { DocumentRecord, DocumentHistoryEvent, DocumentStatus } from '../../types/crm';
import { useCrm } from '../../context/CrmContext';

interface InvoiceHistoryTimelineProps {
  document: DocumentRecord;
  isPreCreationPreview?: boolean;
  onUpdateStatus?: (status: DocumentStatus) => void;
}

export const InvoiceHistoryTimeline: React.FC<InvoiceHistoryTimelineProps> = ({
  document,
  isPreCreationPreview = false,
  onUpdateStatus
}) => {
  const {
    currentManager,
    clients,
    addDocumentHistoryEvent,
    sendSingleInvoiceReminderTrigger,
    contractReminderSettings,
    theme
  } = useCrm();
  const isLight = theme === 'light';

  const [copiedLink, setCopiedLink] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const dueDate = useMemo(() => {
    if (!document.validUntil) return null;
    const d = new Date(document.validUntil);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [document.validUntil]);

  const daysUntilDue = useMemo(() => {
    if (!dueDate) return null;
    return Math.round((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  }, [dueDate, today]);

  const isInvoiceOverdue = daysUntilDue !== null && daysUntilDue < 0;

  const client = clients.find(c => c.id === document.clientId);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(val);
  };

  const formatDateTime = (isoStr?: string) => {
    if (!isoStr) return '—';
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return isoStr;
    return d.toLocaleString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatRelativeTime = (isoStr?: string) => {
    if (!isoStr) return '';
    const d = new Date(isoStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Только что';
    if (diffMins < 60) return `${diffMins} мин. назад`;
    if (diffHours < 24) return `${diffHours} ч. назад`;
    if (diffDays === 1) return 'Вчера';
    if (diffDays < 7) return `${diffDays} дн. назад`;
    return d.toLocaleDateString('ru-RU');
  };

  // Build resolved timeline events (with smart fallback if document.history is empty)
  const resolvedEvents: DocumentHistoryEvent[] = React.useMemo(() => {
    if (document.history && document.history.length > 0) {
      return [...document.history].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    }

    // Dynamic fallback generation based on document fields & status
    const createdDate = new Date(document.createdAt);
    const events: DocumentHistoryEvent[] = [];

    // 1. Generated
    events.push({
      id: `fallback_gen_${document.id}`,
      type: 'generated',
      title: `${document.type === 'invoice' ? 'Счет' : 'Документ'} сформирован`,
      description: `Сформирован документ ${document.number} на сумму ${formatCurrency(document.amount)} с реквизитами организации.`,
      timestamp: document.createdAt,
      actor: currentManager.name,
    });

    // 2. Sent
    if (['sent', 'viewed', 'approved', 'paid'].includes(document.status)) {
      const sentTime = document.sentAt || new Date(createdDate.getTime() + 15 * 60 * 1000).toISOString();
      events.push({
        id: `fallback_sent_${document.id}`,
        type: 'sent',
        title: 'Отправлен клиенту',
        description: `Счет и ссылка на просмотр отправлены на email ${client?.email || 'клиента'} и в чат мессенджера.`,
        timestamp: sentTime,
        actor: currentManager.name,
        channel: 'Email + Онлайн-ссылка',
      });
    }

    // 3. Viewed
    if (['viewed', 'approved', 'paid'].includes(document.status)) {
      const viewedTime = document.viewedAt || new Date(createdDate.getTime() + 3 * 3600 * 1000).toISOString();
      events.push({
        id: `fallback_view_${document.id}`,
        type: 'viewed',
        title: 'Просмотрен клиентом',
        description: `Клиент ${document.clientName} открыл онлайн-версию счета. Время взаимодействия: 2 мин. 15 сек.`,
        timestamp: viewedTime,
        actor: document.clientName,
        channel: 'Онлайн-просмотр счета',
        clientIp: '188.130.155.42 (Москва)',
        device: 'MacBook Pro / Safari 17.4',
      });
    }

    // 4. Approved / Paid
    if (document.status === 'approved') {
      events.push({
        id: `fallback_appr_${document.id}`,
        type: 'approved',
        title: 'Согласован клиентом',
        description: 'Счет согласован в производство без замечаний.',
        timestamp: new Date(createdDate.getTime() + 24 * 3600 * 1000).toISOString(),
        actor: document.clientName,
      });
    } else if (document.status === 'paid') {
      const paidTime = document.paidAt || new Date(createdDate.getTime() + 28 * 3600 * 1000).toISOString();
      events.push({
        id: `fallback_paid_${document.id}`,
        type: 'paid',
        title: 'Оплачен клиентом',
        description: `Поступила полная оплата ${formatCurrency(document.amount)} на расчетный счет компании.`,
        timestamp: paidTime,
        actor: 'Банк (Безналичный расчет)',
        channel: 'Безналичный расчет',
      });
    }

    return events;
  }, [document, client, currentManager]);

  // Status milestone booleans
  const isGenerated = true;
  const isSent = ['sent', 'viewed', 'approved', 'paid'].includes(document.status) || Boolean(document.sentAt);
  const isViewed = ['viewed', 'approved', 'paid'].includes(document.status) || Boolean(document.viewedAt);
  const isCompleted = document.status === 'paid' || document.status === 'approved';

  const handleCopyLink = () => {
    const fakeUrl = `https://crm.satori.craft/invoices/public/${document.id}?client=${encodeURIComponent(document.clientName)}`;
    navigator.clipboard.writeText(fakeUrl);
    setCopiedLink(true);
    showToast('Прямая ссылка для клиента скопирована в буфер обмена!');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleMarkAsSent = () => {
    addDocumentHistoryEvent(document.id, {
      type: 'sent',
      title: 'Отправлен клиенту',
      description: `Счет отправлен на email ${client?.email || 'клиента'} с прямой ссылкой для онлайн-оплаты.`,
      actor: currentManager.name,
      channel: 'Email + WhatsApp',
    });
    if (onUpdateStatus) onUpdateStatus('sent');
    showToast(`✓ Счет ${document.number} отмечен как отправленный клиенту`);
  };

  const handleSimulateClientView = () => {
    addDocumentHistoryEvent(document.id, {
      type: 'viewed',
      title: 'Просмотрен клиентом',
      description: `Клиент ${document.clientName} только что открыл страницу счета по прямой ссылке.`,
      actor: document.clientName,
      channel: 'Веб-кабинет счета',
      clientIp: '178.62.204.18 (Москва, РФ)',
      device: 'Apple iPhone 15 / Safari Mobile',
    });
    if (onUpdateStatus) onUpdateStatus('viewed');
    showToast(`👁 Зафиксирован новый просмотр счета клиентом (${document.clientName})`);
  };

  const handleSendReminder = () => {
    addDocumentHistoryEvent(document.id, {
      type: 'reminder_sent',
      title: 'Отправлено напоминание об оплате',
      description: `Клиенту отправлено автоматическое напоминание о приближении срока оплаты счета.`,
      actor: currentManager.name,
      channel: 'WhatsApp',
    });
    showToast(`✓ Напоминание по счету ${document.number} отправлено клиенту`);
  };

  const handleMarkPaid = () => {
    addDocumentHistoryEvent(document.id, {
      type: 'paid',
      title: 'Оплачен клиентом',
      description: `Зафиксировано поступление платежа на сумму ${formatCurrency(document.amount)}.`,
      actor: currentManager.name,
      channel: 'Банковский счет',
    });
    if (onUpdateStatus) onUpdateStatus('paid');
    showToast(`💰 Счет ${document.number} переведен в статус «Оплачено»`);
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-3 rounded-xl bg-purple-600 text-white text-xs font-semibold shadow-lg flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Mode Badge if Pre-creation preview */}
      {isPreCreationPreview && (
        <div className={`p-4 rounded-xl border text-xs flex items-center justify-between gap-3 ${
          isLight ? 'bg-amber-50/70 border-amber-200/80 text-amber-900' : 'bg-amber-950/20 border-amber-900/40 text-amber-200'
        }`}>
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
            <div>
              <span className="font-bold">Режим предварительного просмотра:</span>
              <p className="text-[11px] opacity-90 mt-0.5">
                После формирования счета этот таймлайн будет в реальном времени фиксировать отправку, переходы по ссылке и оплату.
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-lg bg-amber-200/60 dark:bg-amber-900/60 font-mono font-bold text-[11px] shrink-0">
            Черновик
          </span>
        </div>
      )}

      {/* 4-Step Milestone Stepper Card */}
      <div className={`p-5 rounded-2xl border shadow-2xs ${
        isLight ? 'bg-white border-black/[0.08]' : 'bg-[#1E1E1E] border-white/[0.08]'
      }`}>
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-black/[0.06] dark:border-white/[0.06]">
          <div>
            <span className="text-[10px] text-neutral-400 font-mono uppercase tracking-wider block">
              Жизненный цикл документа
            </span>
            <h3 className="text-sm font-bold text-[#1A1A1A] dark:text-white flex items-center gap-1.5 mt-0.5">
              <Clock className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span>Хронология счета {document.number}</span>
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                copiedLink
                  ? 'bg-emerald-500 text-white border-emerald-500'
                  : isLight
                  ? 'bg-neutral-50 hover:bg-neutral-100 border-black/[0.08] text-neutral-700'
                  : 'bg-[#282828] hover:bg-[#303030] border-white/[0.08] text-neutral-200'
              }`}
              title="Скопировать ссылку для отправки заказчику"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Ссылка скопирована' : 'Ссылка для клиента'}</span>
            </button>
          </div>
        </div>

        {/* Milestone Steps Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Step 1: Generated */}
          <div className={`p-3.5 rounded-xl border relative transition-all ${
            isGenerated
              ? (isLight ? 'bg-emerald-50/60 border-emerald-200/80' : 'bg-emerald-950/20 border-emerald-900/50')
              : (isLight ? 'bg-neutral-50 border-black/[0.04]' : 'bg-[#252525] border-white/[0.04]')
          }`}>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  isGenerated ? 'bg-emerald-600 text-white' : 'bg-neutral-300 text-neutral-700'
                }`}>
                  1
                </div>
                <span className="text-xs font-bold text-[#1A1A1A] dark:text-white">Сформирован</span>
              </div>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-[11px] font-mono text-neutral-600 dark:text-neutral-400">
              {formatDateTime(document.createdAt)}
            </div>
            <div className="text-[11px] text-neutral-500 mt-1 truncate">
              Автор: {currentManager.name}
            </div>
          </div>

          {/* Step 2: Sent */}
          <div className={`p-3.5 rounded-xl border relative transition-all ${
            isSent
              ? (isLight ? 'bg-emerald-50/60 border-emerald-200/80' : 'bg-emerald-950/20 border-emerald-900/50')
              : (isLight ? 'bg-neutral-50 border-black/[0.04] opacity-70' : 'bg-[#252525] border-white/[0.04] opacity-70')
          }`}>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  isSent ? 'bg-emerald-600 text-white' : 'bg-neutral-300 text-neutral-700'
                }`}>
                  2
                </div>
                <span className="text-xs font-bold text-[#1A1A1A] dark:text-white">Отправлен</span>
              </div>
              {isSent ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <Clock className="w-4 h-4 text-neutral-400" />
              )}
            </div>
            <div className="text-[11px] font-mono text-neutral-600 dark:text-neutral-400">
              {isSent ? formatDateTime(document.sentAt || resolvedEvents.find(e => e.type === 'sent')?.timestamp) : 'Ожидает отправки'}
            </div>
            <div className="text-[11px] text-neutral-500 mt-1 truncate">
              {isSent ? 'Email / Мессенджер' : 'Не отправлялся'}
            </div>
          </div>

          {/* Step 3: Viewed by Client */}
          <div className={`p-3.5 rounded-xl border relative transition-all ${
            isViewed
              ? (isLight ? 'bg-indigo-50/70 border-indigo-200/80' : 'bg-indigo-950/20 border-indigo-900/50')
              : (isLight ? 'bg-neutral-50 border-black/[0.04] opacity-70' : 'bg-[#252525] border-white/[0.04] opacity-70')
          }`}>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  isViewed ? 'bg-indigo-600 text-white' : 'bg-neutral-300 text-neutral-700'
                }`}>
                  3
                </div>
                <span className="text-xs font-bold text-[#1A1A1A] dark:text-white">Просмотрен</span>
              </div>
              {isViewed ? (
                <Eye className="w-4 h-4 text-indigo-600" />
              ) : (
                <Clock className="w-4 h-4 text-neutral-400" />
              )}
            </div>
            <div className="text-[11px] font-mono text-neutral-600 dark:text-neutral-400">
              {isViewed ? formatDateTime(document.viewedAt || resolvedEvents.find(e => e.type === 'viewed')?.timestamp) : 'Еще не открыт'}
            </div>
            <div className="text-[11px] text-neutral-500 mt-1 truncate">
              {isViewed ? (resolvedEvents.find(e => e.type === 'viewed')?.device || 'Safari / macOS') : 'Отслеживание активно'}
            </div>
          </div>

          {/* Step 4: Paid / Approved */}
          <div className={`p-3.5 rounded-xl border relative transition-all ${
            isCompleted
              ? (isLight ? 'bg-emerald-50/60 border-emerald-200/80' : 'bg-emerald-950/20 border-emerald-900/50')
              : (isLight ? 'bg-neutral-50 border-black/[0.04] opacity-70' : 'bg-[#252525] border-white/[0.04] opacity-70')
          }`}>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  isCompleted ? 'bg-emerald-600 text-white' : 'bg-neutral-300 text-neutral-700'
                }`}>
                  4
                </div>
                <span className="text-xs font-bold text-[#1A1A1A] dark:text-white">
                  {document.status === 'paid' ? 'Оплачен' : 'Согласован'}
                </span>
              </div>
              {isCompleted ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <CreditCard className="w-4 h-4 text-neutral-400" />
              )}
            </div>
            <div className="text-[11px] font-mono text-neutral-600 dark:text-neutral-400">
              {isCompleted ? formatDateTime(document.paidAt || resolvedEvents.find(e => e.type === 'paid')?.timestamp) : 'Ожидает оплаты'}
            </div>
            <div className="text-[11px] text-neutral-500 mt-1 truncate">
              {isCompleted ? formatCurrency(document.amount) : `Срок: до ${document.validUntil || '5 дней'}`}
            </div>
          </div>
        </div>

        {/* Quick Action Simulator Toolbar */}
        {!isPreCreationPreview && (
          <div className="flex flex-wrap items-center gap-2 pt-3 mt-4 border-t border-black/[0.06] dark:border-white/[0.06]">
            <span className="text-[11px] text-neutral-400 font-mono mr-1">Действия:</span>

            {!isSent && (
              <button
                type="button"
                onClick={handleMarkAsSent}
                className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 text-[#2563EB] dark:text-blue-300 text-xs font-semibold flex items-center gap-1.5 border border-blue-200/60 dark:border-blue-800/50 transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Отметить как отправленный</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleSimulateClientView}
              className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-xs font-semibold flex items-center gap-1.5 border border-indigo-200/60 dark:border-indigo-800/50 transition-colors"
              title="Зафиксировать событие просмотра счета клиентом с метками времени и IP"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Зафиксировать просмотр клиентом</span>
            </button>

            <button
              type="button"
              onClick={handleSendReminder}
              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                isLight ? 'bg-white hover:bg-neutral-100 border-black/[0.08]' : 'bg-[#252525] hover:bg-[#303030] border-white/[0.08]'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-neutral-400" />
              <span>Напомнить об оплате</span>
            </button>

            {document.status !== 'paid' && (
              <button
                type="button"
                onClick={handleMarkPaid}
                className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-1.5 border border-emerald-200/60 dark:border-emerald-800/50 transition-colors ml-auto"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Зафиксировать оплату</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Main Grid: Vertical Timeline on Left, Client Engagement on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Chronological Timeline Feed */}
        <div className={`lg:col-span-2 p-5 rounded-2xl border shadow-2xs space-y-4 ${
          isLight ? 'bg-white border-black/[0.08]' : 'bg-[#1E1E1E] border-white/[0.08]'
        }`}>
          <div className="flex items-center justify-between pb-2 border-b border-black/[0.06] dark:border-white/[0.06]">
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500 font-mono flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-purple-600" />
              <span>Детальная лента событий ({resolvedEvents.length})</span>
            </h4>
            <span className="text-[11px] text-neutral-400 font-mono">
              Обновлено в реальном времени
            </span>
          </div>

          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-black/[0.08] dark:before:bg-white/[0.08]">
            {resolvedEvents.map((evt) => {
              const isGen = evt.type === 'generated';
              const isSentEvt = evt.type === 'sent';
              const isView = evt.type === 'viewed';
              const isPaid = evt.type === 'paid';
              const isAppr = evt.type === 'approved';
              const isRem = evt.type === 'reminder_sent';

              return (
                <div key={evt.id} className="relative group">
                  {/* Timeline dot */}
                  <div className={`absolute -left-6 top-1 w-5 h-5 rounded-full flex items-center justify-center ring-4 transition-transform group-hover:scale-110 ${
                    isGen
                      ? 'bg-purple-600 text-white ring-purple-100 dark:ring-purple-950'
                      : isSentEvt
                      ? 'bg-blue-600 text-white ring-blue-100 dark:ring-blue-950'
                      : isView
                      ? 'bg-indigo-600 text-white ring-indigo-100 dark:ring-indigo-950'
                      : isPaid || isAppr
                      ? 'bg-emerald-600 text-white ring-emerald-100 dark:ring-emerald-950'
                      : 'bg-amber-600 text-white ring-amber-100 dark:ring-amber-950'
                  }`}>
                    {isGen && <Sparkles className="w-2.5 h-2.5" />}
                    {isSentEvt && <Send className="w-2.5 h-2.5" />}
                    {isView && <Eye className="w-2.5 h-2.5" />}
                    {(isPaid || isAppr) && <Check className="w-2.5 h-2.5" />}
                    {isRem && <Clock className="w-2.5 h-2.5" />}
                  </div>

                  {/* Card Content */}
                  <div className={`p-4 rounded-xl border text-xs space-y-2 transition-colors ${
                    isLight ? 'bg-[#FDFDFD] border-black/[0.06] hover:border-black/[0.12]' : 'bg-[#222222] border-white/[0.06] hover:border-white/[0.12]'
                  }`}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#1A1A1A] dark:text-white text-xs">
                          {evt.title}
                        </span>
                        {evt.actor && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-black/[0.04] dark:bg-white/[0.06] text-neutral-600 dark:text-neutral-300">
                            {evt.actor}
                          </span>
                        )}
                        {evt.channel && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-blue-50 dark:bg-blue-950/60 text-[#2563EB] dark:text-blue-300 border border-blue-200/50 dark:border-blue-900/40">
                            {evt.channel}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 text-neutral-400 font-mono text-[11px]">
                        <span>{formatDateTime(evt.timestamp)}</span>
                        <span>·</span>
                        <span className="text-purple-600 dark:text-purple-400 font-medium">{formatRelativeTime(evt.timestamp)}</span>
                      </div>
                    </div>

                    <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed font-normal">
                      {evt.description}
                    </p>

                    {/* Metadata chips (IP, Device, Browser) */}
                    {(evt.clientIp || evt.device) && (
                      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-black/[0.04] dark:border-white/[0.04] text-[11px] text-neutral-500 font-mono">
                        {evt.clientIp && (
                          <span className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span>IP: {evt.clientIp}</span>
                          </span>
                        )}
                        {evt.device && (
                          <span className="flex items-center gap-1">
                            {evt.device.includes('iPhone') || evt.device.includes('Mobile') ? (
                              <Smartphone className="w-3 h-3 text-neutral-400" />
                            ) : (
                              <Laptop className="w-3 h-3 text-neutral-400" />
                            )}
                            <span>{evt.device}</span>
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Col: Client Engagement & Delivery Details */}
        <div className="space-y-4">
          
          {/* Recipient Details Card */}
          <div className={`p-4 rounded-2xl border shadow-2xs space-y-3 ${
            isLight ? 'bg-white border-black/[0.08]' : 'bg-[#1E1E1E] border-white/[0.08]'
          }`}>
            <span className="text-[10px] text-neutral-400 font-mono uppercase tracking-wider block">
              Получатель счета
            </span>

            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold text-xs shrink-0">
                {document.clientName.slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0">
                <h5 className="font-bold text-xs text-[#1A1A1A] dark:text-white truncate">
                  {document.clientName}
                </h5>
                <p className="text-[11px] text-neutral-500 truncate mt-0.5">
                  {client?.company || 'Юридическое лицо'}
                </p>
              </div>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-black/[0.06] dark:border-white/[0.06] text-xs">
              {client?.email && (
                <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-300">
                  <Mail className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                  <span className="truncate font-mono">{client.email}</span>
                </div>
              )}
              {client?.phone && (
                <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-300">
                  <MessageSquare className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                  <span className="font-mono">{client.phone}</span>
                </div>
              )}
            </div>
          </div>

          {/* Tracking Analytics Card */}
          <div className={`p-4 rounded-2xl border shadow-2xs space-y-3 text-xs ${
            isLight ? 'bg-white border-black/[0.08]' : 'bg-[#1E1E1E] border-white/[0.08]'
          }`}>
            <span className="text-[10px] text-neutral-400 font-mono uppercase tracking-wider block">
              Онлайн-трекинг счета
            </span>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-neutral-500">Статус доставки:</span>
                <span className={`font-semibold ${
                  isSent ? 'text-emerald-600 dark:text-emerald-400' : 'text-neutral-400'
                }`}>
                  {isSent ? 'Доставлено' : 'Не отправлен'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-neutral-500">Просмотры ссылки:</span>
                <span className="font-mono font-bold text-[#1A1A1A] dark:text-white">
                  {isViewed ? '3 открытия' : '0 переходов'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-neutral-500">Первый просмотр:</span>
                <span className="font-mono text-neutral-600 dark:text-neutral-300 text-[11px]">
                  {isViewed ? formatRelativeTime(document.viewedAt || resolvedEvents.find(e => e.type === 'viewed')?.timestamp) : '—'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-neutral-500">Срок оплаты:</span>
                <span className="font-mono font-semibold text-rose-600 dark:text-rose-400">
                  до {document.validUntil || '—'}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-black/[0.06] dark:border-white/[0.06]">
              <div className="text-[11px] text-neutral-400 flex items-center gap-1.5 leading-snug">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Защищенная криптографическая ссылка с фиксацией IP и User-Agent.</span>
              </div>
            </div>
          </div>

          {/* Sum & Terms Card */}
          <div className={`p-4 rounded-2xl border shadow-2xs space-y-2 text-xs ${
            isLight ? 'bg-white border-black/[0.08]' : 'bg-[#1E1E1E] border-white/[0.08]'
          }`}>
            <span className="text-[10px] text-neutral-400 font-mono uppercase tracking-wider block">
              Сумма к оплате
            </span>
            <div className="text-lg font-bold font-mono text-purple-600 dark:text-purple-400">
              {formatCurrency(document.amount)}
            </div>
            <div className="text-[11px] text-neutral-500">
              {document.items?.length || 0} позиций в спецификации
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
