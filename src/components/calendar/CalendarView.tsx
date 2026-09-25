import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  Clock
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';

interface CalendarEvent {
  id: string;
  date: string;
  time: string;
  title: string;
  clientName: string;
  clientId: string;
  type: 'meeting' | 'call' | 'production_deadline' | 'shipping';
}

export const CalendarView: React.FC = () => {
  const { openClientCockpit, theme } = useCrm();
  const isLight = theme === 'light';

  const [activeTypeFilter, setActiveTypeFilter] = useState<string>('all');

  const events: CalendarEvent[] = [
    {
      id: 'e1',
      date: '2026-09-25',
      time: '11:00',
      title: 'Согласование образцов выкрасов дуба в студии',
      clientName: 'Ольга Власова (O-Living)',
      clientId: 'c4',
      type: 'meeting',
    },
    {
      id: 'e2',
      date: '2026-09-25',
      time: '14:30',
      title: 'Звонок: согласование чертежа люка кабель-канала',
      clientName: 'Дмитрий Корнилов (ГК Новые Технологии)',
      clientId: 'c3',
      type: 'call',
    },
    {
      id: 'e3',
      date: '2026-09-26',
      time: '10:00',
      title: 'Подача фуры Деловые Линии (24 изголовья в Сочи)',
      clientName: 'Илья Медведев (Лазурный Берег)',
      clientId: 'c5',
      type: 'shipping',
    },
    {
      id: 'e4',
      date: '2026-09-28',
      time: '18:00',
      title: 'Дедлайн ЧПУ раскроя латунных порталов в цеху',
      clientName: 'Артем Васильев (Форма и Свет)',
      clientId: 'c1',
      type: 'production_deadline',
    },
    {
      id: 'e5',
      date: '2026-10-02',
      time: '12:00',
      title: 'Замер торговой зоны и подиумов в ТЦ',
      clientName: 'Мария Калинина (Mon Reve)',
      clientId: 'c6',
      type: 'meeting',
    },
    {
      id: 'e6',
      date: '2026-10-08',
      time: '15:00',
      title: 'Готовность контрольной сборки стойки ресепшн',
      clientName: 'Артем Васильев (Форма и Свет)',
      clientId: 'c1',
      type: 'production_deadline',
    },
  ];

  const filteredEvents = events.filter((e) => {
    if (activeTypeFilter === 'all') return true;
    return e.type === activeTypeFilter;
  });

  const getEventBadge = (type: CalendarEvent['type']) => {
    switch (type) {
      case 'meeting':
        return <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200 font-bold">Встреча / Замер</span>;
      case 'call':
        return <span className="text-xs px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-200 font-bold">Созвон</span>;
      case 'production_deadline':
        return <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold">Дедлайн цеха</span>;
      case 'shipping':
        return <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 font-bold">Отгрузка / Логистика</span>;
    }
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
              <CalendarIcon className="w-5 h-5 text-indigo-600" />
              <span>Календарь встреч, дедлайнов и отгрузок</span>
            </h1>
            <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              График встреч в студии, созвонов с заказчиками, сроков готовности в цехах и отправок ТК
            </p>
          </div>
        </div>

        {/* Filter */}
        <div className={`flex items-center gap-1 p-1 rounded-xl border text-xs w-fit ${
          isLight ? 'bg-slate-50 border-slate-300' : 'bg-slate-800 border-slate-700'
        }`}>
          <button
            onClick={() => setActiveTypeFilter('all')}
            className={`px-3 py-1 rounded-lg font-bold transition-all ${
              activeTypeFilter === 'all' ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Все события ({events.length})
          </button>
          <button
            onClick={() => setActiveTypeFilter('meeting')}
            className={`px-3 py-1 rounded-lg font-bold transition-all ${
              activeTypeFilter === 'meeting' ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Встречи
          </button>
          <button
            onClick={() => setActiveTypeFilter('call')}
            className={`px-3 py-1 rounded-lg font-bold transition-all ${
              activeTypeFilter === 'call' ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Созвоны
          </button>
          <button
            onClick={() => setActiveTypeFilter('production_deadline')}
            className={`px-3 py-1 rounded-lg font-bold transition-all ${
              activeTypeFilter === 'production_deadline' ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Сроки в цеху
          </button>
          <button
            onClick={() => setActiveTypeFilter('shipping')}
            className={`px-3 py-1 rounded-lg font-bold transition-all ${
              activeTypeFilter === 'shipping' ? 'bg-indigo-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Отгрузки
          </button>
        </div>
      </div>

      {/* Events Timeline */}
      <div className="flex-1 overflow-y-auto p-5 space-y-3.5">
        {filteredEvents.map((evt) => (
          <div
            key={evt.id}
            onClick={() => openClientCockpit(evt.clientId)}
            className={`p-5 rounded-2xl border cursor-pointer transition-all shadow-xs space-y-2.5 group ${
              isLight 
                ? 'bg-white border-slate-200 hover:border-indigo-300' 
                : 'bg-slate-900 border-slate-800 hover:border-indigo-500'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2.5 mb-1.5">
                  {getEventBadge(evt.type)}
                  <span className={`text-xs font-mono font-semibold flex items-center gap-1 ${
                    isLight ? 'text-slate-600' : 'text-slate-400'
                  }`}>
                    <Clock className="w-3.5 h-3.5 text-indigo-500" />
                    {evt.date} в {evt.time}
                  </span>
                </div>
                <h2 className={`text-base font-bold transition-colors leading-snug ${
                  isLight ? 'text-slate-900 group-hover:text-indigo-600' : 'text-white group-hover:text-indigo-300'
                }`}>
                  {evt.title}
                </h2>
              </div>

              <span className="text-xs text-indigo-600 group-hover:translate-x-1 transition-transform font-bold shrink-0">
                В карточку клиента →
              </span>
            </div>

            <div className={`pt-2.5 border-t flex items-center justify-between text-xs ${
              isLight ? 'border-slate-100 text-slate-600' : 'border-slate-800 text-slate-400'
            }`}>
              <span className="font-bold text-slate-800">{evt.clientName}</span>
              <span className="font-mono text-slate-400">ID: {evt.id}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
