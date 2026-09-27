import React, { useEffect, useMemo, useState } from 'react';
import { BarChart3, Check, MessageCircle, Moon, Sun, Wallet } from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { compactMoney, money } from './FigmaViews';
import type { Deal } from '../../types/crm';

type Thread = {
  key: string;
  channel: 'email'|'telegram';
  contactId: string|null;
  title: string;
  subtitle: string;
  lastSnippet: string;
  lastMessageAt: string;
  lastDirection: string;
  unreadCount: number;
};
type ActivityRow = { id:string; type?:string; description?:string; contactId?:string|null; dealId?:string|null; contactName?:string|null; createdAt?:string|number|null };
type EconomicsRow = { dealId:string; contactId?:string|null; contactName?:string|null; dealTitle?:string|null; receivedAmount?:number; totalCost?:number; profit?:number };

const Card:React.FC<React.PropsWithChildren<{className?:string;onClick?:()=>void}>>=({children,className='',onClick})=><section onClick={onClick} className={`rounded-[18px] border border-[#e8e3de] bg-white ${onClick?'cursor-pointer':''} ${className}`}>{children}</section>;
const dateMs=(value?:string|number|null)=>{if(value===null||value===undefined||value==='')return 0;const d=new Date(value);const ms=d.getTime();return Number.isNaN(ms)||d.getFullYear()<2000||d.getFullYear()>2100?0:ms};
const shortDate=(value?:string|number|null)=>{const ms=dateMs(value);return ms?new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'short'}).format(new Date(ms)).replace('.',''):'—'};
const dateTime=(value?:string|number|null)=>{const ms=dateMs(value);return ms?new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}).format(new Date(ms)).replace('.',''):'—'};
const mondayOf=(date:Date)=>{const d=new Date(date.getFullYear(),date.getMonth(),date.getDate());const day=d.getDay()||7;d.setDate(d.getDate()-day+1);return d};
const addDays=(date:Date,days:number)=>{const d=new Date(date);d.setDate(d.getDate()+days);return d};
const taskLabel=(value?:string)=>{const ms=dateMs(value);if(!ms)return'Без срока';const n=new Date(),d=new Date(ms);const a=new Date(n.getFullYear(),n.getMonth(),n.getDate()).getTime(),b=new Date(d.getFullYear(),d.getMonth(),d.getDate()).getTime();const delta=Math.round((b-a)/86400000);if(delta<0)return'Просрочено';if(delta===0)return'Сегодня';if(delta===1)return'Завтра';return shortDate(value)};
const activityTone=(type?:string)=>{const s=String(type||'').toLowerCase();if(s.includes('payment')||s.includes('оплат'))return'#d6eadf';if(s.includes('message')||s.includes('comment'))return'#dee9f7';if(s.includes('proposal')||s.includes('document'))return'#f2e3ce';if(s.includes('meeting')||s.includes('call'))return'#dde9f5';return'#f4d9c7'};
const donut=(parts:Array<{value:number;color:string}>)=>{const total=parts.reduce((s,p)=>s+Math.max(0,p.value),0);if(!total)return'#eee8e2';let cursor=0;const stops=parts.filter(p=>p.value>0).map(p=>{const start=cursor;cursor+=(p.value/total)*100;return`${p.color} ${start}% ${cursor}%`});return`conic-gradient(${stops.join(',')})`};

