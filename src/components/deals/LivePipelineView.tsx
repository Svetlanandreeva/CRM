import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Loader2, RefreshCw } from 'lucide-react';
import { useCrm } from '../../context/CrmContext';

type DealRow = { id:string; title:string; contactId:string; contactName?:string|null; value?:number; expectedClose?:string|null; probability?:number; };
type Stage = { id:string; name:string; color:string; order:number; isWon?:boolean; isLost?:boolean; deals:DealRow[] };

const rub = (cents?:number) => `${new Intl.NumberFormat('ru-RU').format(Math.round(Number(cents||0)/100))} ₽`;

export const LivePipelineView: React.FC = () => {
  const { setSelectedDealId, setCurrentTab } = useCrm();
  const [stages,setStages]=useState<Stage[]>([]);
  const [loading,setLoading]=useState(true);
  const [notice,setNotice]=useState('');
  const flash=(x:string)=>{setNotice(x);window.setTimeout(()=>setNotice(''),3200)};
  const load=async()=>{setLoading(true);try{const r=await fetch('/api/pipeline',{cache:'no-store'});const d=await r.json();if(!r.ok)throw new Error(d.error||'Не удалось загрузить воронку');setStages(Array.isArray(d)?d:[])}catch(e){flash(e instanceof Error?e.message:'Ошибка загрузки')}finally{setLoading(false)}};
  useEffect(()=>{void load()},[]);

  const move=async(stage:Stage,deal:DealRow,direction:-1|1)=>{
    const i=stages.findIndex(s=>s.id===stage.id);const target=stages[i+direction];if(!target)return;
    const body:any={dealId:deal.id,stageId:target.id};
    if(target.name==='Доставка'){const tracking=window.prompt('Укажите трек-номер / код отправления');if(!tracking)return;body.trackingCode=tracking}
    if(target.isLost){const reason=window.prompt('Укажите причину отказа');if(!reason)return;body.lossReason=reason}
    try{const r=await fetch('/api/pipeline',{method:'PUT',headers:{'content-type':'application/json'},body:JSON.stringify(body)});const d=await r.json();if(!r.ok)throw new Error(d.error||'Не удалось изменить этап');await load()}catch(e){flash(e instanceof Error?e.message:'Ошибка перемещения')}
  };

  const total=stages.reduce((s,x)=>s+(x.deals?.length||0),0);
  return <div className="min-h-[1000px] w-full min-w-[1000px] bg-[#f7f5f2] px-7 py-7 text-[#1f1d1c]">
    <div className="flex items-start justify-between"><div><h1 className="text-[34px] font-semibold tracking-[-.035em]">Воронка</h1><p className="mt-1 text-[12px] text-[#817a74]">{total} сделок · этапы берутся из настроек CRM</p></div><button onClick={()=>void load()} className="grid h-11 w-11 place-items-center rounded-full border border-[#e8e3de] bg-white"><RefreshCw size={15}/></button></div>
    {notice&&<div className="mt-4 rounded-xl bg-[#2a292b] px-4 py-3 text-[11px] text-white">{notice}</div>}
    {loading?<div className="grid h-[500px] place-items-center"><Loader2 className="animate-spin"/></div>:<div className="mt-6 overflow-x-auto pb-5"><div className="flex min-w-max gap-3">{stages.map((stage,stageIndex)=><section key={stage.id} className="w-[280px] shrink-0 rounded-[18px] border border-[#e8e3de] bg-white p-3">
      <div className="flex items-center gap-2 px-1 pb-3"><i className="h-3 w-3 rounded-full" style={{background:stage.color||'#999'}}/><b className="min-w-0 flex-1 truncate text-[13px]">{stage.name}</b><span className="rounded-full bg-[#f4f1ee] px-2 py-1 text-[9px]">{stage.deals?.length||0}</span></div>
      <div className="space-y-2">{(stage.deals||[]).map(deal=><article key={deal.id} className="rounded-[14px] border border-[#eee9e4] bg-[#fbfaf8] p-3">
        <button onClick={()=>{setSelectedDealId(deal.id);setCurrentTab('deals')}} className="w-full text-left"><b className="block truncate text-[11px]">{deal.contactName||'Клиент'}</b><span className="mt-1 block min-h-[30px] text-[10px] leading-[15px] text-[#625c57]">{deal.title}</span><span className="mt-2 block text-[10px] font-medium">{rub(deal.value)}</span></button>
        <div className="mt-3 flex justify-between"><button onClick={()=>void move(stage,deal,-1)} disabled={stageIndex===0} className="grid h-8 w-8 place-items-center rounded-lg border border-[#e4ded8] bg-white disabled:opacity-25"><ChevronLeft size={13}/></button><button onClick={()=>void move(stage,deal,1)} disabled={stageIndex===stages.length-1} className="grid h-8 w-8 place-items-center rounded-lg border border-[#e4ded8] bg-white disabled:opacity-25"><ChevronRight size={13}/></button></div>
      </article>)}{!stage.deals?.length&&<div className="grid h-24 place-items-center text-[9px] text-[#9a938d]">Нет сделок</div>}</div>
    </section>)}</div></div>}
  </div>;
};
