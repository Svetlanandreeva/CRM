import React from 'react';
import {
  CalendarDays, ChevronLeft, ChevronRight, CircleDot, FileText, Home, MessageCircle, PhoneCall, Plug, Search, Settings,
  Sigma, Sparkles, TrendingUp, Triangle, Users,
} from 'lucide-react';
import { useCrm, type NavigationTab } from '../../context/CrmContext';

type Item = { id: NavigationTab; label: string; icon: React.FC<{ className?: string; size?: number; strokeWidth?: number }> };

const nav: Item[] = [
  { id: 'dashboard', label: 'Главная', icon: Home },
  { id: 'call_list' as NavigationTab, label: 'Обзвоны', icon: PhoneCall },
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
  const [collapsed, setCollapsed] = React.useState(() => localStorage.getItem('satori_sidebar_collapsed') === '1');
  const shown = nav.filter((item) => item.label.toLowerCase().includes(query.trim().toLowerCase()));
  const toggle = () => setCollapsed(v => { const next = !v; localStorage.setItem('satori_sidebar_collapsed', next ? '1' : '0'); return next; });

  return (
    <aside className={`relative z-30 flex h-screen shrink-0 flex-col overflow-hidden bg-[#2a292b] text-[#e4dfda] transition-[width] duration-200 ${collapsed ? 'w-[72px]' : 'w-[270px]'}`}>
      <div className={`flex h-[72px] shrink-0 items-center ${collapsed ? 'justify-center px-2' : 'justify-between px-7'}`}>
        <div className="truncate text-[24px] font-semibold leading-none text-white">✦ {!collapsed && <span className="ml-1">Satori CRM</span>}</div>
        {!collapsed && <button onClick={toggle} title="Свернуть меню" className="grid h-8 w-8 place-items-center rounded-lg text-[#bbb5b0] hover:bg-white/5 hover:text-white"><ChevronLeft size={16}/></button>}
      </div>

      {collapsed ? <div className="shrink-0 px-3 pb-3"><button onClick={toggle} title="Развернуть меню" className="grid h-[42px] w-full place-items-center rounded-[12px] bg-[#343235] text-[#c9c3be]"><ChevronRight size={16}/></button></div> : <div className="shrink-0 px-[20px] pb-3">
        <label className="flex h-[42px] w-full items-center gap-2 rounded-[12px] bg-[#343235] px-5 text-[#bfb9b4]">
          <Search size={14} strokeWidth={1.7}/>
          <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Поиск..." className="min-w-0 flex-1 bg-transparent text-[12px] outline-none placeholder:text-[#9f9994]"/>
        </label>
      </div>}

      <nav className={`min-h-0 flex-1 overflow-y-auto pb-3 [scrollbar-color:#575357_transparent] [scrollbar-width:thin] ${collapsed ? 'px-[10px]' : 'px-[18px]'}`}>
        {shown.map((item)=>{
          const active=String(currentTab)===String(item.id);
          const Icon=item.icon;
          return <button key={String(item.id)} title={collapsed ? item.label : undefined} onClick={()=>setCurrentTab(item.id)} className={`mb-[7px] flex h-[44px] w-full items-center rounded-[12px] text-left transition-colors ${collapsed ? 'justify-center px-0' : 'px-[18px]'} ${active?'bg-[#686461] text-white':'text-[#e4dfda] hover:bg-[#393739]'}`}>
            <Icon size={17} strokeWidth={1.55} className={`shrink-0 ${collapsed ? '' : 'mr-[20px]'} ${active?'text-white':'text-[#d3ceca]'}`}/>
            {!collapsed && <span className={`truncate text-[15px] ${active?'font-medium':'font-normal'}`}>{item.label}</span>}
          </button>;
        })}
      </nav>

      <div className={`shrink-0 border-t border-white/[0.05] pb-[20px] pt-3 ${collapsed ? 'px-[10px]' : 'px-[18px]'}`}>
        <div className={`flex h-[72px] w-full items-center rounded-[16px] bg-[#302f31] ${collapsed ? 'justify-center px-0' : 'px-4'}`}>
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#ebd8cc] text-[14px] font-semibold text-[#393431]">{(currentManager?.name||'Светлана').slice(0,1).toUpperCase()}</div>
          {!collapsed && <div className="ml-[14px] min-w-0"><div className="truncate text-[14px] font-medium text-white">{currentManager?.name||'Светлана'}</div><div className="mt-1 text-[12px] text-[#b9b3ae]">{currentManager?.role||'Владелец'}</div></div>}
        </div>
      </div>
    </aside>
  );
};
