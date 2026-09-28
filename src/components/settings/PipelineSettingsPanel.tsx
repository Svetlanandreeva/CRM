import React, { useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Loader2, Plus, RefreshCw, Save, Trash2 } from 'lucide-react';

type Stage = {
  id: string;
  name: string;
  order: number;
  color: string;
  isWon?: boolean;
  isLost?: boolean;
  deals?: unknown[];
};

const protectedNames = new Set(['Доставка', 'Закрыто', 'Отказ']);

export const PipelineSettingsPanel: React.FC = () => {
  const [stages, setStages] = useState<Stage[]>([]);
  const [drafts, setDrafts] = useState<Record<string, { name: string; color: string }>>({});
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('#a497cd');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');

  const ordered = useMemo(() => [...stages].sort((a, b) => a.order - b.order), [stages]);
  const flash = (text: string) => { setNotice(text); window.setTimeout(() => setNotice(''), 3500); };

  const load = async () => {
    setBusy(true);
    try {
      const r = await fetch('/api/pipeline', { cache: 'no-store' });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Не удалось загрузить этапы');
      const rows = Array.isArray(data) ? data : [];
      setStages(rows);
      setDrafts(Object.fromEntries(rows.map((s: Stage) => [s.id, { name: s.name, color: s.color || '#64748b' }])));
    } catch (e) { flash(e instanceof Error ? e.message : 'Ошибка загрузки'); }
    finally { setBusy(false); }
  };

  useEffect(() => { void load(); }, []);

  const saveStage = async (stage: Stage) => {
    const draft = drafts[stage.id] || { name: stage.name, color: stage.color };
    setBusy(true);
    try {
      const r = await fetch('/api/pipeline', { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ stageId: stage.id, name: draft.name.trim(), color: draft.color }) });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Не удалось сохранить этап');
      flash('Этап сохранён');
      await load();
    } catch (e) { flash(e instanceof Error ? e.message : 'Ошибка сохранения'); setBusy(false); }
  };

  const addStage = async () => {
    if (!newName.trim()) return;
    setBusy(true);
    try {
      const r = await fetch('/api/pipeline', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name: newName.trim(), color: newColor }) });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Не удалось добавить этап');
      setNewName('');
      flash('Новый этап добавлен');
      await load();
    } catch (e) { flash(e instanceof Error ? e.message : 'Ошибка добавления'); setBusy(false); }
  };

  const removeStage = async (stage: Stage) => {
    if (!window.confirm(`Удалить этап «${stage.name}»?`)) return;
    setBusy(true);
    try {
      const r = await fetch(`/api/pipeline?stageId=${encodeURIComponent(stage.id)}`, { method: 'DELETE' });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Не удалось удалить этап');
      flash('Этап удалён');
      await load();
    } catch (e) { flash(e instanceof Error ? e.message : 'Ошибка удаления'); setBusy(false); }
  };

  const move = async (stage: Stage, direction: -1 | 1) => {
    const index = ordered.findIndex(s => s.id === stage.id);
    const other = ordered[index + direction];
    if (!other) return;
    setBusy(true);
    try {
      const payloads = [
        { stageId: stage.id, order: other.order },
        { stageId: other.id, order: stage.order },
      ];
      for (const payload of payloads) {
        const r = await fetch('/api/pipeline', { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || 'Не удалось изменить порядок');
      }
      await load();
    } catch (e) { flash(e instanceof Error ? e.message : 'Ошибка порядка'); setBusy(false); }
  };

  return <div className="max-w-4xl space-y-5">
    <div className="flex items-start justify-between gap-4">
      <div><h2 className="text-[20px] font-semibold">Этапы воронки</h2><p className="mt-1 text-[12px] text-neutral-500">Добавляйте этапы, меняйте название, цвет и порядок. Этап с активными сделками удалить нельзя.</p></div>
      <button onClick={() => void load()} disabled={busy} className="flex h-9 items-center gap-2 rounded-xl border border-black/10 bg-white px-3 text-[11px]"><RefreshCw size={13} className={busy ? 'animate-spin' : ''}/>Обновить</button>
    </div>

    {notice && <div className="rounded-xl bg-[#2a292b] px-4 py-3 text-[11px] text-white">{notice}</div>}

    <div className="rounded-2xl border border-black/[0.08] bg-white p-4">
      <div className="mb-3 text-[11px] font-semibold text-neutral-500">НОВЫЙ ЭТАП</div>
      <div className="flex gap-2">
        <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Например: Образец согласован" className="h-10 flex-1 rounded-xl border border-black/10 px-3 text-[12px] outline-none focus:border-black/25"/>
        <input type="color" value={newColor} onChange={e => setNewColor(e.target.value)} className="h-10 w-12 rounded-xl border border-black/10 bg-white p-1"/>
        <button onClick={() => void addStage()} disabled={busy || !newName.trim()} className="flex h-10 items-center gap-2 rounded-xl bg-[#2a292b] px-4 text-[11px] font-medium text-white disabled:opacity-40"><Plus size={14}/>Добавить</button>
      </div>
    </div>

    <div className="overflow-hidden rounded-2xl border border-black/[0.08] bg-white">
      {busy && !stages.length ? <div className="grid h-40 place-items-center"><Loader2 className="animate-spin"/></div> : ordered.map((stage, index) => {
        const locked = Boolean(stage.isWon || stage.isLost || protectedNames.has(stage.name));
        const draft = drafts[stage.id] || { name: stage.name, color: stage.color };
        return <div key={stage.id} className="grid min-h-[68px] grid-cols-[44px_1fr_56px_110px_138px] items-center gap-3 border-b border-black/[0.06] px-4 last:border-b-0">
          <span className="text-[11px] text-neutral-400">{index + 1}</span>
          <div className="flex items-center gap-3"><input type="color" value={draft.color} onChange={e => setDrafts(v => ({ ...v, [stage.id]: { ...draft, color: e.target.value } }))} className="h-8 w-9 rounded-lg border border-black/10 bg-white p-1"/><input value={draft.name} disabled={locked} onChange={e => setDrafts(v => ({ ...v, [stage.id]: { ...draft, name: e.target.value } }))} className="h-9 min-w-0 flex-1 rounded-lg border border-black/10 px-3 text-[12px] disabled:bg-neutral-50 disabled:text-neutral-500"/></div>
          <span className="text-center text-[11px] text-neutral-500">{Array.isArray(stage.deals) ? stage.deals.length : 0}</span>
          <div className="flex justify-center gap-1"><button onClick={() => void move(stage, -1)} disabled={index === 0 || busy} className="grid h-8 w-8 place-items-center rounded-lg border border-black/10 disabled:opacity-30"><ArrowUp size={13}/></button><button onClick={() => void move(stage, 1)} disabled={index === ordered.length - 1 || busy} className="grid h-8 w-8 place-items-center rounded-lg border border-black/10 disabled:opacity-30"><ArrowDown size={13}/></button></div>
          <div className="flex justify-end gap-2"><button onClick={() => void saveStage(stage)} disabled={busy} className="grid h-8 w-8 place-items-center rounded-lg bg-[#edf2f8] text-[#46617d]"><Save size={13}/></button><button onClick={() => void removeStage(stage)} disabled={locked || busy || (Array.isArray(stage.deals) && stage.deals.length > 0)} title={locked ? 'Системный этап' : 'Удалить'} className="grid h-8 w-8 place-items-center rounded-lg bg-[#f7e5e8] text-[#9c6570] disabled:opacity-30"><Trash2 size={13}/></button></div>
        </div>;
      })}
    </div>
    <div className="text-[10px] text-neutral-400">Системные этапы «Доставка», «Закрыто» и «Отказ» защищены от удаления/переименования, чтобы не ломать автоматизацию.</div>
  </div>;
};
