import React, { useMemo, useState } from 'react';
import { ArrowLeft, Filter, Moon, Plus, Search, Sun } from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import type { Deal, DealStage } from '../../types/crm';

const money = (value = 0) => `${new Intl.NumberFormat('ru-RU').format(Math.round(value))} ₽`;
const compactMoney = (value = 0) => value >= 1_000_000
  ? `${(value / 1_000_000).toLocaleString('ru-RU', { maximumFractionDigits: 2 })} млн ₽`
  : money(value);

const stageMeta: Record<DealStage, { label: string; bg: string }> = {
  lead: { label: 'Новая заявка', bg: '#e5defa' },
  contacted: { label: 'В работе', bg: '#dcebfa' },
  calculation: { label: 'Расчёт', bg: '#f8e5d2' },
  proposal_sent: { label: 'КП отправлено', bg: '#e8ddf7' },
  negotiation: { label: 'На согласовании', bg: '#f8e5d2' },
  prepayment: { label: 'Ожидает оплаты', bg: '#f5d4da' },
  production: { label: 'Производство', bg: '#d9eadd' },
  ready: { label: 'Готово', bg: '#d9eadd' },
  shipped: { label: 'Доставка', bg: '#dcebfa' },
  closed_won: { label: 'Закрыто', bg: '#e8e3de' },
  closed_lost: { label: 'Отказ', bg: '#f4dde2' },
};

const activeStage = (stage: DealStage) => stage !== 'closed_won' && stage !== 'closed_lost';
const dateLabel = (value?: string) => {
  if (!value) return '—';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '—' : new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' }).format(d).replace('.', '');
};

const Metric: React.FC<{ value: React.ReactNode; label: string; tone: string }> = ({ value, label, tone }) => (
  <div className="flex min-h-[98px] items-center rounded-[18px] border border-[#e8e3de] bg-white px-4 py-4">
    <div className="h-12 w-12 shrink-0 rounded-[13px]" style={{ background: tone }} />
    <div className="ml-4 min-w-0">
      <div className="truncate text-[22px] font-semibold tracking-[-.02em]">{value}</div>
      <div className="mt-1.5 text-[11px] text-[#817a74]">{label}</div>
    </div>
  </div>
);

const ThemePill: React.FC = () => {
  const { theme, toggleTheme } = useCrm();
  return <button onClick={toggleTheme} className="flex h-11 w-[116px] items-center justify-around rounded-[22px] border border-[#ece7e1] bg-white text-[#1f1d1c]">
    <Sun size={17}/><Moon size={16} className={theme === 'dark' ? 'text-[#1f1d1c]' : 'text-[#aaa39d]'}/>
  </button>;
};

const DealDetail: React.FC<{ deal: Deal; onBack: () => void }> = ({ deal, onBack }) => {
  const { clients, payments, documents, updateDealStage } = useCrm();
  const client = clients.find(c => c.id === deal.clientId);
  const paid = payments.filter(p => p.dealId === deal.id && p.direction === 'inflow' && p.status === 'completed').reduce((sum, p) => sum + p.amount, 0);
  const costs = payments.filter(p => p.dealId === deal.id && p.direction === 'outflow' && p.status === 'completed').reduce((sum, p) => sum + p.amount, 0);
  const docs = documents.filter(d => d.dealId === deal.id);

  return <div className="min-h-full bg-[#f7f5f2] px-7 py-7 text-[#1f1d1c] lg:px-10">
    <div className="mx-auto max-w-[1500px]">
      <button onClick={onBack} className="flex items-center gap-2 text-[12px] text-[#817a74]"><ArrowLeft size={15}/>Все сделки</button>
      <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(300px,1fr)]">
        <section className="rounded-[18px] border border-[#e8e3de] bg-white p-6">
          <h1 className="text-[28px] font-semibold tracking-[-.03em]">{deal.title}</h1>
          <div className="mt-1 text-[12px] text-[#817a74]">{deal.clientName}</div>
          <div className="mt-5 flex flex-wrap gap-2">
            {Object.entries(stageMeta).map(([id, meta]) => <button key={id} onClick={() => updateDealStage(deal.id, id as DealStage)} className={`rounded-full px-3 py-2 text-[10px] ${deal.stage === id ? 'ring-2 ring-[#2a292b]/20' : ''}`} style={{ background: meta.bg }}>{meta.label}</button>)}
          </div>
          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            <Metric value={money(deal.amount)} label="Сумма сделки" tone="#f8e5d2"/>
            <Metric value={money(paid)} label="Получено" tone="#ddefe4"/>
            <Metric value={money(costs || deal.primeCost)} label="Расходы" tone="#f7dde4"/>
          </div>
          <div className="mt-6 grid gap-4 text-[11px] sm:grid-cols-2">
            <div><span className="text-[#817a74]">Срок</span><b className="mt-1 block">{dateLabel(deal.deadline)}</b></div>
            <div><span className="text-[#817a74]">Ответственный</span><b className="mt-1 block">{deal.assignedManager || '—'}</b></div>
          </div>
        </section>
        <div className="space-y-5">
          <section className="rounded-[18px] border border-[#e8e3de] bg-white p-5">
            <h2 className="text-[18px] font-semibold">Клиент</h2>
            <div className="mt-4 text-[11px] leading-7"><b>{client?.company || client?.name || deal.clientName}</b><br/>{client?.phone || 'Телефон не указан'}<br/>{client?.email || 'Email не указан'}</div>
          </section>
          <section className="rounded-[18px] border border-[#e8e3de] bg-white p-5">
            <h2 className="text-[18px] font-semibold">Документы</h2>
            {docs.length ? docs.map(d => <div key={d.id} className="mt-3 flex justify-between gap-3 rounded-[10px] bg-[#fbfaf8] px-3 py-3 text-[10px]"><span className="truncate">{d.number} · {d.title}</span><b className="shrink-0">{money(d.amount)}</b></div>) : <div className="py-8 text-center text-[11px] text-[#918a84]">Документов по сделке пока нет</div>}
          </section>
        </div>
      </div>
    </div>
  </div>;
};

