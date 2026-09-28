import React from 'react';
import {
  CalendarDays, CircleDot, FileText, Home, MessageCircle, PhoneCall, Plug, Search, Settings,
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
  const [hovered, setHovered] = React.useState(false);
  const shown = nav.filter((item) => item.label.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <aside
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setQuery(''); }}
      className={`relative z-40 flex h-screen shrink-0 flex-col overflow-hidden border-r border-white/[0.045] bg-[#2a292b] text-[#e4dfda] transition-[width] duration-200 ease-out ${hovered ? 'w-[258px]' : 'w-[68px]'}`}
    >
      <div className={`flex h-[64px] shrink-0 items-center ${hovered ? 'px-[18px]' : 'justify-center px-2'}`}>
        <div className="flex min-w-0 items-center whitespace-nowrap text-white">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/[.07] text-[17px]">✦</span>
          <span className={`ml-3 text-[18px] font-semibold transition-opacity ${hovered ? 'opacity-100' : 'opacity-0'}`}>Satori CRM</span>
        </div>
      </div>

      <div className={`shrink-0 overflow-hidden px-[10px] pb-2 transition-all ${hovered ? 'h-[50px] opacity-100' : 'h-0 opacity-0'}`}>
        <label className="flex h-[40px] items-center gap-2 rounded-[11px] bg-[#343235] px-3 text-[#bfb9b4]">
          <Search size={14} strokeWidth={1.7}/>
          <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Поиск..." className="min-w-0 flex-1 bg-transparent text-[12px] outline-none placeholder:text-[#9f9994]"/>
        </label>
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-[10px] pb-3 [scrollbar-color:#575357_transparent] [scrollbar-width:thin]">
        {shown.map((item)=>{
          const active=String(currentTab)===String(item.id);
          const Icon=item.icon;
          return <button key={String(item.id)} title={!hovered ? item.label : undefined} onClick={()=>setCurrentTab(item.id)} className={`mb-[5px] flex h-[42px] w-full items-center rounded-[11px] text-left transition-colors ${hovered ? 'px-[11px]' : 'justify-center px-0'} ${active?'bg-white/[.12] text-white':'text-[#d6d0cb] hover:bg-white/[.06]'}`}>
            <Icon size={17} strokeWidth={1.55} className="shrink-0"/>
            <span className={`ml-[14px] min-w-0 flex-1 truncate text-[14px] transition-opacity ${hovered?'opacity-100':'pointer-events-none opacity-0'}`}>{item.label}</span>
          </button>;
        })}
      </nav>

      <div className="shrink-0 border-t border-white/[0.045] p-[10px]">
        <div className={`flex h-[54px] items-center rounded-[13px] bg-[#302f31] ${hovered ? 'px-3' : 'justify-center'}`}>
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#ebd8cc] text-[13px] font-semibold text-[#393431]">{(currentManager?.name||'Светлана').slice(0,1).toUpperCase()}</div>
          <div className={`ml-3 min-w-0 whitespace-nowrap transition-opacity ${hovered?'opacity-100':'pointer-events-none opacity-0'}`}><div className="truncate text-[13px] font-medium text-white">{currentManager?.name||'Светлана'}</div><div className="mt-0.5 text-[11px] text-[#a9a39e]">{currentManager?.role||'Владелец'}</div></div>
        </div>
      </div>
    </aside>
  );
};
