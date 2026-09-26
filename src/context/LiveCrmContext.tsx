import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type {
  Client,
  ClientStatus,
  Deal,
  DealStage,
  Task,
  ChatMessage,
  ProductionOrder,
  ProductionStatus,
  DocumentRecord,
  DocumentStatus,
  DocumentHistoryEvent,
  PaymentRecord,
  CatalogItem,
  Contractor,
  NotificationItem,
  QuickReplyTemplate,
  Manager,
  CommunicationChannel,
  CompanySettings,
  RecurringInvoiceSchedule,
  RecurringScheduleExecutionLog,
  RecurringSchedulerSettings,
  ContractReminderSettings,
  InvoiceReminderTriggerLog,
} from '../types/crm';

export type NavigationTab =
  | 'dashboard'
  | 'clients'
  | 'client_cockpit'
  | 'deals'
  | 'pipeline'
  | 'inbox'
  | 'production'
  | 'documents'
  | 'tasks'
  | 'finance'
  | 'project_calc'
  | 'catalog'
  | 'contractors'
  | 'analytics'
  | 'ai_manager'
  | 'calendar'
  | 'integrations'
  | 'settings';

export type ThemeMode = 'light' | 'dark';

type LiveStage = { id: string; name: string; isWon?: boolean; isLost?: boolean };

interface CrmContextType {
  currentTab: NavigationTab;
  setCurrentTab: (tab: NavigationTab) => void;
  selectedClientId: string;
  setSelectedClientId: (id: string) => void;
  selectedDealId: string | null;
  setSelectedDealId: (id: string | null) => void;
  openClientCockpit: (clientId: string) => void;
  theme: ThemeMode;
  setTheme: (t: ThemeMode) => void;
  toggleTheme: () => void;
  currentManager: Manager;
  setCurrentManager: (m: Manager) => void;
  managers: Manager[];
  clients: Client[];
  deals: Deal[];
  tasks: Task[];
  chatMessages: ChatMessage[];
  productionOrders: ProductionOrder[];
  documents: DocumentRecord[];
  payments: PaymentRecord[];
  catalog: CatalogItem[];
  contractors: Contractor[];
  notifications: NotificationItem[];
  quickReplyTemplates: QuickReplyTemplate[];
  addClient: (client: Omit<Client, 'id' | 'createdAt' | 'lastContactAt' | 'totalLTV' | 'currentDebt'>) => Client;
  updateClient: (id: string, updates: Partial<Client>) => void;
  deleteClient: (id: string) => void;
  bulkDeleteClients: (ids: string[]) => void;
  bulkUpdateClientsStatus: (ids: string[], status: ClientStatus) => void;
  bulkReassignClients: (ids: string[], manager: string) => void;
  addDeal: (deal: Omit<Deal, 'id' | 'createdAt' | 'updatedAt' | 'margin'>) => Deal;
  updateDealStage: (id: string, stage: DealStage) => void;
  updateDeal: (id: string, updates: Partial<Deal>) => void;
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'completed'>) => Task;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;
  bulkDeleteTasks: (ids: string[]) => void;
  bulkUpdateTasksStatus: (ids: string[], completed: boolean) => void;
  bulkReassignTasks: (ids: string[], assignedTo: string) => void;
  sendMessage: (clientId: string, content: string, channel: CommunicationChannel, direction?: 'inbound' | 'outbound' | 'internal', attachments?: { name: string; size: string; type: string }[]) => void;
  updateProductionStatus: (id: string, status: ProductionStatus) => void;
  addProductionOrder: (order: Omit<ProductionOrder, 'id'>) => ProductionOrder;
  addDocument: (doc: Omit<DocumentRecord, 'id' | 'createdAt'>) => DocumentRecord;
  updateDocumentStatus: (id: string, status: DocumentStatus) => void;
  addDocumentHistoryEvent: (docId: string, event: Omit<DocumentHistoryEvent, 'id' | 'timestamp'>) => void;
  deleteDocument: (id: string) => void;
  bulkDeleteDocuments: (ids: string[]) => void;
  bulkUpdateDocumentsStatus: (ids: string[], status: DocumentStatus) => void;
  addPayment: (payment: Omit<PaymentRecord, 'id' | 'date'>) => PaymentRecord;
  companySettings: CompanySettings;
  updateCompanySettings: (updates: Partial<CompanySettings>) => void;
  addQuickReplyTemplate: (template: Omit<QuickReplyTemplate, 'id'>) => QuickReplyTemplate;
  deleteQuickReplyTemplate: (id: string) => void;
  updateQuickReplyTemplate: (id: string, updates: Partial<QuickReplyTemplate>) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  recurringSchedules: RecurringInvoiceSchedule[];
  recurringLogs: RecurringScheduleExecutionLog[];
  schedulerSettings: RecurringSchedulerSettings;
  updateSchedulerSettings: (updates: Partial<RecurringSchedulerSettings>) => void;
  addRecurringSchedule: (schedule: Omit<RecurringInvoiceSchedule, 'id' | 'createdAt' | 'totalExecutedCount' | 'totalExecutedAmount'>) => RecurringInvoiceSchedule;
  updateRecurringSchedule: (id: string, updates: Partial<RecurringInvoiceSchedule>) => void;
  deleteRecurringSchedule: (id: string) => void;
  toggleRecurringScheduleStatus: (id: string) => void;
  triggerRecurringScheduleNow: (scheduleId: string) => DocumentRecord | null;
  runAutomatedSchedulerCheck: () => { triggeredCount: number; generatedDocs: DocumentRecord[] };
  contractReminderSettings: ContractReminderSettings;
  updateContractReminderSettings: (updates: Partial<ContractReminderSettings>) => void;
  invoiceReminderLogs: InvoiceReminderTriggerLog[];
  runInvoiceReminderTriggers: (forceCheckAll?: boolean) => { triggeredApproaching: number; triggeredOverdue: number; logs: InvoiceReminderTriggerLog[] };
  sendSingleInvoiceReminderTrigger: (documentId: string, triggerType: 'approaching_due' | 'overdue', customChannel?: CommunicationChannel) => { success: boolean; log?: InvoiceReminderTriggerLog; error?: string };
  isCommandPaletteOpen: boolean;
  setIsCommandPaletteOpen: (open: boolean) => void;
  isNotificationsOpen: boolean;
  setIsNotificationsOpen: (open: boolean) => void;
  isCreateClientOpen: boolean;
  setIsCreateClientOpen: (open: boolean) => void;
  isCreateDealOpen: boolean;
  setIsCreateDealOpen: (open: boolean) => void;
  isCreateTaskOpen: boolean;
  setIsCreateTaskOpen: (open: boolean) => void;
  initialTaskData: Partial<Task> | null;
  openCreateTaskWithPreset: (preset: Partial<Task>) => void;
  isCreateInvoiceOpen: boolean;
  setIsCreateInvoiceOpen: (open: boolean) => void;
  isCreateRecurringOpen: boolean;
  setIsCreateRecurringOpen: (open: boolean) => void;
  recurringPresetClient: Client | null;
  openCreateRecurringForClient: (client: Client) => void;
  resetToDefaults: () => void;
}

