import React, { createContext, useContext, useState, useEffect } from 'react';
import {
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
  RecurringFrequency,
  ContractReminderSettings,
  InvoiceReminderTriggerLog,
} from '../types/crm';
import {
  INITIAL_CLIENTS,
  INITIAL_DEALS,
  INITIAL_CHAT_MESSAGES,
  INITIAL_TASKS,
  INITIAL_PRODUCTION_ORDERS,
  INITIAL_DOCUMENTS,
  INITIAL_PAYMENTS,
  INITIAL_CATALOG,
  INITIAL_CONTRACTORS,
  INITIAL_NOTIFICATIONS,
  QUICK_REPLY_TEMPLATES,
  MANAGERS,
  DEFAULT_COMPANY_SETTINGS,
  DEFAULT_RECURRING_SCHEDULER_SETTINGS,
  DEFAULT_CONTRACT_REMINDER_SETTINGS,
  INITIAL_RECURRING_SCHEDULES,
  INITIAL_RECURRING_LOGS,
} from '../data/mockData';

export type NavigationTab = 
  | 'dashboard'
  | 'clients'
  | 'client_cockpit'
  | 'deals'
  | 'production'
  | 'documents'
  | 'tasks'
  | 'finance'
  | 'catalog'
  | 'contractors'
  | 'analytics'
  | 'calendar'
  | 'settings';

export type ThemeMode = 'light' | 'dark';

interface CrmContextType {
  currentTab: NavigationTab;
  setCurrentTab: (tab: NavigationTab) => void;
  selectedClientId: string;
  setSelectedClientId: (id: string) => void;
  selectedDealId: string | null;
  setSelectedDealId: (id: string | null) => void;
  openClientCockpit: (clientId: string) => void;

  // Theme
  theme: ThemeMode;
  setTheme: (t: ThemeMode) => void;
  toggleTheme: () => void;

  // Active Manager
  currentManager: Manager;
  setCurrentManager: (m: Manager) => void;
  managers: Manager[];

  // Entities
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

  // Actions
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

  sendMessage: (
    clientId: string,
    content: string,
    channel: CommunicationChannel,
    direction?: 'inbound' | 'outbound' | 'internal',
    attachments?: { name: string; size: string; type: string }[]
  ) => void;

  updateProductionStatus: (id: string, status: ProductionStatus) => void;
  addProductionOrder: (order: Omit<ProductionOrder, 'id'>) => ProductionOrder;

  addDocument: (doc: Omit<DocumentRecord, 'id' | 'createdAt'>) => DocumentRecord;
  updateDocumentStatus: (id: string, status: DocumentStatus) => void;
  addDocumentHistoryEvent: (docId: string, event: Omit<DocumentHistoryEvent, 'id' | 'timestamp'>) => void;
  deleteDocument: (id: string) => void;
  bulkDeleteDocuments: (ids: string[]) => void;
  bulkUpdateDocumentsStatus: (ids: string[], status: DocumentStatus) => void;

  addPayment: (payment: Omit<PaymentRecord, 'id' | 'date'>) => PaymentRecord;

  // Company Settings & Requisites
  companySettings: CompanySettings;
  updateCompanySettings: (updates: Partial<CompanySettings>) => void;

  // Quick Reply Templates
  addQuickReplyTemplate: (template: Omit<QuickReplyTemplate, 'id'>) => QuickReplyTemplate;
  deleteQuickReplyTemplate: (id: string) => void;
  updateQuickReplyTemplate: (id: string, updates: Partial<QuickReplyTemplate>) => void;

  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;

  // Recurring Invoices & Automated Scheduler
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

  // Contract Reminders & Automated Triggers
  contractReminderSettings: ContractReminderSettings;
  updateContractReminderSettings: (updates: Partial<ContractReminderSettings>) => void;
  invoiceReminderLogs: InvoiceReminderTriggerLog[];
  runInvoiceReminderTriggers: (forceCheckAll?: boolean) => {
    triggeredApproaching: number;
    triggeredOverdue: number;
    logs: InvoiceReminderTriggerLog[];
  };
  sendSingleInvoiceReminderTrigger: (
    documentId: string,
    triggerType: 'approaching_due' | 'overdue',
    customChannel?: CommunicationChannel
  ) => { success: boolean; log?: InvoiceReminderTriggerLog; error?: string };

