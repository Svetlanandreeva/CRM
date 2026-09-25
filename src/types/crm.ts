export type LeadSource = 
  | 'Сайт / SEO'
  | 'WhatsApp'
  | 'Telegram'
  | 'Рекомендация'
  | 'Выставка / Конференция'
  | 'Instagram / Соцсети'
  | 'Архитектор / Дизайнер';

export type ClientStatus = 'Лид' | 'Потенциальный' | 'Активный' | 'VIP' | 'В архиве';

export type DealStage = 
  | 'lead'              // Новый лид
  | 'contacted'         // Связались
  | 'calculation'       // Расчёт
  | 'proposal_sent'     // КП отправлено
  | 'negotiation'       // Согласование
  | 'prepayment'        // Предоплата
  | 'production'        // Производство
  | 'ready'             // Готово
  | 'shipped'           // Отгружено
  | 'closed_won'        // Закрыто успешно
  | 'closed_lost';      // Срыв / Отказ

export interface DealStageInfo {
  id: DealStage;
  title: string;
  color: string;
  badgeBg: string;
}

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskType = 'call' | 'message' | 'meeting' | 'proposal' | 'production' | 'payment';

export interface Task {
  id: string;
  clientId?: string;
  clientName?: string;
  dealId?: string;
  dealTitle?: string;
  title: string;
  type: TaskType;
  priority: TaskPriority;
  deadline: string; // ISO string or YYYY-MM-DD
  completed: boolean;
  assignedTo: string;
  fromMessageText?: string;
  createdAt: string;
}

export type CommunicationChannel = 'whatsapp' | 'telegram' | 'email' | 'call' | 'note';

export interface ChatMessage {
  id: string;
  clientId: string;
  channel: CommunicationChannel;
  direction: 'inbound' | 'outbound' | 'internal';
  senderName: string;
  content: string;
  timestamp: string;
  attachments?: { name: string; size: string; type: string }[];
  isRead?: boolean;
}

export interface Client {
  id: string;
  name: string;
  company?: string;
  role?: string;
  phone: string;
  email: string;
  telegram?: string;
  whatsapp?: string;
  status: ClientStatus;
  source: LeadSource;
  assignedManager: string;
  avatar?: string;
  notes: string;
  tags: string[];
  totalLTV: number;
  currentDebt: number;
  lastContactAt: string;
  createdAt: string;
}

export interface DealItem {
  id: string;
  title: string;
  quantity: number;
  unitPrice: number;
  primeCost: number; // себестоимость
  material?: string;
}

export interface Deal {
  id: string;
  clientId: string;
  clientName: string;
  title: string;
  amount: number;
  primeCost: number; // общая себестоимость
  margin: number; // amount - primeCost
  stage: DealStage;
  probability: number; // 0-100%
  deadline: string;
  assignedManager: string;
  items: DealItem[];
  lostReason?: string;
  createdAt: string;
  updatedAt: string;
}

export type ProductionStatus = 
  | 'queued'           // В очереди
  | 'materials'        // Закупка материалов
  | 'cutting'          // Раскрой / Заготовка
  | 'assembly'         // Сборка / Изготовление
  | 'finishing'        // Отделка / Покраска
  | 'quality_control'  // Контроль ОТК
  | 'packaged'         // Упаковано
  | 'shipped';         // Отгружено

export interface ProductionOrder {
  id: string;
  dealId?: string;
  clientId: string;
  clientName: string;
  title: string;
  quantity: number;
  materials: string[];
  primeCost: number;
  salePrice: number;
  status: ProductionStatus;
  readyDeadline: string;
  contractorName: string; // Подрядчик / Цех
  packagingStatus: 'Не упаковано' | 'Упаковано в стретч/ящик' | 'Готово к транспортировке';
  deliveryService: 'СДЭК' | 'Деловые Линии' | 'Собственный курьер' | 'Самовывоз';
  trackingNumber?: string;
  notes?: string;
}

export type DocumentType = 'proposal' | 'invoice' | 'contract' | 'act';
export type DocumentStatus = 'draft' | 'sent' | 'viewed' | 'approved' | 'paid';

export type ProposalTemplateId = 'standard' | 'premium' | 'manufacturing' | 'offer';

export interface ProposalTemplateMeta {
  id: ProposalTemplateId;
  name: string;
  badge: string;
  description: string;
  accentColor: string;
  targetAudience: string;
  features: string[];
}

export type RecurringFrequency = 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'annually';

export interface RecurringScheduleExecutionLog {
  id: string;
  scheduleId: string;
  documentId: string;
  documentNumber: string;
  executedAt: string;
  amount: number;
  clientName: string;
  status: 'success' | 'failed';
  notes?: string;
}

export interface ContractReminderSettings {
  enabled: boolean;
  remindDaysBeforeDue: number; // e.g. 2 or 3 days before due date
  sendOnDueDate: boolean; // e.g. send on day 0
  enableOverdueReminders: boolean;
  overdueGraceDays: number; // e.g. 1 day after due date
  overdueRepeatIntervalDays: number; // e.g. every 3 days
  maxOverdueReminders: number; // e.g. 3
  channels: CommunicationChannel[]; // ['email', 'whatsapp', 'telegram']
  autoCreateUrgentTask: boolean;
  penaltyPercentPerDay: number; // e.g. 0.1% пеня по договору
  approachingTemplate?: string;
  overdueTemplate?: string;
}

