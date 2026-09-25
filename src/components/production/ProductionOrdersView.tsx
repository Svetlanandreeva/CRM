import React, { useState } from 'react';
import {
  Factory,
  Plus,
  Calendar,
  X,
  ArrowUpRight
} from 'lucide-react';
import { useCrm } from '../../context/CrmContext';
import { ProductionStatus } from '../../types/crm';

export const ProductionOrdersView: React.FC = () => {
  const { productionOrders, updateProductionStatus, openClientCockpit, addProductionOrder, contractors, clients, theme } = useCrm();

  const isLight = theme === 'light';

  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [selectedContractorFilter, setSelectedContractorFilter] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New order form state
  const [newTitle, setNewTitle] = useState('');
  const [newClientId, setNewClientId] = useState(clients[0]?.id || '');
  const [newQuantity, setNewQuantity] = useState(1);
  const [newMaterials, setNewMaterials] = useState('');
  const [newPrimeCost, setNewPrimeCost] = useState('');
  const [newSalePrice, setNewSalePrice] = useState('');
  const [newContractor, setNewContractor] = useState(contractors[0]?.name || 'Собственный цех Satori');
  const [newDeadline, setNewDeadline] = useState('');

  const statusLabels: Record<ProductionStatus, { label: string; dotColor: string; bgClass: string }> = {
    queued: { label: 'В очереди', dotColor: 'bg-slate-400', bgClass: 'text-slate-700 bg-slate-100' },
    materials: { label: 'Закупка материалов', dotColor: 'bg-amber-500', bgClass: 'text-amber-800 bg-amber-50' },
    cutting: { label: 'Раскрой / ЧПУ', dotColor: 'bg-indigo-500', bgClass: 'text-indigo-800 bg-indigo-50' },
    assembly: { label: 'Сборка', dotColor: 'bg-blue-500', bgClass: 'text-blue-800 bg-blue-50' },
    finishing: { label: 'Покраска', dotColor: 'bg-purple-500', bgClass: 'text-purple-800 bg-purple-50' },
    quality_control: { label: 'Контроль ОТК', dotColor: 'bg-yellow-500', bgClass: 'text-yellow-800 bg-yellow-50' },
    packaged: { label: 'Упаковано', dotColor: 'bg-teal-500', bgClass: 'text-teal-800 bg-teal-50' },
    shipped: { label: 'Отгружено', dotColor: 'bg-emerald-500', bgClass: 'text-emerald-800 bg-emerald-50' },
  };

  const filteredOrders = productionOrders.filter((order) => {
    const matchesStatus = selectedStatusFilter === 'all' || order.status === selectedStatusFilter;
    const matchesContractor = selectedContractorFilter === 'all' || order.contractorName === selectedContractorFilter;
    return matchesStatus && matchesContractor;
  });

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(val);
  };

  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const cl = clients.find(c => c.id === newClientId) || clients[0];
    addProductionOrder({
      clientId: cl.id,
      clientName: cl.name,
      title: newTitle,
      quantity: Number(newQuantity),
      materials: newMaterials.split(',').map(m => m.trim()),
      primeCost: Number(newPrimeCost) || 0,
      salePrice: Number(newSalePrice) || 0,
      status: 'queued',
      readyDeadline: newDeadline || '2026-10-30',
      contractorName: newContractor,
      packagingStatus: 'Не упаковано',
      deliveryService: 'Собственный курьер',
    });
    setIsAddModalOpen(false);
    setNewTitle('');
    setNewMaterials('');
    setNewPrimeCost('');
    setNewSalePrice('');
  };

  return (
    <div className={`flex-1 flex flex-col min-h-0 overflow-hidden ${
      isLight ? 'bg-slate-50 text-slate-900' : 'bg-slate-950 text-slate-100'
    }`}>
      {/* Calm Header */}
      <div className={`px-6 py-4 border-b flex items-center justify-between shrink-0 ${
        isLight ? 'bg-white border-slate-200/80' : 'bg-slate-900 border-slate-800/80'
      }`}>
        <div>
          <h1 className="text-base font-semibold tracking-tight">
            Производство ({productionOrders.length})
          </h1>
          <p className="text-xs text-slate-500 font-normal mt-0.5">
            Контроль этапов изготовления, материалов и сроков сдачи
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors shadow-2xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Новый заказ</span>
        </button>
      </div>

      {/* Filter Row */}
      <div className={`px-6 py-2.5 border-b flex items-center gap-3 text-xs shrink-0 ${
        isLight ? 'bg-white/50 border-slate-200/60' : 'bg-slate-900/50 border-slate-800/60'
      }`}>
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-medium">Статус:</span>
          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className={`border rounded-md px-2.5 py-1 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
              isLight ? 'bg-white text-slate-800 border-slate-200' : 'bg-slate-800 text-white border-slate-700'
            }`}
          >
            <option value="all">Все этапы</option>
            <option value="queued">В очереди</option>
            <option value="materials">Закупка материалов</option>
            <option value="cutting">Раскрой / ЧПУ</option>
            <option value="assembly">Сборка</option>
            <option value="finishing">Покраска / Отделка</option>
            <option value="quality_control">Контроль ОТК</option>
            <option value="packaged">Упаковано</option>
            <option value="shipped">Отгружено</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-medium">Цех:</span>
          <select
            value={selectedContractorFilter}
            onChange={(e) => setSelectedContractorFilter(e.target.value)}
            className={`border rounded-md px-2.5 py-1 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
              isLight ? 'bg-white text-slate-800 border-slate-200' : 'bg-slate-800 text-white border-slate-700'
            }`}
          >
            <option value="all">Все исполнители</option>
            {contractors.map(c => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
            <option value="Собственный сборочный цех Satori">Собственный цех Satori</option>
          </select>
        </div>
      </div>

      {/* Clean Orders List / Table */}
      <div className="flex-1 overflow-y-auto p-6">
        {filteredOrders.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-slate-400 text-xs font-normal">
            Нет производственных заказов по заданным фильтрам
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-separate border-spacing-y-2">
              <thead>
                <tr className="text-slate-500 dark:text-slate-400">
                  <th className="py-1 px-4 font-semibold text-xs">Изделие / Заказ</th>
                  <th className="py-1 px-4 font-semibold text-xs">Заказчик</th>
                  <th className="py-1 px-4 font-semibold text-xs">Материалы</th>
                  <th className="py-1 px-4 font-semibold text-xs">Цех</th>
                  <th className="py-1 px-4 font-semibold text-xs">Срок</th>
                  <th className="py-1 px-4 font-semibold text-xs text-right">Сумма</th>
                  <th className="py-1 px-4 font-semibold text-xs">Статус</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => {
                  const statusInfo = statusLabels[order.status];
                  return (
                    <tr
                      key={order.id}
                      className={`transition-colors ${
                        isLight 
                          ? 'bg-white hover:bg-slate-100/70 text-slate-800' 
                          : 'bg-slate-900/60 hover:bg-slate-800/60 text-slate-200'
                      }`}
                    >
                      <td className="py-2 px-4 rounded-l-lg font-normal">
                        <div className="font-normal text-slate-900 dark:text-white">{order.title}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono tabular-nums mt-0.5">{order.quantity} шт.</div>
                      </td>

                      <td className="py-2 px-4 font-normal">
                        <button
                          onClick={() => openClientCockpit(order.clientId)}
                          className="font-normal text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 group text-left"
                        >
                          <span>{order.clientName}</span>
                          <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      </td>

                      <td className="py-2 px-4 font-normal">
                        <span className="text-slate-500 dark:text-slate-400 font-normal truncate block max-w-xs">{order.materials.join(', ')}</span>
                      </td>

                      <td className="py-2 px-4 font-normal">
                        <span className="text-slate-600 dark:text-slate-300 font-normal">{order.contractorName}</span>
                      </td>

                      <td className="py-2 px-4 font-normal">
                        <div className="flex items-center gap-1 font-mono tabular-nums text-slate-600 dark:text-slate-400 text-xs font-normal">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>{order.readyDeadline}</span>
                        </div>
                      </td>

                      <td className="py-2 px-4 text-right font-mono tabular-nums font-normal text-xs text-slate-800 dark:text-slate-200">
                        {formatCurrency(order.salePrice)}
                      </td>

                      <td className="py-2 px-4 rounded-r-lg font-normal">
                        <select
                          value={order.status}
                          onChange={(e) => updateProductionStatus(order.id, e.target.value as ProductionStatus)}
                          className={`text-xs px-2.5 py-1 rounded-md font-normal border border-transparent focus:border-slate-300 focus:outline-none transition-colors ${statusInfo.bgClass}`}
                        >
                          <option value="queued">В очереди</option>
                          <option value="materials">Закупка материалов</option>
                          <option value="cutting">Раскрой / ЧПУ</option>
                          <option value="assembly">Сборка</option>
                          <option value="finishing">Покраска / Отделка</option>
                          <option value="quality_control">Контроль ОТК</option>
                          <option value="packaged">Упаковано</option>
                          <option value="shipped">Отгружено</option>
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className={`w-full max-w-lg rounded-xl shadow-xl overflow-hidden border ${
            isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800 text-white'
          }`}>
            <div className={`p-4 border-b flex items-center justify-between ${
              isLight ? 'border-slate-100 bg-slate-50/50' : 'border-slate-800 bg-slate-850'
            }`}>
              <h3 className="font-bold text-sm">Новый заказ на производство</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateOrder} className="p-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Наименование изделия *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="напр., Обеденный стол из дуба 2200х900"
                  className={`w-full border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                    isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Заказчик</label>
                  <select
                    value={newClientId}
                    onChange={(e) => setNewClientId(e.target.value)}
                    className={`w-full border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                      isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
                    }`}
                  >
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Количество (шт.)</label>
                  <input
                    type="number"
                    min={1}
                    value={newQuantity}
                    onChange={(e) => setNewQuantity(Number(e.target.value))}
                    className={`w-full border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                      isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Материалы (через запятую)</label>
                <input
                  type="text"
                  value={newMaterials}
                  onChange={(e) => setNewMaterials(e.target.value)}
                  placeholder="Массив дуба, масло Rubio, сталь 4мм"
                  className={`w-full border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                    isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Себестоимость (₽)</label>
                  <input
                    type="number"
                    value={newPrimeCost}
                    onChange={(e) => setNewPrimeCost(e.target.value)}
                    placeholder="120000"
                    className={`w-full border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                      isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
                    }`}
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Цена клиенту (₽)</label>
                  <input
                    type="number"
                    value={newSalePrice}
                    onChange={(e) => setNewSalePrice(e.target.value)}
                    placeholder="250000"
                    className={`w-full border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                      isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Исполнитель / Цех</label>
                  <select
                    value={newContractor}
                    onChange={(e) => setNewContractor(e.target.value)}
                    className={`w-full border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                      isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
                    }`}
                  >
                    <option value="Собственный сборочный цех Satori">Собственный цех Satori</option>
                    {contractors.map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">Дедлайн готовности</label>
                  <input
                    type="date"
                    value={newDeadline}
                    onChange={(e) => setNewDeadline(e.target.value)}
                    className={`w-full border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                      isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
                    }`}
                  />
                </div>
              </div>

              <div className="pt-3 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 font-medium"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs"
                >
                  Создать заказ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
