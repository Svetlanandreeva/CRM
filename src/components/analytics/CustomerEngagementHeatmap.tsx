import React, { useState, useMemo } from 'react';
import {
  Users,
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
  Sparkles,
  Zap,
  Clock,
  Layers,
  LayoutGrid,
  Filter,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { Client, Deal, ChatMessage } from '../../types/crm';

type EngagementLevel = 'high' | 'medium' | 'low';
type ProfitabilityTier = 'vip' | 'high' | 'medium' | 'low';

interface ClientMetrics {
  client: Client;
  engagementScore: number; // 0 - 100
  engagementLevel: EngagementLevel;
  profitabilityTier: ProfitabilityTier;
  dealsCount: number;
  totalLTV: number;
  totalMargin: number;
  marginPercent: number;
  messagesCount: number;
  daysSinceLastContact: number;
  clusterTitle: string;
  clusterColor: string;
  clusterRecommendation: string;
}

export const CustomerEngagementHeatmap: React.FC = () => {
  const { clients, deals, chatMessages, openClientCockpit, theme } = useCrm();
  const isLight = theme === 'light';

  const [activeViewMode, setActiveViewMode] = useState<'matrix' | 'grid'>('matrix');
  const [selectedCellKey, setSelectedCellKey] = useState<string | null>(null);
  const [managerFilter, setManagerFilter] = useState<string>('all');

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(val);
  };

  // Managers list for filtering
  const managersList = useMemo(() => {
    const list = Array.from(new Set(clients.map(c => c.assignedManager).filter(Boolean)));
    return ['all', ...list];
  }, [clients]);

  // Calculate rich engagement and profitability metrics per client
  const clientMetricsList: ClientMetrics[] = useMemo(() => {
    const now = new Date('2026-09-24T23:53:00Z').getTime();

    return clients.map(client => {
      const clientDeals = deals.filter(d => d.clientId === client.id);
      const clientMsgs = chatMessages.filter(m => m.clientId === client.id);

      // 1. Calculate days since last contact
      let daysSinceLastContact = 30;
      if (client.lastContactAt) {
        const contactTime = new Date(client.lastContactAt).getTime();
        daysSinceLastContact = Math.max(0, Math.floor((now - contactTime) / (1000 * 60 * 60 * 24)));
      }

      // 2. Engagement score algorithm (0 - 100)
      // Recency: up to 40 pts
      let recencyPoints = 5;
      if (daysSinceLastContact === 0) recencyPoints = 40;
      else if (daysSinceLastContact <= 2) recencyPoints = 32;
      else if (daysSinceLastContact <= 5) recencyPoints = 20;
      else if (daysSinceLastContact <= 10) recencyPoints = 12;

      // Frequency / Dialogue: up to 35 pts
      const msgPoints = Math.min(35, clientMsgs.length * 7);

      // Active Deals pipeline velocity: up to 25 pts
      const activeDeals = clientDeals.filter(d => d.stage !== 'closed_won' && d.stage !== 'closed_lost');
      const dealPoints = Math.min(25, activeDeals.length * 15);

      const engagementScore = Math.min(100, Math.max(10, recencyPoints + msgPoints + dealPoints));

      let engagementLevel: EngagementLevel = 'low';
      if (engagementScore >= 65) engagementLevel = 'high';
      else if (engagementScore >= 35) engagementLevel = 'medium';

      // 3. Profitability Tier
      const totalLTV = client.totalLTV;
      const totalMargin = clientDeals.reduce((sum, d) => sum + (d.margin || 0), 0) || Math.round(totalLTV * 0.35);
      const marginPercent = totalLTV > 0 ? Math.round((totalMargin / totalLTV) * 100) : 35;

      let profitabilityTier: ProfitabilityTier = 'low';
      if (totalLTV >= 900000 || client.status === 'VIP') profitabilityTier = 'vip';
      else if (totalLTV >= 400000) profitabilityTier = 'high';
      else if (totalLTV >= 150000) profitabilityTier = 'medium';

      // 4. Cluster Classification & Strategic Recommendation
      let clusterTitle = 'Стандартный клиент';
      let clusterColor = 'slate';
      let clusterRecommendation = 'Плановое сопровождение';

      if (profitabilityTier === 'vip' && engagementLevel === 'high') {
        clusterTitle = 'Флагманы бизнеса (VIP Champions)';
        clusterColor = 'emerald';
        clusterRecommendation = 'Максимальный приоритет. Персональный менеджер, эксклюзивные условия.';
      } else if (profitabilityTier === 'vip' && (engagementLevel === 'low' || engagementLevel === 'medium')) {
        clusterTitle = 'VIP в зоне риска (At-Risk Key Accounts)';
        clusterColor = 'amber';
        clusterRecommendation = 'Срочный контакт! Высокий чек, но коммуникация охлаждается. Риск оттока.';
      } else if (profitabilityTier === 'high' && engagementLevel === 'high') {
        clusterTitle = 'Перспективные драйверы роста';
        clusterColor = 'blue';
        clusterRecommendation = 'Высокая активность. Предлагать комплексные спецификации и допродажи.';
      } else if (profitabilityTier === 'high' && engagementLevel === 'low') {
        clusterTitle = 'Уснувшие крупные клиенты';
        clusterColor = 'orange';
        clusterRecommendation = 'Запланировать ре-контакт, направить каталог новинок или пригласить в шоурум.';
      } else if (engagementLevel === 'high') {
        clusterTitle = 'Активный развивающийся сегмент';
        clusterColor = 'sky';
        clusterRecommendation = 'Развивать отношения для роста среднего чека.';
      } else {
        clusterTitle = 'Пассивный базовый сегмент';
        clusterColor = 'slate';
        clusterRecommendation = 'Маркетинговые рассылки, автоматические триггерные уведомления.';
      }

      return {
        client,
        engagementScore,
        engagementLevel,
        profitabilityTier,
        dealsCount: clientDeals.length,
        totalLTV,
        totalMargin,
        marginPercent,
        messagesCount: clientMsgs.length,
        daysSinceLastContact,
        clusterTitle,
        clusterColor,
        clusterRecommendation,
      };
    });
  }, [clients, deals, chatMessages]);

  // Apply filters
  const filteredMetrics = useMemo(() => {
    return clientMetricsList.filter(item => {
      if (managerFilter !== 'all' && item.client.assignedManager !== managerFilter) {
        return false;
      }
      return true;
    });
  }, [clientMetricsList, managerFilter]);

  // 2D Matrix structure (4 Profitability rows × 3 Engagement columns)
  const profitabilityTiers: { id: ProfitabilityTier; label: string; desc: string }[] = [
    { id: 'vip', label: 'VIP / Премиум', desc: 'LTV > 900 000 ₽' },
    { id: 'high', label: 'Высокая маржа', desc: '400k – 900k ₽' },
    { id: 'medium', label: 'Средний чек', desc: '150k – 400k ₽' },
    { id: 'low', label: 'Стартовый / Лиды', desc: '< 150k ₽' },
  ];

  const engagementColumns: { id: EngagementLevel; label: string; range: string }[] = [
    { id: 'high', label: 'Высокая вовлеченность', range: 'Индекс 65–100 · Активный диалог' },
    { id: 'medium', label: 'Умеренная вовлеченность', range: 'Индекс 35–64 · Редкий контакт' },
    { id: 'low', label: 'Низкая (Спящие)', range: 'Индекс < 35 · Без связи > 7 дней' },
  ];

  // Aggregate KPI summary
  const championsCount = filteredMetrics.filter(m => m.profitabilityTier === 'vip' && m.engagementLevel === 'high').length;
  const atRiskCount = filteredMetrics.filter(m => (m.profitabilityTier === 'vip' || m.profitabilityTier === 'high') && (m.engagementLevel === 'low' || m.daysSinceLastContact > 7)).length;
  const growthDriversCount = filteredMetrics.filter(m => m.profitabilityTier === 'high' && m.engagementLevel === 'high').length;
  const avgEngagement = Math.round(filteredMetrics.reduce((sum, m) => sum + m.engagementScore, 0) / (filteredMetrics.length || 1));

  // Get clients in a specific matrix cell
  const getCellClients = (tier: ProfitabilityTier, eng: EngagementLevel) => {
    return filteredMetrics.filter(m => m.profitabilityTier === tier && m.engagementLevel === eng);
  };

  // Get active selected list
  const activeDetailClients = useMemo(() => {
    if (!selectedCellKey) return null;
    const [tier, eng] = selectedCellKey.split('__') as [ProfitabilityTier, EngagementLevel];
    return getCellClients(tier, eng);
  }, [selectedCellKey, filteredMetrics]);

  return (
    <div className={`p-5 rounded-2xl border space-y-5 shadow-2xs transition-all ${
      isLight ? 'bg-white border-black/[0.08]' : 'bg-[#161616] border-white/[0.08]'
    }`}>
      {/* Top Header & View Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-black/[0.06] dark:border-white/[0.06]">
        <div>
          <div className="flex items-center gap-1.5 text-[#2563EB]">
            <Sparkles className="w-3.5 h-3.5 fill-[#2563EB]/20 text-[#2563EB]" />
            <span className="meta-label text-[#2563EB]">МАТРИЦА КЛИЕНТОВ · HEATMAP АНАЛИЗ</span>
          </div>
          <h2 className={`text-base font-semibold tracking-tight mt-0.5 ${isLight ? 'text-[#1A1A1A]' : 'text-white'}`}>
            Вовлеченность и кластеры маржинальности заказчиков
          </h2>
          <p className="text-xs text-neutral-500 font-normal mt-0.5">
            Тепловая сегментация клиентской базы по частоте коммуникаций и жизненному циклу выручки (LTV)
          </p>
        </div>

        {/* Controls: Manager Filter & View Mode */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Manager select */}
          <div className="flex items-center gap-1 text-xs">
            <span className="meta-label mr-1 text-[10px]">МЕНЕДЖЕР:</span>
            <select
              value={managerFilter}
              onChange={(e) => setManagerFilter(e.target.value)}
              className={`text-xs rounded-lg px-2.5 py-1.5 border font-medium focus:outline-none focus:ring-1 focus:ring-[#2563EB] ${
                isLight ? 'bg-[#F8F7F4] border-black/[0.08] text-[#1A1A1A]' : 'bg-[#222222] border-white/[0.08] text-neutral-200'
              }`}
            >
              <option value="all">Все менеджеры ({clients.length})</option>
              {managersList.filter(m => m !== 'all').map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center p-0.5 rounded-lg border border-black/[0.08] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.02]">
            <button
              onClick={() => setActiveViewMode('matrix')}
              className={`px-3 py-1 text-xs font-semibold rounded-md flex items-center gap-1.5 transition-colors ${
                activeViewMode === 'matrix'
                  ? 'bg-[#2563EB] text-white shadow-2xs'
                  : 'text-neutral-500 hover:text-[#1A1A1A] dark:hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>2D Матрица</span>
            </button>
            <button
              onClick={() => setActiveViewMode('grid')}
              className={`px-3 py-1 text-xs font-semibold rounded-md flex items-center gap-1.5 transition-colors ${
                activeViewMode === 'grid'
                  ? 'bg-[#2563EB] text-white shadow-2xs'
                  : 'text-neutral-500 hover:text-[#1A1A1A] dark:hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Сетка клиентов</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cluster Highlights */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
        <div className={`p-3.5 rounded-xl border ${
          isLight ? 'bg-emerald-50/70 border-emerald-200/80 text-emerald-950' : 'bg-emerald-950/20 border-emerald-900/40 text-emerald-200'
        }`}>
          <div className="flex items-center justify-between">
            <span className="meta-label text-emerald-700 dark:text-emerald-400">ФЛАГМАНЫ (VIP)</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <div className="text-xl font-bold font-mono tabular-nums text-emerald-700 dark:text-emerald-300 mt-1">
            {championsCount}
          </div>
          <div className="text-[11px] text-emerald-800/80 dark:text-emerald-400/80 mt-0.5">
            Максимальная прибыль и лояльность
          </div>
        </div>

        <div className={`p-3.5 rounded-xl border ${
          isLight ? 'bg-amber-50/70 border-amber-200/80 text-amber-950' : 'bg-amber-950/20 border-amber-900/40 text-amber-200'
        }`}>
          <div className="flex items-center justify-between">
            <span className="meta-label text-amber-700 dark:text-amber-400">В ЗОНЕ РИСКА</span>
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="text-xl font-bold font-mono tabular-nums text-amber-700 dark:text-amber-300 mt-1">
            {atRiskCount}
          </div>
          <div className="text-[11px] text-amber-800/80 dark:text-amber-400/80 mt-0.5">
            Без контакта &gt; 7 дней
          </div>
        </div>

        <div className={`p-3.5 rounded-xl border ${
          isLight ? 'bg-blue-50/70 border-blue-200/80 text-blue-950' : 'bg-blue-950/20 border-blue-900/40 text-blue-200'
        }`}>
          <div className="flex items-center justify-between">
            <span className="meta-label text-blue-700 dark:text-blue-400">ДРАЙВЕРЫ РОСТА</span>
            <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <div className="text-xl font-bold font-mono tabular-nums text-blue-700 dark:text-blue-300 mt-1">
            {growthDriversCount}
          </div>
          <div className="text-[11px] text-blue-800/80 dark:text-blue-400/80 mt-0.5">
            Высокий аппетит к допродажам
          </div>
        </div>

        <div className={`p-3.5 rounded-xl border ${
          isLight ? 'bg-[#F8F7F4] border-black/[0.06] text-neutral-800' : 'bg-white/[0.02] border-white/[0.06] text-neutral-200'
        }`}>
          <div className="flex items-center justify-between">
            <span className="meta-label text-neutral-500">СРЕДНЯЯ ВОВЛЕЧЕННОСТЬ</span>
            <Zap className="w-3.5 h-3.5 text-[#2563EB]" />
          </div>
          <div className="text-xl font-bold font-mono tabular-nums text-[#1A1A1A] dark:text-white mt-1">
            {avgEngagement} <span className="text-xs font-normal text-neutral-400">/ 100</span>
          </div>
          <div className="text-[11px] text-neutral-500 mt-0.5">
            По всей активной базе клиентов
          </div>
        </div>
      </div>

      {/* ================= VIEW 1: 2D CLUSTER MATRIX HEATMAP ================= */}
      {activeViewMode === 'matrix' && (
        <div className="space-y-4">
          {/* Matrix Description Header */}
          <div className="flex items-center justify-between text-xs text-neutral-500 font-mono">
            <span>ОСЬ Y: ДОХОДНОСТЬ И МАРЖА · ОСЬ X: АКТИВНОСТЬ ВЗАИМОДЕЙСТВИЯ</span>
            <span>Нажмите на ячейку для просмотра списка заказчиков</span>
          </div>

          {/* Matrix Grid */}
          <div className="overflow-x-auto">
            <div className="min-w-[700px] border border-black/[0.08] dark:border-white/[0.08] rounded-xl overflow-hidden">
              {/* Columns Header (Engagement) */}
              <div className="grid grid-cols-4 bg-black/[0.02] dark:bg-white/[0.02] border-b border-black/[0.08] dark:border-white/[0.08] text-xs font-mono">
                <div className="p-3 border-r border-black/[0.08] dark:border-white/[0.08] text-neutral-400 flex items-center justify-center font-semibold text-[10px] uppercase">
                  Уровень LTV \ Вовлеченность
                </div>
                {engagementColumns.map(col => (
                  <div key={col.id} className="p-3 border-r last:border-r-0 border-black/[0.08] dark:border-white/[0.08] text-center">
                    <div className="font-semibold text-xs text-[#1A1A1A] dark:text-white">{col.label}</div>
                    <div className="text-[10px] text-neutral-400 mt-0.5">{col.range}</div>
                  </div>
                ))}
              </div>

              {/* Matrix Rows (Profitability Tiers) */}
              {profitabilityTiers.map(tier => {
                return (
                  <div key={tier.id} className="grid grid-cols-4 border-b last:border-b-0 border-black/[0.08] dark:border-white/[0.08]">
                    {/* Row Header */}
                    <div className={`p-3.5 border-r border-black/[0.08] dark:border-white/[0.08] flex flex-col justify-center ${
                      isLight ? 'bg-black/[0.01]' : 'bg-white/[0.01]'
                    }`}>
                      <span className="font-semibold text-xs text-[#1A1A1A] dark:text-neutral-200">
                        {tier.label}
                      </span>
                      <span className="text-[10px] font-mono text-neutral-400 mt-0.5">
                        {tier.desc}
                      </span>
                    </div>

                    {/* 3 Columns for this Tier */}
                    {engagementColumns.map(col => {
                      const cellKey = `${tier.id}__${col.id}`;
                      const cellClients = getCellClients(tier.id, col.id);
                      const isSelected = selectedCellKey === cellKey;
                      const cellTotalLTV = cellClients.reduce((sum, c) => sum + c.totalLTV, 0);

                      // Heatmap color logic
                      let heatClass = '';
                      if (tier.id === 'vip' && col.id === 'high') {
                        // Top VIP + Active: Emerald
                        heatClass = isLight 
                          ? 'bg-emerald-50 hover:bg-emerald-100/70 border-emerald-300 text-emerald-950' 
                          : 'bg-emerald-950/30 hover:bg-emerald-950/50 border-emerald-800 text-emerald-200';
                      } else if (tier.id === 'vip' && col.id === 'low') {
                        // Top VIP + Low engagement: Urgent Amber/Rose alert
                        heatClass = isLight 
                          ? 'bg-amber-100/70 hover:bg-amber-100 border-amber-300 text-amber-950' 
                          : 'bg-amber-950/40 hover:bg-amber-950/60 border-amber-800 text-amber-200';
                      } else if (tier.id === 'high' && col.id === 'high') {
                        // High profit + High engagement: Blue
                        heatClass = isLight 
                          ? 'bg-blue-50 hover:bg-blue-100/70 border-blue-200 text-blue-950' 
                          : 'bg-blue-950/30 hover:bg-blue-950/50 border-blue-800 text-blue-200';
                      } else if (col.id === 'high') {
                        heatClass = isLight 
                          ? 'bg-sky-50/60 hover:bg-sky-100/60 border-sky-200' 
                          : 'bg-sky-950/20 hover:bg-sky-950/40 border-sky-900';
                      } else if (tier.id === 'low' && col.id === 'low') {
                        heatClass = isLight 
                          ? 'bg-[#F8F7F4]/50 hover:bg-neutral-100 border-black/[0.04]' 
                          : 'bg-white/[0.01] hover:bg-white/[0.04] border-white/[0.04]';
                      } else {
                        heatClass = isLight 
                          ? 'bg-white hover:bg-neutral-50 border-black/[0.06]' 
                          : 'bg-[#181818] hover:bg-[#202020] border-white/[0.06]';
                      }

                      return (
                        <div
                          key={col.id}
                          onClick={() => setSelectedCellKey(isSelected ? null : cellKey)}
                          className={`p-3.5 border-r last:border-r-0 border-black/[0.08] dark:border-white/[0.08] cursor-pointer transition-all relative ${heatClass} ${
                            isSelected ? 'ring-2 ring-[#2563EB] shadow-md z-10' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                              cellClients.length > 0 ? 'bg-black/[0.06] dark:bg-white/[0.1]' : 'opacity-40'
                            }`}>
                              {cellClients.length} {cellClients.length === 1 ? 'клиент' : 'клиента'}
                            </span>
                            {cellClients.length > 0 && (
                              <span className="text-[10px] font-mono font-medium opacity-80 tabular-nums">
                                {formatCurrency(cellTotalLTV)}
                              </span>
                            )}
                          </div>

                          {/* Client Mini-Tags */}
                          <div className="mt-2 space-y-1">
                            {cellClients.length === 0 ? (
                              <div className="text-[11px] font-mono text-neutral-400 italic">
                                Нет клиентов
                              </div>
                            ) : (
                              cellClients.slice(0, 2).map(c => (
                                <div key={c.client.id} className="text-[11px] font-medium truncate flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]" />
                                  <span>{c.client.company || c.client.name}</span>
                                </div>
                              ))
                            )}
                            {cellClients.length > 2 && (
                              <div className="text-[10px] font-mono text-neutral-400">
                                + еще {cellClients.length - 2}
                              </div>
                            )}
                          </div>

                          {/* Special indicator for VIP at risk */}
                          {tier.id === 'vip' && col.id === 'low' && cellClients.length > 0 && (
                            <div className="mt-1.5 flex items-center gap-1 text-[10px] font-semibold text-amber-700 dark:text-amber-400">
                              <AlertTriangle className="w-3 h-3 shrink-0" />
                              <span>Требуется реактивация</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Drill-down section when a cell is clicked */}
          {selectedCellKey && activeDetailClients && (
            <div className={`p-4 rounded-xl border animate-in fade-in duration-150 space-y-3 ${
              isLight ? 'bg-[#F8F7F4] border-black/[0.08]' : 'bg-[#1C1C1C] border-white/[0.08]'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="meta-label text-[#2563EB]">ДЕТАЛИЗАЦИЯ ВЫБРАННОГО КЛАСТЕРА</div>
                  <h3 className="text-sm font-semibold mt-0.5">
                    Заказчики в этом сегменте ({activeDetailClients.length})
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedCellKey(null)}
                  className="text-xs font-mono text-neutral-400 hover:text-neutral-700 dark:hover:text-white"
                >
                  Закрыть ✕
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {activeDetailClients.map(item => (
                  <div
                    key={item.client.id}
                    className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 ${
                      isLight ? 'bg-white border-black/[0.06]' : 'bg-[#141414] border-white/[0.06]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-[#1A1A1A] dark:text-white">
                          {item.client.name}
                        </span>
                        {item.client.company && (
                          <span className="text-neutral-400 text-xs font-normal">
                            · {item.client.company}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-neutral-500 mt-1 flex items-center gap-2 font-mono">
                        <span>LTV: <strong className="text-[#1A1A1A] dark:text-white">{formatCurrency(item.totalLTV)}</strong></span>
                        <span>·</span>
                        <span>Вовлеченность: <strong className="text-[#2563EB]">{item.engagementScore}/100</strong></span>
                        <span>·</span>
                        <span>Без связи: {item.daysSinceLastContact} дн.</span>
                      </div>
                    </div>

                    <button
                      onClick={() => openClientCockpit(item.client.id)}
                      className="px-3 py-1.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors shrink-0 shadow-2xs"
                    >
                      <span>В карточку</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= VIEW 2: CUSTOMER HEAT GRID ================= */}
      {activeViewMode === 'grid' && (
        <div className="space-y-4">
          <div className="text-xs text-neutral-500 font-mono">
            СПИСОК ВСЕХ ЗАКАЗЧИКОВ С ЦВЕТОВЫМ ТЕПЛОВЫМ ИНДЕКСОМ (ENGAGEMENT × LTV)
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredMetrics.map(item => {
              // Card border & badge color by cluster
              let badgeBg = 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
              let borderAccent = 'border-black/[0.08] dark:border-white/[0.08]';

              if (item.clusterColor === 'emerald') {
                badgeBg = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300';
                borderAccent = 'border-emerald-300/80 dark:border-emerald-800/80 shadow-emerald-500/5';
              } else if (item.clusterColor === 'amber') {
                badgeBg = 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300';
                borderAccent = 'border-amber-300/90 dark:border-amber-800/90 shadow-amber-500/5';
              } else if (item.clusterColor === 'blue') {
                badgeBg = 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300';
                borderAccent = 'border-blue-300/80 dark:border-blue-800/80';
              }

              return (
                <div
                  key={item.client.id}
                  className={`p-4 rounded-xl border flex flex-col justify-between transition-all group shadow-2xs ${borderAccent} ${
                    isLight ? 'bg-white hover:bg-neutral-50/80' : 'bg-[#181818] hover:bg-[#202020]'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Header: Name and Cluster Badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-semibold text-xs text-[#1A1A1A] dark:text-white group-hover:text-[#2563EB] transition-colors">
                          {item.client.name}
                        </div>
                        {item.client.company && (
                          <div className="text-neutral-500 text-xs font-normal">
                            {item.client.company}
                          </div>
                        )}
                      </div>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${badgeBg}`}>
                        {item.client.status}
                      </span>
                    </div>

                    {/* Cluster Subtitle */}
                    <div className="text-[11px] font-semibold text-[#1A1A1A] dark:text-neutral-200 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{
                        backgroundColor: item.clusterColor === 'emerald' ? '#10B981' : item.clusterColor === 'amber' ? '#F59E0B' : item.clusterColor === 'blue' ? '#2563EB' : '#64748B'
                      }} />
                      <span>{item.clusterTitle}</span>
                    </div>

                    {/* Engagement Meter (0-100%) */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-mono">
                        <span className="text-neutral-400">Индекс вовлеченности:</span>
                        <span className="font-semibold text-[#1A1A1A] dark:text-white">{item.engagementScore} / 100</span>
                      </div>
                      <div className="h-1.5 w-full bg-black/[0.04] dark:bg-white/[0.06] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${item.engagementScore}%`,
                            backgroundColor: item.engagementScore >= 65 ? '#10B981' : item.engagementScore >= 35 ? '#2563EB' : '#F59E0B'
                          }}
                        />
                      </div>
                    </div>

                    {/* Financial Metrics */}
                    <div className="grid grid-cols-2 gap-2 text-xs font-mono p-2.5 rounded-lg bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.04]">
                      <div>
                        <div className="text-[9px] text-neutral-400 uppercase">LTV выручка</div>
                        <div className="font-semibold tabular-nums text-[#1A1A1A] dark:text-white mt-0.5">
                          {formatCurrency(item.totalLTV)}
                        </div>
                      </div>
                      <div>
                        <div className="text-[9px] text-neutral-400 uppercase">Маржинальность</div>
                        <div className="font-semibold tabular-nums text-emerald-600 dark:text-emerald-400 mt-0.5">
                          {item.marginPercent}% (~{formatCurrency(item.totalMargin)})
                        </div>
                      </div>
                    </div>

                    {/* Strategy Recommendation */}
                    <p className="text-[11px] text-neutral-500 leading-relaxed font-normal italic">
                      «{item.clusterRecommendation}»
                    </p>
                  </div>

                  {/* Footer button */}
                  <div className="pt-3 mt-3 border-t border-black/[0.04] dark:border-white/[0.04] flex items-center justify-between">
                    <span className="text-[10px] font-mono text-neutral-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Контакт: {item.daysSinceLastContact === 0 ? 'сегодня' : `${item.daysSinceLastContact} дн. назад`}
                    </span>
                    <button
                      onClick={() => openClientCockpit(item.client.id)}
                      className="text-xs text-[#2563EB] hover:underline font-semibold font-mono flex items-center gap-0.5"
                    >
                      <span>В карточку</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Strategic Heatmap Interpretation Note */}
      <div className={`p-4 rounded-xl border flex items-start gap-3 text-xs leading-relaxed ${
        isLight ? 'bg-[#F8F7F4] border-black/[0.06] text-neutral-700' : 'bg-white/[0.02] border-white/[0.06] text-neutral-300'
      }`}>
        <Sparkles className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-[#1A1A1A] dark:text-white">Как использовать тепловую матрицу: </span>
          <span>
            Приоритет №1 для отдела продаж — заказчики в желтом секторе (<strong>«VIP в зоне риска»</strong>). Высокий объем прошлых заказов при паузе в диалоге более 7 дней указывает на необходимость срочного звонка или презентации новых образцов. Заказчики в зеленом секторе (<strong>«Флагманы»</strong>) готовы к постоянному пулу сделок и требуют регулярного сервисного сопровождения.
          </span>
        </div>
      </div>
    </div>
  );
};
