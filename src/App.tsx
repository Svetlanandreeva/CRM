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

  return (
    <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
      <Header />
      <div className="flex-1 flex min-h-0 overflow-hidden relative">
        {currentTab === 'dashboard' && <DashboardView />}
        {currentTab === 'client_cockpit' && <ClientCockpitView />}
        {currentTab === 'clients' && <ClientsListView />}
        {currentTab === 'deals' && <DealsKanbanView />}
        {currentTab === 'production' && <ProductionOrdersView />}
        {currentTab === 'documents' && <DocumentsView />}
        {currentTab === 'tasks' && <TasksView />}
        {currentTab === 'finance' && <FinanceView />}
        {currentTab === 'catalog' && <CatalogView />}
        {currentTab === 'contractors' && <ContractorsView />}
        {currentTab === 'analytics' && <AnalyticsView />}
        {currentTab === 'calendar' && <CalendarView />}
        {currentTab === 'settings' && <SettingsView />}
      </div>

      {/* Global Modals */}
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
