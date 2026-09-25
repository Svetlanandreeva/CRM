import React from 'react';
import { Bell, ChevronRight, X } from 'lucide-react';
import { useCrm } from '../../context/CrmContext';

export const NotificationsDrawer: React.FC = () => {
  const {
    isNotificationsOpen,
    setIsNotificationsOpen,
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    openClientCockpit,
    theme
  } = useCrm();

  const isLight = theme === 'light';

  if (!isNotificationsOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={() => setIsNotificationsOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className={`w-screen max-w-md shadow-2xl flex flex-col border-l ${
          isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-950 border-slate-800 text-white'
        }`}>
          {/* Header */}
          <div className={`p-4 border-b flex items-center justify-between ${
            isLight ? 'border-slate-200 bg-slate-50/50' : 'border-slate-800 bg-slate-950'
          }`}>
            <div className="flex items-center gap-2.5">
              <Bell className="w-5 h-5 text-indigo-600" />
              <h2 className="text-base font-bold">Центр уведомлений Satori</h2>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={markAllNotificationsRead}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-bold"
              >
                Прочитать все
              </button>
              <button
                onClick={() => setIsNotificationsOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {notifications.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  markNotificationRead(item.id);
                  if (item.clientId) {
                    openClientCockpit(item.clientId);
                    setIsNotificationsOpen(false);
                  }
                }}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start justify-between gap-3 shadow-2xs group ${
                  item.read
                    ? (isLight ? 'bg-slate-50/60 border-slate-200 opacity-75' : 'bg-slate-900/60 border-slate-850 opacity-70')
                    : (isLight ? 'bg-indigo-50/50 border-indigo-200 hover:border-indigo-400' : 'bg-indigo-950/20 border-indigo-800')
                }`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className={`mt-1.5 w-2.5 h-2.5 rounded-full shrink-0 ${
                    item.read
                      ? 'bg-slate-300'
                      : item.type === 'recurring_invoice_generated'
                      ? 'bg-purple-500 ring-4 ring-purple-100 dark:ring-purple-900/50'
                      : 'bg-rose-500 ring-4 ring-rose-100 dark:ring-rose-900/50'
                  }`} />
                  <div>
                    <h3 className={`text-xs font-bold leading-snug group-hover:text-indigo-600 transition-colors ${
                      isLight ? 'text-slate-900' : 'text-white'
                    }`}>
                      {item.title}
                    </h3>
                    <p className={`text-xs mt-1 leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                      {item.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
                  <span className={`text-[11px] font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    {new Date(item.timestamp).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
