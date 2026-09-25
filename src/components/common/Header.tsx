import React from 'react';
import {
  Search,
  Bell,
  Plus,
  ChevronDown,
  User,
  Briefcase,
  CheckSquare,
  FileText,
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';

export const Header: React.FC = () => {
  const {
    currentTab,
    notifications,
    setIsNotificationsOpen,
    setIsCommandPaletteOpen,
    setIsCreateClientOpen,
    setIsCreateDealOpen,
    setIsCreateTaskOpen,
    setIsCreateInvoiceOpen,
    currentManager,
    setCurrentManager,
    managers,
    theme,
  } = useCrm();

  const [isNewMenuOpen, setIsNewMenuOpen] = React.useState(false);
  const [isManagerMenuOpen, setIsManagerMenuOpen] = React.useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;

  const getBreadcrumbTitle = () => {
    switch (String(currentTab)) {
      case 'dashboard': return 'Главный дашборд';
      case 'clients': return 'База клиентов';
      case 'client_cockpit': return 'Карточка клиента · Центр управления';
      case 'deals': return 'Воронка сделок (Канбан)';
      case 'inbox': return 'Входящие · Почта и Telegram';
      case 'call_list': return 'Обзвон · Need Number';
      case 'ai_manager': return 'AI-менеджер Satori';
      case 'production': return 'Производство и заказы';
      case 'documents': return 'КП, счета и документы';
      case 'tasks': return 'Задачи и дедлайны';
      case 'finance': return 'Оплаты и финансы';
      case 'catalog': return 'Каталог товаров и материалов';
      case 'contractors': return 'Подрядчики и цеха';
      case 'analytics': return 'Аналитика и конверсия';
      case 'calendar': return 'Календарь событий';
      case 'integrations': return 'Интеграции Satori';
      case 'settings': return 'Настройки системы';
      default: return 'CRM';
    }
  };

  const isDark = theme === 'dark';

  return (
    <header className={`h-14 border-b px-5 flex items-center justify-between z-30 shrink-0 sticky top-0 transition-colors backdrop-blur-md ${
      isDark
        ? 'border-white/[0.08] bg-[#141414]/95 text-neutral-100'
        : 'border-black/[0.08] bg-[#F8F7F4]/95 text-[#1A1A1A]'
    }`}>
      <div className="flex items-center gap-3">
        <span className="meta-label hidden sm:inline">SATORI CRM</span>
        <span className={`hidden sm:inline ${isDark ? 'text-neutral-700' : 'text-neutral-300'}`}>/</span>
        <h1 className={`text-sm font-semibold tracking-tight truncate max-w-xs sm:max-w-md ${isDark ? 'text-white' : 'text-[#1A1A1A]'}`}>{getBreadcrumbTitle()}</h1>
      </div>

      <div className="flex-1 max-w-md mx-4 hidden md:block">
        <button onClick={() => setIsCommandPaletteOpen(true)} className={`w-full flex items-center justify-between px-3 py-1.5 border rounded-lg text-xs transition-colors ${
          isDark
            ? 'bg-[#1C1C1C] border-white/[0.08] hover:border-white/[0.15] text-neutral-300 hover:text-white'
            : 'bg-white hover:bg-neutral-50 border-black/[0.08] hover:border-black/[0.15] text-neutral-600 hover:text-[#1A1A1A] shadow-2xs'
        }`}>
          <div className="flex items-center gap-2"><Search className="w-3.5 h-3.5 text-neutral-400" /><span className="font-normal text-xs">Поиск или команда <span className="font-mono text-[11px] text-[#2563EB]">/new-deal, /add-task...</span></span></div>
          <kbd className={`px-1.5 py-0.5 text-[10px] font-mono rounded border ${isDark ? 'bg-neutral-800 text-neutral-300 border-neutral-700' : 'bg-[#F8F7F4] text-neutral-600 border-black/[0.08]'}`}>⌘K</kbd>
        </button>
      </div>

      <div className="flex items-center gap-2.5">
        <div className="relative">
          <button onClick={() => setIsNewMenuOpen(prev => !prev)} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-lg text-xs font-semibold transition-colors shadow-2xs"><Plus className="w-3.5 h-3.5 stroke-[2.5]" /><span className="hidden sm:inline">Создать</span><ChevronDown className="w-3 h-3 opacity-80" /></button>
          {isNewMenuOpen && <><div className="fixed inset-0 z-40" onClick={() => setIsNewMenuOpen(false)} /><div className={`absolute right-0 mt-1.5 w-52 border rounded-xl shadow-xl py-1.5 z-50 text-xs font-medium ${isDark ? 'bg-[#181818] border-white/[0.08] text-neutral-200' : 'bg-white border-black/[0.08] text-[#1A1A1A]'}`}>
            <button onClick={() => { setIsNewMenuOpen(false); setIsCreateClientOpen(true); }} className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors ${isDark ? 'hover:bg-slate-800 text-slate-200' : 'hover:bg-slate-50 text-slate-800'}`}><User className="w-4 h-4 text-sky-500" /><span>Новый клиент</span></button>
            <button onClick={() => { setIsNewMenuOpen(false); setIsCreateDealOpen(true); }} className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors ${isDark ? 'hover:bg-slate-800 text-slate-200' : 'hover:bg-slate-50 text-slate-800'}`}><Briefcase className="w-4 h-4 text-indigo-500" /><span>Новая сделка</span></button>
            <button onClick={() => { setIsNewMenuOpen(false); setIsCreateTaskOpen(true); }} className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors ${isDark ? 'hover:bg-slate-800 text-slate-200' : 'hover:bg-slate-50 text-slate-800'}`}><CheckSquare className="w-4 h-4 text-emerald-500" /><span>Новая задача</span></button>
            <button onClick={() => { setIsNewMenuOpen(false); setIsCreateInvoiceOpen(true); }} className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors ${isDark ? 'hover:bg-slate-800 text-slate-200' : 'hover:bg-slate-50 text-slate-800'}`}><FileText className="w-4 h-4 text-purple-500" /><span>Выставить КП / Счет</span></button>
          </div></>}
        </div>

        <button onClick={() => setIsNotificationsOpen(true)} className={`relative p-2 rounded-lg border transition-colors ${isDark ? 'border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800' : 'border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-900 hover:bg-slate-100'}`} title="Уведомления"><Bell className="w-4 h-4" />{unreadCount > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />}</button>

        <div className={`relative pl-1 border-l ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
          <button onClick={() => setIsManagerMenuOpen(prev => !prev)} className={`flex items-center gap-2 p-1 pl-2 rounded-lg transition-colors text-left ${isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}>
            <img src={currentManager.avatar} alt={currentManager.name} className="w-7 h-7 rounded-full object-cover ring-1 ring-slate-300" />
            <div className="hidden lg:block"><div className={`text-xs font-semibold truncate max-w-[120px] ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{currentManager.name}</div><div className={`text-[10px] truncate max-w-[120px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{currentManager.role}</div></div>
            <ChevronDown className={`w-3 h-3 hidden lg:block ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
          </button>
          {isManagerMenuOpen && <><div className="fixed inset-0 z-40" onClick={() => setIsManagerMenuOpen(false)} /><div className={`absolute right-0 mt-1.5 w-60 border rounded-lg shadow-xl py-1 z-50 text-xs ${isDark ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-800'}`}><div className={`px-3 py-1.5 border-b text-[11px] font-semibold uppercase tracking-wider ${isDark ? 'border-slate-800 text-slate-400' : 'border-slate-100 text-slate-500'}`}>Менеджер в системе:</div>{managers.map(m => <button key={m.id} onClick={() => { setCurrentManager(m); setIsManagerMenuOpen(false); }} className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors ${currentManager.id === m.id ? (isDark ? 'bg-indigo-950 text-indigo-200' : 'bg-indigo-50 text-indigo-900 font-semibold') : (isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-700 hover:bg-slate-50')}`}><img src={m.avatar} alt={m.name} className="w-6 h-6 rounded-full object-cover" /><div><div className="font-semibold">{m.name}</div><div className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{m.role}</div></div></button>)}</div></>}
        </div>
      </div>
    </header>
  );
};
