import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, BarChart3, Check, Clock3, Mail, MessageCircle, RefreshCw, Wallet } from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { compactMoney, money, stageMeta } from './FigmaViews';

type Thread={key:string;channel:'email'|'telegram';contactId:string|null;title:string;subtitle:string;lastSnippet:string;lastMessageAt:string;lastDirection:string;unreadCount:number};
const Card:React.FC<React.PropsWithChildren<{className?:string}>>=({children,className=''})=><section className={`rounded-[18px] border border-[#e8e3de] bg-white ${className}`}>{children}</section>;
const dayKey=(d:Date)=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const dateTime=(value?:string)=>{if(!value)return'—';const d=new Date(value);return Number.isNaN(d.getTime())?'—':new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}).format(d).replace('.','')};

export const LiveDashboardView:React.FC=()=>{
  const {deals,tasks,payments,setCurrentTab,setSelectedClientId}=useCrm();
  const[threads,setThreads]=useState<Thread[]>([]);
  const[loadingThreads,setLoadingThreads]=useState(false);
  const now=new Date();
  const dateLabel=new Intl.DateTimeFormat('ru-RU',{weekday:'long',day:'numeric',month:'long'}).format(now).replace(/^./,x=>x.toUpperCase());

  async function loadThreads(){
    setLoadingThreads(true);
    try{
      const [emailRes,tgRes]=await Promise.all([
        fetch('/api/inbox?filter=client&search=',{cache:'no-store'}),
        fetch('/api/messages/telegram?search=',{cache:'no-store'}),
      ]);
      const email=await emailRes.json().catch(()=>({threads:[]}));
      const tg=await tgRes.json().catch(()=>({threads:[]}));
      const rows:Thread[]=[];
      if(emailRes.ok&&Array.isArray(email.threads))for(const t of email.threads)rows.push({key:`email:${t.id}`,channel:'email',contactId:t.contactId||null,title:t.remoteName||t.remoteEmail||'Email',subtitle:t.subject||t.remoteEmail||'',lastSnippet:t.lastSnippet||'',lastMessageAt:t.lastMessageAt,lastDirection:t.lastDirection||'',unreadCount:Number(t.unreadCount||0)});
      if(tgRes.ok&&Array.isArray(tg.threads))for(const t of tg.threads)rows.push({key:`telegram:${t.id}`,channel:'telegram',contactId:t.contactId||t.id||null,title:t.remoteName||'Telegram',subtitle:t.remoteHandle||'Telegram',lastSnippet:t.lastSnippet||'',lastMessageAt:t.lastMessageAt,lastDirection:t.lastDirection||'',unreadCount:Number(t.unreadCount||0)});
      rows.sort((a,b)=>Number(b.unreadCount>0)-Number(a.unreadCount>0)||+new Date(b.lastMessageAt)-+new Date(a.lastMessageAt));
      setThreads(rows);
    }catch{setThreads([])}finally{setLoadingThreads(false)}
  }
  useEffect(()=>{void loadThreads();const timer=window.setInterval(()=>void loadThreads(),60000);return()=>window.clearInterval(timer)},[]);

  const active=deals.filter(d=>!['closed_won','closed_lost'].includes(d.stage));
  const paid=payments.filter(p=>p.direction==='inflow'&&p.status==='completed').reduce((s,p)=>s+p.amount,0);
  const agreement=deals.filter(d=>['proposal_sent','negotiation','prepayment'].includes(d.stage)).length;
  const requiresReply=threads.filter(t=>t.lastDirection!=='outgoing').length;
  const recent=[...deals].sort((a,b)=>+new Date(b.updatedAt)-+new Date(a.updatedAt)).slice(0,6);
  const openTasks=tasks.filter(t=>!t.completed).sort((a,b)=>+new Date(a.deadline)-+new Date(b.deadline));
  const overdue=openTasks.filter(t=>+new Date(t.deadline)<Date.now()).length;
  const deadlines=deals.filter(d=>!['closed_lost'].includes(d.stage)&&d.deadline).sort((a,b)=>+new Date(a.deadline)-+new Date(b.deadline)).slice(0,6);
  const groups=[
    ['Новая заявка',deals.filter(d=>d.stage==='lead').length,'#8eb4df'],
    ['В работе',deals.filter(d=>['contacted','calculation'].includes(d.stage)).length,'#d7b188'],
    ['Согласование',deals.filter(d=>['proposal_sent','negotiation','prepayment'].includes(d.stage)).length,'#d98395'],
    ['Производство',deals.filter(d=>['production','ready'].includes(d.stage)).length,'#a497cd'],
    ['Доставка',deals.filter(d=>d.stage==='shipped').length,'#7897bb'],
    ['Закрыто',deals.filter(d=>['closed_won','closed_lost'].includes(d.stage)).length,'#7fa18f'],
  ] as const;
  const trend=useMemo(()=>Array.from({length:10},(_,i)=>{const d=new Date();d.setDate(d.getDate()-(9-i));const key=dayKey(d);return{date:d,count:deals.filter(x=>dayKey(new Date(x.createdAt))===key).length}}),[deals]);
  const maxTrend=Math.max(1,...trend.map(x=>x.count));
  const replyThreads=threads.filter(t=>t.lastDirection!=='outgoing').slice(0,5);

  const openClient=(contactId:string|null)=>{if(contactId){setSelectedClientId(contactId);setCurrentTab('client_cockpit')}else setCurrentTab('inbox')};

  return <div className="min-h-full bg-[#f7f5f2] px-6 py-6 text-[#1f1d1c] lg:px-9">
    <div className="mx-auto max-w-[1540px] pb-10">
      <div className="flex flex-wrap items-baseline justify-between gap-4"><div className="flex flex-wrap items-baseline gap-4"><h1 className="text-[34px] font-semibold leading-none tracking-[-.035em]">Главная</h1><span className="text-[13px] text-[#817a74]">{dateLabel}</span></div><button onClick={()=>void loadThreads()} className="grid h-10 w-10 place-items-center rounded-full bg-white text-[#817a74]" title="Обновить"><RefreshCw size={15} className={loadingThreads?'animate-spin':''}/></button></div>

      <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[[<MessageCircle size={20}/>, '#dcebfa', requiresReply, 'Требуют ответа'],[<BarChart3 size={20}/>, '#f8e5d2', active.length, 'В работе'],[<Check size={20}/>, '#f5d4da', agreement, 'На согласовании'],[<Wallet size={20}/>, '#e5defa', compactMoney(paid), 'Получено оплат']].map(([icon,bg,value,label],i)=><Card key={i} className="flex min-h-[104px] items-center px-5 py-4"><div className="grid h-14 w-14 shrink-0 place-items-center rounded-[16px]" style={{background:String(bg)}}>{icon as React.ReactNode}</div><div className="ml-4 min-w-0"><div className="truncate text-[23px] font-medium">{value}</div><div className="mt-1 text-[11px] text-[#6d6762]">{label}</div></div></Card>)}
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.4fr_.9fr]">
        <Card className="p-5"><div className="flex items-center justify-between"><div><h2 className="text-[18px] font-semibold">Требуют внимания</h2><p className="mt-1 text-[10px] text-[#817a74]">Ответы клиентам и просроченные задачи</p></div><span className="rounded-full bg-[#f7dde4] px-3 py-1.5 text-[10px]">{requiresReply+overdue}</span></div><div className="mt-4 grid gap-2 lg:grid-cols-2">{replyThreads.map(t=><button key={t.key} onClick={()=>openClient(t.contactId)} className="flex min-h-[62px] items-center rounded-[13px] bg-[#fbfaf8] px-3 text-left"><span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-[9px] ${t.channel==='email'?'bg-[#f8e5d2]':'bg-[#dceaf7]'}`}>{t.channel==='email'?'@':'TG'}</span><span className="ml-3 min-w-0 flex-1"><b className="block truncate text-[11px]">{t.title}</b><span className="mt-1 block truncate text-[9px] text-[#817a74]">{t.lastSnippet||t.subtitle}</span></span><span className="ml-2 text-[9px] text-[#817a74]">{dateTime(t.lastMessageAt)}</span></button>)}{openTasks.filter(t=>+new Date(t.deadline)<Date.now()).slice(0,Math.max(0,5-replyThreads.length)).map(t=><button key={t.id} onClick={()=>t.clientId?openClient(t.clientId):setCurrentTab('calendar')} className="flex min-h-[62px] items-center rounded-[13px] bg-[#fbfaf8] px-3 text-left"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#f7dde4]"><AlertCircle size={14}/></span><span className="ml-3 min-w-0 flex-1"><b className="block truncate text-[11px]">{t.title}</b><span className="mt-1 block truncate text-[9px] text-[#817a74]">Просрочено · {t.clientName||'без клиента'}</span></span><span className="ml-2 text-[9px] text-[#817a74]">{dateTime(t.deadline)}</span></button>)}{requiresReply+overdue===0&&<div className="col-span-full py-10 text-center text-[11px] text-[#817a74]">Срочных действий нет</div>}</div></Card>
        <Card className="p-5"><h2 className="text-[18px] font-semibold">По этапам</h2><div className="mt-4 space-y-3">{groups.map(([name,count,color])=><button key={name} onClick={()=>setCurrentTab('pipeline')} className="flex w-full items-center text-[11px]"><i className="mr-3 h-2.5 w-2.5 rounded-full" style={{background:color}}/><span className="flex-1 text-left text-[#514c48]">{name}</span><b>{count}</b></button>)}</div><div className="mt-5 border-t border-[#eeeae6] pt-4 text-[10px] text-[#817a74]">Всего сделок в CRM: <b className="text-[#1f1d1c]">{deals.length}</b></div></Card>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.2fr_.8fr]">
        <Card className="p-5"><div className="flex items-center justify-between"><div><h2 className="text-[18px] font-semibold">Динамика новых сделок</h2><p className="mt-1 text-[10px] text-[#817a74]">Последние 10 дней</p></div><button onClick={()=>setCurrentTab('deals')} className="text-[10px] text-[#817a74]">Все сделки →</button></div><div className="mt-5 flex h-[190px] items-end gap-3 border-b border-[#eeeae6] px-2">{trend.map((x,i)=><div key={i} className="group flex h-full flex-1 items-end"><div className="w-full rounded-t-[8px] bg-[#d8e5f6]" style={{height:`${Math.max(4,x.count/maxTrend*100)}%`}} title={`${x.count} сделок · ${dateTime(x.date.toISOString())}`}/></div>)}</div><div className="mt-2 flex justify-between text-[9px] text-[#817a74]"><span>{trend[0]&&new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'short'}).format(trend[0].date)}</span><span>{trend[3]&&new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'short'}).format(trend[3].date)}</span><span>{trend[6]&&new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'short'}).format(trend[6].date)}</span><span>{trend[9]&&new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'short'}).format(trend[9].date)}</span></div></Card>
        <Card className="p-5"><h2 className="text-[18px] font-semibold">Ближайшие сроки</h2><div className="mt-4 space-y-2">{deadlines.length?deadlines.map(d=><button key={d.id} onClick={()=>openClient(d.clientId)} className="flex w-full items-center rounded-[12px] bg-[#fbfaf8] px-3 py-3 text-left"><span className="min-w-0 flex-1"><b className="block truncate text-[10px]">{d.clientName}</b><span className="mt-1 block truncate text-[9px] text-[#817a74]">{d.title}</span></span><span className="ml-3 text-[10px] font-semibold">{dateTime(d.deadline)}</span></button>):<div className="py-10 text-center text-[11px] text-[#817a74]">Сроки не назначены</div>}</div></Card>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-3">
        <Card className="p-5"><h2 className="text-[18px] font-semibold">Последние сделки</h2><div className="mt-4 space-y-2">{recent.map(d=><button key={d.id} onClick={()=>openClient(d.clientId)} className="flex w-full items-center rounded-[12px] px-2 py-2 text-left hover:bg-[#fbfaf8]"><span className="mr-3 h-9 w-9 shrink-0 rounded-[11px]" style={{background:stageMeta[d.stage].bg}}/><span className="min-w-0 flex-1"><b className="block truncate text-[10px]">{d.clientName}</b><span className="mt-1 block truncate text-[9px] text-[#817a74]">{stageMeta[d.stage].label} · {d.title}</span></span></button>)}{!recent.length&&<div className="py-10 text-center text-[11px] text-[#817a74]">Сделок пока нет</div>}</div></Card>
        <Card className="p-5"><div className="flex items-center justify-between"><h2 className="text-[18px] font-semibold">Последние сообщения</h2><button onClick={()=>setCurrentTab('inbox')} className="text-[10px] text-[#817a74]">Все чаты →</button></div><div className="mt-4 space-y-2">{threads.slice(0,6).map(t=><button key={t.key} onClick={()=>openClient(t.contactId)} className="flex w-full items-center rounded-[12px] px-2 py-2 text-left hover:bg-[#fbfaf8]"><span className={`mr-3 grid h-9 w-9 shrink-0 place-items-center rounded-full text-[9px] ${t.channel==='email'?'bg-[#f8e5d2]':'bg-[#dceaf7]'}`}>{t.channel==='email'?'@':'TG'}</span><span className="min-w-0 flex-1"><b className="block truncate text-[10px]">{t.title}</b><span className="mt-1 block truncate text-[9px] text-[#817a74]">{t.lastSnippet||t.subtitle}</span></span><span className="ml-2 text-[9px] text-[#817a74]">{dateTime(t.lastMessageAt)}</span></button>)}{!threads.length&&<div className="py-10 text-center text-[11px] text-[#817a74]">Диалоги не загрузились</div>}</div></Card>
        <Card className="p-5"><h2 className="text-[18px] font-semibold">Финансы</h2><div className="mt-4 rounded-[14px] bg-[#eef6f0] p-4"><div className="text-[10px] text-[#66736a]">Фактически получено</div><b className="mt-1 block text-[24px]">{money(paid)}</b></div><div className="mt-3 flex items-center justify-between rounded-[12px] bg-[#fbfaf8] px-4 py-3 text-[10px]"><span className="text-[#817a74]">Проведённых оплат</span><b>{payments.filter(p=>p.direction==='inflow'&&p.status==='completed').length}</b></div><div className="mt-3 flex items-center justify-between rounded-[12px] bg-[#fbfaf8] px-4 py-3 text-[10px]"><span className="text-[#817a74]">Просроченных задач</span><b>{overdue}</b></div><button onClick={()=>setCurrentTab('finance')} className="mt-4 w-full rounded-[12px] border border-[#e8e3de] bg-white px-4 py-3 text-[10px]">Открыть экономику</button></Card>
      </div>
    </div>
  </div>;
};
