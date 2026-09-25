import React, { useState, useMemo } from 'react';
import {
  X,
  Search,
  Plus,
  Send,
  Copy,
  Check,
  Edit2,
  Trash2,
  Sparkles,
  Zap,
  ArrowRight,
  MessageSquare,
  BookmarkPlus
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { Client, QuickReplyTemplate } from '../../types/crm';

interface QuickRepliesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertTemplate: (text: string, sendImmediately?: boolean) => void;
  client: Client;
}

export const QuickRepliesDrawer: React.FC<QuickRepliesDrawerProps> = ({
  isOpen,
  onClose,
  onInsertTemplate,
  client
}) => {
  const {
    quickReplyTemplates,
    addQuickReplyTemplate,
    deleteQuickReplyTemplate,
    updateQuickReplyTemplate,
    theme
  } = useCrm();

  const isLight = theme === 'light';

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [autoReplaceVariables, setAutoReplaceVariables] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // New / Edit Template Modal state
  const [isEditingModalOpen, setIsEditingModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<QuickReplyTemplate | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState('Продажи');
  const [formText, setFormText] = useState('');

  // Extract client first name for friendly salutation
  const clientFirstName = client.name.split(' ')[0] || client.name;

  // Replace variable placeholders like {clientName}, {company}, {manager}
  const resolveTemplateVariables = (rawText: string) => {
    if (!autoReplaceVariables) return rawText;

    return rawText
      .replace(/\{clientName\}/g, clientFirstName)
      .replace(/\{clientFullName\}/g, client.name)
      .replace(/\{company\}/g, client.company || 'вашей компании')
      .replace(/\{manager\}/g, client.assignedManager || 'ваш менеджер')
      .replace(/\{phone\}/g, client.phone || '')
      .replace(/\{email\}/g, client.email || '');
  };

  // Categories list
  const categories = useMemo(() => {
    const list = Array.from(new Set(quickReplyTemplates.map(t => t.category)));
    return ['all', ...list];
  }, [quickReplyTemplates]);

  // Filtered templates
  const filteredTemplates = useMemo(() => {
    return quickReplyTemplates.filter(t => {
      const matchesSearch =
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.category.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory = selectedCategory === 'all' || t.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [quickReplyTemplates, searchQuery, selectedCategory]);

  const handleCopy = (id: string, text: string) => {
    const resolved = resolveTemplateVariables(text);
    navigator.clipboard.writeText(resolved);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleOpenCreateModal = () => {
    setEditingTemplate(null);
    setFormTitle('');
    setFormCategory('Продажи');
    setFormText('');
    setIsEditingModalOpen(true);
  };

  const handleOpenEditModal = (template: QuickReplyTemplate) => {
    setEditingTemplate(template);
    setFormTitle(template.title);
    setFormCategory(template.category);
    setFormText(template.text);
    setIsEditingModalOpen(true);
  };

  const handleSaveTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formText.trim()) return;

    if (editingTemplate) {
      updateQuickReplyTemplate(editingTemplate.id, {
        title: formTitle.trim(),
        category: formCategory.trim() || 'Общее',
        text: formText.trim()
      });
    } else {
      addQuickReplyTemplate({
        title: formTitle.trim(),
        category: formCategory.trim() || 'Общее',
        text: formText.trim()
      });
    }

    setIsEditingModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Удалить этот шаблон быстрых ответов?')) {
      deleteQuickReplyTemplate(id);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-40 flex justify-end overflow-hidden animate-in fade-in duration-200">
      {/* Dimmed backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity" 
        onClick={onClose} 
      />

      {/* Drawer Container (Variation 4 style: white surface, hairline border, crisp typography) */}
      <div className={`relative w-full max-w-md h-full flex flex-col shadow-2xl border-l z-50 transition-all ${
        isLight ? 'bg-white border-black/[0.08] text-[#1A1A1A]' : 'bg-[#181818] border-white/[0.08] text-neutral-100'
      }`}>
        {/* Header */}
        <div className={`p-4 sm:p-5 border-b flex items-center justify-between shrink-0 ${
          isLight ? 'border-black/[0.06] bg-[#F8F7F4]/50' : 'border-white/[0.06] bg-[#141414]'
        }`}>
          <div>
            <div className="flex items-center gap-1.5 text-[#2563EB]">
              <Zap className="w-3.5 h-3.5 fill-[#2563EB]" />
              <span className="meta-label text-[#2563EB]">ШАБЛОНЫ СООБЩЕНИЙ</span>
            </div>
            <h3 className="text-sm font-semibold tracking-tight mt-0.5">
              Быстрые ответы ({quickReplyTemplates.length})
            </h3>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleOpenCreateModal}
              className="px-2.5 py-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors shadow-2xs"
              title="Создать новый шаблон"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span className="hidden sm:inline">Новый</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-white rounded-lg transition-colors"
              title="Закрыть (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search & Dynamic Variable Bar */}
        <div className={`p-3.5 border-b space-y-2.5 shrink-0 ${
          isLight ? 'bg-white border-black/[0.06]' : 'bg-[#181818] border-white/[0.06]'
        }`}>
          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по названию или тексту фразы..."
              className={`w-full rounded-lg pl-8.5 pr-8 py-2 text-xs border focus:outline-none focus:ring-1 focus:ring-[#2563EB] ${
                isLight 
                  ? 'bg-[#F8F7F4] border-black/[0.08] text-[#1A1A1A] placeholder-neutral-400' 
                  : 'bg-[#222222] border-white/[0.08] text-white placeholder-neutral-500'
              }`}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Dynamic Placeholder Auto-Replace Toggle */}
          <div className="flex items-center justify-between text-xs px-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autoReplaceVariables}
                onChange={(e) => setAutoReplaceVariables(e.target.checked)}
                className="rounded text-[#2563EB] focus:ring-[#2563EB] w-3.5 h-3.5 accent-[#2563EB]"
              />
              <span className="text-[11px] text-neutral-500 font-mono">
                Подставлять имя ({clientFirstName})
              </span>
            </label>

            <span className="text-[10px] font-mono text-neutral-400">
              {filteredTemplates.length} найдено
            </span>
          </div>

          {/* Category Chips Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium whitespace-nowrap transition-colors ${
                    isSelected
                      ? 'bg-[#2563EB] text-white shadow-2xs font-semibold'
                      : isLight
                      ? 'bg-[#F8F7F4] hover:bg-neutral-200 text-neutral-600'
                      : 'bg-[#222222] hover:bg-neutral-700 text-neutral-300'
                  }`}
                >
                  {cat === 'all' ? 'Все категории' : cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Templates Cards List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredTemplates.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-center p-6 text-neutral-400">
              <MessageSquare className="w-6 h-6 stroke-1 mb-2 opacity-50" />
              <div className="meta-label">Ничего не найдено</div>
              <p className="text-xs text-neutral-500 mt-1">
                По запросу «{searchQuery}» подходящих шаблонов нет
              </p>
              <button
                onClick={handleOpenCreateModal}
                className="mt-3 text-xs text-[#2563EB] hover:underline font-medium font-mono"
              >
                + Создать новый шаблон
              </button>
            </div>
          ) : (
            filteredTemplates.map((template) => {
              const resolvedText = resolveTemplateVariables(template.text);
              const isCopied = copiedId === template.id;

              return (
                <div
                  key={template.id}
                  className={`p-3.5 rounded-xl border transition-all space-y-2.5 group relative shadow-2xs ${
                    isLight 
                      ? 'bg-white hover:border-[#2563EB]/40 border-black/[0.08]' 
                      : 'bg-[#1E1E1E] hover:border-[#2563EB]/40 border-white/[0.08]'
                  }`}
                >
                  {/* Card Title, Category & Edit/Delete triggers */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-[#1A1A1A] dark:text-white">
                          {template.title}
                        </span>
                      </div>
                      <span className="meta-label text-[9px] mt-0.5">
                        {template.category}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleCopy(template.id, template.text)}
                        className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-white rounded"
                        title="Скопировать текст"
                      >
                        {isCopied ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <button
                        onClick={() => handleOpenEditModal(template)}
                        className="p-1 text-neutral-400 hover:text-neutral-700 dark:hover:text-white rounded"
                        title="Редактировать"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(template.id)}
                        className="p-1 text-neutral-400 hover:text-rose-600 rounded"
                        title="Удалить"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Message Text Preview */}
                  <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed font-normal whitespace-pre-wrap line-clamp-4">
                    {resolvedText}
                  </p>

                  {/* One-Click Action Buttons */}
                  <div className="pt-2 border-t border-black/[0.04] dark:border-white/[0.04] flex items-center justify-between gap-2">
                    <button
                      onClick={() => {
                        onInsertTemplate(resolvedText, false);
                        onClose();
                      }}
                      className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1.5 transition-colors ${
                        isLight
                          ? 'bg-[#F8F7F4] hover:bg-neutral-100 border-black/[0.08] text-[#1A1A1A]'
                          : 'bg-[#252525] hover:bg-neutral-700 border-white/[0.08] text-white'
                      }`}
                    >
                      <span>Вставить в чат</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>

                    <button
                      onClick={() => {
                        onInsertTemplate(resolvedText, true);
                        onClose();
                      }}
                      className="py-1.5 px-3 rounded-lg text-xs font-semibold bg-[#2563EB] hover:bg-[#1D4ED8] text-white flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                      title="Вставить и сразу отправить клиенту"
                    >
                      <span>Отправить</span>
                      <Send className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info & hotkey tip */}
        <div className={`p-3 px-5 border-t flex items-center justify-between text-[11px] font-mono text-neutral-400 shrink-0 ${
          isLight ? 'bg-[#F8F7F4] border-black/[0.06]' : 'bg-[#141414] border-white/[0.06]'
        }`}>
          <span>Подстановка: {'{clientName}'}</span>
          <button
            onClick={handleOpenCreateModal}
            className="text-[#2563EB] hover:underline font-semibold"
          >
            + Создать фразу
          </button>
        </div>
      </div>

      {/* ================= MODAL: CREATE / EDIT TEMPLATE ================= */}
      {isEditingModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className={`rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border animate-in fade-in zoom-in-95 duration-150 ${
            isLight ? 'bg-white border-black/[0.08] text-[#1A1A1A]' : 'bg-[#1E1E1E] border-white/[0.08] text-white'
          }`}>
            <div className="flex items-start justify-between pb-3 border-b border-black/[0.06] dark:border-white/[0.06]">
              <div>
                <div className="meta-label text-[#2563EB]">
                  {editingTemplate ? 'РЕДАКТИРОВАНИЕ' : 'НОВАЯ ФРАЗА'}
                </div>
                <h3 className="text-base font-semibold mt-0.5">
                  {editingTemplate ? 'Редактировать шаблон' : 'Добавить шаблон ответа'}
                </h3>
              </div>
              <button 
                onClick={() => setIsEditingModalOpen(false)} 
                className="text-neutral-400 hover:text-neutral-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTemplate} className="space-y-3.5 text-xs">
              <div>
                <label className="meta-label mb-1">Название шаблона:</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Например: Запрос на фото интерьера..."
                  className={`w-full rounded-lg p-2.5 text-xs border focus:outline-none focus:ring-1 focus:ring-[#2563EB] ${
                    isLight ? 'bg-[#F8F7F4] border-black/[0.08] text-[#1A1A1A]' : 'bg-[#222222] border-white/[0.08] text-white'
                  }`}
                />
              </div>

              <div>
                <label className="meta-label mb-1">Категория:</label>
                <input
                  type="text"
                  required
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  placeholder="Продажи / Финансы / Производство / Сервис..."
                  list="category-suggestions"
                  className={`w-full rounded-lg p-2.5 text-xs border focus:outline-none focus:ring-1 focus:ring-[#2563EB] ${
                    isLight ? 'bg-[#F8F7F4] border-black/[0.08] text-[#1A1A1A]' : 'bg-[#222222] border-white/[0.08] text-white'
                  }`}
                />
                <datalist id="category-suggestions">
                  <option value="Продажи" />
                  <option value="Финансы" />
                  <option value="Производство" />
                  <option value="Логистика" />
                  <option value="Сервис" />
                  <option value="Замеры & ТЗ" />
                </datalist>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="meta-label">Текст сообщения:</label>
                  <span className="text-[10px] font-mono text-neutral-400">
                    Переменные: {'{clientName}'}, {'{company}'}
                  </span>
                </div>
                <textarea
                  required
                  rows={5}
                  value={formText}
                  onChange={(e) => setFormText(e.target.value)}
                  placeholder="Введите текст профессионального ответа. Используйте {clientName} для автоматической подстановки имени клиента..."
                  className={`w-full rounded-xl p-3 text-xs resize-none border focus:outline-none focus:ring-1 focus:ring-[#2563EB] leading-relaxed ${
                    isLight ? 'bg-[#F8F7F4] border-black/[0.08] text-[#1A1A1A]' : 'bg-[#222222] border-white/[0.08] text-white'
                  }`}
                />
              </div>

              {/* Variable Helper Pills */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-mono text-neutral-400">Вставить:</span>
                {[
                  { label: '+ Имя клиента', tag: '{clientName}' },
                  { label: '+ Компания', tag: '{company}' },
                  { label: '+ Менеджер', tag: '{manager}' }
                ].map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setFormText(prev => prev + item.tag)}
                    className="text-[10px] font-mono px-2 py-0.5 rounded border border-black/[0.08] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.04] text-neutral-600 dark:text-neutral-300 hover:text-[#2563EB]"
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-black/[0.06] dark:border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => setIsEditingModalOpen(false)}
                  className="px-4 py-2 text-xs font-mono text-neutral-500 hover:text-neutral-800 dark:hover:text-white"
                >
                  ОТМЕНА
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-lg text-xs font-semibold shadow-2xs"
                >
                  {editingTemplate ? 'Сохранить изменения' : 'Создать шаблон'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
