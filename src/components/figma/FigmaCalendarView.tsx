import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import type { Deal } from '../../types/crm';

const DAY=24*60*60*1000;
const VISIBLE_START=new Date(2026,8,23);
const VISIBLE_END_EXCLUSIVE=new Date(2026,8,30);
const days=[['23','Пн'],['24','Вт'],['25','Ср'],['26','Чт'],['27','Пт'],['28','Сб'],['29','Вс']];
const code=(i:number)=>`S-${128+i}`;
const timelineLeft=(percent:number)=>`${22.04+percent*.7796}%`;
const timelineWidth=(percent:number)=>`${percent*.7796}%`;
const dayOnly=(value:string|Date)=>{const d=value instanceof Date?new Date(value):new Date(value);if(Number.isNaN(d.getTime()))return null;return new Date(d.getFullYear(),d.getMonth(),d.getDate())};
const shortDate=(date:Date)=>new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'short'}).format(date).replace('.','');
const projectBar=(start:Date,end:Date)=>{const startMs=Math.max(start.getTime(),VISIBLE_START.getTime());const endExclusive=Math.min(end.getTime()+DAY,VISIBLE_END_EXCLUSIVE.getTime());if(endExclusive<=startMs)return null;const left=((startMs-VISIBLE_START.getTime())/(7*DAY))*100;const width=((endExclusive-startMs)/(7*DAY))*100;return{left,width}};

type Row={deal:Deal;paidAt:Date;deadline:Date;bar:{left:number;width:number}};

