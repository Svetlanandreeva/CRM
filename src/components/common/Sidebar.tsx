import React from 'react';
import {
  CalendarDays, CircleDot, FileText, Home, MessageCircle, Search, Settings,
  Sigma, Sparkles, TrendingUp, Triangle,
} from 'lucide-react';
import { useCrm, type NavigationTab } from '../../context/CrmContext';

type FigmaTab = NavigationTab | 'pipeline' | 'inbox' | 'ai_manager' | 'project_calc';
type Item = { id: FigmaTab; label: string; icon: React.FC<{ className?: string; size?: number; strokeWidth?: number }> };

const nav: Item[] = [
  { id: 'dashboard', label: 'Главная', icon: Home },
  { id: 'deals', label: 'Сделки', icon: CircleDot },
  { id: 'pipeline', label: 'Воронка', icon: Triangle },
  { id: 'inbox', label: 'Чаты', icon: MessageCircle },
  { id: 'finance', label: 'Экономика', icon: TrendingUp },
  { id: 'project_calc', label: 'Расчёт проекта', icon: Sigma },
  { id: 'documents', label: 'КП', icon: FileText },
  { id: 'ai_manager', label: 'Чат с Евой', icon: Sparkles },
  { id: 'calendar', label: 'Календарь проектов', icon: CalendarDays },
  { id: 'settings', label: 'Настройки', icon: Settings },
];

export const Sidebar: React.FC = () => {
  const { currentTab, setCurrentTab, currentManager } = useCrm();
  const [query, setQuery] = React.useState('');
  const shown = nav.filter((item) => item.label.toLowerCase().includes(query.trim().toLowerCase()));
  return (
    <aside className="relative z-30 h-screen min-h-[720px] w-[270px] shrink-0 overflow-hidden bg-[#2a292b] text-[#e4dfda]">
      <div className="absolute left-[28px] top-[28px] text-[24px] font-semibold leading-none text-white">✦ <span className="ml-1">Satori CRM</span></div>
      <label className="absolute left-[20px] top-[82px] flex h-[42px] w-[230px] items-center gap-2 rounded-[12px] bg-[#343235] px-5 text-[#bfb9b4]">
        <Search size={14} strokeWidth={1.7}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Поиск..." className="min-w-0 flex-1 bg-transparent text-[12px] outline-none placeholder:text-[#9f9994]"/>
      </label>
      <nav className="absolute left-[18px] right-[18px] top-[138px]">
        {shown.map((item,index)=>{const active=String(currentTab)===item.id;const Icon=item.icon;return <button key={item.id} onClick={()=>setCurrentTab(item.id as NavigationTab)} className={`mb-[8px] flex h-[44px] w-[234px] items-center rounded-[12px] px-[18px] text-left ${active?'bg-[#686461] text-white':'text-[#e4dfda] hover:bg-[#393739]'}`}>
          <Icon size={17} strokeWidth={1.55} className={`mr-[22px] shrink-0 ${active?'text-white':'text-[#d3ceca]'}`}/><span className={`truncate text-[15px] ${active?'font-medium':'font-normal'}`}>{item.label}</span>
        </button>})}
      </nav>
      <div className="absolute bottom-[28px] left-[18px] flex h-[72px] w-[234px] items-center rounded-[16px] bg-[#302f31] px-4">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#ebd8cc] text-[14px] font-semibold text-[#393431]">{(currentManager?.name||'Светлана').slice(0,1).toUpperCase()}</div>
        <div className="ml-[14px] min-w-0"><div className="truncate text-[14px] font-medium text-white">{currentManager?.name||'Светлана'}</div><div className="mt-1 text-[12px] text-[#b9b3ae]">{currentManager?.role||'Владелец'}</div></div>
      </div>
    </aside>
  );
};
