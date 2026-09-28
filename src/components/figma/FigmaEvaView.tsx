import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, CalendarDays, Loader2, Send, Sparkles, Wallet } from 'lucide-react';
import { useCrm } from '../../context/CrmContext';

type ChatItem={id:string;role:'user'|'assistant';text:string};
const active=(stage:string)=>!['closed_won','closed_lost'].includes(stage);
const ms=(value?:string)=>{if(!value)return 0;const x=+new Date(value);return Number.isFinite(x)?x:0};
const dateLabel=(value?:string)=>{const x=ms(value);if(!x)return'Без срока';const day=new Date();day.setHours(0,0,0,0);const target=new Date(x);target.setHours(0,0,0,0);const diff=Math.round((target.getTime()-day.getTime())/86400000);if(diff<0)return`Просрочено на ${Math.abs(diff)} дн.`;if(diff===0)return'Сегодня';if(diff===1)return'Завтра';return new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'short'}).format(target).replace('.','')};
const money=(v=0)=>`${new Intl.NumberFormat('ru-RU').format(Math.round(v))} ₽`;

export const FigmaEvaView:React.FC=()=>{
  const{deals,tasks,payments,setCurrentTab,setSelectedDealId}=useCrm();
  const[messages,setMessages]=useState<ChatItem[]>([{id:'hello',role:'assistant',text:'Я смотрю только на фактические данные CRM: этапы сделок, оплаты, задачи и дедлайны. Ниже — то, что действительно требует внимания сейчас.'}]);
  const[draft,setDraft]=useState('');const[busy,setBusy]=useState(false);const endRef=useRef<HTMLDivElement|null>(null);
  const now=Date.now();
  const openTasks=tasks.filter(t=>!t.completed);
  const overdueTasks=openTasks.filter(t=>ms(t.deadline)&&ms(t.deadline)<now);
  const nearDeadlines=deals.filter(d=>active(d.stage)&&ms(d.deadline)>=now&&ms(d.deadline)<=now+2*86400000);
  const overdueDeals=deals.filter(d=>active(d.stage)&&ms(d.deadline)&&ms(d.deadline)<now);
  const waitingPayment=deals.filter(d=>d.stage==='prepayment');
  const paidIds=new Set(payments.filter(p=>p.direction==='inflow'&&p.status==='completed'&&p.amount>0).map(p=>p.dealId));
  const productionNoPayment=deals.filter(d=>['production','ready'].includes(d.stage)&&!paidIds.has(d.id));
  const noNextStep=deals.filter(d=>active(d.stage)&&!openTasks.some(t=>t.dealId===d.id||(!t.dealId&&t.clientId===d.clientId)));

  const attention=useMemo(()=>{
    const rows=[
      ...overdueDeals.map(d=>({id:`deadline:${d.id}`,deal:d,title:`Просрочен дедлайн: ${d.title}`,why:`Срок проекта ${dateLabel(d.deadline)}`,rank:0})),
      ...waitingPayment.map(d=>({id:`payment:${d.id}`,deal:d,title:`Ждём оплату: ${d.title}`,why:`Сумма сделки ${money(d.amount)}`,rank:1})),
      ...nearDeadlines.map(d=>({id:`near:${d.id}`,deal:d,title:`Близкий дедлайн: ${d.title}`,why:`Сдать ${dateLabel(d.deadline)}`,rank:2})),
      ...noNextStep.map(d=>({id:`step:${d.id}`,deal:d,title:`Нет следующего шага: ${d.title}`,why:'По сделке нет открытой задачи',rank:3})),
    ];
    const seen=new Set<string>();return rows.sort((a,b)=>a.rank-b.rank).filter(r=>{if(seen.has(r.deal.id))return false;seen.add(r.deal.id);return true}).slice(0,6);
  },[deals,tasks,payments]);

  useEffect(()=>{requestAnimationFrame(()=>endRef.current?.scrollIntoView({block:'end'}))},[messages.length,busy]);
  async function send(textOverride?:string){const text=(textOverride??draft).trim();if(!text||busy)return;setMessages(v=>[...v,{id:`u${Date.now()}`,role:'user',text}]);setDraft('');setBusy(true);try{const r=await fetch('/api/assistant',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action:'chat',message:text})});const data=await r.json();if(!r.ok)throw new Error(data.error||'AI не ответил');setMessages(v=>[...v,{id:`a${Date.now()}`,role:'assistant',text:String(data.reply||'Готово.')}])}catch(e){setMessages(v=>[...v,{id:`e${Date.now()}`,role:'assistant',text:`Не удалось получить ответ: ${e instanceof Error?e.message:'ошибка'}`}])}finally{setBusy(false)}}
  async function plan(){if(busy)return;setBusy(true);try{const r=await fetch('/api/assistant',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action:'run',notify:false})});const data=await r.json();if(!r.ok)throw new Error(data.error||'Проверка не выполнена');setMessages(v=>[...v,{id:`p${Date.now()}`,role:'assistant',text:`План обновлён. Сейчас вижу: просроченных задач — ${overdueTasks.length}, просроченных проектов — ${overdueDeals.length}, ждут оплаты — ${waitingPayment.length}.`}])}catch(e){setMessages(v=>[...v,{id:`p${Date.now()}`,role:'assistant',text:`Не удалось обновить план: ${e instanceof Error?e.message:'ошибка'}`}])}finally{setBusy(false)}}
  const openDeal=(id:string)=>{setSelectedDealId(id);setCurrentTab('deals')};
  const quick=['Что реально просрочено?','Какие проекты сдавать первыми?','Сводка по оплатам','Кому написать сегодня?'];

  return <div className="min-h-[1000px] w-[1330px] bg-[#f7f5f2] px-[38px] py-[26px] text-[#1f1d1c]">
    <div className="flex items-end justify-between"><div><div className="text-[10px] font-medium uppercase tracking-[.12em] text-[#8e867f]">AI по данным CRM</div><h1 className="mt-1 text-[30px] font-semibold tracking-[-.035em]">Ева</h1><p className="mt-1 text-[11px] text-[#7c756f]">Каждая рекомендация должна иметь понятную причину и вести в конкретную сделку.</p></div><button onClick={()=>void plan()} className="flex h-[42px] items-center gap-2 rounded-[11px] bg-[#2a292b] px-5 text-[10px] font-medium text-white"><Sparkles size={13}/>Обновить план</button></div>

    <div className="mt-5 grid grid-cols-4 gap-4">
      <section className="rounded-[18px] border border-[#e6e0da] bg-white p-4"><div className="flex items-center justify-between text-[10px] text-[#817a74]"><span>Просроченные задачи</span><AlertCircle size={14}/></div><b className={`mt-2 block text-[22px] ${overdueTasks.length?'text-[#b86673]':''}`}>{overdueTasks.length}</b></section>
      <section className="rounded-[18px] border border-[#e6e0da] bg-white p-4"><div className="flex items-center justify-between text-[10px] text-[#817a74]"><span>Дедлайн ≤ 2 дней</span><CalendarDays size={14}/></div><b className="mt-2 block text-[22px]">{nearDeadlines.length}</b></section>
      <section className="rounded-[18px] border border-[#e6e0da] bg-white p-4"><div className="flex items-center justify-between text-[10px] text-[#817a74]"><span>Ждут оплату</span><Wallet size={14}/></div><b className="mt-2 block text-[22px]">{waitingPayment.length}</b></section>
      <section className="rounded-[18px] border border-[#e6e0da] bg-white p-4"><div className="flex items-center justify-between text-[10px] text-[#817a74]"><span>Производство без оплаты</span><AlertCircle size={14}/></div><b className={`mt-2 block text-[22px] ${productionNoPayment.length?'text-[#b86673]':''}`}>{productionNoPayment.length}</b></section>
    </div>

    <div className="mt-4 grid h-[710px] grid-cols-[1fr_420px] gap-4">
      <section className="flex min-h-0 flex-col overflow-hidden rounded-[18px] border border-[#e6e0da] bg-white"><header className="flex h-[58px] items-center border-b border-[#eee9e4] px-5"><Sparkles size={14} className="mr-2 text-[#80679f]"/><h2 className="text-[16px] font-semibold">Чат с Евой</h2><span className="ml-auto rounded-full bg-[#e6f0e8] px-3 py-1.5 text-[8px] text-[#55705f]">данные CRM</span></header><div className="min-h-0 flex-1 overflow-y-auto p-5">{messages.map(m=><div key={m.id} className={`mb-3 whitespace-pre-wrap rounded-[14px] px-4 py-3 text-[11px] leading-5 ${m.role==='user'?'ml-auto max-w-[72%] bg-[#dceaf7]':'max-w-[86%] bg-[#fbfaf8]'}`}>{m.text}</div>)}{busy&&<div className="w-fit rounded-[14px] bg-[#fbfaf8] px-4 py-3"><Loader2 size={14} className="animate-spin"/></div>}<div className="mt-3 flex flex-wrap gap-2">{quick.map(q=><button key={q} onClick={()=>void send(q)} className="rounded-[10px] border border-[#e6e0da] bg-white px-3 py-2 text-[9px]">{q}</button>)}</div><div ref={endRef}/></div><footer className="flex h-[62px] gap-2 border-t border-[#eee9e4] p-[10px]"><input value={draft} onChange={e=>setDraft(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')void send()}} placeholder="Спросить по сделкам, оплатам или срокам…" className="min-w-0 flex-1 rounded-[11px] border border-[#e6e0da] bg-[#fbfaf8] px-4 text-[11px] outline-none"/><button onClick={()=>void send()} disabled={busy||!draft.trim()} className="grid w-[74px] place-items-center rounded-[11px] bg-[#2a292b] text-white disabled:opacity-40"><Send size={14}/></button></footer></section>

      <section className="overflow-y-auto rounded-[18px] border border-[#e6e0da] bg-white p-5"><h2 className="text-[17px] font-semibold">Что требует внимания</h2><p className="mt-1 text-[9px] text-[#8e867f]">Без загадочного «просрочено на решение»: здесь указана конкретная причина.</p><div className="mt-4 space-y-2">{attention.map((r,i)=><button key={r.id} onClick={()=>openDeal(r.deal.id)} className="w-full rounded-[12px] bg-[#fbfaf8] p-4 text-left"><div className="flex items-start"><span className={`mr-3 grid h-7 w-7 shrink-0 place-items-center rounded-[9px] text-[10px] ${i===0?'bg-[#f4dde2] text-[#a45f6c]':'bg-[#eee8f7] text-[#705b8b]'}`}>{i+1}</span><span className="min-w-0 flex-1"><b className="block truncate text-[10px]">{r.title}</b><span className="mt-1 block text-[9px] leading-4 text-[#817a74]">Почему: {r.why}</span><span className="mt-2 block text-[8px] font-medium text-[#625c57]">Открыть сделку →</span></span></div></button>)}{!attention.length&&<div className="py-20 text-center text-[10px] leading-5 text-[#8e867f]">Сейчас нет подтверждённых критичных пунктов.<br/>Ева не будет придумывать их из пустых данных.</div>}</div></section>
    </div>
  </div>;
};
