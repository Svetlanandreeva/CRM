import React from 'react';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Kanban,
  Factory,
  FileText,
  CheckSquare,
  Package,
  Truck,
  TrendingUp,
  Settings,
  Layers,
  Calendar,
  Inbox,
  PhoneCall,
  Bot,
  PlugZap,
} from 'lucide-react';
import { useCrm, NavigationTab } from '../../context/CrmContext';

type ExtendedTab = NavigationTab | 'inbox' | 'call_list' | 'ai_manager' | 'integrations';

export const Sidebar: React.FC = () => {
  const { currentTab, setCurrentTab, tasks, deals, productionOrders, theme } = useCrm();

  const overdueTasksCount = tasks.filter(t => !t.completed && new Date(t.deadline) < new Date()).length;
  const activeDealsCount = deals.filter(d => d.stage !== 'closed_won' && d.stage !== 'closed_lost').length;
  const activeProdCount = productionOrders.filter(p => p.status !== 'shipped').length;
  const isLight = theme === 'light';

  interface NavItem {
    id: ExtendedTab;
    label: string;
    icon: React.FC<{ className?: string }>;
    count?: number;
    countUrgent?: boolean;
  }

  const sections: { title: string; items: NavItem[] }[] = [
    {
      title: 'Главное',
      items: [
        { id: 'dashboard', label: 'Дашборд', icon: LayoutDashboard },
        { id: 'deals', label: 'Воронка сделок', icon: Kanban, count: activeDealsCount },
        { id: 'clients', label: 'База клиентов', icon: Users },
        { id: 'inbox', label: 'Входящие', icon: Inbox },
        { id: 'call_list', label: 'Обзвон', icon: PhoneCall },
        { id: 'ai_manager', label: 'AI-менеджер', icon: Bot },
        { id: 'client_cockpit', label: 'Карточка клиента', icon: Layers },
      ]
    },
    {
      title: 'Производство & Задачи',
      items: [
        { id: 'production', label: 'Производство', icon: Factory, count: activeProdCount },
        { id: 'tasks', label: 'Задачи', icon: CheckSquare, count: overdueTasksCount > 0 ? overdueTasksCount : undefined, countUrgent: overdueTasksCount > 0 },
        { id: 'calendar', label: 'Календарь', icon: Calendar },
      ]
    },
    {
      title: 'Финансы & Счета',
      items: [
        { id: 'documents', label: 'КП и счета', icon: FileText },
        { id: 'finance', label: 'Оплаты и касса', icon: CreditCard },
      ]
    },
    {
      title: 'Система',
      items: [
        { id: 'catalog', label: 'Каталог товаров', icon: Package },
        { id: 'contractors', label: 'Подрядчики и цеха', icon: Truck },
        { id: 'analytics', label: 'Аналитика', icon: TrendingUp },
        { id: 'integrations', label: 'Интеграции', icon: PlugZap },
        { id: 'settings', label: 'Настройки', icon: Settings },
      ]
    }
  ];

  return (
    <aside className={`w-60 flex flex-col shrink-0 select-none z-20 transition-colors border-r ${
      isLight
        ? 'bg-[#F8F7F4] border-black/[0.08] text-[#1A1A1A]'
        : 'bg-[#141414] border-white/[0.08] text-neutral-200'
    }`}>
      <div className={`h-16 px-5 flex items-center justify-between border-b shrink-0 ${
        isLight ? 'border-black/[0.08] bg-[#F8F7F4]' : 'border-white/[0.08] bg-[#141414]'
      }`}>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-[#2563EB] flex items-center justify-center text-white font-bold text-xs tracking-tight">S</div>
          <span className="font-bold tracking-[-0.04em] text-lg text-[#1A1A1A] dark:text-white">SATORI</span>
        </div>
        <span className="meta-label">CRM</span>
      </div>

      <div className="flex-1 py-5 px-3 space-y-6 overflow-y-auto">
        {sections.map((section, sIdx) => (
          <div key={sIdx} className="space-y-1">
            <div className="px-2.5 pb-1 meta-label">{section.title}</div>
            {section.items.map((item) => {
              const Icon = item.icon;
              const isActive = String(currentTab) === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentTab(item.id as NavigationTab)}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[13px] transition-colors group ${
                    isActive
                      ? 'text-[#2563EB] font-medium bg-[#2563EB]/[0.08]'
                      : isLight
                      ? 'text-[#444444] hover:text-[#2563EB] hover:bg-black/[0.03] font-normal'
                      : 'text-neutral-400 hover:text-white hover:bg-white/[0.04] font-normal'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive
                        ? 'text-[#2563EB]'
                        : isLight ? 'text-neutral-400 group-hover:text-[#2563EB]' : 'text-neutral-500 group-hover:text-neutral-300'
                    }`} />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.count !== undefined && (
                    <span className={`text-[11px] px-1.5 py-0.5 rounded font-mono font-medium tabular-nums ${
                      isActive
                        ? 'bg-[#2563EB] text-white'
                        : item.countUrgent
                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300'
                        : isLight
                        ? 'text-neutral-500 bg-black/[0.05]'
                        : 'text-neutral-400 bg-white/[0.06]'
                    }`}>{item.count}</span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </aside>
  );
};
