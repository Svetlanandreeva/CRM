import React, { useState } from 'react';
import {
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  X
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';

export const FinanceView: React.FC = () => {
  const { payments, clients, deals, addPayment, openClientCockpit, theme } = useCrm();

  const isLight = theme === 'light';

  const [activeDirectionFilter, setActiveDirectionFilter] = useState<'all' | 'inflow' | 'outflow'>('all');
  const [isAddPaymentModalOpen, setIsAddPaymentModalOpen] = useState(false);

  // Form state
  const [selectedClientId, setSelectedClientId] = useState(clients[0]?.id || '');
  const [selectedDealId, setSelectedDealId] = useState(deals[0]?.id || '');
  const [amountInput, setAmountInput] = useState('');
  const [paymentType, setPaymentType] = useState<'prepayment' | 'final' | 'contractor_cost' | 'materials_cost'>('prepayment');
  const [paymentDirection, setPaymentDirection] = useState<'inflow' | 'outflow'>('inflow');
  const [paymentMethod, setPaymentMethod] = useState<'Банковский счет (Безнал)' | 'Карта' | 'СБП' | 'Наличные'>('Банковский счет (Безнал)');

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(val);
  };

  const totalInflows = payments.filter(p => p.direction === 'inflow').reduce((sum, p) => sum + p.amount, 0);
  const totalOutflows = payments.filter(p => p.direction === 'outflow').reduce((sum, p) => sum + p.amount, 0);
  const netProfit = totalInflows - totalOutflows;
  const totalClientDebt = clients.reduce((sum, c) => sum + c.currentDebt, 0);

  const filteredPayments = payments.filter((p) => {
    if (activeDirectionFilter === 'all') return true;
    return p.direction === activeDirectionFilter;
  });

  const handleRegisterPayment = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amountInput);
    if (!val || val <= 0) return;

    const cl = clients.find(c => c.id === selectedClientId) || clients[0];
    const dl = deals.find(d => d.id === selectedDealId) || deals[0];

    addPayment({
      clientId: cl.id,
      clientName: cl.name,
      dealId: dl?.id || 'd_manual',
      dealTitle: dl?.title || 'Прямой расчет',
      amount: val,
      type: paymentType,
      direction: paymentDirection,
      method: paymentMethod,
      status: 'completed',
    });

    setIsAddPaymentModalOpen(false);
    setAmountInput('');
  };

  const paymentTypeLabels: Record<string, string> = {
    prepayment: 'Предоплата',
    final: 'Остаток',
    contractor_cost: 'Оплата подрядчику',
    materials_cost: 'Закупка материалов',
  };

  return (
    <div className={`flex-1 flex flex-col min-h-0 overflow-hidden ${
      isLight ? 'bg-slate-50 text-slate-900' : 'bg-slate-950 text-slate-100'
    }`}>
      {/* Calm Header */}
      <div className={`px-6 py-4 border-b flex items-center justify-between shrink-0 ${
        isLight ? 'bg-white border-slate-200/80' : 'bg-slate-900 border-slate-800/80'
      }`}>
        <div>
          <h1 className="text-base font-semibold tracking-tight">
            Оплаты и баланс
          </h1>
          <p className="text-xs text-slate-500 font-normal mt-0.5">
            Учет входящих оплат, расходов на материалы и расчетов с клиентами
          </p>
        </div>

        <button
          onClick={() => setIsAddPaymentModalOpen(true)}
          className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors shadow-2xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Зафиксировать оплату</span>
        </button>
      </div>

      {/* 4 Quiet Metric Numbers in a single bar */}
      <div className={`px-6 py-3 border-b grid grid-cols-2 md:grid-cols-4 gap-4 text-xs shrink-0 ${
        isLight ? 'bg-white/60 border-slate-200/60' : 'bg-slate-900/60 border-slate-800/60'
      }`}>
        <div>
          <div className="text-[11px] text-slate-500 font-medium">Поступления</div>
          <div className="text-sm font-semibold font-mono tabular-nums text-emerald-600 mt-0.5">{formatCurrency(totalInflows)}</div>
        </div>
        <div>
          <div className="text-[11px] text-slate-500 font-medium">Расходы / Себестоимость</div>
          <div className="text-sm font-semibold font-mono tabular-nums text-rose-600 mt-0.5">{formatCurrency(totalOutflows)}</div>
        </div>
        <div>
          <div className="text-[11px] text-slate-500 font-medium">Чистый баланс</div>
          <div className="text-sm font-semibold font-mono tabular-nums text-slate-900 mt-0.5">{formatCurrency(netProfit)}</div>
        </div>
        <div>
          <div className="text-[11px] text-slate-500 font-medium">Дебиторская задолженность</div>
          <div className="text-sm font-semibold font-mono tabular-nums text-amber-600 mt-0.5">{formatCurrency(totalClientDebt)}</div>
        </div>
      </div>

      {/* Filter Row */}
      <div className={`px-6 py-2 border-b flex items-center gap-2 text-xs shrink-0 ${
        isLight ? 'bg-white/40 border-slate-200/50' : 'bg-slate-900/40 border-slate-800/50'
      }`}>
        <span className="text-slate-400 font-medium mr-1">Поток:</span>
        <button
          onClick={() => setActiveDirectionFilter('all')}
          className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
            activeDirectionFilter === 'all' ? 'bg-slate-200 text-slate-900 font-semibold' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Все ({payments.length})
        </button>
        <button
          onClick={() => setActiveDirectionFilter('inflow')}
          className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
            activeDirectionFilter === 'inflow' ? 'bg-emerald-100 text-emerald-800 font-semibold' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Приход
        </button>
        <button
          onClick={() => setActiveDirectionFilter('outflow')}
          className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
            activeDirectionFilter === 'outflow' ? 'bg-rose-100 text-rose-800 font-semibold' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Расход
        </button>
      </div>

      {/* Transactions Table */}
      <div className="flex-1 overflow-y-auto p-6">
        {filteredPayments.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-slate-400 text-xs font-normal">
            Нет записей об оплатах
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-separate border-spacing-y-2">
              <thead>
                <tr className="text-slate-500 dark:text-slate-400">
                  <th className="py-1 px-4 font-semibold text-xs">Дата</th>
                  <th className="py-1 px-4 font-semibold text-xs">Клиент / Проект</th>
                  <th className="py-1 px-4 font-semibold text-xs">Тип платежа</th>
                  <th className="py-1 px-4 font-semibold text-xs">Способ</th>
                  <th className="py-1 px-4 font-semibold text-xs text-right">Сумма</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((p) => {
                  const isInflow = p.direction === 'inflow';
                  return (
                    <tr
                      key={p.id}
                      className={`transition-colors ${
                        isLight 
                          ? 'bg-white hover:bg-slate-100/70 text-slate-800' 
                          : 'bg-slate-900/60 hover:bg-slate-800/60 text-slate-200'
                      }`}
                    >
                      <td className="py-2 px-4 rounded-l-lg font-mono tabular-nums text-xs text-slate-500 dark:text-slate-400 font-normal">
                        {p.date}
                      </td>

                      <td className="py-2 px-4 font-normal">
                        <button
                          onClick={() => openClientCockpit(p.clientId)}
                          className="font-normal text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-left block"
                        >
                          {p.clientName}
                        </button>
                        {p.dealTitle && (
                          <div className="text-[11px] font-normal text-slate-500 dark:text-slate-400 mt-0.5 truncate max-w-xs">{p.dealTitle}</div>
                        )}
                      </td>

                      <td className="py-2 px-4 font-normal">
                        <span className="font-normal text-slate-600 dark:text-slate-300">
                          {paymentTypeLabels[p.type] || p.type}
                        </span>
                      </td>

                      <td className="py-2 px-4 text-slate-500 dark:text-slate-400 font-normal">
                        {p.method}
                      </td>

                      <td className={`py-2 px-4 rounded-r-lg text-right font-mono tabular-nums font-normal text-xs ${
                        isInflow ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                      }`}>
                        {isInflow ? '+' : '-'}{formatCurrency(p.amount)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Payment Modal */}
      {isAddPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className={`w-full max-w-md rounded-xl shadow-xl overflow-hidden border ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800 text-white'
          }`}>
            <div className={`p-4 border-b flex items-center justify-between ${
              isLight ? 'border-slate-100 bg-slate-50/50' : 'border-slate-800 bg-slate-850'
            }`}>
              <h3 className="font-bold text-sm">Регистрация оплаты</h3>
              <button onClick={() => setIsAddPaymentModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRegisterPayment} className="p-4 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-lg">
                <button
                  type="button"
                  onClick={() => setPaymentDirection('inflow')}
                  className={`py-1.5 rounded-md font-semibold text-xs transition-colors flex items-center justify-center gap-1 ${
                    paymentDirection === 'inflow' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  <ArrowDownLeft className="w-3.5 h-3.5" />
                  <span>Поступление (Приход)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentDirection('outflow')}
                  className={`py-1.5 rounded-md font-semibold text-xs transition-colors flex items-center justify-center gap-1 ${
                    paymentDirection === 'outflow' ? 'bg-white text-rose-700 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>Расход / Себестоимость</span>
                </button>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Сумма (₽) *</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                  placeholder="напр., 150000"
                  className={`w-full border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                    isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
                  }`}
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Клиент</label>
                <select
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  className={`w-full border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                    isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
                  }`}
                >
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Тип операции</label>
                <select
                  value={paymentType}
                  onChange={(e) => setPaymentType(e.target.value as any)}
                  className={`w-full border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                    isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
                  }`}
                >
                  <option value="prepayment">Предоплата (50%)</option>
                  <option value="final">Финальный расчет</option>
                  <option value="materials_cost">Закупка материалов</option>
                  <option value="contractor_cost">Оплата цеху / подрядчику</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Способ оплаты</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className={`w-full border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                    isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
                  }`}
                >
                  <option value="Банковский счет (Безнал)">Банковский счет (Безнал)</option>
                  <option value="СБП">СБП (Быстрые платежи)</option>
                  <option value="Карта">Банковская карта</option>
                  <option value="Наличные">Наличный расчет</option>
                </select>
              </div>

              <div className="pt-3 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddPaymentModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 font-medium"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs"
                >
                  Сохранить
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
