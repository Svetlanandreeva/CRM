/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { ArrowLeft, Plug } from 'lucide-react';
import { CrmProvider, useCrm } from './context/CrmContext';
import { Sidebar } from './components/common/Sidebar';

import {
  FigmaDealsView,
  FigmaDocumentsView,
  FigmaEconomicsView,
  FigmaFunnelView,
  FigmaProjectCalcView,
} from './components/figma/FigmaViews';
import { LiveDashboardView } from './components/figma/LiveDashboardView';
import { FigmaInboxView } from './components/figma/FigmaInboxView';
import { FigmaEvaView } from './components/figma/FigmaEvaView';
import { FigmaCalendarView } from './components/figma/FigmaCalendarView';
import { MobileCrmView } from './components/figma/FigmaMobileViews';
import { MobileLiveEva, MobileLiveInbox } from './components/figma/MobileLiveChannels';

import { SettingsView } from './components/settings/SettingsView';
import { ClientsListView } from './components/clients/ClientsListView';
import { ClientCockpitView } from './components/clients/ClientCockpitView';
import { ProductionOrdersView } from './components/production/ProductionOrdersView';
import { TasksView } from './components/tasks/TasksView';
import { CatalogView } from './components/catalog/CatalogView';
import { ContractorsView } from './components/contractors/ContractorsView';
import { AnalyticsView } from './components/analytics/AnalyticsView';
import { IntegrationsView } from './components/integrations/IntegrationsView';

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
        {tab === 'dashboard' && <LiveDashboardView />}
        {tab === 'deals' && <FigmaDealsView />}
        {tab === 'pipeline' && <FigmaFunnelView />}
        {tab === 'inbox' && <FigmaInboxView />}
        {tab === 'finance' && <FigmaEconomicsView />}
        {tab === 'project_calc' && <FigmaProjectCalcView />}
        {tab === 'documents' && <FigmaDocumentsView />}
        {tab === 'ai_manager' && <FigmaEvaView />}
        {tab === 'calendar' && <FigmaCalendarView />}
        {tab === 'settings' && <SettingsView />}
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

const MobileApp: React.FC = () => {
  const { currentTab, setCurrentTab } = useCrm();
  if (currentTab === 'inbox') return <><MobileLiveInbox /><GlobalOverlays /></>;
  if (currentTab === 'ai_manager') return <><MobileLiveEva /><GlobalOverlays /></>;
  if (currentTab === 'integrations') return <div className="min-h-[100dvh] w-screen overflow-x-auto bg-[#f7f5f1] font-sans text-[#181a20]">
    <div className="sticky top-0 z-[80] flex h-14 items-center gap-3 border-b border-[#e8e4de] bg-[#f7f5f1]/95 px-4 backdrop-blur">
      <button onClick={()=>setCurrentTab('dashboard')} className="grid h-9 w-9 place-items-center rounded-full bg-white"><ArrowLeft size={17}/></button>
      <b className="text-[16px]">Интеграции</b>
    </div>
    <div className="min-w-[760px]"><IntegrationsView /></div>
    <GlobalOverlays />
  </div>;
  return <div className="relative min-h-[100dvh] w-screen overflow-x-hidden bg-[#f7f5f1] font-sans text-[#181a20]">
    <MobileCrmView />
    <button aria-label="Интеграции" title="Интеграции" onClick={()=>setCurrentTab('integrations')} className="fixed right-[74px] top-[25px] z-[60] grid h-9 w-9 place-items-center rounded-full border border-[#e8e4de] bg-white shadow-sm"><Plug size={15}/></button>
    <GlobalOverlays />
  </div>;
};

const MainApp: React.FC = () => {
  const mobile = useIsMobile();
  if (mobile) return <MobileApp />;
  return <div className="flex h-screen w-screen overflow-hidden bg-[#f7f5f2] font-sans text-[#1f1d1c]"><Sidebar /><MainContent /></div>;
};

export default function App() {
  return <CrmProvider><MainApp /></CrmProvider>;
}