export const LiveDashboardView:React.FC=()=>{
  const {deals,tasks,payments,theme,toggleTheme,setCurrentTab,setSelectedClientId,setSelectedDealId}=useCrm();
  const[threads,setThreads]=useState<Thread[]>([]);
  const[activities,setActivities]=useState<ActivityRow[]>([]);
  const[economics,setEconomics]=useState<EconomicsRow[]>([]);
  const now=new Date();
  const dateLabel=new Intl.DateTimeFormat('ru-RU',{weekday:'long',day:'numeric',month:'long'}).format(now).replace(/^./,x=>x.toUpperCase());

  useEffect(()=>{
    let live=true;
    const load=async()=>{
      const [emailRes,tgRes,activityRes,econRes]=await Promise.all([
        fetch('/api/inbox?filter=client&search=',{cache:'no-store'}),fetch('/api/messages/telegram?search=',{cache:'no-store'}),fetch('/api/activities',{cache:'no-store'}),fetch('/api/economics',{cache:'no-store'}),
      ]);
      const [email,tg,activityData,econ]=await Promise.all([emailRes.json().catch(()=>({threads:[]})),tgRes.json().catch(()=>({threads:[]})),activityRes.json().catch(()=>[]),econRes.json().catch(()=>({deals:[]}))]);
      if(!live)return;
      const rows:Thread[]=[];
      if(emailRes.ok&&Array.isArray(email.threads))for(const t of email.threads)rows.push({key:`email:${t.id}`,channel:'email',contactId:t.contactId||null,title:t.remoteName||t.remoteEmail||'Email',subtitle:t.subject||t.remoteEmail||'',lastSnippet:t.lastSnippet||'',lastMessageAt:String(t.lastMessageAt||''),lastDirection:t.lastDirection||'',unreadCount:Number(t.unreadCount||0)});
      if(tgRes.ok&&Array.isArray(tg.threads))for(const t of tg.threads)rows.push({key:`telegram:${t.id}`,channel:'telegram',contactId:t.contactId||t.id||null,title:t.remoteName||'Telegram',subtitle:t.remoteHandle||'Telegram',lastSnippet:t.lastSnippet||'',lastMessageAt:String(t.lastMessageAt||''),lastDirection:t.lastDirection||'',unreadCount:Number(t.unreadCount||0)});
      rows.sort((a,b)=>dateMs(b.lastMessageAt)-dateMs(a.lastMessageAt));
      setThreads(rows.filter(r=>dateMs(r.lastMessageAt)));
      setActivities(activityRes.ok&&Array.isArray(activityData)?activityData.filter((a:any)=>dateMs(a.createdAt)):[]);
      setEconomics(econRes.ok&&Array.isArray(econ.deals)?econ.deals:[]);
    };
    void load(); const timer=window.setInterval(()=>void load(),60000); return()=>{live=false;window.clearInterval(timer)};
  },[]);

  const newLeads=deals.filter(d=>d.stage==='lead').length;
  const inWork=deals.filter(d=>['contacted','calculation'].includes(d.stage)).length;
  const agreement=deals.filter(d=>['proposal_sent','negotiation','prepayment'].includes(d.stage)).length;
  const groups=[
    {label:'Новая заявка',count:newLeads,color:'#8eb4df'},
    {label:'В работе',count:inWork,color:'#d7b188'},
    {label:'На согласовании',count:agreement,color:'#d98395'},
    {label:'Производство',count:deals.filter(d=>['production','ready'].includes(d.stage)).length,color:'#a497cd'},
    {label:'Доставка',count:deals.filter(d=>d.stage==='shipped').length,color:'#7897bb'},
    {label:'Закрыто',count:deals.filter(d=>['closed_won','closed_lost'].includes(d.stage)).length,color:'#7fa18f'},
  ];
  const stageDonut=donut(groups.map(g=>({value:g.count,color:g.color})));
  const liveDealIds=useMemo(()=>new Set(deals.map(d=>String(d.id))),[deals]);
  const linkedPayments=payments.filter(p=>liveDealIds.has(String(p.dealId))&&p.direction==='inflow'&&p.status==='completed');
  const confirmedPaid=linkedPayments.reduce((s,p)=>s+p.amount,0);
  const paidDeals=new Set(linkedPayments.filter(p=>p.amount>0).map(p=>String(p.dealId))).size;

  const openTasks=[...tasks].filter(t=>!t.completed).sort((a,b)=>(dateMs(a.deadline)||Infinity)-(dateMs(b.deadline)||Infinity)).slice(0,5);
  const recentActivities=[...activities].sort((a,b)=>dateMs(b.createdAt)-dateMs(a.createdAt)).slice(0,5);
  const recentThreads=threads.slice(0,5);

  const trend=useMemo(()=>{
    const start=new Date(now.getFullYear(),now.getMonth(),now.getDate()-9);
    return Array.from({length:10},(_,i)=>{const day=addDays(start,i);const count=deals.filter(d=>{const ms=dateMs(d.createdAt);if(!ms)return false;const x=new Date(ms);return x.getFullYear()===day.getFullYear()&&x.getMonth()===day.getMonth()&&x.getDate()===day.getDate()}).length;return{day,count}});
  },[deals,now.getFullYear(),now.getMonth(),now.getDate()]);
  const maxTrend=Math.max(1,...trend.map(x=>x.count));

  const weekStart=mondayOf(now),weekEnd=addDays(weekStart,7);
  const projectRows=deals.filter(d=>d.stage!=='closed_lost'&&dateMs(d.deadline)>0).filter(d=>dateMs(d.deadline)>=weekStart.getTime()&&dateMs(d.deadline)<weekEnd.getTime()).sort((a,b)=>dateMs(a.deadline)-dateMs(b.deadline)).slice(0,4);
  const projectBar=(deal:Deal)=>{const end=dateMs(deal.deadline);const start=Math.max(weekStart.getTime(),dateMs(deal.createdAt)||weekStart.getTime());const left=Math.max(0,Math.min(96,((start-weekStart.getTime())/(7*86400000))*100));const width=Math.max(5,Math.min(100-left,((Math.max(end,start+86400000)-start)/(7*86400000))*100));return{left:`${left}%`,width:`${width}%`}};
  const weekLabel=`${shortDate(weekStart.toISOString())} — ${shortDate(addDays(weekStart,6).toISOString())}`;

  const totalCosts=economics.filter(r=>liveDealIds.has(String(r.dealId))).reduce((s,r)=>s+Math.max(0,Number(r.totalCost||0))/100,0);
  const totalProfit=Math.max(0,confirmedPaid-totalCosts);
  const economyDonut=donut([{value:confirmedPaid,color:'#dcc9b7'},{value:totalCosts,color:'#8eb4df'}]);

  const openClient=(id:string|null)=>{if(!id){setCurrentTab('inbox');return}setSelectedClientId(id);setCurrentTab('client_cockpit')};
  const openDeal=(deal:Deal)=>{setSelectedDealId(deal.id);setCurrentTab('deals')};

  return <div className="relative min-h-[1065px] w-[1330px] bg-[#f7f5f2] px-[42px] py-[28px] text-[#1f1d1c]">
    <header className="flex h-[40px] items-start justify-between">
      <div className="flex items-baseline gap-4"><h1 className="text-[34px] font-semibold leading-none tracking-[-.035em]">Главная</h1><span className="text-[13px] text-[#817a74]">{dateLabel}</span></div>
      <button onClick={toggleTheme} className="flex h-[44px] w-[126px] items-center justify-around rounded-[22px] border border-[#eeeae6] bg-white"><Sun size={17}/><Moon size={16} className={theme==='dark'?'text-[#24211f]':'text-[#817a74]'}/></button>
    </header>

    <div className="mt-[18px] grid grid-cols-[repeat(4,270px)] gap-[25px]">
      {[
        {icon:<MessageCircle size={20}/>,bg:'#dcebfa',value:newLeads,label:'Новые заявки'},
        {icon:<BarChart3 size={20}/>,bg:'#f8e5d2',value:inWork,label:'В работе'},
        {icon:<Check size={20}/>,bg:'#f5d4da',value:agreement,label:'На согласовании'},
        {icon:<Wallet size={20}/>,bg:'#e5defa',value:compactMoney(confirmedPaid),label:'Получено оплат',onClick:()=>setCurrentTab('deals')},
      ].map(item=><Card key={item.label} onClick={item.onClick} className="relative h-[110px]"><span className="absolute left-[18px] top-[20px] grid h-[56px] w-[56px] place-items-center rounded-[16px]" style={{background:item.bg}}>{item.icon}</span><b className="absolute left-[90px] top-[18px] max-w-[164px] truncate text-[23px] font-medium">{item.value}</b><span className="absolute left-[90px] top-[56px] text-[12px] text-[#6d6762]">{item.label}</span></Card>)}
    </div>

    <div className="mt-[18px] grid grid-cols-[715px_512px] gap-[18px]">
      <Card className="h-[250px] p-[20px]">
        <div className="flex items-center justify-between"><h2 className="text-[18px] font-semibold">Динамика сделок</h2><span className="text-[9px] text-[#817a74]">Последние 10 дней</span></div>
        <div className="relative mt-[16px] h-[170px]">
          {[18,55,92,129].map(y=><i key={y} className="absolute inset-x-0 border-t border-[#eeeae6]" style={{top:y}}/>)}
          <div className="absolute inset-x-2 bottom-[24px] top-0 flex items-end gap-[18px]">{trend.map((item,i)=><div key={i} className="flex h-full flex-1 items-end"><i className="w-full rounded-[7px] bg-[#d8e5f6]" style={{height:`${Math.max(4,item.count/maxTrend*100)}%`}}/></div>)}</div>
          <div className="absolute inset-x-0 bottom-0 flex justify-between text-[8px] text-[#817a74]">{trend.filter((_,i)=>[0,3,6,9].includes(i)).map(x=><span key={x.day.toISOString()}>{shortDate(x.day.toISOString())}</span>)}</div>
        </div>
      </Card>
      <Card className="h-[250px] p-[20px]" onClick={()=>setCurrentTab('pipeline')}>
        <h2 className="text-[18px] font-semibold">Распределение по этапам</h2>
        <div className="mt-[15px] grid grid-cols-[1fr_168px] items-center gap-3"><div className="space-y-[9px]">{groups.map(g=><div key={g.label} className="flex items-center text-[10px]"><i className="mr-3 h-[10px] w-[10px] rounded-full" style={{background:g.color}}/><span className="flex-1 text-[#514c48]">{g.label}</span><b>{g.count}</b></div>)}</div><div className="relative mx-auto h-[160px] w-[160px] rounded-full" style={{background:stageDonut}}><div className="absolute inset-[26px] grid place-items-center rounded-full bg-white text-center"><div><b className="text-[26px]">{deals.length}</b><div className="text-[10px] text-[#706a65]">Всего сделок</div></div></div></div></div>
      </Card>
    </div>

    <div className="mt-[16px] grid grid-cols-[470px_370px_377px] gap-[14px]">
      <Card className="h-[310px] p-[20px]"><h2 className="text-[18px] font-semibold">Ближайшие задачи</h2><div className="mt-[18px] space-y-[8px]">{openTasks.length?openTasks.map((t,i)=><button key={t.id} onClick={()=>t.clientId?openClient(t.clientId):setCurrentTab('calendar')} className="flex h-[36px] w-full items-center rounded-[10px] bg-[#fbfaf8] px-3 text-left"><i className="mr-3 h-4 w-4 rounded-full" style={{background:i===0?'#8eb4df':'#e9e5e0'}}/><span className="min-w-0 flex-1 truncate text-[10px]">{t.title}{t.clientName?` — ${t.clientName}`:''}</span><span className={`ml-3 text-[8px] ${taskLabel(t.deadline)==='Просрочено'?'text-[#c56f7f]':'text-[#8a837d]'}`}>{taskLabel(t.deadline)}</span></button>):<div className="grid h-[200px] place-items-center text-[10px] text-[#817a74]">Открытых задач нет</div>}</div></Card>
      <Card className="h-[310px] p-[20px]"><h2 className="text-[18px] font-semibold">Последние активности</h2><div className="mt-[18px] space-y-[6px]">{recentActivities.length?recentActivities.map(r=><button key={r.id} onClick={()=>r.contactId?openClient(r.contactId):undefined} className="flex h-[40px] w-full items-start text-left"><i className="mr-[10px] h-[40px] w-[40px] shrink-0 rounded-[12px]" style={{background:activityTone(r.type)}}/><span className="min-w-0 flex-1 pt-1"><b className="block truncate text-[10px]">{r.contactName||'CRM'}</b><span className="mt-1 block truncate text-[8px] text-[#7b746e]">{r.description||r.type||'Активность'} · {dateTime(r.createdAt)}</span></span></button>):<div className="grid h-[200px] place-items-center text-[10px] text-[#817a74]">Активностей нет</div>}</div></Card>
      <Card className="h-[310px] p-[20px]"><div className="flex items-center justify-between"><h2 className="text-[18px] font-semibold">Чаты</h2><button onClick={()=>setCurrentTab('inbox')} className="text-[9px] text-[#817a74]">Все →</button></div><div className="mt-[18px] space-y-[6px]">{recentThreads.length?recentThreads.map(t=><button key={t.key} onClick={()=>openClient(t.contactId)} className="flex h-[40px] w-full items-center text-left"><span className={`mr-[10px] grid h-[38px] w-[38px] shrink-0 place-items-center rounded-full text-[9px] ${t.channel==='telegram'?'bg-[#cad3ec]':'bg-[#f0d6c8]'}`}>{t.title.slice(0,1).toUpperCase()}</span><span className="min-w-0 flex-1"><b className="block truncate text-[10px]">{t.title}</b><span className="mt-1 block truncate text-[8px] text-[#7e7772]">{t.lastSnippet||t.subtitle}</span></span>{t.unreadCount>0&&<span className="ml-2 rounded-full bg-[#d98395] px-2 py-1 text-[8px] text-white">{t.unreadCount}</span>}</button>):<div className="grid h-[200px] place-items-center text-[10px] text-[#817a74]">Диалогов нет</div>}</div></Card>
    </div>

    <div className="mt-[16px] grid grid-cols-[720px_507px] gap-[18px]">
      <Card className="h-[160px] p-[20px]" onClick={()=>setCurrentTab('calendar')}><div className="flex items-baseline gap-[38px]"><h2 className="text-[18px] font-semibold">Календарь проектов</h2><span className="text-[10px] text-[#49443f]">{weekLabel}</span></div>{projectRows.length?<div className="mt-[17px] space-y-[8px]">{projectRows.map((d,i)=>{const bar=projectBar(d);const colors=['#dcc9b7','#7fa18f','#b7aedc','#a69bc3'];return <button key={d.id} onClick={e=>{e.stopPropagation();openDeal(d)}} className="grid h-[16px] w-full grid-cols-[180px_1fr] items-center text-left"><span className="truncate text-[9px] text-[#3d3936]">{d.title}</span><span className="relative h-[14px]"><i className="absolute top-0 h-[14px] rounded-[7px]" style={{...bar,background:colors[i%colors.length]}}/></span></button>})}</div>:<div className="grid h-[82px] place-items-center text-[10px] text-[#817a74]">На этой неделе проекты со сроками не назначены</div>}</Card>
      <Card className="h-[160px] p-[20px]" onClick={()=>setCurrentTab('finance')}><h2 className="text-[18px] font-semibold">Экономика</h2><div className="mt-[8px] grid grid-cols-[150px_1fr] items-center gap-4"><div className="relative mx-auto h-[112px] w-[112px] rounded-full" style={{background:economyDonut}}><div className="absolute inset-[22px] grid place-items-center rounded-full bg-white text-center"><div><b className="text-[13px]">{compactMoney(confirmedPaid)}</b><div className="text-[8px] text-[#756e68]">получено</div></div></div></div><div className="space-y-[10px] text-[10px]"><div className="flex items-center"><i className="mr-3 h-[10px] w-[10px] rounded-full bg-[#dcc9b7]"/><span className="flex-1 text-[#514b47]">Подтверждено оплат</span><b>{money(confirmedPaid)}</b></div><div className="flex items-center"><i className="mr-3 h-[10px] w-[10px] rounded-full bg-[#8eb4df]"/><span className="flex-1 text-[#514b47]">Факт. расходы</span><b>{money(totalCosts)}</b></div><div className="flex items-center"><i className="mr-3 h-[10px] w-[10px] rounded-full bg-[#7fa18f]"/><span className="flex-1 text-[#514b47]">Результат</span><b>{money(totalProfit)}</b></div><div className="text-[8px] text-[#8a837d]">Сделок с оплатой: {paidDeals}</div></div></div></Card>
    </div>
  </div>;
};
