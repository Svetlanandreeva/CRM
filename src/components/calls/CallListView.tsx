import React, { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  CircleX,
  Loader2,
  Phone,
  PhoneCall,
  RefreshCw,
  Search,
  ShieldAlert,
  UserCheck,
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

const qLabel: Record<string, string> = {
  new: 'Новый', working: 'В работе', qualified: 'Квалифицирован', unqualified: 'Не квалифицирован',
  not_target: 'Не целевой', ignore: 'Игнор', spam: 'Спам', duplicate: 'Дубль',
};

const fmt = (value: string) => {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : new Intl.DateTimeFormat('ru-RU', { dateStyle: 'short', timeStyle: 'short' }).format(d);
};

function noteValue(notes: string | null | undefined, key: string) {
  const line = String(notes || '').split('\n').find(v => v.toLowerCase().startsWith(`${key.toLowerCase()}:`));
  return line ? line.slice(line.indexOf(':') + 1).trim() : '';
}

export const CallListView: React.FC = () => {
  const { theme, setCurrentTab } = useCrm();
  const isLight = theme === 'light';
  const [leads, setLeads] = useState<Lead[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);

  const panel = isLight ? 'bg-white border-black/[0.08]' : 'bg-[#181818] border-white/[0.08]';
  const muted = isLight ? 'text-neutral-500' : 'text-neutral-400';

  const notify = (type: 'ok' | 'error', text: string) => {
    setNotice({ type, text });
    window.setTimeout(() => setNotice(null), 4500);
  };

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/contacts?callList=1', { cache: 'no-store' });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Не удалось загрузить список обзвона');
      setLeads(Array.isArray(data) ? data : []);
    } catch (e) { notify('error', e instanceof Error ? e.message : 'Ошибка загрузки'); }
    finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, []);

  const visible = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return leads;
    return leads.filter(l => [l.name, l.phone, l.email, l.company, l.notes].some(v => String(v || '').toLowerCase().includes(needle)));
  }, [leads, search]);

  async function setQualification(lead: Lead, qualification: string) {
    setBusy(`${lead.id}:${qualification}`);
    try {
      const r = await fetch(`/api/contacts/${encodeURIComponent(lead.id)}`, {
        method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ qualification }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Не удалось обновить лид');
      notify('ok', `${lead.name}: ${qLabel[qualification] || qualification}`);
      await load();
    } catch (e) { notify('error', e instanceof Error ? e.message : 'Ошибка обновления'); }
    finally { setBusy(null); }
  }

  async function promoteToDeal(lead: Lead) {
    setBusy(`${lead.id}:deal`);
    try {
      const q = await fetch(`/api/contacts/${encodeURIComponent(lead.id)}`, {
        method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ qualification: 'qualified' }),
      });
      const qData = await q.json();
      if (!q.ok) throw new Error(qData.error || 'Не удалось квалифицировать лид');
      const interest = noteValue(lead.notes, 'Интерес');
      const niche = noteValue(lead.notes, 'Ниша');
      const title = interest ? interest : niche ? `Заявка: ${niche}` : `Заявка Need Number · ${lead.name}`;
      const d = await fetch('/api/deals', {
        method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ title, contactId: lead.id, probability: 25 }),
      });
      const deal = await d.json();
      if (!d.ok) throw new Error(deal.error || 'Не удалось создать сделку');
      notify('ok', `Создана сделка: ${deal.title || title}`);
      await load();
      window.setTimeout(() => setCurrentTab('deals'), 500);
    } catch (e) { notify('error', e instanceof Error ? e.message : 'Ошибка создания сделки'); }
    finally { setBusy(null); }
  }

  return (
    <div className={`flex-1 overflow-y-auto p-5 ${isLight ? 'bg-[#F8F7F4]' : 'bg-[#121212]'}`}>
      <div className="mx-auto max-w-7xl space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div><div className="flex items-center gap-2"><PhoneCall className="h-5 w-5 text-amber-500" /><h1 className="text-lg font-bold">Обзвон</h1><span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-600">{leads.length}</span></div><p className={`mt-0.5 text-xs ${muted}`}>Сырые лиды Need Number. В клиентскую воронку попадают только после подтверждения реальной заявки.</p></div>
          <button onClick={load} disabled={loading} className={`rounded-lg border px-3 py-2 text-xs font-semibold ${panel}`}>{loading ? <Loader2 className="mr-1.5 inline h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="mr-1.5 inline h-3.5 w-3.5" />}Обновить</button>
        </div>

        {notice && <div className={`rounded-lg border px-3 py-2 text-xs ${notice.type === 'ok' ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300'}`}>{notice.text}</div>}

        <div className={`rounded-xl border p-3 ${panel}`}><div className="relative max-w-xl"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Телефон, имя, регион, ниша..." className={`w-full rounded-lg border py-2 pl-9 pr-3 text-xs outline-none focus:ring-1 focus:ring-[#2563EB] ${isLight ? 'bg-[#F8F7F4] border-black/[0.08]' : 'bg-[#222] border-white/[0.08]'}`} /></div></div>

        <div className={`overflow-hidden rounded-xl border ${panel}`}>
          <div className={`hidden grid-cols-[150px_1.2fr_1fr_1fr_110px_380px] gap-3 border-b px-4 py-2 text-[10px] font-bold uppercase tracking-wider lg:grid ${isLight ? 'border-black/[0.08] bg-black/[0.02] text-neutral-500' : 'border-white/[0.08] bg-white/[0.02] text-neutral-500'}`}><div>Получен</div><div>Контакт</div><div>Регион / ниша</div><div>Интерес</div><div>Статус</div><div>Действие</div></div>
          {loading ? <div className="flex h-40 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-neutral-400" /></div> : visible.length === 0 ? <div className={`p-10 text-center text-sm ${muted}`}>В списке обзвона сейчас пусто</div> : visible.map(lead => {
            const region = noteValue(lead.notes, 'Регион');
            const niche = noteValue(lead.notes, 'Ниша');
            const interest = noteValue(lead.notes, 'Интерес');
            return <div key={lead.id} className={`grid gap-3 border-b px-4 py-4 last:border-b-0 lg:grid-cols-[150px_1.2fr_1fr_1fr_110px_380px] ${isLight ? 'border-black/[0.06]' : 'border-white/[0.06]'}`}>
              <div><div className="text-xs font-medium">{fmt(lead.createdAt)}</div><div className={`mt-1 text-[10px] ${muted}`}>Need Number</div></div>
              <div className="min-w-0"><div className="truncate text-xs font-bold">{lead.name}</div>{lead.phone && <a href={`tel:${lead.phone}`} className="mt-1 flex items-center gap-1 text-xs font-semibold text-[#2563EB]"><Phone className="h-3 w-3" />{lead.phone}</a>}{lead.email && <div className={`mt-1 truncate text-[10px] ${muted}`}>{lead.email}</div>}</div>
              <div className="text-xs"><div>{region || '—'}</div><div className={`mt-1 ${muted}`}>{niche || 'Ниша не указана'}</div></div>
              <div className={`text-xs leading-relaxed ${interest ? '' : muted}`}>{interest || 'Запрос пока не определён'}</div>
              <div><span className="rounded-full bg-amber-500/10 px-2 py-1 text-[10px] font-bold text-amber-600">{qLabel[lead.qualification || 'new'] || lead.qualification || 'Новый'}</span></div>
              <div className="flex flex-wrap items-start gap-1.5">
                <a href={lead.phone ? `tel:${lead.phone}` : undefined} className={`rounded-lg border px-2.5 py-1.5 text-[10px] font-semibold ${isLight ? 'border-black/[0.08]' : 'border-white/[0.08]'}`}><PhoneCall className="mr-1 inline h-3 w-3" />Позвонить</a>
                <button onClick={() => void setQualification(lead, 'working')} disabled={busy !== null} className={`rounded-lg border px-2.5 py-1.5 text-[10px] font-semibold ${isLight ? 'border-black/[0.08]' : 'border-white/[0.08]'}`}><UserCheck className="mr-1 inline h-3 w-3" />В работе</button>
                <button onClick={() => void promoteToDeal(lead)} disabled={busy !== null} className="rounded-lg bg-[#2563EB] px-2.5 py-1.5 text-[10px] font-semibold text-white"><CheckCircle2 className="mr-1 inline h-3 w-3" />Есть заявка</button>
                <button onClick={() => void setQualification(lead, 'not_target')} disabled={busy !== null} className={`rounded-lg border px-2.5 py-1.5 text-[10px] font-semibold ${isLight ? 'border-black/[0.08]' : 'border-white/[0.08]'}`}><CircleX className="mr-1 inline h-3 w-3" />Не целевой</button>
                <button onClick={() => void setQualification(lead, 'spam')} disabled={busy !== null} className="rounded-lg border border-rose-500/20 px-2.5 py-1.5 text-[10px] font-semibold text-rose-600"><ShieldAlert className="mr-1 inline h-3 w-3" />Спам</button>
              </div>
            </div>;
          })}
        </div>
      </div>
    </div>
  );
};
