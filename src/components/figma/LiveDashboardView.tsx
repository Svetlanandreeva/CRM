import React, { useMemo } from 'react';
import { BarChart3, Check, MessageCircle, Wallet } from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { compactMoney, stageMeta } from './FigmaViews';

const Card: React.FC<React.PropsWithChildren<{ className?: string }>> = ({ children, className = '' }) => <section className={`rounded-[18px] border border-[#e8e3de] bg-white ${className}`}>{children}</section>;
const money = (value:number) => new Intl.NumberFormat('ru-RU',{style:'currency',currency:'RUB',maximumFractionDigits:0}).format(value);
const dayKey=(d:Date)=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

export const LiveDashboardView:React.FC=()=>{
  const {deals,tasks,payments,chatMessages,setCurrentTab}=useCrm();
  const now=new Date();
  const dateLabel=new Intl.DateTimeFormat('ru-RU',{weekday:'long',day:'numeric',month:'long'}).format(now).replace(/^./,x=>x.toUpperCase());
  const active=deals.filter(d=>!['closed_won','closed_lost'].includes(d.stage));
  const paid=payments.filter(p=>p.direction==='inflow'&&p.status==='completed').reduce((s,p)=>s+p.amount,0);
  const agreement=deals.filter(d=>['proposal_sent','negotiation','prepayment'].includes(d.stage)).length;
  const unread=chatMessages.filter(m=>m.direction==='inbound'&&!m.isRead).length;
  const recent=[...deals].sort((a,b)=>+new Date(b.updatedAt)-+new Date(a.updatedAt)).slice(0,5);
  const openTasks=tasks.filter(t=>!t.completed).sort((a,b)=>+new Date(a.deadline)-+new Date(b.deadline)).slice(0,5);
  const groups=[
    ['Новая заявка',deals.filter(d=>d.stage==='lead').length,'#8eb4df'],
    ['В работе',deals.filter(d=>['contacted','calculation'].includes(d.stage)).length,'#d7b188'],
    ['На согласовании',deals.filter(d=>['proposal_sent','negotiation','prepayment'].includes(d.stage)).length,'#d98395'],
    ['Производство',deals.filter(d=>['production','ready'].includes(d.stage)).length,'#a497cd'],
    ['Доставка',deals.filter(d=>d.stage==='shipped').length,'#7897bb'],
    ['Закрыто',deals.filter(d=>['closed_won','closed_lost'].includes(d.stage)).length,'#7fa18f'],
  ] as const;
  const trend=useMemo(()=>Array.from({length:10},(_,i)=>{const d=new Date();d.setDate(d.getDate()-(9-i));const key=dayKey(d);return{date:d,count:deals.filter(x=>dayKey(new Date(x.createdAt))===key).length}}),[deals]);
  const maxTrend=Math.max(1,...trend.map(x=>x.count));
  const monthProjects=deals.filter(d=>!['closed_lost'].includes(d.stage)&&d.deadline).sort((a,b)=>+new Date(a.deadline)-+new Date(b.deadline)).slice(0,4);
  const work=active.reduce((s,d)=>s+d.amount,0);
  return <div className="relative h-[1000px] min-w-[1080px] overflow-hidden bg-[#f7f5f2] text-[#1f1d1c]">
    <div className="absolute left-[42px] top-[26px] flex items-baseline gap-4"><h1 className="text-[34px] font-semibold leading-none tracking-[-.035em]">Главная</h1><span className="text-[13px] text-[#817a74]">{dateLabel}</span></div>
    <div className="absolute left-[42px] right-[54px] top-[86px] grid grid-cols-4 gap-[24px]">
      {[[<MessageCircle size={20}/>, '#dcebfa', unread, 'Требуют ответа'],[<BarChart3 size={20}/>, '#f8e5d2', active.length, 'В работе'],[<Check size={20}/>, '#f5d4da', agreement, 'На согласовании'],[<Wallet size={20}/>, '#e5defa', compactMoney(paid), 'Получено оплат']].map(([icon,bg,value,label],i)=><Card key={i} className="relative h-[110px]"><div className="absolute left-[18px] top-[20px] grid h-[56px] w-[56px] place-items-center rounded-[16px]" style={{background:String(bg)}}>{icon as React.ReactNode}</div><div className="absolute left-[90px] top-[19px]"><div className="text-[23px] font-medium leading-tight">{value}</div><div className="mt-2 text-[12px] text-[#6d6762]">{label}</div></div></Card>)}
    </div>
    <div className="absolute left-[42px] right-[42px] top-[214px] grid h-[250px] grid-cols-[715fr_512fr] gap-[18px]">
      <Card className="relative overflow-hidden"><h2 className="absolute left-[20px] top-[17px] text-[18px] font-semibold">Динамика заявок</h2><button onClick={()=>setCurrentTab('deals')} className="absolute right-[20px] top-[22px] text-[11px] text-[#756e68]">Все сделки →</button><div className="absolute bottom-[42px] left-[28px] right-[28px] flex h-[150px] items-end gap-[18px] border-b border-[#eeeae6]">{trend.map((x,i)=><div key={i} className="flex-1 rounded-t-[9px] bg-[#d8e5f6]" style={{height:`${Math.max(4,x.count/maxTrend*100)}%`}} title={`${x.count} заявок`}/>)}</div><div className="absolute bottom-[17px] left-[28px] right-[28px] flex justify-between text-[10px] text-[#817a74]"><span>{trend[0]&&new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'short'}).format(trend[0].date)}</span><span>{trend[3]&&new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'short'}).format(trend[3].date)}</span><span>{trend[6]&&new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'short'}).format(trend[6].date)}</span><span>{trend[9]&&new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'short'}).format(trend[9].date)}</span></div></Card>
      <Card className="relative overflow-hidden"><h2 className="absolute left-[22px] top-[17px] text-[18px] font-semibold">По этапам</h2><div className="absolute left-[27px] top-[55px] w-[205px] space-y-[9px]">{groups.map(([n,c,color])=><div key={n} className="flex items-center text-[12px]"><i className="mr-3 h-[10px] w-[10px] rounded-full" style={{background:color}}/><span className="flex-1 text-[#514c48]">{n}</span><b>{c}</b></div>)}</div><div className="absolute right-[35px] top-[55px] grid h-[160px] w-[160px] place-items-center rounded-full bg-[#f1ebe5]"><div className="grid h-[108px] w-[108px] place-items-center rounded-full bg-white text-center"><div><b className="text-[28px]">{deals.length}</b><div className="text-[11px] text-[#706a65]">Всего сделок</div></div></div></div></Card>
    </div>
    <div className="absolute left-[42px] right-[42px] top-[480px] grid h-[310px] grid-cols-[470fr_370fr_377fr] gap-[14px]">
      <Card className="p-[20px]"><h2 className="mb-[20px] text-[18px] font-semibold">Ближайшие задачи</h2>{openTasks.length?openTasks.map((t,i)=><div key={t.id} className="mb-[8px] flex h-[36px] items-center rounded-[10px] bg-[#fbfaf8] px-[14px] text-[11px]"><i className={`mr-3 h-[14px] w-[14px] rounded-full ${i===0?'bg-[#8eb4df]':'bg-[#eeeae6]'}`}/><span className="min-w-0 flex-1 truncate">{t.title}</span><span className="ml-2 text-[10px] text-[#8a837d]">{new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}).format(new Date(t.deadline))}</span></div>):<div className="py-12 text-center text-[12px] text-[#8a837d]">Нет открытых задач</div>}</Card>
      <Card className="p-[20px]"><h2 className="mb-[18px] text-[18px] font-semibold">Последние сделки</h2>{recent.length?recent.map((d,i)=><button key={d.id} onClick={()=>setCurrentTab('deals')} className="mb-[6px] flex h-[40px] w-full items-center text-left"><i className="mr-3 h-[40px] w-[40px] rounded-[12px]" style={{background:['#f4d9c7','#dee9f7','#f2e3ce','#d6eadf','#dde9f5'][i]}}/><div className="min-w-0"><b className="block truncate text-[11px]">{d.clientName}</b><span className="block truncate text-[10px] text-[#7b746e]">{stageMeta[d.stage].label} · {d.title}</span></div></button>):<div className="py-12 text-center text-[12px] text-[#8a837d]">Сделок пока нет</div>}</Card>
      <Card className="p-[20px]"><h2 className="mb-[18px] text-[18px] font-semibold">Чаты</h2>{chatMessages.length?chatMessages.slice(-5).reverse().map((m,i)=><button key={m.id} onClick={()=>setCurrentTab('inbox')} className="mb-[6px] flex h-[40px] w-full items-center text-left"><span className="mr-3 grid h-[38px] w-[38px] place-items-center rounded-full text-[11px]" style={{background:['#bdbdbd','#f0d6c8','#e9dacb','#cad3ec','#d8d1ea'][i]}}>{(m.senderName||'К').slice(0,1)}</span><div className="min-w-0"><b className="block truncate text-[11px]">{m.senderName||'Клиент'}</b><span className="block truncate text-[10px] text-[#7e7772]">{m.content}</span></div></button>):<button onClick={()=>setCurrentTab('inbox')} className="py-12 text-center text-[12px] text-[#8a837d] w-full">Открыть живые чаты →</button>}</Card>
    </div>
    <div className="absolute left-[42px] right-[42px] top-[806px] grid h-[160px] grid-cols-[720fr_507fr] gap-[18px]">
      <Card className="relative p-[20px]"><h2 className="text-[18px] font-semibold">Ближайшие сроки</h2>{monthProjects.map((d,i)=><div key={d.id} className="absolute left-[28px] right-[28px] flex items-center text-[10px]" style={{top:58+i*24}}><span className="min-w-0 flex-1 truncate">{d.clientName} · {d.title}</span><b className="ml-4">{new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'short'}).format(new Date(d.deadline))}</b></div>)}{!monthProjects.length&&<div className="mt-9 text-[11px] text-[#817a74]">Нет назначенных сроков</div>}</Card>
      <Card className="relative p-[20px]"><h2 className="text-[18px] font-semibold">Экономика</h2><div className="absolute left-[38px] top-[53px]"><span className="text-[11px] text-[#756e68]">Получено</span><b className="mt-1 block text-[22px]">{money(paid)}</b></div><div className="absolute left-[235px] top-[53px]"><span className="text-[11px] text-[#756e68]">В работе</span><b className="mt-1 block text-[22px]">{money(work)}</b></div></Card>
    </div>
  </div>;
};