const emptyCompanySettings: CompanySettings = {
  companyName: '', brandName: 'Satori Labural', inn: '', kpp: '', ogrn: '', legalAddress: '', actualAddress: '', phone: '', email: '', website: '', bankName: '', bik: '', accountNumber: '', corrAccount: '', ceoName: '', ceoTitle: '', accountantName: '', taxSystem: '', defaultPrepaymentPercent: 50, defaultValidityDays: 14, defaultProductionDays: 21, defaultTemplateId: 'standard', vatIncluded: false, notesFooter: '', guaranteeMonths: 0,
};
const emptyScheduler: RecurringSchedulerSettings = { enabled: false, checkIntervalMinutes: 60, defaultBillingDay: 1, defaultDueDays: 5, defaultTemplateId: 'standard', autoSendInvoices: false, notifyManagerOnGeneration: false };
const emptyReminder: ContractReminderSettings = { enabled: false, remindDaysBeforeDue: 3, sendOnDueDate: false, enableOverdueReminders: false, overdueGraceDays: 1, overdueRepeatIntervalDays: 3, maxOverdueReminders: 3, channels: ['email'], autoCreateUrgentTask: false, penaltyPercentPerDay: 0 };
const owner: Manager = { id: 'owner', name: 'Светлана', role: 'Владелец', avatar: '', email: '', dealsWon: 0, revenue: 0 };

const CrmContext = createContext<CrmContextType | undefined>(undefined);

