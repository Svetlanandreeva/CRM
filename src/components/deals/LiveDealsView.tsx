import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft, CalendarDays, CheckCircle2, FileText, Filter, MessageCircle, Plus,
  Search, UserRound, Wallet,
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import type { Deal, DealStage, Task } from '../../types/crm';

const money = (value = 0) => `${new Intl.NumberFormat('ru-RU').format(Math.round(value))} ₽`;
const compactMoney = (value = 0) => value >= 1_000_000
  ? `${(value / 1_000_000).toLocaleString('ru-RU', { maximumFractionDigits: 2 })} млн ₽`
  : money(value);

const stageMeta: Record<DealStage, { label: string; bg: string; dot: string }> = {
  lead: { label: 'Новый запрос', bg: '#e5defa', dot: '#a497cd' },
  contacted: { label: 'Связались', bg: '#dcebfa', dot: '#8eb4df' },
  calculation: { label: 'Расчёт', bg: '#f8e5d2', dot: '#d7b188' },
  proposal_sent: { label: 'КП / счёт отправлен', bg: '#e8ddf7', dot: '#a497cd' },
  negotiation: { label: 'Уточнение / согласование', bg: '#f8e5d2', dot: '#d7b188' },
  prepayment: { label: 'Ожидает оплаты', bg: '#f5d4da', dot: '#d98395' },
  production: { label: 'В производстве', bg: '#d9eadd', dot: '#7fa18f' },
  ready: { label: 'Готово', bg: '#d9eadd', dot: '#7fa18f' },
  shipped: { label: 'Доставка', bg: '#dcebfa', dot: '#7897bb' },
  closed_won: { label: 'Завершено', bg: '#e8e3de', dot: '#8c8782' },
  closed_lost: { label: 'Отказ / песочница', bg: '#f4dde2', dot: '#c98a98' },
};

const activeStage = (stage: DealStage) => !['closed_won', 'closed_lost'].includes(stage);
const validDate = (value?: string | null) => {
  if (!value) return 0;
  const d = new Date(value);
  const ms = d.getTime();
  return Number.isNaN(ms) || d.getFullYear() < 2000 || d.getFullYear() > 2100 ? 0 : ms;
};
const shortDate = (value?: string | null) => validDate(value)
  ? new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value!)).replace('.', '')
  : '—';
const dateTime = (value?: string | null) => validDate(value)
  ? new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value!)).replace('.', '')
  : '—';
const relativeDate = (value?: string | null) => {
  const ms = validDate(value);
  if (!ms) return 'Без срока';
  const target = new Date(ms); const now = new Date();
  const a = new Date(target.getFullYear(), target.getMonth(), target.getDate()).getTime();
  const b = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const days = Math.round((a - b) / 86400000);
  if (days < 0) return `Просрочено на ${Math.abs(days)} дн.`;
  if (days === 0) return 'Сегодня';
  if (days === 1) return 'Завтра';
  return shortDate(value);
};

const Card: React.FC<React.PropsWithChildren<{ className?: string }>> = ({ children, className = '' }) => (
  <section className={`rounded-[18px] border border-[#e7e2dc] bg-white shadow-[0_1px_0_rgba(35,30,27,.02)] ${className}`}>{children}</section>
);

const StageBadge: React.FC<{ stage: DealStage }> = ({ stage }) => (
  <span className="inline-flex h-[28px] max-w-[170px] items-center rounded-[14px] px-3 text-[10px] font-medium text-[#4d4743]" style={{ background: stageMeta[stage].bg }}>
    <i className="mr-2 h-2 w-2 shrink-0 rounded-full" style={{ background: stageMeta[stage].dot }}/>
    <span className="truncate">{stageMeta[stage].label}</span>
  </span>
);

const Field: React.FC<React.PropsWithChildren<{ label: string; hint?: string }>> = ({ label, hint, children }) => <label className="block">
  <span className="mb-1.5 flex items-center justify-between text-[10px] font-medium text-[#746d67]"><span>{label}</span>{hint && <span className="font-normal text-[#a39b94]">{hint}</span>}</span>
  {children}
