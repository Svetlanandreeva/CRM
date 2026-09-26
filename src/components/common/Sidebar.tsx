import React from 'react';
import {
  CalendarDays,
  CircleDot,
  FileText,
  Home,
  MessageCircle,
  MoonStar,
  Search,
  Settings,
  Sigma,
  Sparkles,
  TrendingUp,
  Triangle,
} from 'lucide-react';
import { useCrm, type NavigationTab } from '../../context/CrmContext';

type FigmaTab = NavigationTab | 'pipeline' | 'inbox' | 'ai_manager' | 'project_calc';

type Item = {
  id: FigmaTab;
  label: string;
  icon: React.FC<{ className?: string; size?: number }>;
};

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
    <aside className="relative z-30 flex h-screen w-[270px] shrink-0 flex-col overflow-hidden bg-[#2a292b] px-[18px] pb-[18px] pt-[22px] text-[#e4dfda]">
      <div className="px-[10px] text-[21px] font-semibold tracking-[-0.025em] text-white">✦ <span className="ml-1">Satori CRM</span></div>

      <label className="mt-[24px] flex h-[42px] items-center gap-2 rounded-[12px] bg-[#343235] px-4 text-[#bfb9b4]">
        <Search size={14} strokeWidth={1.8}/>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Поиск..."
          className="min-w-0 flex-1 bg-transparent text-[12px] outline-none placeholder:text-[#9f9994]"
        />
      </label>

      <nav className="mt-[15px] flex-1 space-y-[2px] overflow-y-auto py-1">
        {shown.map((item) => {
          const active = String(currentTab) === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setCurrentTab(item.id as NavigationTab)}
              className={`group flex h-[44px] w-full items-center rounded-[12px] px-[17px] text-left transition-colors ${
                active ? 'bg-[#686461] text-white' : 'text-[#d3ceca] hover:bg-[#393739] hover:text-white'
              }`}
            >
              <Icon size={16} className={`mr-[18px] shrink-0 ${active ? 'text-white' : 'text-[#cbc5c0] group-hover:text-white'}`} strokeWidth={1.6}/>
              <span className={`truncate text-[13px] ${active ? 'font-medium' : 'font-normal'}`}>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="mt-4 flex h-[72px] shrink-0 items-center rounded-[16px] bg-[#302f31] px-4">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#ebd8cc] text-[14px] font-semibold text-[#393431]">
          {(currentManager?.name || 'Светлана').slice(0, 1).toUpperCase()}
        </div>
        <div className="ml-3 min-w-0">
          <div className="truncate text-[13px] font-medium text-white">{currentManager?.name || 'Светлана'}</div>
          <div className="mt-0.5 text-[10px] text-[#b9b3ae]">{currentManager?.role || 'Владелец'}</div>
        </div>
        <MoonStar size={15} className="ml-auto text-[#8d8884]" strokeWidth={1.5}/>
      </div>
    </aside>
  );
};
