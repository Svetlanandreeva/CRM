import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, CircleX, Loader2, Phone, PhoneCall, RefreshCw, Search } from 'lucide-react';
import { useCrm } from '../../context/CrmContext';

type Lead = {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  company?: string | null;
  source?: string | null;
  qualification?: string | null;
  score?: number | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
};

const dateMs = (value?: string | null) => {
  if (!value) return 0;
  const d = new Date(value);
  const ms = d.getTime();
  return Number.isNaN(ms) || d.getFullYear() < 2000 || d.getFullYear() > 2100 ? 0 : ms;
};
const fmt = (value: string) => {
  const ms = dateMs(value);
  return ms ? new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(ms)).replace('.', '') : '—';
};
const isToday = (value: string) => {
  const ms = dateMs(value);
  if (!ms) return false;
  const d = new Date(ms), n = new Date();
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
};
function noteValue(notes: string | null | undefined, key: string) {
  const line = String(notes || '').split('\n').find(v => v.toLowerCase().startsWith(`${key.toLowerCase()}:`));
  return line ? line.slice(line.indexOf(':') + 1).trim() : '';
}

const Kpi: React.FC<{ icon: React.ReactNode; tone: string; label: string; value: number }> = ({ icon, tone, label, value }) => <div className="relative h-[104px] rounded-[16px] border border-[#e5e0d9] bg-white">
  <span className="absolute left-4 top-5 grid h-[42px] w-[42px] place-items-center rounded-[12px]" style={{ background: tone }}>{icon}</span>
  <span className="absolute left-[76px] top-[18px] text-[10px] text-[#7a7570]">{label}</span>
  <b className="absolute left-[76px] top-[43px] text-[23px] font-semibold">{value}</b>
</div>;

