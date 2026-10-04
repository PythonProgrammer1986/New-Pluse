import React, { useState } from 'react';
import { ActionItem, Pillar } from '../types';
import { 
  Search, Shield, Leaf, CheckCircle, TrendingUp, Coins, HardHat, 
  Plus, Edit, Trash2, Calendar, User, Filter, AlertTriangle, CheckSquare,
  Bell, Send, Check, AlarmClock
} from 'lucide-react';

interface ActionPlanTableProps {
  actionItems: ActionItem[];
  onUpdateActionItem: (id: string, updates: Partial<ActionItem>) => void;
  onDeleteActionItem: (id: string) => void;
  onAddActionItem: (action: Omit<ActionItem, 'id'>) => void;
  userRole: string;
}

export default function ActionPlanTable({
  actionItems,
  onUpdateActionItem,
  onDeleteActionItem,
  onAddActionItem,
  userRole,
}: ActionPlanTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'in-progress' | 'resolved'>('all');
  const [pillarFilter, setPillarFilter] = useState<string>('all');
  
  // Custom Action Item Creation form toggles
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newOwner, setNewOwner] = useState('');
  const [newPillar, setNewPillar] = useState<Pillar>('Quality');
  const [newDueDate, setNewDueDate] = useState('');
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [newNotes, setNewNotes] = useState('');

  // Reminders / Ping notification state
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
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `epiroc_pulse_countermeasures_${new Date().toISOString().split('T')[0]}.csv`);
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

    // Reset Form
    setNewTitle('');
    setNewOwner('');
    setNewDueDate('');
    setNewPriority('medium');
    setNewNotes('');
    setShowAddForm(false);
  };

  const handlePingOwner = (action: ActionItem) => {
    setPingAlert(`Reminder dispatched! Sent alert to ${action.owner} regarding pending task: "${action.title}".`);
    setTimeout(() => {
      setPingAlert(null);
    }, 4000);
  };

  const getPillarIcon = (pillar: Pillar) => {
    switch (pillar) {
      case 'Safety': return Shield;
      case 'Sustainability': return Leaf;
      case 'Quality': return CheckCircle;
      case 'Delivery': return TrendingUp;
      case 'Cost': return Coins;
      case 'Capital': return HardHat;
    }
  };

  const getPillarColor = (pillar: Pillar) => {
    switch (pillar) {
      case 'Safety': return 'text-rose-600 bg-rose-50 dark:text-rose-400 dark:bg-rose-950/20 border-rose-200';
      case 'Sustainability': return 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/20 border-emerald-200';
      case 'Quality': return 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-950/20 border-blue-200';
      case 'Delivery': return 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/20 border-amber-200';
      case 'Cost': return 'text-indigo-600 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-950/20 border-indigo-200';
      case 'Capital': return 'text-slate-600 bg-slate-50 dark:text-slate-400 dark:bg-slate-800 border-slate-200';
    }
  };

  // Filter lists
  const filteredActions = actionItems.filter((action) => {
    const matchesSearch = 
      action.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      action.owner.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (action.notes && action.notes.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || action.status === statusFilter;
    const matchesPillar = pillarFilter === 'all' || action.pillar === pillarFilter;

    return matchesSearch && matchesStatus && matchesPillar;
  });

  // Calculate Overdue & Pending action reminders
  const pendingActions = actionItems.filter(a => a.status !== 'resolved');
  
  // Overdue if target date is in the past compared to current date '2026-10-02'
  const overdueActions = pendingActions.filter(a => {
    try {
      const due = new Date(a.dueDate);
      const curr = new Date('2026-10-02');
      return due < curr;
    } catch {
      return false;
    }
  });

  return (
    <div className="space-y-6">
      
      {/* Transient Ping Notification Alert */}
      {pingAlert && (
        <div className="bg-indigo-600 dark:bg-indigo-500 text-white px-5 py-3 rounded-xl shadow-lg animate-fade-in flex items-center justify-between gap-3 z-50">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 animate-bounce text-indigo-200" />
            <span className="text-xs font-semibold">{pingAlert}</span>
          </div>
          <span className="text-[10px] bg-indigo-700 px-2 py-0.5 rounded font-mono font-bold">SENT</span>
        </div>
      )}

      {/* Main Actions Register */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm flex flex-col h-[580px]">
        {/* Table Header Section */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-850/40 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-white text-sm flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-indigo-500" />
                Master Team Countermeasure Register
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">
                Active plan to address daily, weekly and monthly operational deviations.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {pendingActions.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowReminders(!showReminders)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                    showReminders 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-750 dark:bg-indigo-950/40 dark:text-indigo-300'
                  }`}
                  title="Toggle pending reminders"
                >
                  <Bell className="w-3.5 h-3.5" />
                  <span>Reminders ({pendingActions.length})</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleExportCSV}
                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                title="Download spreadsheet report"
              >
                <span>Export CSV</span>
              </button>

              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Plus className="w-4 h-4" /> Log Custom Action
              </button>
            </div>
          </div>

          {/* Integrated Collapsible Reminders Drawer */}
          {showReminders && pendingActions.length > 0 && (
            <div className="p-3 bg-indigo-50/40 dark:bg-indigo-950/10 border border-indigo-100/50 dark:border-indigo-950/50 rounded-xl space-y-3 animate-fade-in">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-widest font-mono">
                  Pending Huddle Reminders ({overdueActions.length} overdue)
                </span>
                <span className="text-[10px] text-slate-400 italic">Dispatched via team console huddle logs</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                {pendingActions.slice(0, 3).map((action) => {
                  const due = new Date(action.dueDate);
                  const curr = new Date('2026-10-02');
                  const isOverdue = due < curr;
                  return (
                    <div 
                      key={action.id} 
                      className={`p-2.5 rounded-lg border flex flex-col justify-between h-[105px] shadow-sm transition-all bg-white dark:bg-slate-900 ${
                        isOverdue 
                          ? 'border-rose-200 dark:border-rose-950' 
                          : 'border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center justify-between">
                          <span className={`text-[8px] font-bold font-mono px-1 py-0.5 rounded ${
                            action.priority === 'high' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950' : 'bg-slate-100 text-slate-650'
                          }`}>
                            {action.priority} priority
                          </span>
                          <span className="text-[9px] font-mono text-slate-400">Due: {action.dueDate}</span>
                        </div>
                        <h4 className="text-[11px] font-bold text-slate-800 dark:text-slate-200 mt-1 truncate" title={action.title}>
                          {action.title}
                        </h4>
                        <span className="text-[9px] text-slate-400 block mt-0.5 font-mono">Owner: {action.owner}</span>
                      </div>

                      <div className="flex items-center justify-between mt-1 pt-1.5 border-t border-slate-100 dark:border-slate-850">
                        <span className="text-[8px] font-bold text-indigo-650 flex items-center gap-1 uppercase tracking-wider">
                          {isOverdue ? '⚠️ OVERDUE' : '⌛ PENDING'}
                        </span>
                        <button
                          onClick={() => handlePingOwner(action)}
                          className="px-2 py-0.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[9px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
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

          {/* Filters and Search Bar */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            {/* Search */}
            <div className="relative w-full sm:flex-1">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by action, owner, or notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-xs pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Pillar Selector */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <select
                value={pillarFilter}
                onChange={(e) => setPillarFilter(e.target.value)}
                className="w-full sm:w-40 text-xs px-2.5 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="all">All Lean Pillars</option>
                <option value="Safety">Safety</option>
                <option value="Sustainability">Sustainability</option>
                <option value="Quality">Quality</option>
                <option value="Delivery">Delivery</option>
                <option value="Cost">Cost</option>
                <option value="Capital">Capital</option>
              </select>
            </div>
          </div>

          {/* Status Filters */}
          <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-800 pb-1">
            {(['all', 'open', 'in-progress', 'resolved'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-t-lg transition-colors capitalize border-b-2 cursor-pointer ${
                  statusFilter === status 
                    ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400 font-bold' 
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {status === 'all' ? 'All Countermeasures' : status.replace('-', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Add Custom Action Form Overlay */}
        {showAddForm && (
          <form onSubmit={handleCreateAction} className="bg-slate-50 dark:bg-slate-850 p-4 border-b border-slate-200 dark:border-slate-800 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[10px] text-slate-400 font-semibold uppercase">Action Description</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Description of the countermeasure action"
                  className="w-full text-xs px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 font-semibold uppercase">Assignee (Owner)</label>
                <input
                  type="text"
                  required
                  value={newOwner}
                  onChange={(e) => setNewOwner(e.target.value)}
                  placeholder="e.g. Dave Miller"
                  className="w-full text-xs px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 font-semibold uppercase">Lean Pillar</label>
                <select
                  value={newPillar}
                  onChange={(e) => setNewPillar(e.target.value as Pillar)}
                  className="w-full text-xs px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-900 dark:text-white"
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
                <label className="block text-[10px] text-slate-400 font-semibold uppercase">Target Completion Date</label>
                <input
                  type="date"
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-900 dark:text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 font-semibold uppercase">Priority Level</label>
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value as any)}
                  className="w-full text-xs px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-900 dark:text-white"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[10px] text-slate-400 font-semibold uppercase">Action/Root Cause Notes</label>
                <input
                  type="text"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Sourcing parameters, SOP updates, etc."
                  className="w-full text-xs px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-900 dark:text-white"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1.5">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-md"
              >
                Log Countermeasure
              </button>
            </div>
          </form>
        )}

        {/* Spreadsheet Workspace */}
        <div className="flex-1 overflow-auto">
          <table className="w-full border-collapse text-left text-xs table-fixed">
            <thead className="bg-slate-50 dark:bg-slate-850/60 text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100 dark:border-slate-800 sticky top-0 z-10">
              <tr>
                <th className="py-2.5 px-3 w-[140px]">Pillar</th>
                <th className="py-2.5 px-3 w-[350px]">Action Item Details</th>
                <th className="py-2.5 px-3 w-[150px]">Owner</th>
                <th className="py-2.5 px-3 w-[130px]">Target Date</th>
                <th className="py-2.5 px-3 w-[100px]">Priority</th>
                <th className="py-2.5 px-3 w-[130px]">Status</th>
                <th className="py-2.5 px-3 w-[50px]"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {/* SPREADSHEET QUICK-ADD ROW */}
              <tr className="bg-amber-500/10 dark:bg-amber-400/5 border-b-2 border-indigo-200 dark:border-indigo-950/60">
                <td className="py-2 px-3">
                  <select
                    value={newPillar}
                    onChange={(e) => setNewPillar(e.target.value as Pillar)}
                    className="w-full text-xs font-bold font-mono px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white"
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
                    <input
                      type="text"
                      placeholder="Type new action description here..."
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && newTitle && newOwner) {
                          handleCreateAction(e);
                        }
                      }}
                      className="w-full text-xs font-bold px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#FFC20E]"
                    />
                    <input
                      type="text"
                      placeholder="Add notes / root cause context..."
                      value={newNotes}
                      onChange={(e) => setNewNotes(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && newTitle && newOwner) {
                          handleCreateAction(e);
                        }
                      }}
                      className="w-full text-[10px] px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 focus:outline-none"
                    />
                  </div>
                </td>
                <td className="py-2 px-3">
                  <input
                    type="text"
                    placeholder="Owner name..."
                    value={newOwner}
                    onChange={(e) => setNewOwner(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newTitle && newOwner) {
                        handleCreateAction(e);
                      }
                    }}
                    className="w-full text-xs font-semibold px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none"
                  />
                </td>
                <td className="py-2 px-3">
                  <input
                    type="date"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full text-xs font-mono px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white"
                  />
                </td>
                <td className="py-2 px-3">
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as any)}
                    className="w-full text-xs font-bold font-mono px-1 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white"
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
                    className={`w-full py-1.5 rounded-lg text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1 transition-all ${
                      newTitle && newOwner
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm cursor-pointer'
                        : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-600 cursor-not-allowed'
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5" /> Save Row
                  </button>
                </td>
              </tr>

              {filteredActions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <span className="text-xs font-semibold block">No Actions Match Filters</span>
                    <span className="text-[10px] mt-1 block">Try typing above to add a new row or clear search keywords.</span>
                  </td>
                </tr>
              ) : (
                filteredActions.map((action) => {
                  return (
                    <tr key={action.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      {/* Live Editable Pillar */}
                      <td className="py-2.5 px-3">
                        <select
                          value={action.pillar}
                          onChange={(e) => onUpdateActionItem(action.id, { pillar: e.target.value as any })}
                          className={`w-full text-[10px] font-bold font-mono px-2 py-1 rounded border border-transparent hover:border-slate-200 dark:hover:border-slate-700 focus:border-indigo-500 focus:outline-none cursor-pointer uppercase ${
                            action.pillar === 'Safety' ? 'text-rose-600 bg-rose-50/40 dark:bg-rose-950/20' :
                            action.pillar === 'Sustainability' ? 'text-emerald-600 bg-emerald-50/40 dark:bg-emerald-950/20' :
                            action.pillar === 'Quality' ? 'text-blue-600 bg-blue-50/40 dark:bg-blue-950/20' :
                            action.pillar === 'Delivery' ? 'text-amber-600 bg-amber-50/40 dark:bg-amber-950/20' :
                            action.pillar === 'Cost' ? 'text-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/20' :
                            'text-slate-600 bg-slate-50/40 dark:bg-slate-800/40'
                          }`}
                        >
                          <option value="Safety">⚠️ Safety</option>
                          <option value="Sustainability">🌱 Sustainability</option>
                          <option value="Quality">✅ Quality</option>
                          <option value="Delivery">📈 Delivery</option>
                          <option value="Cost">💰 Cost</option>
                          <option value="Capital">🧱 Capital</option>
                        </select>
                      </td>

                      {/* Live Editable Action Details (Title & Notes) */}
                      <td className="py-2.5 px-3">
                        <div className="flex flex-col gap-1 w-full">
                          <input
                            type="text"
                            value={action.title}
                            onChange={(e) => onUpdateActionItem(action.id, { title: e.target.value })}
                            placeholder="Action description..."
                            className={`w-full text-xs font-bold bg-transparent border-b border-transparent hover:border-slate-200 dark:hover:border-slate-700 focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 rounded px-1 py-0.5 focus:outline-none ${
                              action.status === 'resolved' ? 'line-through text-slate-400 dark:text-slate-500 font-normal' : 'text-slate-850 dark:text-slate-100'
                            }`}
                          />
                          <div className="flex items-center gap-1.5 w-full">
                            <input
                              type="text"
                              value={action.notes || ''}
                              onChange={(e) => onUpdateActionItem(action.id, { notes: e.target.value })}
                              placeholder="Add notes / feedback..."
                              className="w-full text-[10px] text-slate-400 bg-transparent border-b border-transparent hover:border-slate-200 dark:hover:border-slate-700 focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 rounded px-1 py-0.5 focus:outline-none italic"
                            />
                            {action.deviationId && (
                              <span className="shrink-0 text-[8px] font-bold text-rose-500 bg-rose-50 dark:bg-rose-950/40 px-1 py-0.5 rounded uppercase font-mono">
                                Linked
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Live Editable Owner */}
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1 w-full">
                          <User className="w-3 h-3 text-slate-300 shrink-0" />
                          <input
                            type="text"
                            value={action.owner}
                            onChange={(e) => onUpdateActionItem(action.id, { owner: e.target.value })}
                            placeholder="Assignee..."
                            className="w-full text-xs font-bold bg-transparent border-b border-transparent hover:border-slate-200 dark:hover:border-slate-700 focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 rounded px-1 focus:outline-none text-slate-700 dark:text-slate-250"
                          />
                        </div>
                      </td>

                      {/* Live Editable Due Date */}
                      <td className="py-2.5 px-3">
                        <input
                          type="date"
                          value={action.dueDate}
                          onChange={(e) => onUpdateActionItem(action.id, { dueDate: e.target.value })}
                          className="w-full text-xs font-mono bg-transparent border border-transparent hover:border-slate-200 dark:hover:border-slate-700 focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 rounded px-1 py-0.5 focus:outline-none text-slate-500 dark:text-slate-400"
                        />
                      </td>

                      {/* Live Editable Priority */}
                      <td className="py-2.5 px-3">
                        <select
                          value={action.priority}
                          onChange={(e) => onUpdateActionItem(action.id, { priority: e.target.value as any })}
                          className={`w-full text-[10px] font-bold font-mono px-1.5 py-1 rounded border border-transparent hover:border-slate-200 dark:hover:border-slate-700 focus:border-indigo-500 focus:outline-none cursor-pointer uppercase ${
                            action.priority === 'high' ? 'text-rose-600 bg-rose-50/40' :
                            action.priority === 'medium' ? 'text-amber-600 bg-amber-50/40' :
                            'text-slate-500 bg-slate-50/40'
                          }`}
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </select>
                      </td>

                      {/* Live Editable Status dropdown */}
                      <td className="py-2.5 px-3">
                        <select
                          value={action.status}
                          onChange={(e) => onUpdateActionItem(action.id, { status: e.target.value as any })}
                          className={`w-full text-[10px] font-bold uppercase font-mono px-2 py-1.5 rounded border focus:outline-none cursor-pointer ${
                            action.status === 'resolved' ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/20 dark:border-emerald-900/40 dark:text-emerald-400' :
                            action.status === 'in-progress' ? 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/20 dark:border-[#FFC20E]/40 dark:text-[#FFC20E]' :
                            'bg-slate-50 border-slate-200 text-slate-800 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <option value="open">Open</option>
                          <option value="in-progress">In Progress</option>
                          <option value="resolved">Resolved</option>
                        </select>
                      </td>

                      {/* Delete button */}
                      <td className="py-2.5 px-3 text-center">
                        <button
                          onClick={() => onDeleteActionItem(action.id)}
                          className="p-1 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-slate-450 hover:text-rose-600 dark:hover:text-rose-400 rounded transition-colors cursor-pointer"
                          title="Delete Action"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