</label>;

const inputClass = 'h-[42px] w-full rounded-[11px] border border-[#e5dfd9] bg-[#fbfaf8] px-3 text-[12px] font-medium text-[#302c29] outline-none transition focus:border-[#b8aaa0] focus:bg-white';

const DealDetail: React.FC<{ deal: Deal; onBack: () => void }> = ({ deal, onBack }) => {
  const {
    clients, payments, documents, tasks, managers, updateDealStage, updateDeal, setDealPayment,
    setSelectedClientId, setSelectedDealId, setCurrentTab, setIsCreateInvoiceOpen, openCreateTaskWithPreset,
  } = useCrm();
  const client = clients.find(c => c.id === deal.clientId);
  const paid = payments.filter(p => p.dealId === deal.id && p.direction === 'inflow' && p.status === 'completed').reduce((sum, p) => sum + p.amount, 0);
  const payment = payments.find(p => p.dealId === deal.id && p.direction === 'inflow' && p.status === 'completed');
  const dealTasks = tasks.filter(t => t.dealId === deal.id || (!t.dealId && t.clientId === deal.clientId));
  const openTasks = dealTasks.filter(t => !t.completed).sort((a, b) => (validDate(a.deadline) || Infinity) - (validDate(b.deadline) || Infinity));
  const nextTask = openTasks[0];
  const docs = documents.filter(d => d.dealId === deal.id);

  const [amount, setAmount] = useState(String(deal.amount || ''));
  const [received, setReceived] = useState(String(paid || ''));
  const [paymentDate, setPaymentDate] = useState(deal.paymentDate || (payment?.date ? payment.date.slice(0,10) : ''));
  const [deadline, setDeadline] = useState(deal.deadline || '');
  const [saved, setSaved] = useState('');

  useEffect(() => {
    setAmount(String(deal.amount || ''));
    setReceived(String(paid || ''));
    setPaymentDate(deal.paymentDate || (payment?.date ? payment.date.slice(0,10) : ''));
    setDeadline(deal.deadline || '');
  }, [deal.id, deal.amount, deal.deadline, deal.paymentDate, paid, payment?.date]);

  const flash = (text: string) => { setSaved(text); window.setTimeout(() => setSaved(''), 2200); };
  const saveCommercial = () => {
    updateDeal(deal.id, { amount: Math.max(0, Number(amount) || 0), deadline });
    flash('Сумма и срок сохранены');
  };
  const savePayment = () => {
    const value = Math.max(0, Number(received) || 0);
    if (value > 0 && !paymentDate) { flash('Укажите дату получения денег'); return; }
    setDealPayment(deal.id, value, paymentDate || new Date().toISOString().slice(0,10));
    flash(value ? 'Оплата сохранена' : 'Оплата обнулена');
  };
  const openClient = () => { setSelectedDealId(null); setSelectedClientId(deal.clientId); setCurrentTab('client_cockpit'); };
  const openChat = () => { setSelectedClientId(deal.clientId); setCurrentTab('inbox'); };

  const history = [
    { key: 'created', title: 'Новый запрос', text: 'Первое обращение / сделка создана', date: deal.createdAt, tone: '#dcebfa' },
    ...docs.slice(0,2).map(d => ({ key: `doc_${d.id}`, title: d.type === 'invoice' ? 'Счёт выставлен' : d.type === 'proposal' ? 'КП подготовлено' : 'Документ', text: `${d.number} · ${d.title}`, date: d.sentAt || d.createdAt, tone: '#f8e5d2' })),
    ...(paid > 0 ? [{ key: 'payment', title: `Получено ${money(paid)}`, text: 'Дата оплаты — старт производства для календаря', date: paymentDate || payment?.date || '', tone: '#d9eadd' }] : []),
    { key: 'stage', title: stageMeta[deal.stage].label, text: deal.stage === 'production' ? 'Текущий этап производства' : 'Текущий этап сделки', date: deal.updatedAt, tone: stageMeta[deal.stage].bg },
  ].filter(item => validDate(item.date)).sort((a,b)=>validDate(a.date)-validDate(b.date));

  return <div className="min-h-[1000px] w-[1330px] bg-[#f7f5f2] px-[38px] py-[24px] text-[#1f1d1c]">
    <div className="flex items-center justify-between">
      <button onClick={onBack} className="flex h-[38px] items-center gap-2 rounded-[10px] border border-[#e7e1db] bg-white px-3 text-[11px] font-medium text-[#4e4945]"><ArrowLeft size={13}/>Все сделки</button>
      {saved && <div className="rounded-full bg-[#e7f0e9] px-4 py-2 text-[10px] font-medium text-[#56705e]">{saved}</div>}
    </div>

    <div className="mt-4 flex items-end justify-between gap-6">
      <div className="min-w-0">
        <div className="mb-2 flex items-center gap-2"><StageBadge stage={deal.stage}/><span className="text-[10px] text-[#8d857f]">создано {shortDate(deal.createdAt)}</span></div>
        <h1 className="truncate text-[29px] font-semibold tracking-[-.03em]">{deal.title}</h1>
        <button onClick={openClient} className="mt-1 text-[11px] text-[#716963] underline decoration-[#cfc6bf] underline-offset-4">{client?.company || client?.name || deal.clientName}</button>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <select value={deal.stage} onChange={e => updateDealStage(deal.id, e.target.value as DealStage)} className="h-[42px] rounded-[11px] border border-[#e4ddd6] bg-white px-3 text-[11px] font-medium outline-none">
          {Object.entries(stageMeta).map(([id, meta]) => <option key={id} value={id}>{meta.label}</option>)}
        </select>
        <button onClick={() => setIsCreateInvoiceOpen(true)} className="h-[42px] rounded-[11px] bg-[#f2e2d2] px-4 text-[11px] font-medium">КП / счёт</button>
        <button onClick={openChat} className="flex h-[42px] items-center gap-2 rounded-[11px] bg-[#2a292b] px-4 text-[11px] font-medium text-white"><MessageCircle size={13}/>Переписка</button>
      </div>
    </div>

    <div className="mt-5 grid grid-cols-4 gap-4">
      <Card className="p-4"><div className="text-[10px] text-[#7b746e]">Сумма заказа / выставлено</div><b className="mt-1.5 block text-[22px]">{money(deal.amount)}</b></Card>
      <Card className="p-4"><div className="text-[10px] text-[#7b746e]">Фактически получено</div><b className="mt-1.5 block text-[22px] text-[#55705f]">{money(paid)}</b></Card>
      <Card className="p-4"><div className="text-[10px] text-[#7b746e]">Дата получения денег</div><b className="mt-1.5 block text-[18px]">{shortDate(paymentDate || payment?.date)}</b></Card>
      <Card className="p-4"><div className="text-[10px] text-[#7b746e]">Сдать проект</div><b className="mt-1.5 block text-[18px]">{deal.deadline ? shortDate(deal.deadline) : 'Не назначено'}</b></Card>
    </div>

    <div className="mt-4 grid grid-cols-[1fr_390px] gap-4">
      <div className="space-y-4">
        <Card className="p-5">
          <div className="flex items-center justify-between"><div><h2 className="text-[17px] font-semibold">Коммерческие данные</h2><p className="mt-1 text-[9px] text-[#8a837d]">Сумма — это полный объём заказа / то, что выставлено клиенту.</p></div><Wallet size={17} className="text-[#9a918a]"/></div>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <Field label="Сумма заказа, ₽"><input type="number" min="0" value={amount} onChange={e=>setAmount(e.target.value)} className={inputClass}/></Field>
            <Field label="Дедлайн проекта"><input type="date" value={deadline} onChange={e=>setDeadline(e.target.value)} className={inputClass}/></Field>
          </div>
          <button onClick={saveCommercial} className="mt-4 h-[40px] rounded-[11px] bg-[#2a292b] px-5 text-[11px] font-medium text-white">Сохранить сумму и срок</button>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between"><div><h2 className="text-[17px] font-semibold">Оплата клиента</h2><p className="mt-1 text-[9px] text-[#8a837d]">Не дата обращения. Здесь фиксируется именно день, когда деньги реально поступили.</p></div><CalendarDays size={17} className="text-[#9a918a]"/></div>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <Field label="Получено, ₽"><input type="number" min="0" value={received} onChange={e=>setReceived(e.target.value)} className={inputClass}/></Field>
            <Field label="Дата получения"><input type="date" value={paymentDate} onChange={e=>setPaymentDate(e.target.value)} className={inputClass}/></Field>
          </div>
          <div className="mt-3 rounded-[11px] bg-[#f6f3ef] px-3 py-2.5 text-[9px] leading-4 text-[#706963]">Эта дата используется как начало производства в календаре, если сделка находится на этапе «В производстве» или «Готово».</div>
          <button onClick={savePayment} className="mt-4 h-[40px] rounded-[11px] bg-[#7fa18f] px-5 text-[11px] font-medium text-white">Сохранить оплату</button>
        </Card>

        <Card className="p-5">
          <h2 className="text-[17px] font-semibold">История движения</h2>
          <div className="mt-4 grid grid-cols-4 gap-3">
            {history.slice(-4).map(item => <div key={item.key} className="rounded-[13px] border border-[#eee9e4] bg-[#fbfaf8] p-3"><span className="block h-3 w-3 rounded-full" style={{background:item.tone}}/><b className="mt-2 block truncate text-[10px]">{item.title}</b><span className="mt-1 block min-h-[24px] text-[8px] leading-3 text-[#8a837d]">{item.text}</span><span className="mt-2 block text-[8px] font-medium text-[#625c57]">{dateTime(item.date)}</span></div>)}
          </div>
          {!history.length && <div className="py-8 text-center text-[10px] text-[#8a837d]">Пока нет подтверждённых событий.</div>}
        </Card>
      </div>

      <div className="space-y-4">
        <Card className="p-5">
          <div className="flex items-center gap-2"><UserRound size={16}/><h2 className="text-[17px] font-semibold">Ответственный</h2></div>
          <select value={deal.assignedManager || 'Светлана'} onChange={e=>updateDeal(deal.id,{assignedManager:e.target.value})} className={`${inputClass} mt-4`}>
            {managers.map(m=><option key={m.id} value={m.name}>{m.name} · {m.role}</option>)}
          </select>
          <div className="mt-3 rounded-[11px] bg-[#f7f3ee] p-3 text-[9px] leading-4 text-[#716963]">{deal.assignedManager === 'Светлана' ? 'Светлана ведёт сделку: 100% маржи остаётся владельцу.' : 'Сделку ведёт менеджер: 50% маржи — менеджеру, 50% — владельцу.'}</div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between"><h2 className="text-[17px] font-semibold">Следующий шаг</h2><button onClick={()=>openCreateTaskWithPreset({clientId:deal.clientId,clientName:deal.clientName,dealId:deal.id,dealTitle:deal.title} as Partial<Task>)} className="text-[10px] font-medium">+ задача</button></div>
          {nextTask ? <div className="mt-4 rounded-[13px] bg-[#fbfaf8] p-4"><b className="block text-[11px]">{nextTask.title}</b><span className={`mt-2 block text-[9px] ${relativeDate(nextTask.deadline).startsWith('Просрочено')?'text-[#b86673]':'text-[#817a74]'}`}>{relativeDate(nextTask.deadline)}</span></div> : <div className="py-8 text-center text-[10px] text-[#8a837d]">Следующий шаг не назначен</div>}
        </Card>

        <Card className="p-5">
          <h2 className="text-[17px] font-semibold">Клиент</h2>
          <div className="mt-4 space-y-3 text-[10px]"><div><span className="text-[#918983]">Компания</span><b className="block mt-0.5">{client?.company || '—'}</b></div><div><span className="text-[#918983]">Контакт</span><b className="block mt-0.5">{client?.name || deal.clientName}</b></div><div><span className="text-[#918983]">Телефон / Email</span><b className="block mt-0.5 break-all">{client?.phone || client?.email || '—'}</b></div></div>
          <button onClick={openClient} className="mt-4 h-[36px] w-full rounded-[10px] border border-[#e5dfd9] bg-[#fbfaf8] text-[10px] font-medium">Открыть карточку клиента</button>
        </Card>
      </div>
    </div>
  </div>;
};

type FilterMode = 'work' | 'completed' | 'sandbox';

export const LiveDealsView: React.FC = () => {
  const {
    deals, payments, tasks, selectedDealId, setSelectedDealId, setIsCreateDealOpen, setSelectedClientId,
    setCurrentTab,
  } = useCrm();
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<FilterMode>('work');

  const paidByDeal = useMemo(() => {
    const map = new Map<string, number>();
    for (const payment of payments) {
      if (payment.direction !== 'inflow' || payment.status !== 'completed') continue;
      map.set(payment.dealId, (map.get(payment.dealId) || 0) + payment.amount);
    }
    return map;
  }, [payments]);

  const work = useMemo(() => deals.filter(d => activeStage(d.stage)), [deals]);
  const completed = useMemo(() => deals.filter(d => d.stage === 'closed_won'), [deals]);
  const sandbox = useMemo(() => deals.filter(d => d.stage === 'closed_lost'), [deals]);
  const awaiting = work.filter(d => d.stage === 'prepayment');
  const quotedTotal = work.reduce((sum,d)=>sum+d.amount,0);
  const receivedTotal = work.reduce((sum,d)=>sum+(paidByDeal.get(d.id)||0),0);

  const source = mode === 'work' ? work : mode === 'completed' ? completed : sandbox;
  const shown = source.filter(d => {
    const needle=query.trim().toLowerCase();
    return !needle || `${d.clientName} ${d.title}`.toLowerCase().includes(needle);
  });
  const selected = selectedDealId ? deals.find(d => d.id === selectedDealId) : undefined;
  if (selected) return <DealDetail deal={selected} onBack={() => setSelectedDealId(null)}/>;

  const openClient = (id:string) => { setSelectedClientId(id); setCurrentTab('client_cockpit'); };

  return <div className="min-h-[1000px] w-[1330px] bg-[#f7f5f2] px-[38px] py-[26px] text-[#1f1d1c]">
    <div className="flex items-end justify-between">
      <div><div className="text-[10px] font-medium uppercase tracking-[.12em] text-[#8e867f]">Продажи</div><h1 className="mt-1 text-[30px] font-semibold tracking-[-.035em]">Сделки</h1><p className="mt-1 text-[11px] text-[#7c756f]">Рабочие сделки отдельно от завершённых и отказов.</p></div>
      <button onClick={()=>setIsCreateDealOpen(true)} className="flex h-[44px] items-center gap-2 rounded-[12px] bg-[#2a292b] px-5 text-[11px] font-medium text-white"><Plus size={14}/>Новая сделка</button>
    </div>

    <div className="mt-5 grid grid-cols-4 gap-4">
      <Card className="p-4"><div className="text-[10px] text-[#7b746e]">Сумма активных сделок</div><b className="mt-1.5 block text-[22px]">{compactMoney(quotedTotal)}</b><div className="mt-1 text-[9px] text-[#9a928b]">что выставлено / согласовано</div></Card>
      <Card className="p-4"><div className="text-[10px] text-[#7b746e]">Получено от клиентов</div><b className="mt-1.5 block text-[22px] text-[#55705f]">{compactMoney(receivedTotal)}</b><div className="mt-1 text-[9px] text-[#9a928b]">только подтверждённые поступления</div></Card>
      <Card className="p-4"><div className="text-[10px] text-[#7b746e]">В работе</div><b className="mt-1.5 block text-[22px]">{work.length}</b><div className="mt-1 text-[9px] text-[#9a928b]">без отказов и закрытых</div></Card>
      <Card className="p-4"><div className="text-[10px] text-[#7b746e]">Ждут оплату</div><b className="mt-1.5 block text-[22px]">{awaiting.length}</b><div className="mt-1 text-[9px] text-[#9a928b]">этап «Ожидает оплаты»</div></Card>
    </div>

    <div className="mt-4 flex items-center gap-3">
      <label className="flex h-[42px] w-[390px] items-center rounded-[12px] border border-[#e6e0da] bg-white px-4"><Search size={13} className="mr-3 text-[#948c86]"/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Поиск по клиенту или заказу" className="min-w-0 flex-1 bg-transparent text-[11px] outline-none"/></label>
      <Filter size={13} className="ml-2 text-[#817a74]"/>
      {([['work',`В работе ${work.length}`],['completed',`Завершено ${completed.length}`],['sandbox',`Песочница ${sandbox.length}`]] as [FilterMode,string][]).map(([id,label])=><button key={id} onClick={()=>setMode(id)} className={`h-[36px] rounded-[11px] px-4 text-[10px] font-medium ${mode===id?'bg-[#2a292b] text-white':'border border-[#e6e0da] bg-white text-[#625c57]'}`}>{label}</button>)}
    </div>

    <Card className="mt-4 min-h-[650px] overflow-hidden p-5">
      <div className="grid h-[42px] grid-cols-[160px_220px_165px_115px_115px_120px_1fr_76px] items-center rounded-[10px] bg-[#faf8f5] px-3 text-[9px] font-medium text-[#918983]"><span>Клиент</span><span>Сделка</span><span>Этап</span><span>Сумма</span><span>Получено</span><span>Дедлайн</span><span>Следующий шаг</span><span/></div>
      {shown.map((d,index)=>{
        const next=tasks.filter(t=>!t.completed&&(t.dealId===d.id||(!t.dealId&&t.clientId===d.clientId))).sort((a,b)=>(validDate(a.deadline)||Infinity)-(validDate(b.deadline)||Infinity))[0];
        return <div key={d.id} className={`grid min-h-[68px] grid-cols-[160px_220px_165px_115px_115px_120px_1fr_76px] items-center px-3 ${index%2?'rounded-[11px] bg-[#fcfbf9]':''}`}>
          <button onClick={()=>openClient(d.clientId)} className="min-w-0 text-left"><b className="block truncate text-[11px]">{d.clientName}</b><span className="mt-1 block text-[8px] text-[#9a928b]">с {shortDate(d.createdAt)}</span></button>
          <button onClick={()=>setSelectedDealId(d.id)} className="truncate pr-4 text-left text-[10px] text-[#4b4642]">{d.title}</button>
          <StageBadge stage={d.stage}/>
          <b className="truncate text-[10px]">{money(d.amount)}</b>
          <b className={`truncate text-[10px] ${(paidByDeal.get(d.id)||0)>0?'text-[#55705f]':'text-[#9a928b]'}`}>{money(paidByDeal.get(d.id)||0)}</b>
          <span className="text-[9px] text-[#68615c]">{d.deadline?shortDate(d.deadline):'—'}</span>
          <div className="min-w-0 pr-3"><span className="block truncate text-[9px]">{next?.title||'—'}</span>{next&&<span className={`mt-1 block text-[8px] ${relativeDate(next.deadline).startsWith('Просрочено')?'text-[#b86673]':'text-[#938b84]'}`}>{relativeDate(next.deadline)}</span>}</div>
          <button onClick={()=>setSelectedDealId(d.id)} className="h-[30px] rounded-[9px] border border-[#e6ded7] bg-white text-[9px] font-medium">Открыть</button>
        </div>;
      })}
      {!shown.length&&<div className="grid h-48 place-items-center text-[11px] text-[#918a84]">Здесь пока нет сделок.</div>}
      {mode==='sandbox'&&sandbox.length>0&&<div className="mt-4 rounded-[12px] bg-[#faf2f3] px-4 py-3 text-[9px] leading-4 text-[#875d65]">Песочница — отказная история. Эти сделки не участвуют в рабочих суммах, производстве и текущей воронке, но остаются в CRM для истории.</div>}
    </Card>
  </div>;
};
