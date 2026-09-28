import React, { useState } from 'react';
import { Kanban, Settings } from 'lucide-react';
import { PipelineSettingsPanel } from './PipelineSettingsPanel';
import { SettingsView } from './SettingsView';

export const SettingsHub: React.FC = () => {
  const [mode, setMode] = useState<'pipeline'|'other'>('pipeline');
  return <div className="min-h-full bg-[#f8f7f4] text-[#1a1a1a]">
    <div className="sticky top-0 z-20 border-b border-black/[0.07] bg-[#f8f7f4]/95 px-7 py-5 backdrop-blur">
      <div className="flex items-center justify-between gap-4">
        <div><h1 className="text-[24px] font-semibold">Настройки</h1><p className="mt-1 text-[11px] text-neutral-500">Управление логикой CRM и параметрами студии</p></div>
        <div className="flex rounded-xl border border-black/[0.08] bg-white p-1">
          <button onClick={()=>setMode('pipeline')} className={`flex h-9 items-center gap-2 rounded-lg px-4 text-[11px] font-medium ${mode==='pipeline'?'bg-[#2a292b] text-white':'text-neutral-600'}`}><Kanban size={14}/>Воронка</button>
          <button onClick={()=>setMode('other')} className={`flex h-9 items-center gap-2 rounded-lg px-4 text-[11px] font-medium ${mode==='other'?'bg-[#2a292b] text-white':'text-neutral-600'}`}><Settings size={14}/>Остальные настройки</button>
        </div>
      </div>
    </div>
    {mode==='pipeline' ? <div className="p-7"><PipelineSettingsPanel/></div> : <SettingsView/>}
  </div>;
};
