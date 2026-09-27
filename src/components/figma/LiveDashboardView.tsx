import React, { useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  Check,
  MessageCircle,
  Moon,
  RefreshCw,
  Sun,
  Wallet,
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { compactMoney, money, stageMeta } from './FigmaViews';
import type { Deal } from '../../types/crm';

type Thread = {
  key: string;
  channel: 'email' | 'telegram';
  contactId: string | null;
  title: string;
  subtitle: string;
  lastSnippet: string;
  lastMessageAt: string;
  lastDirection: string;
  unreadCount: number;
};

type ActivityRow = {
  id: string;
  type?: string;
  description?: string;
  contactId?: string | null;
  dealId?: string | null;
  contactName?: string | null;
  createdAt?: string | number | null;
};

type EconomicsRow = {
  dealId: string;
  contactId?: string | null;
  contactName?: string | null;
  dealTitle?: string | null;
  receivedAmount?: number;
};

const Card: React.FC<React.PropsWithChildren<{ className?: string; onClick?: () => void }>> = ({ children, className = '', onClick }) => (
  <section onClick={onClick} className={`rounded-[18px] border border-[#e8e3de] bg-white ${onClick ? 'cursor-pointer' : ''} ${className}`}>{children}</section>
);

const dateMs = (value?: string | number | null) => {
  const d = value === null || value === undefined || value === '' ? null : new Date(value);
  return d && !Number.isNaN(d.getTime()) ? d.getTime() : 0;
};

const shortDate = (value?: string | number | null) => {
  const ms = dateMs(value);
  if (!ms) return '—';
  return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' }).format(new Date(ms)).replace('.', '');
};

const dateTime = (value?: string | number | null) => {
  const ms = dateMs(value);
  if (!ms) return '—';
  return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(ms)).replace('.', '');
};

const monthStart = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1);
const monthEnd = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
const mondayOf = (date: Date) => {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = d.getDay() || 7;
  d.setDate(d.getDate() - day + 1);
  return d;
};
const addDays = (date: Date, days: number) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

const taskDeadlineLabel = (value?: string) => {
  const ms = dateMs(value);
  if (!ms) return 'Без срока';
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const target = new Date(ms);
  const targetStart = new Date(target.getFullYear(), target.getMonth(), target.getDate()).getTime();
  const delta = Math.round((targetStart - todayStart) / 86400000);
  if (delta < 0) return 'Просрочено';
  if (delta === 0) return 'Сегодня';
  if (delta === 1) return 'Завтра';
  return shortDate(value);
};

const activityTone = (type?: string) => {
  const t = String(type || '').toLowerCase();
  if (t.includes('payment') || t.includes('оплат')) return '#d6eadf';
  if (t.includes('message') || t.includes('comment')) return '#dee9f7';
  if (t.includes('proposal') || t.includes('document')) return '#f2e3ce';
  if (t.includes('meeting') || t.includes('call')) return '#dde9f5';
  return '#f4d9c7';
};

const donut = (parts: Array<{ value: number; color: string }>) => {
  const total = parts.reduce((s, p) => s + Math.max(0, p.value), 0);
  if (!total) return '#eee8e2';
  let cursor = 0;
  const stops = parts.filter(p => p.value > 0).map(part => {
    const start = cursor;
    cursor += (part.value / total) * 100;
    return `${part.color} ${start}% ${cursor}%`;
  });
  return `conic-gradient(${stops.join(',')})`;
};

