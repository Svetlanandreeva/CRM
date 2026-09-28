import React, { useMemo } from 'react';
import { CircleDollarSign, ReceiptText, UserRound, Wallet } from 'lucide-react';
import { useCrm } from '../../context/CrmContext';

const money=(v=0)=>`${new Intl.NumberFormat('ru-RU').format(Math.round(v))} ₽`;
const compact=(v=0)=>v>=1_000_000?`${(v/1_000_000).toLocaleString('ru-RU',{maximumFractionDigits:2})} млн ₽`:money(v);
const date=(v?:string)=>v?new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'short',year:'numeric'}).format(new Date(v)).replace('.',''):'—';

export const LiveEconomicsView:React.FC=()=>{
  const{deals,payments,setSelectedDealId,setCurrentTab}=useCrm();
  const paidByDeal=useMemo(()=>{const m=new Map<string,{amount:number,date:string}>();payments.filter(p=>p.direction==='inflow'&&p.status==='completed').forEach(p=>{const old=m.get(p.dealId);m.set(p.dealId,{amount:(old?.amount||0)+p.amount,date:!old||+new Date(p.date)<+new Date(old.date)?p.date:old.date})});return m},[payments]);
  const rows=deals.filter(d=>d.stage!=='closed_lost'&&(paidByDeal.get(d.id)?.amount||0)>0).map(d=>{
    const payment=paidByDeal.get(d.id)!;
    const cost=Math.max(0,d.primeCost||0);
    const result=payment.amount-cost;
    const managerShare=d.assignedManager&&d.assignedManager!=='Светлана'?Math.max(0,result)*.5:0;
    const ownerShare=result-managerShare;
    return{deal:d,paid:payment.amount,paymentDate:payment.date,cost,result,managerShare,ownerShare};
  }).sort((a,b)=>+new Date(b.paymentDate)-+new Date(a.paymentDate));
  const inflow=rows.reduce((s,r)=>s+r.paid,0);
  const costs=rows.reduce((s,r)=>s+r.cost,0);
  const result=inflow-costs;
  const managerShare=rows.reduce((s,r)=>s+r.managerShare,0);
  const ownerShare=rows.reduce((s,r)=>s+r.ownerShare,0);
  const open=(id:string)=>{setSelectedDealId(id);setCurrentTab('deals')};

  return <div className="min-h-[1000px] w-[1330px] bg-[#f7f5f2] px-[38px] py-[26px] text-[#1f1d1c]">
    <div><div className="text-[10px] font-medium uppercase tracking-[.12em] text-[#8e867f]">Фактические деньги</div><h1 className="mt-1 text-[30px] font-semibold tracking-[-.035em]">Экономика</h1><p className="mt-1 text-[11px] text-[#7c756f]">Здесь нет сделок без оплаты. Считаются только подтверждённые поступления и привязанные к ним расходы.</p></div>

    <div className="mt-5 grid grid-cols-4 gap-4">
      <section className="rounded-[18px] border border-[#e6e0da] bg-white p-4"><div className="flex items-center justify-between text-[10px] text-[#786f69]"><span>Получено</span><Wallet size={15}/></div><b className="mt-2 block text-[23px] text-[#55705f]">{compact(inflow)}</b></section>
      <section className="rounded-[18px] border border-[#e6e0da] bg-white p-4"><div className="flex items-center justify-between text-[10px] text-[#786f69]"><span>Расходы</span><ReceiptText size={15}/></div><b className="mt-2 block text-[23px]">{compact(costs)}</b></section>
      <section className="rounded-[18px] border border-[#e6e0da] bg-white p-4"><div className="flex items-center justify-between text-[10px] text-[#786f69]"><span>Фактический результат</span><CircleDollarSign size={15}/></div><b className={`mt-2 block text-[23px] ${result>=0?'text-[#55705f]':'text-[#b86673]'}`}>{compact(result)}</b></section>
      <section className="rounded-[18px] border border-[#e6e0da] bg-white p-4"><div className="flex items-center justify-between text-[10px] text-[#786f69]"><span>Сделок с оплатой</span><UserRound size={15}/></div><b className="mt-2 block text-[23px]">{rows.length}</b></section>
    </div>

    <div className="mt-4 grid grid-cols-[1fr_330px] gap-4">
      <section className="min-h-[650px] overflow-hidden rounded-[18px] border border-[#e6e0da] bg-white p-5">
        <div className="flex items-center justify-between"><h2 className="text-[17px] font-semibold">Проекты с фактической оплатой</h2><span className="text-[9px] text-[#8e867f]">без прогнозов</span></div>
        <div className="mt-4 grid h-[42px] grid-cols-[2fr_110px_120px_120px_115px_125px] items-center rounded-[10px] bg-[#faf8f5] px-3 text-[9px] font-medium text-[#918983]"><span>Проект</span><span>Оплата</span><span>Получено</span><span>Расходы</span><span>Результат</span><span>Ответственный</span></div>
        {rows.map((r,i)=><button key={r.deal.id} onClick={()=>open(r.deal.id)} className={`grid min-h-[66px] w-full grid-cols-[2fr_110px_120px_120px_115px_125px] items-center px-3 text-left text-[10px] ${i%2?'rounded-[10px] bg-[#fcfbf9]':''}`}><span className="min-w-0"><b className="block truncate text-[11px]">{r.deal.title}</b><span className="mt-1 block truncate text-[8px] text-[#948c86]">{r.deal.clientName}</span></span><span>{date(r.paymentDate)}</span><b className="text-[#55705f]">{money(r.paid)}</b><span>{money(r.cost)}</span><b className={r.result>=0?'text-[#55705f]':'text-[#b86673]'}>{money(r.result)}</b><span className="truncate">{r.deal.assignedManager||'Светлана'}</span></button>)}
        {!rows.length&&<div className="grid h-[360px] place-items-center text-center text-[11px] leading-5 text-[#918a84]">Пока нет сделок с подтверждённой оплатой.<br/>Нулевая оплата больше не создаёт «экономику» проекта.</div>}
      </section>

      <div className="space-y-4">
        <section className="rounded-[18px] border border-[#e6e0da] bg-white p-5"><h2 className="text-[17px] font-semibold">Распределение маржи</h2><div className="mt-4 space-y-3 text-[10px]"><div className="flex"><span className="text-[#817a74]">Владельцу</span><b className="ml-auto">{money(ownerShare)}</b></div><div className="flex"><span className="text-[#817a74]">Менеджерам</span><b className="ml-auto">{money(managerShare)}</b></div></div><div className="mt-4 rounded-[11px] bg-[#f7f3ee] p-3 text-[9px] leading-4 text-[#716963]">Если сделку ведёт Светлана — владельцу остаётся 100% результата. Если назначен менеджер — 50% положительной маржи менеджеру, 50% владельцу.</div></section>
        <section className="rounded-[18px] border border-[#e6e0da] bg-white p-5"><h2 className="text-[17px] font-semibold">Почему здесь меньше проектов</h2><p className="mt-3 text-[10px] leading-5 text-[#716963]">Раздел намеренно показывает только сделки, по которым деньги действительно поступили. Выставленный счёт и согласованная сумма сами по себе больше не считаются выручкой.</p></section>
      </div>
    </div>
  </div>;
};
