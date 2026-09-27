import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft, CheckCircle2, FileText, Filter, Mail, MessageCircle, Moon, Plus,
  Search, Send, Sun, Wallet,
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import type { Deal, DealStage, Task } from '../../types/crm';

const money = (value = 0) => `${new Intl.NumberFormat('ru-RU').format(Math.round(value))} ₽`;
const compactMoney = (value = 0) => value >= 1_000_000
  ? `${(value / 1_000_000).toLocaleString('ru-RU', { maximumFractionDigits: 2 })} млн ₽`
  : money(value);

const stageMeta: Record<DealStage, { label: string; bg: string; dot: string }> = {
  lead: { label: 'Новая заявка', bg: '#e5defa', dot: '#a497cd' },
  contacted: { label: 'В работе', bg: '#dcebfa', dot: '#8eb4df' },
  calculation: { label: 'Расчёт', bg: '#f8e5d2', dot: '#d7b188' },
  proposal_sent: { label: 'КП отправлено', bg: '#e8ddf7', dot: '#a497cd' },
  negotiation: { label: 'На согласовании', bg: '#f8e5d2', dot: '#d7b188' },
  prepayment: { label: 'Ожидает оплаты', bg: '#f5d4da', dot: '#d98395' },
  production: { label: 'Производство', bg: '#d9eadd', dot: '#7fa18f' },
  ready: { label: 'Готово', bg: '#d9eadd', dot: '#7fa18f' },
  shipped: { label: 'Доставка', bg: '#dcebfa', dot: '#7897bb' },
  closed_won: { label: 'Закрыто', bg: '#e8e3de', dot: '#8c8782' },
  closed_lost: { label: 'Отказ', bg: '#f4dde2', dot: '#c98a98' },
};

const activeStage = (stage: DealStage) => stage !== 'closed_won' && stage !== 'closed_lost';
const dateMs = (value?: string | null) => {
  if (!value) return 0;
  const d = new Date(value);
  const ms = d.getTime();
  return Number.isNaN(ms) || d.getFullYear() < 2000 || d.getFullYear() > 2100 ? 0 : ms;
};
const shortDate = (value?: string | null) => {
  const ms = dateMs(value);
  if (!ms) return '—';
  return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' }).format(new Date(ms)).replace('.', '');
};
const dateTime = (value?: string | null) => {
  const ms = dateMs(value);
  if (!ms) return '—';
  return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(ms)).replace('.', '');
};
const relativeDate = (value?: string | null) => {
  const ms = dateMs(value);
  if (!ms) return '—';
  const d = new Date(ms);
  const n = new Date();
  const a = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const b = new Date(n.getFullYear(), n.getMonth(), n.getDate()).getTime();
  const delta = Math.round((a - b) / 86400000);
  if (delta === 0) return 'Сегодня';
  if (delta === -1) return 'Вчера';
  if (delta === 1) return 'Завтра';
  return shortDate(value);
};

const Card: React.FC<React.PropsWithChildren<{ className?: string }>> = ({ children, className = '' }) => (
  <section className={`rounded-[18px] border border-[#ece8e3] bg-white ${className}`}>{children}</section>
);

const ThemePill: React.FC = () => {
  const { theme, toggleTheme } = useCrm();
  return <button onClick={toggleTheme} className="flex h-[44px] w-[126px] items-center justify-around rounded-[22px] border border-[#eeeae6] bg-white text-[#282523]">
    <Sun size={17}/><Moon size={16} className={theme === 'dark' ? 'text-[#282523]' : 'text-[#aaa39d]'}/>
  </button>;
};

const StageBadge: React.FC<{ stage: DealStage }> = ({ stage }) => (
  <span className="inline-flex h-[28px] max-w-[138px] items-center rounded-[14px] px-3 text-[10px] font-medium text-[#4d4743]" style={{ background: stageMeta[stage].bg }}>
    <i className="mr-2 h-2 w-2 shrink-0 rounded-full" style={{ background: stageMeta[stage].dot }}/>
    <span className="truncate">{stageMeta[stage].label}</span>
  </span>
);

