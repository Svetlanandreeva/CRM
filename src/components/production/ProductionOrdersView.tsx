import React from 'react';
import { CalendarDays, Factory, Wallet } from 'lucide-react';
import { useCrm } from '../../context/CrmContext';

const money=(v=0)=>`${new Intl.NumberFormat('ru-RU').format(Math.round(v))} ₽`;
const date=(v?:string)=>v?new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'short',year:'numeric'}).format(new Date(v)).replace('.',''):'—';

export const ProductionOrdersView:React.FC=()=>{
  const{deals,payments,setSelectedDealId,setCurrentTab}=useCrm();
  const production=deals.filter(d=>d.stage==='production'||d.stage==='ready').sort((a,b)=>+(new Date(a.deadline||'2999-12-31'))-+(new Date(b.deadline||'2999-12-31')));
  const paid=(id:string)=>payments.filter(p=>p.dealId===id&&p.direction==='inflow'&&p.status==='completed').reduce((s,p)=>s+p.amount,0);
  const open=(id:string)=>{setSelectedDealId(id);setCurrentTab('deals')};
  const total=production.reduce((s,d)=>s+d.amount,0);
  const received=production.reduce((s,d)=>s+paid(d.id),0);

  return <div className="min-h-[1000px] w-[1330px] bg-[#f7f5f2] px-[38px] py-[26px] text-[#1f1d1c]">
    <div><div className="text-[10px] font-medium uppercase tracking-[.12em] text-[#8e867f]">Исполнение заказов</div><h1 className="mt-1 text-[30px] font-semibold tracking-[-.035em]">Производство</h1><p className="mt-1 text-[11px] text-[#7c756f]">Сюда попадают только сделки со стадией «В производстве» или «Готово».</p></div>

    <div className="mt-5 grid grid-cols-3 gap-4">
      <section className="rounded-[18px] border border-[#e6e0da] bg-white p-4"><div className="flex items-center justify-between text-[10px] text-[#786f69]"><span>Проектов в производстве</span><Factory size={15}/></div><b className="mt-2 block text-[23px]">{production.length}</b></section>
      <section className="rounded-[18px] border border-[#e6e0da] bg-white p-4"><div className="flex items-center justify-between text-[10px] text-[#786f69]"><span>Сумма заказов</span><Wallet size={15}/></div><b className="mt-2 block text-[23px]">{money(total)}</b></section>
      <section className="rounded-[18px] border border-[#e6e0da] bg-white p-4"><div className="flex items-center justify-between text-[10px] text-[#786f69]"><span>Фактически получено</span><Wallet size={15} className="text-[#55705f]"/></div><b className="mt-2 block text-[23px] text-[#55705f]">{money(received)}</b></section>
    </div>

    <section className="mt-4 min-h-[620px] overflow-hidden rounded-[18px] border border-[#e6e0da] bg-white p-5">
      <div className="grid h-[42px] grid-cols-[2fr_1.1fr_120px_120px_130px_125px_100px] items-center rounded-[10px] bg-[#faf8f5] px-3 text-[9px] font-medium text-[#918983]"><span>Проект</span><span>Клиент</span><span>Старт</span><span>Дедлайн</span><span>Сумма</span><span>Получено</span><span>Статус</span></div>
      {production.map((d,i)=>{const receivedForDeal=paid(d.id);const start=d.productionStartDate||d.paymentDate||payments.find(p=>p.dealId===d.id&&p.direction==='inflow')?.date;const overdue=d.deadline&&+new Date(d.deadline)<Date.now();return <button key={d.id} onClick={()=>open(d.id)} className={`grid min-h-[66px] w-full grid-cols-[2fr_1.1fr_120px_120px_130px_125px_100px] items-center px-3 text-left text-[10px] ${i%2?'rounded-[10px] bg-[#fcfbf9]':''}`}><span className="min-w-0"><b className="block truncate text-[11px]">{d.title}</b><span className="mt-1 block text-[8px] text-[#948c86]">#{d.id.slice(0,8)}</span></span><span className="truncate">{d.clientName}</span><span>{date(start)}</span><span className={overdue?'text-[#b86673]':''}>{date(d.deadline)}</span><b>{money(d.amount)}</b><b className={receivedForDeal?'text-[#55705f]':'text-[#9a928b]'}>{money(receivedForDeal)}</b><span className={`w-fit rounded-full px-2.5 py-1 text-[8px] ${d.stage==='ready'?'bg-[#dce9df] text-[#4f705b]':'bg-[#e8ddf7] text-[#66547e]'}`}>{d.stage==='ready'?'Готово':'Производство'}</span></button>})}
      {!production.length&&<div className="grid h-[360px] place-items-center text-center text-[11px] leading-5 text-[#918a84]"><div><Factory className="mx-auto mb-3 opacity-40" size={24}/><b className="block text-[#5f5954]">Сейчас ничего не производится</b><span className="mt-1 block">Как только сделка перейдёт в «В производстве», она появится здесь.<br/>Никаких заказов из других стадий этот раздел больше не считает.</span></div></div>}
      {production.length>0&&<div className="mt-5 flex items-center gap-2 rounded-[12px] bg-[#f7f4ef] px-4 py-3 text-[9px] text-[#716963]"><CalendarDays size={13}/>Старт проекта берётся из даты фактической оплаты, а дедлайн — из срока сделки.</div>}
    </section>
  </div>;
};
