import React from 'react';
import {
  Truck,
  Star,
  Clock,
  ArrowUpRight
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';

export const ContractorsView: React.FC = () => {
  const { contractors, productionOrders, setCurrentTab, theme } = useCrm();
  const isLight = theme === 'light';

  return (
    <div className={`flex-1 flex flex-col min-h-0 overflow-hidden ${
      isLight ? 'bg-slate-100 text-slate-900' : 'bg-slate-950 text-slate-100'
    }`}>
      {/* Top Header */}
      <div className={`p-5 border-b space-y-1 shrink-0 shadow-xs ${
        isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
      }`}>
        <h1 className={`text-xl font-bold tracking-tight flex items-center gap-2.5 ${
          isLight ? 'text-slate-900' : 'text-white'
        }`}>
          <Truck className="w-5 h-5 text-sky-600" />
          <span>Подрядчики, поставщики и производственные цеха ({contractors.length})</span>
        </h1>
        <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
          Проверенные партнеры Satori: лазерный раскрой металлов, столярные цеха, швейные мануфактуры и лесопилки
        </p>
      </div>

      {/* Contractors Grid */}
      <div className="flex-1 overflow-y-auto p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {contractors.map((contractor) => {
            const activeOrders = productionOrders.filter(
              po => po.contractorName.toLowerCase().includes(contractor.name.toLowerCase()) ||
                    contractor.name.toLowerCase().includes(po.contractorName.toLowerCase())
            );

            return (
              <div
                key={contractor.id}
                className={`p-5 rounded-2xl border space-y-4 shadow-xs transition-all ${
                  isLight 
                    ? 'bg-white border-slate-200 hover:border-sky-300' 
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className={`text-base font-bold leading-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      {contractor.name}
                    </h2>
                    <p className="text-xs font-semibold text-indigo-600 mt-1">
                      {contractor.specialization}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs font-mono font-bold shrink-0">
                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    <span>{contractor.rating}</span>
                  </div>
                </div>

                {/* Key Contacts */}
                <div className={`grid grid-cols-2 gap-3 text-xs p-3.5 rounded-xl border ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-850 border-slate-800'
                }`}>
                  <div>
                    <div className={`text-[11px] font-bold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      Контактное лицо
                    </div>
                    <div className="font-bold text-slate-800 mt-1">{contractor.contactPerson}</div>
                    <a href={`tel:${contractor.phone}`} className="text-indigo-600 hover:underline font-mono text-xs block mt-0.5">
                      {contractor.phone}
                    </a>
                  </div>

                  <div>
                    <div className={`text-[11px] font-bold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      Сроки и прайс
                    </div>
                    <div className="font-bold text-slate-800 mt-1">
                      {contractor.pricingTier}
                    </div>
                    <div className="text-xs text-slate-600 flex items-center gap-1 mt-0.5 font-medium">
                      <Clock className="w-3.5 h-3.5 text-cyan-600" />
                      Средний срок: ~{contractor.averageLeadDays} дней
                    </div>
                  </div>
                </div>

                {/* Active Orders with Contractor */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className={`uppercase font-bold tracking-wider ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                      Заказы в работе ({activeOrders.length})
                    </span>
                    <button
                      onClick={() => setCurrentTab('production')}
                      className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-0.5"
                    >
                      <span>Все заказы цеха</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {activeOrders.length === 0 ? (
                    <div className={`text-xs italic p-3 rounded-xl border text-center ${
                      isLight ? 'bg-slate-50 border-slate-200 text-slate-500' : 'bg-slate-850 border-slate-800 text-slate-400'
                    }`}>
                      Нет активных заказов в этом цеху прямо сейчас
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {activeOrders.map(ord => (
                        <div key={ord.id} className={`p-2.5 rounded-lg border text-xs flex items-center justify-between shadow-2xs ${
                          isLight ? 'bg-white border-slate-200' : 'bg-slate-850 border-slate-800'
                        }`}>
                          <span className="font-bold text-slate-800 truncate max-w-xs">{ord.title}</span>
                          <span className="text-cyan-700 font-mono font-semibold shrink-0">До {ord.readyDeadline}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