export const FigmaCalendarView:React.FC=()=>{
  const{deals,payments,documents,setSelectedDealId,setCurrentTab,theme,toggleTheme}=useCrm();
  const rows=React.useMemo<Row[]>(()=>deals
    .filter(d=>d.stage==='production')
    .map(deal=>{
      const paidPayment=[...payments]
        .filter(p=>p.dealId===deal.id&&p.direction==='inflow'&&p.status==='completed')
        .sort((a,b)=>+new Date(a.date)-+new Date(b.date))[0];
      const paidDocument=[...documents]
        .filter(doc=>doc.dealId===deal.id&&doc.paidAt)
        .sort((a,b)=>+new Date(a.paidAt!)-+new Date(b.paidAt!))[0];
      const paidAt=dayOnly(paidPayment?.date||paidDocument?.paidAt||'');
      const deadline=dayOnly(deal.deadline);
      if(!paidAt||!deadline||deadline<paidAt)return null;
      const bar=projectBar(paidAt,deadline);
      if(!bar)return null;
      return{deal,paidAt,deadline,bar};
    })
    .filter((row):row is Row=>Boolean(row))
    .sort((a,b)=>a.deadline.getTime()-b.deadline.getTime())
    .slice(0,8),[deals,payments,documents]);

  return <div className="relative h-[1000px] min-w-[1080px] overflow-hidden bg-[#f7f5f2] text-[#202020]">
    <div className="absolute left-[42px] top-[24px] flex items-baseline gap-4"><h1 className="text-[34px] font-semibold leading-none tracking-[-.035em]">Календарь проектов</h1><span className="text-[13px] text-[#7d756e]">Только оплаченные проекты, уже запущенные в производство</span></div>
    <button onClick={toggleTheme} className="absolute right-[54px] top-[20px] flex h-[44px] w-[126px] items-center justify-around rounded-[22px] bg-white"><Sun size={17}/><Moon size={16} className={theme==='dark'?'text-[#202020]':'text-[#7d756e]'}/></button>
    <div className="absolute left-[42px] top-[82px] flex h-[40px] gap-[12px]"><button className="w-[192px] rounded-[12px] border border-[#ebe5e0] bg-white text-[11px] font-medium">23 — 29 сентября</button><button className="w-[40px] rounded-[12px] border border-[#ebe5e0] bg-white text-[20px]">‹</button><button className="w-[40px] rounded-[12px] border border-[#ebe5e0] bg-white text-[20px]">›</button><button className="w-[92px] rounded-[12px] border border-[#ebe5e0] bg-white text-[11px] font-medium">Сегодня</button></div>
    <div className="absolute right-[54px] top-[82px] flex h-[40px] gap-[8px]"><button className="w-[96px] rounded-[12px] bg-[#2a292b] text-[11px] text-white">Неделя</button><button className="w-[92px] rounded-[12px] border border-[#ebe5e0] bg-white text-[11px]">Месяц</button></div>
    <section className="absolute left-[42px] right-[42px] top-[144px] h-[806px] overflow-hidden rounded-[18px] border border-[#ebe5e0] bg-white">
      <div className="absolute left-[20px] top-[17px] flex items-baseline gap-6"><h2 className="text-[19px] font-semibold">Календарь проектов</h2><span className="text-[11px] text-[#7d756e]">23 — 29 сентября 2026</span></div>
      <div className="absolute right-[32px] top-[20px] text-[9px] text-[#7fa18f]">● производство · от оплаты до срока по договору</div>
      <div className="absolute left-[16px] right-[16px] top-[59px] h-[52px] rounded-[12px] bg-[#fbfaf7]"/>
      <div className="absolute left-[16px] top-[59px] bottom-[42px] w-[264px] border-r border-[#ebe5e0]"><span className="absolute left-[16px] top-[16px] text-[10px] text-[#7d756e]">Проект</span></div>
      <div className="absolute left-[280px] right-[16px] top-[59px] bottom-[42px] grid grid-cols-7">
        {days.map(([d,w],i)=><div key={d} className={`relative border-r border-[#ebe5e0] ${i===3?'bg-[#fbf4ec]':''}`}><div className="absolute left-0 right-0 top-[8px] text-center text-[11px] font-semibold">{d}</div><div className={`absolute left-0 right-0 top-[26px] text-center text-[9px] ${i===3?'text-[#c7616b]':'text-[#7d756e]'}`}>{w}</div></div>)}
      </div>
      <div className="absolute left-[16px] right-[16px] top-[111px]">
        {rows.length===0&&<div className="px-[16px] py-[34px] text-[11px] text-[#8b847e]">На этой неделе нет оплаченных проектов со статусом «Производство».</div>}
        {rows.map((row,i)=>{const overdue=row.deadline.getTime()<new Date(2026,8,26).getTime();return <button key={row.deal.id} onClick={()=>{setSelectedDealId(row.deal.id);setCurrentTab('deals')}} className={`relative block h-[75px] w-full border-b border-[#ebe5e0] text-left ${i%2?'bg-[#fbfaf7]':'bg-white'}`}>
          <span className="absolute left-[16px] top-[19px] text-[10px] font-medium text-[#7d756e]">{code(i)}</span>
          <span className="absolute left-[74px] top-[17px] w-[185px] truncate text-[11px] font-semibold">{row.deal.title} · {row.deal.clientName}</span>
          <span className="absolute left-[74px] top-[39px] w-[185px] truncate text-[9px] text-[#7d756e]">Оплата {shortDate(row.paidAt)} · договор до {shortDate(row.deadline)}</span>
          <span className="absolute top-[20px] h-[30px] overflow-hidden rounded-[15px] bg-[#7fa18f] px-[12px] pt-[7px] text-[9px] font-medium" style={{left:timelineLeft(row.bar.left),width:timelineWidth(row.bar.width)}}>Производство</span>
          <span className={`absolute right-[12px] bottom-[6px] text-[8px] ${overdue?'text-[#c7616b]':'text-[#7d756e]'}`}>{overdue?'срок по договору истёк':'по договору '+shortDate(row.deadline)}</span>
        </button>})}
      </div>
      <div className="absolute bottom-[41px] top-[111px] w-px bg-[#e3999e]" style={{left:'60.5%'}}/>
      <div className="absolute bottom-[25px] text-[8px] text-[#c7616b]" style={{left:'58.5%'}}>сегодня</div>
    </section>
  </div>;
};
