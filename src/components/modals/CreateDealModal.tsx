import React, { useState } from 'react';
import { Briefcase, X } from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { DealStage } from '../../types/crm';
import { DEAL_STAGES } from '../../data/mockData';

export const CreateDealModal: React.FC = () => {
  const { isCreateDealOpen, setIsCreateDealOpen, addDeal, clients, currentManager, setCurrentTab, setSelectedDealId, theme } = useCrm();
  const isLight = theme === 'light';

  const [title, setTitle] = useState('');
  const [clientId, setClientId] = useState(clients[0]?.id || '');
  const [amount, setAmount] = useState('');
  const [primeCost, setPrimeCost] = useState('');
  const [stage, setStage] = useState<DealStage>('lead');
  const [deadline, setDeadline] = useState('2026-10-30');
  const [itemTitle, setItemTitle] = useState('');
  const [itemMaterial, setItemMaterial] = useState('');

  if (!isCreateDealOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const amt = parseFloat(amount) || 0;
    const cost = parseFloat(primeCost) || Math.round(amt * 0.55);
    const client = clients.find(c => c.id === clientId) || clients[0];

    const newDeal = addDeal({
      title: title.trim(),
      clientId: client.id,
      clientName: client.name + (client.company ? ` (${client.company})` : ''),
      amount: amt,
      primeCost: cost,
      stage,
      probability: stage === 'lead' ? 25 : stage === 'prepayment' ? 85 : 50,
      deadline,
      assignedManager: currentManager.name,
      items: [
        {
          id: `it_${Date.now()}`,
          title: itemTitle || title,
          quantity: 1,
          unitPrice: amt,
          primeCost: cost,
          material: itemMaterial || 'По техническому заданию',
        }
      ]
    });

    setIsCreateDealOpen(false);
    setSelectedDealId(newDeal.id);
    setCurrentTab('deals');
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className={`rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto border ${
        isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
      }`}>
        <div className={`flex items-center justify-between pb-3 border-b ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
          <h2 className="text-base font-bold flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-indigo-600" />
            <span>Создать новую сделку / проект</span>
          </h2>
          <button onClick={() => setIsCreateDealOpen(false)} className="text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Название проекта / изделия *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Например: Изготовление стеллажей и витрин из латуни"
              className={`w-full rounded-xl p-2.5 border font-semibold ${
                isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
              }`}
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Клиент *</label>
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className={`w-full rounded-xl p-2.5 border font-semibold ${
                isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
              }`}
            >
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.name} {c.company ? `(${c.company})` : ''}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Сумма сделки (₽) *</label>
              <input
                type="number"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="450000"
                className={`w-full rounded-xl p-2.5 border font-mono font-bold ${
                  isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
                }`}
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Плановая себестоимость (₽)</label>
              <input
                type="number"
                value={primeCost}
                onChange={(e) => setPrimeCost(e.target.value)}
                placeholder="210000"
                className={`w-full rounded-xl p-2.5 border font-mono font-bold ${
                  isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
                }`}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Стартовый этап воронки</label>
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value as DealStage)}
                className={`w-full rounded-xl p-2.5 border font-semibold ${
                  isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
                }`}
              >
                {DEAL_STAGES.filter(s => s.id !== 'closed_lost').map(s => (
                  <option key={s.id} value={s.id}>{s.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Дедлайн отгрузки</label>
              <input
                type="date"
                required
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className={`w-full rounded-xl p-2.5 border font-semibold ${
                  isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
                }`}
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Спецификация материалов</label>
            <input
              type="text"
              value={itemMaterial}
              onChange={(e) => setItemMaterial(e.target.value)}
              placeholder="Массив дуба, листовая латунь 3мм, подсветка 3000К"
              className={`w-full rounded-xl p-2.5 border ${
                isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
              }`}
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsCreateDealOpen(false)}
              className="px-4 py-2 font-bold text-slate-600 hover:text-slate-900"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-xs"
            >
              Создать сделку в канбане
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
