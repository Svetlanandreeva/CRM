import React, { useState } from 'react';
import {
  Settings,
  Users,
  MessageSquare,
  Kanban,
  Cpu,
  RotateCcw,
  Check,
  Sun,
  Moon,
  Building2,
  FileText,
  Save,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  CreditCard,
  Eye,
  Layers,
  Repeat,
  RefreshCw,
  Send,
  Clock,
  AlertCircle,
  X
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { DEAL_STAGES, PROPOSAL_TEMPLATES } from '../../data/mockData';
import { CompanySettings, ProposalTemplateId, RecurringSchedulerSettings } from '../../types/crm';
import { TemplateThumbnailCard } from '../documents/TemplateThumbnailCard';
import { TemplatePreviewGalleryModal } from '../documents/TemplatePreviewGalleryModal';
import { RecurringSchedulesList } from '../documents/RecurringSchedulesList';
import { CreateRecurringScheduleModal } from '../documents/CreateRecurringScheduleModal';

export const SettingsView: React.FC = () => {
  const {
    managers,
    quickReplyTemplates,
    resetToDefaults,
    companySettings,
    updateCompanySettings,
    schedulerSettings,
    updateSchedulerSettings,
    recurringSchedules,
    setIsCreateRecurringOpen,
    runAutomatedSchedulerCheck,
    theme,
    toggleTheme
  } = useCrm();

  const isLight = theme === 'light';

  const [activeTab, setActiveTab] = useState<'company' | 'recurring' | 'managers' | 'stages' | 'templates' | 'integrations' | 'system'>('company');
  const [resetConfirm, setResetConfirm] = useState(false);

  // Local form state for company settings
  const [formData, setFormData] = useState<CompanySettings>(companySettings);
  const [isSaved, setIsSaved] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);

  // Local form state for scheduler settings
  const [schedulerFormData, setSchedulerFormData] = useState<RecurringSchedulerSettings>(schedulerSettings);
  const [isSchedulerSaved, setIsSchedulerSaved] = useState(false);
  const [schedulerCheckToast, setSchedulerCheckToast] = useState<string | null>(null);
  const [isCheckingScheduler, setIsCheckingScheduler] = useState(false);

  const handleInputChange = (field: keyof CompanySettings, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsSaved(false);
  };

  const handleSaveCompanySettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateCompanySettings(formData);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className={`flex-1 flex flex-col min-h-0 overflow-hidden ${
      isLight ? 'bg-[#F8F7F4] text-[#1A1A1A]' : 'bg-[#121212] text-neutral-100'
    }`}>
      {/* Top Header */}
      <div className={`p-5 border-b space-y-4 shrink-0 ${
        isLight ? 'bg-white border-black/[0.08]' : 'bg-[#161616] border-white/[0.08]'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className={`text-base font-semibold tracking-tight flex items-center gap-2 ${
              isLight ? 'text-[#1A1A1A]' : 'text-white'
            }`}>
              <Settings className="w-4 h-4 text-[#2563EB]" />
              <span>Настройки CRM и мастерской Satori</span>
            </h1>
            <p className="text-xs text-neutral-500 font-normal mt-0.5">
              Реквизиты организации для счетов, шаблоны КП, сотрудники и интеграции
            </p>
          </div>

          {/* Theme switch button */}
          <button
            onClick={toggleTheme}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 border transition-all ${
              isLight 
                ? 'bg-[#F8F7F4] hover:bg-neutral-100 text-[#1A1A1A] border-black/[0.08]' 
                : 'bg-[#222222] hover:bg-[#282828] text-white border-white/[0.08]'
            }`}
          >
            {isLight ? (
              <>
                <Moon className="w-3.5 h-3.5 text-[#2563EB]" />
                <span>Тёмная тема</span>
              </>
            ) : (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span>Светлая тема</span>
              </>
            )}
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl border text-xs w-fit border-black/[0.08] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.02]">
          <button
            onClick={() => setActiveTab('company')}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'company'
                ? 'bg-[#2563EB] text-white shadow-2xs'
                : 'text-neutral-500 hover:text-[#1A1A1A] dark:hover:text-white'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Реквизиты и шаблоны КП</span>
          </button>
          <button
            onClick={() => setActiveTab('recurring')}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'recurring'
                ? 'bg-purple-600 text-white shadow-2xs'
                : 'text-neutral-500 hover:text-[#1A1A1A] dark:hover:text-white'
            }`}
          >
            <Repeat className="w-3.5 h-3.5" />
            <span>Регулярные счета и контракты</span>
          </button>
          <button
            onClick={() => setActiveTab('managers')}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'managers'
                ? 'bg-[#2563EB] text-white shadow-2xs'
                : 'text-neutral-500 hover:text-[#1A1A1A] dark:hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Сотрудники</span>
          </button>
          <button
            onClick={() => setActiveTab('stages')}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'stages'
                ? 'bg-[#2563EB] text-white shadow-2xs'
                : 'text-neutral-500 hover:text-[#1A1A1A] dark:hover:text-white'
            }`}
          >
            <Kanban className="w-3.5 h-3.5" />
            <span>Этапы воронки</span>
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'templates'
                ? 'bg-[#2563EB] text-white shadow-2xs'
                : 'text-neutral-500 hover:text-[#1A1A1A] dark:hover:text-white'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Шаблоны ответов</span>
          </button>
          <button
            onClick={() => setActiveTab('integrations')}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'integrations'
                ? 'bg-[#2563EB] text-white shadow-2xs'
                : 'text-neutral-500 hover:text-[#1A1A1A] dark:hover:text-white'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Интеграции</span>
          </button>
          <button
            onClick={() => setActiveTab('system')}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'system'
                ? 'bg-[#2563EB] text-white shadow-2xs'
                : 'text-neutral-500 hover:text-[#1A1A1A] dark:hover:text-white'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Система и сброс</span>
          </button>
        </div>
      </div>

      {/* Main Settings Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        
        {/* ======================================================== */}
        {/* TAB: COMPANY REQUISITES & DOCUMENT TEMPLATES (USER BRIEF) */}
        {/* ======================================================== */}
        {activeTab === 'company' && (
          <form onSubmit={handleSaveCompanySettings} className="max-w-4xl space-y-6">
            <div className="flex items-center justify-between pb-2 border-b border-black/[0.06] dark:border-white/[0.06]">
              <div>
                <h2 className="text-base font-semibold">
                  Реквизиты организации и шаблоны коммерческих предложений
                </h2>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Эти данные автоматически подставляются в шапку счетов на оплату, КП и закрывающих актов
                </p>
              </div>

              <button
                type="submit"
                className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-all ${
                  isSaved
                    ? 'bg-emerald-600 text-white'
                    : 'bg-[#2563EB] hover:bg-[#1D4ED8] text-white'
                }`}
              >
                {isSaved ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                <span>{isSaved ? 'Реквизиты сохранены!' : 'Сохранить реквизиты'}</span>
              </button>
            </div>

            {/* Live Requisites Card Preview */}
            <div className={`p-4 rounded-2xl border space-y-2 text-xs font-mono shadow-2xs ${
              isLight ? 'bg-white border-black/[0.08]' : 'bg-[#181818] border-white/[0.08]'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[#2563EB] uppercase font-bold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> ПРЕДВАРИТЕЛЬНЫЙ ПРОСМОТР РЕКВИЗИТОВ В СЧЕТЕ:
                </span>
                <span className="text-[10px] text-neutral-400">Обновляется в реальном времени</span>
              </div>
              <div className="font-sans font-bold text-sm text-[#1A1A1A] dark:text-white">
                {formData.companyName || 'ООО «Ваша компания»'}
                {formData.brandName && <span className="text-neutral-400 font-normal ml-2">({formData.brandName})</span>}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] text-neutral-600 dark:text-neutral-300">
                <div>ИНН: <strong>{formData.inn || '—'}</strong> / КПП: <strong>{formData.kpp || '—'}</strong> / ОГРН: {formData.ogrn || '—'}</div>
                <div>Банк: <strong>{formData.bankName || '—'}</strong> (БИК {formData.bik || '—'})</div>
                <div>Расчетный счет: <strong className="text-[#2563EB]">{formData.accountNumber || '—'}</strong></div>
                <div>Корр. счет: {formData.corrAccount || '—'}</div>
                <div>Руководитель: <strong>{formData.ceoName || '—'}</strong> ({formData.ceoTitle})</div>
                <div>Налогообложение: {formData.taxSystem}</div>
              </div>
            </div>

            {/* Section 1: Юридические данные организации */}
            <div className={`p-5 rounded-2xl border space-y-4 ${
              isLight ? 'bg-white border-black/[0.08]' : 'bg-[#181818] border-white/[0.08]'
            }`}>
              <div className="flex items-center gap-2 text-xs font-semibold text-[#2563EB]">
                <Building2 className="w-4 h-4" />
                <span>Юридические данные компании / ИП</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-neutral-500 font-medium block mb-1">
                    Официальное наименование юр. лица / ИП *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.companyName}
                    onChange={(e) => handleInputChange('companyName', e.target.value)}
                    placeholder='ООО "Сатори Мануфактура" или ИП Андреева С.В.'
                    className={`w-full rounded-lg px-3 py-2 border font-medium focus:outline-none focus:ring-1 focus:ring-[#2563EB] ${
                      isLight ? 'bg-[#F8F7F4] border-black/[0.08]' : 'bg-[#222222] border-white/[0.08]'
                    }`}
                  />
                </div>

                <div>
                  <label className="text-neutral-500 font-medium block mb-1">
                    Торговая марка / Бренд студии
                  </label>
                  <input
                    type="text"
                    value={formData.brandName}
                    onChange={(e) => handleInputChange('brandName', e.target.value)}
                    placeholder='Satori Design & Workshop'
                    className={`w-full rounded-lg px-3 py-2 border font-medium focus:outline-none focus:ring-1 focus:ring-[#2563EB] ${
                      isLight ? 'bg-[#F8F7F4] border-black/[0.08]' : 'bg-[#222222] border-white/[0.08]'
                    }`}
                  />
                </div>

                <div>
                  <label className="text-neutral-500 font-medium block mb-1">ИНН (10 или 12 цифр) *</label>
                  <input
                    type="text"
                    required
                    value={formData.inn}
                    onChange={(e) => handleInputChange('inn', e.target.value)}
                    placeholder="7728491024"
                    className={`w-full rounded-lg px-3 py-2 border font-mono font-semibold focus:outline-none focus:ring-1 focus:ring-[#2563EB] ${
                      isLight ? 'bg-[#F8F7F4] border-black/[0.08]' : 'bg-[#222222] border-white/[0.08]'
                    }`}
                  />
                </div>

                <div>
                  <label className="text-neutral-500 font-medium block mb-1">КПП (для ООО)</label>
                  <input
                    type="text"
                    value={formData.kpp}
                    onChange={(e) => handleInputChange('kpp', e.target.value)}
                    placeholder="772801001"
                    className={`w-full rounded-lg px-3 py-2 border font-mono font-semibold focus:outline-none focus:ring-1 focus:ring-[#2563EB] ${
                      isLight ? 'bg-[#F8F7F4] border-black/[0.08]' : 'bg-[#222222] border-white/[0.08]'
                    }`}
                  />
                </div>

                <div>
                  <label className="text-neutral-500 font-medium block mb-1">ОГРН / ОГРНИП</label>
                  <input
                    type="text"
                    value={formData.ogrn}
                    onChange={(e) => handleInputChange('ogrn', e.target.value)}
                    placeholder="1217700481920"
                    className={`w-full rounded-lg px-3 py-2 border font-mono focus:outline-none focus:ring-1 focus:ring-[#2563EB] ${
                      isLight ? 'bg-[#F8F7F4] border-black/[0.08]' : 'bg-[#222222] border-white/[0.08]'
                    }`}
                  />
                </div>

                <div>
                  <label className="text-neutral-500 font-medium block mb-1">Система налогообложения</label>
                  <select
                    value={formData.taxSystem}
                    onChange={(e) => handleInputChange('taxSystem', e.target.value)}
                    className={`w-full rounded-lg px-3 py-2 border font-medium focus:outline-none focus:ring-1 focus:ring-[#2563EB] ${
                      isLight ? 'bg-[#F8F7F4] border-black/[0.08]' : 'bg-[#222222] border-white/[0.08]'
                    }`}
                  >
                    <option value='Без НДС (УСН "Доходы минус расходы")'>Без НДС (УСН "Доходы минус расходы")</option>
                    <option value='Без НДС (УСН 6% "Доходы")'>Без НДС (УСН 6% "Доходы")</option>
                    <option value='НДС 20% (Общая система ОСНО)'>НДС 20% (Общая система ОСНО)</option>
                    <option value='Без НДС (Патентная система / Самозанятый)'>Без НДС (Патентная система / Самозанятый)</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="text-neutral-500 font-medium block mb-1">Юридический адрес регистрации</label>
                  <input
                    type="text"
                    value={formData.legalAddress}
                    onChange={(e) => handleInputChange('legalAddress', e.target.value)}
                    placeholder="117342, г. Москва, ул. Бутлерова, д. 17Б, оф. 412"
                    className={`w-full rounded-lg px-3 py-2 border font-medium focus:outline-none focus:ring-1 focus:ring-[#2563EB] ${
                      isLight ? 'bg-[#F8F7F4] border-black/[0.08]' : 'bg-[#222222] border-white/[0.08]'
                    }`}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-neutral-500 font-medium block mb-1">Фактический адрес производства и шоурума</label>
                  <input
                    type="text"
                    value={formData.actualAddress}
                    onChange={(e) => handleInputChange('actualAddress', e.target.value)}
                    placeholder="109316, г. Москва, Волгоградский пр-т, д. 32, корп. 8 (Цех & Шоурум)"
                    className={`w-full rounded-lg px-3 py-2 border font-medium focus:outline-none focus:ring-1 focus:ring-[#2563EB] ${
                      isLight ? 'bg-[#F8F7F4] border-black/[0.08]' : 'bg-[#222222] border-white/[0.08]'
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Банковские реквизиты */}
            <div className={`p-5 rounded-2xl border space-y-4 ${
              isLight ? 'bg-white border-black/[0.08]' : 'bg-[#181818] border-white/[0.08]'
            }`}>
              <div className="flex items-center gap-2 text-xs font-semibold text-[#2563EB]">
                <CreditCard className="w-4 h-4" />
                <span>Банковские реквизиты для безналичной оплаты</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-neutral-500 font-medium block mb-1">Банк получателя *</label>
                  <input
                    type="text"
                    required
                    value={formData.bankName}
                    onChange={(e) => handleInputChange('bankName', e.target.value)}
                    placeholder='АО "ТБанк" или ПАО Сбербанк'
                    className={`w-full rounded-lg px-3 py-2 border font-medium focus:outline-none focus:ring-1 focus:ring-[#2563EB] ${
                      isLight ? 'bg-[#F8F7F4] border-black/[0.08]' : 'bg-[#222222] border-white/[0.08]'
                    }`}
                  />
                </div>

                <div>
                  <label className="text-neutral-500 font-medium block mb-1">БИК банка (9 цифр) *</label>
                  <input
                    type="text"
                    required
                    value={formData.bik}
                    onChange={(e) => handleInputChange('bik', e.target.value)}
                    placeholder="044525974"
                    className={`w-full rounded-lg px-3 py-2 border font-mono font-semibold focus:outline-none focus:ring-1 focus:ring-[#2563EB] ${
                      isLight ? 'bg-[#F8F7F4] border-black/[0.08]' : 'bg-[#222222] border-white/[0.08]'
                    }`}
                  />
                </div>

                <div>
                  <label className="text-neutral-500 font-medium block mb-1">Расчетный счет (р/с, 20 цифр) *</label>
                  <input
                    type="text"
                    required
                    value={formData.accountNumber}
                    onChange={(e) => handleInputChange('accountNumber', e.target.value)}
                    placeholder="40702810900001849201"
                    className={`w-full rounded-lg px-3 py-2 border font-mono font-bold text-[#2563EB] focus:outline-none focus:ring-1 focus:ring-[#2563EB] ${
                      isLight ? 'bg-[#F8F7F4] border-black/[0.08]' : 'bg-[#222222] border-white/[0.08]'
                    }`}
                  />
                </div>

                <div>
                  <label className="text-neutral-500 font-medium block mb-1">Корреспондентский счет (к/с, 20 цифр)</label>
                  <input
                    type="text"
                    value={formData.corrAccount}
                    onChange={(e) => handleInputChange('corrAccount', e.target.value)}
                    placeholder="30101810145250000974"
                    className={`w-full rounded-lg px-3 py-2 border font-mono font-semibold focus:outline-none focus:ring-1 focus:ring-[#2563EB] ${
                      isLight ? 'bg-[#F8F7F4] border-black/[0.08]' : 'bg-[#222222] border-white/[0.08]'
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Руководство и контакты */}
            <div className={`p-5 rounded-2xl border space-y-4 ${
              isLight ? 'bg-white border-black/[0.08]' : 'bg-[#181818] border-white/[0.08]'
            }`}>
              <div className="flex items-center gap-2 text-xs font-semibold text-[#2563EB]">
                <Users className="w-4 h-4" />
                <span>Лица с правом подписи и контактные данные</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-neutral-500 font-medium block mb-1">ФИО Руководителя *</label>
                  <input
                    type="text"
                    required
                    value={formData.ceoName}
                    onChange={(e) => handleInputChange('ceoName', e.target.value)}
                    placeholder="Андреева Светлана Васильевна"
                    className={`w-full rounded-lg px-3 py-2 border font-semibold focus:outline-none focus:ring-1 focus:ring-[#2563EB] ${
                      isLight ? 'bg-[#F8F7F4] border-black/[0.08]' : 'bg-[#222222] border-white/[0.08]'
                    }`}
                  />
                </div>

                <div>
                  <label className="text-neutral-500 font-medium block mb-1">Должность руководителя</label>
                  <input
                    type="text"
                    value={formData.ceoTitle}
                    onChange={(e) => handleInputChange('ceoTitle', e.target.value)}
                    placeholder="Генеральный директор"
                    className={`w-full rounded-lg px-3 py-2 border font-medium focus:outline-none focus:ring-1 focus:ring-[#2563EB] ${
                      isLight ? 'bg-[#F8F7F4] border-black/[0.08]' : 'bg-[#222222] border-white/[0.08]'
                    }`}
                  />
                </div>

                <div>
                  <label className="text-neutral-500 font-medium block mb-1">ФИО Главного бухгалтера</label>
                  <input
                    type="text"
                    value={formData.accountantName}
                    onChange={(e) => handleInputChange('accountantName', e.target.value)}
                    placeholder="Воронова Алина Игоревна"
                    className={`w-full rounded-lg px-3 py-2 border font-semibold focus:outline-none focus:ring-1 focus:ring-[#2563EB] ${
                      isLight ? 'bg-[#F8F7F4] border-black/[0.08]' : 'bg-[#222222] border-white/[0.08]'
                    }`}
                  />
                </div>

                <div>
                  <label className="text-neutral-500 font-medium block mb-1">Телефон для документов</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="+7 (495) 840-22-10"
                    className={`w-full rounded-lg px-3 py-2 border font-mono focus:outline-none focus:ring-1 focus:ring-[#2563EB] ${
                      isLight ? 'bg-[#F8F7F4] border-black/[0.08]' : 'bg-[#222222] border-white/[0.08]'
                    }`}
                  />
                </div>

                <div>
                  <label className="text-neutral-500 font-medium block mb-1">Email для отправки счетов</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="b2b@satori-studio.ru"
                    className={`w-full rounded-lg px-3 py-2 border font-mono focus:outline-none focus:ring-1 focus:ring-[#2563EB] ${
                      isLight ? 'bg-[#F8F7F4] border-black/[0.08]' : 'bg-[#222222] border-white/[0.08]'
                    }`}
                  />
                </div>

                <div>
                  <label className="text-neutral-500 font-medium block mb-1">Сайт компании</label>
                  <input
                    type="text"
                    value={formData.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    placeholder="https://satori-craft.ru"
                    className={`w-full rounded-lg px-3 py-2 border font-mono focus:outline-none focus:ring-1 focus:ring-[#2563EB] ${
                      isLight ? 'bg-[#F8F7F4] border-black/[0.08]' : 'bg-[#222222] border-white/[0.08]'
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Section 4: Шаблоны КП и условия по умолчанию */}
            <div className={`p-5 rounded-2xl border space-y-4 ${
              isLight ? 'bg-white border-black/[0.08]' : 'bg-[#181818] border-white/[0.08]'
            }`}>
              <div className="flex items-center gap-2 text-xs font-semibold text-[#2563EB]">
                <FileText className="w-4 h-4" />
                <span>Шаблон КП по умолчанию и условия сделок</span>
              </div>

              {/* Template selector with visual thumbnails & gallery button */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-neutral-500 font-medium block text-xs">
                      Основной шаблон коммерческого предложения:
                    </label>
                    <span className="text-[11px] text-neutral-400">Стиль по умолчанию для всех новых счетов и КП</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsGalleryOpen(true)}
                    className="px-3 py-1.5 rounded-lg border border-[#2563EB]/30 bg-blue-50/70 dark:bg-blue-950/40 text-[#2563EB] hover:bg-blue-100/80 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
                    title="Открыть галерею шаблонов"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Галерея превью шаблонов</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                  {PROPOSAL_TEMPLATES.map((tmpl) => (
                    <TemplateThumbnailCard
                      key={tmpl.id}
                      template={tmpl}
                      isSelected={formData.defaultTemplateId === tmpl.id}
                      onSelect={() => handleInputChange('defaultTemplateId', tmpl.id)}
                      onOpenGallery={() => {
                        handleInputChange('defaultTemplateId', tmpl.id);
                        setIsGalleryOpen(true);
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Standard conditions */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-2 border-t border-black/[0.06] dark:border-white/[0.06]">
                <div>
                  <label className="text-neutral-500 font-medium block mb-1">
                    Размер предоплаты по умолчанию (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.defaultPrepaymentPercent}
                    onChange={(e) => handleInputChange('defaultPrepaymentPercent', parseInt(e.target.value) || 0)}
                    className={`w-full rounded-lg px-3 py-2 border font-mono font-bold focus:outline-none focus:ring-1 focus:ring-[#2563EB] ${
                      isLight ? 'bg-[#F8F7F4] border-black/[0.08]' : 'bg-[#222222] border-white/[0.08]'
                    }`}
                  />
                </div>

                <div>
                  <label className="text-neutral-500 font-medium block mb-1">
                    Срок производства в цеху (дней)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.defaultProductionDays}
                    onChange={(e) => handleInputChange('defaultProductionDays', parseInt(e.target.value) || 1)}
                    className={`w-full rounded-lg px-3 py-2 border font-mono font-bold focus:outline-none focus:ring-1 focus:ring-[#2563EB] ${
                      isLight ? 'bg-[#F8F7F4] border-black/[0.08]' : 'bg-[#222222] border-white/[0.08]'
                    }`}
                  />
                </div>

                <div>
                  <label className="text-neutral-500 font-medium block mb-1">
                    Срок действия КП (дней)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.defaultValidityDays}
                    onChange={(e) => handleInputChange('defaultValidityDays', parseInt(e.target.value) || 1)}
                    className={`w-full rounded-lg px-3 py-2 border font-mono font-bold focus:outline-none focus:ring-1 focus:ring-[#2563EB] ${
                      isLight ? 'bg-[#F8F7F4] border-black/[0.08]' : 'bg-[#222222] border-white/[0.08]'
                    }`}
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="text-neutral-500 font-medium block mb-1">
                    Текст условий и гарантии в подвале документов
                  </label>
                  <textarea
                    rows={2}
                    value={formData.notesFooter}
                    onChange={(e) => handleInputChange('notesFooter', e.target.value)}
                    className={`w-full rounded-lg px-3 py-2 border text-xs focus:outline-none focus:ring-1 focus:ring-[#2563EB] ${
                      isLight ? 'bg-[#F8F7F4] border-black/[0.08]' : 'bg-[#222222] border-white/[0.08]'
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Bottom Save Bar */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="submit"
                className="px-6 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Сохранить реквизиты</span>
              </button>
            </div>
          </form>
        )}

        {/* Visual Template Preview Gallery Modal in Settings */}
        <TemplatePreviewGalleryModal
          isOpen={isGalleryOpen}
          onClose={() => setIsGalleryOpen(false)}
          selectedTemplateId={formData.defaultTemplateId}
          onSelectTemplate={(tmplId) => handleInputChange('defaultTemplateId', tmplId)}
        />

        {/* ======================================================== */}
        {/* TAB: RECURRING INVOICES & AUTOMATED SCHEDULING SETTINGS */}
        {/* ======================================================== */}
        {activeTab === 'recurring' && (
          <div className="max-w-5xl space-y-6">
            {/* Toast feedback */}
            {schedulerCheckToast && (
              <div className="p-3.5 rounded-xl bg-purple-600 text-white text-xs font-semibold shadow-lg flex items-center justify-between gap-3 animate-in fade-in duration-200">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{schedulerCheckToast}</span>
                </div>
                <button onClick={() => setSchedulerCheckToast(null)} className="text-white/80 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Top Engine Configuration Card */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateSchedulerSettings(schedulerFormData);
                setIsSchedulerSaved(true);
                setTimeout(() => setIsSchedulerSaved(false), 3000);
              }}
              className={`p-5 rounded-2xl border space-y-4 shadow-2xs ${
                isLight ? 'bg-white border-black/[0.08]' : 'bg-[#181818] border-white/[0.08]'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-black/[0.06] dark:border-white/[0.06]">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
                      <Repeat className="w-4 h-4" />
                    </div>
                    <h2 className="text-base font-semibold text-[#1A1A1A] dark:text-white">
                      Автоматический планировщик регулярных счетов
                    </h2>
                  </div>
                  <p className="text-xs text-neutral-500 mt-1">
                    Счета формируются автоматически в фоновом режиме по условиям контрактов клиентов с вашими реквизитами
                  </p>
                </div>

                {/* Engine Enabled Toggle Switch */}
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={schedulerFormData.enabled}
                      onChange={(e) => {
                        const en = e.target.checked;
                        setSchedulerFormData(prev => ({ ...prev, enabled: en }));
                        updateSchedulerSettings({ enabled: en });
                      }}
                      className="sr-only"
                    />
                    <div className={`w-11 h-6 rounded-full transition-colors relative ${
                      schedulerFormData.enabled ? 'bg-purple-600' : 'bg-neutral-300 dark:bg-neutral-700'
                    }`}>
                      <div className={`w-5 h-5 bg-white rounded-full transition-transform absolute top-0.5 ${
                        schedulerFormData.enabled ? 'translate-x-5' : 'translate-x-0.5'
                      }`} />
                    </div>
                    <span className="text-xs font-semibold">
                      {schedulerFormData.enabled ? 'Автогенерация включена' : 'Отключена'}
                    </span>
                  </label>
                </div>
              </div>

              {/* Engine Parameters Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs">
                <div>
                  <label className="text-neutral-500 font-medium block mb-1">
                    День выставления по умолчанию
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={schedulerFormData.defaultBillingDay}
                      onChange={(e) => setSchedulerFormData(prev => ({ ...prev, defaultBillingDay: parseInt(e.target.value) || 1 }))}
                      className={`w-full rounded-lg px-3 py-2 border font-mono font-bold ${
                        isLight ? 'bg-[#F8F7F4] border-black/[0.08]' : 'bg-[#222222] border-white/[0.08]'
                      }`}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 font-mono text-[11px]">число месяца</span>
                  </div>
                </div>

                <div>
                  <label className="text-neutral-500 font-medium block mb-1">
                    Срок оплаты счета по умолчанию (дней)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={schedulerFormData.defaultDueDays}
                    onChange={(e) => setSchedulerFormData(prev => ({ ...prev, defaultDueDays: parseInt(e.target.value) || 5 }))}
                    className={`w-full rounded-lg px-3 py-2 border font-mono font-bold ${
                      isLight ? 'bg-[#F8F7F4] border-black/[0.08]' : 'bg-[#222222] border-white/[0.08]'
                    }`}
                  />
                </div>

                <div>
                  <label className="text-neutral-500 font-medium block mb-1">
                    Шаблон оформления авто-счета
                  </label>
                  <select
                    value={schedulerFormData.defaultTemplateId}
                    onChange={(e) => setSchedulerFormData(prev => ({ ...prev, defaultTemplateId: e.target.value as ProposalTemplateId }))}
                    className={`w-full rounded-lg px-3 py-2 border font-medium ${
                      isLight ? 'bg-[#F8F7F4] border-black/[0.08]' : 'bg-[#222222] border-white/[0.08]'
                    }`}
                  >
                    {PROPOSAL_TEMPLATES.map(t => (
                      <option key={t.id} value={t.id}>{t.name} ({t.badge})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Delivery & Alert Flags */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-black/[0.04] dark:border-white/[0.04] text-xs">
                <label className="flex items-center gap-2.5 p-2.5 rounded-xl border border-black/[0.06] dark:border-white/[0.06] cursor-pointer hover:bg-black/[0.01]">
                  <input
                    type="checkbox"
                    checked={schedulerFormData.autoSendInvoices}
                    onChange={(e) => setSchedulerFormData(prev => ({ ...prev, autoSendInvoices: e.target.checked }))}
                    className="rounded text-[#2563EB] focus:ring-[#2563EB] w-4 h-4 accent-[#2563EB]"
                  />
                  <div>
                    <div className="font-semibold text-[#1A1A1A] dark:text-white">Автоматически отправлять клиенту на email</div>
                    <div className="text-[11px] text-neutral-400">При наступлении даты счет сразу переходит в статус «Отправлено»</div>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 p-2.5 rounded-xl border border-black/[0.06] dark:border-white/[0.06] cursor-pointer hover:bg-black/[0.01]">
                  <input
                    type="checkbox"
                    checked={schedulerFormData.notifyManagerOnGeneration}
                    onChange={(e) => setSchedulerFormData(prev => ({ ...prev, notifyManagerOnGeneration: e.target.checked }))}
                    className="rounded text-[#2563EB] focus:ring-[#2563EB] w-4 h-4 accent-[#2563EB]"
                  />
                  <div>
                    <div className="font-semibold text-[#1A1A1A] dark:text-white">Уведомлять менеджера в CRM</div>
                    <div className="text-[11px] text-neutral-400">Создавать push-уведомление в колокольчик при успешной генерации</div>
                  </div>
                </label>
              </div>

              {/* Action Buttons: Save & Trigger Now */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-black/[0.06] dark:border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => {
                    setIsCheckingScheduler(true);
                    setTimeout(() => {
                      const res = runAutomatedSchedulerCheck();
                      setIsCheckingScheduler(false);
                      if (res.triggeredCount > 0) {
                        setSchedulerCheckToast(`✓ Успешно выпущено ${res.triggeredCount} счетов по расписанию!`);
                      } else {
                        setSchedulerCheckToast(`✓ Расписания проверены. Счетов с наступившим сроком оплаты на сегодня нет.`);
                      }
                      setTimeout(() => setSchedulerCheckToast(null), 4000);
                    }, 500);
                  }}
                  disabled={isCheckingScheduler}
                  className={`px-4 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    isLight
                      ? 'bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200'
                      : 'bg-purple-950/40 hover:bg-purple-900/60 text-purple-300 border-purple-800'
                  }`}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isCheckingScheduler ? 'animate-spin' : ''}`} />
                  <span>{isCheckingScheduler ? 'Проверка...' : 'Проверить и выпустить счета по расписанию сейчас'}</span>
                </button>

                <button
                  type="submit"
                  className={`px-5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors ${
                    isSchedulerSaved
                      ? 'bg-emerald-600 text-white'
                      : 'bg-purple-600 hover:bg-purple-700 text-white'
                  }`}
                >
                  {isSchedulerSaved ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                  <span>{isSchedulerSaved ? 'Параметры сохранены!' : 'Сохранить параметры планировщика'}</span>
                </button>
              </div>
            </form>

            {/* List of Client Contract Schedules */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold text-[#1A1A1A] dark:text-white">
                    Абонентские контракты и графики клиентов ({recurringSchedules.length})
                  </h3>
                  <p className="text-xs text-neutral-500">
                    Управление периодичностью, суммами и паузой по каждому договору
                  </p>
                </div>
              </div>

              <RecurringSchedulesList onOpenCreate={() => setIsCreateRecurringOpen(true)} />
            </div>

            {/* Modal instance */}
            <CreateRecurringScheduleModal />
          </div>
        )}

        {/* TAB 1: MANAGERS */}
        {activeTab === 'managers' && (
          <div className="max-w-3xl space-y-4">
            <h2 className={`text-base font-semibold ${isLight ? 'text-[#1A1A1A]' : 'text-white'}`}>
              Команда и роли доступа
            </h2>
            <div className="space-y-3">
              {managers.map(m => (
                <div key={m.id} className={`p-4 rounded-2xl border flex items-center justify-between shadow-2xs ${
                  isLight ? 'bg-white border-black/[0.08]' : 'bg-[#181818] border-white/[0.08]'
                }`}>
                  <div className="flex items-center gap-3.5">
                    <img src={m.avatar} alt={m.name} className="w-10 h-10 rounded-full object-cover border border-black/[0.06]" />
                    <div>
                      <div className="font-semibold text-xs text-[#1A1A1A] dark:text-white">{m.name}</div>
                      <div className="text-[11px] font-medium text-[#2563EB]">{m.role}</div>
                      <div className="text-[11px] text-neutral-400 font-mono mt-0.5">{m.email}</div>
                    </div>
                  </div>

                  <span className="text-[11px] px-2.5 py-1 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900 font-semibold font-mono">
                    Полный доступ
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: STAGES */}
        {activeTab === 'stages' && (
          <div className="max-w-3xl space-y-4">
            <h2 className={`text-base font-semibold ${isLight ? 'text-[#1A1A1A]' : 'text-white'}`}>
              Этапы воронки продаж и производства
            </h2>
            <div className={`p-5 rounded-2xl border space-y-2 shadow-2xs ${
              isLight ? 'bg-white border-black/[0.08]' : 'bg-[#181818] border-white/[0.08]'
            }`}>
              <div className="divide-y divide-black/[0.04] dark:divide-white/[0.04]">
                {DEAL_STAGES.map((s, idx) => (
                  <div key={s.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-neutral-400 w-5">{idx + 1}.</span>
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} />
                      <span className="font-medium text-[#1A1A1A] dark:text-white">{s.title}</span>
                    </div>
                    <span className="text-[11px] font-mono text-neutral-400">{s.id}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: TEMPLATES */}
        {activeTab === 'templates' && (
          <div className="max-w-3xl space-y-4">
            <h2 className={`text-base font-semibold ${isLight ? 'text-[#1A1A1A]' : 'text-white'}`}>
              Быстрые шаблоны ответов в мессенджеры
            </h2>
            <div className="space-y-3">
              {quickReplyTemplates.map((t) => (
                <div key={t.id} className={`p-4 rounded-2xl border space-y-2 shadow-2xs ${
                  isLight ? 'bg-white border-black/[0.08]' : 'bg-[#181818] border-white/[0.08]'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-[#1A1A1A] dark:text-white">{t.title}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded font-mono font-semibold bg-black/[0.04] dark:bg-white/[0.06] text-neutral-600 dark:text-neutral-300">
                      {t.category}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500 leading-relaxed font-normal italic">
                    «{t.text}»
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: INTEGRATIONS */}
        {activeTab === 'integrations' && (
          <div className="max-w-3xl space-y-4">
            <h2 className={`text-base font-semibold ${isLight ? 'text-[#1A1A1A]' : 'text-white'}`}>
              Подключенные каналы связи и сервисы
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={`p-5 rounded-2xl border space-y-2.5 shadow-2xs ${
                isLight ? 'bg-white border-black/[0.08]' : 'bg-[#181818] border-white/[0.08]'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#1A1A1A] dark:text-white">WhatsApp Business API</span>
                  <span className="text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-full font-semibold font-mono">
                    Подключено
                  </span>
                </div>
                <p className="text-xs text-neutral-500 leading-relaxed">
                  Синхронизация входящих сообщений прямо в карточку клиента в режиме 24/7.
                </p>
              </div>

              <div className={`p-5 rounded-2xl border space-y-2.5 shadow-2xs ${
                isLight ? 'bg-white border-black/[0.08]' : 'bg-[#181818] border-white/[0.08]'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#1A1A1A] dark:text-white">Telegram CRM Bot</span>
                  <span className="text-[10px] px-2 py-0.5 bg-sky-100 text-sky-800 border border-sky-300 rounded-full font-semibold font-mono">
                    Подключено
                  </span>
                </div>
                <p className="text-xs text-neutral-500 leading-relaxed">
                  Омниканальный чат с дизайнерами и архитекторами без потери контекста.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: SYSTEM */}
        {activeTab === 'system' && (
          <div className="max-w-3xl space-y-4">
            <h2 className={`text-base font-semibold ${isLight ? 'text-[#1A1A1A]' : 'text-white'}`}>
              Сброс тестовых данных CRM
            </h2>
            <div className={`p-5 rounded-2xl border space-y-3 ${
              isLight ? 'bg-white border-black/[0.08]' : 'bg-[#181818] border-white/[0.08]'
            }`}>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Сбросить демонстрационные данные клиентов, сделок, переписок и производственных заказов к исходным.
              </p>
              {!resetConfirm ? (
                <button
                  onClick={() => setResetConfirm(true)}
                  className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold"
                >
                  Сбросить к исходным демо-данным
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      resetToDefaults();
                      setResetConfirm(false);
                    }}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-2xs"
                  >
                    Да, точно сбросить
                  </button>
                  <button
                    onClick={() => setResetConfirm(false)}
                    className="px-4 py-2 text-xs font-semibold text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
                  >
                    Отмена
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
