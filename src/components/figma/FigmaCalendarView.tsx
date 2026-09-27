import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import type { Deal } from '../../types/crm';

const DAY = 24 * 60 * 60 * 1000;
const dayOnly = (value: string | Date) => {
  const d = value instanceof Date ? new Date(value) : new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
};
const shortDate = (date: Date) => new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' }).format(date).replace('.', '');
const fullMonth = (date: Date) => new Intl.DateTimeFormat('ru-RU', { month: 'long', year: 'numeric' }).format(date);
const mondayOf = (date: Date) => {
  const d = dayOnly(date)!;
  const weekDay = d.getDay() || 7;
  d.setDate(d.getDate() - weekDay + 1);
  return d;
};

type Row = { deal: Deal; paidAt: Date; deadline: Date; left: number; width: number };

export const FigmaCalendarView: React.FC = () => {
  const { deals, payments, documents, setSelectedDealId, setCurrentTab, theme, toggleTheme } = useCrm();
  const [weekStart, setWeekStart] = React.useState(() => mondayOf(new Date()));
  const weekEnd = new Date(weekStart.getTime() + 6 * DAY);
  const weekEndExclusive = new Date(weekStart.getTime() + 7 * DAY);
  const today = dayOnly(new Date())!;
  const days = Array.from({ length: 7 }, (_, i) => new Date(weekStart.getTime() + i * DAY));

  const rows = React.useMemo<Row[]>(() => deals
    .filter(d => d.stage === 'production' || d.stage === 'ready')
    .map(deal => {
      const paidPayment = [...payments]
        .filter(p => p.dealId === deal.id && p.direction === 'inflow' && p.status === 'completed')
        .sort((a, b) => +new Date(a.date) - +new Date(b.date))[0];
      const paidDocument = [...documents]
        .filter(doc => doc.dealId === deal.id && doc.paidAt)
        .sort((a, b) => +new Date(a.paidAt!) - +new Date(b.paidAt!))[0];
      const paidAt = dayOnly(paidPayment?.date || paidDocument?.paidAt || '');
      const deadline = dayOnly(deal.deadline);
      if (!paidAt || !deadline || deadline < paidAt) return null;
      const visibleStart = Math.max(paidAt.getTime(), weekStart.getTime());
      const visibleEnd = Math.min(deadline.getTime() + DAY, weekEndExclusive.getTime());
      if (visibleEnd <= visibleStart) return null;
      return {
        deal,
        paidAt,
        deadline,
        left: ((visibleStart - weekStart.getTime()) / (7 * DAY)) * 100,
        width: ((visibleEnd - visibleStart) / (7 * DAY)) * 100,
      };
    })
    .filter((row): row is Row => Boolean(row))
    .sort((a, b) => a.deadline.getTime() - b.deadline.getTime())
    .slice(0, 8), [deals, payments, documents, weekStart.getTime()]);

  const weekLabel = `${shortDate(weekStart)} — ${shortDate(weekEnd)}`;
  const todayInWeek = today >= weekStart && today < weekEndExclusive;
  const todayLeft = ((today.getTime() - weekStart.getTime()) / (7 * DAY)) * 100;

  return <div className="relative h-[1000px] min-w-[1080px] overflow-hidden bg-[#f7f5f2] text-[#202020]">
    <div className="absolute left-[42px] top-[24px] flex items-baseline gap-4">
      <h1 className="text-[34px] font-semibold leading-none tracking-[-.035em]">Календарь проектов</h1>
      <span className="text-[13px] text-[#7d756e]">Оплаченные проекты в производстве</span>
    </div>
    <button onClick={toggleTheme} className="absolute right-[54px] top-[20px] flex h-[44px] w-[126px] items-center justify-around rounded-[22px] bg-white">
      <Sun size={17}/><Moon size={16} className={theme === 'dark' ? 'text-[#202020]' : 'text-[#7d756e]'}/>
    </button>

    <div className="absolute left-[42px] top-[82px] flex h-[40px] gap-[12px]">
      <div className="grid min-w-[192px] place-items-center rounded-[12px] border border-[#ebe5e0] bg-white px-4 text-[11px] font-medium">{weekLabel}</div>
      <button onClick={() => setWeekStart(d => new Date(d.getTime() - 7 * DAY))} className="w-[40px] rounded-[12px] border border-[#ebe5e0] bg-white text-[20px]">‹</button>
      <button onClick={() => setWeekStart(d => new Date(d.getTime() + 7 * DAY))} className="w-[40px] rounded-[12px] border border-[#ebe5e0] bg-white text-[20px]">›</button>
      <button onClick={() => setWeekStart(mondayOf(new Date()))} className="w-[92px] rounded-[12px] border border-[#ebe5e0] bg-white text-[11px] font-medium">Сегодня</button>
    </div>

    <section className="absolute left-[42px] right-[42px] top-[144px] h-[806px] overflow-hidden rounded-[18px] border border-[#ebe5e0] bg-white">
      <div className="absolute left-[20px] top-[17px] flex items-baseline gap-6">
        <h2 className="text-[19px] font-semibold">Календарь проектов</h2>
        <span className="text-[11px] text-[#7d756e]">{fullMonth(weekStart)}</span>
      </div>
      <div className="absolute right-[32px] top-[20px] text-[9px] text-[#7fa18f]">● от первой оплаты до срока по договору</div>
      <div className="absolute left-[16px] right-[16px] top-[59px] h-[52px] rounded-[12px] bg-[#fbfaf7]"/>
      <div className="absolute left-[16px] top-[59px] bottom-[42px] w-[264px] border-r border-[#ebe5e0]"><span className="absolute left-[16px] top-[16px] text-[10px] text-[#7d756e]">Проект</span></div>
      <div className="absolute left-[280px] right-[16px] top-[59px] bottom-[42px] grid grid-cols-7">
        {days.map((date, i) => {
          const isToday = dayOnly(date)?.getTime() === today.getTime();
          return <div key={date.toISOString()} className={`relative border-r border-[#ebe5e0] ${isToday ? 'bg-[#fbf4ec]' : ''}`}>
            <div className="absolute left-0 right-0 top-[8px] text-center text-[11px] font-semibold">{date.getDate()}</div>
            <div className={`absolute left-0 right-0 top-[26px] text-center text-[9px] ${isToday ? 'text-[#c7616b]' : 'text-[#7d756e]'}`}>{new Intl.DateTimeFormat('ru-RU', { weekday: 'short' }).format(date).replace('.', '')}</div>
          </div>;
        })}
      </div>

      <div className="absolute left-[16px] right-[16px] top-[111px]">
        {rows.length === 0 && <div className="px-[16px] py-[34px] text-[11px] text-[#8b847e]">На выбранной неделе нет оплаченных проектов в производстве.</div>}
        {rows.map((row, i) => {
          const overdue = row.deadline.getTime() < today.getTime();
          return <button key={row.deal.id} onClick={() => { setSelectedDealId(row.deal.id); setCurrentTab('deals'); }} className={`relative block h-[75px] w-full border-b border-[#ebe5e0] text-left ${i % 2 ? 'bg-[#fbfaf7]' : 'bg-white'}`}>
            <span className="absolute left-[16px] top-[19px] max-w-[50px] truncate text-[9px] font-medium text-[#7d756e]">{row.deal.id}</span>
            <span className="absolute left-[74px] top-[17px] w-[185px] truncate text-[11px] font-semibold">{row.deal.title} · {row.deal.clientName}</span>
            <span className="absolute left-[74px] top-[39px] w-[185px] truncate text-[9px] text-[#7d756e]">Оплата {shortDate(row.paidAt)} · договор до {shortDate(row.deadline)}</span>
            <span className="absolute top-[20px] h-[30px] overflow-hidden rounded-[15px] bg-[#7fa18f] px-[12px] pt-[7px] text-[9px] font-medium" style={{ left: `calc(22.04% + ${row.left * .7796}%)`, width: `${row.width * .7796}%` }}>{row.deal.stage === 'ready' ? 'Готово' : 'Производство'}</span>
            <span className={`absolute right-[12px] bottom-[6px] text-[8px] ${overdue ? 'text-[#c7616b]' : 'text-[#7d756e]'}`}>{overdue ? 'срок по договору истёк' : `по договору ${shortDate(row.deadline)}`}</span>
          </button>;
        })}
      </div>

      {todayInWeek && <><div className="absolute bottom-[41px] top-[111px] w-px bg-[#e3999e]" style={{ left: `calc(22.04% + ${todayLeft * .7796}%)` }}/><div className="absolute bottom-[25px] text-[8px] text-[#c7616b]" style={{ left: `calc(22.04% + ${Math.max(0, todayLeft * .7796 - 1)}%)` }}>сегодня</div></>}
    </section>
  </div>;
};
