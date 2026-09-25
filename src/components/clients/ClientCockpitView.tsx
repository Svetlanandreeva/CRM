import React, { useState } from 'react';
import {
  Phone,
  Mail,
  Send,
  Plus,
  CheckCircle2,
  Clock,
  FileText,
  Briefcase,
  AlertCircle,
  Paperclip,
  Check,
  Calendar,
  MessageSquare,
  Sparkles,
  ArrowUpRight,
  ChevronDown,
  X,
  CreditCard,
  Factory,
  User,
  ArrowLeft,
  Zap,
  Repeat,
  Play
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { CommunicationChannel } from '../../types/crm';
import { DEAL_STAGES } from '../../data/mockData';
import { QuickRepliesDrawer } from './QuickRepliesDrawer';
import { AiNextBestActionPanel } from './AiNextBestActionPanel';

export const ClientCockpitView: React.FC = () => {
  const {
    clients,
    selectedClientId,
    setSelectedClientId,
    deals,
    tasks,
    chatMessages,
    productionOrders,
    documents,
    payments,
    quickReplyTemplates,
    recurringSchedules,
    openCreateRecurringForClient,
    triggerRecurringScheduleNow,
    sendMessage,
    toggleTask,
    updateClient,
    openCreateTaskWithPreset,
    setIsCreateDealOpen,
    setIsCreateInvoiceOpen,
    setSelectedDealId,
    setCurrentTab,
    theme
  } = useCrm();

  const isLight = theme === 'light';

  // Active view tab inside client view: 'chat' | 'deals' | 'tasks' | 'finance'
  const [activeTab, setActiveTab] = useState<'chat' | 'deals' | 'tasks' | 'finance'>('chat');
  const [activeChannelFilter, setActiveChannelFilter] = useState<'all' | CommunicationChannel>('all');
  const [composeChannel, setComposeChannel] = useState<CommunicationChannel>('whatsapp');
  const [messageText, setMessageText] = useState('');
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [isQuickRepliesOpen, setIsQuickRepliesOpen] = useState(false);
  const [toastNotification, setToastNotification] = useState<string | null>(null);

  // Auto-dismiss toast
  React.useEffect(() => {
    if (toastNotification) {
      const t = setTimeout(() => setToastNotification(null), 3500);
      return () => clearTimeout(t);
    }
  }, [toastNotification]);

  const client = clients.find(c => c.id === selectedClientId) || clients[0];

  if (!client) {
    return (
      <div className={`flex-1 flex flex-col items-center justify-center p-8 text-xs font-medium ${isLight ? 'text-neutral-500' : 'text-neutral-400'}`}>
        <p>Клиент не выбран или список пуст.</p>
        <button
          onClick={() => setCurrentTab('clients')}
          className="mt-3 px-3 py-1.5 bg-[#2563EB] text-white rounded-lg text-xs"
        >
          Перейти к списку клиентов
        </button>
      </div>
    );
  }

  // Related entities
  const clientDeals = deals.filter(d => d.clientId === client.id);
  const clientTasks = tasks.filter(t => t.clientId === client.id);
  const clientOrders = productionOrders.filter(p => p.clientId === client.id);
  const clientDocs = documents.filter(d => d.clientId === client.id);
  const clientPayments = payments.filter(p => p.clientId === client.id);
  const clientRecurringSchedules = recurringSchedules.filter(s => s.clientId === client.id);

  // Chat messages for this client
  const clientMessages = chatMessages
    .filter(m => m.clientId === client.id)
    .filter(m => activeChannelFilter === 'all' || m.channel === activeChannelFilter)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  // Next immediate action
  const pendingTasks = clientTasks.filter(t => !t.completed).sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
  const nextAction = pendingTasks[0];

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!messageText.trim()) return;

    sendMessage(
      client.id,
      messageText.trim(),
      composeChannel,
      composeChannel === 'note' ? 'internal' : 'outbound'
    );
    setMessageText('');
  };

  const handleInsertTemplate = (templateText: string, sendImmediately = false) => {
    if (sendImmediately) {
      sendMessage(
        client.id,
        templateText,
        composeChannel,
        composeChannel === 'note' ? 'internal' : 'outbound'
      );
      setToastNotification(`✓ Ответ отправлен в ${channelNames[composeChannel]}`);
    } else {
      setMessageText(prev => prev ? `${prev}\n\n${templateText}` : templateText);
      setToastNotification(`✓ Шаблон ответа вставлен в поле ввода`);
    }
  };

  const handleCreateTaskFromMessage = (content: string) => {
    openCreateTaskWithPreset({
      clientId: client.id,
      clientName: client.name,
      dealId: clientDeals[0]?.id,
      dealTitle: clientDeals[0]?.title,
      title: `По сообщению: ${content.slice(0, 50)}${content.length > 50 ? '...' : ''}`,
      priority: 'high',
      deadline: new Date(Date.now() + 86400000).toISOString().split('T')[0]
    });
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newTagInput.trim()) {
      e.preventDefault();
      const updatedTags = Array.from(new Set([...client.tags, newTagInput.trim()]));
      updateClient(client.id, { tags: updatedTags });
      setNewTagInput('');
      setIsAddingTag(false);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    updateClient(client.id, { tags: client.tags.filter(t => t !== tagToRemove) });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(amount);
  };

  const channelNames: Record<CommunicationChannel, string> = {
    whatsapp: 'WhatsApp',
    telegram: 'Telegram',
    email: 'Email',
    call: 'Звонок',
    note: 'Заметка'
  };

  return (
    <div className={`flex-1 flex flex-col min-h-0 overflow-hidden relative ${
      isLight ? 'bg-[#F8F7F4] text-[#1A1A1A]' : 'bg-[#121212] text-neutral-100'
    }`}>
      {/* Toast Notification */}
      {toastNotification && (
        <div className="absolute top-4 right-6 z-50 animate-in fade-in slide-in-from-top-3 duration-200">
          <div className={`px-4 py-2.5 rounded-xl border text-xs shadow-xl flex items-center gap-2.5 ${
            isLight ? 'bg-white border-black/[0.08] text-[#1A1A1A]' : 'bg-[#1E1E1E] border-white/[0.08] text-white'
          }`}>
            <CheckCircle2 className="w-4 h-4 text-[#2563EB] shrink-0" />
            <span className="font-medium">{toastNotification}</span>
            <button onClick={() => setToastNotification(null)} className="text-neutral-400 hover:text-neutral-600 ml-1">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Variation 4 Top Header Bar: Clean & Minimalist */}
      <div className={`h-16 px-6 border-b flex items-center justify-between shrink-0 transition-colors ${
        isLight ? 'bg-white border-black/[0.08]' : 'bg-[#161616] border-white/[0.08]'
      }`}>
        {/* Left: Client Title & Meta */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setCurrentTab('clients')}
            className={`p-1.5 rounded-lg border text-neutral-400 hover:text-[#1A1A1A] transition-colors ${
              isLight ? 'border-black/[0.08] hover:bg-black/[0.03]' : 'border-white/[0.08] hover:bg-white/[0.04]'
            }`}
            title="Назад ко всем клиентам"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>

          <div>
            <div className="meta-label">Клиент</div>
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <button
                  onClick={() => setIsClientDropdownOpen(prev => !prev)}
                  className="flex items-center gap-1.5 text-base sm:text-lg font-semibold tracking-tight hover:text-[#2563EB] transition-colors text-left"
                >
                  <span>{client.name}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-neutral-400 ml-0.5" />
                </button>

                {isClientDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsClientDropdownOpen(false)} />
                    <div className={`absolute left-0 mt-2 w-80 max-h-80 rounded-xl shadow-xl py-2 z-50 overflow-y-auto border ${
                      isLight ? 'bg-white border-black/[0.08]' : 'bg-[#1C1C1C] border-white/[0.08]'
                    }`}>
                      <div className="px-3 py-1 meta-label">
                        Переключить клиента
                      </div>
                      {clients.map(c => (
                        <button
                          key={c.id}
                          onClick={() => {
                            setSelectedClientId(c.id);
                            setIsClientDropdownOpen(false);
                          }}
                          className={`w-full px-3 py-2 text-left flex items-center justify-between text-xs transition-colors ${
                            c.id === client.id 
                              ? 'bg-[#2563EB]/10 text-[#2563EB] font-medium'
                              : (isLight ? 'hover:bg-black/[0.03] text-neutral-700' : 'hover:bg-white/[0.04] text-neutral-300')
                          }`}
                        >
                          <div className="truncate mr-2">
                            <div className="font-medium truncate">{c.name}</div>
                            <div className="text-[11px] text-neutral-400 truncate">{c.company || c.phone}</div>
                          </div>
                          <span className="font-mono text-neutral-500 shrink-0">{formatCurrency(c.totalLTV)}</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {client.company && (
                <span className="text-xs text-neutral-400 font-normal hidden sm:inline">
                  · {client.company}
                </span>
              )}

              <span className={`text-[11px] px-2 py-0.5 rounded font-mono font-medium ${
                client.status === 'VIP' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300' :
                client.status === 'Активный' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' : 
                'bg-black/[0.05] text-neutral-600 dark:bg-white/[0.06] dark:text-neutral-400'
              }`}>
                {client.status}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Variation 4 Primary Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCreateDealOpen(true)}
            className="px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Новая сделка</span>
          </button>
          <button
            onClick={() => openCreateTaskWithPreset({ clientId: client.id, clientName: client.name })}
            className={`px-3 py-2 text-xs font-medium rounded-lg border transition-colors flex items-center gap-1.5 ${
              isLight ? 'bg-white hover:bg-neutral-50 text-neutral-700 border-black/[0.08]' : 'bg-[#1E1E1E] hover:bg-neutral-800 text-neutral-200 border-white/[0.08]'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-neutral-400" />
            <span>Задача</span>
          </button>
          <button
            onClick={() => setIsCreateInvoiceOpen(true)}
            className={`px-3 py-2 text-xs font-medium rounded-lg border transition-colors flex items-center gap-1.5 ${
              isLight ? 'bg-white hover:bg-neutral-50 text-neutral-700 border-black/[0.08]' : 'bg-[#1E1E1E] hover:bg-neutral-800 text-neutral-200 border-white/[0.08]'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-neutral-400" />
            <span>КП / Счет</span>
          </button>
        </div>
      </div>

      {/* Main 2-Panel Layout: Workspace + Panel */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* ================= LEFT MAIN WORKSPACE (FLEX-1) ================= */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          
          {/* Tabs */}
          <div className={`h-11 px-6 border-b flex items-center gap-6 shrink-0 transition-colors ${
            isLight ? 'bg-white border-black/[0.08]' : 'bg-[#161616] border-white/[0.08]'
          }`}>
            <button
              onClick={() => setActiveTab('chat')}
              className={`h-full flex items-center gap-2 text-xs font-medium border-b-2 transition-colors ${
                activeTab === 'chat'
                  ? 'border-[#2563EB] text-[#2563EB] font-semibold'
                  : 'border-transparent text-neutral-500 hover:text-[#1A1A1A] dark:hover:text-neutral-200'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Диалог и история ({chatMessages.filter(m => m.clientId === client.id).length})</span>
            </button>

            <button
              onClick={() => setActiveTab('deals')}
              className={`h-full flex items-center gap-2 text-xs font-medium border-b-2 transition-colors ${
                activeTab === 'deals'
                  ? 'border-[#2563EB] text-[#2563EB] font-semibold'
                  : 'border-transparent text-neutral-500 hover:text-[#1A1A1A] dark:hover:text-neutral-200'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Сделки и цех ({clientDeals.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('tasks')}
              className={`h-full flex items-center gap-2 text-xs font-medium border-b-2 transition-colors ${
                activeTab === 'tasks'
                  ? 'border-[#2563EB] text-[#2563EB] font-semibold'
                  : 'border-transparent text-neutral-500 hover:text-[#1A1A1A] dark:hover:text-neutral-200'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Задачи ({clientTasks.length})</span>
              {clientTasks.filter(t => !t.completed).length > 0 && (
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('finance')}
              className={`h-full flex items-center gap-2 text-xs font-medium border-b-2 transition-colors ${
                activeTab === 'finance'
                  ? 'border-[#2563EB] text-[#2563EB] font-semibold'
                  : 'border-transparent text-neutral-500 hover:text-[#1A1A1A] dark:hover:text-neutral-200'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Документы и финансы ({clientDocs.length + clientPayments.length})</span>
            </button>
          </div>

          {/* TAB 1: CHAT & TIMELINE (Variation 4 message bubbles) */}
          {activeTab === 'chat' && (
            <div className="flex-1 flex flex-col min-h-0 bg-[#F8F7F4] dark:bg-[#121212]">
              {/* Channel Filter Pill */}
              <div className={`px-6 py-2 border-b flex items-center justify-between text-xs shrink-0 ${
                isLight ? 'bg-white/60 border-black/[0.08]' : 'bg-[#181818] border-white/[0.08]'
              }`}>
                <div className="flex items-center gap-1.5">
                  <span className="meta-label mr-2">Канал:</span>
                  {(['all', 'whatsapp', 'telegram', 'email', 'note'] as const).map(ch => (
                    <button
                      key={ch}
                      onClick={() => setActiveChannelFilter(ch)}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                        activeChannelFilter === ch
                          ? 'bg-[#1A1A1A] text-white dark:bg-white dark:text-neutral-900 font-semibold'
                          : 'text-neutral-500 hover:text-[#1A1A1A] dark:hover:text-white'
                      }`}
                    >
                      {ch === 'all' ? 'Все' : channelNames[ch]}
                    </button>
                  ))}
                </div>

                <span className="meta-label hidden sm:inline">
                  МУЛЬТИКАНАЛЬНАЯ ПЕРЕПИСКА
                </span>
              </div>

              {/* Chat Message Scroll */}
              <div className="flex-1 p-6 overflow-y-auto space-y-4">
                {clientMessages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8 text-neutral-400">
                    <div className="meta-label mb-2">История пуста</div>
                    <p className="text-sm font-medium">Нет сообщений в выбранном канале</p>
                    <p className="text-xs text-neutral-400 mt-1 max-w-sm">
                      Отправьте сообщение клиенту в WhatsApp, Telegram или сохраните внутреннюю заметку.
                    </p>
                  </div>
                ) : (
                  clientMessages.map((msg) => {
                    const isOutbound = msg.direction === 'outbound';
                    const isInternal = msg.direction === 'internal';

                    if (isInternal) {
                      return (
                        <div key={msg.id} className="max-w-2xl mx-auto my-3 w-full">
                          <div className={`p-4 rounded-xl border text-xs leading-relaxed ${
                            isLight ? 'bg-amber-50/70 border-amber-200/80 text-amber-950' : 'bg-amber-950/20 border-amber-900/40 text-amber-200'
                          }`}>
                            <div className="flex items-center justify-between text-xs font-semibold text-amber-800 dark:text-amber-400 mb-1.5">
                              <span className="flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                                Внутренняя заметка ({msg.senderName})
                              </span>
                              <span className="font-mono text-amber-700/80 dark:text-amber-400/80">
                                {new Date(msg.timestamp).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="font-normal">{msg.content}</p>
                            <div className="mt-2.5 pt-2 border-t border-amber-200/60 flex justify-end">
                              <button
                                onClick={() => handleCreateTaskFromMessage(msg.content)}
                                className="text-xs font-semibold text-amber-800 dark:text-amber-300 hover:underline flex items-center gap-1"
                              >
                                <Plus className="w-3 h-3" /> Поставить задачу
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isOutbound ? 'items-end' : 'items-start'}`}
                      >
                        {/* Variation 4 Msg-bubble */}
                        <div className={`max-w-lg rounded-xl px-4 py-3 text-xs leading-relaxed shadow-2xs group relative ${
                          isOutbound
                            ? 'bg-[#2563EB] text-white rounded-tr-xs'
                            : (isLight ? 'bg-[#F2F2F2] text-[#1A1A1A] border border-black/[0.04] rounded-tl-xs' : 'bg-[#222222] text-neutral-100 border border-white/[0.06] rounded-tl-xs')
                        }`}>
                          <div className={`flex items-center justify-between gap-4 text-[11px] mb-1 font-medium ${
                            isOutbound ? 'text-blue-100' : 'text-neutral-400'
                          }`}>
                            <span className="font-semibold">{msg.senderName}</span>
                            <div className="flex items-center gap-1.5 font-mono">
                              <span>{channelNames[msg.channel]}</span>
                              <span>·</span>
                              <span>{new Date(msg.timestamp).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          </div>

                          <p className="whitespace-pre-wrap">{msg.content}</p>

                          {msg.attachments && msg.attachments.length > 0 && (
                            <div className={`mt-2.5 pt-2 border-t space-y-1 ${
                              isOutbound ? 'border-white/20' : 'border-black/[0.06] dark:border-white/[0.06]'
                            }`}>
                              {msg.attachments.map((att, i) => (
                                <div key={i} className="flex items-center gap-1.5 text-xs font-mono opacity-90">
                                  <FileText className="w-3.5 h-3.5" />
                                  <span className="truncate">{att.name}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Quick subtle action to create task */}
                          <div className={`mt-2 pt-1.5 border-t flex items-center justify-between text-[11px] ${
                            isOutbound ? 'border-white/20 text-blue-100' : 'border-black/[0.06] dark:border-white/[0.06] text-neutral-500'
                          }`}>
                            <button
                              onClick={() => handleCreateTaskFromMessage(msg.content)}
                              className="hover:underline flex items-center gap-1 opacity-75 hover:opacity-100 transition-opacity"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Создать задачу</span>
                            </button>
                            {isOutbound && (
                              <Check className="w-3.5 h-3.5 opacity-80" />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Quick Template Chips & Drawer Trigger */}
              <div className={`px-6 py-2 border-t flex items-center justify-between gap-3 shrink-0 ${
                isLight ? 'bg-white border-black/[0.08]' : 'bg-[#161616] border-white/[0.08]'
              }`}>
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar min-w-0">
                  <span className="meta-label shrink-0 mr-1">Шаблоны:</span>
                  {quickReplyTemplates.slice(0, 5).map(tmpl => {
                    const clientFirstName = client.name.split(' ')[0] || client.name;
                    const resolved = tmpl.text.replace(/\{clientName\}/g, clientFirstName);
                    return (
                      <button
                        key={tmpl.id}
                        onClick={() => handleInsertTemplate(resolved, false)}
                        className={`text-xs px-2.5 py-1 rounded-md border whitespace-nowrap transition-colors ${
                          isLight 
                            ? 'bg-[#F8F7F4] hover:bg-neutral-200 text-neutral-700 border-black/[0.08]' 
                            : 'bg-[#222222] hover:bg-neutral-700 text-neutral-300 border-white/[0.08]'
                        }`}
                        title={resolved}
                      >
                        {tmpl.title}
                      </button>
                    );
                  })}
                </div>

                {/* Drawer Trigger Button */}
                <button
                  type="button"
                  onClick={() => setIsQuickRepliesOpen(true)}
                  className="px-3 py-1 bg-[#2563EB]/10 hover:bg-[#2563EB]/20 text-[#2563EB] rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0 font-mono shadow-2xs"
                  title="Открыть панель готовых ответов"
                >
                  <Zap className="w-3.5 h-3.5 fill-[#2563EB]" />
                  <span>БАЗА ОТВЕТОВ ({quickReplyTemplates.length})</span>
                </button>
              </div>

              {/* Message Composer Form */}
              <form onSubmit={handleSendMessage} className={`p-4 px-6 border-t shrink-0 ${
                isLight ? 'bg-white border-black/[0.08]' : 'bg-[#161616] border-white/[0.08]'
              }`}>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="meta-label">Канал:</span>
                    <select
                      value={composeChannel}
                      onChange={(e) => setComposeChannel(e.target.value as CommunicationChannel)}
                      className={`text-xs font-medium rounded-md border px-2 py-1 focus:outline-none ${
                        isLight ? 'bg-[#F8F7F4] border-black/[0.08] text-neutral-800' : 'bg-[#222222] border-white/[0.08] text-neutral-200'
                      }`}
                    >
                      <option value="whatsapp">WhatsApp (+{client.whatsapp || client.phone})</option>
                      <option value="telegram">Telegram ({client.telegram || 'Ник не указан'})</option>
                      <option value="email">Email ({client.email})</option>
                      <option value="note">Внутренняя заметка (видна только команде)</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsQuickRepliesOpen(true)}
                    className="text-xs text-[#2563EB] hover:underline flex items-center gap-1 font-medium font-mono"
                  >
                    <Zap className="w-3 h-3" />
                    <span>Все фразы</span>
                  </button>
                </div>

                <div className="relative">
                  <textarea
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                        handleSendMessage();
                      }
                    }}
                    rows={2}
                    placeholder={composeChannel === 'note' ? 'Введите внутреннюю заметку по клиенту...' : 'Напишите сообщение (Ctrl+Enter для отправки)...'}
                    className={`w-full rounded-xl p-3 pr-24 text-xs resize-none focus:outline-none focus:ring-1 focus:ring-[#2563EB] border ${
                      isLight ? 'bg-[#F8F7F4] border-black/[0.08] text-[#1A1A1A]' : 'bg-[#222222] border-white/[0.08] text-white'
                    }`}
                  />
                  <div className="absolute right-2.5 bottom-2.5 flex items-center gap-1.5">
                    <button
                      type="submit"
                      disabled={!messageText.trim()}
                      className="px-3.5 py-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-40 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
                    >
                      <span>{composeChannel === 'note' ? 'Сохранить' : 'Отправить'}</span>
                      <Send className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </form>

              {/* Quick Replies Drawer Container */}
              <QuickRepliesDrawer
                isOpen={isQuickRepliesOpen}
                onClose={() => setIsQuickRepliesOpen(false)}
                onInsertTemplate={handleInsertTemplate}
                client={client}
              />
            </div>
          )}

          {/* TAB 2: DEALS & PRODUCTION */}
          {activeTab === 'deals' && (
            <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-[#F8F7F4] dark:bg-[#121212]">
              {/* Deals Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="meta-label">
                    СДЕЛКИ КЛИЕНТА ({clientDeals.length})
                  </div>
                  <button
                    onClick={() => setIsCreateDealOpen(true)}
                    className="text-xs font-medium text-[#2563EB] hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Добавить сделку
                  </button>
                </div>

                {clientDeals.length === 0 ? (
                  <div className="p-8 text-center border rounded-xl bg-white dark:bg-[#161616] border-black/[0.08] dark:border-white/[0.08] text-xs text-neutral-400 font-normal">
                    У клиента пока нет активных сделок
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {clientDeals.map((deal) => {
                      const stageInfo = DEAL_STAGES.find(s => s.id === deal.stage);
                      return (
                        <div
                          key={deal.id}
                          onClick={() => {
                            setSelectedDealId(deal.id);
                            setCurrentTab('deals');
                          }}
                          className={`p-4 rounded-xl border cursor-pointer transition-all space-y-2.5 group shadow-2xs ${
                            isLight ? 'bg-white border-black/[0.08] hover:border-[#2563EB]' : 'bg-[#181818] border-white/[0.08] hover:border-[#2563EB]'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-semibold text-xs text-[#1A1A1A] dark:text-white group-hover:text-[#2563EB] transition-colors">
                              {deal.title}
                            </h4>
                            <ArrowUpRight className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                          </div>
                          <div className="flex items-center justify-between text-xs pt-1">
                            <span className="font-mono tabular-nums font-semibold text-[#1A1A1A] dark:text-white">{formatCurrency(deal.amount)}</span>
                            <span className="text-neutral-500 text-xs font-normal">{stageInfo?.title || deal.stage}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs text-neutral-400 pt-2 border-t border-black/[0.06] dark:border-white/[0.06] font-normal">
                            <span>Маржа: <strong className="text-emerald-600 dark:text-emerald-400 font-mono tabular-nums font-medium">{formatCurrency(deal.margin)}</strong></span>
                            <span className="font-mono tabular-nums">Дедлайн: {new Date(deal.deadline).toLocaleDateString('ru-RU')}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Production Section */}
              <div className="space-y-3 pt-2">
                <div className="meta-label flex items-center gap-1.5">
                  <Factory className="w-3 h-3 text-neutral-400" />
                  ЗАКАЗЫ В ПРОИЗВОДСТВЕ ({clientOrders.length})
                </div>

                {clientOrders.length === 0 ? (
                  <div className="p-8 text-center border rounded-xl bg-white dark:bg-[#161616] border-black/[0.08] dark:border-white/[0.08] text-xs text-neutral-400 font-normal">
                    Нет заказов в цеху
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {clientOrders.map((ord) => (
                      <div
                        key={ord.id}
                        className={`p-4 rounded-xl border text-xs flex items-center justify-between shadow-2xs ${
                          isLight ? 'bg-white border-black/[0.08]' : 'bg-[#181818] border-white/[0.08]'
                        }`}
                      >
                        <div>
                          <div className="font-semibold text-xs text-[#1A1A1A] dark:text-white">{ord.title}</div>
                          <div className="text-neutral-500 font-normal text-xs mt-1">
                            Цех: <span className="text-[#1A1A1A] dark:text-neutral-200 font-medium">{ord.contractorName}</span> · <span className="font-mono tabular-nums">{ord.quantity} шт.</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="px-2.5 py-0.5 rounded font-mono font-medium bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs">
                            {ord.status}
                          </span>
                          <div className="text-xs text-neutral-400 font-mono tabular-nums mt-1.5 font-normal">
                            Готовность: {ord.readyDeadline}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: TASKS */}
          {activeTab === 'tasks' && (
            <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-[#F8F7F4] dark:bg-[#121212]">
              <div className="flex items-center justify-between">
                <div className="meta-label">
                  ЗАДАЧИ ПО КЛИЕНТУ ({clientTasks.length})
                </div>
                <button
                  onClick={() => openCreateTaskWithPreset({ clientId: client.id, clientName: client.name, dealId: clientDeals[0]?.id, dealTitle: clientDeals[0]?.title })}
                  className="text-xs font-medium text-[#2563EB] hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Назначить задачу
                </button>
              </div>

              {clientTasks.length === 0 ? (
                <div className="p-8 text-center border rounded-xl bg-white dark:bg-[#161616] border-black/[0.08] dark:border-white/[0.08] text-xs text-neutral-400 font-normal">
                  Все задачи по клиенту выполнены
                </div>
              ) : (
                <div className="space-y-2">
                  {clientTasks.map((t) => {
                    const isOverdue = !t.completed && new Date(t.deadline) < new Date();
                    return (
                      <div
                        key={t.id}
                        className={`p-3.5 rounded-xl border text-xs flex items-center justify-between gap-3 transition-colors shadow-2xs ${
                          t.completed 
                            ? 'bg-neutral-100/50 border-black/[0.04] opacity-60 dark:bg-neutral-900 dark:border-white/[0.04]' 
                            : isOverdue 
                            ? (isLight ? 'bg-rose-50/70 border-rose-200' : 'bg-rose-950/20 border-rose-900/50')
                            : (isLight ? 'bg-white border-black/[0.08]' : 'bg-[#181818] border-white/[0.08]')
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <button
                            onClick={() => toggleTask(t.id)}
                            className="text-neutral-400 hover:text-emerald-600 transition-colors shrink-0"
                          >
                            {t.completed ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <div className="w-4 h-4 rounded-full border-2 border-neutral-300 hover:border-emerald-600" />
                            )}
                          </button>
                          <span className={`font-normal ${t.completed ? 'line-through text-neutral-400' : 'text-[#1A1A1A] dark:text-white'}`}>
                            {t.title}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 shrink-0 text-xs font-mono tabular-nums">
                          <span className={isOverdue ? 'text-rose-600 font-medium' : 'text-neutral-400 font-normal'}>
                            {new Date(t.deadline).toLocaleDateString('ru-RU')}
                          </span>
                          <span className="text-neutral-500 font-normal">{t.assignedTo}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: DOCUMENTS & PAYMENTS */}
          {activeTab === 'finance' && (
            <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-[#F8F7F4] dark:bg-[#121212]">
              {/* Recurring Contracts & Automated Invoices */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="meta-label flex items-center gap-1.5">
                    <Repeat className="w-3.5 h-3.5 text-purple-600" />
                    <span>РЕГУЛЯРНЫЕ СЧЕТА И ДОГОВОРЫ ({clientRecurringSchedules.length})</span>
                  </div>
                  <button
                    onClick={() => openCreateRecurringForClient(client)}
                    className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> + Настроить график
                  </button>
                </div>

                {clientRecurringSchedules.length === 0 ? (
                  <div className="p-5 text-center border rounded-xl bg-white dark:bg-[#161616] border-black/[0.08] dark:border-white/[0.08] text-xs text-neutral-400 font-normal">
                    <p>Нет регулярных графиков выставления счетов по абонентским договорам.</p>
                    <button
                      onClick={() => openCreateRecurringForClient(client)}
                      className="mt-2 text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline"
                    >
                      Создать автоматический график для {client.name}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {clientRecurringSchedules.map((sch) => {
                      const frequencyNames = {
                        weekly: 'Еженедельно',
                        biweekly: 'Раз в 2 недели',
                        monthly: 'Ежемесячно',
                        quarterly: 'Ежеквартально',
                        annually: 'Ежегодно'
                      };
                      return (
                        <div
                          key={sch.id}
                          className={`p-4 rounded-xl border text-xs space-y-2 shadow-2xs ${
                            isLight ? 'bg-white border-black/[0.08]' : 'bg-[#181818] border-white/[0.08]'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-purple-600 dark:text-purple-400 font-semibold">
                                  {sch.contractNumber}
                                </span>
                                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                                  sch.status === 'active'
                                    ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                    : 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                                }`}>
                                  {sch.status === 'active' ? 'Активен' : 'На паузе'}
                                </span>
                              </div>
                              <div className="font-medium text-[#1A1A1A] dark:text-white mt-1">
                                {sch.contractTitle}
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <div className="font-mono tabular-nums font-semibold text-sm text-[#1A1A1A] dark:text-white">
                                {formatCurrency(sch.amount)}
                              </div>
                              <span className="text-[11px] text-neutral-400">
                                {frequencyNames[sch.frequency]}, {sch.billingDay}-е число
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-neutral-500 pt-2 border-t border-black/[0.04] dark:border-white/[0.04]">
                            <div className="flex items-center gap-2">
                              <span>След. запуск: <strong className="text-purple-600 dark:text-purple-400 font-mono font-medium">{new Date(sch.nextRunDate).toLocaleDateString('ru-RU')}</strong></span>
                              <span>·</span>
                              <span>Выставлено: {sch.totalExecutedCount} счетов</span>
                            </div>
                            <button
                              onClick={() => {
                                const doc = triggerRecurringScheduleNow(sch.id);
                                if (doc) {
                                  setToastNotification(`✓ Сформирован регулярный счет ${doc.number}`);
                                }
                              }}
                              className="px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-semibold flex items-center gap-1 border border-purple-200/60 dark:border-purple-800/50 transition-colors"
                              title="Сформировать очередной счет сейчас вне очереди"
                            >
                              <Play className="w-3 h-3 fill-current" />
                              <span>Выставить сейчас</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Documents */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <div className="meta-label">
                    КП, СЧЕТА И АКТЫ ({clientDocs.length})
                  </div>
                  <button
                    onClick={() => setIsCreateInvoiceOpen(true)}
                    className="text-xs font-medium text-[#2563EB] hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Создать счет
                  </button>
                </div>

                {clientDocs.length === 0 ? (
                  <div className="p-8 text-center border rounded-xl bg-white dark:bg-[#161616] border-black/[0.08] dark:border-white/[0.08] text-xs text-neutral-400 font-normal">
                    Документов пока нет
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {clientDocs.map(doc => (
                      <div
                        key={doc.id}
                        className={`p-4 rounded-xl border text-xs flex items-center justify-between shadow-2xs ${
                          isLight ? 'bg-white border-black/[0.08]' : 'bg-[#181818] border-white/[0.08]'
                        }`}
                      >
                        <div>
                          <div className="font-medium text-[#1A1A1A] dark:text-white">
                            <span className="font-mono tabular-nums text-[#2563EB] mr-2 font-semibold">{doc.number}</span>
                            {doc.title}
                          </div>
                          <div className="text-xs text-neutral-400 font-normal mt-1">
                            Создан: {new Date(doc.createdAt).toLocaleDateString('ru-RU')}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="font-mono tabular-nums font-semibold text-xs text-[#1A1A1A] dark:text-white">{formatCurrency(doc.amount)}</div>
                          <span className="text-xs px-2 py-0.5 rounded font-mono font-normal bg-black/[0.05] text-neutral-600 dark:bg-white/[0.06] dark:text-neutral-400 mt-1 inline-block">
                            {doc.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Payments History */}
              <div className="space-y-3 pt-2">
                <div className="meta-label">
                  ИСТОРИЯ ОПЛАТ ({clientPayments.length})
                </div>

                {clientPayments.length === 0 ? (
                  <div className="p-8 text-center border rounded-xl bg-white dark:bg-[#161616] border-black/[0.08] dark:border-white/[0.08] text-xs text-neutral-400 font-normal">
                    Платежей по клиенту не зафиксировано
                  </div>
                ) : (
                  <div className="space-y-2">
                    {clientPayments.map(p => (
                      <div
                        key={p.id}
                        className={`p-3.5 rounded-xl border text-xs flex items-center justify-between shadow-2xs ${
                          isLight ? 'bg-white border-black/[0.08]' : 'bg-[#181818] border-white/[0.08]'
                        }`}
                      >
                        <div>
                          <span className="font-medium text-[#1A1A1A] dark:text-white">
                            {p.type === 'prepayment' ? 'Предоплата' : p.type === 'final' ? 'Окончательный расчет' : 'Оплата цеху'}
                          </span>
                          <span className="text-neutral-400 text-xs ml-2 font-normal">({p.method})</span>
                        </div>
                        <span className="font-mono tabular-nums font-semibold text-emerald-600 dark:text-emerald-400">+{formatCurrency(p.amount)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* ================= RIGHT PANEL: VARIATION 4 .panel (320px, bg: #FFFFFF, border-left) ================= */}
        <section className={`w-80 border-l flex flex-col shrink-0 overflow-y-auto p-6 space-y-6 transition-colors ${
          isLight ? 'bg-white border-black/[0.08] text-[#1A1A1A]' : 'bg-[#161616] border-white/[0.08] text-neutral-100'
        }`}>
          {/* Variation 4: Контактная информация */}
          <div>
            <div className="meta-label">Контактная информация</div>
            <p className="font-medium text-sm text-[#1A1A1A] dark:text-white mt-1.5 leading-snug">
              {client.company || client.name}
            </p>
            {client.role && (
              <p className="text-xs text-neutral-500 font-normal mt-0.5">{client.role}</p>
            )}
            <div className="font-mono text-xs text-neutral-600 dark:text-neutral-300 mt-3 space-y-1.5">
              <a href={`tel:${client.phone}`} className="flex items-center gap-2 hover:text-[#2563EB] transition-colors">
                <Phone className="w-3.5 h-3.5 text-neutral-400" />
                <span>{client.phone}</span>
              </a>
              <a href={`mailto:${client.email}`} className="flex items-center gap-2 hover:text-[#2563EB] transition-colors truncate">
                <Mail className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                <span className="truncate">{client.email}</span>
              </a>
              {client.telegram && (
                <div className="flex items-center gap-2 text-[#2563EB]">
                  <span className="text-xs font-semibold">TG:</span>
                  <span>{client.telegram}</span>
                </div>
              )}
            </div>
          </div>

          {/* Variation 4: Финансовый баланс */}
          <div className="pt-4 border-t border-black/[0.08] dark:border-white/[0.08]">
            <div className="meta-label">Финансовый баланс</div>
            <div className="text-xl font-semibold font-mono text-[#1A1A1A] dark:text-white mt-1">
              {formatCurrency(client.totalLTV)}
            </div>
            {client.currentDebt > 0 && (
              <div className="text-xs font-mono text-rose-600 mt-1">
                Текущий долг: {formatCurrency(client.currentDebt)}
              </div>
            )}
          </div>

          {/* AI-Powered Next Best Action Panel */}
          <AiNextBestActionPanel
            client={client}
            messages={clientMessages}
            deals={clientDeals}
            tasks={clientTasks}
            onInsertMessage={(text) => handleInsertTemplate(text, false)}
          />

          {/* Next Action Item */}
          {nextAction && (
            <div className="pt-4 border-t border-black/[0.08] dark:border-white/[0.08]">
              <div className="meta-label text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                <AlertCircle className="w-3 h-3" />
                <span>Следующий шаг</span>
              </div>
              <div className="mt-2 p-3.5 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 rounded-xl space-y-2">
                <div className="flex items-start gap-2">
                  <button
                    onClick={() => toggleTask(nextAction.id)}
                    className="mt-0.5 text-neutral-400 hover:text-emerald-600 shrink-0"
                  >
                    <CheckCircle2 className="w-4 h-4 text-[#2563EB]" />
                  </button>
                  <span className="text-xs font-medium text-[#1A1A1A] dark:text-neutral-100 leading-snug">{nextAction.title}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-neutral-500 font-mono tabular-nums pt-2 border-t border-amber-200/60 dark:border-amber-900/40">
                  <span className="flex items-center gap-1 text-rose-600 font-medium">
                    <Clock className="w-3 h-3" />
                    {new Date(nextAction.deadline).toLocaleDateString('ru-RU')}
                  </span>
                  <span>{nextAction.assignedTo}</span>
                </div>
              </div>
            </div>
          )}

          {/* Tags */}
          <div className="pt-4 border-t border-black/[0.08] dark:border-white/[0.08]">
            <div className="flex items-center justify-between">
              <span className="meta-label">Теги</span>
              {!isAddingTag && (
                <button
                  onClick={() => setIsAddingTag(true)}
                  className="text-[#2563EB] hover:underline font-medium text-xs font-mono"
                >
                  + ДОБАВИТЬ
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {client.tags.map(tag => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded bg-black/[0.05] dark:bg-white/[0.06] text-neutral-700 dark:text-neutral-300 font-normal font-mono"
                >
                  <span>{tag}</span>
                  <button onClick={() => handleRemoveTag(tag)} className="text-neutral-400 hover:text-rose-600">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              {isAddingTag && (
                <input
                  type="text"
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                  onBlur={() => setIsAddingTag(false)}
                  autoFocus
                  placeholder="Тег + Enter"
                  className="text-xs px-2.5 py-0.5 bg-white dark:bg-neutral-800 border border-[#2563EB] rounded text-[#1A1A1A] dark:text-white focus:outline-none w-28"
                />
              )}
            </div>
          </div>

          {/* Client Notes */}
          {client.notes && (
            <div className="pt-4 border-t border-black/[0.08] dark:border-white/[0.08] text-xs">
              <div className="meta-label">Заметка</div>
              <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed italic bg-[#F8F7F4] dark:bg-white/[0.04] p-3 rounded-lg border border-black/[0.06] dark:border-white/[0.06] font-normal mt-1.5">
                «{client.notes}»
              </p>
            </div>
          )}

          {/* Manager & Source */}
          <div className="pt-4 border-t border-black/[0.08] dark:border-white/[0.08] text-xs text-neutral-500 space-y-1 font-mono">
            <div>МЕНЕДЖЕР: <strong className="text-[#1A1A1A] dark:text-neutral-200 font-semibold">{client.assignedManager}</strong></div>
            <div>ИСТОЧНИК: <strong className="text-[#1A1A1A] dark:text-neutral-200 font-semibold">{client.source}</strong></div>
          </div>
        </section>

      </div>
    </div>
  );
};
