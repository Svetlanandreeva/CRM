import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft, BriefcaseBusiness, CheckCircle2, FileText, Mail, MessageCircle,
  Phone, Plus, RefreshCw, Send, Wallet,
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { money, stageMeta } from '../figma/FigmaViews';

type ViewTab = 'history'|'deals'|'tasks'|'finance'|'documents';
type HistoryChannel = 'email'|'telegram'|'activity';
type HistoryFilter = 'messages'|'all'|HistoryChannel;
type TimelineItem = {
  id:string;
  channel:HistoryChannel;
  direction:'incoming'|'outgoing'|'internal';
  timestamp:string;
  body:string;
  sender:string;
  address?:string|null;
  subject?:string|null;
  threadId?:string|null;
  activityType?:string;
  completedAt?:string|null;
  scheduledAt?:string|null;
  dealId?:string|null;
};
type Participant = {id:string;name:string;email?:string|null;phone?:string|null;company?:string|null};
type TimelinePayload = {
  contact?:{id:string;name:string;email?:string|null;phone?:string|null;company?:string|null;source?:string;qualification?:string;notes?:string|null};
  participants?:Participant[];
  history?:TimelineItem[];
  emailThreads?:Array<{id:string;subject:string;remoteEmail:string;remoteName?:string|null;unreadCount:number;lastMessageAt:string}>;
  telegram?:{remoteHandle?:string|null}|null;
};
type LiveDocument = {id:string;name:string;kind?:string;sizeBytes?:number;createdAt?:number|string};

const Card:React.FC<React.PropsWithChildren<{className?:string}>>=({children,className=''})=><section className={`rounded-[18px] border border-[#e8e3de] bg-white ${className}`}>{children}</section>;

function parseCrmDate(value?:string|null){
  if(!value)return null;
  let d=new Date(value);
  if(Number.isNaN(d.getTime())){
    const n=Number(value);
    if(Number.isFinite(n))d=new Date(Math.abs(n)<100_000_000_000?n*1000:Math.abs(n)<100_000_000_000_000?n:n/1000);
  }
  if(Number.isNaN(d.getTime()))return null;
  let guard=0;
  while(d.getUTCFullYear()>2100&&guard<3){d=new Date(d.getTime()/1000);guard+=1;}
  if(d.getUTCFullYear()<2000||d.getUTCFullYear()>2100)return null;
  return d;
}
const dateTime=(value?:string|null)=>{const d=parseCrmDate(value);return !d?'—':new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}).format(d).replace('.','')};
const shortDate=(value?:string|null)=>{const d=parseCrmDate(value);return !d?'—':new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'short',year:'numeric'}).format(d).replace('.','')};
const channelLabel=(channel:HistoryChannel)=>channel==='email'?'Email':channel==='telegram'?'Telegram':'CRM';
const channelTone=(channel:HistoryChannel)=>channel==='email'?'#f8e5d2':channel==='telegram'?'#dceaf7':'#eee9e3';

