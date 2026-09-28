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
  | 'lead'
  | 'contacted'
  | 'calculation'
  | 'proposal_sent'
  | 'negotiation'
  | 'prepayment'
  | 'production'
  | 'ready'
  | 'shipped'
  | 'closed_won'
  | 'closed_lost';

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
  deadline: string;
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
  primeCost: number;
  material?: string;
}

export interface Deal {
  id: string;
  clientId: string;
  clientName: string;
  title: string;
  amount: number;
  primeCost: number;
  margin: number;
  stage: DealStage;
  probability: number;
  deadline: string;
  paymentDate?: string;
  productionStartDate?: string;
  assignedManager: string;
  items: DealItem[];
  lostReason?: string;
  createdAt: string;
  updatedAt: string;
}

export type ProductionStatus = 
  | 'queued'
  | 'materials'
  | 'cutting'
  | 'assembly'
  | 'finishing'
  | 'quality_control'
  | 'packaged'
  | 'shipped';

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
  contractorName: string;
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
  remindDaysBeforeDue: number;
  sendOnDueDate: boolean;
  enableOverdueReminders: boolean;
  overdueGraceDays: number;
  overdueRepeatIntervalDays: number;
  maxOverdueReminders: number;
  channels: CommunicationChannel[];
  autoCreateUrgentTask: boolean;
  penaltyPercentPerDay: number;
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
  daysOffset: number;
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
  billingDay: number;
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
  rating: number;
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