function safeJson<T>(key: string, fallback: T): T {
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) as T : fallback; } catch { return fallback; }
}
function rub(cents: unknown) { return Math.max(0, Number(cents || 0)) / 100; }
function iso(value: unknown) { const d = value ? new Date(String(value)) : new Date(); return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString(); }
function mapSource(value: unknown): Client['source'] {
  const s = String(value || '').toLowerCase();
  if (s.includes('whatsapp')) return 'WhatsApp';
  if (s.includes('telegram')) return 'Telegram';
  if (s.includes('instagram') || s.includes('social')) return 'Instagram / Соцсети';
  if (s.includes('recommend') || s.includes('реф')) return 'Рекомендация';
  if (s.includes('exhib') || s.includes('выстав')) return 'Выставка / Конференция';
  if (s.includes('design') || s.includes('architect')) return 'Архитектор / Дизайнер';
  return 'Сайт / SEO';
}
function mapStageName(name: unknown, isWon = false, isLost = false): DealStage {
  if (isLost) return 'closed_lost'; if (isWon) return 'closed_won';
  const n = String(name || '').toLowerCase().replace(/ё/g, 'е');
  if (n.includes('достав') || n.includes('отгруж')) return 'shipped';
  if (n.includes('готов')) return 'ready';
  if (n.includes('производ')) return 'production';
  if (n.includes('предоплат') || n.includes('ожида') && n.includes('оплат') || n === 'оплачено') return 'prepayment';
  if (n.includes('соглас')) return 'negotiation';
  if (n.includes('кп') || n.includes('предлож')) return 'proposal_sent';
  if (n.includes('расчет') || n.includes('расчёт')) return 'calculation';
  if (n.includes('контакт') || n.includes('связ')) return 'contacted';
  return 'lead';
}
function backendPriority(p: Task['priority']) { return p === 'medium' ? 'normal' : p; }
function taskType(value: unknown): Task['type'] {
  const s = String(value || '').toLowerCase();
  if (s.includes('call')) return 'call'; if (s.includes('meet')) return 'meeting'; if (s.includes('proposal')) return 'proposal'; if (s.includes('payment')) return 'payment'; if (s.includes('message')) return 'message'; return 'message';
}
async function jsonFetch(url: string, init?: RequestInit) {
  const r = await fetch(url, { credentials: 'include', ...init, headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) } });
  if (!r.ok) throw new Error((await r.json().catch(() => ({})))?.error || `HTTP ${r.status}`);
  return r.json();
}

