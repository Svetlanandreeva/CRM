import React, { useState } from 'react';
import {
  FileText,
  Plus,
  Trash2,
  X,
  Building2,
  Sparkles,
  Calendar,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Settings,
  Eye
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { DocumentType, DealItem, ProposalTemplateId, DocumentRecord } from '../../types/crm';
import { PROPOSAL_TEMPLATES } from '../../data/mockData';
import { DocumentTemplateViewer } from '../documents/DocumentTemplateViewer';
import { TemplateThumbnailCard } from '../documents/TemplateThumbnailCard';
import { TemplatePreviewGalleryModal } from '../documents/TemplatePreviewGalleryModal';

export const CreateInvoiceModal: React.FC = () => {
  const {
    isCreateInvoiceOpen,
    setIsCreateInvoiceOpen,
    addDocument,
    clients,
    catalog,
    companySettings,
    setCurrentTab,
    theme
  } = useCrm();

  const isLight = theme === 'light';

  const [docType, setDocType] = useState<DocumentType>('proposal');
  const [clientId, setClientId] = useState(clients[0]?.id || '');
  const [docTitle, setDocTitle] = useState('Коммерческое предложение на индивидуальное изготовление');
  const [selectedTemplate, setSelectedTemplate] = useState<ProposalTemplateId>(
    companySettings.defaultTemplateId || 'premium'
  );

  // Custom terms initialized from company settings
  const [prepaymentPercent, setPrepaymentPercent] = useState<number>(
    companySettings.defaultPrepaymentPercent || 70
  );
  const [productionDays, setProductionDays] = useState<number>(
    companySettings.defaultProductionDays || 21
  );
  const [validityDays, setValidityDays] = useState<number>(
    companySettings.defaultValidityDays || 14
  );

  const [items, setItems] = useState<DealItem[]>([
    {
      id: 'it_1',
      title: catalog[0]?.title || 'Подвесной светильник «Satori Wave»',
      quantity: 1,
      unitPrice: catalog[0]?.basePrice || 45000,
      primeCost: catalog[0]?.primeCost || 22000,
      material: catalog[0]?.materials.join(', ') || 'Шпон дуба, латунь'
    }
  ]);

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);

  if (!isCreateInvoiceOpen) return null;

  const totalAmount = items.reduce((sum, it) => sum + (it.unitPrice * it.quantity), 0);
  const prepaymentAmount = Math.round((totalAmount * prepaymentPercent) / 100);

  const selectedClient = clients.find(c => c.id === clientId) || clients[0];

  // Draft document representation for live preview before creation
  const draftDocument: DocumentRecord = {
    id: 'preview_draft',
    number: docType === 'proposal' ? 'КП-2026/ПРЕВЬЮ' : docType === 'invoice' ? 'СФ-2026/ПРЕВЬЮ' : 'АКТ-ПРЕВЬЮ',
    type: docType,
    title: docTitle,
    clientId: selectedClient?.id || '',
    clientName: selectedClient ? `${selectedClient.name}${selectedClient.company ? ` (${selectedClient.company})` : ''}` : 'Заказчик',
    amount: totalAmount,
    status: 'draft',
    createdAt: new Date().toISOString(),
    validUntil: new Date(Date.now() + validityDays * 86400000).toISOString().split('T')[0],
    items: items,
    templateId: selectedTemplate,
    companySnapshot: companySettings,
    prepaymentPercent,
    productionDays
  };

  const handleAddItemFromCatalog = (catId: string) => {
    const catItem = catalog.find(c => c.id === catId);
    if (!catItem) return;

    setItems(prev => [
      ...prev,
      {
        id: `it_${Date.now()}`,
        title: catItem.title,
        quantity: 1,
        unitPrice: catItem.basePrice,
        primeCost: catItem.primeCost,
        material: catItem.materials.join(', '),
      }
    ]);
  };

  const handleAddNewCustomItem = () => {
    setItems(prev => [
      ...prev,
      {
        id: `it_${Date.now()}`,
        title: 'Новое изделие по спецификации',
        quantity: 1,
        unitPrice: 50000,
        primeCost: 25000,
        material: 'Массив, металл'
      }
    ]);
  };

  const handleRemoveItem = (idx: number) => {
    setItems(prev => prev.filter((_, i) => i !== idx));
  };

  const handleFinalSubmit = (templateToUse?: ProposalTemplateId) => {
    const cl = clients.find(c => c.id === clientId) || clients[0];
    const prefix = docType === 'proposal' ? 'КП-2026/' : docType === 'invoice' ? 'СФ-2026/' : 'АКТ-';
    const number = `${prefix}${Math.floor(100 + Math.random() * 900)}`;

    const validUntilDate = new Date();
    validUntilDate.setDate(validUntilDate.getDate() + validityDays);

    addDocument({
      number,
      type: docType,
      title: docTitle,
      clientId: cl.id,
      clientName: cl.name + (cl.company ? ` (${cl.company})` : ''),
      amount: totalAmount,
      status: 'sent',
      items,
      templateId: templateToUse || selectedTemplate,
      companySnapshot: companySettings, // Attach current settings requisites!
      prepaymentPercent,
      productionDays,
      validUntil: validUntilDate.toISOString().split('T')[0],
    });

    setIsPreviewOpen(false);
    setIsCreateInvoiceOpen(false);
    setCurrentTab('documents');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleFinalSubmit(selectedTemplate);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className={`rounded-2xl max-w-3xl w-full p-6 space-y-5 shadow-2xl max-h-[92vh] overflow-y-auto border my-auto ${
        isLight ? 'bg-white border-black/[0.08] text-[#1A1A1A]' : 'bg-[#1C1C1C] border-white/[0.08] text-white'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between pb-3 border-b ${
          isLight ? 'border-black/[0.06]' : 'border-white/[0.06]'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#2563EB]/10 text-[#2563EB]">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="meta-label text-[#2563EB]">ГЕНЕРАТОР ДОКУМЕНТОВ</div>
              <h2 className="text-base font-bold tracking-tight">
                {docType === 'proposal' ? 'Создать Коммерческое предложение (КП)' : docType === 'invoice' ? 'Выставить Счет на оплату' : 'Оформить Акт приема-передачи'}
              </h2>
            </div>
          </div>
          <button onClick={() => setIsCreateInvoiceOpen(false)} className="text-neutral-400 hover:text-neutral-700 dark:hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Company Requisites Banner */}
        <div className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 text-xs ${
          isLight ? 'bg-blue-50/70 border-blue-200/80 text-blue-950' : 'bg-blue-950/20 border-blue-900/40 text-blue-200'
        }`}>
          <div className="flex items-start gap-2.5">
            <Building2 className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold flex items-center gap-1.5">
                <span>Реквизиты вашей компании: <strong>{companySettings.companyName}</strong></span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-blue-100 dark:bg-blue-900/50 text-[#2563EB]">
                  ИНН: {companySettings.inn}
                </span>
              </div>
              <div className="text-[11px] text-blue-800/80 dark:text-blue-300/80 font-mono mt-0.5">
                Банк: {companySettings.bankName} · р/с {companySettings.accountNumber} · БИК {companySettings.bik}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setIsCreateInvoiceOpen(false);
              setCurrentTab('settings');
            }}
            className="px-2.5 py-1 rounded-lg border border-blue-300 dark:border-blue-800 text-[11px] font-semibold text-[#2563EB] hover:bg-blue-100/50 dark:hover:bg-blue-900/40 transition-colors shrink-0 flex items-center gap-1"
          >
            <Settings className="w-3 h-3" />
            <span>Изменить</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Doc Type & Client */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-semibold block mb-1">Тип документа</label>
              <select
                value={docType}
                onChange={(e) => {
                  const t = e.target.value as DocumentType;
                  setDocType(t);
                  if (t === 'proposal') {
                    setDocTitle('Коммерческое предложение на индивидуальное изготовление');
                  } else if (t === 'invoice') {
                    setDocTitle(`Счет на предоплату ${prepaymentPercent}% по заказу`);
                  } else {
                    setDocTitle('Акт приема-передачи изготовленных изделий');
                  }
                }}
                className={`w-full rounded-xl p-2.5 border font-medium focus:outline-none focus:ring-1 focus:ring-[#2563EB] ${
                  isLight ? 'bg-[#F8F7F4] border-black/[0.08] text-[#1A1A1A]' : 'bg-[#252525] border-white/[0.08] text-white'
                }`}
              >
                <option value="proposal">Коммерческое предложение (КП)</option>
                <option value="invoice">Счет на оплату (Инвойс РФ)</option>
                <option value="act">Акт выполненных работ</option>
              </select>
            </div>

            <div>
              <label className="font-semibold block mb-1">Клиент (Получатель)</label>
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
          </div>

          {/* Document Title */}
          <div>
            <label className="font-semibold block mb-1">Название документа</label>
            <input
              type="text"
              required
              value={docTitle}
              onChange={(e) => setDocTitle(e.target.value)}
              className={`w-full rounded-xl p-2.5 border font-medium focus:outline-none focus:ring-1 focus:ring-[#2563EB] ${
                isLight ? 'bg-[#F8F7F4] border-black/[0.08] text-[#1A1A1A]' : 'bg-[#252525] border-white/[0.08] text-white'
              }`}
            />
          </div>

          {/* Template Selector with Visual Miniature Gallery */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <label className="font-semibold block">Стиль и шаблон оформления:</label>
                <span className="text-[11px] text-neutral-400">Нажмите на карточку или откройте галерею для сравнения</span>
              </div>

              <button
                type="button"
                onClick={() => setIsGalleryOpen(true)}
                className="px-3 py-1.5 rounded-lg border border-[#2563EB]/30 bg-blue-50/70 dark:bg-blue-950/40 text-[#2563EB] hover:bg-blue-100/80 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
                title="Открыть галерею превью всех шаблонов"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Галерея превью шаблонов</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {PROPOSAL_TEMPLATES.map((tmpl) => (
                <TemplateThumbnailCard
                  key={tmpl.id}
                  template={tmpl}
                  isSelected={selectedTemplate === tmpl.id}
                  onSelect={() => setSelectedTemplate(tmpl.id)}
                  onOpenGallery={() => {
                    setSelectedTemplate(tmpl.id);
                    setIsGalleryOpen(true);
                  }}
                />
              ))}
            </div>
          </div>

          {/* Production & Payment Terms (Prepayment, Days) */}
          <div className="grid grid-cols-3 gap-3 p-3 rounded-xl border border-black/[0.06] dark:border-white/[0.06] bg-black/[0.01] dark:bg-white/[0.02]">
            <div>
              <label className="text-[11px] font-semibold text-neutral-500 block mb-1">Размер аванса (%)</label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={prepaymentPercent}
                  onChange={(e) => setPrepaymentPercent(parseInt(e.target.value) || 0)}
                  className={`w-full rounded-lg px-2.5 py-1.5 text-xs border font-mono font-bold ${
                    isLight ? 'bg-white border-black/[0.08]' : 'bg-[#202020] border-white/[0.08]'
                  }`}
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 font-mono">%</span>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-neutral-500 block mb-1">Срок в цеху (дней)</label>
              <input
                type="number"
                min="1"
                value={productionDays}
                onChange={(e) => setProductionDays(parseInt(e.target.value) || 1)}
                className={`w-full rounded-lg px-2.5 py-1.5 text-xs border font-mono font-bold ${
                  isLight ? 'bg-white border-black/[0.08]' : 'bg-[#202020] border-white/[0.08]'
                }`}
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-neutral-500 block mb-1">Действие КП (дней)</label>
              <input
                type="number"
                min="1"
                value={validityDays}
                onChange={(e) => setValidityDays(parseInt(e.target.value) || 1)}
                className={`w-full rounded-lg px-2.5 py-1.5 text-xs border font-mono font-bold ${
                  isLight ? 'bg-white border-black/[0.08]' : 'bg-[#202020] border-white/[0.08]'
                }`}
              />
            </div>
          </div>

          {/* Quick add from Catalog */}
          <div className={`p-3 rounded-xl border flex flex-wrap items-center justify-between gap-3 ${
            isLight ? 'bg-[#F8F7F4] border-black/[0.06]' : 'bg-[#222222] border-white/[0.06]'
          }`}>
            <span className="font-semibold text-xs">Добавить позицию из каталога Satori:</span>
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
                <option value="" disabled>-- Выберите изделие Satori --</option>
                {catalog.map(c => (
                  <option key={c.id} value={c.id}>{c.title} — {formatCurrency(c.basePrice)}</option>
                ))}
              </select>

              <button
                type="button"
                onClick={handleAddNewCustomItem}
                className="px-2.5 py-1.5 rounded-lg border border-black/[0.08] dark:border-white/[0.08] text-xs font-semibold hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition-colors flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Своя строка</span>
              </button>
            </div>
          </div>

          {/* Items Table */}
          <div className="space-y-2">
            <label className="font-semibold block">Позиции спецификации:</label>
            <div className={`border rounded-xl overflow-hidden ${
              isLight ? 'border-black/[0.08]' : 'border-white/[0.08]'
            }`}>
              <table className="w-full text-left text-xs">
                <thead className={`border-b text-[10px] font-mono uppercase font-semibold ${
                  isLight ? 'bg-black/[0.02] text-neutral-500 border-black/[0.08]' : 'bg-white/[0.02] text-neutral-400 border-white/[0.08]'
                }`}>
                  <tr>
                    <th className="py-2.5 px-3">Наименование / Материал</th>
                    <th className="py-2.5 px-2 text-center w-16">Кол-во</th>
                    <th className="py-2.5 px-3 text-right">Цена за ед. (₽)</th>
                    <th className="py-2.5 px-3 text-right">Сумма (₽)</th>
                    <th className="py-2.5 px-2 text-center w-10"></th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isLight ? 'divide-black/[0.04]' : 'divide-white/[0.04]'}`}>
                  {items.map((it, idx) => (
                    <tr key={it.id}>
                      <td className="py-2.5 px-3 space-y-1">
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
                        <input
                          type="text"
                          placeholder="Материал и отделка..."
                          value={it.material || ''}
                          onChange={(e) => {
                            const mat = e.target.value;
                            setItems(prev => prev.map((item, i) => i === idx ? { ...item, material: mat } : item));
                          }}
                          className={`w-full rounded px-2 py-0.5 text-[11px] border font-normal text-neutral-400 ${
                            isLight ? 'bg-white/60 border-black/[0.06]' : 'bg-[#222222] border-white/[0.06]'
                          }`}
                        />
                      </td>
                      <td className="py-2.5 px-2 text-center align-top pt-3">
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
                      <td className="py-2.5 px-3 text-right align-top pt-3">
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
                      <td className="py-2.5 px-3 text-right font-mono font-bold tabular-nums align-top pt-4">
                        {formatCurrency(it.unitPrice * it.quantity)}
                      </td>
                      <td className="py-2.5 px-2 text-center align-top pt-3">
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

          {/* Total & Submit */}
          <div className="flex items-center justify-between pt-3 border-t border-black/[0.06] dark:border-white/[0.06]">
            <div>
              <span className="text-[10px] text-neutral-400 uppercase font-mono block">ИТОГО К ОПЛАТЕ:</span>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold font-mono text-[#2563EB]">{formatCurrency(totalAmount)}</span>
                <span className="text-xs text-neutral-400 font-mono">
                  (аванс {prepaymentPercent}%: {formatCurrency(prepaymentAmount)})
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setIsCreateInvoiceOpen(false)}
                className="px-4 py-2 font-semibold text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
              >
                Отмена
              </button>

              <button
                type="button"
                onClick={() => setIsPreviewOpen(true)}
                className="px-4 py-2.5 rounded-xl border border-black/[0.1] dark:border-white/[0.1] hover:bg-black/[0.04] dark:hover:bg-white/[0.04] text-[#1A1A1A] dark:text-white font-semibold text-xs flex items-center gap-1.5 transition-colors"
                title="Визуально проверить применение шаблона и реквизитов"
              >
                <Eye className="w-4 h-4 text-[#2563EB]" />
                <span>Предпросмотр</span>
              </button>

              <button
                type="submit"
                className="px-5 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-xl font-semibold shadow-2xs transition-colors"
              >
                Сформировать документ
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Pre-Creation Document Preview Modal */}
      {isPreviewOpen && (
        <DocumentTemplateViewer
          document={draftDocument}
          onClose={() => setIsPreviewOpen(false)}
          isPreCreationPreview={true}
          onConfirmCreate={(templateId) => {
            if (templateId) setSelectedTemplate(templateId);
            handleFinalSubmit(templateId);
          }}
        />
      )}

      {/* Visual Template Preview Gallery Modal */}
      <TemplatePreviewGalleryModal
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        selectedTemplateId={selectedTemplate}
        onSelectTemplate={(tmplId) => setSelectedTemplate(tmplId)}
        customDraftDoc={draftDocument}
      />
    </div>
  );
};
