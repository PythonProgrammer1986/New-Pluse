import React, { useState } from 'react';
import { Employee, TaskTimeBooking, ActionItem } from '../types';
import { 
  Sliders, Plus, Trash2, Calendar, ClipboardList, CheckSquare, 
  Clock, Edit2, Check, X, Copy, CopyPlus, ArrowUpRight, TrendingUp 
} from 'lucide-react';

interface HoursPlannerProps {
  employees: Employee[];
  timeBookings: TaskTimeBooking[];
  actionItems: ActionItem[];
  onAddTimeBooking: (booking: { employeeId: string; taskTitle: string; plannedHours: number; actualHours: number; date: string }) => void;
  onUpdateTimeBooking?: (id: string, updates: Partial<TaskTimeBooking>) => void;
  onDeleteTimeBooking: (id: string) => void;
}

export default function HoursPlanner({
  employees,
  timeBookings,
  actionItems,
  onAddTimeBooking,
  onUpdateTimeBooking,
  onDeleteTimeBooking
}: HoursPlannerProps) {
  const [selectedEmpId, setSelectedEmpId] = useState(employees.length > 0 ? employees[0].id : '');
  const [taskTitle, setTaskTitle] = useState('');
  const [plannedHours, setPlannedHours] = useState('8');
  const [actualHours, setActualHours] = useState('8');
  const [bookingDate, setBookingDate] = useState(new Date().toISOString().split('T')[0]);

  // Handle auto-population from actions register dropdown
  const [selectedActionId, setSelectedActionId] = useState('');

  // Inline editing state for Ledger rows
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editEmpId, setEditEmpId] = useState('');
  const [editTaskTitle, setEditTaskTitle] = useState('');
  const [editPlannedHours, setEditPlannedHours] = useState('8');
  const [editActualHours, setEditActualHours] = useState('8');
  const [editBookingDate, setEditBookingDate] = useState(new Date().toISOString().split('T')[0]);

  const handleActionSelect = (actionId: string) => {
    setSelectedActionId(actionId);
    if (!actionId) return;
    const action = actionItems.find(a => a.id === actionId);
    if (action) {
      setTaskTitle(action.title);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmpId || !taskTitle) {
      alert('Please select an employee and fill in the task title!');
      return;
    }

    onAddTimeBooking({
      employeeId: selectedEmpId,
      taskTitle,
      plannedHours: parseFloat(plannedHours) || 0,
      actualHours: parseFloat(actualHours) || 0,
      date: bookingDate || new Date().toISOString().split('T')[0]
    });

    // Reset Form fields
    setTaskTitle('');
    setSelectedActionId('');
    setPlannedHours('8');
    setActualHours('8');
  };

  // Duplicate / Copy a booking entry
  const handleDuplicateBooking = (book: TaskTimeBooking) => {
    onAddTimeBooking({
      employeeId: book.employeeId,
      taskTitle: `${book.taskTitle} (Copy)`,
      plannedHours: book.plannedHours,
      actualHours: book.actualHours,
      date: book.date
    });

    // Also populate the form so the user can easily tweak and add more
    setSelectedEmpId(book.employeeId);
    setTaskTitle(book.taskTitle);
    setPlannedHours(book.plannedHours.toString());
    setActualHours(book.actualHours.toString());
    setBookingDate(book.date);
  };

  // Copy entry details directly to form without auto-creating
  const handleCopyToForm = (book: TaskTimeBooking) => {
    setSelectedEmpId(book.employeeId);
    setTaskTitle(book.taskTitle);
    setPlannedHours(book.plannedHours.toString());
    setActualHours(book.actualHours.toString());
    setBookingDate(book.date);
  };

  // Start Inline Edit
  const startEdit = (book: TaskTimeBooking) => {
    setEditingId(book.id);
    setEditEmpId(book.employeeId);
    setEditTaskTitle(book.taskTitle);
    setEditPlannedHours(book.plannedHours.toString());
    setEditActualHours(book.actualHours.toString());
    setEditBookingDate(book.date);
  };

  // Save Inline Edit
  const saveEdit = (id: string) => {
    if (onUpdateTimeBooking) {
      onUpdateTimeBooking(id, {
        employeeId: editEmpId,
        taskTitle: editTaskTitle,
        plannedHours: parseFloat(editPlannedHours) || 0,
        actualHours: parseFloat(editActualHours) || 0,
        date: editBookingDate
      });
    }
    setEditingId(null);
  };

  // Sync state if employees list changes (for default selected value)
  React.useEffect(() => {
    if (employees.length > 0 && !selectedEmpId) {
      setSelectedEmpId(employees[0].id);
    }
  }, [employees, selectedEmpId]);

  return (
    <div className="space-y-6">
      
      {/* Informative Header Banner */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#FFC20E]" />
            <h3 className="font-extrabold text-sm uppercase tracking-wider font-mono">
              Task & Time Booking Desk
            </h3>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
            Register and plan operational hours booked against specific tasks. Track actual shift labor versus planned milestones, edit existing logs, or duplicate entries with a single click.
          </p>
        </div>
        <div className="px-3 py-1 bg-[#FFC20E]/10 border border-[#FFC20E]/20 text-[#FFC20E] text-[10px] font-mono font-bold uppercase rounded-md shrink-0">
          Labor Metrics Online
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Book / Plan Task Hours */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#FFC20E]" />
              <h4 className="font-bold text-slate-800 dark:text-white text-xs uppercase tracking-wider">
                Book Task Hours
              </h4>
            </div>
          </div>

          {employees.length === 0 ? (
            <div className="p-4 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 rounded-lg text-xs font-semibold text-center border border-rose-100 dark:border-rose-900 leading-relaxed">
              ⚠️ No employees registered yet! Please add members in the <strong>Resource Master</strong> tab first to enable hours booking.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Select Employee */}
              <div>
                <label className="block text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1">
                  Team Member
                </label>
                <select
                  value={selectedEmpId}
                  onChange={(e) => setSelectedEmpId(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC20E] cursor-pointer font-semibold shadow-sm"
                >
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </select>
              </div>

              {/* Convenience Dropdown: Select Action Item */}
              <div>
                <label className="block text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1">
                  Link with Countermeasure (Optional)
                </label>
                <select
                  value={selectedActionId}
                  onChange={(e) => handleActionSelect(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC20E] cursor-pointer font-medium shadow-sm"
                >
                  <option value="">-- No link (Enter custom task title below) --</option>
                  {actionItems.filter(a => a.status !== 'resolved').map(action => (
                    <option key={action.id} value={action.id}>
                      📌 [{action.pillar}] {action.title.substring(0, 45)}...
                    </option>
                  ))}
                </select>
              </div>

              {/* Task / Work Description */}
              <div>
                <label className="block text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1">
                  Task / Activity Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mechanical assembly line 1 setup"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC20E] font-semibold shadow-sm placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Planned Hours */}
                <div>
                  <label className="block text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1">
                    Planned Hours
                  </label>
                  <input
                    type="number"
                    required
                    min="0.5"
                    max="100"
                    step="0.5"
                    value={plannedHours}
                    onChange={(e) => setPlannedHours(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC20E] font-mono font-semibold shadow-sm"
                  />
                </div>

                {/* Actual Booked Hours */}
                <div>
                  <label className="block text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1">
                    Actual Booked
                  </label>
                  <input
                    type="number"
                    required
                    min="0.5"
                    max="100"
                    step="0.5"
                    value={actualHours}
                    onChange={(e) => setActualHours(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC20E] font-mono font-semibold shadow-sm"
                  />
                </div>
              </div>

              {/* Date */}
              <div>
                <label className="block text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1">
                  Booking Date
                </label>
                <input
                  type="date"
                  required
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC20E] font-mono font-semibold shadow-sm"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-[#FFC20E] hover:bg-[#E5B200] text-slate-950 font-extrabold text-xs rounded-lg shadow-sm flex items-center justify-center gap-1.5 cursor-pointer font-mono"
              >
                <Plus className="w-4 h-4" />
                <span>Book Task Hours</span>
              </button>
            </form>
          )}
        </div>

        {/* Right Column: Time Booking Logs Table */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm flex flex-col h-[600px]">
          <div className="px-4 py-3 bg-slate-950 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-[#FFC20E] shrink-0" />
              <h4 className="font-bold text-xs uppercase tracking-wider font-mono">
                Labor Logbook Ledger
              </h4>
            </div>
            <span className="px-2.5 py-0.5 rounded text-[10px] bg-[#FFC20E] text-slate-900 font-bold font-mono">
              {timeBookings.length} bookings recorded
            </span>
          </div>

          <div className="flex-1 overflow-y-auto">
            {timeBookings.length === 0 ? (
              <div className="p-12 text-center text-slate-400 h-full flex flex-col justify-center items-center">
                <CheckSquare className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-2" />
                <span className="text-xs font-semibold block text-slate-700 dark:text-slate-300">Logbook is Empty</span>
                <span className="text-[10px] mt-1 block">Fill in and submit the booking form on the left.</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800 text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                      <th className="p-3">Date</th>
                      <th className="p-3">Employee</th>
                      <th className="p-3">Task Description</th>
                      <th className="p-3 text-center">Planned</th>
                      <th className="p-3 text-center">Actual</th>
                      <th className="p-3 text-center">Variance</th>
                      <th className="p-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                    {timeBookings.map((book) => {
                      const empName = employees.find(e => e.id === book.employeeId)?.name || 'Unknown Operator';
                      const variance = book.actualHours - book.plannedHours;
                      const varianceColor = variance > 0 
                        ? 'text-rose-500 font-bold' 
                        : variance < 0 
                          ? 'text-emerald-500 font-semibold' 
                          : 'text-slate-400';

                      const isEditing = editingId === book.id;

                      if (isEditing) {
                        return (
                          <tr key={book.id} className="bg-amber-50/40 dark:bg-slate-800/80">
                            <td className="p-2">
                              <input
                                type="date"
                                value={editBookingDate}
                                onChange={(e) => setEditBookingDate(e.target.value)}
                                className="text-xs px-2 py-1 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded font-mono"
                              />
                            </td>
                            <td className="p-2">
                              <select
                                value={editEmpId}
                                onChange={(e) => setEditEmpId(e.target.value)}
                                className="text-xs px-2 py-1 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded font-semibold"
                              >
                                {employees.map(e => (
                                  <option key={e.id} value={e.id}>{e.name}</option>
                                ))}
                              </select>
                            </td>
                            <td className="p-2">
                              <input
                                type="text"
                                value={editTaskTitle}
                                onChange={(e) => setEditTaskTitle(e.target.value)}
                                className="w-full text-xs px-2 py-1 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded font-semibold"
                              />
                            </td>
                            <td className="p-2 text-center">
                              <input
                                type="number"
                                step="0.5"
                                value={editPlannedHours}
                                onChange={(e) => setEditPlannedHours(e.target.value)}
                                className="w-16 text-xs px-1.5 py-1 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded text-center font-mono font-bold"
                              />
                            </td>
                            <td className="p-2 text-center">
                              <input
                                type="number"
                                step="0.5"
                                value={editActualHours}
                                onChange={(e) => setEditActualHours(e.target.value)}
                                className="w-16 text-xs px-1.5 py-1 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded text-center font-mono font-bold"
                              />
                            </td>
                            <td className="p-2 text-center text-slate-400 font-mono text-[10px]">
                              editing
                            </td>
                            <td className="p-2 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => saveEdit(book.id)}
                                  className="p-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded cursor-pointer transition-all"
                                  title="Save changes"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setEditingId(null)}
                                  className="p-1 bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-400 rounded cursor-pointer transition-all"
                                  title="Cancel edit"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      }

                      return (
                        <tr key={book.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="p-3 font-mono text-[11px] whitespace-nowrap text-slate-500 dark:text-slate-400">{book.date}</td>
                          <td className="p-3 font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">{empName}</td>
                          <td className="p-3 text-slate-800 dark:text-slate-200 font-medium" title={book.taskTitle}>
                            {book.taskTitle}
                          </td>
                          <td className="p-3 font-mono text-center font-bold text-slate-700 dark:text-slate-300">{book.plannedHours}</td>
                          <td className="p-3 font-mono text-center font-bold text-slate-900 dark:text-[#FFC20E]">{book.actualHours}</td>
                          <td className={`p-3 font-mono text-center text-[11px] ${varianceColor}`}>
                            {variance > 0 ? `+${variance}` : variance}
                          </td>
                          <td className="p-3 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1">
                              {/* Edit Button */}
                              <button
                                onClick={() => startEdit(book)}
                                className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded cursor-pointer transition-all"
                                title="Edit booking details"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              {/* Copy / Duplicate Button */}
                              <button
                                onClick={() => handleDuplicateBooking(book)}
                                className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 rounded cursor-pointer transition-all flex items-center gap-1"
                                title="Duplicate this entry (Instantly creates a copy & pre-fills form)"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>

                              {/* Copy to Form Button */}
                              <button
                                onClick={() => handleCopyToForm(book)}
                                className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded cursor-pointer transition-all"
                                title="Copy parameters to form"
                              >
                                <CopyPlus className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete Button */}
                              <button
                                onClick={() => onDeleteTimeBooking(book.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded cursor-pointer transition-all"
                                title="Delete booking"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
