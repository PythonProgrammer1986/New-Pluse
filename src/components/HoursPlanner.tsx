import React, { useState } from 'react';
import { Employee, TaskTimeBooking, ActionItem } from '../types';
import {
  Sliders, Plus, Trash2, ClipboardList, CheckSquare,
  Clock, Edit2, Check, X, Copy, CopyPlus, AlertTriangle
} from 'lucide-react';

interface HoursPlannerProps {
  employees: Employee[];
  timeBookings: TaskTimeBooking[];
  actionItems: ActionItem[];
  onAddTimeBooking: (booking: {
    employeeId: string;
    taskTitle: string;
    plannedHours: number;
    actualHours: number;
    date: string;
  }) => void;
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
  const [formError, setFormError] = useState<string | null>(null);

  const [selectedActionId, setSelectedActionId] = useState('');

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
      setFormError(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmpId || !taskTitle.trim()) {
      setFormError('Please select a team member and enter a task title.');
      return;
    }

    setFormError(null);
    onAddTimeBooking({
      employeeId: selectedEmpId,
      taskTitle: taskTitle.trim(),
      plannedHours: parseFloat(plannedHours) || 0,
      actualHours: parseFloat(actualHours) || 0,
      date: bookingDate || new Date().toISOString().split('T')[0]
    });

