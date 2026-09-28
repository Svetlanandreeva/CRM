import React from 'react';
import {
  CalendarDays, ChevronLeft, ChevronRight, CircleDot, FileText, Home, MessageCircle, PhoneCall, Plug, Search, Settings,
  Sigma, Sparkles, TrendingUp, Triangle, Users,
} from 'lucide-react';
import { useCrm, type NavigationTab } from '../../context/CrmContext';

type Item = { id: NavigationTab; label: string; icon: React.FC<{ className?: string; size?: number; strokeWidth?: number }> };

const nav: Item[] = [
  { id: 'dashboard', label: 'Главная', icon: Home },
  { id: 'call_list', label: 'Обзвоны', icon: PhoneCall },
  { id: 'clients', label: 'Клиенты', icon: Users },
  { id: 'deals', label: 'Сделки', icon: CircleDot },
  { id: 'pipeline', label: 'Воронка', icon: Triangle },
  { id: 'inbox', label: 'Чаты', icon: MessageCircle },
  { id: 'finance', label: 'Экономика', icon: TrendingUp },
  { id: 'project_calc', label: 'Расчёт проекта', icon: Sigma },
  { id: 'documents', label: 'КП', icon: FileText },
  { id: 'ai_manager', label: 'Чат с Евой', icon: Sparkles },
  { id: 'calendar', label: 'Календарь проектов', icon: CalendarDays },
  { id: 'integrations', label: 'Интеграции', icon: Plug },
  { id: 'settings', label: 'Настройки', icon: Settings },
];

export const Sidebar: React.FC = () => {
  const { currentTab, setCurrentTab, currentManager } = useCrm();
  const [query, setQuery] = React.useState('');
  const [pinnedOpen, setPinnedOpen] = React.useState(() => localStorage.getItem('satori_sidebar_collapsed') === '0');
  const [hovered, setHovered] = React.useState(false);
  const expanded = pinnedOpen || hovered;
  const shown = nav.filter((item) => item.label.toLowerCase().includes(query.trim().toLowerCase()));

  const togglePinned = () => setPinnedOpen(v => {
    const next = !v;
    localStorage.setItem('satori_sidebar_collapsed', next ? '0' : '1');
    return next;
  });

  return (
    <aside
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`relative z-30 flex h-screen shrink-0 flex-col overflow-hidden border-r border-white/[0.06] bg-[#29282a] text-[#e4dfda] shadow-[8px_0_30px_rgba(28,25,23,0.04)] transition-[width] duration-200 ease-out ${expanded ? 'w-[262px]' : 'w-[68px]'}`}
    >
      <div className={`flex h-[68px] shrink-0 items-center ${expanded ? 'justify-between px-5' : 'justify-center px-2'}`}>
        <div className="flex items-center overflow-hidden whitespace-nowrap text-[20px] font-semibold leading-none text-white">
          <span className="grid h-9 w-9 shrink-0 place-items-center">✦</span>
          {expanded && <span className="ml-1">Satori CRM</span>}
        </div>
        {expanded && <button onClick={togglePinned} title={pinnedOpen ? 'Сворачивать автоматически' : 'Закрепить меню'} className="grid h-8 w-8 place-items-center rounded-lg text-[#bbb5b0] hover:bg-white/5 hover:text-white">{pinnedOpen ? <ChevronLeft size={16}/> : <ChevronRight size={16}/>}</button>}
      </div>

      {expanded && <div className="shrink-0 px-[16px] pb-3">
        <label className="flex h-[40px] w-full items-center gap-2 rounded-[11px] border border-white/[0.04] bg-[#343235] px-4 text-[#bfb9b4]">
          <Search size={14} strokeWidth={1.7}/>
          <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Поиск..." className="min-w-0 flex-1 bg-transparent text-[12px] outline-none placeholder:text-[#9f9994]"/>
        </label>
      </div>}

      <nav className={`min-h-0 flex-1 overflow-y-auto pb-3 [scrollbar-color:#575357_transparent] [scrollbar-width:thin] ${expanded ? 'px-[13px]' : 'px-[8px]'}`}>
        {shown.map((item)=>{
          const active=String(currentTab)===String(item.id);
          const Icon=item.icon;
          return <button key={String(item.id)} title={!expanded ? item.label : undefined} onClick={()=>setCurrentTab(item.id)} className={`mb-[5px] flex h-[42px] w-full items-center rounded-[11px] text-left transition-colors ${expanded ? 'px-[14px]' : 'justify-center px-0'} ${active?'bg-[#5d5957] text-white':'text-[#e4dfda] hover:bg-[#393739]'}`}>
            <Icon size={17} strokeWidth={1.55} className={`shrink-0 ${expanded ? 'mr-[16px]' : ''} ${active?'text-white':'text-[#d3ceca]'}`}/>
            {expanded && <span className={`truncate text-[14px] ${active?'font-medium':'font-normal'}`}>{item.label}</span>}
          </button>;
        })}
      </nav>

      <div className={`shrink-0 border-t border-white/[0.05] pb-[14px] pt-3 ${expanded ? 'px-[13px]' : 'px-[8px]'}`}>
        <div className={`flex h-[60px] w-full items-center rounded-[14px] bg-[#302f31] ${expanded ? 'px-3' : 'justify-center px-0'}`}>
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#ebd8cc] text-[13px] font-semibold text-[#393431]">{(currentManager?.name||'Светлана').slice(0,1).toUpperCase()}</div>
          {expanded && <div className="ml-[12px] min-w-0"><div className="truncate text-[13px] font-medium text-white">{currentManager?.name||'Светлана'}</div><div className="mt-1 text-[11px] text-[#b9b3ae]">{currentManager?.role||'Владелец'}</div></div>}
        </div>
      </div>
    </aside>
  );
};
