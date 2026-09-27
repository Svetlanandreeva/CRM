import React from 'react';
import {
  CalendarDays, CircleDot, FileText, Home, MessageCircle, PhoneCall, Plug, Search, Settings,
  Sigma, Sparkles, TrendingUp, Triangle,
} from 'lucide-react';
import { useCrm, type NavigationTab } from '../../context/CrmContext';

type Item = { id: NavigationTab; label: string; icon: React.FC<{ className?: string; size?: number; strokeWidth?: number }> };

const nav: Item[] = [
  { id: 'dashboard', label: 'Главная', icon: Home },
  { id: 'call_list' as NavigationTab, label: 'Обзвоны', icon: PhoneCall },
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
  const shown = nav.filter((item) => item.label.toLowerCase().includes(query.trim().toLowerCase()));
  return (
    <aside className="relative z-30 flex h-screen w-[270px] shrink-0 flex-col overflow-hidden bg-[#2a292b] text-[#e4dfda]">
      <div className="shrink-0 px-7 pb-5 pt-7 text-[24px] font-semibold leading-none text-white">✦ <span className="ml-1">Satori CRM</span></div>

      <div className="shrink-0 px-[20px] pb-3">
        <label className="flex h-[42px] w-full items-center gap-2 rounded-[12px] bg-[#343235] px-5 text-[#bfb9b4]">
          <Search size={14} strokeWidth={1.7}/>
          <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Поиск..." className="min-w-0 flex-1 bg-transparent text-[12px] outline-none placeholder:text-[#9f9994]"/>
        </label>
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto px-[18px] pb-3 [scrollbar-color:#575357_transparent] [scrollbar-width:thin]">
        {shown.map((item)=>{
          const active=String(currentTab)===String(item.id);
          const Icon=item.icon;
          return <button key={String(item.id)} onClick={()=>setCurrentTab(item.id)} className={`mb-[7px] flex h-[44px] w-full items-center rounded-[12px] px-[18px] text-left transition-colors ${active?'bg-[#686461] text-white':'text-[#e4dfda] hover:bg-[#393739]'}`}>
            <Icon size={17} strokeWidth={1.55} className={`mr-[20px] shrink-0 ${active?'text-white':'text-[#d3ceca]'}`}/>
            <span className={`truncate text-[15px] ${active?'font-medium':'font-normal'}`}>{item.label}</span>
          </button>;
        })}
      </nav>

      <div className="shrink-0 border-t border-white/[0.05] px-[18px] pb-[20px] pt-3">
        <div className="flex h-[72px] w-full items-center rounded-[16px] bg-[#302f31] px-4">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#ebd8cc] text-[14px] font-semibold text-[#393431]">{(currentManager?.name||'Светлана').slice(0,1).toUpperCase()}</div>
          <div className="ml-[14px] min-w-0">
            <div className="truncate text-[14px] font-medium text-white">{currentManager?.name||'Светлана'}</div>
            <div className="mt-1 text-[12px] text-[#b9b3ae]">{currentManager?.role||'Владелец'}</div>
          </div>
        </div>
      </div>
    </aside>
  );
};
