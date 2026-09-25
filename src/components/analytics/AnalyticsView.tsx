import React from 'react';
import {
  TrendingUp,
  AlertOctagon,
  Award
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { DEAL_STAGES } from '../../data/mockData';
import { CustomerEngagementHeatmap } from './CustomerEngagementHeatmap';

export const AnalyticsView: React.FC = () => {
  const { clients, deals, managers, theme } = useCrm();
  const isLight = theme === 'light';

  const totalWonDeals = deals.filter(d => d.stage === 'closed_won');
  const totalRevenue = totalWonDeals.reduce((sum, d) => sum + d.amount, 0);
  const averageCheck = totalWonDeals.length > 0 ? Math.round(totalRevenue / totalWonDeals.length) : 0;
  const conversionRate = deals.length > 0 ? Math.round((totalWonDeals.length / deals.length) * 100) : 0;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(val);
  };

  // Lost deal reasons
  const lostReasonsData = [
    { reason: 'Слишком высокая стоимость (дорого)', count: 4, pct: 45 },
    { reason: 'Срок изготовления больше 25 дней', count: 2, pct: 25 },
    { reason: 'Заморозка бюджета / перенос объекта', count: 2, pct: 20 },
    { reason: 'Выбрали готовое стандартное решение', count: 1, pct: 10 },
  ];

  return (
    <div className={`flex-1 flex flex-col min-h-0 overflow-y-auto p-6 space-y-6 ${
      isLight ? 'bg-slate-50/70 text-slate-900' : 'bg-slate-950 text-slate-100'
    }`}>
      {/* Top Header */}
      <div>
        <h1 className={`text-lg font-semibold tracking-tight flex items-center gap-2 ${
          isLight ? 'text-slate-900' : 'text-white'
        }`}>
          <TrendingUp className="w-4 h-4 text-indigo-600" />
          <span>Аналитика продаж, конверсии и эффективности</span>
        </h1>
        <p className="text-xs text-slate-500 font-normal mt-0.5">
          Анализ воронок, средний чек, каналы привлечения клиентов и показатели команды
        </p>
      </div>

      {/* KPI 4 Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={`p-5 rounded-xl border shadow-2xs ${
          isLight ? 'bg-white border-slate-200/80' : 'bg-slate-900 border-slate-800'
        }`}>
          <div className="text-xs font-medium text-slate-500">
            Закрытые продажи
          </div>
          <div className="text-2xl font-semibold font-mono text-emerald-600 tabular-nums tracking-tight mt-2">
            {formatCurrency(totalRevenue)}
          </div>
          <div className="text-xs font-normal text-slate-500 mt-1">
            {totalWonDeals.length} успешных договоров
          </div>
        </div>

        <div className={`p-5 rounded-xl border shadow-2xs ${
          isLight ? 'bg-white border-slate-200/80' : 'bg-slate-900 border-slate-800'
        }`}>
          <div className="text-xs font-medium text-slate-500">
            Средний чек сделки
          </div>
          <div className={`text-2xl font-semibold font-mono tabular-nums tracking-tight mt-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
            {formatCurrency(averageCheck)}
          </div>
          <div className="text-xs font-medium text-emerald-600 mt-1">+24% к прошлому кварталу</div>
        </div>

        <div className={`p-5 rounded-xl border shadow-2xs ${
          isLight ? 'bg-white border-slate-200/80' : 'bg-slate-900 border-slate-800'
        }`}>
          <div className="text-xs font-medium text-slate-500">
            Конверсия воронки
          </div>
          <div className="text-2xl font-semibold font-mono text-indigo-600 tabular-nums tracking-tight mt-2">
            {conversionRate}%
          </div>
          <div className="text-xs font-normal text-slate-500 mt-1">
            Из лида в оплату и отгрузку
          </div>
        </div>

        <div className={`p-5 rounded-xl border shadow-2xs ${
          isLight ? 'bg-white border-slate-200/80' : 'bg-slate-900 border-slate-800'
        }`}>
          <div className="text-xs font-medium text-slate-500">
            Активная база клиентов
          </div>
          <div className={`text-2xl font-semibold font-mono tabular-nums tracking-tight mt-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
            {clients.length}
          </div>
          <div className="text-xs font-medium text-amber-600 mt-1">6 ключевых VIP заказчиков</div>
        </div>
      </div>

      {/* Funnel Stage Breakdown */}
      <div className={`p-5 rounded-xl border shadow-2xs space-y-4 ${
        isLight ? 'bg-white border-slate-200/80' : 'bg-slate-900 border-slate-800'
      }`}>
        <h2 className={`text-xs font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>
          Этапы воронки и конверсия продвижения
        </h2>

        <div className="space-y-3">
          {DEAL_STAGES.filter(s => s.id !== 'closed_lost').map((stage) => {
            const count = deals.filter(d => d.stage === stage.id).length;
            const sum = deals.filter(d => d.stage === stage.id).reduce((s, d) => s + d.amount, 0);

            return (
              <div key={stage.id} className="flex items-center gap-4 text-xs font-normal">
                <span className={`w-36 font-medium truncate ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>{stage.title}</span>
                <div className="flex-1 bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.max(8, (count / deals.length) * 100)}%`,
                      backgroundColor: stage.color,
                    }}
                  />
                </div>
                <span className="font-mono tabular-nums text-slate-500 w-16 text-right font-normal">{count} шт</span>
                <span className={`font-mono tabular-nums font-medium w-32 text-right text-xs ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {formatCurrency(sum)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Customer Engagement & Profitability Clusters Heatmap */}
      <CustomerEngagementHeatmap />

      {/* Row: Manager Leaderboard & Lost Deal Reasons */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Manager Leaderboard */}
        <div className={`p-5 rounded-xl border shadow-2xs space-y-4 ${
          isLight ? 'bg-white border-slate-200/80' : 'bg-slate-900 border-slate-800'
        }`}>
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-500" />
            <h2 className={`text-xs font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Эффективность менеджеров Satori
            </h2>
          </div>

          <div className="space-y-2.5">
            {managers.map((m, idx) => (
              <div key={m.id} className={`p-3 rounded-lg border flex items-center justify-between ${
                isLight ? 'bg-slate-50/70 border-slate-200/70' : 'bg-slate-850 border-slate-800'
              }`}>
                <div className="flex items-center gap-3">
                  <span className="w-5 text-center font-mono tabular-nums text-xs text-slate-400">#{idx + 1}</span>
                  <img src={m.avatar} alt={m.name} className="w-8 h-8 rounded-full object-cover border border-slate-200" />
                  <div>
                    <div className="font-medium text-xs text-slate-900">{m.name}</div>
                    <div className="text-[11px] text-slate-500 font-normal">{m.role}</div>
                  </div>
                </div>

                <div className="text-right font-mono tabular-nums">
                  <div className="text-xs font-medium text-emerald-600">{formatCurrency(m.revenue)}</div>
                  <div className="text-[11px] text-slate-400 font-normal">{m.dealsWon} сделок закрыто</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Reasons of Refusal / Lost */}
        <div className={`p-5 rounded-xl border shadow-2xs space-y-4 ${
          isLight ? 'bg-white border-slate-200/80' : 'bg-slate-900 border-slate-800'
        }`}>
          <div className="flex items-center gap-2">
            <AlertOctagon className="w-4 h-4 text-rose-600" />
            <h2 className={`text-xs font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Причины отказов и срывов
            </h2>
          </div>

          <div className="space-y-3">
            {lostReasonsData.map((item, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className={`font-normal ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>{item.reason}</span>
                  <span className="font-mono tabular-nums text-slate-500 font-normal">{item.count} сл. ({item.pct}%)</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-rose-500 rounded-full" style={{ width: `${item.pct}%` }} />
                </div>
              </div>
            ))}
          </div>

          <p className={`text-[11px] pt-3 border-t leading-relaxed font-normal ${
            isLight ? 'border-slate-100 text-slate-500' : 'border-slate-800 text-slate-400'
          }`}>
            💡 Рекомендация CRM: 45% отказов вызваны ценой — предлагайте заказчикам альтернативные материалы (например, МДФ в шпоне дуба вместо массива или сталь в порошковой окраске вместо цельной латуни).
          </p>
        </div>

      </div>
    </div>
  );
};
