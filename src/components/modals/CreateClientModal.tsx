import React, { useState } from 'react';
import { X, UserPlus } from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { ClientStatus, LeadSource } from '../../types/crm';

export const CreateClientModal: React.FC = () => {
  const { isCreateClientOpen, setIsCreateClientOpen, addClient, openClientCockpit, currentManager, theme } = useCrm();
  const isLight = theme === 'light';

  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [phone, setPhone] = useState('+7 ');
  const [email, setEmail] = useState('');
  const [telegram, setTelegram] = useState('');
  const [status, setStatus] = useState<ClientStatus>('Лид');
  const [source, setSource] = useState<LeadSource>('Сайт / SEO');
  const [notes, setNotes] = useState('');
  const [tags, setTags] = useState('Новый лид');

  if (!isCreateClientOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newClient = addClient({
      name: name.trim(),
      company: company.trim(),
      role: role.trim(),
      phone: phone.trim(),
      email: email.trim(),
      telegram: telegram.trim(),
      status,
      source,
      assignedManager: currentManager.name,
      notes: notes.trim(),
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
    });

    setIsCreateClientOpen(false);
    openClientCockpit(newClient.id);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className={`rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto border ${
        isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
      }`}>
        <div className={`flex items-center justify-between pb-3 border-b ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
          <h2 className="text-base font-bold flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-indigo-600" />
            <span>Добавить нового клиента в Satori</span>
          </h2>
          <button
            onClick={() => setIsCreateClientOpen(false)}
            className="text-slate-400 hover:text-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">ФИО / Контактное лицо *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Например: Анастасия Лебедева"
              className={`w-full rounded-xl p-2.5 border font-semibold ${
                isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
              }`}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Компания / Студия</label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Студия дизайна Lebedeva"
                className={`w-full rounded-xl p-2.5 border font-semibold ${
                  isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
                }`}
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Должность</label>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="Главный архитектор"
                className={`w-full rounded-xl p-2.5 border font-semibold ${
                  isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
                }`}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Телефон *</label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={`w-full rounded-xl p-2.5 border font-mono font-semibold ${
                  isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
                }`}
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="design@studio.ru"
                className={`w-full rounded-xl p-2.5 border font-semibold ${
                  isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
                }`}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Telegram (@никнейм)</label>
              <input
                type="text"
                value={telegram}
                onChange={(e) => setTelegram(e.target.value)}
                placeholder="@anastasia_arch"
                className={`w-full rounded-xl p-2.5 border font-mono font-semibold ${
                  isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
                }`}
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Статус клиента</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ClientStatus)}
                className={`w-full rounded-xl p-2.5 border font-semibold ${
                  isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
                }`}
              >
                <option value="Лид">Лид</option>
                <option value="Потенциальный">Потенциальный</option>
                <option value="Активный">Активный</option>
                <option value="VIP">VIP</option>
              </select>
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Источник обращения</label>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value as LeadSource)}
              className={`w-full rounded-xl p-2.5 border font-semibold ${
                isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
              }`}
            >
              <option value="Архитекторы и дизайнеры">Архитекторы и дизайнеры</option>
              <option value="Сайт / SEO">Сайт / SEO</option>
              <option value="Telegram">Telegram</option>
              <option value="WhatsApp">WhatsApp</option>
              <option value="Рекомендация / Сарафан">Рекомендация / Сарафан</option>
              <option value="Выставка / Мероприятие">Выставка / Мероприятие</option>
            </select>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Особенности / заметка</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Специфика проекта, пожелания по материалам, дедлайны..."
              rows={2}
              className={`w-full rounded-xl p-2.5 border resize-none ${
                isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
              }`}
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsCreateClientOpen(false)}
              className="px-4 py-2 font-bold text-slate-600 hover:text-slate-900"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-xs"
            >
              Создать и открыть карточку
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
