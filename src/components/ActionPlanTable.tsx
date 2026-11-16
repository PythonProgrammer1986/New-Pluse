import React, { useState } from 'react';
import { ActionItem, Pillar } from '../types';
import VoiceInputButton from './VoiceInputButton';
import PhotoDrawingAttachmentModal from './PhotoDrawingAttachmentModal';
import {
  Search, Plus, Trash2, User, Filter, CheckSquare,
  Bell, Send, LayoutGrid, Table as TableIcon, Paperclip
} from 'lucide-react';

interface ActionPlanTableProps {
  actionItems: ActionItem[];
  onUpdateActionItem: (id: string, updates: Partial<ActionItem>) => void;
  onDeleteActionItem: (id: string) => void;
  onAddActionItem: (action: Omit<ActionItem, 'id'>) => void;
  onAddAttachment?: (actionId: string, att: any) => void;
  onDeleteAttachment?: (actionId: string, attId: string) => void;
  userRole: string;
}

export default function ActionPlanTable({
  actionItems,
  onUpdateActionItem,
  onDeleteActionItem,
  onAddActionItem,
  onAddAttachment,
  onDeleteAttachment,
}: ActionPlanTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'in-progress' | 'resolved'>('all');
  const [pillarFilter, setPillarFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  const [attachmentAction, setAttachmentAction] = useState<ActionItem | null>(null);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newOwner, setNewOwner] = useState('');
  const [newPillar, setNewPillar] = useState<Pillar>('Quality');
  const [newDueDate, setNewDueDate] = useState('');
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [newNotes, setNewNotes] = useState('');

  const [pingAlert, setPingAlert] = useState<string | null>(null);
  const [showReminders, setShowReminders] = useState(false);

  const handleExportCSV = () => {
    const headers = ['Pillar', 'Title', 'Owner', 'Due Date', 'Priority', 'Status', 'Notes'];
    const rows = actionItems.map(a => [
      a.pillar,
      `"${a.title.replace(/"/g, '""')}"`,
      `"${a.owner.replace(/"/g, '""')}"`,
      a.dueDate,
      a.priority,
      a.status,
      `"${(a.notes || '').replace(/"/g, '""')}"`
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `epiroc_pulse_countermeasures_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCreateAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newOwner) return;

    onAddActionItem({
      pillar: newPillar,
      title: newTitle,
      owner: newOwner,
      dueDate: newDueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      priority: newPriority,
      status: 'open',
      notes: newNotes
    });

    setNewTitle('');
    setNewOwner('');
    setNewDueDate('');
    setNewPriority('medium');
    setNewNotes('');
    setShowAddForm(false);
  };

  const handlePingOwner = (action: ActionItem) => {
    setPingAlert(`Reminder sent to ${action.owner} for: "${action.title}".`);
    setTimeout(() => {
      setPingAlert(null);
    }, 4000);
  };

  const filteredActions = actionItems.filter((action) => {
    const matchesSearch =
      action.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      action.owner.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (action.notes && action.notes.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || action.status === statusFilter;
    const matchesPillar = pillarFilter === 'all' || action.pillar === pillarFilter;

    return matchesSearch && matchesStatus && matchesPillar;
  });

  const pendingActions = actionItems.filter(a => a.status !== 'resolved');

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const overdueActions = pendingActions.filter(a => {
    try {
      const due = new Date(a.dueDate);
      return due < todayStart;
    } catch {
      return false;
    }
  });

  return (
    <div className="space-y-4">
      {/* Ping Alert Toast */}
      {pingAlert && (
        <div className="bg-[#262A2E] text-white px-5 py-3 rounded-xl shadow-md animate-fade-in flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-[#FFC20E]" />
            <span className="text-xs font-semibold">{pingAlert}</span>
          </div>
          <span className="text-[10px] bg-[#FFC20E] text-[#1F2328] px-2 py-0.5 rounded font-mono font-bold">
            SENT
          </span>
        </div>
      )}

      {/* Main Actions Register */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs flex flex-col min-h-[540px]">
        <div className="px-5 py-4 border-b border-gray-200 bg-[#F7F8F9] flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-[#262A2E] text-sm flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-[#FFC20E]" />
                Master Team Countermeasure Register
              </h3>
              <p className="text-[11px] text-[#6B7280] mt-0.5">
                Track daily, weekly, and monthly action items directly inline or via Kanban drag-and-drop.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1 bg-white border border-gray-200 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                    viewMode === 'table' ? 'bg-[#FFC20E] text-[#1F2328]' : 'text-[#6B7280] hover:text-[#262A2E]'
                  }`}
                >
                  <TableIcon className="w-3.5 h-3.5" />
                  <span>Table</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('kanban')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                    viewMode === 'kanban' ? 'bg-[#FFC20E] text-[#1F2328]' : 'text-[#6B7280] hover:text-[#262A2E]'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Kanban</span>
                </button>
              </div>

              {pendingActions.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowReminders(!showReminders)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors border ${
                    showReminders
                      ? 'bg-[#262A2E] text-white border-[#262A2E]'
                      : 'bg-white hover:bg-gray-50 text-[#3A3F45] border-gray-300'
                  }`}
                >
                  <Bell className="w-3.5 h-3.5 text-[#D97706]" />
                  <span>Reminders ({pendingActions.length})</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleExportCSV}
                className="px-3 py-1.5 bg-white hover:bg-gray-50 text-[#3A3F45] border border-gray-300 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <span>Export CSV</span>
              </button>

              <button
                type="button"
                onClick={() => setShowAddForm(!showAddForm)}
                className="px-3 py-1.5 bg-[#FFC20E] hover:bg-[#E5AE00] text-[#1F2328] rounded-lg text-xs font-extrabold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Plus className="w-4 h-4" /> Log Action
              </button>
            </div>
          </div>

          {/* Collapsible Reminders Drawer */}
          {showReminders && pendingActions.length > 0 && (
            <div className="p-3 bg-white border border-gray-200 rounded-xl space-y-3 animate-fade-in">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-[#262A2E] uppercase tracking-widest font-mono">
                  Pending Reminders ({overdueActions.length} overdue)
                </span>
                <span className="text-[10px] text-[#6B7280]">Quick-ping owners for follow-up</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                {pendingActions.slice(0, 3).map((action) => {
                  const due = new Date(action.dueDate);
                  const isOverdue = due < todayStart;
                  return (
                    <div
                      key={action.id}
                      className={`p-2.5 rounded-lg border flex flex-col justify-between min-h-[100px] bg-[#F7F8F9] ${
                        isOverdue ? 'border-rose-300' : 'border-gray-200'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-[9px] font-bold font-mono px-1.5 py-0.5 rounded uppercase ${
                              action.priority === 'high'
                                ? 'bg-rose-100 text-rose-700'
                                : 'bg-gray-200 text-[#3A3F45]'
                            }`}
                          >
                            {action.priority}
                          </span>
                          <span className="text-[9px] font-mono text-[#6B7280]">Due: {action.dueDate}</span>
                        </div>
                        <h4 className="text-[11px] font-bold text-[#262A2E] mt-1 truncate" title={action.title}>
                          {action.title}
                        </h4>
                        <span className="text-[9px] text-[#6B7280] block mt-0.5 font-mono">
                          Owner: {action.owner}
                        </span>
                      </div>

                      <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-gray-200">
                        <span
                          className={`text-[9px] font-bold uppercase tracking-wider ${
                            isOverdue ? 'text-rose-600' : 'text-[#D97706]'
                          }`}
                        >
                          {isOverdue ? 'Overdue' : 'Pending'}
                        </span>
                        <button
                          type="button"
                          onClick={() => handlePingOwner(action)}
                          className="px-2 py-0.5 bg-[#FFC20E] hover:bg-[#E5AE00] text-[#1F2328] rounded text-[9px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Send className="w-2.5 h-2.5" />
                          <span>Ping {action.owner.split(' ')[0]}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative w-full sm:flex-1">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-[#6B7280]" />
              <input
                type="text"
                placeholder="Search by action, owner, or notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-xs pl-9 pr-3 py-2 border border-gray-300 bg-white rounded-lg text-[#262A2E] focus:outline-none focus:ring-2 focus:ring-[#FFC20E]"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-3.5 h-3.5 text-[#6B7280] shrink-0" />
              <select
                value={pillarFilter}
                onChange={(e) => setPillarFilter(e.target.value)}
                className="w-full sm:w-40 text-xs px-2.5 py-2 border border-gray-300 bg-white rounded-lg text-[#262A2E] focus:outline-none focus:ring-2 focus:ring-[#FFC20E]"
              >
                <option value="all">All Pillars</option>
                <option value="Safety">Safety</option>
                <option value="Sustainability">Sustainability</option>
                <option value="Quality">Quality</option>
                <option value="Delivery">Delivery</option>
                <option value="Cost">Cost</option>
                <option value="Capital">Capital</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-1 border-b border-gray-200 pb-0.5">
            {(['all', 'open', 'in-progress', 'resolved'] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-t-lg transition-colors capitalize border-b-2 cursor-pointer ${
                  statusFilter === status
                    ? 'border-[#FFC20E] text-[#262A2E] font-bold'
                    : 'border-transparent text-[#6B7280] hover:text-[#262A2E]'
                }`}
              >
                {status === 'all' ? 'All Actions' : status.replace('-', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Add Form */}
        {showAddForm && (
          <form onSubmit={handleCreateAction} className="bg-[#FFFBEB] p-4 border-b border-[#FFC20E]/40 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[10px] text-[#4B5563] font-semibold uppercase mb-1">
                  Action Description
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Description of the countermeasure"
                  className="w-full text-xs px-2.5 py-1.5 border border-gray-300 bg-white rounded-md focus:outline-none focus:ring-2 focus:ring-[#FFC20E] text-[#262A2E]"
                />
              </div>
              <div>
                <label className="block text-[10px] text-[#4B5563] font-semibold uppercase mb-1">
                  Owner
                </label>
                <input
                  type="text"
                  required
                  value={newOwner}
                  onChange={(e) => setNewOwner(e.target.value)}
                  placeholder="e.g. Dave Miller"
                  className="w-full text-xs px-2.5 py-1.5 border border-gray-300 bg-white rounded-md focus:outline-none focus:ring-2 focus:ring-[#FFC20E] text-[#262A2E]"
                />
              </div>
              <div>
                <label className="block text-[10px] text-[#4B5563] font-semibold uppercase mb-1">
                  Pillar
                </label>
                <select
                  value={newPillar}
                  onChange={(e) => setNewPillar(e.target.value as Pillar)}
                  className="w-full text-xs px-2.5 py-1.5 border border-gray-300 bg-white rounded-md focus:outline-none focus:ring-2 focus:ring-[#FFC20E] text-[#262A2E]"
                >
                  <option value="Safety">Safety</option>
                  <option value="Sustainability">Sustainability</option>
                  <option value="Quality">Quality</option>
                  <option value="Delivery">Delivery</option>
                  <option value="Cost">Cost</option>
                  <option value="Capital">Capital</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] text-[#4B5563] font-semibold uppercase mb-1">
                  Target Date
                </label>
                <input
                  type="date"
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 border border-gray-300 bg-white rounded-md focus:outline-none focus:ring-2 focus:ring-[#FFC20E] text-[#262A2E] font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] text-[#4B5563] font-semibold uppercase mb-1">
                  Priority
                </label>
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value as any)}
                  className="w-full text-xs px-2.5 py-1.5 border border-gray-300 bg-white rounded-md focus:outline-none focus:ring-2 focus:ring-[#FFC20E] text-[#262A2E]"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[10px] text-[#4B5563] font-semibold uppercase mb-1">
                  Notes
                </label>
                <input
                  type="text"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="SOP updates, root cause links..."
                  className="w-full text-xs px-2.5 py-1.5 border border-gray-300 bg-white rounded-md focus:outline-none focus:ring-2 focus:ring-[#FFC20E] text-[#262A2E]"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1.5">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1.5 text-xs text-[#4B5563] hover:bg-white rounded-md font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1.5 bg-[#FFC20E] hover:bg-[#E5AE00] text-[#1F2328] text-xs font-extrabold rounded-md cursor-pointer"
              >
                Save Action
              </button>
            </div>
          </form>
        )}

        {/* Workspace */}
        {viewMode === 'kanban' ? (
          <div className="flex-1 overflow-x-auto p-4 bg-[#F7F8F9]">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 min-w-[720px] h-full">
              {(['open', 'in-progress', 'resolved'] as const).map((colStatus) => {
                const colItems = filteredActions.filter((a) => a.status === colStatus);
                return (
                  <div
                    key={colStatus}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const id = e.dataTransfer.getData('text/plain');
                      if (id) onUpdateActionItem(id, { status: colStatus });
                    }}
                    className="bg-white border border-gray-200 rounded-xl p-3.5 flex flex-col h-full shadow-xs"
                  >
                    <div className="flex items-center justify-between pb-2.5 border-b border-gray-200 mb-2.5">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${
                            colStatus === 'open'
                              ? 'bg-rose-500'
                              : colStatus === 'in-progress'
                              ? 'bg-[#FFC20E]'
                              : 'bg-emerald-500'
                          }`}
                        />
                        <span className="text-xs font-extrabold uppercase tracking-wider font-mono text-[#262A2E]">
                          {colStatus === 'open'
                            ? 'Open'
                            : colStatus === 'in-progress'
                            ? 'In Progress'
                            : 'Resolved'}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F3F4F6] text-[#4B5563] font-mono">
                        {colItems.length}
                      </span>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-2.5">
                      {colItems.map((action) => {
                        const hasAttachments = action.attachments && action.attachments.length > 0;
                        return (
                          <div
                            key={action.id}
                            draggable
                            onDragStart={(e) => e.dataTransfer.setData('text/plain', action.id)}
                            className="p-3 bg-[#F7F8F9] border border-gray-200 rounded-xl hover:border-[#FFC20E] cursor-grab active:cursor-grabbing transition-colors space-y-2"
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase font-mono bg-[#3A3F45] text-white">
                                {action.pillar}
                              </span>
                              <span
                                className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                                  action.priority === 'high'
                                    ? 'bg-rose-100 text-rose-700'
                                    : 'bg-gray-200 text-[#3A3F45]'
                                }`}
                              >
                                {action.priority}
                              </span>
                            </div>

                            <h5
                              className={`text-xs font-bold leading-snug ${
                                action.status === 'resolved'
                                  ? 'line-through text-[#9CA3AF]'
                                  : 'text-[#262A2E]'
                              }`}
                            >
                              {action.title}
                            </h5>

                            {action.notes && (
                              <p className="text-[10px] text-[#6B7280] line-clamp-2">{action.notes}</p>
                            )}

                            <div className="pt-2 border-t border-gray-200 flex items-center justify-between text-[10px] text-[#6B7280] font-mono">
                              <span className="truncate max-w-[90px]">{action.owner}</span>
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setAttachmentAction(action)}
                                  title="Attach photo or drawing"
                                  className={`p-1 rounded hover:bg-gray-200 cursor-pointer flex items-center gap-0.5 ${
                                    hasAttachments ? 'text-[#D97706] font-bold' : 'text-[#6B7280]'
                                  }`}
                                >
                                  <Paperclip className="w-3 h-3" />
                                  {hasAttachments && <span>{action.attachments?.length}</span>}
                                </button>
                                <span>{action.dueDate.slice(5)}</span>
                                <button
                                  type="button"
                                  onClick={() => onDeleteActionItem(action.id)}
                                  className="hover:text-rose-600 p-0.5 cursor-pointer"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {colItems.length === 0 && (
                        <div className="h-28 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center text-[#9CA3AF] text-[10px] font-mono">
                          Drag actions here
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-auto">
            <table className="w-full border-collapse text-left text-xs min-w-[820px]">
              <thead className="bg-[#F7F8F9] text-[#4B5563] font-bold uppercase tracking-wider text-[10px] border-b border-gray-200 sticky top-0 z-10">
                <tr>
                  <th className="py-2.5 px-3 w-[130px]">Pillar</th>
                  <th className="py-2.5 px-3">Action Item Details</th>
                  <th className="py-2.5 px-3 w-[140px]">Owner</th>
                  <th className="py-2.5 px-3 w-[125px]">Target Date</th>
                  <th className="py-2.5 px-3 w-[100px]">Priority</th>
                  <th className="py-2.5 px-3 w-[125px]">Status</th>
                  <th className="py-2.5 px-3 w-[80px] text-center">Tools</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {/* Inline Quick-Add Row */}
                <tr className="bg-[#FFFBEB] border-b border-[#FFC20E]/50">
                  <td className="py-2 px-3">
                    <select
                      value={newPillar}
                      onChange={(e) => setNewPillar(e.target.value as Pillar)}
                      className="w-full text-xs font-bold font-mono px-2 py-1 rounded border border-gray-300 bg-white text-[#262A2E]"
                    >
                      <option value="Safety">Safety</option>
                      <option value="Sustainability">Sustainability</option>
                      <option value="Quality">Quality</option>
                      <option value="Delivery">Delivery</option>
                      <option value="Cost">Cost</option>
                      <option value="Capital">Capital</option>
                    </select>
                  </td>
                  <td className="py-2 px-3">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          placeholder="Quick add new action..."
                          value={newTitle}
                          onChange={(e) => setNewTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && newTitle && newOwner) {
                              handleCreateAction(e);
                            }
                          }}
                          className="w-full text-xs font-semibold px-2 py-1 rounded border border-gray-300 bg-white text-[#262A2E] focus:outline-none focus:ring-2 focus:ring-[#FFC20E]"
                        />
                        <VoiceInputButton
                          onTranscript={(txt) => setNewTitle((prev) => (prev ? `${prev} ${txt}` : txt))}
                        />
                      </div>
                      <input
                        type="text"
                        placeholder="Notes or context..."
                        value={newNotes}
                        onChange={(e) => setNewNotes(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && newTitle && newOwner) {
                            handleCreateAction(e);
                          }
                        }}
                        className="w-full text-[10px] px-2 py-0.5 rounded border border-gray-300 bg-white text-[#4B5563] focus:outline-none"
                      />
                    </div>
                  </td>
                  <td className="py-2 px-3">
                    <input
                      type="text"
                      placeholder="Owner..."
                      value={newOwner}
                      onChange={(e) => setNewOwner(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && newTitle && newOwner) {
                          handleCreateAction(e);
                        }
                      }}
                      className="w-full text-xs font-semibold px-2 py-1 rounded border border-gray-300 bg-white text-[#262A2E] focus:outline-none focus:ring-2 focus:ring-[#FFC20E]"
                    />
                  </td>
                  <td className="py-2 px-3">
                    <input
                      type="date"
                      value={newDueDate}
                      onChange={(e) => setNewDueDate(e.target.value)}
                      className="w-full text-xs font-mono px-2 py-1 rounded border border-gray-300 bg-white text-[#262A2E]"
                    />
                  </td>
                  <td className="py-2 px-3">
                    <select
                      value={newPriority}
                      onChange={(e) => setNewPriority(e.target.value as any)}
                      className="w-full text-xs font-bold font-mono px-1.5 py-1 rounded border border-gray-300 bg-white text-[#262A2E]"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </td>
                  <td className="py-2 px-3" colSpan={2}>
                    <button
                      type="button"
                      onClick={handleCreateAction}
                      disabled={!newTitle || !newOwner}
                      className={`w-full py-1.5 rounded-lg text-xs font-extrabold uppercase tracking-wider flex items-center justify-center gap-1 transition-colors ${
                        newTitle && newOwner
                          ? 'bg-[#FFC20E] hover:bg-[#E5AE00] text-[#1F2328] cursor-pointer'
                          : 'bg-gray-200 text-[#9CA3AF] cursor-not-allowed'
                      }`}
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Row
                    </button>
                  </td>
                </tr>

                {filteredActions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-[#6B7280]">
                      <span className="text-xs font-semibold block text-[#262A2E]">
                        No Actions Match Filters
                      </span>
                      <span className="text-[10px] mt-1 block">
                        Type above to add a new action or adjust your filters.
                      </span>
                    </td>
                  </tr>
                ) : (
                  filteredActions.map((action) => {
                    const hasAttachments = action.attachments && action.attachments.length > 0;
                    return (
                      <tr key={action.id} className="hover:bg-[#F7F8F9] transition-colors">
                        <td className="py-2.5 px-3">
                          <select
                            value={action.pillar}
                            onChange={(e) => onUpdateActionItem(action.id, { pillar: e.target.value as any })}
                            className="w-full text-[10px] font-bold font-mono px-2 py-1 rounded border border-gray-200 bg-[#F7F8F9] text-[#262A2E] focus:ring-2 focus:ring-[#FFC20E] focus:outline-none cursor-pointer uppercase"
                          >
                            <option value="Safety">Safety</option>
                            <option value="Sustainability">Sustainability</option>
                            <option value="Quality">Quality</option>
                            <option value="Delivery">Delivery</option>
                            <option value="Cost">Cost</option>
                            <option value="Capital">Capital</option>
                          </select>
                        </td>

                        <td className="py-2.5 px-3">
                          <div className="flex flex-col gap-1 w-full">
                            <input
                              type="text"
                              value={action.title}
                              onChange={(e) => onUpdateActionItem(action.id, { title: e.target.value })}
                              placeholder="Action description..."
                              className={`w-full text-xs font-semibold bg-transparent border-b border-transparent hover:border-gray-300 focus:border-[#FFC20E] focus:bg-white rounded px-1 py-0.5 focus:outline-none ${
                                action.status === 'resolved' ? 'line-through text-[#9CA3AF]' : 'text-[#262A2E]'
                              }`}
                            />
                            <div className="flex items-center gap-1.5 w-full">
                              <input
                                type="text"
                                value={action.notes || ''}
                                onChange={(e) => onUpdateActionItem(action.id, { notes: e.target.value })}
                                placeholder="Add notes..."
                                className="w-full text-[10px] text-[#6B7280] bg-transparent border-b border-transparent hover:border-gray-300 focus:border-[#FFC20E] focus:bg-white rounded px-1 py-0.5 focus:outline-none"
                              />
                              {action.deviationId && (
                                <span className="shrink-0 text-[8px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded uppercase font-mono">
                                  Linked
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-1 w-full">
                            <User className="w-3 text-[#9CA3AF] shrink-0" />
                            <input
                              type="text"
                              value={action.owner}
                              onChange={(e) => onUpdateActionItem(action.id, { owner: e.target.value })}
                              placeholder="Owner..."
                              className="w-full text-xs font-semibold bg-transparent border-b border-transparent hover:border-gray-300 focus:border-[#FFC20E] focus:bg-white rounded px-1 focus:outline-none text-[#3A3F45]"
                            />
                          </div>
                        </td>

                        <td className="py-2.5 px-3">
                          <input
                            type="date"
                            value={action.dueDate}
                            onChange={(e) => onUpdateActionItem(action.id, { dueDate: e.target.value })}
                            className="w-full text-xs font-mono bg-transparent border border-transparent hover:border-gray-300 focus:border-[#FFC20E] focus:bg-white rounded px-1 py-0.5 focus:outline-none text-[#4B5563]"
                          />
                        </td>

                        <td className="py-2.5 px-3">
                          <select
                            value={action.priority}
                            onChange={(e) => onUpdateActionItem(action.id, { priority: e.target.value as any })}
                            className={`w-full text-[10px] font-bold font-mono px-1.5 py-1 rounded border border-transparent hover:border-gray-300 focus:border-[#FFC20E] focus:outline-none cursor-pointer uppercase ${
                              action.priority === 'high'
                                ? 'text-rose-700 bg-rose-50'
                                : action.priority === 'medium'
                                ? 'text-amber-700 bg-amber-50'
                                : 'text-[#4B5563] bg-gray-100'
                            }`}
                          >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                          </select>
                        </td>

                        <td className="py-2.5 px-3">
                          <select
                            value={action.status}
                            onChange={(e) => onUpdateActionItem(action.id, { status: e.target.value as any })}
                            className={`w-full text-[10px] font-bold uppercase font-mono px-2 py-1.5 rounded border focus:outline-none cursor-pointer ${
                              action.status === 'resolved'
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                : action.status === 'in-progress'
                                ? 'bg-[#FFFBEB] border-[#FFC20E] text-[#1F2328]'
                                : 'bg-white border-gray-300 text-[#3A3F45]'
                            }`}
                          >
                            <option value="open">Open</option>
                            <option value="in-progress">In Progress</option>
                            <option value="resolved">Resolved</option>
                          </select>
                        </td>

                        <td className="py-2.5 px-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => setAttachmentAction(action)}
                              title="Attach photo or drawing sketch"
                              className={`p-1 rounded hover:bg-gray-200 cursor-pointer relative ${
                                hasAttachments ? 'text-[#D97706]' : 'text-[#6B7280] hover:text-[#262A2E]'
                              }`}
                            >
                              <Paperclip className="w-3.5 h-3.5" />
                              {hasAttachments && (
                                <span className="absolute -top-1 -right-1 bg-[#FFC20E] text-[#1F2328] font-mono text-[8px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center">
                                  {action.attachments?.length}
                                </span>
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeleteActionItem(action.id)}
                              className="p-1 hover:bg-rose-50 text-[#6B7280] hover:text-rose-600 rounded transition-colors cursor-pointer"
                              title="Delete Action"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {attachmentAction && (
        <PhotoDrawingAttachmentModal
          title={`Action Item: ${attachmentAction.title}`}
          attachments={attachmentAction.attachments || []}
          onAddAttachment={(att) => {
            if (onAddAttachment) {
              onAddAttachment(attachmentAction.id, att);
            } else {
              onUpdateActionItem(attachmentAction.id, {
                attachments: [
                  ...(attachmentAction.attachments || []),
                  { ...att, id: `att-${Date.now()}`, timestamp: new Date().toISOString() }
                ]
              });
            }
          }}
          onDeleteAttachment={(attId) => {
            if (onDeleteAttachment) {
              onDeleteAttachment(attachmentAction.id, attId);
            } else {
              onUpdateActionItem(attachmentAction.id, {
                attachments: (attachmentAction.attachments || []).filter((a) => a.id !== attId)
              });
            }
          }}
          onClose={() => setAttachmentAction(null)}
        />
      )}
    </div>
  );
}
