import type { ContractReminderSettings, DealStageInfo, Manager, ProposalTemplateMeta } from '../types/crm';

// Static UI configuration only. No demo clients, deals, tasks, payments or messages live here.
export const DEAL_STAGES: DealStageInfo[] = [
  { id: 'lead', title: 'Новый лид', color: '#64748B', badgeBg: 'bg-slate-800 text-slate-300' },
  { id: 'contacted', title: 'Связались', color: '#0284C7', badgeBg: 'bg-sky-950/60 text-sky-300' },
  { id: 'calculation', title: 'Расчёт', color: '#6366F1', badgeBg: 'bg-indigo-950/60 text-indigo-300' },
  { id: 'proposal_sent', title: 'КП отправлено', color: '#8B5CF6', badgeBg: 'bg-purple-950/60 text-purple-300' },
  { id: 'negotiation', title: 'Согласование', color: '#EC4899', badgeBg: 'bg-pink-950/60 text-pink-300' },
  { id: 'prepayment', title: 'Предоплата', color: '#F59E0B', badgeBg: 'bg-amber-950/60 text-amber-300' },
  { id: 'production', title: 'Производство', color: '#10B981', badgeBg: 'bg-emerald-950/60 text-emerald-300' },
  { id: 'ready', title: 'Готово', color: '#14B8A6', badgeBg: 'bg-teal-950/60 text-teal-300' },
  { id: 'shipped', title: 'Отгружено', color: '#06B6D4', badgeBg: 'bg-cyan-950/60 text-cyan-300' },
  { id: 'closed_won', title: 'Закрыто', color: '#22C55E', badgeBg: 'bg-green-950/60 text-green-300' },
  { id: 'closed_lost', title: 'Отказ / Срыв', color: '#EF4444', badgeBg: 'bg-red-950/60 text-red-300' },
];

export const MANAGERS: Manager[] = [
  { id: 'owner', name: 'Светлана', role: 'Владелец', avatar: '', email: '', dealsWon: 0, revenue: 0 },
  { id: 'manager', name: 'Менеджер', role: 'Менеджер проектов', avatar: '', email: '', dealsWon: 0, revenue: 0 },
];

export const DEFAULT_CONTRACT_REMINDER_SETTINGS: ContractReminderSettings = {
  enabled: false,
  remindDaysBeforeDue: 3,
  sendOnDueDate: false,
  enableOverdueReminders: false,
  overdueGraceDays: 1,
  overdueRepeatIntervalDays: 3,
  maxOverdueReminders: 3,
  channels: ['email'],
  autoCreateUrgentTask: false,
  penaltyPercentPerDay: 0,
};

export const PROPOSAL_TEMPLATES: ProposalTemplateMeta[] = [
  {
    id: 'premium',
    name: 'Премиум Студия (Design Studio)',
    badge: 'Дизайнерский',
    description: 'Презентабельное КП с фирменной подачей, этапами реализации, гарантийным блоком и условиями для дизайнеров и архитекторов.',
    accentColor: '#2563EB',
    targetAudience: 'Дизайнеры интерьера, архитектурные бюро, частные премиум-клиенты',
    features: ['Фирменная шапка студии','Карточки Исполнителя и Заказчика','Сроки и схема оплаты','Спецификация материалов','Гарантийный блок'],
  },
  {
    id: 'offer',
    name: 'Счет-оферта по форме ГОСТ / 1С',
    badge: 'Официальный',
    description: 'Официальный счет на оплату с банковскими реквизитами, суммой прописью и данными организации.',
    accentColor: '#D97706',
    targetAudience: 'Юридические лица, корпоративные клиенты, бухгалтерия',
    features: ['Банковские реквизиты','Строгий формат счета','Сумма прописью','Статус НДС','Подписи и реквизиты'],
  },
  {
    id: 'manufacturing',
    name: 'Производственный стандарт (Craft & Tech)',
    badge: 'Технический',
    description: 'Инженерно-производственная спецификация с материалами, контролем качества, сроками производства и графиком платежей.',
    accentColor: '#059669',
    targetAudience: 'Производственные заказчики, комплектаторы объектов, инженеры',
    features: ['Техническая спецификация','Контроль качества','Материалы и отделка','Сроки изготовления','Условия поставки'],
  },
  {
    id: 'standard',
    name: 'Экспресс КП (Minimalist One-Pager)',
    badge: 'Быстрое',
    description: 'Лаконичное коммерческое предложение для оперативного согласования и отправки клиенту.',
    accentColor: '#4F46E5',
    targetAudience: 'Частные заказчики, розничные клиенты, быстрые продажи',
    features: ['Компактная подача','Спецификация позиций','Цена и количество','Краткие условия','Удобно для отправки'],
  },
];