export const CallListView: React.FC = () => {
  const { setCurrentTab } = useCrm();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all'|'new'|'working'>('all');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);

  const notify = (type: 'ok' | 'error', text: string) => {
    setNotice({ type, text });
    window.setTimeout(() => setNotice(null), 4200);
  };
  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/contacts?callList=1', { cache: 'no-store', credentials: 'include' });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Не удалось загрузить обзвоны');
      setLeads(Array.isArray(data) ? data : []);
    } catch (e) { notify('error', e instanceof Error ? e.message : 'Ошибка загрузки'); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, []);

  const visible = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return leads.filter(l => {
      if (status !== 'all' && (l.qualification || 'new') !== status) return false;
      return !needle || [l.name, l.phone, l.email, l.company, l.notes].some(v => String(v || '').toLowerCase().includes(needle));
    });
  }, [leads, search, status]);

  const newCount = leads.filter(l => (l.qualification || 'new') === 'new').length;
  const workingCount = leads.filter(l => l.qualification === 'working').length;
  const todayCount = leads.filter(l => isToday(l.createdAt)).length;

  async function setQualification(lead: Lead, qualification: 'working' | 'unqualified') {
    setBusy(`${lead.id}:${qualification}`);
    try {
      const r = await fetch(`/api/contacts/${encodeURIComponent(lead.id)}`, { method: 'PUT', credentials: 'include', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ qualification }) });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Не удалось обновить обзвон');
      if (qualification === 'unqualified') notify('ok', `${lead.name} перенесён в отказ`);
      await load();
    } catch (e) { notify('error', e instanceof Error ? e.message : 'Ошибка обновления'); }
    finally { setBusy(null); }
  }

  async function promoteToDeal(lead: Lead) {
    setBusy(`${lead.id}:deal`);
    try {
      const interest = noteValue(lead.notes, 'Интерес');
      const niche = noteValue(lead.notes, 'Ниша');
      const title = interest || (niche ? `Заявка: ${niche}` : `Заявка Need Number · ${lead.name}`);
      const r = await fetch('/api/deals', { method: 'POST', credentials: 'include', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ title, contactId: lead.id, probability: 25 }) });
      const deal = await r.json();
      if (!r.ok) throw new Error(deal.error || 'Не удалось создать сделку');
      notify('ok', `${lead.name} перенесён в сделки`);
      await load();
      window.setTimeout(() => setCurrentTab('deals'), 350);
    } catch (e) { notify('error', e instanceof Error ? e.message : 'Ошибка создания сделки'); }
    finally { setBusy(null); }
  }

  const startCall = (lead: Lead) => {
    if (!lead.phone) return;
    if (lead.qualification !== 'working') void setQualification(lead, 'working');
    window.location.href = `tel:${lead.phone}`;
  };

  return <div className="relative min-h-[1000px] w-[1330px] bg-[#f6f4f0] px-[42px] py-[26px] text-[#21201f]">
    <div className="flex h-[42px] items-start justify-between">
      <div className="flex items-baseline gap-4"><h1 className="text-[32px] font-semibold leading-none tracking-[-.03em]">Список на обзвон</h1><span className="text-[10px] text-[#7a7570]">Need Number · клиенты до квалификации</span></div>
      <button onClick={() => visible[0] && startCall(visible[0])} disabled={!visible[0]?.phone} className="flex h-[42px] w-[220px] items-center justify-center rounded-[12px] bg-[#292826] text-[11px] font-medium text-white disabled:opacity-40">▶&nbsp;&nbsp;Начать обзвон</button>
    </div>

    <div className="mt-[20px] flex h-[38px] gap-[12px]">
      <label className="flex h-[38px] w-[260px] items-center rounded-[10px] border border-[#e5e0d9] bg-white px-4"><Search size={12} className="mr-2 text-[#7a7570]"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Поиск по клиенту или телефону" className="min-w-0 flex-1 bg-transparent text-[10px] outline-none"/></label>
      <button onClick={()=>void load()} className="flex w-[132px] items-center justify-center rounded-[10px] border border-[#e5e0d9] bg-white text-[10px] font-medium">{loading?<Loader2 size={12} className="mr-2 animate-spin"/>:<RefreshCw size={12} className="mr-2"/>}Обновить</button>
      <select value={status} onChange={e=>setStatus(e.target.value as typeof status)} className="h-[38px] w-[152px] rounded-[10px] border border-[#e5e0d9] bg-white px-3 text-[10px] font-medium outline-none"><option value="all">Все статусы</option><option value="new">Новые</option><option value="working">В работе</option></select>
      <div className="grid h-[38px] flex-1 place-items-center rounded-[10px] border border-[#e5e0d9] bg-[#fbfaf7] px-4 text-[10px] text-[#7a7570]">Сначала новые · затем взятые в работу</div>
    </div>

    <div className="mt-[20px] grid grid-cols-4 gap-[14px]">
      <Kpi icon={<PhoneCall size={16}/>} tone="#d4e3f7" label="На обзвон" value={leads.length}/>
      <Kpi icon={<span className="text-[16px]">◷</span>} tone="#f5dec2" label="Получено сегодня" value={todayCount}/>
      <Kpi icon={<span className="text-[16px]">✦</span>} tone="#e3d9f7" label="Новые" value={newCount}/>
      <Kpi icon={<span className="text-[16px]">↻</span>} tone="#d9ede0" label="В работе" value={workingCount}/>
    </div>

    {notice && <div className={`mt-3 rounded-[10px] border px-4 py-2 text-[10px] ${notice.type==='ok'?'border-[#cfe2d4] bg-[#eef6f0] text-[#496552]':'border-[#edcdd4] bg-[#fbf0f2] text-[#8d4d5b]'}`}>{notice.text}</div>}

    <section className="mt-[24px] min-h-[612px] rounded-[18px] border border-[#e5e0d9] bg-white p-[16px]">
      <div className="flex items-start justify-between px-1"><div><h2 className="text-[18px] font-semibold">Очередь звонков</h2><p className="mt-1 text-[9px] text-[#7a7570]">Контакты Need Number не становятся сделками до результата звонка</p></div><span className="rounded-[10px] bg-[#f6f4f0] px-3 py-2 text-[9px] text-[#7a7570]">{visible.length} клиентов</span></div>
      <div className="mt-[20px] grid h-[34px] grid-cols-[190px_150px_245px_115px_120px_1fr] items-center px-4 text-[9px] font-medium text-[#7a7570]"><span>Клиент</span><span>Телефон</span><span>Причина звонка</span><span>Получен</span><span>Статус</span><span>После звонка</span></div>
      {loading ? <div className="grid h-[360px] place-items-center"><Loader2 size={22} className="animate-spin text-[#918a84]"/></div> : visible.length ? visible.map((lead,index)=>{
        const region=noteValue(lead.notes,'Регион'); const niche=noteValue(lead.notes,'Ниша'); const interest=noteValue(lead.notes,'Интерес'); const working=lead.qualification==='working';
        return <div key={lead.id} className={`grid min-h-[64px] grid-cols-[190px_150px_245px_115px_120px_1fr] items-center rounded-[10px] px-4 text-[10px] ${index%2===0?'bg-[#fbfaf7]':'bg-white'}`}>
          <div className="min-w-0"><b className="block truncate">{lead.company || lead.name}</b><span className="mt-1 block truncate text-[8px] text-[#7a7570]">{lead.company ? lead.name : [region,niche].filter(Boolean).join(' · ') || lead.email || 'Без дополнительных данных'}</span></div>
          <button onClick={()=>startCall(lead)} disabled={!lead.phone} className="truncate text-left text-[10px] disabled:text-[#aaa39d]">{lead.phone || '—'}</button>
          <span className="truncate pr-3 text-[#7a7570]">{interest || niche || 'Уточнить запрос'}</span>
          <span>{fmt(lead.createdAt)}</span>
          <span className={`w-fit rounded-[10px] px-3 py-2 text-[9px] ${working?'bg-[#d4e3f7]':'bg-[#d9ede0]'}`}>{working?'В работе':'Новый'}</span>
          <div className="flex items-center justify-end gap-2">
            <button onClick={()=>startCall(lead)} disabled={!lead.phone || busy!==null} title="Позвонить" className="grid h-[34px] w-[42px] place-items-center rounded-[10px] bg-[#292826] text-white disabled:opacity-40"><Phone size={13}/></button>
            <button onClick={()=>void promoteToDeal(lead)} disabled={busy!==null} className="flex h-[34px] items-center rounded-[10px] bg-[#e3d9f7] px-3 text-[9px] font-medium disabled:opacity-40">В сделку <ArrowRight size={10} className="ml-1"/></button>
            <button onClick={()=>void setQualification(lead,'unqualified')} disabled={busy!==null} className="flex h-[34px] items-center rounded-[10px] bg-[#f3d9de] px-3 text-[9px] font-medium text-[#8f5964] disabled:opacity-40"><CircleX size={10} className="mr-1"/>Отказ</button>
          </div>
        </div>;
      }) : <div className="grid h-[360px] place-items-center text-[11px] text-[#918a84]">Сейчас нет контактов для обзвона</div>}
    </section>

    <div className="mt-[18px] flex h-[64px] items-center justify-between rounded-[16px] border border-[#e5e0d9] bg-[#fbfaf7] px-5 text-[10px]"><b>В очереди: {leads.length} · новых: {newCount} · в работе: {workingCount}</b><span className="text-[#7a7570]">После звонка: в сделку или в отказ</span></div>
  </div>;
};