export const LiveDealsView: React.FC = () => {
  const { deals, selectedDealId, setSelectedDealId, setIsCreateDealOpen } = useCrm();
  const [query, setQuery] = useState('');
  const [stageFilter, setStageFilter] = useState<'all' | 'active' | 'closed'>('all');

  const active = useMemo(() => deals.filter(d => activeStage(d.stage)), [deals]);
  const awaiting = useMemo(() => deals.filter(d => d.stage === 'prepayment'), [deals]);
  const work = useMemo(() => active.reduce((sum, d) => sum + d.amount, 0), [active]);

  const shown = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return deals.filter(d => {
      if (stageFilter === 'active' && !activeStage(d.stage)) return false;
      if (stageFilter === 'closed' && activeStage(d.stage)) return false;
      return !needle || `${d.clientName} ${d.title}`.toLowerCase().includes(needle);
    });
  }, [deals, query, stageFilter]);

  const selected = selectedDealId ? deals.find(d => d.id === selectedDealId) : undefined;
  if (selected) return <DealDetail deal={selected} onBack={() => setSelectedDealId(null)}/>;

  return <div className="min-h-full bg-[#f7f5f2] px-7 py-7 text-[#1f1d1c] lg:px-10">
    <div className="mx-auto w-full max-w-[1500px]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
          <h1 className="text-[34px] font-semibold leading-none tracking-[-.035em]">Сделки</h1>
          <span className="text-[13px] text-[#817a74]">{deals.length} всего · {active.length} активных</span>
        </div>
        <ThemePill/>
      </div>

      <div className="mt-7 flex flex-wrap gap-3">
        <div className="flex h-12 min-w-[260px] flex-1 items-center rounded-[13px] border border-[#e8e3de] bg-white px-4 md:max-w-[430px]">
          <Search size={14} className="mr-2 text-[#817a74]"/>
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Поиск по клиенту или сделке..." className="w-full bg-transparent text-[12px] outline-none"/>
        </div>
        <div className="relative">
          <Filter size={14} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2"/>
          <select value={stageFilter} onChange={e => setStageFilter(e.target.value as 'all' | 'active' | 'closed')} className="h-12 appearance-none rounded-[13px] border border-[#e8e3de] bg-white pl-10 pr-8 text-[12px] outline-none">
            <option value="all">Все</option><option value="active">В работе</option><option value="closed">Закрытые</option>
          </select>
        </div>
        <button onClick={() => setIsCreateDealOpen(true)} className="ml-auto flex h-12 items-center gap-2 rounded-[13px] bg-[#2a292b] px-6 text-[12px] font-medium text-white"><Plus size={15}/>Новая сделка</button>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric value={deals.length} label="Все сделки" tone="#dcebfa"/>
        <Metric value={active.length} label="В работе" tone="#f8e5d2"/>
        <Metric value={awaiting.length} label="Ожидают оплаты" tone="#f5d4da"/>
        <Metric value={compactMoney(work)} label="Сумма в работе" tone="#e5defa"/>
      </div>

      <section className="mt-5 overflow-hidden rounded-[18px] border border-[#e8e3de] bg-white">
        <div className="flex items-center justify-between px-5 py-4">
          <h2 className="text-[18px] font-semibold">Все сделки</h2>
          <span className="text-[10px] text-[#817a74]">Только подтверждённые сделки CRM</span>
        </div>
        <div className="overflow-x-auto">
          <div className="min-w-[900px]">
            <div className="grid grid-cols-[1.1fr_1.45fr_1fr_.8fr_1fr_88px] gap-3 bg-[#fbfaf8] px-5 py-3 text-[10px] text-[#817a74]"><span>Клиент</span><span>Сделка</span><span>Этап</span><span>Сумма</span><span>Срок</span><span/></div>
            {shown.length ? shown.map((d, index) => <div key={d.id} className={`grid min-h-[58px] grid-cols-[1.1fr_1.45fr_1fr_.8fr_1fr_88px] items-center gap-3 border-t border-[#f0ece7] px-5 py-2.5 text-[11px] ${index % 2 ? 'bg-[#fdfcfb]' : ''}`}>
              <b className="truncate">{d.clientName}</b>
              <span className="truncate">{d.title}</span>
              <span className="w-fit rounded-[10px] px-2.5 py-1.5 text-[10px]" style={{ background: stageMeta[d.stage].bg }}>{stageMeta[d.stage].label}</span>
              <b>{money(d.amount)}</b>
              <span className="text-[#6d6762]">{dateLabel(d.deadline)}</span>
              <button onClick={() => setSelectedDealId(d.id)} className="rounded-[9px] border border-[#e8e3de] bg-white px-2 py-1.5 text-[9px]">Подробнее</button>
            </div>) : <div className="grid h-40 place-items-center text-[12px] text-[#918a84]">Сделок по этому фильтру нет</div>}
          </div>
        </div>
      </section>
    </div>
  </div>;
};
