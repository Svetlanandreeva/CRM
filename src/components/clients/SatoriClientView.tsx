import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Mail, MessageCircle, Pencil, Phone, Save, Send, UserRound, Wallet } from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import type { ClientStatus } from '../../types/crm';

const money=(v=0)=>`${new Intl.NumberFormat('ru-RU').format(Math.round(v))} ₽`;
const dateTime=(v?:string)=>{if(!v)return'—';const d=new Date(v);return Number.isNaN(d.getTime())?'—':new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}).format(d).replace('.','')};
type TimelineItem={id:string;channel:'email'|'telegram'|'activity';direction:'incoming'|'outgoing'|'internal';timestamp:string;body:string;sender:string;subject?:string|null};

const input='h-[40px] w-full rounded-[10px] border border-[#e5dfd9] bg-[#fbfaf8] px-3 text-[11px] outline-none focus:border-[#b9ada3] focus:bg-white';
const Card:React.FC<React.PropsWithChildren<{className?:string}>>=({children,className=''})=><section className={`rounded-[18px] border border-[#e6e0da] bg-white ${className}`}>{children}</section>;

export const SatoriClientView:React.FC=()=>{
  const{clients,selectedClientId,setCurrentTab,deals,payments,tasks,managers,updateClient,setSelectedDealId,setIsCreateDealOpen}=useCrm();
  const client=clients.find(c=>c.id===selectedClientId)||clients[0];
  const[editing,setEditing]=useState(false);
  const[form,setForm]=useState({name:'',company:'',phone:'',email:'',status:'Лид' as ClientStatus,source:'',manager:'Светлана'});
  const[history,setHistory]=useState<TimelineItem[]>([]);
  const[loading,setLoading]=useState(false);

  useEffect(()=>{if(!client)return;setForm({name:client.name,company:client.company||'',phone:client.phone||'',email:client.email||'',status:client.status,source:client.source,manager:client.assignedManager||'Светлана'});let live=true;setLoading(true);fetch(`/api/contacts/${encodeURIComponent(client.id)}/timeline`,{cache:'no-store'}).then(r=>r.json()).then(d=>{if(live)setHistory(Array.isArray(d?.history)?d.history:[])}).catch(()=>{if(live)setHistory([])}).finally(()=>live&&setLoading(false));return()=>{live=false}},[client?.id]);
  if(!client)return <div className="grid min-h-full place-items-center bg-[#f7f5f2] text-[11px] text-[#817a74]">Клиентов пока нет</div>;

  const clientDeals=deals.filter(d=>d.clientId===client.id);
  const activeDeals=clientDeals.filter(d=>!['closed_won','closed_lost'].includes(d.stage));
  const paid=payments.filter(p=>p.clientId===client.id&&p.direction==='inflow'&&p.status==='completed').reduce((s,p)=>s+p.amount,0);
  const paidDealIds=new Set(payments.filter(p=>p.clientId===client.id&&p.direction==='inflow'&&p.status==='completed').map(p=>p.dealId));
  const actualCost=clientDeals.filter(d=>paidDealIds.has(d.id)).reduce((s,d)=>s+Math.max(0,d.primeCost||0),0);
  const result=paid-actualCost;
  const managerShare=client.assignedManager&&client.assignedManager!=='Светлана'?Math.max(0,result)*.5:0;
  const openTasks=tasks.filter(t=>t.clientId===client.id&&!t.completed);
  const recent=useMemo(()=>[...history].sort((a,b)=>+new Date(b.timestamp)-+new Date(a.timestamp)).slice(0,12),[history]);

  const save=()=>{updateClient(client.id,{name:form.name,company:form.company||undefined,phone:form.phone,email:form.email,status:form.status,source:form.source as any,assignedManager:form.manager});setEditing(false)};
  const openDeal=(id:string)=>{setSelectedDealId(id);setCurrentTab('deals')};

  return <div className="min-h-[1000px] bg-[#f7f5f2] px-[38px] py-[26px] text-[#1f1d1c]">
    <div className="flex items-center justify-between"><div className="flex items-center gap-3"><button onClick={()=>setCurrentTab('clients')} className="grid h-[38px] w-[38px] place-items-center rounded-[11px] border border-[#e6e0da] bg-white"><ArrowLeft size={14}/></button><div><div className="text-[10px] text-[#8e867f]">Карточка клиента</div><h1 className="text-[28px] font-semibold tracking-[-.03em]">{client.name}</h1></div></div><div className="flex gap-2"><button onClick={()=>setCurrentTab('inbox')} className="flex h-[40px] items-center gap-2 rounded-[11px] border border-[#e6e0da] bg-white px-4 text-[10px]"><MessageCircle size={13}/>Сообщения</button><button onClick={()=>editing?save():setEditing(true)} className="flex h-[40px] items-center gap-2 rounded-[11px] bg-[#2a292b] px-4 text-[10px] font-medium text-white">{editing?<Save size={13}/>:<Pencil size={13}/>} {editing?'Сохранить':'Изменить'}</button></div></div>

    <div className="mt-5 grid grid-cols-4 gap-4"><Card className="p-4"><div className="text-[10px] text-[#817a74]">Активных сделок</div><b className="mt-1.5 block text-[22px]">{activeDeals.length}</b></Card><Card className="p-4"><div className="text-[10px] text-[#817a74]">Получено оплат</div><b className="mt-1.5 block text-[22px] text-[#55705f]">{money(paid)}</b></Card><Card className="p-4"><div className="text-[10px] text-[#817a74]">Фактический результат</div><b className={`mt-1.5 block text-[22px] ${result>=0?'text-[#55705f]':'text-[#b86673]'}`}>{money(result)}</b></Card><Card className="p-4"><div className="text-[10px] text-[#817a74]">Открытых задач</div><b className="mt-1.5 block text-[22px]">{openTasks.length}</b></Card></div>

    <div className="mt-4 grid grid-cols-[390px_1fr] gap-4">
      <div className="space-y-4">
        <Card className="p-5"><div className="flex items-center justify-between"><h2 className="text-[17px] font-semibold">Данные клиента</h2><UserRound size={15} className="text-[#8e867f]"/></div>{editing?<div className="mt-4 space-y-3"><label className="block text-[9px] text-[#817a74]">Имя<input value={form.name} onChange={e=>setForm(v=>({...v,name:e.target.value}))} className={`${input} mt-1`}/></label><label className="block text-[9px] text-[#817a74]">Компания<input value={form.company} onChange={e=>setForm(v=>({...v,company:e.target.value}))} className={`${input} mt-1`}/></label><label className="block text-[9px] text-[#817a74]">Телефон<input value={form.phone} onChange={e=>setForm(v=>({...v,phone:e.target.value}))} className={`${input} mt-1`}/></label><label className="block text-[9px] text-[#817a74]">Email<input value={form.email} onChange={e=>setForm(v=>({...v,email:e.target.value}))} className={`${input} mt-1`}/></label><label className="block text-[9px] text-[#817a74]">Статус<select value={form.status} onChange={e=>setForm(v=>({...v,status:e.target.value as ClientStatus}))} className={`${input} mt-1`}><option>Лид</option><option>Потенциальный</option><option>Активный</option><option>VIP</option><option>В архиве</option></select></label><label className="block text-[9px] text-[#817a74]">Источник<select value={form.source} onChange={e=>setForm(v=>({...v,source:e.target.value}))} className={`${input} mt-1`}><option>Сайт / SEO</option><option>WhatsApp</option><option>Telegram</option><option>Рекомендация</option><option>Выставка / Конференция</option><option>Instagram / Соцсети</option><option>Архитектор / Дизайнер</option></select></label></div>:<div className="mt-4 space-y-3 text-[10px]"><div className="flex items-center gap-2"><Phone size={12} className="text-[#8e867f]"/><span>{client.phone||'Телефон не указан'}</span></div><div className="flex items-center gap-2"><Mail size={12} className="text-[#8e867f]"/><span className="break-all">{client.email||'Email не указан'}</span></div><div><span className="text-[#8e867f]">Компания</span><b className="mt-0.5 block">{client.company||'—'}</b></div><div><span className="text-[#8e867f]">Статус</span><b className="mt-0.5 block">{client.status}</b></div><div><span className="text-[#8e867f]">Источник</span><b className="mt-0.5 block">{client.source}</b></div></div>}</Card>

        <Card className="p-5"><h2 className="text-[17px] font-semibold">Ответственный</h2><select value={editing?form.manager:client.assignedManager||'Светлана'} onChange={e=>{const name=e.target.value;if(editing)setForm(v=>({...v,manager:name}));else updateClient(client.id,{assignedManager:name})}} className={`${input} mt-4`}>{managers.map(m=><option key={m.id} value={m.name}>{m.name} · {m.role}</option>)}</select><div className="mt-3 rounded-[11px] bg-[#f7f3ee] p-3 text-[9px] leading-4 text-[#716963]">{(editing?form.manager:client.assignedManager)==='Светлана'?'Светлана ведёт клиента: 100% маржи остаётся владельцу.':'Менеджер ведёт клиента: 50% положительной маржи менеджеру, 50% владельцу.'}</div>{managerShare>0&&<div className="mt-3 flex text-[10px]"><span className="text-[#817a74]">Текущая доля менеджера</span><b className="ml-auto">{money(managerShare)}</b></div>}</Card>
      </div>

      <div className="space-y-4">
        <Card className="p-5"><div className="flex items-center justify-between"><h2 className="text-[17px] font-semibold">Сделки</h2><button onClick={()=>setIsCreateDealOpen(true)} className="rounded-[9px] bg-[#2a292b] px-3 py-2 text-[9px] text-white">+ Сделка</button></div><div className="mt-4 grid h-[36px] grid-cols-[2fr_130px_120px_120px] items-center rounded-[9px] bg-[#faf8f5] px-3 text-[8px] text-[#8e867f]"><span>Проект</span><span>Статус</span><span>Сумма</span><span>Получено</span></div>{clientDeals.map((d,i)=>{const p=payments.filter(x=>x.dealId===d.id&&x.direction==='inflow'&&x.status==='completed').reduce((s,x)=>s+x.amount,0);return <button key={d.id} onClick={()=>openDeal(d.id)} className={`grid min-h-[52px] w-full grid-cols-[2fr_130px_120px_120px] items-center px-3 text-left text-[9px] ${i%2?'bg-[#fcfbf9]':''}`}><b className="truncate text-[10px]">{d.title}</b><span>{d.stage==='production'?'Производство':d.stage==='closed_lost'?'Песочница':d.stage}</span><b>{money(d.amount)}</b><b className={p?'text-[#55705f]':'text-[#9a928b]'}>{money(p)}</b></button>})}{!clientDeals.length&&<div className="py-10 text-center text-[10px] text-[#8e867f]">Сделок нет</div>}</Card>

        <Card className="p-5"><div className="flex items-center justify-between"><h2 className="text-[17px] font-semibold">История общения</h2><span className="text-[9px] text-[#8e867f]">Email · Telegram · CRM</span></div><div className="mt-4 max-h-[430px] space-y-2 overflow-y-auto">{loading?<div className="py-16 text-center text-[10px] text-[#8e867f]">Загружаю…</div>:recent.map(item=><div key={item.id} className="flex gap-3 rounded-[12px] bg-[#fbfaf8] p-3"><span className={`grid h-8 w-8 shrink-0 place-items-center rounded-[9px] ${item.channel==='telegram'?'bg-[#dceaf7]':item.channel==='email'?'bg-[#f6e4cf]':'bg-[#ece8e4]'}`}>{item.channel==='telegram'?<Send size={11}/>:item.channel==='email'?<Mail size={11}/>:<MessageCircle size={11}/>}</span><div className="min-w-0 flex-1"><div className="flex text-[9px]"><b className="truncate">{item.sender}</b><span className="ml-auto text-[#8e867f]">{dateTime(item.timestamp)}</span></div><div className="mt-1 line-clamp-2 whitespace-pre-wrap text-[9px] leading-4 text-[#716963]">{item.body||item.subject||'Событие CRM'}</div></div></div>)}{!loading&&!recent.length&&<div className="py-16 text-center text-[10px] text-[#8e867f]">История пока пустая</div>}</div></Card>
      </div>
    </div>
  </div>;
};
