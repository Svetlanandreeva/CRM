import React, { useMemo } from 'react';
import { BarChart3, CircleDollarSign, PieChart, Users } from 'lucide-react';
import { useCrm } from '../../context/CrmContext';

const money=(v=0)=>`${new Intl.NumberFormat('ru-RU').format(Math.round(v))} ₽`;
const active=(stage:string)=>!['closed_won','closed_lost'].includes(stage);

export const AnalyticsView:React.FC=()=>{
  const{clients,deals,payments}=useCrm();
  const paidByDeal=useMemo(()=>{const m=new Map<string,number>();payments.filter(p=>p.direction==='inflow'&&p.status==='completed').forEach(p=>m.set(p.dealId,(m.get(p.dealId)||0)+p.amount));return m},[payments]);
  const working=deals.filter(d=>active(d.stage));
  const withPayment=deals.filter(d=>d.stage!=='closed_lost'&&(paidByDeal.get(d.id)||0)>0);
  const received=withPayment.reduce((s,d)=>s+(paidByDeal.get(d.id)||0),0);
  const actualCosts=withPayment.reduce((s,d)=>s+Math.max(0,d.primeCost||0),0);
  const actualResult=received-actualCosts;
  const won=deals.filter(d=>d.stage==='closed_won');
  const lost=deals.filter(d=>d.stage==='closed_lost');
  const closed=won.length+lost.length;
  const conversion=closed?Math.round(won.length/closed*100):0;
  const avgPaid=withPayment.length?received/withPayment.length:0;

  const sources=useMemo(()=>{
    const map=new Map<string,{clients:number,deals:number,paid:number}>();
    clients.forEach(c=>map.set(c.source,{clients:(map.get(c.source)?.clients||0)+1,deals:map.get(c.source)?.deals||0,paid:map.get(c.source)?.paid||0}));
    deals.forEach(d=>{const source=clients.find(c=>c.id===d.clientId)?.source||'Не указан';const old=map.get(source)||{clients:0,deals:0,paid:0};map.set(source,{...old,deals:old.deals+1,paid:old.paid+(paidByDeal.get(d.id)||0)})});
    return Array.from(map.entries()).map(([name,v])=>({name,...v})).sort((a,b)=>b.clients-a.clients);
  },[clients,deals,paidByDeal]);

  const stages=Object.entries({lead:'Новый запрос',contacted:'Связались',calculation:'Расчёт',proposal_sent:'КП / счёт',negotiation:'Согласование',prepayment:'Ожидает оплаты',production:'Производство',ready:'Готово',shipped:'Доставка',closed_won:'Завершено'}).map(([id,label])=>({id,label,count:deals.filter(d=>d.stage===id).length,sum:deals.filter(d=>d.stage===id).reduce((s,d)=>s+d.amount,0)}));
  const maxStage=Math.max(1,...stages.map(s=>s.count));

  const lostReasons=useMemo(()=>{const map=new Map<string,number>();lost.forEach(d=>{const reason=d.lostReason?.trim()||'Причина не указана';map.set(reason,(map.get(reason)||0)+1)});return Array.from(map.entries()).map(([reason,count])=>({reason,count})).sort((a,b)=>b.count-a.count)},[lost]);

  const managerStats=useMemo(()=>{const map=new Map<string,{deals:number,paid:number,result:number,share:number}>();withPayment.forEach(d=>{const manager=d.assignedManager||'Светлана';const paid=paidByDeal.get(d.id)||0;const result=paid-Math.max(0,d.primeCost||0);const old=map.get(manager)||{deals:0,paid:0,result:0,share:0};const share=manager==='Светлана'?0:Math.max(0,result)*.5;map.set(manager,{deals:old.deals+1,paid:old.paid+paid,result:old.result+result,share:old.share+share})});return Array.from(map.entries()).map(([name,v])=>({name,...v}))},[withPayment,paidByDeal]);

  return <div className="min-h-[1000px] w-[1330px] bg-[#f7f5f2] px-[38px] py-[26px] text-[#1f1d1c]">
    <div><div className="text-[10px] font-medium uppercase tracking-[.12em] text-[#8e867f]">Без заглушек</div><h1 className="mt-1 text-[30px] font-semibold tracking-[-.035em]">Аналитика</h1><p className="mt-1 text-[11px] text-[#7c756f]">Все показатели ниже рассчитаны только из текущих клиентов, сделок и фактических оплат CRM.</p></div>

    <div className="mt-5 grid grid-cols-4 gap-4">
      {[[money(received),'Получено оплат',CircleDollarSign],[money(actualResult),'Фактический результат',BarChart3],[`${conversion}%`,'Конверсия закрытых',PieChart],[clients.length,'Клиентов в CRM',Users]].map(([value,label,Icon]:any)=><section key={label} className="rounded-[18px] border border-[#e6e0da] bg-white p-4"><div className="flex items-center justify-between text-[10px] text-[#786f69]"><span>{label}</span><Icon size={15}/></div><b className="mt-2 block text-[23px]">{value}</b></section>)}
    </div>

    <div className="mt-4 grid grid-cols-[1fr_400px] gap-4">
      <section className="rounded-[18px] border border-[#e6e0da] bg-white p-5">
        <div className="flex items-center justify-between"><h2 className="text-[17px] font-semibold">Воронка</h2><span className="text-[9px] text-[#8e867f]">{working.length} активных · {money(working.reduce((s,d)=>s+d.amount,0))}</span></div>
        <div className="mt-4 space-y-3">{stages.map(s=><div key={s.id} className="grid grid-cols-[150px_1fr_45px_120px] items-center gap-3 text-[9px]"><span className="truncate text-[#625c57]">{s.label}</span><span className="h-2 overflow-hidden rounded-full bg-[#f0ece8]"><i className="block h-full rounded-full bg-[#b8c9dc]" style={{width:`${s.count?Math.max(5,s.count/maxStage*100):0}%`}}/></span><b className="text-right">{s.count}</b><b className="text-right">{money(s.sum)}</b></div>)}</div>
      </section>

      <section className="rounded-[18px] border border-[#e6e0da] bg-white p-5"><h2 className="text-[17px] font-semibold">Фактические деньги</h2><div className="mt-4 space-y-3 text-[10px]"><div className="flex"><span className="text-[#817a74]">Сделок с оплатой</span><b className="ml-auto">{withPayment.length}</b></div><div className="flex"><span className="text-[#817a74]">Средний полученный платёж</span><b className="ml-auto">{money(avgPaid)}</b></div><div className="flex"><span className="text-[#817a74]">Получено</span><b className="ml-auto text-[#55705f]">{money(received)}</b></div><div className="flex"><span className="text-[#817a74]">Расходы по этим проектам</span><b className="ml-auto">{money(actualCosts)}</b></div><div className="flex border-t border-[#eee9e4] pt-3"><span className="text-[#817a74]">Результат</span><b className={`ml-auto ${actualResult>=0?'text-[#55705f]':'text-[#b86673]'}`}>{money(actualResult)}</b></div></div></section>
    </div>

    <div className="mt-4 grid grid-cols-2 gap-4">
      <section className="rounded-[18px] border border-[#e6e0da] bg-white p-5"><h2 className="text-[17px] font-semibold">Источники клиентов</h2><p className="mt-1 text-[9px] text-[#8e867f]">Не выдуманные каналы — только поле «Источник» в карточках клиентов.</p><div className="mt-4 grid h-[36px] grid-cols-[1.7fr_70px_70px_120px] items-center rounded-[9px] bg-[#faf8f5] px-3 text-[8px] text-[#8e867f]"><span>Источник</span><span>Клиенты</span><span>Сделки</span><span>Получено</span></div>{sources.map((s,i)=><div key={s.name} className={`grid min-h-[42px] grid-cols-[1.7fr_70px_70px_120px] items-center px-3 text-[9px] ${i%2?'bg-[#fcfbf9]':''}`}><b className="truncate">{s.name}</b><span>{s.clients}</span><span>{s.deals}</span><b>{money(s.paid)}</b></div>)}{!sources.length&&<div className="py-14 text-center text-[10px] text-[#8e867f]">Нет данных</div>}</section>
      <section className="rounded-[18px] border border-[#e6e0da] bg-white p-5"><h2 className="text-[17px] font-semibold">Ответственные и доля менеджера</h2><div className="mt-4 space-y-2">{managerStats.map(m=><div key={m.name} className="rounded-[12px] bg-[#fbfaf8] p-3"><div className="flex text-[10px]"><b>{m.name}</b><span className="ml-auto text-[#817a74]">{m.deals} сделок с оплатой</span></div><div className="mt-2 flex text-[9px] text-[#6f6862]"><span>получено {money(m.paid)}</span><span className="ml-auto">доля менеджера {money(m.share)}</span></div></div>)}{!managerStats.length&&<div className="py-14 text-center text-[10px] text-[#8e867f]">Пока нет оплаченных сделок</div>}</div></section>
    </div>

    <section className="mt-4 rounded-[18px] border border-[#e6e0da] bg-white p-5"><h2 className="text-[17px] font-semibold">Причины отказов</h2><p className="mt-1 text-[9px] text-[#8e867f]">Только реальные сделки из песочницы. Если причина не заполнена, CRM так и пишет.</p><div className="mt-4 flex flex-wrap gap-2">{lostReasons.map(r=><div key={r.reason} className="rounded-[12px] bg-[#faf2f3] px-4 py-3 text-[10px]"><b>{r.count}</b><span className="ml-2 text-[#765f64]">{r.reason}</span></div>)}{!lostReasons.length&&<span className="text-[10px] text-[#8e867f]">Отказов пока нет.</span>}</div></section>
  </div>;
};