type TimelineItem = {
  id: string;
  channel: 'email' | 'telegram' | 'activity';
  direction: 'incoming' | 'outgoing' | 'internal';
  timestamp: string;
  body: string;
  sender: string;
  subject?: string | null;
};
type TimelinePayload = { history?: TimelineItem[]; participants?: Array<{ id: string; name: string; email?: string | null }> };
type LiveDoc = { id: string; name: string; kind?: string; createdAt?: string | number };

const DealDetail: React.FC<{ deal: Deal; onBack: () => void }> = ({ deal, onBack }) => {
  const {
    clients, payments, documents, tasks, updateDealStage, setSelectedClientId, setSelectedDealId,
    setCurrentTab, setIsCreateInvoiceOpen, openCreateTaskWithPreset,
  } = useCrm();
  const client = clients.find(c => c.id === deal.clientId);
  const [timeline, setTimeline] = useState<TimelinePayload>({});
  const [liveDocs, setLiveDocs] = useState<LiveDoc[]>([]);
  const [loadingTimeline, setLoadingTimeline] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoadingTimeline(true);
    Promise.all([
      fetch(`/api/contacts/${encodeURIComponent(deal.clientId)}/timeline`, { cache: 'no-store' }).then(r => r.ok ? r.json() : ({ history: [] })).catch(() => ({ history: [] })),
      fetch(`/api/contacts/${encodeURIComponent(deal.clientId)}/documents`, { cache: 'no-store' }).then(r => r.ok ? r.json() : ({ documents: [] })).catch(() => ({ documents: [] })),
    ]).then(([history, docs]) => {
      if (cancelled) return;
      setTimeline(history || {});
      setLiveDocs(Array.isArray(docs?.documents) ? docs.documents : []);
    }).finally(() => !cancelled && setLoadingTimeline(false));
    return () => { cancelled = true; };
  }, [deal.id, deal.clientId]);

  const paid = payments.filter(p => p.dealId === deal.id && p.direction === 'inflow' && p.status === 'completed').reduce((sum, p) => sum + p.amount, 0);
  const dealTasks = tasks.filter(t => t.dealId === deal.id || (!t.dealId && t.clientId === deal.clientId));
  const openTasks = dealTasks.filter(t => !t.completed).sort((a, b) => (dateMs(a.deadline) || Infinity) - (dateMs(b.deadline) || Infinity));
  const nextTask = openTasks[0];
  const contextDocs = documents.filter(d => d.dealId === deal.id);
  const docs = liveDocs.length ? liveDocs : contextDocs.map(d => ({ id: d.id, name: `${d.number} · ${d.title}`, kind: d.type, createdAt: d.createdAt }));
  const realMessages = (timeline.history || []).filter(item => (item.channel === 'email' || item.channel === 'telegram') && dateMs(item.timestamp));
  const activities = (timeline.history || []).filter(item => item.channel === 'activity' && dateMs(item.timestamp)).slice(-4);
  const latestChannel = [...realMessages].reverse()[0]?.channel;

  const openClientCard = () => {
    setSelectedDealId(null);
    setSelectedClientId(deal.clientId);
    setCurrentTab('client_cockpit');
  };
  const openChats = () => {
    setSelectedClientId(deal.clientId);
    setCurrentTab('inbox');
  };

  return <div className="relative min-h-[1000px] w-[1330px] bg-[#f7f5f2] px-[42px] py-[24px] text-[#1f1d1c]">
    <div className="flex items-center justify-between">
      <button onClick={onBack} className="flex h-[38px] items-center gap-2 rounded-[10px] border border-[#e7e1db] bg-white px-3 text-[11px] font-medium text-[#4e4945]"><ArrowLeft size={13}/>Все сделки</button>
      <ThemePill/>
    </div>

    <div className="mt-[10px] flex items-end justify-between">
      <div className="min-w-0">
        <h1 className="truncate text-[32px] font-semibold tracking-[-.03em]">{client?.company || client?.name || deal.clientName} — {deal.title}</h1>
        <div className="mt-1 text-[11px] text-[#817a74]">Сделка #{deal.id.slice(0, 8)} · обновлено {relativeDate(deal.updatedAt).toLowerCase()}</div>
      </div>
      <div className="ml-5 flex shrink-0 items-center gap-3">
        <select value={deal.stage} onChange={e => updateDealStage(deal.id, e.target.value as DealStage)} className="h-[40px] rounded-[10px] border border-[#e4ddd6] bg-white px-3 text-[11px] font-medium outline-none">
          {Object.entries(stageMeta).filter(([id]) => id !== 'closed_lost').map(([id, meta]) => <option key={id} value={id}>{meta.label}</option>)}
        </select>
        <button onClick={() => setIsCreateInvoiceOpen(true)} className="h-[40px] rounded-[10px] bg-[#f3e2d0] px-4 text-[11px] font-medium text-[#4b4037]">Создать КП</button>
      </div>
    </div>

    <div className="mt-[28px] grid grid-cols-4 gap-[20px]">
      <Card className="relative h-[104px] p-[18px] pl-[82px]"><span className="absolute left-[18px] top-[20px] grid h-12 w-12 place-items-center rounded-[14px] bg-[#dcebfa]"><Wallet size={17}/></span><div className="text-[10px] text-[#7b746e]">Расчёт / КП</div><b className="mt-2 block truncate text-[18px]">{deal.amount ? money(deal.amount) : '—'}</b><div className="mt-1 truncate text-[9px] text-[#8a837d]">оплачено: {money(paid)}</div></Card>
      <Card className="relative h-[104px] p-[18px] pl-[82px]"><span className="absolute left-[18px] top-[20px] grid h-12 w-12 place-items-center rounded-[14px] bg-[#e9ddf8]">◈</span><div className="text-[10px] text-[#7b746e]">Этап</div><b className="mt-2 block truncate text-[18px]">{stageMeta[deal.stage].label}</b><div className="mt-1 truncate text-[9px] text-[#8a837d]">текущий статус сделки</div></Card>
      <Card className="relative h-[104px] p-[18px] pl-[82px]"><span className="absolute left-[18px] top-[20px] grid h-12 w-12 place-items-center rounded-[14px] bg-[#f6dde1]">→</span><div className="text-[10px] text-[#7b746e]">Следующий шаг</div><b className="mt-2 block truncate text-[18px]">{nextTask?.title || 'Не назначен'}</b><div className="mt-1 truncate text-[9px] text-[#8a837d]">{nextTask ? relativeDate(nextTask.deadline) : 'добавьте задачу'}</div></Card>
      <Card className="relative h-[104px] p-[18px] pl-[82px]"><span className="absolute left-[18px] top-[20px] grid h-12 w-12 place-items-center rounded-[14px] bg-[#e2efe7]">С</span><div className="text-[10px] text-[#7b746e]">Ответственный</div><b className="mt-2 block truncate text-[18px]">{deal.assignedManager || 'Светлана'}</b><div className="mt-1 truncate text-[9px] text-[#8a837d]">владелец сделки</div></Card>
    </div>

    <div className="mt-[20px] grid grid-cols-[760px_465px] gap-[20px]">
      <div>
        <div className="grid grid-cols-2 gap-[20px]">
          <Card className="h-[300px] p-[22px]">
            <h2 className="text-[18px] font-semibold">Детали сделки</h2>
            <div className="mt-4 divide-y divide-[#f0ece8] text-[11px]">
              {[
                ['Клиент', client?.company || client?.name || deal.clientName],
                ['Контакт', [client?.name, client?.phone].filter(Boolean).join(' · ') || '—'],
                ['Сделка', deal.title],
                ['Срок', deal.deadline ? shortDate(deal.deadline) : 'Не назначен'],
                ['Оплачено', money(paid)],
                ['Источник', client?.source || '—'],
              ].map(([label, value]) => <div key={label} className="grid min-h-[38px] grid-cols-[98px_1fr] items-center"><span className="text-[#928b85]">{label}</span><b className="truncate font-medium text-[#37322f]">{value}</b></div>)}
            </div>
            <button onClick={openClientCard} className="mt-3 text-[10px] font-medium text-[#665d57] underline underline-offset-4">Карточка и переписка</button>
          </Card>

          <Card className="h-[300px] p-[22px]">
            <div className="flex items-center justify-between"><h2 className="text-[18px] font-semibold">Данные клиента</h2><button onClick={openClientCard} className="rounded-[10px] bg-[#faf8f5] px-3 py-2 text-[9px]">Открыть</button></div>
            <div className="mt-4 divide-y divide-[#f0ece8] text-[11px]">
              {[
                ['Организация', client?.company || '—'], ['Имя', client?.name || '—'], ['Телефон', client?.phone || '—'],
                ['Email', client?.email || '—'], ['Источник', client?.source || '—'], ['Статус', client?.status || '—'],
              ].map(([label, value]) => <div key={label} className="grid min-h-[38px] grid-cols-[118px_1fr] items-center"><span className="text-[#827a74]">{label}</span><b className="truncate font-medium text-[#302c29]">{value}</b></div>)}
            </div>
          </Card>
        </div>

        <Card className="mt-[18px] h-[144px] p-[22px]">
          <h2 className="text-[18px] font-semibold">История сделки</h2>
          <div className="mt-4 grid grid-cols-4 gap-3">
            <div><span className="block h-3 w-3 rounded-full bg-[#dcebfa]"/><b className="mt-2 block truncate text-[10px]">Сделка создана</b><span className="mt-1 block text-[8px] text-[#8a837d]">{dateTime(deal.createdAt)}</span></div>
            {activities.length ? activities.map(item => <div key={item.id}><span className="block h-3 w-3 rounded-full bg-[#e9ddf8]"/><b className="mt-2 block truncate text-[10px]">{item.body || 'Событие CRM'}</b><span className="mt-1 block text-[8px] text-[#8a837d]">{dateTime(item.timestamp)}</span></div>).slice(-3) : <>
              <div><span className="block h-3 w-3 rounded-full bg-[#f8e5d2]"/><b className="mt-2 block truncate text-[10px]">{stageMeta[deal.stage].label}</b><span className="mt-1 block text-[8px] text-[#8a837d]">{dateTime(deal.updatedAt)}</span></div>
              <div><span className="block h-3 w-3 rounded-full bg-[#f5d4da]"/><b className="mt-2 block truncate text-[10px]">Следующий шаг</b><span className="mt-1 block text-[8px] text-[#8a837d]">{nextTask ? relativeDate(nextTask.deadline) : 'не назначен'}</span></div>
            </>}
          </div>
        </Card>

        <Card className="mt-[18px] h-[194px] p-[22px]">
          <div className="grid h-full grid-cols-[1.4fr_1fr] gap-7">
            <div className="min-w-0"><div className="flex items-center justify-between"><h2 className="text-[17px] font-semibold">Вложенные документы</h2><button onClick={() => setIsCreateInvoiceOpen(true)} className="rounded-[9px] bg-[#f3eee9] px-3 py-1.5 text-[9px]">+ Добавить</button></div><div className="mt-3 space-y-2">{docs.slice(0,3).map(doc => <div key={doc.id} className="flex h-9 items-center rounded-[10px] bg-[#fbfaf8] px-3 text-[10px]"><FileText size={13} className="mr-3 text-[#786f68]"/><span className="min-w-0 flex-1 truncate">{doc.name}</span><span className="ml-2 text-[8px] text-[#958d86]">{doc.kind || 'Файл'}</span></div>)}{!docs.length && <div className="py-8 text-center text-[10px] text-[#918a84]">Документов нет</div>}</div></div>
            <div className="min-w-0"><div className="flex items-center justify-between"><h2 className="text-[17px] font-semibold">Задачи</h2><button onClick={() => openCreateTaskWithPreset({ clientId: deal.clientId, clientName: deal.clientName, dealId: deal.id, dealTitle: deal.title } as Partial<Task>)} className="text-[9px] text-[#817a74]">+ Задача</button></div><div className="mt-3 space-y-2">{openTasks.slice(0,3).map(task => <div key={task.id} className="flex h-11 items-center rounded-[10px] bg-[#fbfaf8] px-3 text-[9px]"><CheckCircle2 size={13} className="mr-3 text-[#aaa39d]"/><span className="min-w-0 flex-1"><b className="block truncate">{task.title}</b><span className="text-[#958d86]">{relativeDate(task.deadline)}</span></span></div>)}{!openTasks.length && <div className="py-8 text-center text-[10px] text-[#918a84]">Открытых задач нет</div>}</div></div>
          </div>
        </Card>
      </div>

      <Card className="h-[674px] overflow-hidden">
        <div className="flex h-[76px] items-center border-b border-[#eee9e4] px-[22px]">
          <div className="grid h-[42px] w-[42px] place-items-center rounded-full bg-[#f0d6c8] text-[13px] font-medium">{(client?.company || client?.name || 'К').slice(0,1).toUpperCase()}</div>
          <div className="ml-3 min-w-0"><b className="block truncate text-[15px]">{client?.company || client?.name || deal.clientName}</b><span className="mt-1 block truncate text-[10px] text-[#7f9b8a]">{client?.name || 'Клиент'} · {client?.email || client?.phone || 'контакт'}</span></div>
          <span className="ml-auto rounded-[10px] bg-[#eef6f0] px-3 py-2 text-[10px] text-[#55705f]">{latestChannel === 'telegram' ? 'Telegram' : latestChannel === 'email' ? 'Email' : 'Переписка'}</span>
        </div>
        <div className="h-[498px] overflow-y-auto px-[22px] py-4">
          {loadingTimeline ? <div className="grid h-full place-items-center text-[10px] text-[#817a74]">Загружаю переписку…</div> : realMessages.length ? realMessages.slice(-12).map(msg => <div key={msg.id} className={`mb-3 flex ${msg.direction === 'outgoing' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[82%] rounded-[14px] px-4 py-3 ${msg.direction === 'outgoing' ? 'bg-[#e8f0fa]' : 'bg-[#f6f3f0]'}`}>
              <div className="whitespace-pre-wrap break-words text-[11px] leading-[17px] text-[#3a3532]">{msg.body}</div>
              <div className="mt-2 text-right text-[8px] text-[#98908a]">{msg.channel === 'email' ? <Mail size={9} className="mr-1 inline"/> : <MessageCircle size={9} className="mr-1 inline"/>}{dateTime(msg.timestamp)}</div>
            </div>
          </div>) : <div className="grid h-full place-items-center px-10 text-center text-[10px] leading-5 text-[#817a74]">По этому клиенту реальная Email/Telegram переписка пока не найдена.</div>}
        </div>
        <div className="border-t border-[#eee9e4] px-[18px] py-[18px]">
          <button onClick={openChats} className="flex h-[40px] w-full items-center justify-center rounded-[11px] bg-[#2a292b] text-[11px] font-medium text-white"><Send size={13} className="mr-2"/>Открыть диалог и написать</button>
          <div className="mt-2 text-center text-[8px] text-[#a49c95]">Переписка сохраняется в карточке сделки</div>
        </div>
      </Card>
    </div>
  </div>;
};

