import React, { useState, useRef } from 'react';
import {
  Printer,
  Copy,
  Check,
  X,
  FileText,
  Download,
  Share2,
  Building2,
  Calendar,
  ShieldCheck,
  Clock,
  Sparkles,
  Layers,
  ArrowUpRight,
  History,
  Loader2
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useCrm } from '../../context/CrmContext';
import { DocumentRecord, DocumentStatus, ProposalTemplateId } from '../../types/crm';
import { PROPOSAL_TEMPLATES } from '../../data/mockData';
import { TemplatePreviewGalleryModal } from './TemplatePreviewGalleryModal';
import { InvoiceHistoryTimeline } from './InvoiceHistoryTimeline';

interface DocumentTemplateViewerProps {
  document: DocumentRecord;
  onClose: () => void;
  onUpdateStatus?: (status: DocumentStatus) => void;
  isPreCreationPreview?: boolean;
  onConfirmCreate?: (templateId: ProposalTemplateId) => void;
}

export const DocumentTemplateViewer: React.FC<DocumentTemplateViewerProps> = ({
  document,
  onClose,
  onUpdateStatus,
  isPreCreationPreview = false,
  onConfirmCreate
}) => {
  const { companySettings, clients, managers, openClientCockpit, theme } = useCrm();
  const isLight = theme === 'light';

  // Use document snapshot if available, otherwise current companySettings from settings
  const company = document.companySnapshot || companySettings;
  const client = clients.find(c => c.id === document.clientId);

  const [activeTemplate, setActiveTemplate] = useState<ProposalTemplateId>(
    document.templateId || company.defaultTemplateId || 'premium'
  );
  const [copied, setCopied] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState<'document' | 'history'>('document');
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [pdfSuccessToast, setPdfSuccessToast] = useState<string | null>(null);

  const printSheetRef = useRef<HTMLDivElement>(null);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(val);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    // If on history tab, switch to document tab first to ensure the printable canvas is rendered
    if (activeModalTab !== 'document') {
      setActiveModalTab('document');
      await new Promise(r => setTimeout(r, 120));
    }

    const sheetEl = printSheetRef.current;
    if (!sheetEl) return;

    setIsDownloadingPdf(true);

    try {
      // High-resolution canvas capture (scale 2.5) for crisp typography & graphics
      const canvas = await html2canvas(sheetEl, {
        scale: 2.5,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 1024,
      });

      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true,
      });

      const pdfWidth = pdf.internal.pageSize.getWidth(); // 210mm
      const pdfHeight = pdf.internal.pageSize.getHeight(); // 297mm
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;

      if (imgHeight <= pdfHeight) {
        // Fits within a single standard A4 page
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, imgHeight, undefined, 'FAST');
      } else {
        // Multiple pages
        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pdfHeight;

        while (heightLeft > 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight, undefined, 'FAST');
          heightLeft -= pdfHeight;
        }
      }

      const safeNumber = (document.number || 'doc').replace(/[^a-zA-Z0-9А-Яа-я_-]/g, '_');
      const filename = `${document.type === 'invoice' ? 'Schet' : 'KP'}_${safeNumber}.pdf`;
      pdf.save(filename);

      setPdfSuccessToast(`✓ PDF «${filename}» успешно сформирован и скачан!`);
      setTimeout(() => setPdfSuccessToast(null), 3500);
    } catch (err) {
      console.error('Error generating PDF:', err);
      window.print();
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleCopyRequisites = () => {
    const text = `Реквизиты для оплаты:
Получатель: ${company.companyName}
ИНН: ${company.inn} / КПП: ${company.kpp}
Банк: ${company.bankName}
БИК: ${company.bik}
Р/с: ${company.accountNumber}
К/с: ${company.corrAccount}
Назначение: Оплата по ${document.type === 'invoice' ? 'счету' : 'КП'} №${document.number} от ${new Date(document.createdAt).toLocaleDateString('ru-RU')}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const totalAmount = document.amount || document.items?.reduce((s, it) => s + (it.unitPrice * it.quantity), 0) || 0;
  const prepaymentPct = document.prepaymentPercent || company.defaultPrepaymentPercent || 70;
  const prepaymentAmount = Math.round((totalAmount * prepaymentPct) / 100);
  const postpaymentAmount = totalAmount - prepaymentAmount;
  const productionDays = document.productionDays || company.defaultProductionDays || 21;

  // Number to words helper (simplified Russian generator for ruble invoice amounts)
  const amountToWords = (num: number): string => {
    return `${formatCurrency(num)} (НДС не облагается)`;
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className={`rounded-2xl max-w-4xl w-full flex flex-col my-auto shadow-2xl border max-h-[96vh] overflow-hidden relative ${
        isLight ? 'bg-[#F4F4F5] border-black/[0.1] text-[#1A1A1A]' : 'bg-[#181818] border-white/[0.1] text-white'
      }`}>
        {/* PDF Download Toast */}
        {pdfSuccessToast && (
          <div className="absolute top-16 right-6 z-50 animate-in fade-in slide-in-from-top-3 duration-200">
            <div className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold shadow-xl flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>{pdfSuccessToast}</span>
            </div>
          </div>
        )}
        
        {/* Top Control Bar (Non-printable) */}
        <div className={`p-4 border-b flex flex-wrap items-center justify-between gap-3 shrink-0 print:hidden ${
          isLight ? 'bg-white border-black/[0.08]' : 'bg-[#1E1E1E] border-white/[0.08]'
        }`}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#2563EB]/10 text-[#2563EB]">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-[#2563EB]">{document.number}</span>
                <span className={`text-xs px-2 py-0.5 rounded font-mono font-semibold ${
                  isPreCreationPreview
                    ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300'
                    : document.status === 'paid'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : document.status === 'approved'
                    ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300'
                    : 'bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200'
                }`}>
                  {isPreCreationPreview ? 'Предпросмотр перед созданием' : document.status === 'paid' ? 'Оплачено' : document.status === 'approved' ? 'Согласовано' : 'Активен'}
                </span>
              </div>
              <h2 className="text-sm font-bold truncate max-w-md mt-0.5">{document.title}</h2>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {activeModalTab === 'document' && (
              <>
                {/* Template Switcher & Gallery Button */}
                <div className="flex items-center gap-1.5 text-xs font-medium">
                  <span className="text-neutral-400 font-mono text-[11px] hidden md:inline">Шаблон:</span>
                  <select
                    value={activeTemplate}
                    onChange={(e) => setActiveTemplate(e.target.value as ProposalTemplateId)}
                    className={`text-xs rounded-lg px-2.5 py-1.5 border font-semibold focus:outline-none focus:ring-1 focus:ring-[#2563EB] ${
                      isLight ? 'bg-[#F8F7F4] border-black/[0.08] text-[#1A1A1A]' : 'bg-[#252525] border-white/[0.08] text-white'
                    }`}
                  >
                    {PROPOSAL_TEMPLATES.map(tmpl => (
                      <option key={tmpl.id} value={tmpl.id}>
                        {tmpl.name}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={() => setIsGalleryOpen(true)}
                    className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-colors ${
                      isLight
                        ? 'bg-neutral-50 hover:bg-neutral-100 border-black/[0.08] text-[#2563EB]'
                        : 'bg-[#252525] hover:bg-[#303030] border-white/[0.08] text-blue-300'
                    }`}
                    title="Открыть галерею шаблонов"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Галерея</span>
                  </button>
                </div>

                {/* Copy Requisites button */}
                <button
                  onClick={handleCopyRequisites}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    copied 
                      ? 'bg-emerald-500 text-white border-emerald-500' 
                      : isLight 
                      ? 'bg-white hover:bg-neutral-100 border-black/[0.08] text-[#1A1A1A]' 
                      : 'bg-[#252525] hover:bg-[#303030] border-white/[0.08] text-white'
                  }`}
                  title="Скопировать реквизиты компании"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Скопировано!' : 'Реквизиты'}</span>
                </button>

                {/* Download as PDF Button */}
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={isDownloadingPdf}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors"
                  title="Скачать документ в формате PDF высокого качества"
                >
                  {isDownloadingPdf ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Генерация PDF...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5" />
                      <span>Скачать PDF</span>
                    </>
                  )}
                </button>

                {/* Print */}
                <button
                  type="button"
                  onClick={handlePrint}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    isLight
                      ? 'bg-white hover:bg-neutral-100 border-black/[0.08] text-[#1A1A1A]'
                      : 'bg-[#252525] hover:bg-[#303030] border-white/[0.08] text-white'
                  }`}
                  title="Вывод на принтер (Ctrl+P)"
                >
                  <Printer className="w-3.5 h-3.5 text-neutral-400" />
                  <span className="hidden sm:inline">Печать</span>
                </button>
              </>
            )}

            {activeModalTab === 'history' && (
              <>
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={isDownloadingPdf}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors"
                >
                  {isDownloadingPdf ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5" />
                  )}
                  <span>Скачать PDF</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveModalTab('document')}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    isLight
                      ? 'bg-white hover:bg-neutral-100 border-black/[0.08] text-[#1A1A1A]'
                      : 'bg-[#252525] hover:bg-[#303030] border-white/[0.08] text-white'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5 text-[#2563EB]" />
                  <span>Печатный бланк</span>
                </button>
              </>
            )}

            {/* Close */}
            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-white rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sub-header Navigation Tabs (Document View vs History Timeline) */}
        <div className={`px-4 py-2 border-b flex items-center justify-between gap-3 text-xs shrink-0 print:hidden ${
          isLight ? 'bg-neutral-50/90 border-black/[0.06]' : 'bg-[#1C1C1C] border-white/[0.06]'
        }`}>
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-black/[0.04] dark:bg-white/[0.04] border border-black/[0.04] dark:border-white/[0.04]">
            <button
              type="button"
              onClick={() => setActiveModalTab('document')}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
                activeModalTab === 'document'
                  ? (isLight ? 'bg-white text-[#1A1A1A] shadow-xs' : 'bg-[#2A2A2A] text-white shadow-xs')
                  : 'text-neutral-500 hover:text-[#1A1A1A] dark:hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Печатный бланк</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveModalTab('history')}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
                activeModalTab === 'history'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-neutral-500 hover:text-[#1A1A1A] dark:hover:text-white'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>История</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                activeModalTab === 'history'
                  ? 'bg-white/20 text-white'
                  : 'bg-black/[0.06] dark:bg-white/[0.1] text-neutral-600 dark:text-neutral-300'
              }`}>
                {document.history?.length || (document.status === 'viewed' || document.status === 'paid' ? 3 : 2)}
              </span>
            </button>
          </div>

          <div className="flex items-center gap-3 text-[11px]">
            {activeModalTab === 'document' ? (
              <span className="text-neutral-400 font-mono hidden sm:inline">
                Стиль: {PROPOSAL_TEMPLATES.find(t => t.id === activeTemplate)?.name} · Формат А4
              </span>
            ) : (
              <span className="font-mono text-purple-600 dark:text-purple-400 font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Фиксация отправки и просмотров клиентом</span>
              </span>
            )}
          </div>
        </div>

        {/* Tab Content: Document Sheet vs History Timeline */}
        {activeModalTab === 'document' ? (
        /* Printable Document Sheet (A4 Styled White Canvas) */
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-neutral-200/60 dark:bg-[#101010] flex justify-center">
          <div ref={printSheetRef} className="w-full max-w-[800px] bg-white text-neutral-900 shadow-xl rounded-xl p-8 sm:p-12 print:shadow-none print:p-0 print:max-w-none print:w-full space-y-6 text-xs font-sans">
            
            {/* ======================================================== */}
            {/* TEMPLATE A: ГОСТ / ОФИЦИАЛЬНЫЙ СЧЕТ НА ОПЛАТУ (1C СТИЛЬ) */}
            {/* ======================================================== */}
            {(activeTemplate === 'offer' || document.type === 'invoice') && (
              <div className="space-y-5">
                {/* Notice text */}
                <div className="text-[10px] text-neutral-500 italic pb-2 border-b border-neutral-300">
                  Внимание! Оплата данного счета означает согласие с условиями поставки товара / оказания услуг. Счет действителен к оплате в течение 5 банковских дней.
                </div>

                {/* Bank Details Table (Standard 1C Plate) */}
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

                {/* Invoice Title */}
                <div className="pt-2">
                  <h1 className="text-xl font-bold font-mono tracking-tight">
                    Счет на оплату № {document.number} от {new Date(document.createdAt).toLocaleDateString('ru-RU')} г.
                  </h1>
                  <div className="h-0.5 bg-neutral-900 mt-2" />
                </div>

                {/* Parties Information */}
                <div className="space-y-1.5 text-xs">
                  <div className="grid grid-cols-12 gap-2">
                    <span className="col-span-2 text-neutral-500 font-medium">Поставщик:</span>
                    <span className="col-span-10 font-medium">
                      <strong>{company.companyName}</strong>, ИНН {company.inn}, КПП {company.kpp}, {company.legalAddress}, тел.: {company.phone}, email: {company.email}
                    </span>
                  </div>
                  <div className="grid grid-cols-12 gap-2">
                    <span className="col-span-2 text-neutral-500 font-medium">Покупатель:</span>
                    <span className="col-span-10 font-medium">
                      <strong>{document.clientName}</strong>
                      {client?.phone && <span>, тел.: {client.phone}</span>}
                      {client?.email && <span>, email: {client.email}</span>}
                    </span>
                  </div>
                  <div className="grid grid-cols-12 gap-2">
                    <span className="col-span-2 text-neutral-500 font-medium">Основание:</span>
                    <span className="col-span-10 text-neutral-700">
                      {document.title}
                    </span>
                  </div>
                </div>

                {/* Items Specification Table */}
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
                      {document.items && document.items.map((it, idx) => (
                        <tr key={it.id || idx}>
                          <td className="py-2 px-2 text-center font-mono border-r border-neutral-300">{idx + 1}</td>
                          <td className="py-2 px-3 border-r border-neutral-300 font-medium">
                            <div>{it.title}</div>
                            {it.material && <div className="text-[10px] text-neutral-500 font-normal">Материал: {it.material}</div>}
                          </td>
                          <td className="py-2 px-2 text-center font-mono border-r border-neutral-300">{it.quantity}</td>
                          <td className="py-2 px-2 text-center text-neutral-500 border-r border-neutral-300">шт.</td>
                          <td className="py-2 px-3 text-right font-mono tabular-nums border-r border-neutral-300">
                            {formatCurrency(it.unitPrice)}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold tabular-nums">
                            {formatCurrency(it.unitPrice * it.quantity)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Subtotals & Grand Total */}
                <div className="flex flex-col items-end space-y-1 font-mono text-xs">
                  <div className="flex justify-between w-64 text-neutral-600">
                    <span>Итого:</span>
                    <span className="font-semibold">{formatCurrency(totalAmount)}</span>
                  </div>
                  <div className="flex justify-between w-64 text-neutral-600">
                    <span>В том числе НДС:</span>
                    <span>{company.vatIncluded ? '20%' : 'Без НДС'}</span>
                  </div>
                  <div className="flex justify-between w-64 text-sm font-bold text-neutral-900 pt-1 border-t border-neutral-400">
                    <span>Всего к оплате:</span>
                    <span className="text-[#2563EB]">{formatCurrency(totalAmount)}</span>
                  </div>
                </div>

                {/* Total in Words */}
                <div className="text-xs pt-1 border-b border-neutral-300 pb-2">
                  <span>Всего наименований {document.items?.length || 1}, на сумму <strong>{amountToWords(totalAmount)}</strong></span>
                </div>

                {/* Payment QR code & Bank Details Summary */}
                <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-lg flex items-center justify-between gap-4">
                  <div className="space-y-1 text-[11px]">
                    <div className="font-semibold text-neutral-900 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#2563EB]" />
                      <span>Быстрая оплата по СБП и банковским переводом</span>
                    </div>
                    <div className="text-neutral-500">
                      Назначение: «Оплата по счету №{document.number} за мебель и изделия по проекту. Без НДС»
                    </div>
                  </div>
                  {/* Visual QR badge */}
                  <div className="p-2 border border-neutral-300 rounded bg-white font-mono text-[9px] text-center shrink-0">
                    <div className="w-14 h-14 bg-neutral-900 text-white flex items-center justify-center font-bold text-center p-1 rounded-xs">
                      QR СБП
                    </div>
                    <span className="text-[8px] text-neutral-400 mt-0.5 block">Т-Банк / СБП</span>
                  </div>
                </div>

                {/* Signatures & Seal Plate */}
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

                  {/* Stamp / Seal Visual */}
                  <div className="flex items-center justify-center">
                    <div className="w-24 h-24 border-2 border-dashed border-[#2563EB]/40 rounded-full flex flex-col items-center justify-center text-center text-[8px] font-mono text-[#2563EB] rotate-[-8deg] p-1 select-none">
                      <span className="font-bold uppercase tracking-wider">М.П.</span>
                      <span className="text-[7px] leading-tight">{company.companyName}</span>
                      <span className="text-[7px]">ИНН {company.inn}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* TEMPLATE B: «ПРЕМИУМ СТУДИЯ» (ДИЗАЙНЕРСКОЕ КП SATORI) */}
            {/* ======================================================== */}
            {activeTemplate === 'premium' && document.type !== 'invoice' && (
              <div className="space-y-6">
                {/* Header Banner */}
                <div className="p-6 rounded-2xl bg-gradient-to-r from-neutral-950 via-neutral-900 to-[#1E293B] text-white flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-mono tracking-[0.2em] text-[#60A5FA] uppercase font-bold">
                      КОММЕРЧЕСКОЕ ПРЕДЛОЖЕНИЕ
                    </div>
                    <h1 className="text-xl font-bold tracking-tight mt-1">{company.brandName}</h1>
                    <p className="text-xs text-neutral-400 mt-1 max-w-md">
                      Индивидуальное изготовление дизайнерской мебели, освещения и предметов интерьера
                    </p>
                  </div>

                  <div className="text-right text-[11px] font-mono space-y-0.5 text-neutral-300">
                    <div className="text-sm font-bold text-white">{document.number}</div>
                    <div>от {new Date(document.createdAt).toLocaleDateString('ru-RU')}</div>
                    <div className="text-emerald-400 font-semibold">Срок действия: {company.defaultValidityDays} дней</div>
                  </div>
                </div>

                {/* Company & Client Cards */}
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
                    <div className="font-bold text-xs text-neutral-900">{document.clientName}</div>
                    {client?.company && <div className="text-[11px] text-neutral-600">{client.company}</div>}
                    <div className="text-[11px] text-neutral-500 font-mono">
                      {client?.phone || 'Телефон согласован'} · {client?.email || ''}
                    </div>
                  </div>
                </div>

                {/* Proposal Intro */}
                <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-100 text-xs text-blue-950 space-y-1 leading-relaxed">
                  <div className="font-bold flex items-center gap-1.5 text-blue-800">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Индивидуальный расчет проекта «{document.title}»</span>
                  </div>
                  <p>
                    Благодарим за интерес к мастерской Satori. Ниже представлена подробная спецификация изделий с учетом согласованных материалов, фурнитуры и сроков производства. Все изделия проходят 3-ступенчатый контроль качества ОТК.
                  </p>
                </div>

                {/* Specification Table */}
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
                      {document.items && document.items.map((it, idx) => (
                        <tr key={it.id || idx}>
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

                {/* Production Timeline & Payment Terms */}
                <div className="grid grid-cols-3 gap-3 text-xs font-sans">
                  <div className="p-3 rounded-xl border border-neutral-200 bg-neutral-50">
                    <span className="text-[10px] font-mono text-neutral-400 block uppercase font-bold flex items-center gap-1">
                      <Clock className="w-3 h-3 text-[#2563EB]" /> СРОК ИЗГОТОВЛЕНИЯ
                    </span>
                    <div className="font-bold text-sm text-neutral-900 mt-1">{productionDays} раб. дней</div>
                    <div className="text-[10px] text-neutral-500 mt-0.5">с даты внесения предоплаты</div>
                  </div>

                  <div className="p-3 rounded-xl border border-neutral-200 bg-neutral-50">
                    <span className="text-[10px] font-mono text-neutral-400 block uppercase font-bold flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" /> ГАРАНТИЯ КАЧЕСТВА
                    </span>
                    <div className="font-bold text-sm text-emerald-700 mt-1">{company.guaranteeMonths} месяца</div>
                    <div className="text-[10px] text-neutral-500 mt-0.5">паспорт изделия и сервис</div>
                  </div>

                  <div className="p-3 rounded-xl border border-neutral-200 bg-neutral-50">
                    <span className="text-[10px] font-mono text-neutral-400 block uppercase font-bold flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-purple-600" /> СХЕМА ОПЛАТЫ
                    </span>
                    <div className="font-bold text-sm text-neutral-900 mt-1">{prepaymentPct}% / {100 - prepaymentPct}%</div>
                    <div className="text-[10px] text-neutral-500 mt-0.5">безналичный расчет с НДС 0%</div>
                  </div>
                </div>

                {/* Total Banner */}
                <div className="p-4 rounded-xl bg-neutral-900 text-white flex items-center justify-between">
                  <div>
                    <span className="text-xs text-neutral-400 uppercase font-mono block">ИТОГО ПО СПЕЦИФИКАЦИИ:</span>
                    <span className="text-xl font-bold font-mono text-white mt-0.5 block">{formatCurrency(totalAmount)}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-neutral-400 uppercase font-mono block">Предоплата ({prepaymentPct}%):</span>
                    <span className="text-base font-bold font-mono text-emerald-400">{formatCurrency(prepaymentAmount)}</span>
                  </div>
                </div>

                {/* Company Requisites in Footer */}
                <div className="pt-4 border-t border-neutral-200 text-[10px] text-neutral-500 space-y-1 font-mono">
                  <div className="font-bold text-neutral-700">РЕКВИЗИТЫ ПОСТАВЩИКА ДЛЯ ДОГОВОРА:</div>
                  <div>{company.companyName} · ИНН {company.inn} · КПП {company.kpp} · ОГРН {company.ogrn}</div>
                  <div>р/с {company.accountNumber} в {company.bankName} (БИК {company.bik}, к/с {company.corrAccount})</div>
                  <div>{company.notesFooter}</div>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* TEMPLATE C: «ПРОИЗВОДСТВЕННЫЙ СТАНДАРТ» (CRAFT & TECH) */}
            {/* ======================================================== */}
            {activeTemplate === 'manufacturing' && document.type !== 'invoice' && (
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
                    <div className="font-bold text-sm text-emerald-800">ТЗ-СПЕЦИФИКАЦИЯ №{document.number}</div>
                    <div className="text-neutral-500">Дата расчета: {new Date(document.createdAt).toLocaleDateString('ru-RU')}</div>
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

                {/* Items Specification */}
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
                      {document.items && document.items.map((it, idx) => (
                        <tr key={it.id || idx}>
                          <td className="p-2 font-mono border-r border-neutral-200">{idx + 1}</td>
                          <td className="p-2 font-bold text-neutral-900 border-r border-neutral-200">{it.title}</td>
                          <td className="p-2 text-neutral-600 border-r border-neutral-200">{it.material || 'По утвержденному образцу'}</td>
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

                {/* Requisites Footer */}
                <div className="pt-3 border-t border-neutral-300 text-[10px] text-neutral-500 font-mono leading-relaxed">
                  Банк: {company.bankName} · БИК {company.bik} · р/с {company.accountNumber} · ИНН {company.inn} · Генеральный директор: {company.ceoName}
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* TEMPLATE D: «ЭКСПРЕСС КП» (MINIMALIST ONE-PAGER) */}
            {/* ======================================================== */}
            {activeTemplate === 'standard' && document.type !== 'invoice' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
                  <div>
                    <h1 className="text-base font-bold text-neutral-900">{company.brandName}</h1>
                    <div className="text-[11px] text-neutral-500">Коммерческое предложение № {document.number}</div>
                  </div>
                  <div className="text-right text-xs font-mono">
                    <div className="font-bold text-neutral-800">{formatCurrency(totalAmount)}</div>
                    <div className="text-[10px] text-neutral-400">Предоплата: {prepaymentPct}%</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-xs">Заказчик: <strong>{document.clientName}</strong></div>
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
                        {document.items && document.items.map((it, idx) => (
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
        ) : (
          <InvoiceHistoryTimeline
            document={document}
            isPreCreationPreview={isPreCreationPreview}
            onUpdateStatus={onUpdateStatus}
          />
        )}

        {/* Bottom Actions Footer */}
        <div className={`p-4 border-t flex flex-wrap items-center justify-between gap-3 shrink-0 print:hidden ${
          isLight ? 'bg-white border-black/[0.08]' : 'bg-[#1E1E1E] border-white/[0.08]'
        }`}>
          {isPreCreationPreview ? (
            <div className="flex items-center gap-2 text-xs text-neutral-500">
              <Sparkles className="w-4 h-4 text-[#2563EB] shrink-0" />
              <span>Проверьте реквизиты компании, шаблон и спецификацию перед сохранением.</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-400 font-mono">Статус документа:</span>
              {onUpdateStatus && (
                <select
                  value={document.status}
                  onChange={(e) => onUpdateStatus(e.target.value as DocumentStatus)}
                  className={`text-xs rounded-lg px-2.5 py-1 border font-semibold focus:outline-none focus:ring-1 focus:ring-[#2563EB] ${
                    isLight ? 'bg-[#F8F7F4] border-black/[0.08] text-[#1A1A1A]' : 'bg-[#252525] border-white/[0.08] text-white'
                  }`}
                >
                  <option value="draft">Черновик</option>
                  <option value="sent">Отправлено клиенту</option>
                  <option value="viewed">Просмотрено</option>
                  <option value="approved">Согласовано</option>
                  <option value="paid">Оплачено</option>
                </select>
              )}
            </div>
          )}

          <div className="flex items-center gap-2">
            {isPreCreationPreview ? (
              <>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl border text-xs font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                  Вернуться к редактированию
                </button>
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={isDownloadingPdf}
                  className="px-4 py-2 rounded-xl border border-emerald-600/30 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold text-xs flex items-center gap-1.5 transition-colors hover:bg-emerald-100 dark:hover:bg-emerald-900/40"
                  title="Скачать предварительный PDF-файл"
                >
                  {isDownloadingPdf ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Генерация PDF...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5" />
                      <span>Скачать PDF</span>
                    </>
                  )}
                </button>
                {onConfirmCreate && (
                  <button
                    type="button"
                    onClick={() => onConfirmCreate(activeTemplate)}
                    className="px-5 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors"
                  >
                    <Check className="w-4 h-4" />
                    <span>Подтвердить и сформировать</span>
                  </button>
                )}
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    openClientCockpit(document.clientId);
                    onClose();
                  }}
                  className="px-3 py-1.5 rounded-lg border text-xs font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors flex items-center gap-1"
                >
                  <span>Карточка клиента</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={isDownloadingPdf}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors"
                  title="Скачать документ в формате PDF высокого качества"
                >
                  {isDownloadingPdf ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Генерация...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5" />
                      <span>Скачать PDF</span>
                    </>
                  )}
                </button>
                <button
                  onClick={handlePrint}
                  className="px-3.5 py-1.5 rounded-lg border text-xs font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors flex items-center gap-1.5 border-black/[0.08] dark:border-white/[0.08]"
                >
                  <Printer className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Печать</span>
                </button>
              </>
            )}
          </div>
        </div>

      </div>

      {/* Visual Template Preview Gallery Modal */}
      <TemplatePreviewGalleryModal
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        selectedTemplateId={activeTemplate}
        onSelectTemplate={(tmplId) => setActiveTemplate(tmplId)}
        customDraftDoc={document}
      />
    </div>
  );
};
