/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CrmProvider, useCrm } from './context/CrmContext';
import { Sidebar } from './components/common/Sidebar';
import { Header } from './components/common/Header';

// Views
import { DashboardView } from './components/dashboard/DashboardView';
import { ClientCockpitView } from './components/clients/ClientCockpitView';
import { ClientsListView } from './components/clients/ClientsListView';
import { DealsKanbanView } from './components/deals/DealsKanbanView';
import { ProductionOrdersView } from './components/production/ProductionOrdersView';
import { DocumentsView } from './components/documents/DocumentsView';
import { TasksView } from './components/tasks/TasksView';
import { FinanceView } from './components/finance/FinanceView';
import { CatalogView } from './components/catalog/CatalogView';
import { ContractorsView } from './components/contractors/ContractorsView';
import { AnalyticsView } from './components/analytics/AnalyticsView';
import { CalendarView } from './components/calendar/CalendarView';
import { SettingsView } from './components/settings/SettingsView';
import { InboxView } from './components/inbox/InboxView';
import { CallListView } from './components/calls/CallListView';
import { AiManagerView } from './components/assistant/AiManagerView';
import { IntegrationsView } from './components/integrations/IntegrationsView';

// Modals
import { CreateClientModal } from './components/modals/CreateClientModal';
import { CreateDealModal } from './components/modals/CreateDealModal';
import { CreateTaskModal } from './components/modals/CreateTaskModal';
import { CreateInvoiceModal } from './components/modals/CreateInvoiceModal';
import { CreateRecurringScheduleModal } from './components/documents/CreateRecurringScheduleModal';
import { CommandPalette } from './components/modals/CommandPalette';
import { NotificationsDrawer } from './components/modals/NotificationsDrawer';

const MainContent: React.FC = () => {
  const { currentTab } = useCrm();
  const tab = String(currentTab);

  return (
    <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
      <Header />
      <div className="flex-1 flex min-h-0 overflow-hidden relative">
        {tab === 'dashboard' && <DashboardView />}
        {tab === 'client_cockpit' && <ClientCockpitView />}
        {tab === 'clients' && <ClientsListView />}
        {tab === 'deals' && <DealsKanbanView />}
        {tab === 'inbox' && <InboxView />}
        {tab === 'call_list' && <CallListView />}
        {tab === 'ai_manager' && <AiManagerView />}
        {tab === 'production' && <ProductionOrdersView />}
        {tab === 'documents' && <DocumentsView />}
        {tab === 'tasks' && <TasksView />}
        {tab === 'finance' && <FinanceView />}
        {tab === 'catalog' && <CatalogView />}
        {tab === 'contractors' && <ContractorsView />}
        {tab === 'analytics' && <AnalyticsView />}
        {tab === 'calendar' && <CalendarView />}
        {tab === 'integrations' && <IntegrationsView />}
        {tab === 'settings' && <SettingsView />}
      </div>

      <CreateClientModal />
      <CreateDealModal />
      <CreateTaskModal />
      <CreateInvoiceModal />
      <CreateRecurringScheduleModal />
      <CommandPalette />
      <NotificationsDrawer />
    </main>
  );
};

const MainApp: React.FC = () => {
  const { theme } = useCrm();

  return (
    <div className={`flex h-screen w-screen overflow-hidden font-sans transition-colors duration-150 ${
      theme === 'dark'
        ? 'bg-[#121212] text-[#E0E0E0] dark'
        : 'bg-[#F8F7F4] text-[#1A1A1A]'
    }`}>
      <Sidebar />
      <MainContent />
    </div>
  );
};

export default function App() {
  return (
    <CrmProvider>
      <MainApp />
    </CrmProvider>
  );
}