export const LiveClientView:React.FC=()=>{
  const {
    clients,selectedClientId,setSelectedClientId,deals,tasks,payments,
    setCurrentTab,setSelectedDealId,setIsCreateDealOpen,openCreateTaskWithPreset,setIsCreateInvoiceOpen,
  }=useCrm();
  const client=clients.find(c=>c.id===selectedClientId)||clients[0];
  const[tab,setTab]=useState<ViewTab>('history');
  const[data,setData]=useState<TimelinePayload|null>(null);
  const[documents,setDocuments]=useState<LiveDocument[]>([]);
  const[loading,setLoading]=useState(false);
  const[error,setError]=useState('');
  const[channelFilter,setChannelFilter]=useState<HistoryFilter>('messages');

  async function load(){
    if(!client)return;
    setLoading(true);setError('');
    try{
      const [timelineRes,docsRes]=await Promise.all([
        fetch(`/api/contacts/${encodeURIComponent(client.id)}/timeline`,{cache:'no-store'}),
        fetch(`/api/contacts/${encodeURIComponent(client.id)}/documents`,{cache:'no-store'}),
      ]);
      const timeline=await timelineRes.json();
      const docs=await docsRes.json().catch(()=>({documents:[]}));
      if(!timelineRes.ok)throw new Error(timeline.error||'Не удалось загрузить историю клиента');
      setData(timeline);
      setDocuments(docsRes.ok&&Array.isArray(docs.documents)?docs.documents:[]);
    }catch(e){setError(e instanceof Error?e.message:'Не удалось загрузить карточку клиента')}
    finally{setLoading(false)}
  }
  useEffect(()=>{void load()},[client?.id]);

  if(!client)return <div className="grid min-h-full place-items-center bg-[#f7f5f2] text-[13px] text-[#817a74]">Клиентов пока нет</div>;

  const clientDeals=deals.filter(d=>d.clientId===client.id);
  const activeDeals=clientDeals.filter(d=>!['closed_won','closed_lost'].includes(d.stage));
  const clientTasks=tasks.filter(t=>t.clientId===client.id).sort((a,b)=>(parseCrmDate(a.deadline)?.getTime()||0)-(parseCrmDate(b.deadline)?.getTime()||0));
  const openTasks=clientTasks.filter(t=>!t.completed);
  const clientPayments=payments.filter(p=>p.clientId===client.id&&p.status==='completed');
  const paid=clientPayments.filter(p=>p.direction==='inflow').reduce((s,p)=>s+p.amount,0);
  const expenses=clientPayments.filter(p=>p.direction==='outflow').reduce((s,p)=>s+p.amount,0);
  const rawHistory=data?.history||[];
  const conversationHistory=rawHistory.filter(item=>item.channel!=='activity');
  const history=rawHistory.filter(item=>channelFilter==='all'||(channelFilter==='messages'?item.channel!=='activity':item.channel===channelFilter));
  const participants=data?.participants||[];
  const incoming=conversationHistory.filter(x=>x.direction==='incoming').length;
  const outgoing=conversationHistory.filter(x=>x.direction==='outgoing').length;

  const tabs:[ViewTab,string,number][]=[
    ['history','История',conversationHistory.length],['deals','Сделки',clientDeals.length],['tasks','Задачи',clientTasks.length],['finance','Оплаты',clientPayments.length],['documents','Документы',documents.length],
  ];

  return <div className="min-h-full bg-[#f7f5f2] px-6 py-6 text-[#1f1d1c] lg:px-9">
    <div className="mx-auto max-w-[1540px]">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <button onClick={()=>setCurrentTab('clients')} className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[#e8e3de] bg-white"><ArrowLeft size={16}/></button>
          <div className="min-w-0">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1"><h1 className="truncate text-[30px] font-semibold tracking-[-.035em]">{client.name}</h1>{client.company&&<span className="text-[12px] text-[#817a74]">{client.company}</span>}</div>
            <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-[#817a74]">
              {client.phone&&<span className="flex items-center gap-1"><Phone size={12}/>{client.phone}</span>}
              {client.email&&<span className="flex items-center gap-1"><Mail size={12}/>{client.email}</span>}
              <span>{client.status}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={()=>setCurrentTab('inbox')} className="flex h-10 items-center gap-2 rounded-[12px] border border-[#e8e3de] bg-white px-4 text-[11px]"><MessageCircle size={14}/>Чаты</button>
          <button onClick={()=>openCreateTaskWithPreset({clientId:client.id,clientName:client.name})} className="flex h-10 items-center gap-2 rounded-[12px] border border-[#e8e3de] bg-white px-4 text-[11px]"><CheckCircle2 size={14}/>Задача</button>
          <button onClick={()=>setIsCreateInvoiceOpen(true)} className="flex h-10 items-center gap-2 rounded-[12px] border border-[#e8e3de] bg-white px-4 text-[11px]"><FileText size={14}/>Счёт / КП</button>
          <button onClick={()=>setIsCreateDealOpen(true)} className="flex h-10 items-center gap-2 rounded-[12px] bg-[#2a292b] px-4 text-[11px] text-white"><Plus size={14}/>Новая сделка</button>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="p-4"><div className="text-[10px] text-[#817a74]">Активных сделок</div><div className="mt-1 text-[24px] font-semibold">{activeDeals.length}</div></Card>
        <Card className="p-4"><div className="text-[10px] text-[#817a74]">Получено оплат</div><div className="mt-1 text-[24px] font-semibold">{money(paid)}</div></Card>
        <Card className="p-4"><div className="text-[10px] text-[#817a74]">Открытых задач</div><div className="mt-1 text-[24px] font-semibold">{openTasks.length}</div></Card>
        <Card className="p-4"><div className="text-[10px] text-[#817a74]">Сообщений в истории</div><div className="mt-1 text-[24px] font-semibold">{incoming+outgoing}</div><div className="mt-1 text-[9px] text-[#817a74]">входящих {incoming} · исходящих {outgoing}</div></Card>
      </div>

      {participants.length>1&&<Card className="mt-4 p-4"><div className="text-[11px] font-semibold">Контакты в переписке</div><div className="mt-3 flex flex-wrap gap-2">{participants.map(p=><span key={p.id} className="rounded-full bg-[#f7f3ee] px-3 py-2 text-[10px]">{p.name}{p.email?` · ${p.email}`:''}</span>)}</div></Card>}

      <div className="mt-5 flex flex-wrap items-center gap-2 border-b border-[#e5e0da] pb-3">
        {tabs.map(([id,label,count])=><button key={id} onClick={()=>setTab(id)} className={`rounded-full px-4 py-2 text-[11px] ${tab===id?'bg-[#2a292b] text-white':'bg-white text-[#5f5954]'}`}>{label} <span className="ml-1 opacity-70">{count}</span></button>)}
        <button onClick={()=>void load()} disabled={loading} className="ml-auto grid h-9 w-9 place-items-center rounded-full bg-white text-[#817a74]"><RefreshCw size={14} className={loading?'animate-spin':''}/></button>
      </div>

      {error&&<div className="mt-4 rounded-[14px] border border-[#ead4d8] bg-[#fbf0f2] px-4 py-3 text-[11px] text-[#9f5d68]">{error}</div>}

      {tab==='history'&&<div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="overflow-hidden">
          <div className="flex flex-wrap items-center gap-2 border-b border-[#eeeae6] px-5 py-4"><h2 className="mr-auto text-[18px] font-semibold">Диалог и история</h2>{(['messages','email','telegram','activity','all'] as const).map(f=><button key={f} onClick={()=>setChannelFilter(f)} className={`rounded-full px-3 py-1.5 text-[9px] ${channelFilter===f?'bg-[#2a292b] text-white':'bg-[#f7f5f2]'}`}>{f==='messages'?'Переписка':f==='email'?'Email':f==='telegram'?'Telegram':f==='activity'?'CRM':'Всё'}</button>)}</div>
          <div className="max-h-[650px] overflow-y-auto p-5">
            {loading&&!data?<div className="py-20 text-center text-[11px] text-[#817a74]">Загружаю историю…</div>:history.length?history.map(item=><div key={item.id} className="mb-4 flex gap-3">
              <span className="mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-full text-[9px] font-semibold" style={{background:channelTone(item.channel)}}>{item.channel==='email'?'@':item.channel==='telegram'?'TG':'CRM'}</span>
              <div className="min-w-0 flex-1 rounded-[14px] border border-[#eeeae6] bg-[#fcfbf9] px-4 py-3">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[9px] text-[#817a74]"><b className="text-[10px] text-[#3b3734]">{item.sender}</b><span>{channelLabel(item.channel)}</span>{item.subject&&item.channel==='email'&&<span className="truncate">· {item.subject}</span>}<span className="ml-auto">{dateTime(item.timestamp)}</span></div>
                <div className="mt-2 whitespace-pre-wrap break-words text-[11px] leading-5 text-[#3f3a36]">{item.body}</div>
              </div>
            </div>):<div className="py-20 text-center text-[11px] text-[#817a74]">По этому клиенту переписка пока не найдена</div>}
          </div>
        </Card>
        <div className="space-y-4">
          <Card className="p-4"><h3 className="text-[15px] font-semibold">Контакт</h3><div className="mt-3 space-y-2 text-[11px]"><div><span className="text-[#817a74]">Телефон</span><b className="block">{client.phone||'—'}</b></div><div><span className="text-[#817a74]">Email</span><b className="block break-all">{client.email||'—'}</b></div><div><span className="text-[#817a74]">Компания</span><b className="block">{client.company||'—'}</b></div><div><span className="text-[#817a74]">Источник</span><b className="block">{client.source||'—'}</b></div></div></Card>
          <Card className="p-4"><h3 className="text-[15px] font-semibold">Следующие действия</h3>{openTasks.length?openTasks.slice(0,4).map(t=><div key={t.id} className="mt-3 rounded-[11px] bg-[#fbfaf8] px-3 py-3 text-[10px]"><b className="block truncate">{t.title}</b><span className="mt-1 block text-[#817a74]">{dateTime(t.deadline)}</span></div>):<div className="py-8 text-center text-[10px] text-[#817a74]">Открытых задач нет</div>}</Card>
        </div>
      </div>}

      {tab==='deals'&&<Card className="mt-5 overflow-hidden"><div className="grid min-w-[800px] grid-cols-[1.5fr_.8fr_.8fr_.8fr_100px] bg-[#fbfaf8] px-5 py-3 text-[10px] text-[#817a74]"><span>Сделка</span><span>Этап</span><span>Оплачено</span><span>Срок</span><span/></div><div className="overflow-x-auto">{clientDeals.length?clientDeals.map(d=>{const amount=clientPayments.filter(p=>p.dealId===d.id&&p.direction==='inflow').reduce((s,p)=>s+p.amount,0);return <div key={d.id} className="grid min-w-[800px] grid-cols-[1.5fr_.8fr_.8fr_.8fr_100px] items-center border-t border-[#eeeae6] px-5 py-4 text-[11px]"><b className="truncate">{d.title}</b><span className="w-fit rounded-full px-3 py-1.5 text-[9px]" style={{background:stageMeta[d.stage].bg}}>{stageMeta[d.stage].label}</span><b>{money(amount)}</b><span>{shortDate(d.deadline)}</span><button onClick={()=>{setSelectedDealId(d.id);setCurrentTab('deals')}} className="rounded-[9px] border border-[#e8e3de] bg-white px-3 py-2 text-[9px]">Открыть</button></div>}):<div className="py-20 text-center text-[11px] text-[#817a74]">Сделок нет</div>}</div></Card>}

      {tab==='tasks'&&<Card className="mt-5 p-5"><h2 className="text-[18px] font-semibold">Задачи клиента</h2><div className="mt-4 space-y-2">{clientTasks.length?clientTasks.map(t=><div key={t.id} className="flex flex-wrap items-center gap-3 rounded-[12px] bg-[#fbfaf8] px-4 py-3 text-[11px]"><span className={`h-2.5 w-2.5 rounded-full ${t.completed?'bg-[#88aa94]':'bg-[#d9a56e]'}`}/><b className="min-w-0 flex-1">{t.title}</b><span className="text-[#817a74]">{dateTime(t.deadline)}</span><span>{t.completed?'Готово':'Открыта'}</span></div>):<div className="py-16 text-center text-[11px] text-[#817a74]">Задач нет</div>}</div></Card>}

      {tab==='finance'&&<div className="mt-5 grid gap-4 xl:grid-cols-[1fr_1fr]"><Card className="p-5"><h2 className="text-[18px] font-semibold">Оплаты</h2><div className="mt-5 grid grid-cols-2 gap-3"><div className="rounded-[14px] bg-[#eef6f0] p-4"><div className="text-[10px] text-[#6c756d]">Получено</div><b className="mt-1 block text-[22px]">{money(paid)}</b></div><div className="rounded-[14px] bg-[#fbefef] p-4"><div className="text-[10px] text-[#7a6868]">Расходы</div><b className="mt-1 block text-[22px]">{money(expenses)}</b></div></div></Card><Card className="p-5"><h2 className="text-[18px] font-semibold">Движение денег</h2>{clientPayments.length?clientPayments.map(p=><div key={p.id} className="flex items-center border-b border-[#eeeae6] py-3 text-[10px]"><span className="w-[110px] text-[#817a74]">{shortDate(p.date)}</span><span className="min-w-0 flex-1 truncate">{p.dealTitle}</span><b className={p.direction==='inflow'?'text-[#52745d]':'text-[#a65d68]'}>{p.direction==='inflow'?'+':'−'}{money(p.amount)}</b></div>):<div className="py-16 text-center text-[11px] text-[#817a74]">Платежей нет</div>}</Card></div>}

      {tab==='documents'&&<Card className="mt-5 p-5"><h2 className="text-[18px] font-semibold">Документы клиента</h2>{documents.length?<div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">{documents.map(d=><div key={d.id} className="flex items-center gap-3 rounded-[12px] bg-[#fbfaf8] px-4 py-4 text-[11px]"><FileText size={16} className="text-[#817a74]"/><div className="min-w-0"><b className="block truncate">{d.name}</b><span className="text-[9px] text-[#817a74]">{d.kind||'Документ'}</span></div></div>)}</div>:<div className="py-16 text-center text-[11px] text-[#817a74]">Документов пока нет</div>}</Card>}
    </div>
  </div>;
};