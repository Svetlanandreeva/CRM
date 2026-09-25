import React, { useState, useEffect } from 'react';
import { CheckSquare, Sparkles, X } from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { TaskPriority, TaskType } from '../../types/crm';

export const CreateTaskModal: React.FC = () => {
  const { isCreateTaskOpen, setIsCreateTaskOpen, addTask, initialTaskData, clients, currentManager, theme } = useCrm();
  const isLight = theme === 'light';

  const [title, setTitle] = useState('');
  const [clientId, setClientId] = useState(clients[0]?.id || '');
  const [type, setType] = useState<TaskType>('call');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [deadline, setDeadline] = useState('');
  const [assignedTo, setAssignedTo] = useState(currentManager.name);
  const [fromMessageText, setFromMessageText] = useState('');

  useEffect(() => {
    if (initialTaskData) {
      if (initialTaskData.title) setTitle(initialTaskData.title);
      if (initialTaskData.clientId) setClientId(initialTaskData.clientId);
      if (initialTaskData.type) setType(initialTaskData.type);
      if (initialTaskData.priority) setPriority(initialTaskData.priority);
      if (initialTaskData.fromMessageText) setFromMessageText(initialTaskData.fromMessageText);
      if (initialTaskData.deadline) {
        setDeadline(initialTaskData.deadline.split('T')[0]);
      } else {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        setDeadline(d.toISOString().split('T')[0]);
      }
    } else {
      setTitle('');
      setFromMessageText('');
      const d = new Date();
      d.setDate(d.getDate() + 1);
      setDeadline(d.toISOString().split('T')[0]);
    }
  }, [initialTaskData, isCreateTaskOpen]);

  if (!isCreateTaskOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const cl = clients.find(c => c.id === clientId);

    addTask({
      title: title.trim(),
      clientId: cl?.id,
      clientName: cl?.name,
      type,
      priority,
      deadline: deadline || new Date().toISOString(),
      assignedTo,
      fromMessageText: fromMessageText || undefined,
    });

    setIsCreateTaskOpen(false);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className={`rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto border ${
        isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
      }`}>
        <div className={`flex items-center justify-between pb-3 border-b ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
          <h2 className="text-base font-bold flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-emerald-600" />
            <span>Назначить новую задачу</span>
          </h2>
          <button onClick={() => setIsCreateTaskOpen(false)} className="text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {fromMessageText && (
          <div className={`p-3 rounded-xl border text-xs leading-relaxed ${
            isLight ? 'bg-indigo-50/70 border-indigo-200 text-indigo-950' : 'bg-indigo-950/40 border-indigo-800 text-indigo-200'
          }`}>
            <span className="font-bold block mb-1 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              Создано по сообщению клиента:
            </span>
            «{fromMessageText}»
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Что нужно сделать *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Например: Согласовать цвет патины на латуни"
              className={`w-full rounded-xl p-2.5 border font-semibold ${
                isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
              }`}
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Привязать к клиенту</label>
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className={`w-full rounded-xl p-2.5 border font-semibold ${
                isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
              }`}
            >
              <option value="">Без привязки к клиенту</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.name} ({c.company || 'Физлицо'})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Тип задачи</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as TaskType)}
                className={`w-full rounded-xl p-2.5 border font-semibold ${
                  isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
                }`}
              >
                <option value="call">Звонок</option>
                <option value="message">Сообщение / Чат</option>
                <option value="proposal">Подготовка КП / Расчет</option>
                <option value="production">Контроль производства</option>
                <option value="payment">Контроль оплаты</option>
                <option value="meeting">Встреча / Замер</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Приоритет</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className={`w-full rounded-xl p-2.5 border font-semibold ${
                  isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
                }`}
              >
                <option value="urgent">Срочно (🔥)</option>
                <option value="high">Высокий</option>
                <option value="medium">Обычный</option>
                <option value="low">Низкий</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Срок выполнения (дедлайн) *</label>
              <input
                type="date"
                required
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className={`w-full rounded-xl p-2.5 border font-semibold ${
                  isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
                }`}
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Ответственный менеджер</label>
              <input
                type="text"
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                className={`w-full rounded-xl p-2.5 border font-semibold ${
                  isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
                }`}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsCreateTaskOpen(false)}
              className="px-4 py-2 font-bold text-slate-600 hover:text-slate-900"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-xs"
            >
              Поставить задачу
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