export const CrmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTab, setCurrentTab] = useState<NavigationTab>('dashboard');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);
  const [theme, setTheme] = useState<ThemeMode>(() => (localStorage.getItem('satori_crm_theme') === 'dark' ? 'dark' : 'light'));
  const [currentManager, setCurrentManager] = useState<Manager>(owner);
  const managers = useMemo(() => [currentManager], [currentManager]);

  const [clients, setClients] = useState<Client[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [productionOrders, setProductionOrders] = useState<ProductionOrder[]>([]);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [catalog] = useState<CatalogItem[]>([]);
  const [contractors] = useState<Contractor[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [quickReplyTemplates, setQuickReplyTemplates] = useState<QuickReplyTemplate[]>(() => safeJson('satori_crm_templates_live', []));
  const [companySettings, setCompanySettings] = useState<CompanySettings>(() => safeJson('satori_crm_company_settings', emptyCompanySettings));
  const [recurringSchedules, setRecurringSchedules] = useState<RecurringInvoiceSchedule[]>(() => safeJson('satori_crm_recurring_schedules_live', []));
  const [recurringLogs, setRecurringLogs] = useState<RecurringScheduleExecutionLog[]>(() => safeJson('satori_crm_recurring_logs_live', []));
  const [schedulerSettings, setSchedulerSettings] = useState<RecurringSchedulerSettings>(() => safeJson('satori_crm_recurring_settings', emptyScheduler));
  const [contractReminderSettings, setContractReminderSettings] = useState<ContractReminderSettings>(() => safeJson('satori_crm_contract_reminders', emptyReminder));
  const [invoiceReminderLogs, setInvoiceReminderLogs] = useState<InvoiceReminderTriggerLog[]>(() => safeJson('satori_crm_invoice_reminder_logs_live', []));
  const [liveStages, setLiveStages] = useState<LiveStage[]>([]);

  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isCreateClientOpen, setIsCreateClientOpen] = useState(false);
  const [isCreateDealOpen, setIsCreateDealOpen] = useState(false);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [initialTaskData, setInitialTaskData] = useState<Partial<Task> | null>(null);
  const [isCreateInvoiceOpen, setIsCreateInvoiceOpen] = useState(false);
  const [isCreateRecurringOpen, setIsCreateRecurringOpen] = useState(false);
  const [recurringPresetClient, setRecurringPresetClient] = useState<Client | null>(null);

  useEffect(() => { localStorage.setItem('satori_crm_theme', theme); }, [theme]);
  useEffect(() => { localStorage.setItem('satori_crm_templates_live', JSON.stringify(quickReplyTemplates)); }, [quickReplyTemplates]);
  useEffect(() => { localStorage.setItem('satori_crm_company_settings', JSON.stringify(companySettings)); }, [companySettings]);
  useEffect(() => { localStorage.setItem('satori_crm_recurring_schedules_live', JSON.stringify(recurringSchedules)); }, [recurringSchedules]);
  useEffect(() => { localStorage.setItem('satori_crm_recurring_logs_live', JSON.stringify(recurringLogs)); }, [recurringLogs]);
  useEffect(() => { localStorage.setItem('satori_crm_recurring_settings', JSON.stringify(schedulerSettings)); }, [schedulerSettings]);
  useEffect(() => { localStorage.setItem('satori_crm_contract_reminders', JSON.stringify(contractReminderSettings)); }, [contractReminderSettings]);
  useEffect(() => { localStorage.setItem('satori_crm_invoice_reminder_logs_live', JSON.stringify(invoiceReminderLogs)); }, [invoiceReminderLogs]);

  useEffect(() => {
    if (localStorage.getItem('satori_live_backend_v1') === '1') return;
    ['satori_crm_clients','satori_crm_deals','satori_crm_tasks','satori_crm_messages','satori_crm_production','satori_crm_docs','satori_crm_payments','satori_crm_catalog','satori_crm_contractors','satori_crm_notifications','satori_crm_templates','satori_crm_recurring_schedules','satori_crm_recurring_logs','satori_crm_invoice_reminder_logs'].forEach(k => localStorage.removeItem(k));
    localStorage.setItem('satori_live_backend_v1', '1');
  }, []);

  const refreshLiveData = useCallback(async () => {
    const [contactResult, dealResult, taskResult, economicsResult, pipelineResult] = await Promise.allSettled([
      jsonFetch('/api/contacts'), jsonFetch('/api/deals'), jsonFetch('/api/tasks'), jsonFetch('/api/economics'), jsonFetch('/api/pipeline'),
    ]);
    const contactRows: any[] = contactResult.status === 'fulfilled' && Array.isArray(contactResult.value) ? contactResult.value : [];
    const dealRows: any[] = dealResult.status === 'fulfilled' && Array.isArray(dealResult.value) ? dealResult.value : [];
    const taskRows: any[] = taskResult.status === 'fulfilled' ? (Array.isArray(taskResult.value?.tasks) ? taskResult.value.tasks : []) : [];
    const economicsRows: any[] = economicsResult.status === 'fulfilled' && Array.isArray(economicsResult.value?.deals) ? economicsResult.value.deals : [];
    const stageRows: any[] = pipelineResult.status === 'fulfilled' && Array.isArray(pipelineResult.value) ? pipelineResult.value : [];
    if (stageRows.length) setLiveStages(stageRows.map(s => ({ id: String(s.id), name: String(s.name || ''), isWon: Boolean(s.isWon), isLost: Boolean(s.isLost) })));
    const economicsByDeal = new Map(economicsRows.map(row => [String(row.dealId), row]));
    const nextDeals: Deal[] = dealRows.map(row => {
      const econ = economicsByDeal.get(String(row.id));
      const amount = rub(row.value);
      const primeCost = rub(econ?.totalCost || 0);
      return { id: String(row.id), clientId: String(row.contactId || ''), clientName: String(row.contactName || 'Без имени'), title: String(row.title || 'Без названия'), amount, primeCost, margin: Math.max(0, amount - primeCost), stage: mapStageName(row.stageName, Boolean(row.stageIsWon), Boolean(row.stageIsLost)), probability: Number(row.probability || 0), deadline: row.expectedClose ? String(row.expectedClose).slice(0,10) : '', assignedManager: String(row.ownerName || 'Светлана'), items: [], lostReason: row.lossReason ? String(row.lossReason) : undefined, createdAt: iso(row.createdAt), updatedAt: iso(row.updatedAt) };
    });
    const nextClients: Client[] = contactRows.map(row => ({
      id: String(row.id), name: String(row.name || 'Без имени'), company: row.company ? String(row.company) : undefined, role: undefined, phone: String(row.phone || ''), email: String(row.email || ''), telegram: undefined, whatsapp: undefined,
      status: row.stageIsLost ? 'В архиве' : row.activeDealId ? 'Активный' : String(row.qualification || '') === 'qualified' ? 'Потенциальный' : 'Лид', source: mapSource(row.source), assignedManager: String(row.ownerName || 'Светлана'), avatar: undefined, notes: String(row.notes || ''), tags: [], totalLTV: rub(row.activeDealValue || 0), currentDebt: 0, lastContactAt: iso(row.updatedAt || row.createdAt), createdAt: iso(row.createdAt),
    }));
    const nextTasks: Task[] = taskRows.map(row => ({ id: String(row.id), clientId: row.contactId ? String(row.contactId) : undefined, clientName: row.contactName ? String(row.contactName) : undefined, dealId: row.dealId ? String(row.dealId) : undefined, dealTitle: row.dealTitle ? String(row.dealTitle) : undefined, title: String(row.description || 'Задача'), type: taskType(row.type), priority: String(row.priority) === 'normal' ? 'medium' : (['low','medium','high','urgent'].includes(String(row.priority)) ? String(row.priority) as Task['priority'] : 'medium'), deadline: iso(row.scheduledAt || row.createdAt), completed: Boolean(row.completedAt), assignedTo: String(row.ownerName || 'Светлана'), createdAt: iso(row.createdAt) }));
    const dealById = new Map(nextDeals.map(d => [d.id, d]));
    const nextPayments: PaymentRecord[] = economicsRows.filter(row => Number(row.receivedAmount || 0) > 0).map(row => {
      const deal = dealById.get(String(row.dealId));
      return { id: `received_${row.dealId}`, clientId: String(row.contactId || deal?.clientId || ''), clientName: String(row.contactName || deal?.clientName || 'Клиент'), dealId: String(row.dealId), dealTitle: String(row.dealTitle || deal?.title || 'Сделка'), amount: rub(row.receivedAmount), type: 'prepayment', direction: 'inflow', date: iso(row.paymentDate || row.updatedAt), method: 'Банковский счет (Безнал)', status: 'completed' };
    });
    setDeals(nextDeals); setClients(nextClients); setTasks(nextTasks); setPayments(nextPayments);
    if (!selectedClientId && nextClients[0]) setSelectedClientId(nextClients[0].id);
    const revenue = nextPayments.reduce((s,p)=>s+p.amount,0); const won = nextDeals.filter(d=>d.stage==='closed_won').length;
    setCurrentManager(m => ({ ...m, dealsWon: won, revenue }));
  }, [selectedClientId]);

  useEffect(() => { refreshLiveData().catch(console.error); const timer = window.setInterval(() => refreshLiveData().catch(console.error), 60000); return () => window.clearInterval(timer); }, [refreshLiveData]);

  const toggleTheme = () => setTheme(t => t === 'light' ? 'dark' : 'light');
  const openClientCockpit = (clientId: string) => { setSelectedClientId(clientId); setCurrentTab('client_cockpit'); };
  const updateCompanySettings = (updates: Partial<CompanySettings>) => setCompanySettings(prev => ({ ...prev, ...updates }));
  const addQuickReplyTemplate = (template: Omit<QuickReplyTemplate,'id'>) => { const item = { ...template, id: `qr_${Date.now()}` }; setQuickReplyTemplates(v => [item, ...v]); return item; };
  const deleteQuickReplyTemplate = (id: string) => setQuickReplyTemplates(v => v.filter(x => x.id !== id));
  const updateQuickReplyTemplate = (id: string, updates: Partial<QuickReplyTemplate>) => setQuickReplyTemplates(v => v.map(x => x.id === id ? { ...x, ...updates } : x));

  const addClient = (client: Omit<Client,'id'|'createdAt'|'lastContactAt'|'totalLTV'|'currentDebt'>) => {
    const now = new Date().toISOString(); const optimistic: Client = { ...client, id: `pending_${Date.now()}`, createdAt: now, lastContactAt: now, totalLTV: 0, currentDebt: 0 };
    setClients(v => [optimistic, ...v]);
    jsonFetch('/api/contacts', { method:'POST', body: JSON.stringify({ name: client.name, phone: client.phone, email: client.email, company: client.company || null, source: client.source, notes: client.notes || '', qualification: client.status === 'Потенциальный' || client.status === 'Активный' || client.status === 'VIP' ? 'qualified' : 'new' }) }).then(refreshLiveData).catch(console.error);
    return optimistic;
  };
  const updateClient = (id: string, updates: Partial<Client>) => { setClients(v => v.map(c => c.id===id?{...c,...updates}:c)); jsonFetch(`/api/contacts/${encodeURIComponent(id)}`, { method:'PUT', body: JSON.stringify({ name: updates.name, phone: updates.phone, email: updates.email, company: updates.company, notes: updates.notes }) }).then(refreshLiveData).catch(console.error); };
  const deleteClient = (id: string) => { jsonFetch(`/api/contacts/${encodeURIComponent(id)}`, { method:'PUT', body: JSON.stringify({ qualification:'ignore' }) }).then(refreshLiveData).catch(console.error); };
  const bulkDeleteClients = (ids: string[]) => ids.forEach(deleteClient);
  const bulkUpdateClientsStatus = (ids: string[], status: ClientStatus) => { setClients(v => v.map(c => ids.includes(c.id)?{...c,status}:c)); const qualification = status==='В архиве'?'ignore':status==='Лид'?'new':'qualified'; ids.forEach(id => jsonFetch(`/api/contacts/${encodeURIComponent(id)}`, { method:'PUT', body:JSON.stringify({ qualification }) }).catch(console.error)); };
  const bulkReassignClients = (ids: string[], manager: string) => setClients(v => v.map(c => ids.includes(c.id)?{...c,assignedManager:manager}:c));

  const addDeal = (deal: Omit<Deal,'id'|'createdAt'|'updatedAt'|'margin'>) => { const now=new Date().toISOString(); const optimistic:Deal={...deal,id:`pending_${Date.now()}`,margin:deal.amount-deal.primeCost,createdAt:now,updatedAt:now}; setDeals(v=>[optimistic,...v]); const target=liveStages.find(s=>mapStageName(s.name,s.isWon,s.isLost)===deal.stage); jsonFetch('/api/deals',{method:'POST',body:JSON.stringify({title:deal.title,value:Math.round(deal.amount*100),contactId:deal.clientId,stageId:target?.id,expectedClose:deal.deadline||null,probability:deal.probability})}).then(refreshLiveData).catch(console.error); return optimistic; };
  const updateDeal = (id: string, updates: Partial<Deal>) => { setDeals(v=>v.map(d=>d.id===id?{...d,...updates,margin:(updates.amount??d.amount)-(updates.primeCost??d.primeCost),updatedAt:new Date().toISOString()}:d)); const body:any={}; if(updates.title!==undefined)body.title=updates.title;if(updates.amount!==undefined)body.value=Math.round(updates.amount*100);if(updates.deadline!==undefined)body.expectedClose=updates.deadline||null;if(updates.probability!==undefined)body.probability=updates.probability; jsonFetch(`/api/deals/${encodeURIComponent(id)}`,{method:'PUT',body:JSON.stringify(body)}).then(refreshLiveData).catch(console.error); };
  const updateDealStage = (id: string, stage: DealStage) => { const target=liveStages.find(s=>mapStageName(s.name,Boolean(s.isWon),Boolean(s.isLost))===stage); if(!target||target.isLost) return; setDeals(v=>v.map(d=>d.id===id?{...d,stage,updatedAt:new Date().toISOString()}:d)); jsonFetch('/api/pipeline',{method:'PUT',body:JSON.stringify({dealId:id,stageId:target.id})}).then(refreshLiveData).catch(console.error); };

  const addTask = (task: Omit<Task,'id'|'createdAt'|'completed'>) => { const item:Task={...task,id:`pending_${Date.now()}`,createdAt:new Date().toISOString(),completed:false}; setTasks(v=>[item,...v]); if(task.clientId) jsonFetch('/api/tasks',{method:'POST',body:JSON.stringify({description:task.title,contactId:task.clientId,dealId:task.dealId||null,priority:backendPriority(task.priority),scheduledAt:task.deadline})}).then(refreshLiveData).catch(console.error); return item; };
  const toggleTask = (id:string) => setTasks(v=>v.map(t=>t.id===id?{...t,completed:!t.completed}:t));
  const deleteTask = (id:string) => setTasks(v=>v.filter(t=>t.id!==id));
  const bulkDeleteTasks = (ids:string[]) => setTasks(v=>v.filter(t=>!ids.includes(t.id)));
  const bulkUpdateTasksStatus = (ids:string[],completed:boolean) => setTasks(v=>v.map(t=>ids.includes(t.id)?{...t,completed}:t));
  const bulkReassignTasks = (ids:string[],assignedTo:string) => setTasks(v=>v.map(t=>ids.includes(t.id)?{...t,assignedTo}:t));

  const sendMessage = (clientId:string, content:string, channel:CommunicationChannel, direction:'inbound'|'outbound'|'internal'='outbound', attachments?:{name:string;size:string;type:string}[]) => { if(direction!=='outbound') return; if(channel==='telegram') jsonFetch('/api/integrations/telegram/reply',{method:'POST',body:JSON.stringify({contactId,text:content})}).catch(console.error); const m:ChatMessage={id:`local_${Date.now()}`,clientId,channel,direction,senderName:'Светлана',content,timestamp:new Date().toISOString(),attachments,isRead:true};setChatMessages(v=>[...v,m]); };

  const updateProductionStatus=(id:string,status:ProductionStatus)=>setProductionOrders(v=>v.map(o=>o.id===id?{...o,status}:o));
  const addProductionOrder=(order:Omit<ProductionOrder,'id'>)=>{const item={...order,id:`po_${Date.now()}`};setProductionOrders(v=>[item,...v]);return item;};
  const addDocument=(doc:Omit<DocumentRecord,'id'|'createdAt'>)=>{const item={...doc,id:`doc_${Date.now()}`,createdAt:new Date().toISOString()};setDocuments(v=>[item,...v]);return item;};
  const updateDocumentStatus=(id:string,status:DocumentStatus)=>setDocuments(v=>v.map(d=>d.id===id?{...d,status}:d));
  const addDocumentHistoryEvent=(docId:string,event:Omit<DocumentHistoryEvent,'id'|'timestamp'>)=>setDocuments(v=>v.map(d=>d.id===docId?{...d,history:[...(d.history||[]),{...event,id:`h_${Date.now()}`,timestamp:new Date().toISOString()}]}:d));
  const deleteDocument=(id:string)=>setDocuments(v=>v.filter(d=>d.id!==id));
  const bulkDeleteDocuments=(ids:string[])=>setDocuments(v=>v.filter(d=>!ids.includes(d.id)));
  const bulkUpdateDocumentsStatus=(ids:string[],status:DocumentStatus)=>setDocuments(v=>v.map(d=>ids.includes(d.id)?{...d,status}:d));
  const addPayment=(payment:Omit<PaymentRecord,'id'|'date'>)=>{const item={...payment,id:`pay_${Date.now()}`,date:new Date().toISOString()};setPayments(v=>[item,...v]);const total=payments.filter(p=>p.dealId===payment.dealId&&p.direction==='inflow'&&p.status==='completed').reduce((s,p)=>s+p.amount,0)+(payment.direction==='inflow'&&payment.status==='completed'?payment.amount:0);jsonFetch(`/api/deals/${encodeURIComponent(payment.dealId)}`,{method:'PUT',body:JSON.stringify({receivedAmount:Math.round(total*100)})}).then(refreshLiveData).catch(console.error);return item;};

  const updateSchedulerSettings=(updates:Partial<RecurringSchedulerSettings>)=>setSchedulerSettings(v=>({...v,...updates}));
  const addRecurringSchedule=(schedule:Omit<RecurringInvoiceSchedule,'id'|'createdAt'|'totalExecutedCount'|'totalExecutedAmount'>)=>{const item={...schedule,id:`rec_${Date.now()}`,createdAt:new Date().toISOString(),totalExecutedCount:0,totalExecutedAmount:0};setRecurringSchedules(v=>[item,...v]);return item;};
  const updateRecurringSchedule=(id:string,updates:Partial<RecurringInvoiceSchedule>)=>setRecurringSchedules(v=>v.map(x=>x.id===id?{...x,...updates}:x));
  const deleteRecurringSchedule=(id:string)=>setRecurringSchedules(v=>v.filter(x=>x.id!==id));
  const toggleRecurringScheduleStatus=(id:string)=>setRecurringSchedules(v=>v.map(x=>x.id===id?{...x,status:x.status==='active'?'paused':'active'}:x));
  const triggerRecurringScheduleNow=(_scheduleId:string)=>null;
  const runAutomatedSchedulerCheck=()=>({triggeredCount:0,generatedDocs:[] as DocumentRecord[]});
  const updateContractReminderSettings=(updates:Partial<ContractReminderSettings>)=>setContractReminderSettings(v=>({...v,...updates}));
  const runInvoiceReminderTriggers=(_forceCheckAll?:boolean)=>({triggeredApproaching:0,triggeredOverdue:0,logs:[] as InvoiceReminderTriggerLog[]});
  const sendSingleInvoiceReminderTrigger=(_documentId:string,_triggerType:'approaching_due'|'overdue',_customChannel?:CommunicationChannel)=>({success:false,error:'Используйте живой канал переписки в разделе «Чаты».'});
  const markNotificationRead=(id:string)=>setNotifications(v=>v.map(n=>n.id===id?{...n,read:true}:n));
  const markAllNotificationsRead=()=>setNotifications(v=>v.map(n=>({...n,read:true})));
  const openCreateTaskWithPreset=(preset:Partial<Task>)=>{setInitialTaskData(preset);setIsCreateTaskOpen(true);};
  const openCreateRecurringForClient=(client:Client)=>{setRecurringPresetClient(client);setIsCreateRecurringOpen(true);};
  const resetToDefaults=()=>{setProductionOrders([]);setDocuments([]);setChatMessages([]);setNotifications([]);setQuickReplyTemplates([]);setRecurringSchedules([]);setRecurringLogs([]);setInvoiceReminderLogs([]);refreshLiveData().catch(console.error);};

  const value:CrmContextType={currentTab,setCurrentTab,selectedClientId,setSelectedClientId,selectedDealId,setSelectedDealId,openClientCockpit,theme,setTheme,toggleTheme,currentManager,setCurrentManager,managers,clients,deals,tasks,chatMessages,productionOrders,documents,payments,catalog,contractors,notifications,quickReplyTemplates,addClient,updateClient,deleteClient,bulkDeleteClients,bulkUpdateClientsStatus,bulkReassignClients,addDeal,updateDealStage,updateDeal,addTask,toggleTask,deleteTask,bulkDeleteTasks,bulkUpdateTasksStatus,bulkReassignTasks,sendMessage,updateProductionStatus,addProductionOrder,addDocument,updateDocumentStatus,addDocumentHistoryEvent,deleteDocument,bulkDeleteDocuments,bulkUpdateDocumentsStatus,addPayment,companySettings,updateCompanySettings,addQuickReplyTemplate,deleteQuickReplyTemplate,updateQuickReplyTemplate,markNotificationRead,markAllNotificationsRead,recurringSchedules,recurringLogs,schedulerSettings,updateSchedulerSettings,addRecurringSchedule,updateRecurringSchedule,deleteRecurringSchedule,toggleRecurringScheduleStatus,triggerRecurringScheduleNow,runAutomatedSchedulerCheck,contractReminderSettings,updateContractReminderSettings,invoiceReminderLogs,runInvoiceReminderTriggers,sendSingleInvoiceReminderTrigger,isCommandPaletteOpen,setIsCommandPaletteOpen,isNotificationsOpen,setIsNotificationsOpen,isCreateClientOpen,setIsCreateClientOpen,isCreateDealOpen,setIsCreateDealOpen,isCreateTaskOpen,setIsCreateTaskOpen,initialTaskData,openCreateTaskWithPreset,isCreateInvoiceOpen,setIsCreateInvoiceOpen,isCreateRecurringOpen,setIsCreateRecurringOpen,recurringPresetClient,openCreateRecurringForClient,resetToDefaults};
  return <CrmContext.Provider value={value}>{children}</CrmContext.Provider>;
};

export function useCrm(){const ctx=useContext(CrmContext);if(!ctx)throw new Error('useCrm must be used within CrmProvider');return ctx;}