export interface InvoiceReminderTriggerLog {
  id: string;
  documentId: string;
  documentNumber: string;
  clientId: string;
  clientName: string;
  contractNumber?: string;
  triggerType: 'approaching_due' | 'due_today' | 'overdue';
  daysOffset: number; // -2 = 2 days left, 0 = due today, +3 = 3 days overdue
  channel: CommunicationChannel;
  recipientContact: string;
  triggeredAt: string;
  messageText: string;
  status: 'sent' | 'failed';
}

export interface RecurringInvoiceSchedule {
  id: string;
  clientId: string;
  clientName: string;
  contractNumber: string;
  contractTitle: string;
  frequency: RecurringFrequency;
  billingDay: number; // Day of month (1-31) or day of period
  startDate: string;
  endDate?: string;
  nextRunDate: string;
  lastTriggeredDate?: string;
  templateId: ProposalTemplateId;
  documentType: DocumentType;
  titleTemplate: string;
  items: DealItem[];
  amount: number;
  autoSendEmail: boolean;
  notifyManager: boolean;
  paymentDueDays: number;
  contractReminderSettings?: ContractReminderSettings;
  status: 'active' | 'paused' | 'completed';
  totalExecutedCount: number;
  totalExecutedAmount: number;
  createdAt: string;
  notes?: string;
}

export interface RecurringSchedulerSettings {
  enabled: boolean;
  checkIntervalMinutes: number;
  defaultBillingDay: number;
  defaultDueDays: number;
  defaultTemplateId: ProposalTemplateId;
  autoSendInvoices: boolean;
  notifyManagerOnGeneration: boolean;
  lastGlobalCheckAt?: string;
  contractReminderSettings?: ContractReminderSettings;
}

export interface CompanySettings {
  companyName: string;
  brandName: string;
  inn: string;
  kpp: string;
  ogrn: string;
  legalAddress: string;
  actualAddress: string;
  phone: string;
  email: string;
  website: string;
  bankName: string;
  bik: string;
  accountNumber: string;
  corrAccount: string;
  ceoName: string;
  ceoTitle: string;
  accountantName: string;
  taxSystem: string;
  defaultPrepaymentPercent: number;
  defaultValidityDays: number;
  defaultProductionDays: number;
  defaultTemplateId: ProposalTemplateId;
  vatIncluded: boolean;
  notesFooter: string;
  guaranteeMonths: number;
}

export type DocumentHistoryEventType =
  | 'generated'
  | 'sent'
  | 'viewed'
  | 'approved'
  | 'paid'
  | 'status_changed'
  | 'reminder_sent';

export interface DocumentHistoryEvent {
  id: string;
  type: DocumentHistoryEventType;
  title: string;
  description: string;
  timestamp: string;
  actor?: string;
  channel?: string;
  clientIp?: string;
  userAgent?: string;
  device?: string;
  meta?: Record<string, string | number>;
}

export interface DocumentRecord {
  id: string;
  number: string;
  type: DocumentType;
  title: string;
  clientId: string;
  clientName: string;
  dealId?: string;
  amount: number;
  status: DocumentStatus;
  createdAt: string;
  validUntil?: string;
  items: DealItem[];
  fileUrl?: string;
  templateId?: ProposalTemplateId;
  companySnapshot?: CompanySettings;
  prepaymentPercent?: number;
  productionDays?: number;
  notes?: string;
  sentAt?: string;
  viewedAt?: string;
  paidAt?: string;
  contractNumber?: string;
  lastReminderSentAt?: string;
  reminderTriggersSent?: ('approaching_due' | 'due_today' | 'overdue')[];
  remindersSentCount?: number;
  history?: DocumentHistoryEvent[];
}

export interface PaymentRecord {
  id: string;
  clientId: string;
  clientName: string;
  dealId: string;
  dealTitle: string;
  amount: number;
  type: 'prepayment' | 'final' | 'contractor_cost' | 'materials_cost';
  direction: 'inflow' | 'outflow';
  date: string;
  method: 'Банковский счет (Безнал)' | 'Карта' | 'СБП' | 'Наличные';
  status: 'completed' | 'pending';
}

export interface CatalogItem {
  id: string;
  article: string;
  title: string;
  category: string;
  basePrice: number;
  primeCost: number;
  productionDays: number;
  materials: string[];
  description: string;
}

export interface Contractor {
  id: string;
  name: string;
  specialization: string;
  contactPerson: string;
  phone: string;
  email: string;
  rating: number; // 1-5
  activeOrdersCount: number;
  averageLeadDays: number;
  pricingTier: 'Эконом' | 'Оптимум' | 'Премиум';
}

export interface NotificationItem {
  id: string;
  type:
    | 'overdue_reply'
    | 'overdue_payment'
    | 'proposal_expiring'
    | 'production_ready'
    | 'task_alert'
    | 'recurring_invoice_generated'
    | 'invoice_approaching_due'
    | 'invoice_reminder_triggered';
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  clientId?: string;
  dealId?: string;
}

export interface QuickReplyTemplate {
  id: string;
  title: string;
  category: string;
  text: string;
}

export interface Manager {
  id: string;
  name: string;
  role: string;
  avatar: string;
  email: string;
  dealsWon: number;
  revenue: number;
}
