import React, { useEffect, useMemo, useState } from 'react';
import {
  Bot,
  CheckCircle2,
  CircleAlert,
  Copy,
  ExternalLink,
  KeyRound,
  Link2,
  Loader2,
  Mail,
  MessageCircle,
  PhoneIncoming,
  RefreshCw,
  Save,
  Server,
  Sparkles,
  Store,
  Unplug,
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';

type IntegrationState = {
  telegramConfigured: boolean;
  telegramTokenConfigured: boolean;
  telegramChatId: string;
  telegramTransport?: string;
  telegramInboundConfigured?: boolean;
  telegramPollHeartbeatAt?: string;
  telegramPollLastError?: string;
  telegramWebhookUrl?: string;
  telegramWebhookLastError?: string;
  telegramBusinessConfigured?: boolean;
  telegramBusinessCanReply?: boolean;
  telegramLastUpdateAt?: string;
  telegramLastUpdateType?: string;
  needNumberProjectId: string;
  needNumberCreateDeal: boolean;
  needNumberWebhookPath: string;
  emailConfigured: boolean;
  emailPasswordConfigured: boolean;
  emailAddress: string;
  emailUsername: string;
  emailImapHost: string;
  emailImapPort: number;
  emailImapSecure: boolean;
  emailSmtpHost: string;
  emailSmtpPort: number;
  emailSmtpSecure: boolean;
  emailFromName: string;
  emailIgnoreSenders: string;
  emailIgnoreSubjects: string;
  emailSyncDays: number;
  emailLastSyncAt: string;
  emailLastSyncError: string;
};

type OpenAiState = {
  configured: boolean;
  masked: string;
  model: string;
  baseUrl: string;
  models?: string[];
  modelsError?: string;
};

type MailForm = {
  address: string;
  username: string;
  password: string;
  imapHost: string;
  imapPort: string;
  imapSecure: boolean;
  smtpHost: string;
  smtpPort: string;
  smtpSecure: boolean;
  fromName: string;
  ignoreSenders: string;
  ignoreSubjects: string;
  syncDays: string;
};

const emptyMail: MailForm = {
  address: '', username: '', password: '', imapHost: '', imapPort: '993', imapSecure: true,
  smtpHost: '', smtpPort: '465', smtpSecure: true, fromName: 'Satori Studio',
  ignoreSenders: '', ignoreSubjects: '', syncDays: '365',
};

const fmtDate = (value?: string) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('ru-RU', { dateStyle: 'short', timeStyle: 'short' }).format(date);
};

function mailPreset(address: string): Partial<MailForm> {
  const domain = address.trim().toLowerCase().split('@')[1] || '';
  if (domain === 'gmail.com' || domain === 'googlemail.com') return { imapHost: 'imap.gmail.com', imapPort: '993', imapSecure: true, smtpHost: 'smtp.gmail.com', smtpPort: '465', smtpSecure: true };
  if (domain.includes('yandex.') || domain === 'satori.ru') return { imapHost: 'imap.yandex.ru', imapPort: '993', imapSecure: true, smtpHost: 'smtp.yandex.ru', smtpPort: '465', smtpSecure: true };
  if (['mail.ru', 'inbox.ru', 'bk.ru', 'list.ru'].includes(domain)) return { imapHost: 'imap.mail.ru', imapPort: '993', imapSecure: true, smtpHost: 'smtp.mail.ru', smtpPort: '465', smtpSecure: true };
  if (['outlook.com', 'hotmail.com', 'live.com'].includes(domain)) return { imapHost: 'outlook.office365.com', imapPort: '993', imapSecure: true, smtpHost: 'smtp.office365.com', smtpPort: '587', smtpSecure: false };
  if (domain) return { imapHost: `imap.${domain}`, imapPort: '993', imapSecure: true, smtpHost: `smtp.${domain}`, smtpPort: '465', smtpSecure: true };
  return {};
}

