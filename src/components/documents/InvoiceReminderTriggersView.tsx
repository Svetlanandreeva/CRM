import React, { useState, useMemo } from 'react';
import {
  Bell,
  AlertTriangle,
  Clock,
  Send,
  Settings,
  RefreshCw,
  CheckCircle2,
  FileText,
  Building2,
  Mail,
  MessageSquare,
  ArrowUpRight,
  ShieldAlert,
  Calendar,
  Sparkles,
  ExternalLink,
  ChevronDown,
  Check,
  X,
  Sliders,
  DollarSign,
  AlertCircle
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import {
  DocumentRecord,
  CommunicationChannel,
  ContractReminderSettings,
  InvoiceReminderTriggerLog
} from '../../types/crm';
import { ContractReminderSettingsModal } from './ContractReminderSettingsModal';

interface InvoiceReminderTriggersViewProps {
  onOpenPreviewDoc: (doc: DocumentRecord) => void;
}

export const InvoiceReminderTriggersView: React.FC<InvoiceReminderTriggersViewProps> = ({
  onOpenPreviewDoc,
}) => {
  const {
    documents,
    clients,
    contractReminderSettings,
    invoiceReminderLogs,
    runInvoiceReminderTriggers,
    sendSingleInvoiceReminderTrigger,
    openClientCockpit,
    theme
  } = useCrm();

  const isLight = theme === 'light';

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isRunningCheck, setIsRunningCheck] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'approaching' | 'overdue'>('all');
  const [selectedChannelPerDoc, setSelectedChannelPerDoc] = useState<Record<string, CommunicationChannel>>({});

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(val);
  };

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // Compute status for all unpaid invoices with due dates
  const invoiceTriggerItems = useMemo(() => {
    return documents
      .filter((d) => d.type === 'invoice' && d.status !== 'paid' && d.validUntil)
      .map((doc) => {
        const dueDate = new Date(doc.validUntil!);
        dueDate.setHours(0, 0, 0, 0);
        const diffTime = dueDate.getTime() - today.getTime();
        const daysUntilDue = Math.round(diffTime / (1000 * 60 * 60 * 24));
        const isOverdue = daysUntilDue < 0;
        const daysOverdue = Math.abs(daysUntilDue);

        const isApproaching =
          (daysUntilDue >= 0 && daysUntilDue <= contractReminderSettings.remindDaysBeforeDue);

        const client = clients.find((c) => c.id === doc.clientId);

        const penaltyAmount = isOverdue
          ? Math.round(doc.amount * (contractReminderSettings.penaltyPercentPerDay / 100) * daysOverdue)
          : 0;

        return {
          doc,
          client,
          dueDate,
          daysUntilDue,
          isOverdue,
          daysOverdue,
          isApproaching,
          penaltyAmount,
        };
      })
      .filter(item => item.isApproaching || item.isOverdue);
  }, [documents, clients, today, contractReminderSettings]);

  const approachingList = useMemo(() => {
    return invoiceTriggerItems.filter(item => item.isApproaching && !item.isOverdue);
  }, [invoiceTriggerItems]);

  const overdueList = useMemo(() => {
    return invoiceTriggerItems.filter(item => item.isOverdue);
  }, [invoiceTriggerItems]);

  const filteredDisplayItems = useMemo(() => {
    if (filterType === 'approaching') return approachingList;
    if (filterType === 'overdue') return overdueList;
    return invoiceTriggerItems;
  }, [filterType, approachingList, overdueList, invoiceTriggerItems]);

  const totalApproachingAmount = approachingList.reduce((s, it) => s + it.doc.amount, 0);
  const totalOverdueAmount = overdueList.reduce((s, it) => s + it.doc.amount, 0);
  const totalPenalties = overdueList.reduce((s, it) => s + it.penaltyAmount, 0);

  const handleRunGlobalTriggers = () => {
    setIsRunningCheck(true);
    setTimeout(() => {
      const res = runInvoiceReminderTriggers(true);
      setIsRunningCheck(false);
      if (res.triggeredApproaching > 0 || res.triggeredOverdue > 0) {
        showToast(`⚡ Отправлено ${res.triggeredApproaching + res.triggeredOverdue} триггеров клиентам (подходит срок: ${res.triggeredApproaching}, просрочено: ${res.triggeredOverdue})!`);
      } else {
        showToast('✓ Все триггеры проверены. Нет новых сообщений, требующих немедленной отправки.');
      }
    }, 700);
  };

  const handleTriggerSingle = (
    docId: string,
    triggerType: 'approaching_due' | 'overdue',
    docNumber: string
  ) => {
    const ch = selectedChannelPerDoc[docId];
    const res = sendSingleInvoiceReminderTrigger(docId, triggerType, ch);
    if (res.success) {
      showToast(`✓ Авто-триггер по счету ${docNumber} успешно отправлен клиенту!`);
    } else {
      showToast(`Ошибка: ${res.error || 'Не удалось отправить триггер'}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="px-4 py-3 rounded-xl bg-purple-600 text-white text-xs font-semibold shadow-xl flex items-center gap-2">
            <Sparkles className="w-4 h-4 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Top Banner & Trigger Action Controls */}
      <div className={`p-6 rounded-2xl border shadow-2xs ${
        isLight ? 'bg-white border-black/[0.08]' : 'bg-[#1E1E1E] border-white/[0.08]'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
                <Bell className="w-5 h-5" />
              </span>
              <h2 className="text-base font-bold text-[#1A1A1A] dark:text-white">
                Автоматические триггеры и напоминания клиентам по договорам
              </h2>
            </div>
            <p className="text-xs text-neutral-500">
              Система автоматически отслеживает приближение срока оплаты и просрочку счетов, формирует персонализированные email/сообщения и отправляет их клиентам согласно условиям договора.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className={`px-3.5 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                isLight ? 'bg-neutral-50 hover:bg-neutral-100 border-black/[0.08] text-neutral-700' : 'bg-[#252525] hover:bg-[#303030] border-white/[0.08] text-neutral-200'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Настройки правил</span>
            </button>

            <button
              type="button"
              onClick={handleRunGlobalTriggers}
              disabled={isRunningCheck}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRunningCheck ? 'animate-spin' : ''}`} />
              <span>{isRunningCheck ? 'Проверка и отправка...' : 'Запустить триггеры сейчас'}</span>
            </button>
          </div>
        </div>

        {/* 4 Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          {/* 1. Approaching Due Date */}
          <div className={`p-4 rounded-xl border transition-all ${
            isLight ? 'bg-amber-50/50 border-amber-200/70' : 'bg-amber-950/20 border-amber-900/40'
          }`}>
            <div className="flex items-center justify-between text-xs text-amber-800 dark:text-amber-300 font-semibold mb-1">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>Подходит срок оплаты</span>
              </span>
              <span className="font-mono px-2 py-0.5 rounded-full bg-amber-200/60 dark:bg-amber-900/60 text-[10px]">
                {approachingList.length} счетов
              </span>
            </div>
            <div className="text-xl font-bold font-mono text-amber-900 dark:text-amber-200 mt-2">
              {formatCurrency(totalApproachingAmount)}
            </div>
            <div className="text-[11px] text-amber-700/80 dark:text-amber-400 mt-1">
              Триггер за {contractReminderSettings.remindDaysBeforeDue} дн. до срока
            </div>
          </div>

          {/* 2. Overdue */}
          <div className={`p-4 rounded-xl border transition-all ${
            isLight ? 'bg-rose-50/50 border-rose-200/70' : 'bg-rose-950/20 border-rose-900/40'
          }`}>
            <div className="flex items-center justify-between text-xs text-rose-800 dark:text-rose-300 font-semibold mb-1">
              <span className="flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                <span>Просроченная задолженность</span>
              </span>
              <span className="font-mono px-2 py-0.5 rounded-full bg-rose-200/60 dark:bg-rose-900/60 text-[10px]">
                {overdueList.length} счетов
              </span>
            </div>
            <div className="text-xl font-bold font-mono text-rose-900 dark:text-rose-200 mt-2">
              {formatCurrency(totalOverdueAmount)}
            </div>
            <div className="text-[11px] text-rose-700/80 dark:text-rose-400 mt-1">
              {totalPenalties > 0 ? `Пени по договорам: ${formatCurrency(totalPenalties)}` : 'Претензионный контроль'}
            </div>
          </div>

          {/* 3. Automation Status */}
          <div className={`p-4 rounded-xl border ${
            isLight ? 'bg-neutral-50 border-black/[0.06]' : 'bg-[#252525] border-white/[0.06]'
          }`}>
            <div className="flex items-center justify-between text-xs text-neutral-500 font-semibold mb-1">
              <span className="flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-purple-600" />
                <span>Статус авто-триггеров</span>
              </span>
              <span className={`w-2 h-2 rounded-full ${contractReminderSettings.enabled ? 'bg-emerald-500 animate-pulse' : 'bg-neutral-400'}`} />
            </div>
            <div className="text-sm font-bold text-[#1A1A1A] dark:text-white mt-2">
              {contractReminderSettings.enabled ? 'Активны (каждые 30 сек)' : 'Отключены'}
            </div>
            <div className="text-[11px] text-neutral-400 mt-1 truncate">
              Каналы: {contractReminderSettings.channels.join(', ').toUpperCase()}
            </div>
          </div>

          {/* 4. Total Triggers Dispatched */}
          <div className={`p-4 rounded-xl border ${
            isLight ? 'bg-neutral-50 border-black/[0.06]' : 'bg-[#252525] border-white/[0.06]'
          }`}>
            <div className="flex items-center justify-between text-xs text-neutral-500 font-semibold mb-1">
              <span className="flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5 text-blue-600" />
                <span>Отправлено клиентам</span>
              </span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <div className="text-xl font-bold font-mono text-[#1A1A1A] dark:text-white mt-2">
              {invoiceReminderLogs.length} уведомлений
            </div>
            <div className="text-[11px] text-neutral-400 mt-1">
              В чаты WhatsApp, Telegram и Email
            </div>
          </div>
        </div>
      </div>

      {/* Actionable Invoices Table */}
      <div className={`rounded-2xl border shadow-2xs overflow-hidden ${
        isLight ? 'bg-white border-black/[0.08]' : 'bg-[#1E1E1E] border-white/[0.08]'
      }`}>
        {/* Table Header & Sub-filter Buttons */}
        <div className="p-4 border-b border-black/[0.06] dark:border-white/[0.06] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-[#1A1A1A] dark:text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-purple-600" />
              <span>Счета, требующие уведомления ({filteredDisplayItems.length})</span>
            </h3>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                filterType === 'all'
                  ? 'bg-purple-600 text-white'
                  : 'bg-black/[0.04] dark:bg-white/[0.06] text-neutral-600 dark:text-neutral-300'
              }`}
            >
              Все ({invoiceTriggerItems.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('approaching')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                filterType === 'approaching'
                  ? 'bg-amber-600 text-white'
                  : 'bg-black/[0.04] dark:bg-white/[0.06] text-neutral-600 dark:text-neutral-300'
              }`}
            >
              Подходит срок ({approachingList.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('overdue')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                filterType === 'overdue'
                  ? 'bg-rose-600 text-white'
                  : 'bg-black/[0.04] dark:bg-white/[0.06] text-neutral-600 dark:text-neutral-300'
              }`}
            >
              Просроченные ({overdueList.length})
            </button>
          </div>
        </div>

        {/* Invoices List Table */}
        {filteredDisplayItems.length === 0 ? (
          <div className="p-12 text-center text-neutral-400 text-xs">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
            <p className="font-semibold text-sm text-[#1A1A1A] dark:text-white">Все счета в порядке!</p>
            <p className="mt-1">Нет счетов с приближающимся сроком оплаты или просроченной задолженностью.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className={`border-b text-[11px] font-mono uppercase tracking-wider ${
                  isLight ? 'bg-[#F9F9FB] border-black/[0.06] text-neutral-500' : 'bg-[#191919] border-white/[0.06] text-neutral-400'
                }`}>
                  <th className="py-3 px-4">Счет / Договор</th>
                  <th className="py-3 px-4">Заказчик</th>
                  <th className="py-3 px-4">Сумма</th>
                  <th className="py-3 px-4">Срок оплаты</th>
                  <th className="py-3 px-4">Статус триггера</th>
                  <th className="py-3 px-4">Канал отправки</th>
                  <th className="py-3 px-4 text-right">Действие</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.04]">
                {filteredDisplayItems.map(({ doc, client, dueDate, daysUntilDue, isOverdue, daysOverdue, penaltyAmount }) => {
                  const selectedChannel = selectedChannelPerDoc[doc.id] ||
                    (client?.whatsapp || client?.phone ? 'whatsapp' : client?.email ? 'email' : 'telegram');

                  const triggerSentCount = doc.remindersSentCount || 0;
                  const alreadySentToday = doc.lastReminderSentAt && doc.lastReminderSentAt.split('T')[0] === today.toISOString().split('T')[0];

                  return (
                    <tr
                      key={doc.id}
                      className={`transition-colors ${
                        isLight ? 'hover:bg-neutral-50/70' : 'hover:bg-white/[0.02]'
                      }`}
                    >
                      {/* Document & Contract */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => onOpenPreviewDoc(doc)}
                            className="font-mono font-bold text-[#2563EB] hover:underline"
                          >
                            {doc.number}
                          </button>
                        </div>
                        <div className="text-[11px] text-neutral-500 font-mono mt-0.5 flex items-center gap-1 truncate max-w-xs">
                          <span>{doc.contractNumber || 'ДОГ-2026/01'}</span>
                        </div>
                        <div className="text-[11px] text-neutral-400 truncate max-w-xs mt-0.5">
                          {doc.title}
                        </div>
                      </td>

                      {/* Client */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="font-semibold text-[#1A1A1A] dark:text-white flex items-center gap-1.5">
                          <span>{doc.clientName}</span>
                          <button
                            type="button"
                            onClick={() => openClientCockpit(doc.clientId)}
                            className="text-neutral-400 hover:text-purple-600"
                            title="Открыть профиль клиента"
                          >
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="text-[11px] text-neutral-500 font-mono mt-0.5">
                          {client?.email || client?.phone || 'Контакты не указаны'}
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="font-mono font-bold text-sm text-[#1A1A1A] dark:text-white">
                          {formatCurrency(doc.amount)}
                        </div>
                        {penaltyAmount > 0 && (
                          <div className="text-[10px] font-mono text-rose-600 dark:text-rose-400 font-semibold mt-0.5">
                            + {formatCurrency(penaltyAmount)} (пени)
                          </div>
                        )}
                      </td>

                      {/* Due Date & Countdown */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="font-mono text-neutral-700 dark:text-neutral-300">
                          {dueDate.toLocaleDateString('ru-RU')}
                        </div>
                        <div className="mt-1">
                          {isOverdue ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
                              Просрочен на {daysOverdue} дн.
                            </span>
                          ) : daysUntilDue === 0 ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                              Срок оплаты сегодня!
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200/50">
                              Осталось {daysUntilDue} дн.
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Trigger Status */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="space-y-1">
                          {triggerSentCount > 0 ? (
                            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
                              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                              <span>Отправлено {triggerSentCount} раз(а)</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-neutral-400 text-[11px]">
                              <Clock className="w-3.5 h-3.5 shrink-0" />
                              <span>Ожидает отправки</span>
                            </div>
                          )}

                          {doc.lastReminderSentAt && (
                            <div className="text-[10px] text-neutral-400 font-mono">
                              Посл.: {new Date(doc.lastReminderSentAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Channel Selector */}
                      <td className="py-3.5 px-4 align-top">
                        <select
                          value={selectedChannel}
                          onChange={(e) =>
                            setSelectedChannelPerDoc((prev) => ({
                              ...prev,
                              [doc.id]: e.target.value as CommunicationChannel,
                            }))
                          }
                          className={`text-xs rounded-lg px-2 py-1 border font-semibold focus:outline-none focus:ring-1 focus:ring-purple-600 ${
                            isLight ? 'bg-white border-black/[0.08]' : 'bg-[#252525] border-white/[0.08]'
                          }`}
                        >
                          <option value="whatsapp">WhatsApp {client?.whatsapp ? `(${client.whatsapp})` : ''}</option>
                          <option value="telegram">Telegram {client?.telegram ? `(@${client.telegram})` : ''}</option>
                          <option value="email">Email {client?.email ? `(${client.email})` : ''}</option>
                        </select>
                      </td>

                      {/* Action Button */}
                      <td className="py-3.5 px-4 align-top text-right">
                        <button
                          type="button"
                          onClick={() =>
                            handleTriggerSingle(
                              doc.id,
                              isOverdue ? 'overdue' : 'approaching_due',
                              doc.number
                            )
                          }
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 ml-auto transition-colors shadow-2xs ${
                            isOverdue
                              ? 'bg-rose-600 hover:bg-rose-700 text-white'
                              : 'bg-amber-600 hover:bg-amber-700 text-white'
                          }`}
                          title={`Отправить клиенту ${isOverdue ? 'требование об оплате долга' : 'напоминание о сроке'}`}
                        >
                          <Send className="w-3 h-3" />
                          <span>{isOverdue ? 'Отправить требование' : 'Отправить напоминание'}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Trigger Audit Log (Журнал сработавших авто-триггеров) */}
      <div className={`p-5 rounded-2xl border shadow-2xs space-y-4 ${
        isLight ? 'bg-white border-black/[0.08]' : 'bg-[#1E1E1E] border-white/[0.08]'
      }`}>
        <div className="flex items-center justify-between pb-3 border-b border-black/[0.06] dark:border-white/[0.06]">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 font-mono flex items-center gap-2">
            <Send className="w-3.5 h-3.5 text-purple-600" />
            <span>Журнал отправленных триггеров клиентам ({invoiceReminderLogs.length})</span>
          </h3>
          <span className="text-[11px] text-neutral-400 font-mono">
            Автоматическая диспетчеризация сообщений
          </span>
        </div>

        {invoiceReminderLogs.length === 0 ? (
          <div className="py-8 text-center text-xs text-neutral-400">
            Лог пока пуст. При срабатывании автоматических проверок отправленные сообщения клиентам появятся здесь.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-[10px] font-mono text-neutral-400 uppercase border-b border-black/[0.04] dark:border-white/[0.04]">
                  <th className="pb-2">Время отправки</th>
                  <th className="pb-2">Счет / Договор</th>
                  <th className="pb-2">Клиент и контакт</th>
                  <th className="pb-2">Канал</th>
                  <th className="pb-2">Тип триггера</th>
                  <th className="pb-2">Текст сообщения</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.04]">
                {invoiceReminderLogs.slice(0, 15).map((log) => (
                  <tr key={log.id} className="text-neutral-700 dark:text-neutral-300">
                    <td className="py-2.5 font-mono text-[11px] text-neutral-400 whitespace-nowrap">
                      {new Date(log.triggeredAt).toLocaleString('ru-RU', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-2.5 font-mono font-bold text-purple-600 dark:text-purple-400 whitespace-nowrap">
                      {log.documentNumber}
                    </td>
                    <td className="py-2.5">
                      <div className="font-semibold">{log.clientName}</div>
                      <div className="text-[11px] text-neutral-400 font-mono">{log.recipientContact}</div>
                    </td>
                    <td className="py-2.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-50 text-[#2563EB] dark:bg-blue-950/60 dark:text-blue-300">
                        {log.channel.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-2.5 whitespace-nowrap">
                      {log.triggerType === 'overdue' ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
                          Просрочка ({log.daysOffset} дн.)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                          Подходит срок
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 max-w-md truncate text-neutral-500 text-[11px]" title={log.messageText}>
                      {log.messageText}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Contract Settings Modal */}
      <ContractReminderSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
};
