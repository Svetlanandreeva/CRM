import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  FileText,
  Plus,
  Trash2,
  X,
  Building2,
  CheckCircle2,
  Repeat,
  Sparkles,
  ShieldCheck,
  Send,
  AlertCircle
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import {
  RecurringFrequency,
  ProposalTemplateId,
  DealItem,
  DocumentType
} from '../../types/crm';
import { PROPOSAL_TEMPLATES } from '../../data/mockData';

export const CreateRecurringScheduleModal: React.FC = () => {
  const {
    isCreateRecurringOpen,
    setIsCreateRecurringOpen,
    recurringPresetClient,
    clients,
    catalog,
    companySettings,
    schedulerSettings,
    addRecurringSchedule,
    theme
  } = useCrm();

  const isLight = theme === 'light';

  const [clientId, setClientId] = useState<string>('');
  const [contractNumber, setContractNumber] = useState('ДОГ-2026/АБ-');
  const [contractTitle, setContractTitle] = useState('Абонентское авторское сопровождение и надзор');
  const [frequency, setFrequency] = useState<RecurringFrequency>('monthly');
  const [billingDay, setBillingDay] = useState<number>(schedulerSettings.defaultBillingDay || 1);
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState<string>('');
  const [templateId, setTemplateId] = useState<ProposalTemplateId>(schedulerSettings.defaultTemplateId || 'offer');
  const [titleTemplate, setTitleTemplate] = useState('Счет на оплату абонентского обслуживания за {month}');
  const [paymentDueDays, setPaymentDueDays] = useState<number>(schedulerSettings.defaultDueDays || 5);
  const [autoSendEmail, setAutoSendEmail] = useState<boolean>(schedulerSettings.autoSendInvoices);
  const [notifyManager, setNotifyManager] = useState<boolean>(schedulerSettings.notifyManagerOnGeneration);
  const [notes, setNotes] = useState('');

  const [items, setItems] = useState<DealItem[]>([
    {
      id: 'rec_item_1',
      title: 'Абонентское авторское сопровождение проекта (ежемесячно)',
      quantity: 1,
      unitPrice: 85000,
      primeCost: 30000,
      material: 'Инженерный надзор и комплектация',
    }
  ]);

  // Synchronize client when opened from preset or defaults
  useEffect(() => {
    if (recurringPresetClient) {
      setClientId(recurringPresetClient.id);
      setContractNumber(`ДОГ-2026/${recurringPresetClient.name.slice(0, 3).toUpperCase()}-${Math.floor(10 + Math.random() * 90)}`);
    } else if (clients.length > 0 && !clientId) {
      setClientId(clients[0].id);
      setContractNumber(`ДОГ-2026/АБ-${Math.floor(100 + Math.random() * 900)}`);
    }
  }, [recurringPresetClient, clients, isCreateRecurringOpen]);

  if (!isCreateRecurringOpen) return null;

  const totalAmount = items.reduce((sum, it) => sum + (it.unitPrice * it.quantity), 0);

  const calculateInitialNextRunDate = (): string => {
    const d = new Date(startDate || Date.now());
    const now = new Date();
    // If start date is in the future, next run is start date
    if (d > now) {
      return d.toISOString().split('T')[0];
    }

    // Otherwise compute next due based on billing day
    const targetMonth = now.getDate() <= billingDay ? now.getMonth() : now.getMonth() + 1;
    const nextD = new Date(now.getFullYear(), targetMonth, 1);
    const daysInMonth = new Date(nextD.getFullYear(), nextD.getMonth() + 1, 0).getDate();
    nextD.setDate(Math.min(billingDay, daysInMonth));
    return nextD.toISOString().split('T')[0];
  };

  const handleAddItemFromCatalog = (catId: string) => {
    const catItem = catalog.find(c => c.id === catId);
    if (!catItem) return;

    setItems(prev => [
      ...prev,
      {
        id: `rec_it_${Date.now()}`,
        title: catItem.title,
        quantity: 1,
        unitPrice: catItem.basePrice,
        primeCost: catItem.primeCost,
        material: catItem.materials.join(', '),
      }
    ]);
  };

  const handleAddCustomItem = () => {
    setItems(prev => [
      ...prev,
      {
        id: `rec_it_${Date.now()}`,
        title: 'Регламентная услуга по договору',
        quantity: 1,
        unitPrice: 50000,
        primeCost: 20000,
        material: 'По условиям спецификации',
      }
    ]);
  };

  const handleRemoveItem = (idx: number) => {
    setItems(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const client = clients.find(c => c.id === clientId) || clients[0];
    const nextRun = calculateInitialNextRunDate();

    addRecurringSchedule({
      clientId: client.id,
      clientName: `${client.name}${client.company ? ` (${client.company})` : ''}`,
      contractNumber,
      contractTitle,
      frequency,
      billingDay,
      startDate,
      endDate: endDate || undefined,
      nextRunDate: nextRun,
      templateId,
      documentType: 'invoice',
      titleTemplate,
      items,
      amount: totalAmount,
      autoSendEmail,
      notifyManager,
      paymentDueDays,
      status: 'active',
      notes: notes || undefined,
    });

    setIsCreateRecurringOpen(false);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="fixed inset-0 bg-black/65 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className={`rounded-2xl max-w-3xl w-full p-6 space-y-5 shadow-2xl max-h-[94vh] overflow-y-auto border my-auto ${
        isLight ? 'bg-white border-black/[0.08] text-[#1A1A1A]' : 'bg-[#1C1C1C] border-white/[0.08] text-white'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between pb-3 border-b ${
          isLight ? 'border-black/[0.06]' : 'border-white/[0.06]'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Repeat className="w-5 h-5" />
            </div>
            <div>
              <div className="meta-label text-purple-600 dark:text-purple-400">АВТОМАТИЧЕСКИЙ ПЛАНИРОВЩИК СЧЕТОВ</div>
              <h2 className="text-base font-bold tracking-tight">
                Настройка регулярного выставления счета по договору
              </h2>
            </div>
          </div>
          <button
            onClick={() => setIsCreateRecurringOpen(false)}
            className="text-neutral-400 hover:text-neutral-700 dark:hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info Banner */}
        <div className={`p-3.5 rounded-xl border flex items-start gap-3 text-xs leading-relaxed ${
          isLight ? 'bg-purple-50/70 border-purple-200/80 text-purple-950' : 'bg-purple-950/20 border-purple-900/40 text-purple-200'
        }`}>
          <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
          <div>
            Счета будут формироваться автоматически по наступлению указанной даты с реквизитами вашей компании <strong>{companySettings.companyName}</strong>. Вы можете настроить автоматическую отправку счета клиенту на email или сохранение в статусе черновика.
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Client & Contract */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-semibold block mb-1">Клиент (Заказчик)</label>
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className={`w-full rounded-xl p-2.5 border font-medium focus:outline-none focus:ring-1 focus:ring-[#2563EB] ${
                  isLight ? 'bg-[#F8F7F4] border-black/[0.08] text-[#1A1A1A]' : 'bg-[#252525] border-white/[0.08] text-white'
                }`}
              >
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.name} {c.company ? `(${c.company})` : ''}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-semibold block mb-1">Номер договора / Соглашения</label>
              <input
                type="text"
                required
                value={contractNumber}
                onChange={(e) => setContractNumber(e.target.value)}
                placeholder="ДОГ-2026/АБ-104"
                className={`w-full rounded-xl p-2.5 border font-mono font-semibold focus:outline-none focus:ring-1 focus:ring-[#2563EB] ${
                  isLight ? 'bg-[#F8F7F4] border-black/[0.08] text-[#1A1A1A]' : 'bg-[#252525] border-white/[0.08] text-white'
                }`}
              />
            </div>
          </div>

          {/* Contract Title */}
          <div>
            <label className="font-semibold block mb-1">Предмет договора / Название графика</label>
            <input
              type="text"
              required
              value={contractTitle}
              onChange={(e) => setContractTitle(e.target.value)}
              placeholder="Ежемесячный авторский надзор, сопровождение комплектации и реставрация"
              className={`w-full rounded-xl p-2.5 border font-medium focus:outline-none focus:ring-1 focus:ring-[#2563EB] ${
                isLight ? 'bg-[#F8F7F4] border-black/[0.08] text-[#1A1A1A]' : 'bg-[#252525] border-white/[0.08] text-white'
              }`}
            />
          </div>

          {/* Frequency & Billing Schedule */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-3.5 rounded-xl border border-black/[0.06] dark:border-white/[0.06] bg-black/[0.01] dark:bg-white/[0.02]">
            <div>
              <label className="font-semibold block mb-1">Периодичность</label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as RecurringFrequency)}
                className={`w-full rounded-lg px-2.5 py-1.5 border font-medium focus:outline-none focus:ring-1 focus:ring-[#2563EB] ${
                  isLight ? 'bg-white border-black/[0.08]' : 'bg-[#222222] border-white/[0.08]'
                }`}
              >
                <option value="monthly">Ежемесячно</option>
                <option value="quarterly">Раз в квартал</option>
                <option value="biweekly">Раз в 2 недели</option>
                <option value="weekly">Еженедельно</option>
                <option value="annually">Ежегодно</option>
              </select>
            </div>

            <div>
              <label className="font-semibold block mb-1">День выставления</label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={billingDay}
                  onChange={(e) => setBillingDay(parseInt(e.target.value) || 1)}
                  className={`w-full rounded-lg px-2.5 py-1.5 border font-mono font-bold ${
                    isLight ? 'bg-white border-black/[0.08]' : 'bg-[#222222] border-white/[0.08]'
                  }`}
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-neutral-400 font-mono">число</span>
              </div>
            </div>

            <div>
              <label className="font-semibold block mb-1">Дата начала</label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={`w-full rounded-lg px-2.5 py-1.5 border font-mono ${
                  isLight ? 'bg-white border-black/[0.08]' : 'bg-[#222222] border-white/[0.08]'
                }`}
              />
            </div>

            <div>
              <label className="font-semibold block mb-1">Дата окончания</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                placeholder="Бессрочно"
                className={`w-full rounded-lg px-2.5 py-1.5 border font-mono ${
                  isLight ? 'bg-white border-black/[0.08]' : 'bg-[#222222] border-white/[0.08]'
                }`}
              />
            </div>
          </div>

          {/* Template Choice & Title Template */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-semibold block mb-1">Шаблон оформления счета</label>
              <select
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value as ProposalTemplateId)}
                className={`w-full rounded-xl p-2.5 border font-medium focus:outline-none focus:ring-1 focus:ring-[#2563EB] ${
                  isLight ? 'bg-[#F8F7F4] border-black/[0.08] text-[#1A1A1A]' : 'bg-[#252525] border-white/[0.08] text-white'
                }`}
              >
                {PROPOSAL_TEMPLATES.map(tmpl => (
                  <option key={tmpl.id} value={tmpl.id}>
                    {tmpl.name} ({tmpl.badge})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-semibold block mb-1">
                Шаблон наименования счета
                <span className="font-mono text-[10px] text-neutral-400 font-normal ml-1">(переменные: {'{month}'}, {'{quarter}'}, {'{contract}'})</span>
              </label>
              <input
                type="text"
                required
                value={titleTemplate}
                onChange={(e) => setTitleTemplate(e.target.value)}
                className={`w-full rounded-xl p-2.5 border font-medium focus:outline-none focus:ring-1 focus:ring-[#2563EB] ${
                  isLight ? 'bg-[#F8F7F4] border-black/[0.08] text-[#1A1A1A]' : 'bg-[#252525] border-white/[0.08] text-white'
                }`}
              />
            </div>
          </div>

          {/* Automation & Notification Options */}
          <div className="p-3.5 rounded-xl border border-black/[0.06] dark:border-white/[0.06] space-y-2 bg-black/[0.01] dark:bg-white/[0.02]">
            <span className="font-semibold block text-neutral-600 dark:text-neutral-300">
              Параметры автоматического запуска:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoSendEmail}
                  onChange={(e) => setAutoSendEmail(e.target.checked)}
                  className="rounded text-[#2563EB] focus:ring-[#2563EB] w-4 h-4 accent-[#2563EB]"
                />
                <span className="text-xs">Авто-отправка на email</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifyManager}
                  onChange={(e) => setNotifyManager(e.target.checked)}
                  className="rounded text-[#2563EB] focus:ring-[#2563EB] w-4 h-4 accent-[#2563EB]"
                />
                <span className="text-xs">Уведомление в CRM</span>
              </label>

              <div className="flex items-center gap-2">
                <span className="text-xs text-neutral-500 whitespace-nowrap">Срок оплаты:</span>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={paymentDueDays}
                  onChange={(e) => setPaymentDueDays(parseInt(e.target.value) || 5)}
                  className={`w-16 rounded px-2 py-1 text-xs border font-mono font-bold ${
                    isLight ? 'bg-white border-black/[0.08]' : 'bg-[#222222] border-white/[0.08]'
                  }`}
                />
                <span className="text-xs text-neutral-400">дней</span>
              </div>
            </div>
          </div>

          {/* Quick add from Catalog */}
          <div className={`p-3 rounded-xl border flex flex-wrap items-center justify-between gap-3 ${
            isLight ? 'bg-[#F8F7F4] border-black/[0.06]' : 'bg-[#222222] border-white/[0.06]'
          }`}>
            <span className="font-semibold text-xs">Добавить позицию для счета:</span>
            <div className="flex items-center gap-2">
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    handleAddItemFromCatalog(e.target.value);
                    e.target.value = '';
                  }
                }}
                defaultValue=""
                className={`rounded-lg px-3 py-1.5 text-xs border font-medium focus:outline-none focus:ring-1 focus:ring-[#2563EB] ${
                  isLight ? 'bg-white border-black/[0.08] text-[#1A1A1A]' : 'bg-[#282828] border-white/[0.08] text-white'
                }`}
              >
                <option value="" disabled>-- Выбрать из каталога услуг --</option>
                {catalog.map(c => (
                  <option key={c.id} value={c.id}>{c.title} — {formatCurrency(c.basePrice)}</option>
                ))}
              </select>

              <button
                type="button"
                onClick={handleAddCustomItem}
                className="px-2.5 py-1.5 rounded-lg border border-black/[0.08] dark:border-white/[0.08] text-xs font-semibold hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition-colors flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Своя строка</span>
              </button>
            </div>
          </div>

          {/* Items Specification */}
          <div className="space-y-2">
            <label className="font-semibold block">Позиции регулярного счета:</label>
            <div className={`border rounded-xl overflow-hidden ${
              isLight ? 'border-black/[0.08]' : 'border-white/[0.08]'
            }`}>
              <table className="w-full text-left text-xs">
                <thead className={`border-b text-[10px] font-mono uppercase font-semibold ${
                  isLight ? 'bg-black/[0.02] text-neutral-500 border-black/[0.08]' : 'bg-white/[0.02] text-neutral-400 border-white/[0.08]'
                }`}>
                  <tr>
                    <th className="py-2.5 px-3">Наименование услуги</th>
                    <th className="py-2.5 px-2 text-center w-16">Кол-во</th>
                    <th className="py-2.5 px-3 text-right">Тариф (₽)</th>
                    <th className="py-2.5 px-3 text-right">Сумма (₽)</th>
                    <th className="py-2.5 px-2 text-center w-10"></th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isLight ? 'divide-black/[0.04]' : 'divide-white/[0.04]'}`}>
                  {items.map((it, idx) => (
                    <tr key={it.id}>
                      <td className="py-2.5 px-3">
                        <input
                          type="text"
                          value={it.title}
                          onChange={(e) => {
                            const val = e.target.value;
                            setItems(prev => prev.map((item, i) => i === idx ? { ...item, title: val } : item));
                          }}
                          className={`w-full rounded px-2 py-1 border font-medium ${
                            isLight ? 'bg-white border-black/[0.08]' : 'bg-[#252525] border-white/[0.08]'
                          }`}
                        />
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        <input
                          type="number"
                          min="1"
                          value={it.quantity}
                          onChange={(e) => {
                            const qty = Math.max(1, parseInt(e.target.value) || 1);
                            setItems(prev => prev.map((item, i) => i === idx ? { ...item, quantity: qty } : item));
                          }}
                          className={`w-14 text-center rounded p-1 border font-mono font-bold ${
                            isLight ? 'bg-white border-black/[0.08]' : 'bg-[#252525] border-white/[0.08]'
                          }`}
                        />
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <input
                          type="number"
                          value={it.unitPrice}
                          onChange={(e) => {
                            const price = parseFloat(e.target.value) || 0;
                            setItems(prev => prev.map((item, i) => i === idx ? { ...item, unitPrice: price } : item));
                          }}
                          className={`w-28 text-right rounded p-1 border font-mono font-bold ${
                            isLight ? 'bg-white border-black/[0.08]' : 'bg-[#252525] border-white/[0.08]'
                          }`}
                        />
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold tabular-nums">
                        {formatCurrency(it.unitPrice * it.quantity)}
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="text-neutral-400 hover:text-rose-600 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="font-semibold block mb-1">Служебные примечания к расписанию</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Например: Согласовывать с бухгалтером заказчика перед отгрузкой"
              className={`w-full rounded-xl p-2.5 border font-normal ${
                isLight ? 'bg-[#F8F7F4] border-black/[0.08] text-[#1A1A1A]' : 'bg-[#252525] border-white/[0.08] text-white'
              }`}
            />
          </div>

          {/* Total & Submit */}
          <div className="flex items-center justify-between pt-3 border-t border-black/[0.06] dark:border-white/[0.06]">
            <div>
              <span className="text-[10px] text-neutral-400 uppercase font-mono block">ИТОГО ЗА ПЕРИОД:</span>
              <span className="text-xl font-bold font-mono text-purple-600 dark:text-purple-400">{formatCurrency(totalAmount)}</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsCreateRecurringOpen(false)}
                className="px-4 py-2 font-semibold text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
              >
                Отмена
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold shadow-2xs transition-colors flex items-center gap-1.5"
              >
                <Repeat className="w-4 h-4" />
                <span>Запустить регулярный график</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
