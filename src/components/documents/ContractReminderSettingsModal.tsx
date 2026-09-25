import React, { useState } from 'react';
import {
  X,
  Settings,
  Bell,
  Check,
  AlertTriangle,
  Clock,
  ShieldAlert,
  Send,
  Sliders,
  Sparkles,
  Info,
  RotateCcw
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { ContractReminderSettings, CommunicationChannel } from '../../types/crm';
import { DEFAULT_CONTRACT_REMINDER_SETTINGS } from '../../data/mockData';

interface ContractReminderSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ContractReminderSettingsModal: React.FC<ContractReminderSettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { contractReminderSettings, updateContractReminderSettings, theme } = useCrm();
  const isLight = theme === 'light';

  const [formData, setFormData] = useState<ContractReminderSettings>({
    ...contractReminderSettings,
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleToggleChannel = (ch: CommunicationChannel) => {
    setFormData((prev) => {
      const current = prev.channels || [];
      const next = current.includes(ch)
        ? current.filter((c) => c !== ch)
        : [...current, ch];
      return { ...prev, channels: next.length > 0 ? next : [ch] };
    });
  };

  const handleSave = () => {
    updateContractReminderSettings(formData);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  const handleResetToDefault = () => {
    setFormData({ ...DEFAULT_CONTRACT_REMINDER_SETTINGS });
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className={`rounded-2xl max-w-2xl w-full flex flex-col my-auto shadow-2xl border max-h-[92vh] overflow-hidden ${
        isLight ? 'bg-white border-black/[0.1] text-[#1A1A1A]' : 'bg-[#181818] border-white/[0.1] text-white'
      }`}>
        {/* Modal Header */}
        <div className={`p-5 border-b flex items-center justify-between shrink-0 ${
          isLight ? 'bg-neutral-50/80 border-black/[0.08]' : 'bg-[#202020] border-white/[0.08]'
        }`}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold">Настройки правил авто-триггеров по договорам</h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Параметры автоматической отправки уведомлений клиентам при приближении срока и просрочке
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 text-xs">
          {/* Master Toggle */}
          <div className={`p-4 rounded-xl border flex items-center justify-between gap-3 ${
            formData.enabled
              ? (isLight ? 'bg-purple-50/60 border-purple-200' : 'bg-purple-950/20 border-purple-900/50')
              : (isLight ? 'bg-neutral-50 border-black/[0.06]' : 'bg-[#222222] border-white/[0.06]')
          }`}>
            <div>
              <span className="font-bold text-sm text-[#1A1A1A] dark:text-white block">
                Автоматическая отправка триггеров включена
              </span>
              <p className="text-neutral-500 text-[11px] mt-0.5">
                Планировщик автоматически рассылает сообщения клиентам в мессенджеры и email
              </p>
            </div>

            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={formData.enabled}
                onChange={(e) => setFormData(prev => ({ ...prev, enabled: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-neutral-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>

          {/* Section 1: Approaching Due Date Trigger Rules */}
          <div className="space-y-4">
            <h3 className="font-bold text-xs uppercase tracking-wider text-neutral-400 font-mono flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>Правила при приближении срока оплаты</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="font-semibold block text-neutral-700 dark:text-neutral-300">
                  За сколько дней напоминать до дедлайна:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="14"
                    value={formData.remindDaysBeforeDue}
                    onChange={(e) =>
                      setFormData(prev => ({ ...prev, remindDaysBeforeDue: Math.max(1, parseInt(e.target.value) || 1) }))
                    }
                    className={`w-24 text-center rounded-xl px-3 py-2 border font-mono font-bold focus:outline-none focus:ring-1 focus:ring-purple-600 ${
                      isLight ? 'bg-white border-black/[0.1]' : 'bg-[#252525] border-white/[0.1]'
                    }`}
                  />
                  <span className="text-neutral-500 font-mono text-[11px]">дня(ей) до срока</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold block text-neutral-700 dark:text-neutral-300">
                  Отправлять в день наступления срока (0 дней):
                </label>
                <label className="flex items-center gap-2 mt-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.sendOnDueDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, sendOnDueDate: e.target.checked }))}
                    className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
                  />
                  <span className="text-neutral-600 dark:text-neutral-300 font-medium">
                    Да, отправлять экспресс-напоминание в день дедлайна
                  </span>
                </label>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold block text-neutral-700 dark:text-neutral-300">
                Шаблон сообщения клиенту (приближение срока):
              </label>
              <textarea
                rows={3}
                value={formData.approachingTemplate || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, approachingTemplate: e.target.value }))}
                className={`w-full rounded-xl p-3 border font-sans text-xs focus:outline-none focus:ring-1 focus:ring-purple-600 leading-relaxed ${
                  isLight ? 'bg-white border-black/[0.1]' : 'bg-[#252525] border-white/[0.1]'
                }`}
              />
              <div className="text-[10px] text-neutral-400 font-mono">
                Переменные: {'{clientName}'}, {'{contractNumber}'}, {'{docNumber}'}, {'{amount}'}, {'{dueDate}'}, {'{days}'}, {'{link}'}
              </div>
            </div>
          </div>

          {/* Section 2: Overdue Trigger Rules */}
          <div className="space-y-4 pt-4 border-t border-black/[0.06] dark:border-white/[0.06]">
            <h3 className="font-bold text-xs uppercase tracking-wider text-neutral-400 font-mono flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              <span>Правила при просрочке оплаты по договору</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="font-semibold block text-neutral-700 dark:text-neutral-300">
                  Льготный период (Grace period):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={formData.overdueGraceDays}
                    onChange={(e) =>
                      setFormData(prev => ({ ...prev, overdueGraceDays: Math.max(0, parseInt(e.target.value) || 0) }))
                    }
                    className={`w-20 text-center rounded-xl px-2 py-2 border font-mono font-bold focus:outline-none focus:ring-1 focus:ring-purple-600 ${
                      isLight ? 'bg-white border-black/[0.1]' : 'bg-[#252525] border-white/[0.1]'
                    }`}
                  />
                  <span className="text-neutral-500 font-mono text-[11px]">дн.</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold block text-neutral-700 dark:text-neutral-300">
                  Повторять каждые:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="14"
                    value={formData.overdueRepeatIntervalDays}
                    onChange={(e) =>
                      setFormData(prev => ({ ...prev, overdueRepeatIntervalDays: Math.max(1, parseInt(e.target.value) || 1) }))
                    }
                    className={`w-20 text-center rounded-xl px-2 py-2 border font-mono font-bold focus:outline-none focus:ring-1 focus:ring-purple-600 ${
                      isLight ? 'bg-white border-black/[0.1]' : 'bg-[#252525] border-white/[0.1]'
                    }`}
                  />
                  <span className="text-neutral-500 font-mono text-[11px]">дн.</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold block text-neutral-700 dark:text-neutral-300">
                  Максимум уведомлений:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={formData.maxOverdueReminders}
                    onChange={(e) =>
                      setFormData(prev => ({ ...prev, maxOverdueReminders: Math.max(1, parseInt(e.target.value) || 1) }))
                    }
                    className={`w-20 text-center rounded-xl px-2 py-2 border font-mono font-bold focus:outline-none focus:ring-1 focus:ring-purple-600 ${
                      isLight ? 'bg-white border-black/[0.1]' : 'bg-[#252525] border-white/[0.1]'
                    }`}
                  />
                  <span className="text-neutral-500 font-mono text-[11px]">раз(а)</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="font-semibold block text-neutral-700 dark:text-neutral-300">
                  Пеня по договору (% в день):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.05"
                    min="0"
                    max="5"
                    value={formData.penaltyPercentPerDay}
                    onChange={(e) =>
                      setFormData(prev => ({ ...prev, penaltyPercentPerDay: parseFloat(e.target.value) || 0 }))
                    }
                    className={`w-24 text-center rounded-xl px-3 py-2 border font-mono font-bold focus:outline-none focus:ring-1 focus:ring-purple-600 ${
                      isLight ? 'bg-white border-black/[0.1]' : 'bg-[#252525] border-white/[0.1]'
                    }`}
                  />
                  <span className="text-neutral-500 font-mono text-[11px]">% за день просрочки</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold block text-neutral-700 dark:text-neutral-300">
                  Срочная задача менеджеру:
                </label>
                <label className="flex items-center gap-2 mt-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.autoCreateUrgentTask}
                    onChange={(e) => setFormData(prev => ({ ...prev, autoCreateUrgentTask: e.target.checked }))}
                    className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4"
                  />
                  <span className="text-neutral-600 dark:text-neutral-300 font-medium">
                    Автоматически ставить срочную задачу в CRM
                  </span>
                </label>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold block text-neutral-700 dark:text-neutral-300">
                Шаблон претензионного требования (просрочка):
              </label>
              <textarea
                rows={3}
                value={formData.overdueTemplate || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, overdueTemplate: e.target.value }))}
                className={`w-full rounded-xl p-3 border font-sans text-xs focus:outline-none focus:ring-1 focus:ring-purple-600 leading-relaxed ${
                  isLight ? 'bg-white border-black/[0.1]' : 'bg-[#252525] border-white/[0.1]'
                }`}
              />
              <div className="text-[10px] text-neutral-400 font-mono">
                Переменные: {'{clientName}'}, {'{contractNumber}'}, {'{docNumber}'}, {'{amount}'}, {'{dueDate}'}, {'{days}'}, {'{link}'}
              </div>
            </div>
          </div>

          {/* Section 3: Communication Channels Selection */}
          <div className="space-y-3 pt-4 border-t border-black/[0.06] dark:border-white/[0.06]">
            <h3 className="font-bold text-xs uppercase tracking-wider text-neutral-400 font-mono flex items-center gap-1.5">
              <Send className="w-3.5 h-3.5 text-blue-600" />
              <span>Каналы автоматической доставки клиентам</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: 'whatsapp' as CommunicationChannel, label: 'WhatsApp', desc: 'Прямой чат с клиентом' },
                { id: 'telegram' as CommunicationChannel, label: 'Telegram', desc: 'Уведомление в бота/чат' },
                { id: 'email' as CommunicationChannel, label: 'Email', desc: 'Официальное письмо с PDF' },
              ].map((ch) => {
                const isSelected = formData.channels?.includes(ch.id);
                return (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => handleToggleChannel(ch.id)}
                    className={`p-3 rounded-xl border text-left flex items-start justify-between transition-all ${
                      isSelected
                        ? (isLight ? 'bg-purple-50/80 border-purple-300 text-purple-900 shadow-2xs' : 'bg-purple-950/30 border-purple-700 text-purple-200')
                        : (isLight ? 'bg-neutral-50/80 border-black/[0.06] text-neutral-600' : 'bg-[#222222] border-white/[0.06] text-neutral-400')
                    }`}
                  >
                    <div>
                      <div className="font-bold text-xs">{ch.label}</div>
                      <div className="text-[11px] opacity-80 mt-0.5">{ch.desc}</div>
                    </div>
                    <div className={`w-4 h-4 rounded flex items-center justify-center text-[10px] font-bold ${
                      isSelected ? 'bg-purple-600 text-white' : 'border border-neutral-300 dark:border-neutral-700'
                    }`}>
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className={`p-4 border-t flex items-center justify-between gap-3 shrink-0 ${
          isLight ? 'bg-neutral-50 border-black/[0.08]' : 'bg-[#1E1E1E] border-white/[0.08]'
        }`}>
          <button
            type="button"
            onClick={handleResetToDefault}
            className="px-3 py-2 rounded-xl text-neutral-500 hover:text-neutral-800 dark:hover:text-white font-semibold text-xs flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Сбросить к стандарту</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border text-xs font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              Отмена
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Сохранено!</span>
                </>
              ) : (
                <span>Сохранить настройки</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