export const LiveDealsView: React.FC = () => {
  const {
    deals, payments, tasks, selectedDealId, setSelectedDealId, setIsCreateDealOpen, setSelectedClientId,
    setCurrentTab, setIsCreateInvoiceOpen, openCreateTaskWithPreset,
  } = useCrm();
  const [query, setQuery] = useState('');
  const [stageFilter, setStageFilter] = useState<'all' | 'active' | 'closed'>('all');

  const paidByDeal = useMemo(() => {
    const map = new Map<string, number>();
    for (const payment of payments) {
      if (payment.direction !== 'inflow' || payment.status !== 'completed') continue;
      map.set(payment.dealId, (map.get(payment.dealId) || 0) + payment.amount);
    }
    return map;
  }, [payments]);
  const active = useMemo(() => deals.filter(d => activeStage(d.stage)), [deals]);
  const awaiting = useMemo(() => deals.filter(d => d.stage === 'prepayment'), [deals]);
  const paidActive = useMemo(() => active.reduce((sum, d) => sum + (paidByDeal.get(d.id) || 0), 0), [active, paidByDeal]);
  const paidDeals = useMemo(() => deals.filter(d => (paidByDeal.get(d.id) || 0) > 0), [deals, paidByDeal]);
  const avgPaid = paidDeals.length ? paidDeals.reduce((s, d) => s + (paidByDeal.get(d.id) || 0), 0) / paidDeals.length : 0;

  const shown = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return deals.filter(d => {
      if (stageFilter === 'active' && !activeStage(d.stage)) return false;
      if (stageFilter === 'closed' && activeStage(d.stage)) return false;
      return !needle || `${d.clientName} ${d.title}`.toLowerCase().includes(needle);
    });
  }, [deals, query, stageFilter]);

  const attention = useMemo(() => {
    const open = tasks.filter(t => !t.completed).map(t => ({ id: `task:${t.id}`, clientId: t.clientId || '', title: t.clientName || t.dealTitle || 'Клиент', text: t.title, when: relativeDate(t.deadline), ms: dateMs(t.deadline) || Infinity }));
    for (const d of awaiting) open.push({ id: `payment:${d.id}`, clientId: d.clientId, title: d.clientName, text: 'Ожидается подтверждение оплаты', when: d.deadline ? relativeDate(d.deadline) : 'Без срока', ms: dateMs(d.deadline) || Infinity });
    return open.sort((a, b) => a.ms - b.ms).slice(0, 4);
  }, [tasks, awaiting]);

  const openClientCard = (clientId: string) => { setSelectedDealId(null); setSelectedClientId(clientId); setCurrentTab('client_cockpit'); };
  const selected = selectedDealId ? deals.find(d => d.id === selectedDealId) : undefined;
  if (selected) return <DealDetail deal={selected} onBack={() => setSelectedDealId(null)}/>;

  return <div className="relative min-h-[1000px] w-[1330px] bg-[#f7f5f2] px-[42px] py-[28px] text-[#1f1d1c]">
    <div className="flex h-[42px] items-start justify-between">
      <div className="flex items-baseline gap-4"><h1 className="text-[34px] font-semibold leading-none tracking-[-.035em]">Сделки</h1><span className="text-[13px] text-[#68625d]">{deals.length} всего · {active.length} активных</span></div>
      <ThemePill/>
    </div>

    <div className="mt-[16px] flex h-[46px] items-center gap-[12px]">
      <label className="flex h-[46px] w-[390px] items-center rounded-[14px] border border-[#e9e5e0] bg-white px-5"><Search size={13} className="mr-3 text-[#948c86]"/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Поиск по клиенту или сделке..." className="min-w-0 flex-1 bg-transparent text-[11px] outline-none placeholder:text-[#948c86]"/></label>
      <div className="relative"><Filter size={13} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2"/><select value={stageFilter} onChange={e => setStageFilter(e.target.value as typeof stageFilter)} className="h-[46px] w-[126px] appearance-none rounded-[14px] border border-[#e9e5e0] bg-white pl-10 pr-3 text-[11px] font-medium outline-none"><option value="all">Все</option><option value="active">Активные</option><option value="closed">Закрытые</option></select></div>
      <button onClick={() => setIsCreateDealOpen(true)} className="ml-auto flex h-[46px] w-[205px] items-center justify-center rounded-[14px] bg-[#2a292b] text-[12px] font-medium text-white"><Plus size={14} className="mr-2"/>Новая сделка</button>
    </div>

    <div className="mt-[18px] grid grid-cols-4 gap-[25px]">
      {[
        [deals.length, 'Все сделки', '#dcebfa'], [active.length, 'В работе', '#f8e5d2'], [awaiting.length, 'Ожидают оплаты', '#f5d4da'], [compactMoney(paidActive), 'Оплачено по активным', '#e5defa'],
      ].map(([value, label, tone]) => <Card key={String(label)} className="relative h-[92px]"><span className="absolute left-[17px] top-[17px] h-12 w-12 rounded-[14px]" style={{ background: String(tone) }}/><b className="absolute left-[81px] top-[17px] max-w-[165px] truncate text-[21px] font-medium">{value}</b><span className="absolute left-[81px] top-[49px] text-[11px] text-[#736c66]">{label}</span></Card>)}
    </div>

    <div className="mt-[16px] grid grid-cols-[872px_355px] gap-[18px]">
      <Card className="min-h-[694px] overflow-hidden p-[20px]">
        <div className="flex items-center justify-between"><h2 className="text-[18px] font-semibold">Все сделки</h2><span className="text-[9px] text-[#8a837d]">Только данные CRM</span></div>
        <div className="mt-[14px] flex items-center gap-2">
          {(['all','active','closed'] as const).map(id => <button key={id} onClick={() => setStageFilter(id)} className={`h-[28px] rounded-[14px] px-3 text-[10px] font-medium ${stageFilter === id ? 'bg-[#ece7e2] text-[#3d3835]' : 'bg-[#f5f3f0] text-[#68615c]'}`}>{id === 'all' ? `Все ${deals.length}` : id === 'active' ? `Активные ${active.length}` : `Закрытые ${deals.length - active.length}`}</button>)}
        </div>
        <div className="mt-[18px] grid h-[42px] grid-cols-[168px_202px_150px_110px_132px_70px] items-center rounded-[10px] bg-[#faf9f7] px-3 text-[9px] font-medium text-[#938b84]"><span>Клиент</span><span>Сделка</span><span>Этап</span><span>Оплачено</span><span>Следующий шаг</span><span>Детали</span></div>
        <div>
          {shown.slice(0, 8).map((d, index) => {
            const next = tasks.filter(t => !t.completed && (t.dealId === d.id || (!t.dealId && t.clientId === d.clientId))).sort((a,b)=>(dateMs(a.deadline)||Infinity)-(dateMs(b.deadline)||Infinity))[0];
            return <div key={d.id} className={`grid min-h-[66px] grid-cols-[168px_202px_150px_110px_132px_70px] items-center px-3 text-[10px] ${index % 2 ? 'rounded-[10px] bg-[#fcfbf9]' : ''}`}>
              <button onClick={() => openClientCard(d.clientId)} className="min-w-0 text-left"><b className="block truncate text-[11px]">{d.clientName}</b><span className="mt-1 block text-[8px] text-[#958d86]">{relativeDate(d.updatedAt)}</span></button>
              <button onClick={() => setSelectedDealId(d.id)} className="truncate pr-3 text-left text-[10px] text-[#4b4642]">{d.title}</button>
              <StageBadge stage={d.stage}/>
              <b className="truncate text-[10px]">{money(paidByDeal.get(d.id) || 0)}</b>
              <div className="min-w-0 pr-2"><span className="block truncate text-[9px]">{next?.title || '—'}</span><span className="mt-1 block text-[8px] text-[#938b84]">{next ? relativeDate(next.deadline) : ''}</span></div>
              <button onClick={() => setSelectedDealId(d.id)} className="h-[30px] rounded-[10px] border border-[#e6ded7] bg-[#f5f1ed] text-[9px] font-medium">Подробнее</button>
            </div>;
          })}
          {!shown.length && <div className="grid h-40 place-items-center text-[11px] text-[#918a84]">Сделок по этому фильтру нет</div>}
        </div>
        <div className="mt-4 text-[9px] text-[#8b847e]">Показано {Math.min(8, shown.length)} из {shown.length}</div>
      </Card>

      <div className="space-y-[18px]">
        <Card className="h-[218px] p-[19px]">
          <h2 className="text-[18px] font-semibold">Сводка по сделкам</h2>
          <b className="mt-3 block text-[25px]">{compactMoney(paidActive)}</b><div className="text-[10px] text-[#817a74]">получено по активным сделкам</div>
          <div className="mt-5 flex items-center text-[10px]"><span className="text-[#7a736d]">Средний подтверждённый платёж</span><b className="ml-auto">{money(avgPaid)}</b></div>
          <div className="mt-3 flex items-center text-[10px]"><span className="text-[#7a736d]">Сделок с оплатой</span><b className="ml-auto">{paidDeals.length}</b></div>
          <div className="mt-5 flex h-2 gap-1">{(['#8eb4df','#d7b188','#c78a98','#a497cd','#8aaf96'] as const).map((c,i)=><i key={c} className="flex-1 rounded-full" style={{background:c, opacity: i < Math.max(1, Math.min(5, paidDeals.length)) ? 1 : .25}}/>)}</div>
        </Card>

        <Card className="h-[278px] p-[19px]">
          <div className="flex items-center justify-between"><h2 className="text-[18px] font-semibold">Требуют внимания</h2><span className="rounded-full bg-[#f7e1e4] px-3 py-1 text-[9px] text-[#9a5c67]">{attention.length} дела</span></div>
          <div className="mt-4 space-y-[6px]">{attention.length ? attention.map((item,i)=><button key={item.id} onClick={()=>item.clientId&&openClientCard(item.clientId)} className="flex h-[46px] w-full items-center rounded-[12px] bg-[#fbfaf8] px-3 text-left"><i className="mr-3 h-4 w-4 rounded-full" style={{background:['#f5d4da','#f8e5d2','#dcebfa','#d9eadd'][i%4]}}/><span className="min-w-0 flex-1"><b className="block truncate text-[10px]">{item.title}</b><span className="mt-1 block truncate text-[8px] text-[#7f7872]">{item.text}</span></span><span className="ml-2 text-[8px] text-[#a05d69]">{item.when}</span></button>) : <div className="grid h-[190px] place-items-center text-[10px] text-[#817a74]">Срочных действий нет</div>}</div>
        </Card>

        <Card className="h-[162px] p-[19px]">
          <h2 className="text-[18px] font-semibold">Быстрые действия</h2>
          <div className="mt-4 grid grid-cols-3 gap-[10px]">
            <button onClick={()=>setIsCreateInvoiceOpen(true)} className="grid h-[70px] place-items-center rounded-[14px] bg-[#f3e2d0] text-[9px]"><FileText size={15}/><span>Создать КП</span></button>
            <button onClick={()=>setIsCreateInvoiceOpen(true)} className="grid h-[70px] place-items-center rounded-[14px] bg-[#dcebfa] text-[9px]"><Wallet size={15}/><span>Выставить счёт</span></button>
            <button onClick={()=>openCreateTaskWithPreset({} as Partial<Task>)} className="grid h-[70px] place-items-center rounded-[14px] bg-[#e5defa] text-[9px]"><CheckCircle2 size={15}/><span>Добавить задачу</span></button>
          </div>
        </Card>
      </div>
    </div>
  </div>;
};
