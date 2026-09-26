import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import type { Deal, DealStage } from '../../types/crm';

const stageStyle:Record<DealStage,{label:string;color:string}>={
  lead:{label:'Ответ клиенту',color:'#edc7d1'},contacted:{label:'Переговоры',color:'#a69bc3'},calculation:{label:'Расчёт → КП',color:'#d4e3f2'},proposal_sent:{label:'КП / ожидаем ответ',color:'#b7aedc'},negotiation:{label:'Согласование',color:'#dcc9b7'},prepayment:{label:'Ожидает оплаты',color:'#b7aedc'},production:{label:'Производство',color:'#7fa18f'},ready:{label:'Подготовка образца',color:'#7fa18f'},shipped:{label:'Доставка',color:'#8eb4df'},closed_won:{label:'Закрыто',color:'#d9d4cf'},closed_lost:{label:'Отказ',color:'#edc7d1'},
};
const barPreset=[{l:7,w:27},{l:30,w:18},{l:18,w:58},{l:44,w:24},{l:13,w:16},{l:60,w:33},{l:1,w:10},{l:73,w:23}];
const code=(i:number)=>`S-${128+i}`;
const deadlineLabel=(d:Deal,i:number)=>{if(d.stage==='prepayment')return i%2?'просрочено 2 дня':'сегодня';const date=new Date(d.deadline);if(!Number.isNaN(date.getTime()))return new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'short'}).format(date);return ['сегодня 16:00','28 сен','завтра','30 сен','29 сен'][i%5]};

export const FigmaCalendarView:React.FC=()=>{
  const{deals,setSelectedDealId,setCurrentTab,theme,toggleTheme}=useCrm();
  const rows=(deals.length?deals.slice(0,8):[]);
  const days=[['23','Пн'],['24','Вт'],['25','Ср'],['26','Чт'],['27','Пт'],['28','Сб'],['29','Вс']];
  return <div className="relative h-[1000px] min-w-[1080px] overflow-hidden bg-[#f7f5f2] text-[#202020]">
    <div className="absolute left-[42px] top-[24px] flex items-baseline gap-4"><h1 className="text-[34px] font-semibold leading-none tracking-[-.035em]">Календарь проектов</h1><span className="text-[13px] text-[#7d756e]">Этапы проектов и сроки в одном календаре</span></div>
    <button onClick={toggleTheme} className="absolute right-[54px] top-[20px] flex h-[44px] w-[126px] items-center justify-around rounded-[22px] bg-white"><Sun size={17}/><Moon size={16} className={theme==='dark'?'text-[#202020]':'text-[#7d756e]'}/></button>
    <div className="absolute left-[42px] top-[82px] flex h-[40px] gap-[12px]"><button className="w-[192px] rounded-[12px] border border-[#ebe5e0] bg-white text-[11px] font-medium">23 — 29 сентября</button><button className="w-[40px] rounded-[12px] border border-[#ebe5e0] bg-white text-[20px]">‹</button><button className="w-[40px] rounded-[12px] border border-[#ebe5e0] bg-white text-[20px]">›</button><button className="w-[92px] rounded-[12px] border border-[#ebe5e0] bg-white text-[11px] font-medium">Сегодня</button></div>
    <div className="absolute right-[54px] top-[82px] flex h-[40px] gap-[8px]"><button className="w-[96px] rounded-[12px] bg-[#2a292b] text-[11px] text-white">Неделя</button><button className="w-[92px] rounded-[12px] border border-[#ebe5e0] bg-white text-[11px]">Месяц</button></div>
    <section className="absolute left-[42px] right-[42px] top-[144px] h-[806px] overflow-hidden rounded-[18px] border border-[#ebe5e0] bg-white">
      <div className="absolute left-[20px] top-[17px] flex items-baseline gap-6"><h2 className="text-[19px] font-semibold">Календарь проектов</h2><span className="text-[11px] text-[#7d756e]">23 — 29 сентября 2026</span></div>
      <div className="absolute right-[32px] top-[20px] flex gap-5 text-[9px]"><span className="text-[#7fa18f]">● производство</span><span className="text-[#dcc9b7]">● согласование</span><span className="text-[#b7aedc]">● ожидание</span></div>
      <div className="absolute left-[16px] right-[16px] top-[59px] h-[52px] rounded-[12px] bg-[#fbfaf7]"/>
      <div className="absolute left-[16px] top-[59px] bottom-[42px] w-[264px] border-r border-[#ebe5e0]"><span className="absolute left-[16px] top-[16px] text-[10px] text-[#7d756e]">Проект</span></div>
      <div className="absolute left-[280px] right-[16px] top-[59px] bottom-[42px] grid grid-cols-7">
        {days.map(([d,w],i)=><div key={d} className={`relative border-r border-[#ebe5e0] ${i===3?'bg-[#fbf4ec]':''}`}><div className="absolute left-0 right-0 top-[8px] text-center text-[11px] font-semibold">{d}</div><div className={`absolute left-0 right-0 top-[26px] text-center text-[9px] ${i===3?'text-[#c7616b]':'text-[#7d756e]'}`}>{w}</div></div>)}
      </div>
      <div className="absolute left-[16px] right-[16px] top-[111px]">
        {rows.map((d,i)=>{const st=stageStyle[d.stage];const p=barPreset[i%barPreset.length];const alert=d.stage==='prepayment'||i===0||i===1||i===6;return <button key={d.id} onClick={()=>{setSelectedDealId(d.id);setCurrentTab('deals')}} className={`relative block h-[75px] w-full border-b border-[#ebe5e0] text-left ${i%2?'bg-[#fbfaf7]':'bg-white'}`}>
          <span className="absolute left-[16px] top-[19px] text-[10px] font-medium text-[#7d756e]">{code(i)}</span><span className="absolute left-[74px] top-[17px] w-[185px] truncate text-[11px] font-semibold">{d.title} · {d.clientName}</span><span className="absolute left-[74px] top-[39px] w-[185px] truncate text-[9px] text-[#7d756e]">{st.label}</span>
          <span className="absolute top-[20px] h-[30px] rounded-[15px] px-[12px] pt-[7px] text-[9px] font-medium" style={{left:`calc(264px + ${p.l}% * (100% - 264px) / 100)`,width:`calc(${p.w}% * (100% - 264px) / 100)`,background:st.color}}>{st.label}</span><span className={`absolute right-[12px] bottom-[6px] text-[8px] ${alert?'text-[#c7616b]':'text-[#7d756e]'}`}>{deadlineLabel(d,i)}</span>
        </button>})}
      </div>
      <div className="absolute bottom-[41px] left-[calc(280px+3.5*(100%-296px)/7)] top-[111px] w-px bg-[#e3999e]"/>
      <div className="absolute bottom-[25px] left-[calc(280px+3.5*(100%-296px)/7-25px)] text-[8px] text-[#c7616b]">сегодня</div>
    </section>
  </div>;
};
