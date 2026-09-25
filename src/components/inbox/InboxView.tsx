import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  FileText,
  Loader2,
  Mail,
  MessageCircle,
  Paperclip,
  RefreshCw,
  Search,
  Send,
  UserPlus,
  X,
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';

type Channel = 'email' | 'telegram';
type Filter = 'all' | 'telegram' | 'email' | 'service';

type UnifiedThread = {
  key: string;
  id: string;
  channel: Channel;
  contactId: string | null;
  title: string;
  subtitle: string;
  isService: boolean;
  unreadCount: number;
  lastMessageAt: string;
  lastSnippet: string | null;
  lastDirection: string;
};

type UnifiedMessage = {
  id: string;
  direction: 'incoming' | 'outgoing';
  bodyText: string;
  receivedAt: string;
  sender?: string | null;
  sourceMessageId?: string | null;
};

type UnifiedDocument = {
  id: string;
  name: string;
  sizeBytes: number;
  createdAt: number | string;
  sourceMessageId?: string | null;
  kind?: string;
};

type UnifiedDetail = {
  channel: Channel;
  threadId: string;
  contactId: string | null;
  title: string;
  subtitle: string;
  isService: boolean;
  pipelineStage: string | null;
  messages: UnifiedMessage[];
  documents: UnifiedDocument[];
};

