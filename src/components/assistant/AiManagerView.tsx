import React, { useEffect, useRef, useState } from 'react';
import {
  Bot,
  CheckCircle2,
  Loader2,
  Play,
  RefreshCw,
  Send,
  Sparkles,
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';

type ChatItem = { id: string; role: 'user' | 'assistant'; text: string; at: string };

type AssistantState = {
  latestRun?: string | number | null;
  dailyBrief?: unknown;
  dialogueEnrichment?: unknown;
  [key: string]: unknown;
};

function fmt(value: unknown) {
  if (!value) return 'Ещё не запускался';
  const date = new Date(value as any);
  if (!Number.isNaN(date.getTime())) return new Intl.DateTimeFormat('ru-RU', { dateStyle: 'short', timeStyle: 'short' }).format(date);
  return String(value);
}

function briefText(value: unknown): string {
  if (!value) return 'После проверки здесь появится управленческий итог по клиентам и сделкам.';
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.map(v => typeof v === 'string' ? v : JSON.stringify(v)).join('\n');
  if (typeof value === 'object') {
    const object = value as Record<string, unknown>;
    const candidates = ['summary', 'brief', 'text', 'message', 'headline'];
    for (const key of candidates) if (typeof object[key] === 'string') return String(object[key]);
    return Object.entries(object).slice(0, 8).map(([key, v]) => `${key}: ${typeof v === 'object' ? JSON.stringify(v) : String(v)}`).join('\n');
  }
  return String(value);
}

export const AiManagerView: React.FC = () => {
  const { theme } = useCrm();
  const isLight = theme === 'light';
  const [state, setState] = useState<AssistantState | null>(null);
  const [messages, setMessages] = useState<ChatItem[]>([
    { id: 'welcome', role: 'assistant', text: 'Я подключён к рабочей базе Satori. Можешь писать обычным языком: «разбери новые заявки», «что зависло без ответа», «проверь сделку Иванова», «кто ждёт оплату».', at: new Date().toISOString() },
  ]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);

  const panel = isLight ? 'bg-white border-black/[0.08]' : 'bg-[#181818] border-white/[0.08]';
  const muted = isLight ? 'text-neutral-500' : 'text-neutral-400';

  const notify = (type: 'ok' | 'error', text: string) => {
    setNotice({ type, text });
    window.setTimeout(() => setNotice(null), 4500);
  };

  async function load() {
    setBusy('load');
    try {
      const r = await fetch('/api/assistant', { cache: 'no-store' });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Не удалось загрузить AI-менеджера');
      setState(data);
    } catch (e) { notify('error', e instanceof Error ? e.message : 'Ошибка AI-менеджера'); }
    finally { setBusy(null); }
  }

  useEffect(() => { void load(); }, []);
  useEffect(() => { requestAnimationFrame(() => endRef.current?.scrollIntoView({ block: 'end' })); }, [messages.length, busy]);

  async function runAudit() {
    setBusy('audit');
    try {
      const r = await fetch('/api/assistant', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'run', notify: false }) });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Проверка не выполнена');
      setState(data);
      notify('ok', 'AI-проверка CRM завершена');
    } catch (e) { notify('error', e instanceof Error ? e.message : 'Ошибка проверки'); }
    finally { setBusy(null); }
  }

  async function send() {
    const message = draft.trim();
    if (!message || busy) return;
    const user: ChatItem = { id: `u_${Date.now()}`, role: 'user', text: message, at: new Date().toISOString() };
    setMessages(v => [...v, user]);
    setDraft('');
    setBusy('chat');
    try {
      const r = await fetch('/api/assistant', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: 'chat', message }) });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'AI не ответил');
      setMessages(v => [...v, { id: `a_${Date.now()}`, role: 'assistant', text: String(data.reply || 'Готово.'), at: new Date().toISOString() }]);
      void load();
    } catch (e) {
      const text = e instanceof Error ? e.message : 'Ошибка AI';
      setMessages(v => [...v, { id: `e_${Date.now()}`, role: 'assistant', text: `Ошибка: ${text}`, at: new Date().toISOString() }]);
    } finally { setBusy(null); }
  }

  const quick = [
    'Разбери новые заявки и скажи, что требует моего внимания сегодня',
    'Какие сделки зависли без ответа клиента?',
    'Кто сейчас ждёт оплату и по каким суммам?',
    'Найди клиентов, которым нужно отправить КП или напомнить о нём',
  ];

  return (
    <div className={`flex-1 min-h-0 p-5 ${isLight ? 'bg-[#F8F7F4]' : 'bg-[#121212]'}`}>
      <div className="mx-auto flex h-full max-w-7xl flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div><div className="flex items-center gap-2"><Bot className="h-5 w-5 text-fuchsia-500" /><h1 className="text-lg font-bold">AI-менеджер</h1><span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600">РАБОЧАЯ БАЗА</span></div><p className={`mt-0.5 text-xs ${muted}`}>Анализирует клиентов, переписку, сделки и документы. Финансовые и отправочные действия выполняются только через реальные backend-действия.</p></div>
          <div className="flex gap-2"><button onClick={load} disabled={busy !== null} className={`rounded-lg border px-3 py-2 text-xs font-semibold ${panel}`}><RefreshCw className={`mr-1.5 inline h-3.5 w-3.5 ${busy === 'load' ? 'animate-spin' : ''}`} />Обновить</button><button onClick={runAudit} disabled={busy !== null} className="rounded-lg bg-[#2563EB] px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">{busy === 'audit' ? <Loader2 className="mr-1.5 inline h-3.5 w-3.5 animate-spin" /> : <Play className="mr-1.5 inline h-3.5 w-3.5" />}Проверить CRM</button></div>
        </div>

        {notice && <div className={`rounded-lg border px-3 py-2 text-xs ${notice.type === 'ok' ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300'}`}>{notice.text}</div>}

        <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[330px_minmax(0,1fr)]">
          <aside className="space-y-4 overflow-y-auto">
            <section className={`rounded-xl border p-4 ${panel}`}><div className="mb-2 flex items-center gap-2"><Sparkles className="h-4 w-4 text-fuchsia-500" /><h2 className="text-xs font-bold">Управленческий итог</h2></div><div className={`whitespace-pre-wrap text-xs leading-relaxed ${muted}`}>{briefText(state?.dailyBrief)}</div><div className={`mt-3 border-t pt-3 text-[10px] ${isLight ? 'border-black/[0.06]' : 'border-white/[0.06]'} ${muted}`}>Последняя проверка: <b>{fmt(state?.latestRun)}</b></div></section>
            <section className={`rounded-xl border p-4 ${panel}`}><h2 className="mb-3 text-xs font-bold">Быстрые команды</h2><div className="space-y-2">{quick.map(text => <button key={text} onClick={() => setDraft(text)} className={`w-full rounded-lg border px-3 py-2 text-left text-[11px] leading-relaxed transition-colors ${isLight ? 'border-black/[0.07] hover:bg-black/[0.025]' : 'border-white/[0.07] hover:bg-white/[0.025]'}`}>{text}</button>)}</div></section>
            <section className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-[11px] leading-relaxed text-emerald-700 dark:text-emerald-300"><div className="mb-1 flex items-center gap-2 font-bold"><CheckCircle2 className="h-4 w-4" />Интеграции подключены</div>AI работает с той же базой, куда приходят почта, Telegram, Need Number и заказы сайта.</section>
          </aside>

          <section className={`flex min-h-0 flex-col overflow-hidden rounded-xl border ${panel}`}>
            <div className={`border-b px-4 py-3 ${isLight ? 'border-black/[0.08]' : 'border-white/[0.08]'}`}><div className="text-xs font-bold">Чат с AI-менеджером</div><div className={`mt-0.5 text-[10px] ${muted}`}>Пиши задачу так же, как человеку. Контекст клиентов и сделок берётся с сервера.</div></div>
            <div className={`min-h-0 flex-1 space-y-3 overflow-y-auto p-4 ${isLight ? 'bg-[#F8F7F4]/55' : 'bg-[#121212]/55'}`}>{messages.map(m => <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[82%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${m.role === 'user' ? 'rounded-br-md bg-[#2563EB] text-white' : isLight ? 'rounded-bl-md border border-black/[0.06] bg-white' : 'rounded-bl-md border border-white/[0.06] bg-[#232323]'}`}>{m.text}</div></div>)}{busy === 'chat' && <div className="flex justify-start"><div className={`rounded-2xl rounded-bl-md border px-3 py-2 ${isLight ? 'border-black/[0.06] bg-white' : 'border-white/[0.06] bg-[#232323]'}`}><Loader2 className="h-4 w-4 animate-spin text-fuchsia-500" /></div></div>}<div ref={endRef} /></div>
            <div className={`border-t p-3 ${isLight ? 'border-black/[0.08]' : 'border-white/[0.08]'}`}><div className="flex items-end gap-2"><textarea value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={e => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') void send(); }} rows={3} placeholder="Например: проверь сегодняшние заявки и скажи, кому я должна ответить первой…" className={`min-h-[58px] flex-1 resize-none rounded-xl border px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-[#2563EB] ${isLight ? 'bg-white border-black/[0.08]' : 'bg-[#222] border-white/[0.08]'}`} /><button onClick={send} disabled={busy !== null || !draft.trim()} className="rounded-xl bg-[#2563EB] p-3 text-white disabled:opacity-40">{busy === 'chat' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}</button></div><div className={`mt-1.5 text-[9px] ${muted}`}>⌘/Ctrl + Enter — отправить</div></div>
          </section>
        </div>
      </div>
    </div>
  );
};
