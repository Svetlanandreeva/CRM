import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowUpRight, CalendarDays, CircleDollarSign, Clock3, MessageCircle, Sparkles, Wallet,
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';

const money=(value=0)=>`${new Intl.NumberFormat('ru-RU').format(Math.round(value))} ₽`;
const compactMoney=(value=0)=>value>=1_000_000?`${(value/1_000_000).toLocaleString('ru-RU',{maximumFractionDigits:2})} млн ₽`:money(value);
const ms=(value?:string|null)=>{if(!value)return 0;const d=new Date(value);const n=d.getTime();return Number.isNaN(n)||d.getFullYear()<2000||d.getFullYear()>2100?0:n};
const shortDate=(value?:string|null)=>ms(value)?new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'short'}).format(new Date(value!)).replace('.',''):'—';
const fullDate=(value?:string|null)=>ms(value)?new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'long',year:'numeric'}).format(new Date(value!)):'—';
const active=(stage:string)=>!['closed_won','closed_lost'].includes(stage);

const Card:React.FC<React.PropsWithChildren<{className?:string;onClick?:()=>void}>>=({children,className='',onClick})=><section onClick={onClick} className={`rounded-[18px] border border-[#e6e0da] bg-white shadow-[0_1px_0_rgba(35,30,27,.02)] ${onClick?'cursor-pointer transition hover:border-[#d4cbc3]':''} ${className}`}>{children}</section>;

type Activity={id:string;type?:string;description?:string;contactName?:string|null;contactId?:string|null;dealId?:string|null;createdAt?:string|null};

