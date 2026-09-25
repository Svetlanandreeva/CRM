import React, { useState } from 'react';
import {
  X,
  Check,
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  Building2,
  QrCode,
  Stamp,
  Users,
  Clock,
  Printer,
  FileText,
  ChevronRight,
  Layers,
  ArrowRight
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { ProposalTemplateId, ProposalTemplateMeta, DocumentRecord } from '../../types/crm';
import { PROPOSAL_TEMPLATES } from '../../data/mockData';

interface TemplatePreviewGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTemplateId: ProposalTemplateId;
  onSelectTemplate: (templateId: ProposalTemplateId) => void;
  customDraftDoc?: DocumentRecord;
}

export const TemplatePreviewGalleryModal: React.FC<TemplatePreviewGalleryModalProps> = ({
  isOpen,
  onClose,
  selectedTemplateId,
  onSelectTemplate,
  customDraftDoc
}) => {
  const { companySettings, clients, catalog, theme } = useCrm();
  const isLight = theme === 'light';

  const [activeTmplId, setActiveTmplId] = useState<ProposalTemplateId>(selectedTemplateId);
  const [zoomLevel, setZoomLevel] = useState<number>(85); // percentage zoom

  if (!isOpen) return null;

  const currentTemplate = PROPOSAL_TEMPLATES.find(t => t.id === activeTmplId) || PROPOSAL_TEMPLATES[0];
  const company = customDraftDoc?.companySnapshot || companySettings;
  const sampleClient = clients[0] || { name: 'Артем Васильев', company: 'Архитектурное бюро «Форма»', phone: '+7 (916) 480-11-22', email: 'artem@forma-arch.ru' };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(val);
  };

  const sampleItems = customDraftDoc?.items && customDraftDoc.items.length > 0 ? customDraftDoc.items : [
    {
      id: 'it_1',
      title: 'Подвесной светильник «Satori Wave»',
      quantity: 1,
      unitPrice: 45000,
      primeCost: 22000,
      material: 'Шпон натурального дуба, латунь'
    },
    {
      id: 'it_2',
      title: 'Консоль из массива ореха со скрытым ящиком',
      quantity: 1,
      unitPrice: 110000,
      primeCost: 58000,
      material: 'Массив американского ореха, направляющие Blum'
    }
  ];

  const totalAmount = sampleItems.reduce((sum, it) => sum + (it.unitPrice * it.quantity), 0);
  const prepaymentPct = customDraftDoc?.prepaymentPercent || company.defaultPrepaymentPercent || 70;
  const prepaymentAmount = Math.round((totalAmount * prepaymentPct) / 100);
  const productionDays = customDraftDoc?.productionDays || company.defaultProductionDays || 21;

  const handleApply = () => {
    onSelectTemplate(activeTmplId);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-xs z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className={`rounded-2xl max-w-6xl w-full flex flex-col my-auto shadow-2xl border max-h-[96vh] overflow-hidden ${
        isLight ? 'bg-[#F4F4F5] border-black/[0.1] text-[#1A1A1A]' : 'bg-[#181818] border-white/[0.1] text-white'
      }`}>
        {/* Top Header */}
        <div className={`p-4 border-b flex items-center justify-between gap-3 shrink-0 ${
          isLight ? 'bg-white border-black/[0.08]' : 'bg-[#1E1E1E] border-white/[0.08]'
        }`}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#2563EB]/10 text-[#2563EB]">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="meta-label text-[#2563EB]">ГАЛЕРЕЯ СТИЛЕЙ ОФОРМЛЕНИЯ</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/[0.05] dark:bg-white/[0.08] text-neutral-600 dark:text-neutral-300 font-semibold">
                  4 готовых шаблона
                </span>
              </div>
              <h2 className="text-sm font-bold tracking-tight mt-0.5">
                Визуальный выбор шаблона коммерческого предложения и счета
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Zoom selector */}
            <div className="hidden sm:flex items-center gap-1 text-xs font-mono font-medium text-neutral-400 bg-black/[0.03] dark:bg-white/[0.04] p-1 rounded-lg">
              <button
                onClick={() => setZoomLevel(75)}
                className={`px-2 py-0.5 rounded ${zoomLevel === 75 ? 'bg-white dark:bg-[#252525] text-[#2563EB] shadow-2xs font-bold' : 'hover:text-neutral-700'}`}
              >
                75%
              </button>
              <button
                onClick={() => setZoomLevel(85)}
                className={`px-2 py-0.5 rounded ${zoomLevel === 85 ? 'bg-white dark:bg-[#252525] text-[#2563EB] shadow-2xs font-bold' : 'hover:text-neutral-700'}`}
              >
                85%
              </button>
              <button
                onClick={() => setZoomLevel(100)}
                className={`px-2 py-0.5 rounded ${zoomLevel === 100 ? 'bg-white dark:bg-[#252525] text-[#2563EB] shadow-2xs font-bold' : 'hover:text-neutral-700'}`}
              >
                100%
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-white rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Gallery Content: Split View (Sidebar Cards + Live Scaled Canvas) */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
          
          {/* Left Sidebar: Template Switcher & Specs */}
          <div className={`w-full md:w-80 shrink-0 border-b md:border-b-0 md:border-r p-4 overflow-y-auto flex flex-col justify-between gap-4 ${
            isLight ? 'bg-white border-black/[0.08]' : 'bg-[#1C1C1C] border-white/[0.08]'
          }`}>
            <div className="space-y-4">
              <div className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider">
                Выберите стиль для просмотра:
              </div>

              {/* 4 Template Selection Tiles */}
              <div className="space-y-2">
                {PROPOSAL_TEMPLATES.map((tmpl) => {
                  const isActive = tmpl.id === activeTmplId;
                  const isCurrentChosen = tmpl.id === selectedTemplateId;

                  return (
                    <button
                      key={tmpl.id}
                      type="button"
                      onClick={() => setActiveTmplId(tmpl.id)}
                      className={`w-full p-3 rounded-xl border text-left transition-all flex items-start justify-between gap-2 relative ${
                        isActive
                          ? 'border-[#2563EB] bg-blue-50/70 dark:bg-blue-950/40 ring-2 ring-[#2563EB]/80 shadow-xs'
                          : isLight
                          ? 'border-black/[0.08] hover:bg-neutral-50 hover:border-black/20'
                          : 'border-white/[0.08] hover:bg-[#242424] hover:border-white/20'
                      }`}
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                            tmpl.id === 'offer'
                              ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300'
                              : tmpl.id === 'manufacturing'
                              ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : tmpl.id === 'premium'
                              ? 'bg-blue-100 text-blue-900 dark:bg-blue-950/60 dark:text-blue-300'
                              : 'bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-200'
                          }`}>
                            {tmpl.badge}
                          </span>
                          {isCurrentChosen && (
                            <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-[#2563EB]/10 text-[#2563EB] font-bold">
                              Текущий
                            </span>
                          )}
                        </div>

                        <div className="font-bold text-xs truncate text-[#1A1A1A] dark:text-white">
                          {tmpl.name}
                        </div>
                      </div>

                      <div className="pt-0.5">
                        {isActive ? (
                          <CheckCircle2 className="w-4 h-4 text-[#2563EB] shrink-0" />
                        ) : (
                          <div className="w-3.5 h-3.5 rounded-full border border-neutral-300 dark:border-neutral-600" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Inspector Card of Current Selected Template */}
              <div className="p-3.5 rounded-xl border border-black/[0.06] dark:border-white/[0.06] bg-black/[0.02] dark:bg-white/[0.02] space-y-3 text-xs">
                <div>
                  <span className="text-[10px] font-mono text-neutral-400 uppercase block mb-1 flex items-center gap-1">
                    <Users className="w-3 h-3 text-[#2563EB]" /> Кому идеально подходит:
                  </span>
                  <div className="font-semibold text-neutral-900 dark:text-white text-[11px] leading-relaxed">
                    {currentTemplate.targetAudience}
                  </div>
                </div>

                <div className="pt-2 border-t border-black/[0.04] dark:border-white/[0.04]">
                  <span className="text-[10px] font-mono text-neutral-400 uppercase block mb-1.5 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-500" /> Ключевые элементы оформления:
                  </span>
                  <div className="space-y-1 text-[11px] text-neutral-600 dark:text-neutral-300 font-medium">
                    {currentTemplate.features.map((feat, idx) => (
                      <div key={idx} className="flex items-start gap-1.5">
                        <Check className="w-3 h-3 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Apply CTA */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleApply}
                className="w-full py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-2xs transition-colors"
              >
                <Check className="w-4 h-4" />
                <span>Применить этот шаблон</span>
              </button>
            </div>
          </div>

          {/* Right Area: Interactive Live Scaled A4 Sheet Preview */}
          <div className="flex-1 bg-neutral-200/70 dark:bg-[#121212] overflow-y-auto p-4 sm:p-8 flex justify-center items-start">
            <div
              className="w-full max-w-[800px] bg-white text-neutral-900 shadow-2xl rounded-xl p-8 sm:p-12 space-y-6 text-xs font-sans transition-all duration-300 origin-top"
              style={{ transform: `scale(${zoomLevel / 100})` }}
            >
              
              {/* ======================================================== */}
              {/* TEMPLATE 1: «ПРЕМИУМ СТУДИЯ» (ДИЗАЙНЕРСКОЕ КП) */}
              {/* ======================================================== */}
              {activeTmplId === 'premium' && (
                <div className="space-y-6">
                  {/* Top Premium Banner */}
                  <div className="p-6 rounded-2xl bg-gradient-to-r from-neutral-950 via-neutral-900 to-[#1E293B] text-white flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-mono tracking-[0.2em] text-[#60A5FA] uppercase font-bold">
                        КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ
                      </div>
                      <h1 className="text-xl font-bold tracking-tight mt-1">{company.brandName || 'Satori Design Workshop'}</h1>
                      <p className="text-xs text-neutral-400 mt-1 max-w-md">
                        Индивидуальное изготовление авторской мебели, освещения и предметов интерьера
                      </p>
                    </div>

                    <div className="text-right text-[11px] font-mono space-y-0.5 text-neutral-300">
                      <div className="text-sm font-bold text-white">КП-2026/04</div>
                      <div>от {new Date().toLocaleDateString('ru-RU')}</div>
                      <div className="text-emerald-400 font-semibold">Срок действия: {company.defaultValidityDays} дней</div>
                    </div>
                  </div>

                  {/* Dual Cards */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/70 space-y-1">
                      <span className="text-[10px] font-mono uppercase text-neutral-400 block font-bold">ИСПОЛНИТЕЛЬ / МАСТЕРСКАЯ</span>
                      <div className="font-bold text-xs text-neutral-900">{company.companyName}</div>
                      <div className="text-[11px] text-neutral-600">{company.actualAddress}</div>
                      <div className="text-[11px] text-neutral-500 font-mono">
                        Тел: {company.phone} · {company.email}
                      </div>
                    </div>

                    <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/70 space-y-1">
                      <span className="text-[10px] font-mono uppercase text-neutral-400 block font-bold">ЗАКАЗЧИК ПРОЕКТА</span>
                      <div className="font-bold text-xs text-neutral-900">{sampleClient.name}</div>
                      <div className="text-[11px] text-neutral-600">{sampleClient.company}</div>
                      <div className="text-[11px] text-neutral-500 font-mono">
                        {sampleClient.phone} · {sampleClient.email}
                      </div>
                    </div>
                  </div>

                  {/* Spec table */}
                  <div className="border border-neutral-200 rounded-xl overflow-hidden shadow-2xs">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-neutral-100 border-b border-neutral-200 font-semibold font-mono text-[11px] text-neutral-600">
                        <tr>
                          <th className="py-2.5 px-3">Наименование изделия / работ</th>
                          <th className="py-2.5 px-2 text-center w-16">Кол-во</th>
                          <th className="py-2.5 px-3 text-right">Цена за ед.</th>
                          <th className="py-2.5 px-3 text-right">Сумма</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100">
                        {sampleItems.map((it, idx) => (
                          <tr key={idx}>
                            <td className="py-3 px-3">
                              <div className="font-bold text-neutral-900">{it.title}</div>
                              {it.material && (
                                <div className="text-[11px] text-neutral-500 mt-0.5">
                                  Материалы: <strong className="text-neutral-700">{it.material}</strong>
                                </div>
                              )}
                            </td>
                            <td className="py-3 px-2 text-center font-mono font-semibold">{it.quantity} шт.</td>
                            <td className="py-3 px-3 text-right font-mono tabular-nums">{formatCurrency(it.unitPrice)}</td>
                            <td className="py-3 px-3 text-right font-mono font-bold tabular-nums text-neutral-900">
                              {formatCurrency(it.unitPrice * it.quantity)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* 3 Metric Pills */}
                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div className="p-3 rounded-xl border border-neutral-200 bg-neutral-50">
                      <span className="text-[10px] font-mono text-neutral-400 block uppercase font-bold flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[#2563EB]" /> СРОК В ЦЕХУ
                      </span>
                      <div className="font-bold text-sm text-neutral-900 mt-1">{productionDays} раб. дней</div>
                      <div className="text-[10px] text-neutral-500 mt-0.5">с даты внесения аванса</div>
                    </div>

                    <div className="p-3 rounded-xl border border-neutral-200 bg-neutral-50">
                      <span className="text-[10px] font-mono text-neutral-400 block uppercase font-bold flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" /> ГАРАНТИЯ МАСТЕРСКОЙ
                      </span>
                      <div className="font-bold text-sm text-emerald-700 mt-1">{company.guaranteeMonths} месяца</div>
                      <div className="text-[10px] text-neutral-500 mt-0.5">сервисный паспорт</div>
                    </div>

                    <div className="p-3 rounded-xl border border-neutral-200 bg-neutral-50">
                      <span className="text-[10px] font-mono text-neutral-400 block uppercase font-bold flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-purple-600" /> СХЕМА ОПЛАТЫ
                      </span>
                      <div className="font-bold text-sm text-neutral-900 mt-1">{prepaymentPct}% / {100 - prepaymentPct}%</div>
                      <div className="text-[10px] text-neutral-500 mt-0.5">безналичный расчет</div>
                    </div>
                  </div>

                  {/* Dark total bar */}
                  <div className="p-4 rounded-xl bg-neutral-900 text-white flex items-center justify-between">
                    <div>
                      <span className="text-xs text-neutral-400 uppercase font-mono block">ИТОГО ПО СПЕЦИФИКАЦИИ:</span>
                      <span className="text-xl font-bold font-mono text-white mt-0.5 block">{formatCurrency(totalAmount)}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-neutral-400 uppercase font-mono block">Аванс к оплате ({prepaymentPct}%):</span>
                      <span className="text-base font-bold font-mono text-emerald-400">{formatCurrency(prepaymentAmount)}</span>
                    </div>
                  </div>

                  {/* Requisites Footer */}
                  <div className="pt-4 border-t border-neutral-200 text-[10px] text-neutral-500 space-y-1 font-mono">
                    <div className="font-bold text-neutral-700">РЕКВИЗИТЫ ПОСТАВЩИКА ДЛЯ ДОГОВОРА:</div>
                    <div>{company.companyName} · ИНН {company.inn} · КПП {company.kpp} · ОГРН {company.ogrn}</div>
                    <div>р/с {company.accountNumber} в {company.bankName} (БИК {company.bik}, к/с {company.corrAccount})</div>
                  </div>
                </div>
              )}

              {/* ======================================================== */}
              {/* TEMPLATE 2: «СЧЕТ-ОФЕРТА ПО ФОРМЕ ГОСТ / 1С» */}
              {/* ======================================================== */}
              {activeTmplId === 'offer' && (
                <div className="space-y-5">
                  <div className="text-[10px] text-neutral-500 italic pb-2 border-b border-neutral-300">
                    Внимание! Оплата данного счета означает согласие с условиями поставки товара. Счет действителен к оплате в течение 5 банковских дней.
                  </div>

                  {/* Standard 1C Bank Header Plate */}
                  <div className="border-2 border-neutral-900 text-xs">
                    <div className="grid grid-cols-2 border-b border-neutral-900">
                      <div className="p-2 border-r border-neutral-900">
                        <div className="text-[10px] text-neutral-500">{company.bankName}</div>
                        <div className="font-semibold mt-1">Банк получателя</div>
                      </div>
                      <div className="grid grid-cols-3">
                        <div className="p-2 border-r border-neutral-900 font-mono text-[11px]">БИК</div>
                        <div className="p-2 col-span-2 font-mono font-bold">{company.bik}</div>
                        <div className="p-2 border-r border-t border-neutral-900 font-mono text-[11px]">Сч. №</div>
                        <div className="p-2 col-span-2 border-t border-neutral-900 font-mono font-semibold">{company.corrAccount}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2">
                      <div className="p-2 border-r border-neutral-900">
                        <div className="flex items-center gap-4 text-[11px] font-mono">
                          <span>ИНН: <strong>{company.inn}</strong></span>
                          <span>КПП: <strong>{company.kpp}</strong></span>
                        </div>
                        <div className="font-bold text-sm mt-1">{company.companyName}</div>
                        <div className="text-[10px] text-neutral-500">Получатель</div>
                      </div>
                      <div className="grid grid-cols-3">
                        <div className="p-2 border-r border-neutral-900 font-mono text-[11px]">Сч. №</div>
                        <div className="p-2 col-span-2 font-mono font-bold text-sm">{company.accountNumber}</div>
                      </div>
                    </div>
                  </div>

                  {/* Heading */}
                  <div className="pt-2">
                    <h1 className="text-xl font-bold font-mono tracking-tight">
                      Счет на оплату № СФ-2026/04 от {new Date().toLocaleDateString('ru-RU')} г.
                    </h1>
                    <div className="h-0.5 bg-neutral-900 mt-2" />
                  </div>

                  {/* Parties */}
                  <div className="space-y-1.5 text-xs">
                    <div className="grid grid-cols-12 gap-2">
                      <span className="col-span-2 text-neutral-500 font-medium">Поставщик:</span>
                      <span className="col-span-10 font-medium">
                        <strong>{company.companyName}</strong>, ИНН {company.inn}, {company.legalAddress}, тел.: {company.phone}
                      </span>
                    </div>
                    <div className="grid grid-cols-12 gap-2">
                      <span className="col-span-2 text-neutral-500 font-medium">Покупатель:</span>
                      <span className="col-span-10 font-medium">
                        <strong>{sampleClient.name} ({sampleClient.company})</strong>, тел.: {sampleClient.phone}
                      </span>
                    </div>
                  </div>

                  {/* Items Table */}
                  <div className="border border-neutral-900 overflow-hidden">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-neutral-100 border-b border-neutral-900 font-semibold font-mono text-[11px]">
                        <tr>
                          <th className="py-2 px-2 text-center w-8 border-r border-neutral-900">№</th>
                          <th className="py-2 px-3 border-r border-neutral-900">Товары (работы, услуги)</th>
                          <th className="py-2 px-2 text-center w-14 border-r border-neutral-900">Кол-во</th>
                          <th className="py-2 px-2 text-center w-12 border-r border-neutral-900">Ед.</th>
                          <th className="py-2 px-3 text-right w-24 border-r border-neutral-900">Цена (₽)</th>
                          <th className="py-2 px-3 text-right w-28">Сумма (₽)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-300">
                        {sampleItems.map((it, idx) => (
                          <tr key={idx}>
                            <td className="py-2 px-2 text-center font-mono border-r border-neutral-300">{idx + 1}</td>
                            <td className="py-2 px-3 border-r border-neutral-300 font-medium">{it.title}</td>
                            <td className="py-2 px-2 text-center font-mono border-r border-neutral-300">{it.quantity}</td>
                            <td className="py-2 px-2 text-center text-neutral-500 border-r border-neutral-300">шт.</td>
                            <td className="py-2 px-3 text-right font-mono tabular-nums border-r border-neutral-300">{formatCurrency(it.unitPrice)}</td>
                            <td className="py-2 px-3 text-right font-mono font-bold tabular-nums">{formatCurrency(it.unitPrice * it.quantity)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Subtotals & Total in Words */}
                  <div className="flex flex-col items-end space-y-1 font-mono text-xs">
                    <div className="flex justify-between w-64 text-neutral-600">
                      <span>Итого:</span>
                      <span className="font-semibold">{formatCurrency(totalAmount)}</span>
                    </div>
                    <div className="flex justify-between w-64 text-neutral-600">
                      <span>В том числе НДС:</span>
                      <span>Без НДС</span>
                    </div>
                    <div className="flex justify-between w-64 text-sm font-bold text-neutral-900 pt-1 border-t border-neutral-400">
                      <span>Всего к оплате:</span>
                      <span className="text-[#2563EB]">{formatCurrency(totalAmount)}</span>
                    </div>
                  </div>

                  {/* Stamp & Signatures */}
                  <div className="pt-6 grid grid-cols-2 gap-8 items-end">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b border-neutral-400 pb-1">
                        <span className="font-medium text-[11px]">Руководитель:</span>
                        <span className="font-bold text-xs">{company.ceoName}</span>
                      </div>
                      <div className="flex items-center justify-between border-b border-neutral-400 pb-1">
                        <span className="font-medium text-[11px]">Бухгалтер:</span>
                        <span className="font-bold text-xs">{company.accountantName}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-center gap-6">
                      <div className="w-22 h-22 border-2 border-dashed border-[#2563EB]/40 rounded-full flex flex-col items-center justify-center text-center text-[8px] font-mono text-[#2563EB] rotate-[-8deg] p-1 bg-blue-50/20 select-none">
                        <span className="font-bold uppercase tracking-wider">М.П.</span>
                        <span className="text-[7px] leading-tight">{company.companyName}</span>
                        <span className="text-[7px]">ИНН {company.inn}</span>
                      </div>

                      <div className="p-2 border border-neutral-300 rounded bg-white font-mono text-[9px] text-center shrink-0">
                        <div className="w-12 h-12 bg-neutral-900 text-white flex items-center justify-center font-bold rounded-xs">
                          QR СБП
                        </div>
                        <span className="text-[7px] text-neutral-400 mt-0.5 block">Оплата СБП</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ======================================================== */}
              {/* TEMPLATE 3: «ПРОИЗВОДСТВЕННЫЙ СТАНДАРТ» */}
              {/* ======================================================== */}
              {activeTmplId === 'manufacturing' && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between pb-3 border-b-2 border-emerald-600">
                    <div>
                      <span className="text-[10px] font-mono text-emerald-700 uppercase font-bold tracking-widest">
                        ТЕХНИКО-КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ
                      </span>
                      <h1 className="text-lg font-bold text-neutral-900">{company.companyName}</h1>
                      <div className="text-[11px] text-neutral-500">{company.actualAddress}</div>
                    </div>
                    <div className="text-right font-mono text-xs">
                      <div className="font-bold text-sm text-emerald-800">ТЗ-СПЕЦИФИКАЦИЯ № КП-2026/04</div>
                      <div className="text-neutral-500">Дата: {new Date().toLocaleDateString('ru-RU')}</div>
                    </div>
                  </div>

                  <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-lg text-xs space-y-1">
                    <span className="font-bold text-emerald-950">Параметры производственного цикла:</span>
                    <div className="grid grid-cols-3 gap-2 text-[11px] text-emerald-900 font-mono mt-1">
                      <div>Срок в цеху: <strong>{productionDays} дней</strong></div>
                      <div>Контроль ОТК: <strong>ГОСТ 16371-2014</strong></div>
                      <div>Упаковка: <strong>Трехслойная тара</strong></div>
                    </div>
                  </div>

                  <div className="border border-neutral-300 rounded-lg overflow-hidden">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-neutral-100 border-b border-neutral-300 font-mono text-[11px]">
                        <tr>
                          <th className="p-2 border-r border-neutral-300">№</th>
                          <th className="p-2 border-r border-neutral-300">Конструктив / Изделие</th>
                          <th className="p-2 border-r border-neutral-300">Материалы и отделка</th>
                          <th className="p-2 text-center border-r border-neutral-300">Кол-во</th>
                          <th className="p-2 text-right">Сумма (₽)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-200">
                        {sampleItems.map((it, idx) => (
                          <tr key={idx}>
                            <td className="p-2 font-mono border-r border-neutral-200">{idx + 1}</td>
                            <td className="p-2 font-bold text-neutral-900 border-r border-neutral-200">{it.title}</td>
                            <td className="p-2 text-neutral-600 border-r border-neutral-200">{it.material}</td>
                            <td className="p-2 text-center font-mono border-r border-neutral-200">{it.quantity} шт.</td>
                            <td className="p-2 text-right font-mono font-bold">{formatCurrency(it.unitPrice * it.quantity)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-neutral-100 rounded-lg font-mono">
                    <span className="font-bold text-xs">ИТОГО К ВЫПЛАТЕ:</span>
                    <span className="font-bold text-base text-emerald-800">{formatCurrency(totalAmount)}</span>
                  </div>
                </div>
              )}

              {/* ======================================================== */}
              {/* TEMPLATE 4: «ЭКСПРЕСС КП» */}
              {/* ======================================================== */}
              {activeTmplId === 'standard' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
                    <div>
                      <h1 className="text-base font-bold text-neutral-900">{company.brandName}</h1>
                      <div className="text-[11px] text-neutral-500">Коммерческое предложение № КП-2026/04</div>
                    </div>
                    <div className="text-right text-xs font-mono">
                      <div className="font-bold text-neutral-800">{formatCurrency(totalAmount)}</div>
                      <div className="text-[10px] text-neutral-400">Предоплата: {prepaymentPct}%</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-xs">Заказчик: <strong>{sampleClient.name}</strong></div>
                    <div className="border border-neutral-200 rounded-lg overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-neutral-50 border-b border-neutral-200 font-mono text-[10px] uppercase">
                          <tr>
                            <th className="p-2">Позиция</th>
                            <th className="p-2 text-center">Кол-во</th>
                            <th className="p-2 text-right">Сумма</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100">
                          {sampleItems.map((it, idx) => (
                            <tr key={idx}>
                              <td className="p-2 font-medium">{it.title}</td>
                              <td className="p-2 text-center font-mono">{it.quantity}</td>
                              <td className="p-2 text-right font-mono font-bold">{formatCurrency(it.unitPrice * it.quantity)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="p-3 bg-neutral-50 rounded-lg text-xs space-y-1">
                    <div>Срок изготовления: <strong>{productionDays} рабочих дней</strong></div>
                    <div>Условия оплаты: <strong>{prepaymentPct}% аванс, {100 - prepaymentPct}% по готовности</strong></div>
                    <div>Реквизиты: {company.companyName}, ИНН {company.inn}, р/с {company.accountNumber} в {company.bankName}</div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className={`p-4 border-t flex items-center justify-between gap-3 shrink-0 ${
          isLight ? 'bg-white border-black/[0.08]' : 'bg-[#1E1E1E] border-white/[0.08]'
        }`}>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-neutral-400 font-mono">Выбранный стиль:</span>
            <strong className="text-[#2563EB]">{currentTemplate.name}</strong>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border text-xs font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              Отмена
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="px-5 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors"
            >
              <Check className="w-4 h-4" />
              <span>Применить выбранный стиль</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
