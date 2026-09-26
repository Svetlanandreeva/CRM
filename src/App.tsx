/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { CrmProvider, useCrm } from './context/CrmContext';
import { Sidebar } from './components/common/Sidebar';

import {
  FigmaDashboardView,
  FigmaDealsView,
  FigmaDocumentsView,
  FigmaEconomicsView,
  FigmaFunnelView,
  FigmaProjectCalcView,
} from './components/figma/FigmaViews';
import { FigmaInboxView } from './components/figma/FigmaInboxView';
import { FigmaEvaView } from './components/figma/FigmaEvaView';
import { FigmaCalendarView } from './components/figma/FigmaCalendarView';
import { MobileCrmView } from './components/figma/FigmaMobileViews';

// Existing operational screens kept behind the redesigned shell.
import { SettingsView } from './components/settings/SettingsView';
import { ClientsListView } from './components/clients/ClientsListView';
import { ClientCockpitView } from './components/clients/ClientCockpitView';
import { ProductionOrdersView } from './components/production/ProductionOrdersView';
import { TasksView } from './components/tasks/TasksView';
import { CatalogView } from './components/catalog/CatalogView';
import { ContractorsView } from './components/contractors/ContractorsView';
import { AnalyticsView } from './components/analytics/AnalyticsView';
import { IntegrationsView } from './components/integrations/IntegrationsView';

// Modals
import { CreateClientModal } from './components/modals/CreateClientModal';
import { CreateDealModal } from './components/modals/CreateDealModal';
import { CreateTaskModal } from './components/modals/CreateTaskModal';
import { CreateInvoiceModal } from './components/modals/CreateInvoiceModal';
import { CreateRecurringScheduleModal } from './components/documents/CreateRecurringScheduleModal';
import { CommandPalette } from './components/modals/CommandPalette';
import { NotificationsDrawer } from './components/modals/NotificationsDrawer';

const GlobalOverlays: React.FC = () => <>
  <CreateClientModal />
  <CreateDealModal />
  <CreateTaskModal />
  <CreateInvoiceModal />
  <CreateRecurringScheduleModal />
  <CommandPalette />
  <NotificationsDrawer />
</>;

const MainContent: React.FC = () => {
  const { currentTab } = useCrm();
  const tab = String(currentTab);

  return (
    <main className="relative flex min-w-0 flex-1 flex-col overflow-hidden bg-[#f7f5f2]">
      <div className="relative min-h-0 flex-1 overflow-auto">
        {tab === 'dashboard' && <FigmaDashboardView />}
        {tab === 'deals' && <FigmaDealsView />}
        {tab === 'pipeline' && <FigmaFunnelView />}
        {tab === 'inbox' && <FigmaInboxView />}
        {tab === 'finance' && <FigmaEconomicsView />}
        {tab === 'project_calc' && <FigmaProjectCalcView />}
        {tab === 'documents' && <FigmaDocumentsView />}
        {tab === 'ai_manager' && <FigmaEvaView />}
        {tab === 'calendar' && <FigmaCalendarView />}
        {tab === 'settings' && <SettingsView />}

        {/* Operational views remain available if opened from links/actions. */}
        {tab === 'clients' && <ClientsListView />}
        {tab === 'client_cockpit' && <ClientCockpitView />}
        {tab === 'production' && <ProductionOrdersView />}
        {tab === 'tasks' && <TasksView />}
        {tab === 'catalog' && <CatalogView />}
        {tab === 'contractors' && <ContractorsView />}
        {tab === 'analytics' && <AnalyticsView />}
        {tab === 'integrations' && <IntegrationsView />}
      </div>
      <GlobalOverlays />
    </main>
  );
};

const useIsMobile = () => {
  const [mobile, setMobile] = useState(() => typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches);
  useEffect(() => {
    const query = window.matchMedia('(max-width: 767px)');
    const update = () => setMobile(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  return mobile;
};

const MainApp: React.FC = () => {
  const mobile = useIsMobile();
  if (mobile) return <div className="min-h-[100dvh] w-screen overflow-x-hidden bg-[#f7f5f1] font-sans text-[#181a20]"><MobileCrmView /><GlobalOverlays /></div>;
  return <div className="flex h-screen w-screen overflow-hidden bg-[#f7f5f2] font-sans text-[#1f1d1c]"><Sidebar /><MainContent /></div>;
};

export default function App() {
  return (
    <CrmProvider>
      <MainApp />
    </CrmProvider>
  );
}