  // Modals & Panels
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

const CrmContext = createContext<CrmContextType | undefined>(undefined);

export const CrmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTab, setCurrentTab] = useState<NavigationTab>('dashboard');
  const [selectedClientId, setSelectedClientId] = useState<string>('c1');
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);

  // Default to clean, modern, crisp high-readability 'light' theme (can toggle anytime to dark)
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('satori_crm_theme');
    return (saved === 'dark' || saved === 'light') ? saved : 'light';
  });

  const toggleTheme = () => {
    setTheme(prev => {
      const next = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('satori_crm_theme', next);
      return next;
    });
  };

  useEffect(() => {
    localStorage.setItem('satori_crm_theme', theme);
  }, [theme]);

  const [currentManager, setCurrentManager] = useState<Manager>(MANAGERS[0]);

  // Modals
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isCreateClientOpen, setIsCreateClientOpen] = useState(false);
  const [isCreateDealOpen, setIsCreateDealOpen] = useState(false);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [initialTaskData, setInitialTaskData] = useState<Partial<Task> | null>(null);
  const [isCreateInvoiceOpen, setIsCreateInvoiceOpen] = useState(false);

  // Stored states with local storage
  const [clients, setClients] = useState<Client[]>(() => {
    const saved = localStorage.getItem('satori_crm_clients');
    return saved ? JSON.parse(saved) : INITIAL_CLIENTS;
  });

  const [deals, setDeals] = useState<Deal[]>(() => {
    const saved = localStorage.getItem('satori_crm_deals');
    return saved ? JSON.parse(saved) : INITIAL_DEALS;
  });

  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('satori_crm_tasks');
    return saved ? JSON.parse(saved) : INITIAL_TASKS;
  });

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('satori_crm_messages');
    return saved ? JSON.parse(saved) : INITIAL_CHAT_MESSAGES;
  });

  const [productionOrders, setProductionOrders] = useState<ProductionOrder[]>(() => {
    const saved = localStorage.getItem('satori_crm_production');
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTION_ORDERS;
  });

  const [documents, setDocuments] = useState<DocumentRecord[]>(() => {
    const saved = localStorage.getItem('satori_crm_docs');
    return saved ? JSON.parse(saved) : INITIAL_DOCUMENTS;
  });

  const [payments, setPayments] = useState<PaymentRecord[]>(() => {
    const saved = localStorage.getItem('satori_crm_payments');
    return saved ? JSON.parse(saved) : INITIAL_PAYMENTS;
  });

  const [catalog] = useState<CatalogItem[]>(() => {
    const saved = localStorage.getItem('satori_crm_catalog');
    return saved ? JSON.parse(saved) : INITIAL_CATALOG;
  });

  const [contractors] = useState<Contractor[]>(() => {
    const saved = localStorage.getItem('satori_crm_contractors');
    return saved ? JSON.parse(saved) : INITIAL_CONTRACTORS;
  });

  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    const saved = localStorage.getItem('satori_crm_notifications');
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
  });

  const [quickReplyTemplates, setQuickReplyTemplates] = useState<QuickReplyTemplate[]>(() => {
    const saved = localStorage.getItem('satori_crm_templates');
    return saved ? JSON.parse(saved) : QUICK_REPLY_TEMPLATES;
  });

  const [companySettings, setCompanySettings] = useState<CompanySettings>(() => {
    const saved = localStorage.getItem('satori_crm_company_settings');
    return saved ? JSON.parse(saved) : DEFAULT_COMPANY_SETTINGS;
  });

  // Automated Recurring Invoices Schedules & Settings
  const [recurringSchedules, setRecurringSchedules] = useState<RecurringInvoiceSchedule[]>(() => {
    const saved = localStorage.getItem('satori_crm_recurring_schedules');
    return saved ? JSON.parse(saved) : INITIAL_RECURRING_SCHEDULES;
  });

  const [recurringLogs, setRecurringLogs] = useState<RecurringScheduleExecutionLog[]>(() => {
    const saved = localStorage.getItem('satori_crm_recurring_logs');
    return saved ? JSON.parse(saved) : INITIAL_RECURRING_LOGS;
  });

  const [schedulerSettings, setSchedulerSettings] = useState<RecurringSchedulerSettings>(() => {
    const saved = localStorage.getItem('satori_crm_recurring_settings');
    return saved ? JSON.parse(saved) : DEFAULT_RECURRING_SCHEDULER_SETTINGS;
  });

  const [contractReminderSettings, setContractReminderSettings] = useState<ContractReminderSettings>(() => {
    const saved = localStorage.getItem('satori_crm_contract_reminders');
    return saved ? JSON.parse(saved) : DEFAULT_CONTRACT_REMINDER_SETTINGS;
  });

  const [invoiceReminderLogs, setInvoiceReminderLogs] = useState<InvoiceReminderTriggerLog[]>(() => {
    const saved = localStorage.getItem('satori_crm_invoice_reminder_logs');
    return saved ? JSON.parse(saved) : [];
  });

  const [isCreateRecurringOpen, setIsCreateRecurringOpen] = useState(false);
  const [recurringPresetClient, setRecurringPresetClient] = useState<Client | null>(null);

  useEffect(() => {
    localStorage.setItem('satori_crm_templates', JSON.stringify(quickReplyTemplates));
  }, [quickReplyTemplates]);

  useEffect(() => {
    localStorage.setItem('satori_crm_company_settings', JSON.stringify(companySettings));
  }, [companySettings]);

  useEffect(() => {
    localStorage.setItem('satori_crm_recurring_schedules', JSON.stringify(recurringSchedules));
  }, [recurringSchedules]);

  useEffect(() => {
    localStorage.setItem('satori_crm_recurring_logs', JSON.stringify(recurringLogs));
  }, [recurringLogs]);

  useEffect(() => {
    localStorage.setItem('satori_crm_recurring_settings', JSON.stringify(schedulerSettings));
  }, [schedulerSettings]);

  useEffect(() => {
    localStorage.setItem('satori_crm_contract_reminders', JSON.stringify(contractReminderSettings));
  }, [contractReminderSettings]);

  useEffect(() => {
    localStorage.setItem('satori_crm_invoice_reminder_logs', JSON.stringify(invoiceReminderLogs));
  }, [invoiceReminderLogs]);

  const updateCompanySettings = (updates: Partial<CompanySettings>) => {
    setCompanySettings(prev => ({ ...prev, ...updates }));
  };

  const addQuickReplyTemplate = (tmpl: Omit<QuickReplyTemplate, 'id'>) => {
    const newTmpl: QuickReplyTemplate = {
      ...tmpl,
      id: `qr_${Date.now()}`
    };
    setQuickReplyTemplates(prev => [newTmpl, ...prev]);
    return newTmpl;
  };

  const deleteQuickReplyTemplate = (id: string) => {
    setQuickReplyTemplates(prev => prev.filter(t => t.id !== id));
  };

  const updateQuickReplyTemplate = (id: string, updates: Partial<QuickReplyTemplate>) => {
    setQuickReplyTemplates(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('satori_crm_clients', JSON.stringify(clients));
  }, [clients]);

  useEffect(() => {
    localStorage.setItem('satori_crm_deals', JSON.stringify(deals));
  }, [deals]);

  useEffect(() => {
    localStorage.setItem('satori_crm_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('satori_crm_messages', JSON.stringify(chatMessages));
  }, [chatMessages]);

  useEffect(() => {
    localStorage.setItem('satori_crm_production', JSON.stringify(productionOrders));
  }, [productionOrders]);

  useEffect(() => {
    localStorage.setItem('satori_crm_docs', JSON.stringify(documents));
  }, [documents]);

  useEffect(() => {
    localStorage.setItem('satori_crm_payments', JSON.stringify(payments));
  }, [payments]);

  useEffect(() => {
    localStorage.setItem('satori_crm_notifications', JSON.stringify(notifications));
  }, [notifications]);

  // Keyboard shortcut for Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const openClientCockpit = (clientId: string) => {
    setSelectedClientId(clientId);
    setCurrentTab('client_cockpit');
  };

  const addClient = (data: Omit<Client, 'id' | 'createdAt' | 'lastContactAt' | 'totalLTV' | 'currentDebt'>): Client => {
    const newClient: Client = {
      ...data,
      id: `c_${Date.now()}`,
      createdAt: new Date().toISOString(),
      lastContactAt: new Date().toISOString(),
      totalLTV: 0,
      currentDebt: 0,
    };
    setClients((prev) => [newClient, ...prev]);
    return newClient;
  };

  const updateClient = (id: string, updates: Partial<Client>) => {
    setClients((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  };

  const deleteClient = (id: string) => {
    setClients((prev) => prev.filter((c) => c.id !== id));
  };

  const bulkDeleteClients = (ids: string[]) => {
    const idSet = new Set(ids);
    setClients((prev) => prev.filter((c) => !idSet.has(c.id)));
  };

  const bulkUpdateClientsStatus = (ids: string[], status: ClientStatus) => {
    const idSet = new Set(ids);
    setClients((prev) =>
      prev.map((c) => (idSet.has(c.id) ? { ...c, status } : c))
    );
  };

  const bulkReassignClients = (ids: string[], manager: string) => {
    const idSet = new Set(ids);
    setClients((prev) =>
      prev.map((c) => (idSet.has(c.id) ? { ...c, assignedManager: manager } : c))
    );
  };

  const addDeal = (dealData: Omit<Deal, 'id' | 'createdAt' | 'updatedAt' | 'margin'>): Deal => {
    const margin = dealData.amount - dealData.primeCost;
    const newDeal: Deal = {
      ...dealData,
      id: `d_${Date.now()}`,
      margin,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setDeals((prev) => [newDeal, ...prev]);
    return newDeal;
  };

  const updateDealStage = (id: string, stage: DealStage) => {
    setDeals((prev) =>
      prev.map((d) => (d.id === id ? { ...d, stage, updatedAt: new Date().toISOString() } : d))
    );
  };

  const updateDeal = (id: string, updates: Partial<Deal>) => {
    setDeals((prev) =>
      prev.map((d) => {
        if (d.id === id) {
          const updated = { ...d, ...updates, updatedAt: new Date().toISOString() };
          if (updated.amount !== undefined && updated.primeCost !== undefined) {
            updated.margin = updated.amount - updated.primeCost;
          }
          return updated;
        }
        return d;
      })
    );
  };

  const addTask = (taskData: Omit<Task, 'id' | 'createdAt' | 'completed'>): Task => {
    const newTask: Task = {
      ...taskData,
      id: `t_${Date.now()}`,
      completed: false,
      createdAt: new Date().toISOString(),
    };
    setTasks((prev) => [newTask, ...prev]);
    return newTask;
  };

  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const bulkDeleteTasks = (ids: string[]) => {
    const idSet = new Set(ids);
    setTasks((prev) => prev.filter((t) => !idSet.has(t.id)));
  };

  const bulkUpdateTasksStatus = (ids: string[], completed: boolean) => {
    const idSet = new Set(ids);
    setTasks((prev) =>
      prev.map((t) => (idSet.has(t.id) ? { ...t, completed } : t))
    );
  };

  const bulkReassignTasks = (ids: string[], assignedTo: string) => {
    const idSet = new Set(ids);
    setTasks((prev) =>
      prev.map((t) => (idSet.has(t.id) ? { ...t, assignedTo } : t))
    );
  };

  const sendMessage = (
    clientId: string,
    content: string,
    channel: CommunicationChannel,
    direction: 'inbound' | 'outbound' | 'internal' = 'outbound',
    attachments?: { name: string; size: string; type: string }[]
  ) => {
    const newMsg: ChatMessage = {
      id: `m_${Date.now()}`,
      clientId,
      channel,
      direction,
      senderName: direction === 'outbound' || direction === 'internal' ? currentManager.name : (clients.find(c => c.id === clientId)?.name || 'Клиент'),
      content,
      timestamp: new Date().toISOString(),
      attachments,
      isRead: true,
    };
    setChatMessages((prev) => [...prev, newMsg]);

    // Update client's lastContactAt
    updateClient(clientId, { lastContactAt: new Date().toISOString() });
  };

  const updateProductionStatus = (id: string, status: ProductionStatus) => {
    setProductionOrders((prev) =>
      prev.map((po) => (po.id === id ? { ...po, status } : po))
    );
  };

  const addProductionOrder = (orderData: Omit<ProductionOrder, 'id'>): ProductionOrder => {
    const newOrder: ProductionOrder = {
      ...orderData,
      id: `po_${Date.now()}`,
    };
    setProductionOrders((prev) => [newOrder, ...prev]);
    return newOrder;
  };

  const addDocument = (docData: Omit<DocumentRecord, 'id' | 'createdAt'>): DocumentRecord => {
    const now = new Date().toISOString();
    const initialHistory: DocumentHistoryEvent[] = docData.history || [
      {
        id: `h_gen_${Date.now()}`,
        type: 'generated',
        title: `${docData.type === 'invoice' ? 'Счет' : 'Документ'} сформирован`,
        description: `Сформирован документ ${docData.number} на сумму ${new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(docData.amount)}`,
        timestamp: now,
        actor: currentManager.name,
      }
    ];

    const newDoc: DocumentRecord = {
      ...docData,
      templateId: docData.templateId || companySettings.defaultTemplateId,
      companySnapshot: docData.companySnapshot || companySettings,
      id: `doc_${Date.now()}`,
      createdAt: now,
      history: initialHistory,
    };
    setDocuments((prev) => [newDoc, ...prev]);
    return newDoc;
  };

  const updateDocumentStatus = (id: string, status: DocumentStatus) => {
    setDocuments((prev) =>
      prev.map((d) => {
        if (d.id !== id) return d;
        const now = new Date().toISOString();
        const currentHistory = d.history || [];
        const statusEvent: DocumentHistoryEvent = {
          id: `h_st_${Date.now()}`,
          type: status === 'sent' ? 'sent' : status === 'viewed' ? 'viewed' : status === 'approved' ? 'approved' : status === 'paid' ? 'paid' : 'status_changed',
          title: status === 'sent' ? 'Отправлен клиенту' : status === 'viewed' ? 'Просмотрен клиентом' : status === 'approved' ? 'Согласован' : status === 'paid' ? 'Оплачен' : `Статус изменен: ${status}`,
          description: `Статус документа изменен на «${status}»`,
          timestamp: now,
          actor: currentManager.name,
        };

        const updates: Partial<DocumentRecord> = { status, history: [...currentHistory, statusEvent] };
        if (status === 'sent' && !d.sentAt) updates.sentAt = now;
        if (status === 'viewed' && !d.viewedAt) updates.viewedAt = now;
        if (status === 'paid' && !d.paidAt) updates.paidAt = now;

        return { ...d, ...updates };
      })
    );
  };

  const addDocumentHistoryEvent = (docId: string, eventData: Omit<DocumentHistoryEvent, 'id' | 'timestamp'>) => {
    const newEvent: DocumentHistoryEvent = {
      ...eventData,
      id: `h_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
    };

    setDocuments((prev) =>
      prev.map((doc) => {
        if (doc.id !== docId) return doc;
        const currentHistory = doc.history || [];
        const updates: Partial<DocumentRecord> = {
          history: [...currentHistory, newEvent],
        };
        if (eventData.type === 'sent' && !doc.sentAt) {
          updates.sentAt = newEvent.timestamp;
          if (doc.status === 'draft') updates.status = 'sent';
        }
        if (eventData.type === 'viewed' && !doc.viewedAt) {
          updates.viewedAt = newEvent.timestamp;
          if (doc.status === 'sent' || doc.status === 'draft') updates.status = 'viewed';
        }
        if (eventData.type === 'paid' && !doc.paidAt) {
          updates.paidAt = newEvent.timestamp;
          updates.status = 'paid';
        }
        return { ...doc, ...updates };
      })
    );
  };

  const deleteDocument = (id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  };

  const bulkDeleteDocuments = (ids: string[]) => {
    const idSet = new Set(ids);
    setDocuments((prev) => prev.filter((d) => !idSet.has(d.id)));
  };

  const bulkUpdateDocumentsStatus = (ids: string[], status: DocumentStatus) => {
    const idSet = new Set(ids);
    setDocuments((prev) =>
      prev.map((d) => (idSet.has(d.id) ? { ...d, status } : d))
    );
  };

  const addPayment = (paymentData: Omit<PaymentRecord, 'id' | 'date'>): PaymentRecord => {
    const newPayment: PaymentRecord = {
      ...paymentData,
      id: `p_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
    };
    setPayments((prev) => [newPayment, ...prev]);

    // If inflow payment, adjust client debt
    if (paymentData.direction === 'inflow') {
      const client = clients.find((c) => c.id === paymentData.clientId);
      if (client) {
        const newDebt = Math.max(0, client.currentDebt - paymentData.amount);
        const newLTV = client.totalLTV + paymentData.amount;
        updateClient(client.id, { currentDebt: newDebt, totalLTV: newLTV });
      }
    }
    return newPayment;
  };

  const markNotificationRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const openCreateTaskWithPreset = (preset: Partial<Task>) => {
    setInitialTaskData(preset);
    setIsCreateTaskOpen(true);
  };

  const computeNextDate = (currentNextDate: string, frequency: RecurringFrequency, billingDay: number): string => {
    const d = new Date(currentNextDate);
    if (isNaN(d.getTime())) {
      d.setTime(Date.now());
    }

    if (frequency === 'weekly') {
      d.setDate(d.getDate() + 7);
    } else if (frequency === 'biweekly') {
      d.setDate(d.getDate() + 14);
    } else if (frequency === 'monthly') {
      const targetMonth = d.getMonth() + 1;
      d.setMonth(targetMonth);
      const daysInTargetMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
      d.setDate(Math.min(billingDay, daysInTargetMonth));
    } else if (frequency === 'quarterly') {
      const targetMonth = d.getMonth() + 3;
      d.setMonth(targetMonth);
      const daysInTargetMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
      d.setDate(Math.min(billingDay, daysInTargetMonth));
    } else if (frequency === 'annually') {
      d.setFullYear(d.getFullYear() + 1);
    }

    return d.toISOString().split('T')[0];
  };

  const resolveTitleTemplate = (template: string, contractNumber: string, date: Date): string => {
    const monthNames = [
      'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
      'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
    ];
    const monthStr = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
    const quarterNum = Math.floor(date.getMonth() / 3) + 1;
    const quarterStr = `${quarterNum} кв. ${date.getFullYear()}`;
    const dateStr = date.toLocaleDateString('ru-RU');

    return template
      .replace(/{month}/gi, monthStr)
      .replace(/{quarter}/gi, quarterStr)
      .replace(/{date}/gi, dateStr)
      .replace(/{contract}/gi, contractNumber);
  };

  const updateSchedulerSettings = (updates: Partial<RecurringSchedulerSettings>) => {
    setSchedulerSettings((prev) => ({ ...prev, ...updates }));
  };

  const addRecurringSchedule = (
    scheduleData: Omit<RecurringInvoiceSchedule, 'id' | 'createdAt' | 'totalExecutedCount' | 'totalExecutedAmount'>
  ): RecurringInvoiceSchedule => {
    const newSchedule: RecurringInvoiceSchedule = {
      ...scheduleData,
      id: `rec_sch_${Date.now()}`,
      createdAt: new Date().toISOString(),
      totalExecutedCount: 0,
      totalExecutedAmount: 0,
    };
    setRecurringSchedules((prev) => [newSchedule, ...prev]);
    return newSchedule;
  };

  const updateRecurringSchedule = (id: string, updates: Partial<RecurringInvoiceSchedule>) => {
    setRecurringSchedules((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
  };

  const deleteRecurringSchedule = (id: string) => {
    setRecurringSchedules((prev) => prev.filter((s) => s.id !== id));
  };

  const toggleRecurringScheduleStatus = (id: string) => {
    setRecurringSchedules((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        const nextStatus = s.status === 'active' ? 'paused' : 'active';
        return { ...s, status: nextStatus };
      })
    );
  };

  const openCreateRecurringForClient = (client: Client) => {
    setRecurringPresetClient(client);
    setIsCreateRecurringOpen(true);
  };

  const executeScheduleCore = (
    schedule: RecurringInvoiceSchedule,
    currentCompanySettings: CompanySettings
  ): { doc: DocumentRecord; log: RecurringScheduleExecutionLog; updatedSchedule: RecurringInvoiceSchedule } => {
    const now = new Date();
    const docId = `doc_rec_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const docNumber = `СФ-2026/РЕК-${schedule.totalExecutedCount + 1}`;
    const resolvedTitle = resolveTitleTemplate(schedule.titleTemplate, schedule.contractNumber, now);

    const validUntilDate = new Date();
    validUntilDate.setDate(validUntilDate.getDate() + (schedule.paymentDueDays || 5));

    const recHistory: DocumentHistoryEvent[] = [
      {
        id: `h_rec_gen_${Date.now()}`,
        type: 'generated',
        title: 'Регулярный счет сформирован',
        description: `Автоматически сформирован по контракту ${schedule.contractNumber} (${schedule.contractTitle})`,
        timestamp: now.toISOString(),
        actor: 'Система (Автопланировщик)',
      },
    ];

    if (schedule.autoSendEmail) {
      recHistory.push({
        id: `h_rec_sent_${Date.now()}`,
        type: 'sent',
        title: 'Отправлен клиенту',
        description: `Автоматически отправлен на контактный email клиента (${schedule.clientName})`,
        timestamp: now.toISOString(),
        actor: 'Система (Автопланировщик)',
        channel: 'Email',
      });
    }

    const newDoc: DocumentRecord = {
      id: docId,
      number: docNumber,
      type: schedule.documentType,
      title: resolvedTitle,
      clientId: schedule.clientId,
      clientName: schedule.clientName,
      amount: schedule.amount,
      status: schedule.autoSendEmail ? 'sent' : 'draft',
      createdAt: now.toISOString(),
      sentAt: schedule.autoSendEmail ? now.toISOString() : undefined,
      validUntil: validUntilDate.toISOString().split('T')[0],
      items: schedule.items,
      templateId: schedule.templateId,
      companySnapshot: currentCompanySettings,
      history: recHistory,
      notes: `Автоматически сформирован по контракту ${schedule.contractNumber} (${schedule.contractTitle})`
    };

    const newLog: RecurringScheduleExecutionLog = {
      id: `log_rec_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      scheduleId: schedule.id,
      documentId: docId,
      documentNumber: docNumber,
      executedAt: now.toISOString(),
      amount: schedule.amount,
      clientName: schedule.clientName,
      status: 'success',
      notes: schedule.autoSendEmail
        ? `Счет автоматически сформирован и отправлен клиенту (${schedule.clientName})`
        : `Счет сформирован в статусе «Черновик» для ручной проверки`
    };

    const nextDate = computeNextDate(schedule.nextRunDate, schedule.frequency, schedule.billingDay);
    const updatedSchedule: RecurringInvoiceSchedule = {
      ...schedule,
      lastTriggeredDate: now.toISOString().split('T')[0],
      nextRunDate: nextDate,
      totalExecutedCount: schedule.totalExecutedCount + 1,
      totalExecutedAmount: schedule.totalExecutedAmount + schedule.amount
    };

    return { doc: newDoc, log: newLog, updatedSchedule };
  };

  const triggerRecurringScheduleNow = (scheduleId: string): DocumentRecord | null => {
    const targetSchedule = recurringSchedules.find((s) => s.id === scheduleId);
    if (!targetSchedule) return null;

    const { doc, log, updatedSchedule } = executeScheduleCore(targetSchedule, companySettings);

    setDocuments((prev) => [doc, ...prev]);
    setRecurringLogs((prev) => [log, ...prev]);
    setRecurringSchedules((prev) =>
      prev.map((s) => (s.id === scheduleId ? updatedSchedule : s))
    );

    if (targetSchedule.notifyManager) {
      const newNotification: NotificationItem = {
        id: `notif_rec_${Date.now()}`,
        type: 'recurring_invoice_generated',
        title: `Сформирован счет ${doc.number}`,
        description: `По договору ${targetSchedule.contractNumber} (${targetSchedule.clientName}) на сумму ${new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(doc.amount)}.`,
        timestamp: new Date().toISOString(),
        read: false,
        clientId: targetSchedule.clientId,
      };
      setNotifications((prev) => [newNotification, ...prev]);
    }

    return doc;
  };

  const runAutomatedSchedulerCheck = (): { triggeredCount: number; generatedDocs: DocumentRecord[] } => {
    if (!schedulerSettings.enabled) {
      return { triggeredCount: 0, generatedDocs: [] };
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const generatedDocs: DocumentRecord[] = [];
    const newLogs: RecurringScheduleExecutionLog[] = [];
    const updatedScheduleMap = new Map<string, RecurringInvoiceSchedule>();

    recurringSchedules.forEach((sch) => {
      if (sch.status === 'active' && sch.nextRunDate <= todayStr) {
        const { doc, log, updatedSchedule } = executeScheduleCore(sch, companySettings);
        generatedDocs.push(doc);
        newLogs.push(log);
        updatedScheduleMap.set(sch.id, updatedSchedule);

        if (sch.notifyManager) {
          const newNotif: NotificationItem = {
            id: `notif_rec_${Date.now()}_${sch.id}`,
            type: 'recurring_invoice_generated',
            title: `Автоматически сформирован счет ${doc.number}`,
            description: `Регулярный счет по договору ${sch.contractNumber} (${sch.clientName}) на сумму ${new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(doc.amount)}.`,
            timestamp: new Date().toISOString(),
            read: false,
            clientId: sch.clientId,
          };
          setNotifications((prev) => [newNotif, ...prev]);
        }
      }
    });

    if (generatedDocs.length > 0) {
      setDocuments((prev) => [...generatedDocs, ...prev]);
      setRecurringLogs((prev) => [...newLogs, ...prev]);
      setRecurringSchedules((prev) =>
        prev.map((s) => (updatedScheduleMap.has(s.id) ? updatedScheduleMap.get(s.id)! : s))
      );
    }

    setSchedulerSettings((prev) => ({
      ...prev,
      lastGlobalCheckAt: new Date().toISOString(),
    }));

    // Also run contract reminder automated check
    runInvoiceReminderTriggers(false);

    return { triggeredCount: generatedDocs.length, generatedDocs };
  };

  const updateContractReminderSettings = (updates: Partial<ContractReminderSettings>) => {
    setContractReminderSettings((prev) => ({ ...prev, ...updates }));
  };

  const runInvoiceReminderTriggers = (forceCheckAll: boolean = false): {
    triggeredApproaching: number;
    triggeredOverdue: number;
    logs: InvoiceReminderTriggerLog[];
  } => {
    if (!contractReminderSettings.enabled && !forceCheckAll) {
      return { triggeredApproaching: 0, triggeredOverdue: 0, logs: [] };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];
    const nowIso = new Date().toISOString();

    const newLogs: InvoiceReminderTriggerLog[] = [];
    let triggeredApproaching = 0;
    let triggeredOverdue = 0;

    const newChatMessages: ChatMessage[] = [];
    const newNotifications: NotificationItem[] = [];
    const newTasks: Task[] = [];

    setDocuments((currentDocs) => {
      const updatedDocs = currentDocs.map((doc) => {
        if (doc.type !== 'invoice' || doc.status === 'paid' || !doc.validUntil) {
          return doc;
        }

        const matchingSchedule = recurringSchedules.find(
          (s) => (doc.contractNumber && s.contractNumber === doc.contractNumber) || s.clientId === doc.clientId
        );
        const settings: ContractReminderSettings =
          matchingSchedule?.contractReminderSettings || contractReminderSettings;

        if (!settings.enabled && !forceCheckAll) return doc;

        const dueDate = new Date(doc.validUntil);
        dueDate.setHours(0, 0, 0, 0);
        const diffTime = dueDate.getTime() - today.getTime();
        const daysUntilDue = Math.round(diffTime / (1000 * 60 * 60 * 24));

        const client = clients.find((c) => c.id === doc.clientId);
        if (!client) return doc;

        const contractNum = doc.contractNumber || matchingSchedule?.contractNumber || 'ДОГ-2026/01';
        const rawApproaching = settings.approachingTemplate || DEFAULT_CONTRACT_REMINDER_SETTINGS.approachingTemplate!;
        const rawOverdue = settings.overdueTemplate || DEFAULT_CONTRACT_REMINDER_SETTINGS.overdueTemplate!;

        const availableChannel: CommunicationChannel =
          (settings.channels?.includes('whatsapp') && (client.whatsapp || client.phone) ? 'whatsapp' : undefined) ||
          (settings.channels?.includes('telegram') && client.telegram ? 'telegram' : undefined) ||
          (settings.channels?.includes('email') && client.email ? 'email' : undefined) ||
          (client.whatsapp || client.phone ? 'whatsapp' : client.email ? 'email' : 'note');

        const recipientContact =
          availableChannel === 'email'
            ? client.email
            : availableChannel === 'whatsapp'
            ? (client.whatsapp || client.phone)
            : availableChannel === 'telegram'
            ? (client.telegram || client.phone)
            : client.phone;

        const lastSentDate = doc.lastReminderSentAt ? doc.lastReminderSentAt.split('T')[0] : null;

        // 1. Approaching due date
        const isApproaching =
          (daysUntilDue > 0 && daysUntilDue <= settings.remindDaysBeforeDue) ||
          (daysUntilDue === 0 && settings.sendOnDueDate);

        const alreadySentApproachingToday =
          lastSentDate === todayStr && doc.reminderTriggersSent?.includes('approaching_due');

        if (isApproaching && (!alreadySentApproachingToday || forceCheckAll)) {
          const msgText = rawApproaching
            .replace(/{clientName}/g, client.name)
            .replace(/{contractNumber}/g, contractNum)
            .replace(/{docNumber}/g, doc.number)
            .replace(/{amount}/g, new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(doc.amount))
            .replace(/{dueDate}/g, dueDate.toLocaleDateString('ru-RU'))
            .replace(/{days}/g, Math.max(0, daysUntilDue).toString())
            .replace(/{link}/g, `https://crm.satori.craft/invoices/public/${doc.id}`);

          newChatMessages.push({
            id: `msg_rem_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
            clientId: client.id,
            channel: availableChannel,
            direction: 'outbound',
            senderName: 'Система (Автонапоминание по договору)',
            content: msgText,
            timestamp: nowIso,
            isRead: true,
          });

          const historyEvt: DocumentHistoryEvent = {
            id: `h_rem_${Date.now()}_${Math.random().toString(36).substr(2, 3)}`,
            type: 'reminder_sent',
            title: daysUntilDue === 0 ? 'Авто-триггер: срок оплаты сегодня' : `Авто-триггер: до срока оплаты ${daysUntilDue} дн.`,
            description: `Клиенту отправлено автоматическое напоминание по договору ${contractNum} на ${recipientContact} (${availableChannel}).`,
            timestamp: nowIso,
            actor: 'Система (Автопланировщик по договору)',
            channel: availableChannel === 'email' ? 'Email' : availableChannel === 'whatsapp' ? 'WhatsApp' : 'Telegram',
          };

          newNotifications.push({
            id: `notif_rem_${Date.now()}_${doc.id}`,
            type: 'invoice_approaching_due',
            title: `Напоминание по счету ${doc.number}`,
            description: `Клиенту ${doc.clientName} направлено напоминание о сроке оплаты ${dueDate.toLocaleDateString('ru-RU')} (осталось ${daysUntilDue} дн.) по договору ${contractNum}.`,
            timestamp: nowIso,
            read: false,
            clientId: client.id,
            dealId: doc.dealId,
          });

          newLogs.push({
            id: `log_rem_${Date.now()}_${doc.id}`,
            documentId: doc.id,
            documentNumber: doc.number,
            clientId: client.id,
            clientName: client.name,
            contractNumber: contractNum,
            triggerType: daysUntilDue === 0 ? 'due_today' : 'approaching_due',
            daysOffset: daysUntilDue,
            channel: availableChannel,
            recipientContact,
            triggeredAt: nowIso,
            messageText: msgText,
            status: 'sent',
          });

          triggeredApproaching++;

          const existingTriggers = doc.reminderTriggersSent || [];
          return {
            ...doc,
            lastReminderSentAt: nowIso,
            reminderTriggersSent: Array.from(new Set<('approaching_due' | 'due_today' | 'overdue')>([...existingTriggers, 'approaching_due'])),
            remindersSentCount: (doc.remindersSentCount || 0) + 1,
            history: [...(doc.history || []), historyEvt],
          };
        }

        // 2. Overdue
        const daysOverdue = Math.abs(daysUntilDue);
        const isOverdue = daysUntilDue < 0 && daysOverdue >= settings.overdueGraceDays;
        const alreadySentOverdueToday =
          lastSentDate === todayStr && doc.reminderTriggersSent?.includes('overdue');
        const sentCount = doc.remindersSentCount || 0;

        if (isOverdue && settings.enableOverdueReminders && sentCount < settings.maxOverdueReminders && (!alreadySentOverdueToday || forceCheckAll)) {
          const penaltyAmount = Math.round(doc.amount * (settings.penaltyPercentPerDay / 100) * daysOverdue);
          let msgText = rawOverdue
            .replace(/{clientName}/g, client.name)
            .replace(/{contractNumber}/g, contractNum)
            .replace(/{docNumber}/g, doc.number)
            .replace(/{amount}/g, new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(doc.amount))
            .replace(/{dueDate}/g, dueDate.toLocaleDateString('ru-RU'))
            .replace(/{days}/g, daysOverdue.toString())
            .replace(/{link}/g, `https://crm.satori.craft/invoices/public/${doc.id}`);

          if (penaltyAmount > 0) {
            msgText += ` По условиям договора за ${daysOverdue} дн. просрочки начислена неустойка: ${new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(penaltyAmount)}.`;
          }

          newChatMessages.push({
            id: `msg_ovd_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
            clientId: client.id,
            channel: availableChannel,
            direction: 'outbound',
            senderName: 'Система (Претензионный контроль по договору)',
            content: msgText,
            timestamp: nowIso,
            isRead: true,
          });

          const historyEvt: DocumentHistoryEvent = {
            id: `h_ovd_${Date.now()}_${Math.random().toString(36).substr(2, 3)}`,
            type: 'reminder_sent',
            title: `Авто-триггер: требование об оплате (просрочка ${daysOverdue} дн.)`,
            description: `Клиенту направлено официальное требование об оплате задолженности по договору ${contractNum} на ${recipientContact} (${availableChannel}). ${penaltyAmount > 0 ? `Начислена пеня: ${new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(penaltyAmount)}.` : ''}`,
            timestamp: nowIso,
            actor: 'Система (Автопланировщик по договору)',
            channel: availableChannel === 'email' ? 'Email' : availableChannel === 'whatsapp' ? 'WhatsApp' : 'Telegram',
          };

          newNotifications.push({
            id: `notif_ovd_${Date.now()}_${doc.id}`,
            type: 'overdue_payment',
            title: `Счет ${doc.number} просрочен на ${daysOverdue} дн.!`,
            description: `Клиенту ${doc.clientName} направлено требование об оплате долга по договору ${contractNum}. Задолженность: ${new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(doc.amount)}.`,
            timestamp: nowIso,
            read: false,
            clientId: client.id,
            dealId: doc.dealId,
          });

          if (settings.autoCreateUrgentTask) {
            newTasks.push({
              id: `task_ovd_${Date.now()}_${doc.id}`,
              clientId: client.id,
              clientName: client.name,
              dealId: doc.dealId,
              title: `Срочно: контроль просроченного счета ${doc.number} (${doc.clientName})`,
              type: 'payment',
              priority: 'urgent',
              deadline: todayStr,
              completed: false,
              assignedTo: client.assignedManager || currentManager.name,
              createdAt: nowIso,
            });
          }

          newLogs.push({
            id: `log_ovd_${Date.now()}_${doc.id}`,
            documentId: doc.id,
            documentNumber: doc.number,
            clientId: client.id,
            clientName: client.name,
            contractNumber: contractNum,
            triggerType: 'overdue',
            daysOffset: daysOverdue,
            channel: availableChannel,
            recipientContact,
            triggeredAt: nowIso,
            messageText: msgText,
            status: 'sent',
          });

          triggeredOverdue++;

          const existingTriggers = doc.reminderTriggersSent || [];
          return {
            ...doc,
            lastReminderSentAt: nowIso,
            reminderTriggersSent: Array.from(new Set<('approaching_due' | 'due_today' | 'overdue')>([...existingTriggers, 'overdue'])),
            remindersSentCount: (doc.remindersSentCount || 0) + 1,
            history: [...(doc.history || []), historyEvt],
          };
        }

        return doc;
      });

      return updatedDocs;
    });

    if (newChatMessages.length > 0) {
      setChatMessages((prev) => [...newChatMessages, ...prev]);
    }
    if (newNotifications.length > 0) {
      setNotifications((prev) => [...newNotifications, ...prev]);
    }
    if (newTasks.length > 0) {
      setTasks((prev) => [...newTasks, ...prev]);
    }
    if (newLogs.length > 0) {
      setInvoiceReminderLogs((prev) => [...newLogs, ...prev]);
    }

    return { triggeredApproaching, triggeredOverdue, logs: newLogs };
  };

  const sendSingleInvoiceReminderTrigger = (
    documentId: string,
    triggerType: 'approaching_due' | 'overdue',
    customChannel?: CommunicationChannel
  ): { success: boolean; log?: InvoiceReminderTriggerLog; error?: string } => {
    const doc = documents.find((d) => d.id === documentId);
    if (!doc) return { success: false, error: 'Документ не найден' };

    const client = clients.find((c) => c.id === doc.clientId);
    if (!client) return { success: false, error: 'Клиент не найден' };

    const matchingSchedule = recurringSchedules.find(
      (s) => (doc.contractNumber && s.contractNumber === doc.contractNumber) || s.clientId === doc.clientId
    );
    const settings = matchingSchedule?.contractReminderSettings || contractReminderSettings;
    const contractNum = doc.contractNumber || matchingSchedule?.contractNumber || 'ДОГ-2026/01';

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(doc.validUntil || doc.createdAt);
    dueDate.setHours(0, 0, 0, 0);
    const daysUntilDue = Math.round((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const daysOverdue = Math.max(1, Math.abs(daysUntilDue));

    const channel: CommunicationChannel =
      customChannel ||
      (client.whatsapp || client.phone ? 'whatsapp' : client.email ? 'email' : 'telegram');

    const recipientContact =
      channel === 'email'
        ? client.email
        : channel === 'whatsapp'
        ? (client.whatsapp || client.phone)
        : (client.telegram || client.phone);

    const nowIso = new Date().toISOString();

    let messageText = '';
    let eventTitle = '';
    let eventDesc = '';

    if (triggerType === 'approaching_due') {
      const raw = settings.approachingTemplate || DEFAULT_CONTRACT_REMINDER_SETTINGS.approachingTemplate!;
      messageText = raw
        .replace(/{clientName}/g, client.name)
        .replace(/{contractNumber}/g, contractNum)
        .replace(/{docNumber}/g, doc.number)
        .replace(/{amount}/g, new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(doc.amount))
        .replace(/{dueDate}/g, dueDate.toLocaleDateString('ru-RU'))
        .replace(/{days}/g, Math.max(0, daysUntilDue).toString())
        .replace(/{link}/g, `https://crm.satori.craft/invoices/public/${doc.id}`);

      eventTitle = daysUntilDue === 0 ? 'Авто-триггер: срок оплаты сегодня' : `Авто-триггер: до срока оплаты ${daysUntilDue} дн.`;
      eventDesc = `Клиенту отправлено напоминание по договору ${contractNum} на ${recipientContact} (${channel}).`;
    } else {
      const raw = settings.overdueTemplate || DEFAULT_CONTRACT_REMINDER_SETTINGS.overdueTemplate!;
      const penaltyAmount = Math.round(doc.amount * (settings.penaltyPercentPerDay / 100) * daysOverdue);
      messageText = raw
        .replace(/{clientName}/g, client.name)
        .replace(/{contractNumber}/g, contractNum)
        .replace(/{docNumber}/g, doc.number)
        .replace(/{amount}/g, new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(doc.amount))
        .replace(/{dueDate}/g, dueDate.toLocaleDateString('ru-RU'))
        .replace(/{days}/g, daysOverdue.toString())
        .replace(/{link}/g, `https://crm.satori.craft/invoices/public/${doc.id}`);

      if (penaltyAmount > 0) {
        messageText += ` По условиям договора за ${daysOverdue} дн. просрочки начислена неустойка: ${new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(penaltyAmount)}.`;
      }

      eventTitle = `Авто-триггер: требование об оплате (просрочка ${daysOverdue} дн.)`;
      eventDesc = `Клиенту направлено официальное требование об оплате задолженности по договору ${contractNum} на ${recipientContact} (${channel}).`;
    }

    // Send chat message
    const newMsg: ChatMessage = {
      id: `msg_trig_${Date.now()}`,
      clientId: client.id,
      channel,
      direction: 'outbound',
      senderName: 'Система (Автотриггер по договору)',
      content: messageText,
      timestamp: nowIso,
      isRead: true,
    };
    setChatMessages((prev) => [newMsg, ...prev]);

    // History event
    const historyEvt: DocumentHistoryEvent = {
      id: `h_trig_${Date.now()}`,
      type: 'reminder_sent',
      title: eventTitle,
      description: eventDesc,
      timestamp: nowIso,
      actor: 'Система (Автопланировщик по договору)',
      channel: channel === 'email' ? 'Email' : channel === 'whatsapp' ? 'WhatsApp' : 'Telegram',
    };

    setDocuments((prev) =>
      prev.map((d) => {
        if (d.id !== doc.id) return d;
        const prevTriggers = d.reminderTriggersSent || [];
        return {
          ...d,
          lastReminderSentAt: nowIso,
          reminderTriggersSent: Array.from(new Set<('approaching_due' | 'due_today' | 'overdue')>([...prevTriggers, triggerType])),
          remindersSentCount: (d.remindersSentCount || 0) + 1,
          history: [...(d.history || []), historyEvt],
        };
      })
    );

    const logItem: InvoiceReminderTriggerLog = {
      id: `log_trig_${Date.now()}_${doc.id}`,
      documentId: doc.id,
      documentNumber: doc.number,
      clientId: client.id,
      clientName: client.name,
      contractNumber: contractNum,
      triggerType,
      daysOffset: triggerType === 'overdue' ? daysOverdue : daysUntilDue,
      channel,
      recipientContact,
      triggeredAt: nowIso,
      messageText,
      status: 'sent',
    };
    setInvoiceReminderLogs((prev) => [logItem, ...prev]);

    return { success: true, log: logItem };
  };

  // Background automated scheduler interval
  useEffect(() => {
    if (!schedulerSettings.enabled) return;

    const initialTimer = setTimeout(() => {
      runAutomatedSchedulerCheck();
    }, 2000);

    const intervalTimer = setInterval(() => {
      runAutomatedSchedulerCheck();
    }, 30000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(intervalTimer);
    };
  }, [schedulerSettings.enabled, recurringSchedules.length]);

  const resetToDefaults = () => {
    localStorage.removeItem('satori_crm_clients');
    localStorage.removeItem('satori_crm_deals');
    localStorage.removeItem('satori_crm_tasks');
    localStorage.removeItem('satori_crm_messages');
    localStorage.removeItem('satori_crm_production');
    localStorage.removeItem('satori_crm_docs');
    localStorage.removeItem('satori_crm_payments');
    localStorage.removeItem('satori_crm_notifications');
    localStorage.removeItem('satori_crm_recurring_schedules');
    localStorage.removeItem('satori_crm_recurring_logs');
    localStorage.removeItem('satori_crm_recurring_settings');
    localStorage.removeItem('satori_crm_contract_reminders');
    localStorage.removeItem('satori_crm_invoice_reminder_logs');
    setClients(INITIAL_CLIENTS);
    setDeals(INITIAL_DEALS);
    setTasks(INITIAL_TASKS);
    setChatMessages(INITIAL_CHAT_MESSAGES);
    setProductionOrders(INITIAL_PRODUCTION_ORDERS);
    setDocuments(INITIAL_DOCUMENTS);
    setPayments(INITIAL_PAYMENTS);
    setNotifications(INITIAL_NOTIFICATIONS);
    setRecurringSchedules(INITIAL_RECURRING_SCHEDULES);
    setRecurringLogs(INITIAL_RECURRING_LOGS);
    setSchedulerSettings(DEFAULT_RECURRING_SCHEDULER_SETTINGS);
    setContractReminderSettings(DEFAULT_CONTRACT_REMINDER_SETTINGS);
    setInvoiceReminderLogs([]);
  };

  return (
    <CrmContext.Provider
      value={{
        currentTab,
        setCurrentTab,
        selectedClientId,
        setSelectedClientId,
        selectedDealId,
        setSelectedDealId,
        openClientCockpit,

        theme,
        setTheme,
        toggleTheme,

        currentManager,
        setCurrentManager,
        managers: MANAGERS,

        clients,
        deals,
        tasks,
        chatMessages,
        productionOrders,
        documents,
        payments,
        catalog,
        contractors,
        notifications,
        quickReplyTemplates,

        addClient,
        updateClient,
        deleteClient,
        bulkDeleteClients,
        bulkUpdateClientsStatus,
        bulkReassignClients,

        addDeal,
        updateDealStage,
        updateDeal,

        addTask,
        toggleTask,
        deleteTask,
        bulkDeleteTasks,
        bulkUpdateTasksStatus,
        bulkReassignTasks,

        sendMessage,
        updateProductionStatus,
        addProductionOrder,

        addDocument,
        updateDocumentStatus,
        addDocumentHistoryEvent,
        deleteDocument,
        bulkDeleteDocuments,
        bulkUpdateDocumentsStatus,
        addPayment,
        companySettings,
        updateCompanySettings,
        addQuickReplyTemplate,
        deleteQuickReplyTemplate,
        updateQuickReplyTemplate,
        markNotificationRead,
        markAllNotificationsRead,

        recurringSchedules,
        recurringLogs,
        schedulerSettings,
        updateSchedulerSettings,
        addRecurringSchedule,
        updateRecurringSchedule,
        deleteRecurringSchedule,
        toggleRecurringScheduleStatus,
        triggerRecurringScheduleNow,
        runAutomatedSchedulerCheck,

        contractReminderSettings,
        updateContractReminderSettings,
        invoiceReminderLogs,
        runInvoiceReminderTriggers,
        sendSingleInvoiceReminderTrigger,

        isCommandPaletteOpen,
        setIsCommandPaletteOpen,
        isNotificationsOpen,
        setIsNotificationsOpen,
        isCreateClientOpen,
        setIsCreateClientOpen,
        isCreateDealOpen,
        setIsCreateDealOpen,
        isCreateTaskOpen,
        setIsCreateTaskOpen,
        initialTaskData,
        openCreateTaskWithPreset,
        isCreateInvoiceOpen,
        setIsCreateInvoiceOpen,

        isCreateRecurringOpen,
        setIsCreateRecurringOpen,
        recurringPresetClient,
        openCreateRecurringForClient,

        resetToDefaults,
      }}
    >
      {children}
    </CrmContext.Provider>
  );
};

export const useCrm = () => {
  const context = useContext(CrmContext);
  if (!context) {
    throw new Error('useCrm must be used within a CrmProvider');
  }
  return context;
};