export const LiveDashboardView:React.FC=()=>{
  const {deals,tasks,payments,setCurrentTab,setSelectedDealId,setSelectedClientId}=useCrm();
  const[activities,setActivities]=useState<Activity[]>([]);
  const now=new Date();
  const greeting=now.getHours()<12?'Доброе утро':now.getHours()<18?'Добрый день':'Добрый вечер';
  const dateLabel=new Intl.DateTimeFormat('ru-RU',{weekday:'long',day:'numeric',month:'long'}).format(now).replace(/^./,x=>x.toUpperCase());

  useEffect(()=>{let live=true;const load=async()=>{try{const r=await fetch('/api/activities',{cache:'no-store'});const d=await r.json();if(live&&r.ok&&Array.isArray(d))setActivities(d.filter((x:any)=>ms(x.createdAt)))}catch{}};void load();const t=window.setInterval(()=>void load(),60000);return()=>{live=false;window.clearInterval(t)}},[]);

  const liveDeals=deals.filter(d=>active(d.stage));
  const totalQuoted=liveDeals.reduce((s,d)=>s+d.amount,0);
  const liveIds=new Set(liveDeals.map(d=>d.id));
  const confirmed=payments.filter(p=>liveIds.has(p.dealId)&&p.direction==='inflow'&&p.status==='completed');
  const received=confirmed.reduce((s,p)=>s+p.amount,0);
  const production=liveDeals.filter(d=>['production','ready'].includes(d.stage));
  const overdue=liveDeals.filter(d=>d.deadline&&ms(d.deadline)<new Date(now.getFullYear(),now.getMonth(),now.getDate()).getTime()).length;
  const dueSoon=liveDeals.filter(d=>{const x=ms(d.deadline);return x>=Date.now()&&x<=Date.now()+7*86400000}).length;

  const projectRows=useMemo(()=>production.map(deal=>{
    const payment=confirmed.filter(p=>p.dealId===deal.id).sort((a,b)=>ms(a.date)-ms(b.date))[0];
    return{deal,start:deal.productionStartDate||deal.paymentDate||payment?.date||'',deadline:deal.deadline||'',paid:confirmed.filter(p=>p.dealId===deal.id).reduce((s,p)=>s+p.amount,0)};
  }).sort((a,b)=>(ms(a.deadline)||Infinity)-(ms(b.deadline)||Infinity)),[production,confirmed]);

  const openTasks=[...tasks].filter(t=>!t.completed).sort((a,b)=>(ms(a.deadline)||Infinity)-(ms(b.deadline)||Infinity)).slice(0,5);
  const recent=[...activities].sort((a,b)=>ms(b.createdAt)-ms(a.createdAt)).slice(0,5);
  const paymentGap=Math.max(0,totalQuoted-received);

  const openDeal=(id:string)=>{setSelectedDealId(id);setCurrentTab('deals')};
  const openClient=(id?:string|null)=>{if(id){setSelectedClientId(id);setCurrentTab('client_cockpit')}};

  return <div className="min-h-[1000px] w-[1330px] bg-[#f7f5f2] px-[38px] py-[24px] text-[#1f1d1c]">
    <header className="flex items-center justify-between">
      <div>
        <h1 className="text-[21px] font-semibold tracking-[-.025em]">{greeting}, Светлана</h1>
        <div className="mt-1 text-[11px] text-[#817a74]">{dateLabel}</div>
      </div>
      <button onClick={()=>setCurrentTab('ai_manager')} className="flex h-[40px] items-center gap-2 rounded-[11px] border border-[#e6e0da] bg-white px-4 text-[10px] font-medium"><Sparkles size={13}/>Открыть Еву</button>
    </header>

    <div className="mt-5 grid grid-cols-4 gap-4">
      <Card className="p-4"><div className="flex items-center justify-between"><span className="text-[10px] text-[#786f69]">Сумма сделок в работе</span><CircleDollarSign size={15} className="text-[#9b918a]"/></div><b className="mt-2 block text-[23px]">{compactMoney(totalQuoted)}</b><div className="mt-1 text-[9px] text-[#9b938c]">без отказов и завершённых</div></Card>
      <Card className="p-4"><div className="flex items-center justify-between"><span className="text-[10px] text-[#786f69]">Получено от клиентов</span><Wallet size={15} className="text-[#6e8d79]"/></div><b className="mt-2 block text-[23px] text-[#55705f]">{compactMoney(received)}</b><div className="mt-1 text-[9px] text-[#9b938c]">подтверждённые оплаты</div></Card>
      <Card className="p-4" onClick={()=>setCurrentTab('production')}><div className="flex items-center justify-between"><span className="text-[10px] text-[#786f69]">Сейчас в производстве</span><Clock3 size={15} className="text-[#7e729f]"/></div><b className="mt-2 block text-[23px]">{production.length}</b><div className="mt-1 text-[9px] text-[#9b938c]">только реальные стадии производства</div></Card>
      <Card className="p-4" onClick={()=>setCurrentTab('calendar')}><div className="flex items-center justify-between"><span className="text-[10px] text-[#786f69]">Дедлайны</span><CalendarDays size={15} className="text-[#a26c75]"/></div><b className="mt-2 block text-[23px]">{dueSoon}</b><div className={`mt-1 text-[9px] ${overdue?'text-[#b76572]':'text-[#9b938c]'}`}>{overdue?`просрочено: ${overdue}`:'на ближайшие 7 дней'}</div></Card>
    </div>

    <div className="mt-4 grid grid-cols-[790px_1fr] gap-4">
      <Card className="min-h-[302px] p-5">
        <div className="flex items-center justify-between"><div><h2 className="text-[17px] font-semibold">Календарь проектов</h2><p className="mt-1 text-[9px] text-[#8d857f]">Производство считается от даты фактической оплаты до срока сдачи.</p></div><button onClick={()=>setCurrentTab('calendar')} className="text-[9px] font-medium text-[#68615c]">Открыть календарь →</button></div>
        <div className="mt-4 grid h-[34px] grid-cols-[2fr_110px_110px_105px_100px] items-center rounded-[9px] bg-[#faf8f5] px-3 text-[8px] font-medium uppercase tracking-[.06em] text-[#928a84]"><span>Проект</span><span>Старт</span><span>Сдать</span><span>Получено</span><span>Статус</span></div>
        {projectRows.length?projectRows.slice(0,5).map(({deal,start,deadline,paid})=><button key={deal.id} onClick={()=>openDeal(deal.id)} className="grid min-h-[46px] w-full grid-cols-[2fr_110px_110px_105px_100px] items-center border-b border-[#f0ece8] px-3 text-left text-[9px] hover:bg-[#fcfaf7]"><span className="min-w-0"><b className="block truncate text-[10px]">{deal.title}</b><span className="mt-0.5 block truncate text-[8px] text-[#8e867f]">{deal.clientName}</span></span><span>{start?shortDate(start):'не указано'}</span><span className={deadline&&ms(deadline)<Date.now()?'text-[#b86673]':''}>{deadline?shortDate(deadline):'не указано'}</span><b>{money(paid)}</b><span className="w-fit rounded-full bg-[#e4efe7] px-2.5 py-1 text-[8px] text-[#55705f]">{deal.stage==='ready'?'Готово':'Производство'}</span></button>):<div className="grid h-[180px] place-items-center text-center text-[10px] leading-5 text-[#8e867f]">Сделок со статусом «В производстве» пока нет.<br/>Когда появятся — они попадут сюда автоматически.</div>}
      </Card>

      <div className="space-y-4">
        <Card className="p-5">
          <h2 className="text-[17px] font-semibold">Деньги по активным</h2>
          <div className="mt-4 space-y-3 text-[10px]"><div className="flex"><span className="text-[#817a74]">Выставлено / сумма сделок</span><b className="ml-auto">{money(totalQuoted)}</b></div><div className="flex"><span className="text-[#817a74]">Получено</span><b className="ml-auto text-[#55705f]">{money(received)}</b></div><div className="flex border-t border-[#eee9e4] pt-3"><span className="text-[#817a74]">Ещё не получено</span><b className="ml-auto">{money(paymentGap)}</b></div></div>
          <button onClick={()=>setCurrentTab('finance')} className="mt-4 h-[35px] w-full rounded-[10px] bg-[#f6f2ed] text-[9px] font-medium">Открыть экономику</button>
        </Card>
        <Card className="p-5" onClick={()=>setCurrentTab('ai_manager')}>
          <div className="flex items-center gap-2"><Sparkles size={15} className="text-[#846fa6]"/><h2 className="text-[16px] font-semibold">Ева · что требует внимания</h2></div>
          <p className="mt-3 text-[10px] leading-5 text-[#746d67]">{overdue?`${overdue} проект(а) с истёкшим дедлайном. `:''}{openTasks.length?`Открытых задач: ${tasks.filter(t=>!t.completed).length}.`:'Просроченных или открытых задач сейчас нет.'}</p>
          <div className="mt-3 flex items-center text-[9px] font-medium text-[#615a55]">Посмотреть причины и открыть сделки <ArrowUpRight size={11} className="ml-1"/></div>
        </Card>
      </div>
    </div>

    <div className="mt-4 grid grid-cols-2 gap-4">
      <Card className="p-5">
        <div className="flex items-center justify-between"><h2 className="text-[17px] font-semibold">Ближайшие задачи</h2><button onClick={()=>setCurrentTab('tasks')} className="text-[9px]">Все →</button></div>
        <div className="mt-3 space-y-1.5">{openTasks.length?openTasks.map(t=><button key={t.id} onClick={()=>openClient(t.clientId)} className="flex min-h-[42px] w-full items-center rounded-[10px] bg-[#fbfaf8] px-3 text-left"><span className="min-w-0 flex-1"><b className="block truncate text-[10px]">{t.title}</b><span className="mt-0.5 block truncate text-[8px] text-[#8d857f]">{t.clientName||t.dealTitle||'CRM'}</span></span><span className={`ml-3 text-[8px] ${ms(t.deadline)<Date.now()?'text-[#b86673]':'text-[#817a74]'}`}>{shortDate(t.deadline)}</span></button>):<div className="grid h-[130px] place-items-center text-[10px] text-[#8d857f]">Открытых задач нет</div>}</div>
      </Card>
      <Card className="p-5">
        <div className="flex items-center justify-between"><h2 className="text-[17px] font-semibold">Последние изменения</h2><span className="text-[9px] text-[#8d857f]">только события CRM</span></div>
        <div className="mt-3 space-y-1.5">{recent.length?recent.map(a=><button key={a.id} onClick={()=>a.contactId?openClient(a.contactId):a.dealId?openDeal(a.dealId):undefined} className="flex min-h-[42px] w-full items-center rounded-[10px] bg-[#fbfaf8] px-3 text-left"><span className="mr-3 grid h-7 w-7 shrink-0 place-items-center rounded-[9px] bg-[#ece6e0]"><MessageCircle size={11}/></span><span className="min-w-0 flex-1"><b className="block truncate text-[10px]">{a.contactName||'CRM'}</b><span className="mt-0.5 block truncate text-[8px] text-[#8d857f]">{a.description||a.type||'Изменение'}</span></span><span className="ml-3 text-[8px] text-[#8d857f]">{shortDate(a.createdAt)}</span></button>):<div className="grid h-[130px] place-items-center text-[10px] text-[#8d857f]">Подтверждённых изменений пока нет</div>}</div>
      </Card>
    </div>
  </div>;
};