    setTaskTitle('');
    setSelectedActionId('');
    setPlannedHours('8');
    setActualHours('8');
  };

  const handleDuplicateBooking = (book: TaskTimeBooking) => {
    onAddTimeBooking({
      employeeId: book.employeeId,
      taskTitle: `${book.taskTitle} (Copy)`,
      plannedHours: book.plannedHours,
      actualHours: book.actualHours,
      date: book.date
    });

    setSelectedEmpId(book.employeeId);
    setTaskTitle(book.taskTitle);
    setPlannedHours(book.plannedHours.toString());
    setActualHours(book.actualHours.toString());
    setBookingDate(book.date);
  };

  const handleCopyToForm = (book: TaskTimeBooking) => {
    setSelectedEmpId(book.employeeId);
    setTaskTitle(book.taskTitle);
    setPlannedHours(book.plannedHours.toString());
    setActualHours(book.actualHours.toString());
    setBookingDate(book.date);
    setFormError(null);
  };

  const startEdit = (book: TaskTimeBooking) => {
    setEditingId(book.id);
    setEditEmpId(book.employeeId);
    setEditTaskTitle(book.taskTitle);
    setEditPlannedHours(book.plannedHours.toString());
    setEditActualHours(book.actualHours.toString());
    setEditBookingDate(book.date);
  };

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

  React.useEffect(() => {
    if (employees.length > 0 && !selectedEmpId) {
      setSelectedEmpId(employees[0].id);
    }
  }, [employees, selectedEmpId]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#F7F8F9] border border-gray-200 p-5 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#D97706]" />
            <h3 className="font-bold text-sm uppercase tracking-wider font-mono text-[#262A2E]">
              Task & Time Booking Desk
            </h3>
          </div>
          <p className="text-xs text-[#6B7280] leading-relaxed max-w-2xl">
            Register operational hours against tasks, compare actual vs planned labor, and duplicate or edit logs inline.
          </p>
        </div>
        <span className="px-3 py-1 bg-[#FFFBEB] border border-[#FFC20E] text-[#1F2328] text-[10px] font-mono font-bold uppercase rounded-md shrink-0">
          Labor Metrics Active
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Booking Form */}
        <div className="lg:col-span-4 bg-white border border-gray-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-200 pb-3">
            <Sliders className="w-4 h-4 text-[#D97706]" />
            <h4 className="font-bold text-[#262A2E] text-xs uppercase tracking-wider">
              Book Task Hours
            </h4>
          </div>

          {formError && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {employees.length === 0 ? (
            <div className="p-4 bg-rose-50 text-rose-700 rounded-lg text-xs font-medium text-center border border-rose-200 leading-relaxed">
              No employees registered yet. Add team members in <strong>Resource Master</strong> first.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] text-[#4B5563] font-bold uppercase tracking-wider mb-1">
                  Team Member
                </label>
                <select
                  value={selectedEmpId}
                  onChange={(e) => setSelectedEmpId(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-gray-300 bg-white text-[#262A2E] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC20E] cursor-pointer font-semibold"
                >
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-[#4B5563] font-bold uppercase tracking-wider mb-1">
                  Link Countermeasure (Optional)
                </label>
                <select
                  value={selectedActionId}
                  onChange={(e) => handleActionSelect(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-gray-300 bg-white text-[#262A2E] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC20E] cursor-pointer"
                >
                  <option value="">-- Custom task title --</option>
                  {actionItems.filter(a => a.status !== 'resolved').map(action => (
                    <option key={action.id} value={action.id}>
                      [{action.pillar}] {action.title.substring(0, 45)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] text-[#4B5563] font-bold uppercase tracking-wider mb-1">
                  Task / Activity Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mechanical assembly line 1 setup"
                  value={taskTitle}
                  onChange={(e) => {
                    setTaskTitle(e.target.value);
                    if (formError) setFormError(null);
                  }}
                  className="w-full text-xs px-3 py-2 border border-gray-300 bg-white text-[#262A2E] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC20E] font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-[#4B5563] font-bold uppercase tracking-wider mb-1">
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
                    className="w-full text-xs px-3 py-2 border border-gray-300 bg-white text-[#262A2E] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC20E] font-mono font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-[#4B5563] font-bold uppercase tracking-wider mb-1">
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
                    className="w-full text-xs px-3 py-2 border border-gray-300 bg-white text-[#262A2E] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC20E] font-mono font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-[#4B5563] font-bold uppercase tracking-wider mb-1">
                  Booking Date
                </label>
                <input
                  type="date"
                  required
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-gray-300 bg-white text-[#262A2E] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC20E] font-mono font-semibold"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-[#FFC20E] hover:bg-[#E5AE00] text-[#1F2328] font-extrabold text-xs rounded-lg flex items-center justify-center gap-1.5 cursor-pointer font-mono transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Book Task Hours</span>
              </button>
            </form>
          )}
        </div>

        {/* Time Booking Logs Table */}
        <div className="lg:col-span-8 bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs flex flex-col min-h-[540px]">
          <div className="px-4 py-3 bg-[#F7F8F9] border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-[#D97706] shrink-0" />
              <h4 className="font-bold text-xs uppercase tracking-wider font-mono text-[#262A2E]">
                Labor Logbook Ledger
              </h4>
            </div>
            <span className="px-2.5 py-0.5 rounded text-[10px] bg-[#FFC20E] text-[#1F2328] font-bold font-mono">
              {timeBookings.length} bookings
            </span>
          </div>

          <div className="flex-1 overflow-y-auto">
            {timeBookings.length === 0 ? (
              <div className="p-12 text-center text-[#6B7280] h-full flex flex-col justify-center items-center">
                <CheckSquare className="w-10 h-10 text-gray-300 mb-2" />
                <span className="text-xs font-semibold block text-[#262A2E]">Logbook is Empty</span>
                <span className="text-[10px] mt-1 block">Submit a booking on the left to record shift hours.</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#F7F8F9] text-[10px] text-[#4B5563] font-bold uppercase tracking-wider border-b border-gray-200">
                      <th className="p-3">Date</th>
                      <th className="p-3">Employee</th>
                      <th className="p-3">Task Description</th>
                      <th className="p-3 text-center">Planned</th>
                      <th className="p-3 text-center">Actual</th>
                      <th className="p-3 text-center">Variance</th>
                      <th className="p-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs">
                    {timeBookings.map((book) => {
                      const empName = employees.find(e => e.id === book.employeeId)?.name || 'Unknown Operator';
                      const variance = book.actualHours - book.plannedHours;
                      const varianceColor =
                        variance > 0
                          ? 'text-rose-600 font-bold'
                          : variance < 0
                          ? 'text-emerald-700 font-semibold'
                          : 'text-[#6B7280]';

                      const isEditing = editingId === book.id;

                      if (isEditing) {
                        return (
                          <tr key={book.id} className="bg-[#FFFBEB]">
                            <td className="p-2">
                              <input
                                type="date"
                                value={editBookingDate}
                                onChange={(e) => setEditBookingDate(e.target.value)}
                                className="text-xs px-2 py-1 border border-gray-300 bg-white text-[#262A2E] rounded font-mono"
                              />
                            </td>
                            <td className="p-2">
                              <select
                                value={editEmpId}
                                onChange={(e) => setEditEmpId(e.target.value)}
                                className="text-xs px-2 py-1 border border-gray-300 bg-white text-[#262A2E] rounded font-semibold"
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
                                className="w-full text-xs px-2 py-1 border border-gray-300 bg-white text-[#262A2E] rounded font-semibold"
                              />
                            </td>
                            <td className="p-2 text-center">
                              <input
                                type="number"
                                step="0.5"
                                value={editPlannedHours}
                                onChange={(e) => setEditPlannedHours(e.target.value)}
                                className="w-16 text-xs px-1.5 py-1 border border-gray-300 bg-white text-[#262A2E] rounded text-center font-mono font-bold"
                              />
                            </td>
                            <td className="p-2 text-center">
                              <input
                                type="number"
                                step="0.5"
                                value={editActualHours}
                                onChange={(e) => setEditActualHours(e.target.value)}
                                className="w-16 text-xs px-1.5 py-1 border border-gray-300 bg-white text-[#262A2E] rounded text-center font-mono font-bold"
                              />
                            </td>
                            <td className="p-2 text-center text-[#6B7280] font-mono text-[10px]">editing</td>
                            <td className="p-2 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => saveEdit(book.id)}
                                  className="p-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded cursor-pointer"
                                  title="Save changes"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingId(null)}
                                  className="p-1 bg-white border border-gray-300 text-[#3A3F45] hover:bg-gray-100 rounded cursor-pointer"
                                  title="Cancel"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      }

                      return (
                        <tr key={book.id} className="hover:bg-[#F7F8F9] transition-colors">
                          <td className="p-3 font-mono text-[11px] whitespace-nowrap text-[#6B7280]">{book.date}</td>
                          <td className="p-3 font-bold text-[#262A2E] whitespace-nowrap">{empName}</td>
                          <td className="p-3 text-[#3A3F45] font-medium" title={book.taskTitle}>
                            {book.taskTitle}
                          </td>
                          <td className="p-3 font-mono text-center font-semibold text-[#4B5563]">{book.plannedHours}</td>
                          <td className="p-3 font-mono text-center font-bold text-[#262A2E]">{book.actualHours}</td>
                          <td className={`p-3 font-mono text-center text-[11px] ${varianceColor}`}>
                            {variance > 0 ? `+${variance}` : variance}
                          </td>
                          <td className="p-3 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => startEdit(book)}
                                className="p-1.5 text-[#6B7280] hover:text-[#262A2E] hover:bg-gray-100 rounded cursor-pointer transition-colors"
                                title="Edit booking"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDuplicateBooking(book)}
                                className="p-1.5 text-[#6B7280] hover:text-[#D97706] hover:bg-[#FFFBEB] rounded cursor-pointer transition-colors"
                                title="Duplicate entry"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleCopyToForm(book)}
                                className="p-1.5 text-[#6B7280] hover:text-emerald-700 hover:bg-emerald-50 rounded cursor-pointer transition-colors"
                                title="Copy to form"
                              >
                                <CopyPlus className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => onDeleteTimeBooking(book.id)}
                                className="p-1.5 text-[#6B7280] hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer transition-colors"
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