export const LiveDashboardView: React.FC = () => {
  const {
    deals,
    tasks,
    theme,
    toggleTheme,
    setCurrentTab,
    setSelectedClientId,
    setSelectedDealId,
  } = useCrm();

  const [threads, setThreads] = useState<Thread[]>([]);
  const [activities, setActivities] = useState<ActivityRow[]>([]);
  const [economicsRows, setEconomicsRows] = useState<EconomicsRow[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const now = new Date();
  const dateLabel = new Intl.DateTimeFormat('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })
    .format(now)
    .replace(/^./, x => x.toUpperCase());

  async function loadExtras() {
    setRefreshing(true);
    try {
      const [emailRes, tgRes, activityRes, economicsRes] = await Promise.all([
        fetch('/api/inbox?filter=client&search=', { cache: 'no-store' }),
        fetch('/api/messages/telegram?search=', { cache: 'no-store' }),
        fetch('/api/activities', { cache: 'no-store' }),
        fetch('/api/economics', { cache: 'no-store' }),
      ]);

      const [email, tg, activityData, economics] = await Promise.all([
        emailRes.json().catch(() => ({ threads: [] })),
        tgRes.json().catch(() => ({ threads: [] })),
        activityRes.json().catch(() => []),
        economicsRes.json().catch(() => ({ deals: [] })),
      ]);

      const rows: Thread[] = [];
      if (emailRes.ok && Array.isArray(email.threads)) {
        for (const t of email.threads) rows.push({
          key: `email:${t.id}`,
          channel: 'email',
          contactId: t.contactId || null,
          title: t.remoteName || t.remoteEmail || 'Email',
          subtitle: t.subject || t.remoteEmail || '',
          lastSnippet: t.lastSnippet || '',
          lastMessageAt: String(t.lastMessageAt || ''),
          lastDirection: t.lastDirection || '',
          unreadCount: Number(t.unreadCount || 0),
        });
      }
      if (tgRes.ok && Array.isArray(tg.threads)) {
        for (const t of tg.threads) rows.push({
          key: `telegram:${t.id}`,
          channel: 'telegram',
          contactId: t.contactId || t.id || null,
          title: t.remoteName || 'Telegram',
          subtitle: t.remoteHandle || 'Telegram',
          lastSnippet: t.lastSnippet || '',
          lastMessageAt: String(t.lastMessageAt || ''),
          lastDirection: t.lastDirection || '',
          unreadCount: Number(t.unreadCount || 0),
        });
      }
      rows.sort((a, b) => dateMs(b.lastMessageAt) - dateMs(a.lastMessageAt));
      setThreads(rows);
      setActivities(activityRes.ok && Array.isArray(activityData) ? activityData : []);
      setEconomicsRows(economicsRes.ok && Array.isArray(economics.deals) ? economics.deals : []);
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void loadExtras();
    const timer = window.setInterval(() => void loadExtras(), 60000);
    return () => window.clearInterval(timer);
  }, []);

  const newLeads = deals.filter(d => d.stage === 'lead').length;
  const inWork = deals.filter(d => ['contacted', 'calculation'].includes(d.stage)).length;
  const agreement = deals.filter(d => ['proposal_sent', 'negotiation', 'prepayment'].includes(d.stage)).length;

  const groups = [
    { label: 'Новая заявка', count: newLeads, color: '#8eb4df' },
    { label: 'В работе', count: inWork, color: '#d7b188' },
    { label: 'На согласовании', count: agreement, color: '#d98395' },
    { label: 'Производство', count: deals.filter(d => ['production', 'ready'].includes(d.stage)).length, color: '#a497cd' },
    { label: 'Доставка', count: deals.filter(d => d.stage === 'shipped').length, color: '#7897bb' },
    { label: 'Закрыто', count: deals.filter(d => ['closed_won', 'closed_lost'].includes(d.stage)).length, color: '#7fa18f' },
  ];

  const openTasks = [...tasks]
    .filter(t => !t.completed)
    .sort((a, b) => (dateMs(a.deadline) || Number.MAX_SAFE_INTEGER) - (dateMs(b.deadline) || Number.MAX_SAFE_INTEGER))
    .slice(0, 5);

  const recentActivities = [...activities]
    .sort((a, b) => dateMs(b.createdAt) - dateMs(a.createdAt))
    .slice(0, 5);

  const recentThreads = threads.slice(0, 5);

  const trend = useMemo(() => {
    const start = monthStart(now);
    const end = monthEnd(now);
    const days = end.getDate();
    const bucketSize = Math.ceil(days / 10);
    return Array.from({ length: 10 }, (_, index) => {
      const fromDay = index * bucketSize + 1;
      const toDay = Math.min(days, (index + 1) * bucketSize);
      const count = deals.filter(deal => {
        const ms = dateMs(deal.createdAt);
        if (!ms) return false;
        const d = new Date(ms);
        return d.getFullYear() === start.getFullYear() && d.getMonth() === start.getMonth() && d.getDate() >= fromDay && d.getDate() <= toDay;
      }).length;
      return { fromDay, toDay, count };
    });
  }, [deals, now.getFullYear(), now.getMonth()]);
  const maxTrend = Math.max(1, ...trend.map(x => x.count));

  const weekStart = mondayOf(now);
  const weekEnd = addDays(weekStart, 7);
  const projectRows = deals
    .filter(d => d.stage !== 'closed_lost' && dateMs(d.deadline) > 0)
    .filter(d => {
      const start = dateMs(d.createdAt) || dateMs(d.deadline);
      const end = dateMs(d.deadline);
      return start < weekEnd.getTime() && end >= weekStart.getTime();
    })
    .sort((a, b) => dateMs(a.deadline) - dateMs(b.deadline))
    .slice(0, 4);

  const projectBar = (deal: Deal) => {
    const windowStart = weekStart.getTime();
    const windowEnd = weekEnd.getTime();
    const rawStart = dateMs(deal.createdAt) || windowStart;
    const rawEnd = dateMs(deal.deadline) || rawStart;
    const start = Math.max(windowStart, Math.min(windowEnd, rawStart));
    const end = Math.max(start + 3600000, Math.min(windowEnd, rawEnd));
    const left = ((start - windowStart) / (windowEnd - windowStart)) * 100;
    const width = Math.max(4, ((end - start) / (windowEnd - windowStart)) * 100);
    return { left: `${left}%`, width: `${Math.min(100 - left, width)}%` };
  };

  const economicsByDeal = new Map(economicsRows.map(row => [String(row.dealId), row]));
  const received = economicsRows.reduce((sum, row) => sum + Math.max(0, Number(row.receivedAmount || 0)) / 100, 0);
  let expected = 0;
  let overdue = 0;
  for (const deal of deals.filter(d => d.stage !== 'closed_lost')) {
    const row = economicsByDeal.get(deal.id);
    const got = Math.max(0, Number(row?.receivedAmount || 0)) / 100;
    const outstanding = Math.max(0, deal.amount - got);
    if (!outstanding) continue;
    if (dateMs(deal.deadline) > 0 && dateMs(deal.deadline) < Date.now()) overdue += outstanding;
    else expected += outstanding;
  }
  const econTotal = received + expected + overdue;
  const economyDonut = donut([
    { value: received, color: '#dcc9b7' },
    { value: expected, color: '#8eb4df' },
    { value: overdue, color: '#d98395' },
  ]);
  const stageDonut = donut(groups.map(g => ({ value: g.count, color: g.color })));

  const openClient = (contactId: string | null) => {
    if (!contactId) return setCurrentTab('inbox');
    setSelectedClientId(contactId);
    setCurrentTab('client_cockpit');
  };

  const openDeal = (deal: Deal) => {
    setSelectedDealId(deal.id);
    setCurrentTab('deals');
  };

  const weekLabel = `${new Intl.DateTimeFormat('ru-RU', { day: 'numeric' }).format(weekStart)} — ${new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' }).format(addDays(weekStart, 6))}`;
  const monthName = new Intl.DateTimeFormat('ru-RU', { month: 'long' }).format(now);
  const monthlyRevenue: React.ReactNode = '—';

  return (
    <div className="relative min-h-[1000px] min-w-[1080px] bg-[#f7f5f2] px-[42px] py-[28px] text-[#1f1d1c]">
      <header className="flex h-[40px] items-start justify-between">
        <div className="flex items-baseline gap-4">
          <h1 className="text-[34px] font-semibold leading-none tracking-[-.035em]">Главная</h1>
          <span className="text-[13px] text-[#817a74]">{dateLabel}</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => void loadExtras()} title="Обновить данные" className="grid h-[44px] w-[44px] place-items-center rounded-full bg-white text-[#817a74]">
            <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
          </button>
          <button onClick={toggleTheme} title="Переключить тему" className="flex h-[44px] w-[126px] items-center justify-around rounded-[22px] bg-white text-[#282523]">
            <Sun size={17} />
            <Moon size={16} className={theme === 'dark' ? 'text-[#282523]' : 'text-[#aaa39d]'} />
          </button>
        </div>
      </header>

      <div className="mt-[18px] grid grid-cols-4 gap-[25px]">
        {[
          { icon: <MessageCircle size={20} />, bg: '#dcebfa', value: newLeads, label: 'Новые заявки' },
          { icon: <BarChart3 size={20} />, bg: '#f8e5d2', value: inWork, label: 'В работе' },
          { icon: <Check size={20} />, bg: '#f5d4da', value: agreement, label: 'На согласовании' },
          { icon: <Wallet size={20} />, bg: '#e5defa', value: monthlyRevenue, label: 'Выручка (месяц)', title: 'CRM пока хранит только накопленную сумму оплаты по сделке без даты каждой транзакции, поэтому месячная выручка не подменяется общей суммой.' },
        ].map((item, index) => (
          <Card key={index} className="relative h-[110px]" >
            <div className="absolute left-[18px] top-[20px] grid h-[56px] w-[56px] place-items-center rounded-[16px]" style={{ background: item.bg }}>{item.icon}</div>
            <div className="absolute left-[90px] top-[17px] right-[12px]" title={item.title}>
              <div className="truncate text-[23px] font-medium">{item.value}</div>
              <div className="mt-[8px] text-[12px] text-[#6d6762]">{item.label}</div>
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-[18px] grid h-[250px] grid-cols-[715fr_512fr] gap-[18px]">
        <Card className="p-[20px]">
          <div className="flex items-center justify-between">
            <h2 className="text-[18px] font-semibold">Динамика сделок</h2>
            <span className="rounded-[10px] bg-[#faf9f7] px-4 py-2 text-[10px] capitalize text-[#817a74]">{monthName}</span>
          </div>
          <div className="relative mt-[12px] h-[166px]">
            <div className="absolute inset-x-0 top-[16px] border-t border-[#eeeae6]" />
            <div className="absolute inset-x-0 top-[52px] border-t border-[#eeeae6]" />
            <div className="absolute inset-x-0 top-[88px] border-t border-[#eeeae6]" />
            <div className="absolute inset-x-0 top-[124px] border-t border-[#eeeae6]" />
            <div className="absolute inset-x-2 bottom-[24px] top-0 flex items-end gap-[22px]">
              {trend.map((item, index) => (
                <div key={index} className="flex h-full flex-1 items-end" title={`${item.fromDay}–${item.toDay}: ${item.count}`}>
                  <div className="w-full rounded-[8px] bg-[#d8e5f6]" style={{ height: `${Math.max(4, item.count / maxTrend * 100)}%` }} />
                </div>
              ))}
            </div>
            <div className="absolute inset-x-0 bottom-0 flex justify-between text-[9px] text-[#817a74]">
              <span>1 {monthName.slice(0, 3)}</span><span>7 {monthName.slice(0, 3)}</span><span>14 {monthName.slice(0, 3)}</span><span>21 {monthName.slice(0, 3)}</span><span>{monthEnd(now).getDate()} {monthName.slice(0, 3)}</span>
            </div>
          </div>
        </Card>

        <Card className="p-[20px]" onClick={() => setCurrentTab('pipeline')}>
          <h2 className="text-[18px] font-semibold">Распределение по этапам</h2>
          <div className="mt-[15px] grid grid-cols-[1fr_168px] items-center gap-3">
            <div className="space-y-[9px]">
              {groups.map(group => <div key={group.label} className="flex items-center text-[11px]"><span className="mr-3 h-[10px] w-[10px] rounded-full" style={{ background: group.color }} /><span className="flex-1 text-[#514c48]">{group.label}</span><b>{group.count}</b></div>)}
            </div>
            <div className="relative mx-auto h-[160px] w-[160px] rounded-full" style={{ background: stageDonut }}>
              <div className="absolute inset-[26px] grid place-items-center rounded-full bg-white text-center"><div><b className="text-[26px]">{deals.length}</b><div className="text-[10px] text-[#706a65]">Всего сделок</div></div></div>
            </div>
          </div>
        </Card>
      </div>

      <div className="mt-[16px] grid h-[310px] grid-cols-[470fr_370fr_377fr] gap-[14px]">
        <Card className="p-[20px]">
          <h2 className="text-[18px] font-semibold">Ближайшие задачи</h2>
          <div className="mt-[18px] space-y-[8px]">
            {openTasks.length ? openTasks.map((task, index) => (
              <button key={task.id} onClick={() => task.clientId ? openClient(task.clientId) : setCurrentTab('calendar')} className="flex h-[36px] w-full items-center rounded-[10px] bg-[#fbfaf8] px-[12px] text-left">
                <span className="mr-3 h-[16px] w-[16px] rounded-full" style={{ background: index === 0 ? '#8eb4df' : '#e9e5e0' }} />
                <span className="min-w-0 flex-1 truncate text-[11px]">{task.title}{task.clientName ? ` — ${task.clientName}` : ''}</span>
                <span className={`ml-3 text-[9px] ${taskDeadlineLabel(task.deadline) === 'Просрочено' ? 'text-[#c56f7f]' : 'text-[#8a837d]'}`}>{taskDeadlineLabel(task.deadline)}</span>
              </button>
            )) : <div className="grid h-[190px] place-items-center text-[11px] text-[#817a74]">Открытых задач нет</div>}
          </div>
        </Card>

        <Card className="p-[20px]">
          <h2 className="text-[18px] font-semibold">Последние активности</h2>
          <div className="mt-[18px] space-y-[6px]">
            {recentActivities.length ? recentActivities.map(row => (
              <button key={row.id} onClick={() => row.contactId ? openClient(row.contactId) : undefined} className="flex h-[40px] w-full items-start text-left">
                <span className="mr-[10px] h-[40px] w-[40px] shrink-0 rounded-[12px]" style={{ background: activityTone(row.type) }} />
                <span className="min-w-0 flex-1 pt-[1px]"><b className="block truncate text-[10px]">{row.contactName ? `${row.contactName}` : 'CRM'}</b><span className="mt-[2px] block truncate text-[9px] text-[#7b746e]">{row.description || row.type || 'Активность'} · {shortDate(row.createdAt)}</span></span>
              </button>
            )) : <div className="grid h-[190px] place-items-center text-[11px] text-[#817a74]">Активностей пока нет</div>}
          </div>
        </Card>

        <Card className="p-[20px]">
          <div className="flex items-center justify-between"><h2 className="text-[18px] font-semibold">Чаты</h2><button onClick={() => setCurrentTab('inbox')} className="text-[9px] text-[#817a74]">Все →</button></div>
          <div className="mt-[18px] space-y-[6px]">
            {recentThreads.length ? recentThreads.map(thread => (
              <button key={thread.key} onClick={() => openClient(thread.contactId)} className="flex h-[40px] w-full items-center text-left">
                <span className={`mr-[10px] grid h-[38px] w-[38px] shrink-0 place-items-center rounded-full text-[9px] ${thread.channel === 'telegram' ? 'bg-[#cad3ec]' : 'bg-[#f0d6c8]'}`}>{thread.title.slice(0, 1).toUpperCase()}</span>
                <span className="min-w-0 flex-1"><b className="block truncate text-[10px]">{thread.title}</b><span className="mt-[2px] block truncate text-[9px] text-[#7e7772]">{thread.lastSnippet || thread.subtitle}</span></span>
                {thread.unreadCount > 0 && <span className="ml-2 rounded-full bg-[#d98395] px-2 py-1 text-[8px] text-white">{thread.unreadCount}</span>}
              </button>
            )) : <div className="grid h-[190px] place-items-center text-[11px] text-[#817a74]">Диалогов пока нет</div>}
          </div>
        </Card>
      </div>

      <div className="mt-[16px] grid h-[160px] grid-cols-[720fr_507fr] gap-[18px]">
        <Card className="p-[20px]" onClick={() => setCurrentTab('calendar')}>
          <div className="flex items-baseline gap-[38px]"><h2 className="text-[18px] font-semibold">Календарь проектов</h2><span className="text-[11px] text-[#49443f]">{weekLabel}</span></div>
          {projectRows.length ? <div className="mt-[17px] space-y-[7px]">
            {projectRows.map((deal, index) => {
              const bar = projectBar(deal);
              const colors = ['#dcc9b7', '#7fa18f', '#b7aedc', '#a69bc3'];
              return <button key={deal.id} onClick={(e) => { e.stopPropagation(); openDeal(deal); }} className="grid h-[17px] w-full grid-cols-[180px_1fr] items-center text-left"><span className="truncate text-[9px] text-[#3d3936]">{deal.title}</span><span className="relative h-[14px]"><i className="absolute top-0 h-[14px] rounded-[7px]" style={{ ...bar, background: colors[index % colors.length] }} /></span></button>;
            })}
          </div> : <div className="grid h-[82px] place-items-center text-[10px] text-[#817a74]">На этой неделе проектов со сроками нет</div>}
        </Card>

        <Card className="p-[20px]" onClick={() => setCurrentTab('finance')}>
          <h2 className="text-[18px] font-semibold">Экономика</h2>
          <div className="mt-[8px] grid grid-cols-[150px_1fr] items-center gap-4">
            <div className="relative mx-auto h-[112px] w-[112px] rounded-full" style={{ background: economyDonut }}>
              <div className="absolute inset-[22px] grid place-items-center rounded-full bg-white text-center"><div><b className="text-[13px]">{econTotal ? compactMoney(econTotal) : '0 ₽'}</b><div className="text-[8px] text-[#756e68]">в сделках</div></div></div>
            </div>
            <div className="space-y-[10px] text-[10px]">
              <div className="flex items-center"><i className="mr-3 h-[10px] w-[10px] rounded-full bg-[#dcc9b7]"/><span className="flex-1 text-[#514b47]">Оплачено по сделкам</span><b>{money(received)}</b></div>
              <div className="flex items-center"><i className="mr-3 h-[10px] w-[10px] rounded-full bg-[#8eb4df]"/><span className="flex-1 text-[#514b47]">Ожидается</span><b>{money(expected)}</b></div>
              <div className="flex items-center"><i className="mr-3 h-[10px] w-[10px] rounded-full bg-[#d98395]"/><span className="flex-1 text-[#514b47]">Просрочено</span><b>{money(overdue)}</b></div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
