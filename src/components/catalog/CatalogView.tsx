import React, { useState } from 'react';
import {
  Package,
  Clock,
  Search
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';

export const CatalogView: React.FC = () => {
  const { catalog, theme } = useCrm();
  const isLight = theme === 'light';

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = ['all', ...Array.from(new Set(catalog.map(c => c.category)))];

  const filteredItems = catalog.filter((item) => {
    const matchesSearch = item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.article.toLowerCase().includes(search.toLowerCase()) ||
      item.materials.some(m => m.toLowerCase().includes(search.toLowerCase()));
    const matchesCat = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className={`flex-1 flex flex-col min-h-0 overflow-hidden ${
      isLight ? 'bg-slate-100 text-slate-900' : 'bg-slate-950 text-slate-100'
    }`}>
      {/* Top Header */}
      <div className={`p-5 border-b space-y-4 shrink-0 shadow-xs ${
        isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className={`text-xl font-bold tracking-tight flex items-center gap-2.5 ${
              isLight ? 'text-slate-900' : 'text-white'
            }`}>
              <Package className="w-5 h-5 text-amber-600" />
              <span>База товаров, изделий и материалов Satori ({catalog.length})</span>
            </h1>
            <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Стандартные изделия, себестоимость, базовые прайсы и нормативные сроки изготовления в цеху
            </p>
          </div>
        </div>

        {/* Filter & Search */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 ${
              isLight ? 'text-slate-400' : 'text-slate-500'
            }`} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск по артикулу, названию, материалам..."
              className={`w-full rounded-xl pl-10 pr-4 py-2 text-sm font-medium border focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
              }`}
            />
          </div>

          <div className={`flex items-center gap-1 p-1 rounded-xl border text-xs ${
            isLight ? 'bg-slate-50 border-slate-300' : 'bg-slate-800 border-slate-700'
          }`}>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  selectedCategory === cat 
                    ? 'bg-amber-600 text-white shadow-2xs' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {cat === 'all' ? 'Все категории' : cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid of Catalog Cards */}
      <div className="flex-1 overflow-y-auto p-5">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => {
            const margin = item.basePrice - item.primeCost;
            const marginPct = Math.round((margin / item.basePrice) * 100);

            return (
              <div
                key={item.id}
                className={`p-5 rounded-2xl border space-y-3.5 shadow-xs transition-all flex flex-col justify-between ${
                  isLight 
                    ? 'bg-white border-slate-200 hover:border-amber-300' 
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-xs font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        {item.article}
                      </span>
                      <h2 className={`text-base font-bold mt-1.5 leading-snug ${isLight ? 'text-slate-900' : 'text-white'}`}>
                        {item.title}
                      </h2>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-md font-semibold border ${
                      isLight ? 'bg-slate-100 text-slate-700 border-slate-200' : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}>
                      {item.category}
                    </span>
                  </div>

                  <p className={`text-xs leading-relaxed line-clamp-2 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    {item.description}
                  </p>

                  {/* Materials */}
                  <div className="space-y-1.5 pt-1">
                    <span className={`text-xs uppercase font-bold tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      Материалы:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {item.materials.map((m, idx) => (
                        <span key={idx} className={`text-xs px-2 py-0.5 rounded font-mono font-medium border ${
                          isLight ? 'bg-slate-50 text-slate-800 border-slate-200' : 'bg-slate-850 text-slate-300 border-slate-800'
                        }`}>
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Pricing & Production Lead Days */}
                <div className={`pt-3 border-t space-y-2 ${isLight ? 'border-slate-100' : 'border-slate-800'}`}>
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>Себестоимость:</span>
                    <span className="font-bold text-slate-700 tabular-nums">{formatCurrency(item.primeCost)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>Базовый прайс:</span>
                    <span className={`font-black text-sm tabular-nums ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      {formatCurrency(item.basePrice)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                    <span className="text-emerald-700 font-bold font-mono">Маржа: +{marginPct}%</span>
                    <span className="text-cyan-700 font-bold font-mono flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {item.productionDays} раб. дней
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
