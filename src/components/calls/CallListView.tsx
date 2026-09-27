import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  CircleX,
  Loader2,
  Phone,
  PhoneCall,
  RefreshCw,
  Search,
} from 'lucide-react';
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

const fmt = (value: string) => {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit',
  }).format(d);
};

function noteValue(notes: string | null | undefined, key: string) {
  const line = String(notes || '').split('\n').find(v => v.toLowerCase().startsWith(`${key.toLowerCase()}:`));
  return line ? line.slice(line.indexOf(':') + 1).trim() : '';
}

export const CallListView: React.FC = () => {
  const { setCurrentTab } = useCrm();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [search, setSearch] = useState('');
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
    } catch (e) {
      notify('error', e instanceof Error ? e.message : 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const visible = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return leads;
    return leads.filter(l => [l.name, l.phone, l.email, l.company, l.notes]
      .some(v => String(v || '').toLowerCase().includes(needle)));
  }, [leads, search]);

  const newCount = leads.filter(l => (l.qualification || 'new') === 'new').length;
  const workingCount = leads.filter(l => l.qualification === 'working').length;

  async function setQualification(lead: Lead, qualification: 'working' | 'unqualified') {
    setBusy(`${lead.id}:${qualification}`);
    try {
      const r = await fetch(`/api/contacts/${encodeURIComponent(lead.id)}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ qualification }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Не удалось обновить обзвон');
      if (qualification === 'unqualified') notify('ok', `${lead.name} перенесён в отказ`);
      await load();
    } catch (e) {
      notify('error', e instanceof Error ? e.message : 'Ошибка обновления');
    } finally {
      setBusy(null);
    }
  }

  async function promoteToDeal(lead: Lead) {
    setBusy(`${lead.id}:deal`);
    try {
      const interest = noteValue(lead.notes, 'Интерес');
      const niche = noteValue(lead.notes, 'Ниша');
      const title = interest || (niche ? `Заявка: ${niche}` : `Заявка Need Number · ${lead.name}`);
      const d = await fetch('/api/deals', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ title, contactId: lead.id, probability: 25 }),
      });
      const deal = await d.json();
      if (!d.ok) throw new Error(deal.error || 'Не удалось создать сделку');
      notify('ok', `${lead.name} перенесён в сделки`);
      await load();
      window.setTimeout(() => setCurrentTab('deals'), 450);
    } catch (e) {
      notify('error', e instanceof Error ? e.message : 'Ошибка создания сделки');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="min-h-full bg-[#f7f5f2] px-7 py-7 text-[#1f1d1c] lg:px-10">
      <div className="mx-auto w-full max-w-[1500px]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-[34px] font-semibold leading-none tracking-[-.035em]">Обзвоны</h1>
              <span className="rounded-full bg-[#e8ddf7] px-2.5 py-1 text-[11px] font-medium text-[#625679]">Need Number</span>
            </div>
            <p className="mt-3 max-w-[720px] text-[12px] leading-5 text-[#817a74]">
              Это входящий список для обзвона, а не сделки. После разговора контакт можно перевести только в сделку или в отказ.
            </p>
          </div>
          <button onClick={load} disabled={loading} className="flex h-11 items-center gap-2 rounded-[13px] border border-[#e5e0da] bg-white px-4 text-[12px] font-medium shadow-[0_1px_2px_rgba(40,35,30,.03)] hover:bg-[#fbfaf8] disabled:opacity-50">
            {loading ? <Loader2 size={15} className="animate-spin"/> : <RefreshCw size={15}/>} Обновить
          </button>
        </div>

        <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-[18px] border border-[#e8e3de] bg-white p-5">
            <div className="text-[28px] font-semibold">{leads.length}</div>
            <div className="mt-1 text-[11px] text-[#817a74]">К обзвону</div>
          </div>
          <div className="rounded-[18px] border border-[#e8e3de] bg-white p-5">
            <div className="text-[28px] font-semibold">{newCount}</div>
            <div className="mt-1 text-[11px] text-[#817a74]">Новые</div>
          </div>
          <div className="rounded-[18px] border border-[#e8e3de] bg-white p-5">
            <div className="text-[28px] font-semibold">{workingCount}</div>
            <div className="mt-1 text-[11px] text-[#817a74]">В работе</div>
          </div>
        </div>

        {notice && <div className={`mt-4 rounded-[12px] border px-4 py-3 text-[12px] ${notice.type === 'ok' ? 'border-[#cfe2d4] bg-[#eef6f0] text-[#496552]' : 'border-[#edcdd4] bg-[#fbf0f2] text-[#8d4d5b]'}`}>{notice.text}</div>}

        <div className="mt-5 rounded-[18px] border border-[#e8e3de] bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative w-full max-w-[460px]">
              <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#918a84]"/>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Телефон, имя, регион, ниша..." className="h-11 w-full rounded-[12px] border border-[#e8e3de] bg-[#fbfaf8] pl-11 pr-4 text-[12px] outline-none focus:border-[#cfc7bf]"/>
            </div>
            <div className="text-[11px] text-[#918a84]">Найдено: {visible.length}</div>
          </div>
        </div>

        <div className="mt-4 overflow-hidden rounded-[18px] border border-[#e8e3de] bg-white">
          <div className="overflow-x-auto">
            <div className="min-w-[1080px]">
              <div className="grid grid-cols-[130px_1.15fr_.9fr_1.2fr_105px_270px] gap-3 bg-[#fbfaf8] px-5 py-3 text-[10px] text-[#817a74]">
                <span>Получен</span><span>Контакт</span><span>Регион / ниша</span><span>Интерес</span><span>Статус</span><span>После звонка</span>
              </div>

              {loading ? (
                <div className="grid h-40 place-items-center"><Loader2 size={24} className="animate-spin text-[#918a84]"/></div>
              ) : visible.length === 0 ? (
                <div className="grid h-40 place-items-center text-[12px] text-[#918a84]">Сейчас нет контактов для обзвона</div>
              ) : visible.map((lead, index) => {
                const region = noteValue(lead.notes, 'Регион');
                const niche = noteValue(lead.notes, 'Ниша');
                const interest = noteValue(lead.notes, 'Интерес');
                const working = lead.qualification === 'working';
                return <div key={lead.id} className={`grid min-h-[78px] grid-cols-[130px_1.15fr_.9fr_1.2fr_105px_270px] items-center gap-3 border-t border-[#f0ece7] px-5 py-3 text-[11px] ${index % 2 ? 'bg-[#fdfcfb]' : ''}`}>
                  <div className="text-[#6f6964]">{fmt(lead.createdAt)}</div>
                  <div className="min-w-0">
                    <div className="truncate font-semibold">{lead.name}</div>
                    {lead.phone ? <a href={`tel:${lead.phone}`} onClick={()=>!working&&void setQualification(lead,'working')} className="mt-1 flex items-center gap-1.5 text-[#596d88] hover:underline"><Phone size={12}/>{lead.phone}</a> : <div className="mt-1 text-[#918a84]">Телефон не указан</div>}
                  </div>
                  <div className="min-w-0"><div className="truncate">{region || '—'}</div><div className="mt-1 truncate text-[#817a74]">{niche || 'Ниша не указана'}</div></div>
                  <div className={interest ? '' : 'text-[#918a84]'}>{interest || 'Запрос пока не определён'}</div>
                  <div><span className={`rounded-full px-2.5 py-1.5 text-[10px] ${working ? 'bg-[#dcebfa] text-[#57718e]' : 'bg-[#f8e5d2] text-[#8c6a48]'}`}>{working ? 'В работе' : 'Новый'}</span></div>
                  <div className="flex items-center gap-2">
                    {lead.phone && <a href={`tel:${lead.phone}`} onClick={()=>!working&&void setQualification(lead,'working')} className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] border border-[#e8e3de] bg-white" title="Позвонить"><PhoneCall size={14}/></a>}
                    <button onClick={()=>void promoteToDeal(lead)} disabled={busy!==null} className="flex h-9 items-center gap-1.5 rounded-[10px] bg-[#2a292b] px-3 text-[10px] font-medium text-white disabled:opacity-40">В сделку <ArrowRight size={12}/></button>
                    <button onClick={()=>void setQualification(lead,'unqualified')} disabled={busy!==null} className="flex h-9 items-center gap-1.5 rounded-[10px] border border-[#edd7db] bg-[#fff9fa] px-3 text-[10px] font-medium text-[#9a5967] disabled:opacity-40"><CircleX size={12}/>Отказ</button>
                  </div>
                </div>;
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
