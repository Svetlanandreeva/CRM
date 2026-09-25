import React from 'react';
import { CheckCircle2, Eye, Sparkles } from 'lucide-react';
import { ProposalTemplateId, ProposalTemplateMeta } from '../../types/crm';
import { useCrm } from '../../context/CrmContext';

interface TemplateThumbnailCardProps {
  template: ProposalTemplateMeta;
  isSelected: boolean;
  onSelect: () => void;
  onOpenGallery?: () => void;
  compact?: boolean;
}

export const TemplateThumbnailCard: React.FC<TemplateThumbnailCardProps> = ({
  template,
  isSelected,
  onSelect,
  onOpenGallery,
  compact = false
}) => {
  const { theme } = useCrm();
  const isLight = theme === 'light';

  // Render authentic miniature visual of the template sheet
  const renderMiniatureSheet = () => {
    switch (template.id) {
      case 'premium':
        return (
          <div className="w-full h-32 sm:h-36 bg-white rounded-lg p-2 flex flex-col justify-between shadow-xs border border-neutral-200 select-none overflow-hidden text-[6px] font-sans">
            {/* Header dark bar */}
            <div className="bg-neutral-900 rounded p-1.5 flex items-center justify-between text-white">
              <div className="space-y-0.5">
                <div className="w-8 h-1 bg-blue-400 rounded-full" />
                <div className="font-bold text-[7px] leading-tight">SATORI WORKSHOP</div>
              </div>
              <div className="text-right font-mono text-[5px] text-neutral-400">
                КП-2026/04
              </div>
            </div>

            {/* 2 info cards */}
            <div className="grid grid-cols-2 gap-1 my-1">
              <div className="bg-neutral-50 border border-neutral-200 rounded p-1 space-y-0.5">
                <div className="w-4 h-0.5 bg-neutral-300" />
                <div className="w-8 h-1 bg-neutral-700 rounded-xs" />
              </div>
              <div className="bg-neutral-50 border border-neutral-200 rounded p-1 space-y-0.5">
                <div className="w-4 h-0.5 bg-neutral-300" />
                <div className="w-10 h-1 bg-neutral-700 rounded-xs" />
              </div>
            </div>

            {/* Mini spec table */}
            <div className="border border-neutral-200 rounded overflow-hidden">
              <div className="bg-neutral-100 px-1 py-0.5 flex justify-between font-mono text-[5px] text-neutral-600">
                <span>ИЗДЕЛИЕ</span>
                <span>СУММА</span>
              </div>
              <div className="divide-y divide-neutral-100 p-0.5 space-y-0.5">
                <div className="flex justify-between items-center text-[5px]">
                  <span className="font-medium text-neutral-800 truncate max-w-[50px]">Светильник Wave</span>
                  <span className="font-bold font-mono">45 000 ₽</span>
                </div>
                <div className="flex justify-between items-center text-[5px]">
                  <span className="font-medium text-neutral-800 truncate max-w-[50px]">Тумба шпон дуба</span>
                  <span className="font-bold font-mono">110 000 ₽</span>
                </div>
              </div>
            </div>

            {/* 3 metric pills */}
            <div className="grid grid-cols-3 gap-0.5 my-0.5">
              <div className="bg-blue-50/70 border border-blue-100 rounded px-0.5 py-0.5 text-center text-blue-900 font-mono text-[4.5px]">
                21 день
              </div>
              <div className="bg-emerald-50/70 border border-emerald-100 rounded px-0.5 py-0.5 text-center text-emerald-900 font-mono text-[4.5px]">
                Гарантия 24м
              </div>
              <div className="bg-purple-50/70 border border-purple-100 rounded px-0.5 py-0.5 text-center text-purple-900 font-mono text-[4.5px]">
                Аванс 70%
              </div>
            </div>

            {/* Dark bottom total */}
            <div className="bg-neutral-900 text-white rounded px-1.5 py-1 flex items-center justify-between text-[6px]">
              <span className="text-neutral-400 font-mono text-[5px]">ИТОГО:</span>
              <span className="font-bold font-mono text-blue-300">155 000 ₽</span>
            </div>
          </div>
        );

      case 'offer':
        return (
          <div className="w-full h-32 sm:h-36 bg-white rounded-lg p-2 flex flex-col justify-between shadow-xs border border-neutral-200 select-none overflow-hidden text-[6px] font-sans">
            {/* Bank details grid plate (1C style) */}
            <div className="border border-neutral-800 text-[5px]">
              <div className="grid grid-cols-2 border-b border-neutral-800">
                <div className="p-0.5 border-r border-neutral-800 bg-neutral-50 text-[4.5px] truncate">
                  АО «ТБанк»
                </div>
                <div className="p-0.5 font-mono text-[4.5px]">БИК 044525974</div>
              </div>
              <div className="grid grid-cols-2">
                <div className="p-0.5 border-r border-neutral-800 font-bold truncate">
                  ИНН 7728491024
                </div>
                <div className="p-0.5 font-mono text-[4.5px] truncate">
                  р/с 407028109000...
                </div>
              </div>
            </div>

            {/* Heading line */}
            <div className="my-1 border-b border-neutral-800 pb-0.5">
              <div className="font-bold text-[7px] font-mono leading-none">
                Счет на оплату № СФ-2026/04
              </div>
            </div>

            {/* Table with borders */}
            <div className="border border-neutral-800 text-[5px]">
              <div className="bg-neutral-100 border-b border-neutral-800 px-1 py-0.5 font-mono flex justify-between">
                <span>№ / ТОВАРЫ</span>
                <span>СУММА</span>
              </div>
              <div className="p-0.5 space-y-0.5">
                <div className="flex justify-between items-center text-[5px]">
                  <span>1. Изделия по проекту</span>
                  <span className="font-mono font-bold">155 000 ₽</span>
                </div>
              </div>
            </div>

            {/* Total */}
            <div className="text-right font-mono font-bold text-[6px] text-neutral-900 border-t border-neutral-300 pt-0.5">
              Всего к оплате: 155 000 ₽
            </div>

            {/* Stamp & Signatures */}
            <div className="flex items-end justify-between pt-0.5">
              <div className="space-y-0.5 text-[4.5px] text-neutral-500">
                <div className="w-12 border-b border-neutral-400">Руководитель / Андреева</div>
                <div className="w-12 border-b border-neutral-400">Бухгалтер / Воронова</div>
              </div>
              {/* Blue seal */}
              <div className="w-8 h-8 rounded-full border border-dashed border-blue-600 flex flex-col items-center justify-center text-[3.5px] text-blue-700 font-bold rotate-[-12deg] shrink-0 bg-blue-50/40">
                <span>М.П.</span>
                <span className="text-[3px]">ООО САТОРИ</span>
              </div>
              {/* QR */}
              <div className="w-5 h-5 bg-neutral-900 text-white flex items-center justify-center text-[3.5px] font-bold rounded-xs shrink-0">
                QR
              </div>
            </div>
          </div>
        );

      case 'manufacturing':
        return (
          <div className="w-full h-32 sm:h-36 bg-white rounded-lg p-2 flex flex-col justify-between shadow-xs border border-neutral-200 select-none overflow-hidden text-[6px] font-sans">
            {/* Top emerald banner */}
            <div className="border-b-2 border-emerald-600 pb-1 flex items-center justify-between">
              <div>
                <span className="text-[4.5px] font-mono font-bold text-emerald-700 uppercase">
                  ТЕХНИЧЕСКАЯ СПЕЦИФИКАЦИЯ
                </span>
                <div className="font-bold text-[7px] text-neutral-900 leading-tight">
                  Цех & Лаборатория
                </div>
              </div>
              <span className="font-mono text-[5px] text-emerald-800 bg-emerald-50 px-1 py-0.5 rounded border border-emerald-200 font-bold">
                ТЗ-ОТК
              </span>
            </div>

            {/* Quality badge parameters */}
            <div className="bg-emerald-50/70 border border-emerald-200 rounded p-1 my-1 grid grid-cols-2 gap-1 text-[5px] font-mono text-emerald-950">
              <div>ГОСТ 16371-2014</div>
              <div>Тара: 3-слойная</div>
            </div>

            {/* Spec grid */}
            <div className="border border-neutral-300 rounded overflow-hidden">
              <div className="bg-neutral-100 px-1 py-0.5 flex justify-between font-mono text-[5px]">
                <span>КОНСТРУКТИВ / ОТДЕЛКА</span>
                <span>ИТОГ</span>
              </div>
              <div className="p-0.5 space-y-0.5 divide-y divide-neutral-100">
                <div className="flex justify-between items-center text-[5px]">
                  <span className="truncate max-w-[65px]">Массив, латунь, ЧПУ</span>
                  <span className="font-mono font-bold">45 000 ₽</span>
                </div>
                <div className="flex justify-between items-center text-[5px]">
                  <span className="truncate max-w-[65px]">Шпон дуба, скрытый монтаж</span>
                  <span className="font-mono font-bold">110 000 ₽</span>
                </div>
              </div>
            </div>

            {/* Emerald total bar */}
            <div className="bg-emerald-100 border border-emerald-300 rounded px-1.5 py-1 flex items-center justify-between font-mono text-[6px] text-emerald-950 mt-1">
              <span className="font-bold text-[5px]">СУММА ЦЕХА:</span>
              <span className="font-bold text-emerald-800">155 000 ₽</span>
            </div>
          </div>
        );

      case 'standard':
      default:
        return (
          <div className="w-full h-32 sm:h-36 bg-white rounded-lg p-2 flex flex-col justify-between shadow-xs border border-neutral-200 select-none overflow-hidden text-[6px] font-sans">
            {/* Minimalist header */}
            <div className="flex items-center justify-between border-b border-neutral-200 pb-1">
              <div className="font-bold text-[7px] text-neutral-900 tracking-tight">
                SATORI DESIGN
              </div>
              <span className="font-mono text-[5px] text-neutral-400">
                One-Pager
              </span>
            </div>

            {/* Client line */}
            <div className="my-1 text-[5px] text-neutral-600">
              Заказчик: <strong className="text-neutral-900">Артем Васильев</strong>
            </div>

            {/* Clean table */}
            <div className="border border-neutral-200 rounded overflow-hidden">
              <div className="bg-neutral-50 px-1 py-0.5 flex justify-between font-mono text-[5px] text-neutral-500">
                <span>ПОЗИЦИЯ</span>
                <span>СУММА</span>
              </div>
              <div className="p-0.5 space-y-0.5 divide-y divide-neutral-100">
                <div className="flex justify-between items-center text-[5px]">
                  <span>Светильник «Wave»</span>
                  <span className="font-mono font-bold">45 000 ₽</span>
                </div>
                <div className="flex justify-between items-center text-[5px]">
                  <span>Консоль из массива</span>
                  <span className="font-mono font-bold">110 000 ₽</span>
                </div>
              </div>
            </div>

            {/* Minimal terms box */}
            <div className="bg-neutral-50 border border-neutral-200 rounded p-1 my-0.5 text-[5px] text-neutral-500 font-mono">
              Срок: 21 раб. день · Аванс: 70%
            </div>

            {/* Bottom line total */}
            <div className="flex items-center justify-between font-mono pt-1 border-t border-neutral-200 text-[6px]">
              <span className="text-neutral-500">К оплате:</span>
              <span className="font-bold text-neutral-900">155 000 ₽</span>
            </div>
          </div>
        );
    }
  };

  return (
    <div
      onClick={onSelect}
      className={`group rounded-xl border p-2.5 transition-all cursor-pointer relative flex flex-col justify-between gap-2 ${
        isSelected
          ? 'border-[#2563EB] bg-blue-50/50 dark:bg-blue-950/30 ring-2 ring-[#2563EB] shadow-md'
          : isLight
          ? 'border-black/[0.08] bg-white hover:bg-neutral-50/80 hover:border-black/20 hover:shadow-xs'
          : 'border-white/[0.08] bg-[#1E1E1E] hover:bg-[#252525] hover:border-white/20 hover:shadow-xs'
      }`}
    >
      {/* Visual Miniature Render */}
      <div className="relative rounded-lg overflow-hidden border border-black/[0.04] dark:border-white/[0.04]">
        {renderMiniatureSheet()}

        {/* Hover quick preview button overlay */}
        {onOpenGallery && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenGallery();
            }}
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs font-semibold"
            title="Открыть в галерее"
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="text-[11px]">Увеличить</span>
          </button>
        )}
      </div>

      {/* Info Block */}
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-1">
          <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
            template.id === 'offer'
              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300'
              : template.id === 'manufacturing'
              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
              : template.id === 'premium'
              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300'
              : 'bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200'
          }`}>
            {template.badge}
          </span>

          {isSelected ? (
            <CheckCircle2 className="w-4 h-4 text-[#2563EB] shrink-0" />
          ) : (
            <div className="w-3.5 h-3.5 rounded-full border border-neutral-300 dark:border-neutral-600" />
          )}
        </div>

        <div className="font-semibold text-xs text-[#1A1A1A] dark:text-white truncate">
          {template.name.split('(')[0]}
        </div>

        {!compact && (
          <p className="text-[10px] text-neutral-400 line-clamp-2 leading-tight">
            {template.description}
          </p>
        )}
      </div>
    </div>
  );
};