const dateLabel = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const sameDay = date.toDateString() === new Date().toDateString();
  return new Intl.DateTimeFormat('ru-RU', sameDay ? { hour: '2-digit', minute: '2-digit' } : { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(date);
};

const sizeLabel = (bytes: number) => {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} КБ`;
  return `${(bytes / 1024 / 1024).toFixed(1)} МБ`;
};

export const InboxView: React.FC = () => {
  const { theme } = useCrm();
  const isLight = theme === 'light';
  const [threads, setThreads] = useState<UnifiedThread[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [detail, setDetail] = useState<UnifiedDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [sending, setSending] = useState(false);
  const [promoting, setPromoting] = useState(false);
  const [draft, setDraft] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [notice, setNotice] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);
  const fileInput = useRef<HTMLInputElement | null>(null);

  const panel = isLight ? 'bg-white border-black/[0.08]' : 'bg-[#181818] border-white/[0.08]';
  const muted = isLight ? 'text-neutral-500' : 'text-neutral-400';

  const notify = (type: 'ok' | 'error', text: string) => {
    setNotice({ type, text });
    window.setTimeout(() => setNotice(null), 4500);
  };

  async function loadThreads(preferred?: string | null) {
    setLoading(true);
    try {
      const query = encodeURIComponent(search.trim());
      const jobs: Promise<UnifiedThread[]>[] = [];
      if (filter === 'all' || filter === 'email' || filter === 'service') {
        const emailFilter = filter === 'service' ? 'service' : 'client';
        jobs.push(fetch(`/api/inbox?filter=${emailFilter}&search=${query}`, { cache: 'no-store' }).then(async r => {
          const data = await r.json();
          if (!r.ok) throw new Error(data.error || 'Не удалось загрузить почту');
          return (data.threads || []).map((t: any): UnifiedThread => ({
            key: `email:${t.id}`,
            id: t.id,
            channel: 'email',
            contactId: t.contactId || null,
            title: t.remoteName || t.remoteEmail || 'Почта',
            subtitle: t.subject || t.remoteEmail || '',
            isService: Boolean(t.isService),
            unreadCount: Number(t.unreadCount || 0),
            lastMessageAt: t.lastMessageAt,
            lastSnippet: t.lastSnippet || null,
            lastDirection: t.lastDirection || '',
          }));
        }));
      }
      if (filter === 'all' || filter === 'telegram') {
        jobs.push(fetch(`/api/messages/telegram?search=${query}`, { cache: 'no-store' }).then(async r => {
          const data = await r.json();
          if (!r.ok) throw new Error(data.error || 'Не удалось загрузить Telegram');
          return (data.threads || []).map((t: any): UnifiedThread => ({
            key: `telegram:${t.id}`,
            id: t.id,
            channel: 'telegram',
            contactId: t.contactId || t.id,
            title: t.remoteName || 'Telegram',
            subtitle: t.remoteHandle || (t.channel === 'telegram_account' ? 'Личный Telegram' : 'Telegram-бот'),
            isService: false,
            unreadCount: Number(t.unreadCount || 0),
            lastMessageAt: t.lastMessageAt,
            lastSnippet: t.lastSnippet || null,
            lastDirection: t.lastDirection || '',
          }));
        }));
      }
      const list = (await Promise.all(jobs)).flat().sort((a, b) => {
        const unreadSort = Number(b.unreadCount > 0) - Number(a.unreadCount > 0);
        return unreadSort || new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
      });
      setThreads(list);
      const wanted = preferred || selectedKey;
      setSelectedKey(wanted && list.some(x => x.key === wanted) ? wanted : list[0]?.key || null);
      if (!list.length) setDetail(null);
    } catch (e) {
      notify('error', e instanceof Error ? e.message : 'Ошибка загрузки сообщений');
    } finally {
      setLoading(false);
    }
  }

  async function loadDetail(key: string) {
    setDetailLoading(true);
    setFile(null);
    try {
      const split = key.indexOf(':');
      const channel = key.slice(0, split) as Channel;
      const id = key.slice(split + 1);
      if (channel === 'telegram') {
        const r = await fetch(`/api/messages/telegram/${encodeURIComponent(id)}`, { cache: 'no-store' });
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || 'Не удалось открыть Telegram');
        setDetail({
          channel,
          threadId: id,
          contactId: d.contact?.id || id,
          title: d.contact?.name || d.thread?.remoteName || 'Telegram',
          subtitle: d.thread?.remoteHandle || (d.thread?.channel === 'telegram_account' ? 'Личный Telegram' : 'Telegram-бот'),
          isService: false,
          pipelineStage: d.deal?.stageName || null,
          documents: d.documents || [],
          messages: (d.messages || []).map((m: any) => ({
            id: m.id,
            direction: m.direction,
            bodyText: m.bodyText || '',
            receivedAt: m.receivedAt,
            sender: m.direction === 'outgoing' ? 'Вы' : d.contact?.name,
            sourceMessageId: m.sourceMessageId || null,
          })),
        });
      } else {
        const r = await fetch(`/api/inbox/${encodeURIComponent(id)}`, { cache: 'no-store' });
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || 'Не удалось открыть письмо');
        setDetail({
          channel,
          threadId: id,
          contactId: d.contact?.id || d.thread?.contactId || null,
          title: d.contact?.name || d.thread?.remoteName || d.thread?.remoteEmail || 'Почта',
          subtitle: [d.thread?.remoteEmail, d.thread?.subject].filter(Boolean).join(' · '),
          isService: Boolean(d.thread?.isService),
          pipelineStage: d.deal?.stageName || null,
          documents: d.documents || [],
          messages: (d.messages || []).map((m: any) => ({
            id: m.id,
            direction: m.direction,
            bodyText: m.bodyText || '',
            receivedAt: m.receivedAt,
            sender: m.direction === 'outgoing' ? 'Вы' : m.fromName || m.fromEmail,
            sourceMessageId: m.sourceMessageId || null,
          })),
        });
      }
      setThreads(v => v.map(t => t.key === key ? { ...t, unreadCount: 0 } : t));
    } catch (e) {
      notify('error', e instanceof Error ? e.message : 'Ошибка диалога');
    } finally {
      setDetailLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadThreads(); }, 180);
    return () => window.clearTimeout(timer);
  }, [filter, search]);
  useEffect(() => { if (selectedKey) void loadDetail(selectedKey); }, [selectedKey]);
  useEffect(() => { requestAnimationFrame(() => endRef.current?.scrollIntoView({ block: 'end' })); }, [detail?.messages.length, detailLoading]);

  const unread = useMemo(() => threads.reduce((sum, t) => sum + t.unreadCount, 0), [threads]);

  async function syncEmail() {
    setSyncing(true);
    try {
      const r = await fetch('/api/integrations/email/sync', { method: 'POST' });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Не удалось обновить почту');
      notify('ok', d.imported ? `Добавлено писем: ${d.imported}` : 'Почта обновлена');
      await loadThreads(selectedKey);
      if (selectedKey) await loadDetail(selectedKey);
    } catch (e) { notify('error', e instanceof Error ? e.message : 'Ошибка синхронизации'); }
    finally { setSyncing(false); }
  }

  async function send() {
    if (!detail || (!draft.trim() && !file)) return;
    setSending(true);
    try {
      let r: Response;
      if (file) {
        const form = new FormData();
        form.set('file', file);
        if (detail.channel === 'telegram') {
          form.set('contactId', detail.contactId || '');
          form.set('text', draft.trim());
          r = await fetch('/api/integrations/telegram/reply', { method: 'POST', body: form });
        } else {
          form.set('message', draft.trim());
          r = await fetch(`/api/inbox/${encodeURIComponent(detail.threadId)}/reply`, { method: 'POST', body: form });
        }
      } else {
        r = detail.channel === 'telegram'
          ? await fetch('/api/integrations/telegram/reply', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ contactId: detail.contactId, text: draft.trim() }) })
          : await fetch(`/api/inbox/${encodeURIComponent(detail.threadId)}/reply`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ message: draft.trim() }) });
      }
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Не удалось отправить');
      setDraft(''); setFile(null);
      if (fileInput.current) fileInput.current.value = '';
      notify('ok', file ? 'Файл отправлен' : 'Сообщение отправлено');
      if (selectedKey) await loadDetail(selectedKey);
      await loadThreads(selectedKey);
    } catch (e) { notify('error', e instanceof Error ? e.message : 'Ошибка отправки'); }
    finally { setSending(false); }
  }

  async function toggleService() {
    if (!detail || detail.channel !== 'email') return;
    try {
      const r = await fetch(`/api/inbox/${encodeURIComponent(detail.threadId)}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ isService: !detail.isService }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Не удалось изменить тип');
      notify('ok', detail.isService ? 'Переписка возвращена в клиентские' : 'Переписка отмечена как сервисная');
      await loadThreads(selectedKey);
      if (selectedKey) await loadDetail(selectedKey);
    } catch (e) { notify('error', e instanceof Error ? e.message : 'Ошибка классификации'); }
  }

  async function promote() {
    if (!detail || detail.channel !== 'email' || detail.contactId) return;
    setPromoting(true);
    try {
      const r = await fetch(`/api/inbox/${encodeURIComponent(detail.threadId)}/promote`, { method: 'POST' });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Не удалось создать клиента');
      notify('ok', `Клиент добавлен в CRM · ${d.stageName || 'Новый запрос'}`);
      if (selectedKey) await loadDetail(selectedKey);
      await loadThreads(selectedKey);
    } catch (e) { notify('error', e instanceof Error ? e.message : 'Ошибка добавления клиента'); }
    finally { setPromoting(false); }
  }

  return (
    <div className={`flex-1 min-h-0 p-5 ${isLight ? 'bg-[#F8F7F4]' : 'bg-[#121212]'}`}>
      <div className="flex h-full min-h-[560px] flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <div><div className="flex items-center gap-2"><MessageCircle className="h-5 w-5 text-[#2563EB]" /><h1 className="text-lg font-bold">Входящие</h1>{unread > 0 && <span className="rounded-full bg-[#2563EB] px-2 py-0.5 text-[10px] font-bold text-white">{unread}</span>}</div><p className={`mt-0.5 text-xs ${muted}`}>Почта и Telegram в одном рабочем окне</p></div>
          <button onClick={syncEmail} disabled={syncing} className={`rounded-lg border px-3 py-2 text-xs font-semibold ${panel}`}>{syncing ? <Loader2 className="mr-1.5 inline h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="mr-1.5 inline h-3.5 w-3.5" />}Обновить</button>
        </div>

        {notice && <div className={`rounded-lg border px-3 py-2 text-xs ${notice.type === 'ok' ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300'}`}>{notice.text}</div>}

        <div className={`grid min-h-0 flex-1 overflow-hidden rounded-xl border md:grid-cols-[310px_minmax(0,1fr)] ${panel}`}>
          <aside className={`flex min-h-0 flex-col border-b md:border-b-0 md:border-r ${isLight ? 'border-black/[0.08]' : 'border-white/[0.08]'}`}>
            <div className={`space-y-3 border-b p-3 ${isLight ? 'border-black/[0.08]' : 'border-white/[0.08]'}`}>
              <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Имя, email, Telegram..." className={`w-full rounded-lg border py-2 pl-9 pr-3 text-xs outline-none ${isLight ? 'bg-[#F8F7F4] border-black/[0.08]' : 'bg-[#222] border-white/[0.08]'}`} /></div>
              <div className={`grid grid-cols-4 gap-1 rounded-lg p-1 ${isLight ? 'bg-black/[0.04]' : 'bg-white/[0.04]'}`}>{(['all','telegram','email','service'] as Filter[]).map(v => <button key={v} onClick={() => setFilter(v)} className={`rounded-md px-1 py-1.5 text-[10px] font-semibold ${filter === v ? (isLight ? 'bg-white shadow-sm' : 'bg-[#2a2a2a] text-white') : muted}`}>{v === 'all' ? 'Все' : v === 'telegram' ? 'Telegram' : v === 'email' ? 'Почта' : 'Сервис'}</button>)}</div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              {loading ? <div className="flex h-32 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-neutral-400" /></div> : threads.length === 0 ? <div className={`p-6 text-center text-xs ${muted}`}>Диалогов нет</div> : threads.map(t => <button key={t.key} onClick={() => setSelectedKey(t.key)} className={`w-full border-b p-3 text-left transition-colors ${isLight ? 'border-black/[0.05]' : 'border-white/[0.05]'} ${selectedKey === t.key ? 'bg-[#2563EB]/[0.08]' : (isLight ? 'hover:bg-black/[0.025]' : 'hover:bg-white/[0.025]')}`}><div className="flex items-start justify-between gap-2"><div className="min-w-0"><div className="flex items-center gap-1.5">{t.channel === 'email' ? <Mail className="h-3.5 w-3.5 shrink-0 text-violet-500" /> : <MessageCircle className="h-3.5 w-3.5 shrink-0 text-sky-500" />}<span className="truncate text-xs font-semibold">{t.title}</span>{t.isService && <span className="rounded bg-neutral-500/10 px-1 text-[9px] text-neutral-500">сервис</span>}</div><div className={`mt-1 truncate text-[10px] ${muted}`}>{t.subtitle}</div><div className={`mt-1 line-clamp-2 text-[11px] ${muted}`}>{t.lastSnippet || '—'}</div></div><div className="shrink-0 text-right"><div className={`text-[9px] ${muted}`}>{dateLabel(t.lastMessageAt)}</div>{t.unreadCount > 0 && <span className="mt-1 inline-flex min-w-5 justify-center rounded-full bg-[#2563EB] px-1.5 py-0.5 text-[9px] font-bold text-white">{t.unreadCount > 99 ? '99+' : t.unreadCount}</span>}</div></div></button>)}
            </div>
          </aside>

          <section className="flex min-h-0 flex-col">
            {!selectedKey ? <div className={`flex flex-1 items-center justify-center text-sm ${muted}`}>Выберите диалог</div> : detailLoading ? <div className="flex flex-1 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-neutral-400" /></div> : detail && <>
              <div className={`flex items-center justify-between gap-3 border-b px-4 py-3 ${isLight ? 'border-black/[0.08]' : 'border-white/[0.08]'}`}><div className="min-w-0"><div className="flex items-center gap-2"><h2 className="truncate text-sm font-bold">{detail.title}</h2>{detail.pipelineStage && <span className="rounded-full bg-[#2563EB]/10 px-2 py-0.5 text-[10px] font-semibold text-[#2563EB]">{detail.pipelineStage}</span>}</div><p className={`truncate text-[11px] ${muted}`}>{detail.subtitle}</p></div><div className="flex shrink-0 gap-2">{detail.channel === 'email' && !detail.contactId && <button onClick={promote} disabled={promoting} className="rounded-lg bg-[#2563EB] px-2.5 py-1.5 text-[10px] font-semibold text-white">{promoting ? <Loader2 className="mr-1 inline h-3 w-3 animate-spin" /> : <UserPlus className="mr-1 inline h-3 w-3" />}В CRM</button>}{detail.channel === 'email' && <button onClick={toggleService} className={`rounded-lg border px-2.5 py-1.5 text-[10px] font-semibold ${isLight ? 'border-black/[0.08]' : 'border-white/[0.08]'}`}>{detail.isService ? 'Сделать клиентским' : 'В сервисные'}</button>}</div></div>
              {detail.documents.length > 0 && <div className={`flex gap-2 overflow-x-auto border-b px-4 py-2 ${isLight ? 'border-black/[0.08] bg-black/[0.015]' : 'border-white/[0.08] bg-white/[0.015]'}`}>{detail.documents.map(doc => <a key={doc.id} href={detail.contactId ? `/api/contacts/${encodeURIComponent(detail.contactId)}/documents/${encodeURIComponent(doc.id)}` : '#'} target="_blank" rel="noreferrer" className={`flex shrink-0 items-center gap-2 rounded-lg border px-2.5 py-1.5 text-[10px] ${isLight ? 'border-black/[0.08] bg-white' : 'border-white/[0.08] bg-[#222]'}`}><FileText className="h-3.5 w-3.5 text-[#2563EB]" /><span className="max-w-[180px] truncate">{doc.name}</span><span className={muted}>{sizeLabel(Number(doc.sizeBytes || 0))}</span></a>)}</div>}
              <div className={`min-h-0 flex-1 space-y-3 overflow-y-auto p-4 ${isLight ? 'bg-[#F8F7F4]/55' : 'bg-[#121212]/55'}`}>{detail.messages.map(m => <div key={m.id} className={`flex ${m.direction === 'outgoing' ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[78%] rounded-2xl px-3 py-2 text-xs leading-relaxed whitespace-pre-wrap ${m.direction === 'outgoing' ? 'bg-[#2563EB] text-white rounded-br-md' : (isLight ? 'bg-white border border-black/[0.06] rounded-bl-md' : 'bg-[#232323] border border-white/[0.06] rounded-bl-md')}`}><div>{m.bodyText || '—'}</div><div className={`mt-1 text-right text-[9px] ${m.direction === 'outgoing' ? 'text-white/65' : muted}`}>{dateLabel(m.receivedAt)}</div></div></div>)}<div ref={endRef} /></div>
              <div className={`border-t p-3 ${isLight ? 'border-black/[0.08]' : 'border-white/[0.08]'}`}>{file && <div className={`mb-2 flex items-center justify-between rounded-lg border px-3 py-2 text-[10px] ${isLight ? 'border-black/[0.08] bg-[#F8F7F4]' : 'border-white/[0.08] bg-[#222]'}`}><div className="flex min-w-0 items-center gap-2"><Paperclip className="h-3.5 w-3.5" /><span className="truncate">{file.name}</span><span className={muted}>{sizeLabel(file.size)}</span></div><button onClick={() => { setFile(null); if (fileInput.current) fileInput.current.value = ''; }}><X className="h-3.5 w-3.5" /></button></div>}<div className="flex items-end gap-2"><input ref={fileInput} type="file" className="hidden" onChange={e => setFile(e.target.files?.[0] || null)} /><button onClick={() => fileInput.current?.click()} className={`rounded-lg border p-2.5 ${isLight ? 'border-black/[0.08]' : 'border-white/[0.08]'}`}><Paperclip className="h-4 w-4" /></button><textarea value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={e => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') void send(); }} rows={2} placeholder="Ответить клиенту…  ⌘↵ отправить" className={`min-h-[42px] flex-1 resize-none rounded-xl border px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-[#2563EB] ${isLight ? 'bg-white border-black/[0.08]' : 'bg-[#222] border-white/[0.08]'}`} /><button onClick={send} disabled={sending || (!draft.trim() && !file)} className="rounded-xl bg-[#2563EB] p-3 text-white disabled:opacity-40">{sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}</button></div></div>
            </>}
          </section>
        </div>
      </div>
    </div>
  );
};
