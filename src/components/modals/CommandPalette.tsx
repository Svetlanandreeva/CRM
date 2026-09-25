import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  User, 
  UserPlus,
  Briefcase, 
  Factory, 
  ArrowRight, 
  CheckSquare, 
  FileText, 
  CornerDownLeft, 
  Sparkles,
  Command,
  LayoutDashboard,
  Calendar,
  Layers,
  CircleDollarSign
} from 'lucide-react';
import { useCrm, NavigationTab } from '../../context/CrmContext';

interface QuickAction {
  id: string;
  title: string;
  shortcut: string;
  description: string;
  aliases: string[];
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  execute: () => void;
}

interface PaletteItem {
  id: string;
  type: 'action' | 'client' | 'deal' | 'order' | 'nav';
  title: string;
  subtitle: string;
  shortcutBadge?: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
  onSelect: () => void;
}

export const CommandPalette: React.FC = () => {
  const {
    isCommandPaletteOpen,
    setIsCommandPaletteOpen,
    setIsCreateDealOpen,
    setIsCreateClientOpen,
    setIsCreateTaskOpen,
    setIsCreateInvoiceOpen,
    clients,
    deals,
    productionOrders,
    openClientCockpit,
    setSelectedDealId,
    setCurrentTab,
    theme
  } = useCrm();

  const isLight = theme === 'light';
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsContainerRef = useRef<HTMLDivElement>(null);

  // Quick action shortcut definitions
  const quickActions: QuickAction[] = [
    {
      id: 'new-deal',
      title: 'Создать сделку',
      shortcut: '/new-deal',
      description: 'Открыть окно создания сделки с бюджетом и этапом',
      aliases: ['/deal', '/сделка', '/новая-сделка', 'new deal', 'создать сделку', 'сделка'],
      icon: Briefcase,
      accentColor: 'emerald',
      badgeBg: isLight ? 'bg-emerald-50 text-emerald-700' : 'bg-emerald-950/70 text-emerald-400',
      badgeText: 'text-emerald-700 dark:text-emerald-400',
      badgeBorder: 'border-emerald-200 dark:border-emerald-800/80',
      execute: () => {
        setIsCommandPaletteOpen(false);
        setIsCreateDealOpen(true);
      }
    },
    {
      id: 'new-client',
      title: 'Добавить клиента',
      shortcut: '/new-client',
      description: 'Внести нового заказчика, контакты и реквизиты',
      aliases: ['/client', '/клиент', '/новый-клиент', 'new client', 'добавить клиента', 'клиент'],
      icon: UserPlus,
      accentColor: 'sky',
      badgeBg: isLight ? 'bg-sky-50 text-sky-700' : 'bg-sky-950/70 text-sky-400',
      badgeText: 'text-sky-700 dark:text-sky-400',
      badgeBorder: 'border-sky-200 dark:border-sky-800/80',
      execute: () => {
        setIsCommandPaletteOpen(false);
        setIsCreateClientOpen(true);
      }
    },
    {
      id: 'add-task',
      title: 'Поставить задачу',
      shortcut: '/add-task',
      description: 'Назначить задачу, чек-лист, приоритет и дедлайн',
      aliases: ['/task', '/new-task', '/задача', '/новая-задача', 'add task', 'поставить задачу', 'задача'],
      icon: CheckSquare,
      accentColor: 'indigo',
      badgeBg: isLight ? 'bg-indigo-50 text-indigo-700' : 'bg-indigo-950/70 text-indigo-400',
      badgeText: 'text-indigo-700 dark:text-indigo-400',
      badgeBorder: 'border-indigo-200 dark:border-indigo-800/80',
      execute: () => {
        setIsCommandPaletteOpen(false);
        setIsCreateTaskOpen(true);
      }
    },
    {
      id: 'new-invoice',
      title: 'Выставить КП / Счет',
      shortcut: '/new-invoice',
      description: 'Сформировать коммерческое предложение или счет на оплату',
      aliases: ['/invoice', '/счет', '/счёт', '/кп', '/документ', 'new invoice', 'выставить счет', 'счет'],
      icon: FileText,
      accentColor: 'purple',
      badgeBg: isLight ? 'bg-purple-50 text-purple-700' : 'bg-purple-950/70 text-purple-400',
      badgeText: 'text-purple-700 dark:text-purple-400',
      badgeBorder: 'border-purple-200 dark:border-purple-800/80',
      execute: () => {
        setIsCommandPaletteOpen(false);
        setIsCreateInvoiceOpen(true);
      }
    }
  ];

  // Navigation shortcuts
  const navShortcuts = [
    {
      id: 'nav-dashboard',
      title: 'Перейти в Дашборд',
      shortcut: '/dashboard',
      description: 'Сводка KPI, сделок и выручки',
      tab: 'dashboard' as NavigationTab,
      icon: LayoutDashboard
    },
    {
      id: 'nav-deals',
      title: 'Перейти в Воронку сделок',
      shortcut: '/deals',
      description: 'Канбан-доска стадий продаж',
      tab: 'deals' as NavigationTab,
      icon: Briefcase
    },
    {
      id: 'nav-clients',
      title: 'Перейти в Базу клиентов',
      shortcut: '/clients',
      description: 'Реестр заказчиков и контактов',
      tab: 'clients' as NavigationTab,
      icon: User
    },
    {
      id: 'nav-production',
      title: 'Перейти в Производство',
      shortcut: '/production',
      description: 'Заказы в цехах и статусы готовности',
      tab: 'production' as NavigationTab,
      icon: Factory
    },
    {
      id: 'nav-tasks',
      title: 'Перейти в Задачи',
      shortcut: '/tasks',
      description: 'Список задач и календарь дедлайнов',
      tab: 'tasks' as NavigationTab,
      icon: CheckSquare
    },
    {
      id: 'nav-finance',
      title: 'Перейти в Финансы',
      shortcut: '/finance',
      description: 'Транзакции, дебиторка и касса',
      tab: 'finance' as NavigationTab,
      icon: CircleDollarSign
    },
    {
      id: 'nav-calendar',
      title: 'Перейти в Календарь',
      shortcut: '/calendar',
      description: 'События, встречи и замеры',
      tab: 'calendar' as NavigationTab,
      icon: Calendar
    }
  ];

  // Focus input and reset query on open
  useEffect(() => {
    if (isCommandPaletteOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isCommandPaletteOpen]);

  // Reset selected index when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Close on Escape & handle outside clicks
  useEffect(() => {
    if (!isCommandPaletteOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setIsCommandPaletteOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCommandPaletteOpen, setIsCommandPaletteOpen]);

  if (!isCommandPaletteOpen) return null;

  const cleanQuery = query.trim().toLowerCase();
  const isSlashCommand = cleanQuery.startsWith('/');

  // Filter Quick Actions
  const matchedActions = quickActions.filter(action => {
    if (!cleanQuery) return true; // show all when empty
    if (action.shortcut.toLowerCase().startsWith(cleanQuery)) return true;
    if (action.title.toLowerCase().includes(cleanQuery)) return true;
    if (action.description.toLowerCase().includes(cleanQuery)) return true;
    return action.aliases.some(alias => alias.toLowerCase().includes(cleanQuery));
  });

  // Filter Navigation Shortcuts (shown if query matches or is slash command)
  const matchedNavShortcuts = navShortcuts.filter(nav => {
    if (!cleanQuery) return false; // don't overwhelm initial view
    if (nav.shortcut.toLowerCase().startsWith(cleanQuery)) return true;
    if (cleanQuery.length > 2 && nav.title.toLowerCase().includes(cleanQuery)) return true;
    return false;
  });

  // If query is an exact slash command match, prioritising instant execution
  const exactActionMatch = quickActions.find(a => 
    a.shortcut.toLowerCase() === cleanQuery || 
    a.aliases.some(alias => alias.toLowerCase() === cleanQuery && alias.startsWith('/'))
  );

  // Entities matching (only if not strictly a slash command, or when query has terms)
  const matchedClients = !isSlashCommand && cleanQuery ? clients.filter(c =>
    c.name.toLowerCase().includes(cleanQuery) ||
    (c.company && c.company.toLowerCase().includes(cleanQuery)) ||
    c.phone.includes(cleanQuery)
  ).slice(0, 4) : [];

  const matchedDeals = !isSlashCommand && cleanQuery ? deals.filter(d =>
    d.title.toLowerCase().includes(cleanQuery) ||
    d.clientName.toLowerCase().includes(cleanQuery)
  ).slice(0, 4) : [];

  const matchedOrders = !isSlashCommand && cleanQuery ? productionOrders.filter(p =>
    p.title.toLowerCase().includes(cleanQuery) ||
    p.contractorName.toLowerCase().includes(cleanQuery)
  ).slice(0, 4) : [];

  // Flatten active items for keyboard selection
  const flatItems: PaletteItem[] = [
    // 1. Quick Actions
    ...matchedActions.map(a => ({
      id: `act_${a.id}`,
      type: 'action' as const,
      title: a.title,
      subtitle: a.description,
      shortcutBadge: a.shortcut,
      icon: a.icon,
      iconBg: a.badgeBg,
      iconColor: a.badgeText,
      onSelect: () => a.execute()
    })),
    // 2. Navigation shortcuts
    ...matchedNavShortcuts.map(n => ({
      id: `nav_${n.id}`,
      type: 'nav' as const,
      title: n.title,
      subtitle: n.description,
      shortcutBadge: n.shortcut,
      icon: n.icon,
      iconBg: isLight ? 'bg-slate-100 text-slate-700' : 'bg-slate-800 text-slate-300',
      iconColor: isLight ? 'text-slate-700' : 'text-slate-300',
      onSelect: () => {
        setCurrentTab(n.tab);
        setIsCommandPaletteOpen(false);
      }
    })),
    // 3. Matched Clients
    ...matchedClients.map(c => ({
      id: `cli_${c.id}`,
      type: 'client' as const,
      title: c.name,
      subtitle: c.company ? `${c.company} · ${c.phone}` : c.phone,
      icon: User,
      iconBg: isLight ? 'bg-indigo-50 text-indigo-700' : 'bg-indigo-950/80 text-indigo-400',
      iconColor: isLight ? 'text-indigo-700' : 'text-indigo-400',
      onSelect: () => {
        openClientCockpit(c.id);
        setIsCommandPaletteOpen(false);
      }
    })),
    // 4. Matched Deals
    ...matchedDeals.map(d => ({
      id: `deal_${d.id}`,
      type: 'deal' as const,
      title: d.title,
      subtitle: `${d.clientName} · ${d.amount.toLocaleString('ru-RU')} ₽`,
      icon: Briefcase,
      iconBg: isLight ? 'bg-emerald-50 text-emerald-700' : 'bg-emerald-950/80 text-emerald-400',
      iconColor: isLight ? 'text-emerald-700' : 'text-emerald-400',
      onSelect: () => {
        setSelectedDealId(d.id);
        setCurrentTab('deals');
        setIsCommandPaletteOpen(false);
      }
    })),
    // 5. Matched Production Orders
    ...matchedOrders.map(p => ({
      id: `order_${p.id}`,
      type: 'order' as const,
      title: p.title,
      subtitle: `${p.contractorName} · ${p.quantity} шт. (${p.clientName})`,
      icon: Factory,
      iconBg: isLight ? 'bg-amber-50 text-amber-700' : 'bg-amber-950/80 text-amber-400',
      iconColor: isLight ? 'text-amber-700' : 'text-amber-400',
      onSelect: () => {
        setCurrentTab('production');
        setIsCommandPaletteOpen(false);
      }
    }))
  ];

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (flatItems.length === 0) return;
      setSelectedIndex(prev => (prev + 1) % flatItems.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (flatItems.length === 0) return;
      setSelectedIndex(prev => (prev - 1 + flatItems.length) % flatItems.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      // If exact shortcut match exists, prioritize it
      if (exactActionMatch) {
        exactActionMatch.execute();
        return;
      }
      // Otherwise trigger selected item
      if (flatItems[selectedIndex]) {
        flatItems[selectedIndex].onSelect();
      }
    }
  };

  const hasAnyResults = flatItems.length > 0;

  return (
    <div 
      className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-start justify-center pt-16 sm:pt-24 p-4 animate-in fade-in duration-100"
      onClick={() => setIsCommandPaletteOpen(false)}
    >
      <div 
        className={`rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden border transition-all ${
          isLight ? 'bg-white border-black/[0.08] text-[#1A1A1A] shadow-black/10' : 'bg-[#181818] border-white/[0.08] text-white shadow-black/40'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header */}
        <div className={`p-4 border-b flex items-center gap-3 ${isLight ? 'border-black/[0.06] bg-white' : 'border-white/[0.06] bg-[#181818]'}`}>
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
            isLight ? 'bg-[#F8F7F4] text-neutral-400' : 'bg-[#222222] text-neutral-400'
          }`}>
            {isSlashCommand ? (
              <Sparkles className="w-4 h-4 text-[#2563EB] animate-pulse" />
            ) : (
              <Search className="w-4 h-4" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Поиск или команда: /new-deal, /new-client, /add-task..."
              className="w-full bg-transparent text-sm sm:text-base font-medium focus:outline-none placeholder-neutral-400"
            />
          </div>

          <kbd 
            onClick={() => setIsCommandPaletteOpen(false)}
            className={`cursor-pointer px-2 py-0.5 text-[11px] font-mono rounded border transition-colors ${
              isLight ? 'bg-[#F8F7F4] hover:bg-neutral-200 text-neutral-600 border-black/[0.08]' : 'bg-[#222222] hover:bg-neutral-700 text-neutral-400 border-white/[0.08]'
            }`}
            title="Закрыть (Esc)"
          >
            ESC
          </kbd>
        </div>

        {/* Quick Action Suggestion Chips (Visible on empty query or when typing '/') */}
        <div className={`px-4 py-2 border-b flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs ${
          isLight ? 'bg-[#F8F7F4] border-black/[0.06] text-neutral-600' : 'bg-[#141414] border-white/[0.06] text-neutral-400'
        }`}>
          <span className="meta-label mr-1 flex items-center gap-1 shrink-0">
            <Command className="w-3 h-3" /> ДЕЙСТВИЯ:
          </span>
          {quickActions.map(action => (
            <button
              key={action.id}
              onClick={() => action.execute()}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium font-mono shrink-0 transition-colors flex items-center gap-1.5 border ${
                cleanQuery === action.shortcut
                  ? 'bg-[#2563EB] text-white border-[#2563EB] shadow-xs'
                  : isLight
                    ? 'bg-white hover:bg-neutral-100 text-[#1A1A1A] border-black/[0.08]'
                    : 'bg-[#222222] hover:bg-neutral-800 text-neutral-200 border-white/[0.08]'
              }`}
              title={`${action.title}: ${action.description}`}
            >
              <action.icon className="w-3 h-3" />
              <span>{action.shortcut}</span>
            </button>
          ))}
        </div>

        {/* Results Container */}
        <div ref={resultsContainerRef} className="max-h-[380px] overflow-y-auto p-2 space-y-3.5">
          {/* Section: Quick Actions */}
          {matchedActions.length > 0 && (
            <div>
              <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>Быстрые действия ({matchedActions.length})</span>
                <span className="text-[10px] font-normal lowercase tracking-normal text-slate-400">
                  {cleanQuery.startsWith('/') ? 'Фильтр по командам' : 'Слеш-команды'}
                </span>
              </div>
              <div className="space-y-1 mt-1">
                {matchedActions.map(action => {
                  const itemIndex = flatItems.findIndex(i => i.id === `act_${action.id}`);
                  const isSelected = itemIndex === selectedIndex;

                  return (
                    <button
                      key={action.id}
                      onClick={() => action.execute()}
                      onMouseEnter={() => setSelectedIndex(itemIndex)}
                      className={`w-full p-2.5 rounded-xl text-left flex items-center justify-between transition-all group ${
                        isSelected 
                          ? (isLight ? 'bg-indigo-50/80 ring-1 ring-indigo-200' : 'bg-slate-800/90 ring-1 ring-indigo-500/40')
                          : (isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-800/50')
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border transition-transform ${
                          action.badgeBg
                        } ${action.badgeBorder} ${isSelected ? 'scale-105' : ''}`}>
                          <action.icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`font-semibold text-xs sm:text-sm ${
                              isLight ? 'text-slate-900' : 'text-white'
                            }`}>
                              {action.title}
                            </span>
                            <span className={`px-1.5 py-0.5 text-[10px] font-mono font-medium rounded border ${action.badgeBg} ${action.badgeBorder}`}>
                              {action.shortcut}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 truncate font-normal">
                            {action.description}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        {isSelected ? (
                          <span className={`hidden sm:inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded font-mono font-medium ${
                            isLight ? 'bg-indigo-100/70 text-indigo-700' : 'bg-indigo-950 text-indigo-300 border border-indigo-800/50'
                          }`}>
                            <span>Запустить</span>
                            <CornerDownLeft className="w-3 h-3" />
                          </span>
                        ) : (
                          <ArrowRight className="w-3.5 h-3.5 text-slate-400 opacity-60 group-hover:opacity-100 transition-opacity" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section: Navigation Shortcuts */}
          {matchedNavShortcuts.length > 0 && (
            <div>
              <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Навигация по разделам ({matchedNavShortcuts.length})
              </div>
              <div className="space-y-1 mt-1">
                {matchedNavShortcuts.map(nav => {
                  const itemIndex = flatItems.findIndex(i => i.id === `nav_${nav.id}`);
                  const isSelected = itemIndex === selectedIndex;

                  return (
                    <button
                      key={nav.id}
                      onClick={() => {
                        setCurrentTab(nav.tab);
                        setIsCommandPaletteOpen(false);
                      }}
                      onMouseEnter={() => setSelectedIndex(itemIndex)}
                      className={`w-full p-2.5 rounded-xl text-left flex items-center justify-between transition-all ${
                        isSelected 
                          ? (isLight ? 'bg-slate-100 ring-1 ring-slate-300' : 'bg-slate-800 ring-1 ring-slate-700')
                          : (isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-800/50')
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          isLight ? 'bg-slate-100 text-slate-600' : 'bg-slate-800 text-slate-300'
                        }`}>
                          <nav.icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-xs sm:text-sm">{nav.title}</span>
                            <span className={`px-1.5 py-0.5 text-[10px] font-mono rounded border ${
                              isLight ? 'bg-slate-100 text-slate-600 border-slate-200' : 'bg-slate-800 text-slate-400 border-slate-700'
                            }`}>
                              {nav.shortcut}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 truncate font-normal">{nav.description}</div>
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section: Clients */}
          {matchedClients.length > 0 && (
            <div>
              <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Клиенты ({matchedClients.length})
              </div>
              <div className="space-y-1 mt-1">
                {matchedClients.map(c => {
                  const itemIndex = flatItems.findIndex(i => i.id === `cli_${c.id}`);
                  const isSelected = itemIndex === selectedIndex;

                  return (
                    <button
                      key={c.id}
                      onClick={() => {
                        openClientCockpit(c.id);
                        setIsCommandPaletteOpen(false);
                      }}
                      onMouseEnter={() => setSelectedIndex(itemIndex)}
                      className={`w-full p-2.5 rounded-xl text-left flex items-center justify-between transition-all ${
                        isSelected 
                          ? (isLight ? 'bg-indigo-50/80 ring-1 ring-indigo-200' : 'bg-slate-800/90 ring-1 ring-indigo-500/40')
                          : (isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-800/50')
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-400 flex items-center justify-center shrink-0">
                          <User className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className={`font-semibold text-xs sm:text-sm truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>
                            {c.name}
                          </div>
                          <div className="text-[11px] text-slate-500 truncate font-normal">
                            {c.company ? `${c.company} · ` : ''}{c.phone}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {isSelected && (
                          <span className="text-[10px] text-slate-400 hidden sm:inline">Карточка</span>
                        )}
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section: Deals */}
          {matchedDeals.length > 0 && (
            <div>
              <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Сделки ({matchedDeals.length})
              </div>
              <div className="space-y-1 mt-1">
                {matchedDeals.map(d => {
                  const itemIndex = flatItems.findIndex(i => i.id === `deal_${d.id}`);
                  const isSelected = itemIndex === selectedIndex;

                  return (
                    <button
                      key={d.id}
                      onClick={() => {
                        setSelectedDealId(d.id);
                        setCurrentTab('deals');
                        setIsCommandPaletteOpen(false);
                      }}
                      onMouseEnter={() => setSelectedIndex(itemIndex)}
                      className={`w-full p-2.5 rounded-xl text-left flex items-center justify-between transition-all ${
                        isSelected 
                          ? (isLight ? 'bg-emerald-50/80 ring-1 ring-emerald-200' : 'bg-slate-800/90 ring-1 ring-emerald-500/40')
                          : (isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-800/50')
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
                          <Briefcase className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className={`font-semibold text-xs sm:text-sm truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>
                            {d.title}
                          </div>
                          <div className="text-[11px] text-slate-500 truncate font-normal">
                            {d.clientName} · <span className="font-mono">{d.amount.toLocaleString('ru-RU')} ₽</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {isSelected && (
                          <span className="text-[10px] text-slate-400 hidden sm:inline">Воронка</span>
                        )}
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section: Production Orders */}
          {matchedOrders.length > 0 && (
            <div>
              <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Заказы цеха ({matchedOrders.length})
              </div>
              <div className="space-y-1 mt-1">
                {matchedOrders.map(p => {
                  const itemIndex = flatItems.findIndex(i => i.id === `order_${p.id}`);
                  const isSelected = itemIndex === selectedIndex;

                  return (
                    <button
                      key={p.id}
                      onClick={() => {
                        setCurrentTab('production');
                        setIsCommandPaletteOpen(false);
                      }}
                      onMouseEnter={() => setSelectedIndex(itemIndex)}
                      className={`w-full p-2.5 rounded-xl text-left flex items-center justify-between transition-all ${
                        isSelected 
                          ? (isLight ? 'bg-amber-50/80 ring-1 ring-amber-200' : 'bg-slate-800/90 ring-1 ring-amber-500/40')
                          : (isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-800/50')
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
                          <Factory className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className={`font-semibold text-xs sm:text-sm truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>
                            {p.title}
                          </div>
                          <div className="text-[11px] text-slate-500 truncate font-normal">
                            {p.contractorName} · {p.quantity} шт. ({p.clientName})
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {isSelected && (
                          <span className="text-[10px] text-slate-400 hidden sm:inline">Цеха</span>
                        )}
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Empty State */}
          {!hasAnyResults && (
            <div className="py-12 text-center text-slate-400 text-xs px-4">
              <p className="font-semibold text-sm mb-1 text-slate-600 dark:text-slate-300">
                Ничего не найдено по запросу «{query}»
              </p>
              <p className="text-slate-400">
                Попробуйте команды: <code className="font-mono text-indigo-500">/new-deal</code>,{' '}
                <code className="font-mono text-indigo-500">/new-client</code>,{' '}
                <code className="font-mono text-indigo-500">/add-task</code> или название клиента.
              </p>
            </div>
          )}
        </div>

        {/* Footer info bar */}
        <div className={`px-4 py-2.5 border-t text-[11px] flex flex-wrap items-center justify-between gap-2 ${
          isLight ? 'bg-slate-50 text-slate-500 border-slate-100' : 'bg-slate-950/70 text-slate-400 border-slate-800/80'
        }`}>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 font-mono">
              <kbd className={`px-1 py-0.5 rounded border text-[10px] ${
                isLight ? 'bg-white border-slate-200' : 'bg-slate-800 border-slate-700'
              }`}>↑↓</kbd> навигация
            </span>
            <span className="flex items-center gap-1 font-mono">
              <kbd className={`px-1 py-0.5 rounded border text-[10px] ${
                isLight ? 'bg-white border-slate-200' : 'bg-slate-800 border-slate-700'
              }`}>↵</kbd> запустить
            </span>
            <span className="flex items-center gap-1 font-mono">
              <kbd className={`px-1 py-0.5 rounded border text-[10px] ${
                isLight ? 'bg-white border-slate-200' : 'bg-slate-800 border-slate-700'
              }`}>esc</kbd> закрыть
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 text-slate-400">
            <span>Подсказка: наберите</span>
            <kbd className={`px-1.5 py-0.5 font-mono text-[10px] rounded border font-semibold ${
              isLight ? 'bg-white text-indigo-600 border-slate-200' : 'bg-slate-800 text-indigo-400 border-slate-700'
            }`}>
              /
            </kbd>
            <span>для быстрых команд</span>
          </div>
        </div>
      </div>
    </div>
  );
};
