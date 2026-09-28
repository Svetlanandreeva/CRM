import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, Mail, RefreshCw, Search, Send } from 'lucide-react';
import { useCrm } from '../../context/CrmContext';

type Channel='email'|'telegram';
type Filter='all'|'email'|'telegram'|'service';
type Thread={key:string;id:string;channel:Channel;contactId:string|null;title:string;subtitle:string;isService:boolean;unreadCount:number;lastMessageAt:string;lastSnippet:string;lastDirection:string};
type Message={id:string;direction:'incoming'|'outgoing';bodyText:string;receivedAt:string;sender?:string|null};
type Detail={channel:Channel;threadId:string;contactId:string|null;title:string;subtitle:string;isService:boolean;messages:Message[]};

const when=(value:string)=>{const d=new Date(value);if(Number.isNaN(d.getTime()))return'';return d.toDateString()===new Date().toDateString()?new Intl.DateTimeFormat('ru-RU',{hour:'2-digit',minute:'2-digit'}).format(d):new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'short'}).format(d).replace('.','')};

const ChannelIcon:React.FC<{channel:Channel;size?:number}>=({channel,size=14})=>channel==='telegram'?<Send size={size} strokeWidth={1.8}/>:<Mail size={size} strokeWidth={1.8}/>;

export const LiveInboxView:React.FC=()=>{
  const{clients,deals,setSelectedClientId,setCurrentTab}=useCrm();
  const[filter,setFilter]=useState<Filter>('all');
  const[search,setSearch]=useState('');
  const[threads,setThreads]=useState<Thread[]>([]);
  const[selected,setSelected]=useState<string|null>(null);
  const[detail,setDetail]=useState<Detail|null>(null);
  const[loading,setLoading]=useState(false);
  const[sending,setSending]=useState(false);
  const[draft,setDraft]=useState('');
  const[notice,setNotice]=useState('');
  const endRef=useRef<HTMLDivElement|null>(null);
  const flash=(text:string)=>{setNotice(text);window.setTimeout(()=>setNotice(''),2600)};

  async function loadThreads(preferred?:string|null){
    setLoading(true);
    try{
      const q=encodeURIComponent(search.trim());
      const rows:Thread[]=[];
      if(filter==='all'||filter==='email'||filter==='service'){
        const mode=filter==='service'?'service':'client';
        const r=await fetch(`/api/inbox?filter=${mode}&search=${q}`,{cache:'no-store'});
        const d=await r.json();
        if(r.ok&&Array.isArray(d.threads)) for(const t of d.threads){
          const isService=Boolean(t.isService);
          if(filter!=='service'&&isService)continue;
          rows.push({key:`email:${t.id}`,id:String(t.id),channel:'email',contactId:t.contactId||null,title:t.remoteName||t.remoteEmail||'Email',subtitle:t.subject||t.remoteEmail||'',isService,unreadCount:isService?0:Number(t.unreadCount||0),lastMessageAt:String(t.lastMessageAt||''),lastSnippet:String(t.lastSnippet||''),lastDirection:String(t.lastDirection||'')});
        }
      }
      if(filter==='all'||filter==='telegram'){
        const r=await fetch(`/api/messages/telegram?search=${q}`,{cache:'no-store'});
        const d=await r.json();
        if(r.ok&&Array.isArray(d.threads)) for(const t of d.threads) rows.push({key:`telegram:${t.id}`,id:String(t.id),channel:'telegram',contactId:t.contactId||t.id||null,title:t.remoteName||'Telegram',subtitle:t.remoteHandle||'Telegram',isService:false,unreadCount:Number(t.unreadCount||0),lastMessageAt:String(t.lastMessageAt||''),lastSnippet:String(t.lastSnippet||''),lastDirection:String(t.lastDirection||'')});
      }
      rows.sort((a,b)=>Number(b.unreadCount>0)-Number(a.unreadCount>0)||+new Date(b.lastMessageAt)-+new Date(a.lastMessageAt));
      setThreads(rows);
      const wanted=preferred||selected;
      setSelected(wanted&&rows.some(x=>x.key===wanted)?wanted:rows[0]?.key||null);
      if(!rows.length)setDetail(null);
    }catch(e){flash(e instanceof Error?e.message:'Не удалось загрузить сообщения')}finally{setLoading(false)}
  }

  async function loadDetail(key:string){
    const split=key.indexOf(':');const channel=key.slice(0,split) as Channel;const id=key.slice(split+1);
    try{
      if(channel==='telegram'){
        const r=await fetch(`/api/messages/telegram/${encodeURIComponent(id)}`,{cache:'no-store'});const d=await r.json();if(!r.ok)throw new Error(d.error||'Не удалось открыть Telegram');
        setDetail({channel,threadId:id,contactId:d.contact?.id||id,title:d.contact?.name||d.thread?.remoteName||'Telegram',subtitle:d.thread?.remoteHandle||'Telegram',isService:false,messages:(d.messages||[]).map((m:any)=>({id:String(m.id),direction:m.direction,bodyText:m.bodyText||'',receivedAt:m.receivedAt,sender:m.direction==='outgoing'?'Вы':d.contact?.name}))});
      }else{
        const r=await fetch(`/api/inbox/${encodeURIComponent(id)}`,{cache:'no-store'});const d=await r.json();if(!r.ok)throw new Error(d.error||'Не удалось открыть письмо');
        setDetail({channel,threadId:id,contactId:d.contact?.id||d.thread?.contactId||null,title:d.contact?.name||d.thread?.remoteName||d.thread?.remoteEmail||'Email',subtitle:[d.thread?.remoteEmail,d.thread?.subject].filter(Boolean).join(' · '),isService:Boolean(d.thread?.isService),messages:(d.messages||[]).map((m:any)=>({id:String(m.id),direction:m.direction,bodyText:m.bodyText||'',receivedAt:m.receivedAt,sender:m.direction==='outgoing'?'Вы':m.fromName||m.fromEmail}))});
      }
      setThreads(v=>v.map(t=>t.key===key?{...t,unreadCount:t.isService?0:0}:t));
    }catch(e){flash(e instanceof Error?e.message:'Не удалось открыть диалог')}
  }

  useEffect(()=>{const t=window.setTimeout(()=>void loadThreads(),120);return()=>window.clearTimeout(t)},[filter,search]);
  useEffect(()=>{if(selected)void loadDetail(selected)},[selected]);
  useEffect(()=>{requestAnimationFrame(()=>endRef.current?.scrollIntoView({block:'end'}))},[detail?.messages.length]);

  const unread=useMemo(()=>threads.filter(t=>!t.isService).reduce((s,t)=>s+t.unreadCount,0),[threads]);
  const requiresReply=threads.filter(t=>!t.isService&&t.lastDirection!=='outgoing').length;
  const client=clients.find(c=>c.id===detail?.contactId);
  const deal=deals.find(d=>d.clientId===detail?.contactId&&!['closed_lost','closed_won'].includes(d.stage));

  async function refresh(){await loadThreads(selected);if(selected)await loadDetail(selected);flash('Сообщения обновлены')}
  async function send(){if(!detail||!draft.trim()||detail.isService)return;setSending(true);try{const r=detail.channel==='telegram'?await fetch('/api/integrations/telegram/reply',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({contactId:detail.contactId,text:draft.trim()})}):await fetch(`/api/inbox/${encodeURIComponent(detail.threadId)}/reply`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({message:draft.trim()})});const d=await r.json();if(!r.ok)throw new Error(d.error||'Не удалось отправить');setDraft('');if(selected)await loadDetail(selected);await loadThreads(selected)}catch(e){flash(e instanceof Error?e.message:'Ошибка отправки')}finally{setSending(false)}}
  const openClient=()=>{if(detail?.contactId){setSelectedClientId(detail.contactId);setCurrentTab('client_cockpit')}};

  return <div className="min-h-[1000px] w-[1330px] bg-[#f7f5f2] px-[38px] py-[26px] text-[#1f1d1c]">
    <div className="flex items-end justify-between"><div><div className="text-[10px] font-medium uppercase tracking-[.12em] text-[#8e867f]">Коммуникации</div><h1 className="mt-1 text-[30px] font-semibold tracking-[-.035em]">Сообщения</h1><p className="mt-1 text-[11px] text-[#7c756f]">{unread} непрочитанных · {requiresReply} требуют ответа. Сервисные в эти цифры не входят.</p></div><button onClick={()=>void refresh()} className="grid h-[42px] w-[42px] place-items-center rounded-[12px] border border-[#e6e0da] bg-white"><RefreshCw size={14}/></button></div>

    <div className="mt-5 flex items-center gap-2">{([['all','Все'],['email','Email'],['telegram','Telegram'],['service','Сервисные']] as [Filter,string][]).map(([id,label])=><button key={id} onClick={()=>setFilter(id)} className={`h-[34px] rounded-[11px] px-4 text-[10px] font-medium ${filter===id?'bg-[#2a292b] text-white':'border border-[#e6e0da] bg-white'}`}>{label}</button>)}<label className="ml-auto flex h-[38px] w-[300px] items-center rounded-[11px] border border-[#e6e0da] bg-white px-3"><Search size={12} className="text-[#8e867f]"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Поиск..." className="ml-2 min-w-0 flex-1 bg-transparent text-[10px] outline-none"/></label></div>
    {notice&&<div className="fixed right-8 top-8 z-50 rounded-[12px] bg-[#2a292b] px-4 py-3 text-[10px] text-white shadow-xl">{notice}</div>}

    <div className="mt-4 grid h-[790px] grid-cols-[340px_1fr_300px] gap-3">
      <section className="flex min-h-0 flex-col overflow-hidden rounded-[18px] border border-[#e6e0da] bg-white"><div className="flex h-[54px] items-center px-4"><h2 className="text-[16px] font-semibold">Диалоги</h2><span className="ml-auto text-[9px] text-[#8e867f]">{threads.length}</span></div><div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">{loading?<div className="grid h-32 place-items-center"><Loader2 className="animate-spin" size={18}/></div>:threads.map(t=><button key={t.key} onClick={()=>setSelected(t.key)} className={`mb-1 flex min-h-[64px] w-full items-center gap-3 rounded-[13px] px-3 text-left ${selected===t.key?'bg-[#f5f1ed]':'hover:bg-[#fbfaf8]'}`}><span className={`grid h-[38px] w-[38px] shrink-0 place-items-center rounded-[12px] ${t.channel==='telegram'?'bg-[#dceaf7] text-[#56728e]':'bg-[#f6e4cf] text-[#8b684b]'}`}><ChannelIcon channel={t.channel}/></span><span className="min-w-0 flex-1"><span className="flex items-center"><b className="truncate text-[10px]">{t.title}</b><span className="ml-auto text-[8px] text-[#8e867f]">{when(t.lastMessageAt)}</span></span><span className="mt-1 block truncate text-[9px] text-[#817a74]">{t.lastSnippet||t.subtitle}</span>{t.isService&&<span className="mt-1 inline-block rounded-full bg-[#f0ece8] px-2 py-0.5 text-[7px] text-[#817a74]">сервисное</span>}</span>{!t.isService&&t.unreadCount>0&&<span className="grid h-5 min-w-5 place-items-center rounded-full bg-[#d98395] px-1 text-[8px] text-white">{t.unreadCount}</span>}</button>)}{!loading&&!threads.length&&<div className="grid h-40 place-items-center text-[10px] text-[#8e867f]">Диалогов нет</div>}</div></section>

      <section className="flex min-h-0 flex-col overflow-hidden rounded-[18px] border border-[#e6e0da] bg-white">{!detail?<div className="grid flex-1 place-items-center text-[11px] text-[#8e867f]">Выберите диалог</div>:<><header className="flex h-[66px] items-center border-b border-[#eee9e4] px-5"><span className={`grid h-[40px] w-[40px] place-items-center rounded-[12px] ${detail.channel==='telegram'?'bg-[#dceaf7]':'bg-[#f6e4cf]'}`}><ChannelIcon channel={detail.channel} size={16}/></span><div className="ml-3 min-w-0"><b className="block truncate text-[12px]">{detail.title}</b><span className="mt-1 block truncate text-[9px] text-[#817a74]">{detail.channel==='telegram'?'Telegram':'Email'} · {detail.subtitle}</span></div>{detail.isService&&<span className="ml-auto rounded-full bg-[#f0ece8] px-3 py-1.5 text-[8px] text-[#817a74]">Сервисное · без unread</span>}</header><div className="min-h-0 flex-1 overflow-y-auto p-5">{detail.messages.map(m=><div key={m.id} className={`mb-3 flex ${m.direction==='outgoing'?'justify-end':'justify-start'}`}><div className={`max-w-[78%] rounded-[14px] px-4 py-3 ${m.direction==='outgoing'?'bg-[#e5eef8]':'bg-[#f6f3f0]'}`}><div className="whitespace-pre-wrap break-words text-[11px] leading-5">{m.bodyText}</div><div className="mt-2 flex items-center justify-end gap-1 text-[8px] text-[#938b84]"><ChannelIcon channel={detail.channel} size={9}/>{when(m.receivedAt)}</div></div></div>)}<div ref={endRef}/></div><footer className="border-t border-[#eee9e4] p-4">{detail.isService?<div className="rounded-[11px] bg-[#f7f4f0] px-4 py-3 text-center text-[9px] text-[#817a74]">Сервисный диалог: уведомления и счётчик непрочитанных отключены.</div>:<div className="flex gap-2"><input value={draft} onChange={e=>setDraft(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')void send()}} placeholder="Написать сообщение..." className="h-[42px] min-w-0 flex-1 rounded-[11px] border border-[#e6e0da] bg-[#fbfaf8] px-4 text-[11px] outline-none"/><button onClick={()=>void send()} disabled={sending||!draft.trim()} className="grid h-[42px] w-[72px] place-items-center rounded-[11px] bg-[#2a292b] text-white disabled:opacity-40">{sending?<Loader2 size={14} className="animate-spin"/>:<Send size={14}/>}</button></div>}</footer></>}</section>

      <section className="overflow-hidden rounded-[18px] border border-[#e6e0da] bg-white p-5"><h2 className="text-[16px] font-semibold">Контекст</h2>{detail?<><div className="mt-4 rounded-[12px] bg-[#fbfaf8] p-4"><div className="text-[9px] text-[#817a74]">Клиент</div><b className="mt-1 block text-[11px]">{client?.name||detail.title}</b><div className="mt-2 text-[9px] text-[#817a74]">{client?.company||client?.email||client?.phone||'Не привязан к карточке'}</div>{client&&<button onClick={openClient} className="mt-3 h-[32px] w-full rounded-[9px] border border-[#e6e0da] bg-white text-[9px]">Открыть клиента</button>}</div><div className="mt-3 rounded-[12px] bg-[#fbfaf8] p-4"><div className="text-[9px] text-[#817a74]">Активная сделка</div>{deal?<><b className="mt-1 block truncate text-[11px]">{deal.title}</b><span className="mt-2 block text-[9px] text-[#817a74]">{new Intl.NumberFormat('ru-RU').format(deal.amount)} ₽</span></>:<div className="mt-2 text-[9px] text-[#8e867f]">Нет активной сделки</div>}</div><div className="mt-3 rounded-[12px] bg-[#f7f3ee] p-4 text-[9px] leading-4 text-[#716963]">Иконка слева всегда показывает реальный канал: самолётик — Telegram, конверт — Email. Сервисные сообщения видны только в отдельном разделе и не считаются непрочитанными.</div></>:<div className="py-20 text-center text-[10px] text-[#8e867f]">Выберите диалог</div>}</section>
    </div>
  </div>;
};