export const IntegrationsView: React.FC = () => {
  const { theme } = useCrm();
  const isLight = theme === 'light';
  const [integration, setIntegration] = useState<IntegrationState | null>(null);
  const [openAi, setOpenAi] = useState<OpenAiState>({ configured: false, masked: '', model: 'gpt-5.4', baseUrl: 'https://api.openai.com/v1' });
  const [telegramToken, setTelegramToken] = useState('');
  const [telegramChatId, setTelegramChatId] = useState('');
  const [projectId, setProjectId] = useState('1474');
  const [createDeal, setCreateDeal] = useState(false);
  const [mail, setMail] = useState<MailForm>(emptyMail);
  const [openAiKey, setOpenAiKey] = useState('');
  const [models, setModels] = useState<string[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);

  const card = `rounded-2xl border p-5 ${isLight ? 'bg-white border-black/[0.08]' : 'bg-[#181818] border-white/[0.08]'}`;
  const input = `w-full rounded-lg border px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-[#2563EB] ${isLight ? 'bg-[#F8F7F4] border-black/[0.08]' : 'bg-[#222] border-white/[0.08]'}`;
  const secondary = `rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${isLight ? 'bg-white hover:bg-neutral-50 border-black/[0.08]' : 'bg-[#222] hover:bg-[#2a2a2a] border-white/[0.08]'}`;
  const primary = 'rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] px-3 py-2 text-xs font-semibold text-white transition-colors disabled:opacity-50';

  const notify = (type: 'ok' | 'error', text: string) => {
    setNotice({ type, text });
    window.setTimeout(() => setNotice(null), 5000);
  };

  const hydrate = (data: IntegrationState) => {
    setIntegration(data);
    setTelegramChatId(data.telegramChatId || '');
    setProjectId(data.needNumberProjectId || '1474');
    setCreateDeal(Boolean(data.needNumberCreateDeal));
    setMail({
      address: data.emailAddress || '', username: data.emailUsername || data.emailAddress || '', password: '',
      imapHost: data.emailImapHost || '', imapPort: String(data.emailImapPort || 993), imapSecure: data.emailImapSecure ?? true,
      smtpHost: data.emailSmtpHost || '', smtpPort: String(data.emailSmtpPort || 465), smtpSecure: data.emailSmtpSecure ?? true,
      fromName: data.emailFromName || 'Satori Studio', ignoreSenders: data.emailIgnoreSenders || '',
      ignoreSubjects: data.emailIgnoreSubjects || '', syncDays: String(data.emailSyncDays || 365),
    });
  };

  const load = async () => {
    setBusy('load');
    try {
      const [settingsRes, aiRes] = await Promise.all([
        fetch('/api/integrations/settings', { cache: 'no-store' }),
        fetch('/api/integrations/openai', { cache: 'no-store' }),
      ]);
      const settings = await settingsRes.json();
      const ai = await aiRes.json();
      if (!settingsRes.ok) throw new Error(settings.error || 'Не удалось загрузить интеграции');
      if (!aiRes.ok) throw new Error(ai.error || 'Не удалось загрузить AI');
      hydrate(settings);
      setOpenAi(ai);
    } catch (error) {
      notify('error', error instanceof Error ? error.message : 'Ошибка загрузки интеграций');
    } finally {
      setBusy(null);
    }
  };

  useEffect(() => { void load(); }, []);

  const webhookUrl = useMemo(() => {
    if (!integration?.needNumberWebhookPath) return '';
    return `${window.location.origin}${integration.needNumberWebhookPath}`;
  }, [integration]);

  const postJson = async (url: string, payload: Record<string, unknown>) => {
    const response = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'Запрос завершился ошибкой');
    return data;
  };

  const saveTelegram = async () => {
    setBusy('telegram-save');
    try {
      const data = await postJson('/api/integrations/settings', { telegramBotToken: telegramToken, telegramChatId });
      hydrate(data); setTelegramToken(''); notify('ok', 'Telegram сохранён и подключён к новой CRM');
    } catch (e) { notify('error', e instanceof Error ? e.message : 'Ошибка Telegram'); } finally { setBusy(null); }
  };
  const discoverTelegram = async () => {
    setBusy('telegram-discover');
    try {
      const data = await postJson('/api/integrations/telegram/discover', { telegramBotToken: telegramToken });
      setTelegramChatId(String(data.chatId || ''));
      notify('ok', data.firstName ? `Найден чат: ${data.firstName}` : `Найден Chat ID: ${data.chatId}`);
    } catch (e) { notify('error', e instanceof Error ? e.message : 'Chat ID не найден'); } finally { setBusy(null); }
  };
  const testTelegram = async () => {
    setBusy('telegram-test');
    try { await postJson('/api/integrations/telegram/test', {}); notify('ok', 'Telegram работает — тестовое сообщение отправлено'); await load(); }
    catch (e) { notify('error', e instanceof Error ? e.message : 'Telegram не отвечает'); } finally { setBusy(null); }
  };

  const emailPayload = () => ({
    emailAddress: mail.address, emailUsername: mail.username || mail.address, emailPassword: mail.password,
    emailImapHost: mail.imapHost, emailImapPort: Number(mail.imapPort) || 993, emailImapSecure: mail.imapSecure,
    emailSmtpHost: mail.smtpHost, emailSmtpPort: Number(mail.smtpPort) || 465, emailSmtpSecure: mail.smtpSecure,
    emailFromName: mail.fromName, emailIgnoreSenders: mail.ignoreSenders, emailIgnoreSubjects: mail.ignoreSubjects,
    emailSyncDays: Number(mail.syncDays) || 365,
  });
  const saveEmail = async (withTest = false) => {
    setBusy(withTest ? 'email-test' : 'email-save');
    try {
      const data = await postJson('/api/integrations/settings', emailPayload()); hydrate(data);
      if (withTest) await postJson('/api/integrations/email/test', {});
      setMail(v => ({ ...v, password: '' }));
      notify('ok', withTest ? 'Почта подключена: IMAP и SMTP работают' : 'Настройки почты сохранены');
      await load();
    } catch (e) { notify('error', e instanceof Error ? e.message : 'Ошибка почты'); } finally { setBusy(null); }
  };
  const syncEmail = async () => {
    setBusy('email-sync');
    try {
      const data = await postJson('/api/integrations/email/sync', {});
      notify('ok', data.imported ? `Почта обновлена: новых писем ${data.imported}` : 'Почта синхронизирована');
      await load();
    } catch (e) { notify('error', e instanceof Error ? e.message : 'Ошибка синхронизации почты'); } finally { setBusy(null); }
  };

  const saveNeedNumber = async () => {
    setBusy('need-save');
    try {
      const data = await postJson('/api/integrations/settings', { needNumberProjectId: projectId, needNumberCreateDeal: createDeal });
      hydrate(data); notify('ok', 'Need Number подключён к списку обзвона');
    } catch (e) { notify('error', e instanceof Error ? e.message : 'Ошибка Need Number'); } finally { setBusy(null); }
  };

  const saveOpenAi = async () => {
    setBusy('ai-save');
    try {
      const data = await postJson('/api/integrations/openai', { apiKey: openAiKey, model: openAi.model, baseUrl: openAi.baseUrl });
      setOpenAi(data); setOpenAiKey(''); notify('ok', 'AI API сохранён');
    } catch (e) { notify('error', e instanceof Error ? e.message : 'Ошибка AI'); } finally { setBusy(null); }
  };
  const testOpenAi = async () => {
    setBusy('ai-test');
    try { await postJson('/api/integrations/openai', { action: 'test' }); notify('ok', 'AI менеджер отвечает — подключение работает'); await load(); }
    catch (e) { notify('error', e instanceof Error ? e.message : 'AI не отвечает'); } finally { setBusy(null); }
  };
  const loadModels = async () => {
    setBusy('ai-models');
    try {
      const response = await fetch('/api/integrations/openai?models=1', { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Не удалось получить модели');
      setModels(Array.isArray(data.models) ? data.models : []);
      if (data.modelsError) notify('error', data.modelsError); else notify('ok', `Доступно моделей: ${(data.models || []).length}`);
    } catch (e) { notify('error', e instanceof Error ? e.message : 'Ошибка списка моделей'); } finally { setBusy(null); }
  };
  const disconnectOpenAi = async () => {
    setBusy('ai-disconnect');
    try { const data = await postJson('/api/integrations/openai', { action: 'disconnect' }); setOpenAi(data); notify('ok', 'AI API отключён'); }
    catch (e) { notify('error', e instanceof Error ? e.message : 'Не удалось отключить AI'); } finally { setBusy(null); }
  };

  return (
    <div className={`flex-1 overflow-y-auto p-6 ${isLight ? 'bg-[#F8F7F4]' : 'bg-[#121212]'}`}>
      <div className="mx-auto max-w-6xl space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Интеграции Satori</h1>
            <p className="mt-1 text-xs text-neutral-500">Все реальные каналы старой CRM подключены к новому интерфейсу. Секреты остаются на сервере — браузер получает только статусы.</p>
          </div>
          <button className={secondary} onClick={() => void load()} disabled={busy === 'load'}>
            {busy === 'load' ? <Loader2 className="mr-2 inline h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="mr-2 inline h-3.5 w-3.5" />}Обновить статусы
          </button>
        </div>

        {notice && (
          <div className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-xs ${notice.type === 'ok' ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300'}`}>
            {notice.type === 'ok' ? <CheckCircle2 className="h-4 w-4" /> : <CircleAlert className="h-4 w-4" />}{notice.text}
          </div>
        )}

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          <section className={card}>
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2"><MessageCircle className="h-5 w-5 text-sky-500" /><div><h2 className="text-sm font-bold">Telegram</h2><p className="text-[11px] text-neutral-500">Входящие, исходящие и файлы</p></div></div>
              <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${integration?.telegramConfigured ? 'bg-emerald-500/10 text-emerald-600' : 'bg-neutral-500/10 text-neutral-500'}`}>{integration?.telegramConfigured ? 'ПОДКЛЮЧЕНО' : 'НЕ ПОДКЛЮЧЕНО'}</span>
            </div>
            <div className="space-y-3">
              <div><label className="mb-1 block text-[11px] text-neutral-500">Bot token {integration?.telegramTokenConfigured ? '· уже сохранён' : ''}</label><input type="password" value={telegramToken} onChange={e => setTelegramToken(e.target.value)} placeholder={integration?.telegramTokenConfigured ? '•••••••• — оставь пустым, чтобы не менять' : '123456:ABC...'} className={input} /></div>
              <div><label className="mb-1 block text-[11px] text-neutral-500">Chat ID</label><input value={telegramChatId} onChange={e => setTelegramChatId(e.target.value)} className={input} /></div>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-neutral-500"><div>Транспорт: <b className="text-current">{integration?.telegramTransport || '—'}</b></div><div>Последнее входящее: <b className="text-current">{fmtDate(integration?.telegramLastUpdateAt)}</b></div></div>
              {integration?.telegramPollLastError && <div className="rounded-lg bg-rose-500/10 p-2 text-[11px] text-rose-600">{integration.telegramPollLastError}</div>}
              <div className="flex flex-wrap gap-2"><button className={primary} onClick={saveTelegram} disabled={busy !== null}><Save className="mr-1.5 inline h-3.5 w-3.5" />Сохранить</button><button className={secondary} onClick={discoverTelegram} disabled={busy !== null}>Найти Chat ID</button><button className={secondary} onClick={testTelegram} disabled={busy !== null}>Тест</button></div>
            </div>
          </section>

          <section className={card}>
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2"><Mail className="h-5 w-5 text-violet-500" /><div><h2 className="text-sm font-bold">Почта</h2><p className="text-[11px] text-neutral-500">IMAP + SMTP, синхронизация и ответы</p></div></div>
              <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${integration?.emailConfigured ? 'bg-emerald-500/10 text-emerald-600' : 'bg-neutral-500/10 text-neutral-500'}`}>{integration?.emailConfigured ? 'ПОДКЛЮЧЕНО' : 'НЕ ПОДКЛЮЧЕНО'}</span>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2"><label className="mb-1 block text-[11px] text-neutral-500">Email</label><input value={mail.address} onChange={e => setMail(v => ({ ...v, address: e.target.value }))} onBlur={() => setMail(v => ({ ...v, ...mailPreset(v.address), username: v.username || v.address }))} className={input} /></div>
              <div><label className="mb-1 block text-[11px] text-neutral-500">Логин</label><input value={mail.username} onChange={e => setMail(v => ({ ...v, username: e.target.value }))} className={input} /></div>
              <div><label className="mb-1 block text-[11px] text-neutral-500">Пароль приложения {integration?.emailPasswordConfigured ? '· сохранён' : ''}</label><input type="password" value={mail.password} onChange={e => setMail(v => ({ ...v, password: e.target.value }))} placeholder={integration?.emailPasswordConfigured ? '••••••••' : ''} className={input} /></div>
              <div><label className="mb-1 block text-[11px] text-neutral-500">IMAP</label><input value={mail.imapHost} onChange={e => setMail(v => ({ ...v, imapHost: e.target.value }))} className={input} /></div>
              <div><label className="mb-1 block text-[11px] text-neutral-500">SMTP</label><input value={mail.smtpHost} onChange={e => setMail(v => ({ ...v, smtpHost: e.target.value }))} className={input} /></div>
              <div><label className="mb-1 block text-[11px] text-neutral-500">Имя отправителя</label><input value={mail.fromName} onChange={e => setMail(v => ({ ...v, fromName: e.target.value }))} className={input} /></div>
              <div><label className="mb-1 block text-[11px] text-neutral-500">Глубина синхронизации, дней</label><input value={mail.syncDays} onChange={e => setMail(v => ({ ...v, syncDays: e.target.value }))} className={input} /></div>
            </div>
            <div className="mt-3 text-[11px] text-neutral-500">Последняя синхронизация: <b>{fmtDate(integration?.emailLastSyncAt)}</b>{integration?.emailLastSyncError ? <span className="ml-2 text-rose-600">{integration.emailLastSyncError}</span> : null}</div>
            <div className="mt-3 flex flex-wrap gap-2"><button className={primary} onClick={() => void saveEmail(false)} disabled={busy !== null}>Сохранить</button><button className={secondary} onClick={() => void saveEmail(true)} disabled={busy !== null}>Проверить IMAP/SMTP</button><button className={secondary} onClick={syncEmail} disabled={busy !== null}><RefreshCw className="mr-1.5 inline h-3.5 w-3.5" />Синхронизировать</button></div>
          </section>

          <section className={card}>
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2"><PhoneIncoming className="h-5 w-5 text-amber-500" /><div><h2 className="text-sm font-bold">Need Number</h2><p className="text-[11px] text-neutral-500">Проект лидогенерации → список обзвона</p></div></div>
              <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-[10px] font-bold text-emerald-600">WEBHOOK АКТИВЕН</span>
            </div>
            <div className="space-y-3"><div><label className="mb-1 block text-[11px] text-neutral-500">Project ID</label><input value={projectId} onChange={e => setProjectId(e.target.value)} className={input} /></div>
              <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={createDeal} onChange={e => setCreateDeal(e.target.checked)} /><span>Создавать сделку автоматически</span></label>
              <div><label className="mb-1 block text-[11px] text-neutral-500">Webhook URL</label><div className="flex gap-2"><input readOnly value={webhookUrl} className={input} /><button className={secondary} onClick={() => { void navigator.clipboard.writeText(webhookUrl); notify('ok', 'Webhook скопирован'); }}><Copy className="h-3.5 w-3.5" /></button></div></div>
              <p className="text-[11px] text-neutral-500">Новые сигналы не попадают в сделки сами по себе: они живут в разделе «Обзвон», пока не подтверждена реальная заявка.</p>
              <button className={primary} onClick={saveNeedNumber} disabled={busy !== null}><Save className="mr-1.5 inline h-3.5 w-3.5" />Сохранить</button>
            </div>
          </section>

          <section className={card}>
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-fuchsia-500" /><div><h2 className="text-sm font-bold">AI менеджер</h2><p className="text-[11px] text-neutral-500">OpenAI / совместимый gateway</p></div></div>
              <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${openAi.configured ? 'bg-emerald-500/10 text-emerald-600' : 'bg-neutral-500/10 text-neutral-500'}`}>{openAi.configured ? 'ПОДКЛЮЧЕНО' : 'НЕ ПОДКЛЮЧЕНО'}</span>
            </div>
            <div className="space-y-3"><div><label className="mb-1 block text-[11px] text-neutral-500">API key {openAi.masked ? `· ${openAi.masked}` : ''}</label><input type="password" value={openAiKey} onChange={e => setOpenAiKey(e.target.value)} placeholder={openAi.configured ? '•••••••• — оставь пустым, чтобы не менять' : 'sk-...'} className={input} /></div>
              <div><label className="mb-1 block text-[11px] text-neutral-500">Base URL</label><input value={openAi.baseUrl} onChange={e => setOpenAi(v => ({ ...v, baseUrl: e.target.value }))} className={input} /></div>
              <div><label className="mb-1 block text-[11px] text-neutral-500">Модель</label>{models.length ? <select value={openAi.model} onChange={e => setOpenAi(v => ({ ...v, model: e.target.value }))} className={input}>{models.map(model => <option key={model}>{model}</option>)}</select> : <input value={openAi.model} onChange={e => setOpenAi(v => ({ ...v, model: e.target.value }))} className={input} />}</div>
              <div className="flex flex-wrap gap-2"><button className={primary} onClick={saveOpenAi} disabled={busy !== null}><KeyRound className="mr-1.5 inline h-3.5 w-3.5" />Сохранить</button><button className={secondary} onClick={testOpenAi} disabled={busy !== null}>Тест AI</button><button className={secondary} onClick={loadModels} disabled={busy !== null}>Модели</button>{openAi.configured && <button className={secondary} onClick={disconnectOpenAi} disabled={busy !== null}><Unplug className="mr-1.5 inline h-3.5 w-3.5" />Отключить</button>}</div>
            </div>
          </section>

          <section className={card}>
            <div className="mb-3 flex items-center gap-2"><Store className="h-5 w-5 text-emerald-500" /><div><h2 className="text-sm font-bold">Заказы с сайта</h2><p className="text-[11px] text-neutral-500">Storefront → CRM</p></div></div>
            <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 p-3 text-xs text-emerald-700 dark:text-emerald-300"><CheckCircle2 className="h-4 w-4" /><span>Приём заказов сохранён через <b>/api/integrations/store-orders</b>. Он продолжает писать в ту же рабочую базу.</span></div>
          </section>

          <section className={card}>
            <div className="mb-3 flex items-center gap-2"><Server className="h-5 w-5 text-neutral-500" /><div><h2 className="text-sm font-bold">Архитектура переноса</h2><p className="text-[11px] text-neutral-500">Новый интерфейс + старый проверенный integration engine</p></div></div>
            <div className="space-y-2 text-xs text-neutral-500"><div className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />Новая CRM обслуживает интерфейс.</div><div className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />API, webhooks, база и фоновые синхронизации остаются серверными.</div><div className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />Никакие токены не хранятся в localStorage.</div></div>
          </section>
        </div>
      </div>
    </div>
  );
};
