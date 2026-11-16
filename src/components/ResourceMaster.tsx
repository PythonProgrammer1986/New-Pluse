import React, { useState } from 'react';
import { Employee, TaskTimeBooking } from '../types';
import { Users, Plus, Trash2, Edit2, Check, UserPlus, Percent, ShieldAlert } from 'lucide-react';

interface ResourceMasterProps {
  employees: Employee[];
  timeBookings: TaskTimeBooking[];
  onAddEmployee: (name: string, monthlyAvailableHours: number) => void;
  onUpdateEmployee: (id: string, updates: { name?: string; monthlyAvailableHours?: number }) => void;
  onDeleteEmployee: (id: string) => void;
}

export default function ResourceMaster({
  employees,
  timeBookings,
  onAddEmployee,
  onUpdateEmployee,
  onDeleteEmployee
}: ResourceMasterProps) {
  const [empName, setEmpName] = useState('');
  const [empHours, setEmpHours] = useState('160');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingHours, setEditingHours] = useState('160');
  const [empToDelete, setEmpToDelete] = useState<Employee | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!empName.trim()) return;
    const hours = parseFloat(empHours) || 0;
    onAddEmployee(empName.trim(), hours);
    setEmpName('');
    setEmpHours('160');
  };

  const startEdit = (emp: Employee) => {
    setEditingId(emp.id);
    setEditingName(emp.name);
    setEditingHours(emp.monthlyAvailableHours.toString());
  };

  const saveEdit = (id: string) => {
    onUpdateEmployee(id, {
      name: editingName,
      monthlyAvailableHours: parseFloat(editingHours) || 0
    });
    setEditingId(null);
  };

  return (
    <div className="space-y-6">
      {/* Intro Banner */}
      <div className="bg-[#F7F8F9] border border-gray-200 p-5 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-[#D97706]" />
            <h3 className="font-bold text-sm uppercase tracking-wider font-mono text-[#262A2E]">
              Resource Master Database
            </h3>
          </div>
          <p className="text-xs text-[#6B7280] leading-relaxed max-w-2xl">
            Manage team rosters and monthly available capacity hours to monitor workload balance and utilization.
          </p>
        </div>
        <span className="px-3 py-1 bg-[#FFFBEB] border border-[#FFC20E] text-[#1F2328] text-[10px] font-mono font-bold uppercase rounded-md shrink-0">
          Capacity Planner Active
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Add Employee Form */}
        <div className="lg:col-span-4 bg-white border border-gray-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-200 pb-3">
            <UserPlus className="w-4 h-4 text-[#D97706]" />
            <h4 className="font-bold text-[#262A2E] text-xs uppercase tracking-wider">
              Add Team Member
            </h4>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] text-[#4B5563] font-bold uppercase tracking-wider mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Sarah Connor"
                value={empName}
                onChange={(e) => setEmpName(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-gray-300 bg-white text-[#262A2E] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC20E] font-medium"
              />
            </div>

            <div>
              <label className="block text-[10px] text-[#4B5563] font-bold uppercase tracking-wider mb-1">
                Monthly Available Hours
              </label>
              <input
                type="number"
                required
                min="1"
                max="300"
                placeholder="e.g. 160"
                value={empHours}
                onChange={(e) => setEmpHours(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-gray-300 bg-white text-[#262A2E] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC20E] font-mono font-semibold"
              />
              <span className="text-[10px] text-[#6B7280] mt-1 block">
                Standard full-time is 160 hrs/month (40 hrs × 4 weeks).
              </span>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-[#FFC20E] hover:bg-[#E5AE00] text-[#1F2328] font-extrabold text-xs rounded-lg flex items-center justify-center gap-1.5 cursor-pointer font-mono transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Employee</span>
            </button>
          </form>
        </div>

        {/* Employee Roster Cards */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-xs uppercase tracking-wider text-[#4B5563] font-mono">
              Team Roster & Utilization ({employees.length} Members)
            </h4>
          </div>

          {employees.length === 0 ? (
            <div className="p-8 bg-[#F7F8F9] border border-dashed border-gray-300 rounded-xl text-center text-[#6B7280]">
              <Users className="w-10 h-10 mx-auto text-gray-300 mb-2" />
              <span className="text-xs font-semibold block text-[#262A2E]">Roster Empty</span>
              <span className="text-[10px] mt-1 block">Add team members on the left to activate capacity tracking.</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {employees.map((emp) => {
                const bookings = timeBookings.filter(b => b.employeeId === emp.id);
                const totalPlanned = bookings.reduce((sum, b) => sum + b.plannedHours, 0);
                const totalActual = bookings.reduce((sum, b) => sum + b.actualHours, 0);

                const availHours = emp.monthlyAvailableHours;
                const utilizationPercent = availHours > 0 ? Math.round((totalActual / availHours) * 100) : 0;
                const hoursLeft = Math.max(0, availHours - totalActual);
                const isOverUtilized = totalActual > availHours;

                return (
                  <div
                    key={emp.id}
                    className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs space-y-4 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 border-b border-gray-100 pb-2.5">
                        {editingId === emp.id ? (
                          <div className="flex items-center gap-1.5 w-full">
                            <input
                              type="text"
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              className="flex-1 text-xs font-bold px-2 py-1 border border-gray-300 bg-white text-[#262A2E] rounded focus:ring-2 focus:ring-[#FFC20E] focus:outline-none"
                            />
                            <input
                              type="number"
                              value={editingHours}
                              onChange={(e) => setEditingHours(e.target.value)}
                              className="text-xs font-bold px-2 py-1 border border-gray-300 bg-white text-[#262A2E] rounded w-16 text-center font-mono focus:ring-2 focus:ring-[#FFC20E] focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => saveEdit(emp.id)}
                              className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded cursor-pointer"
                              title="Save changes"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-2">
                              <div className="w-2.5 h-2.5 rounded-full bg-[#FFC20E]"></div>
                              <span className="text-xs font-extrabold text-[#262A2E] uppercase font-mono">
                                {emp.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => startEdit(emp)}
                                className="p-1 text-[#6B7280] hover:text-[#262A2E] transition-colors cursor-pointer"
                                title="Edit employee"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setEmpToDelete(emp)}
                                className="p-1 text-[#6B7280] hover:text-rose-600 transition-colors cursor-pointer"
                                title="Delete employee"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2.5 pt-3">
                        <div className="bg-[#F7F8F9] p-2.5 rounded-lg border border-gray-200 text-center">
                          <span className="text-[9px] text-[#6B7280] font-bold uppercase block font-mono">
                            Monthly Target
                          </span>
                          <span className="text-xs font-bold font-mono text-[#262A2E] mt-0.5 block">
                            {availHours} hrs
                          </span>
                        </div>
                        <div className="bg-[#F7F8F9] p-2.5 rounded-lg border border-gray-200 text-center">
                          <span className="text-[9px] text-[#6B7280] font-bold uppercase block font-mono">
                            Actual Booked
                          </span>
                          <span
                            className={`text-xs font-bold font-mono mt-0.5 block ${
                              isOverUtilized ? 'text-rose-600' : 'text-[#262A2E]'
                            }`}
                          >
                            {totalActual} hrs
                          </span>
                        </div>
                        <div className="bg-[#F7F8F9] p-2.5 rounded-lg border border-gray-200 text-center">
                          <span className="text-[9px] text-[#6B7280] font-bold uppercase block font-mono">
                            Planned Tasks
                          </span>
                          <span className="text-xs font-bold font-mono text-[#262A2E] mt-0.5 block">
                            {totalPlanned} hrs
                          </span>
                        </div>
                        <div className="bg-[#F7F8F9] p-2.5 rounded-lg border border-gray-200 text-center">
                          <span className="text-[9px] text-[#6B7280] font-bold uppercase block font-mono">
                            Available Left
                          </span>
                          <span className="text-xs font-bold font-mono text-emerald-700 mt-0.5 block">
                            {hoursLeft} hrs
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-gray-100 mt-2 space-y-1.5">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-[#6B7280] font-bold uppercase font-mono flex items-center gap-1">
                          <Percent className="w-3 h-3 text-[#D97706]" />
                          Utilization Rate
                        </span>
                        <span
                          className={`font-mono font-bold ${
                            isOverUtilized ? 'text-rose-600' : 'text-[#262A2E]'
                          }`}
                        >
                          {utilizationPercent}%
                        </span>
                      </div>

                      <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            isOverUtilized ? 'bg-rose-500' : 'bg-[#FFC20E]'
                          }`}
                          style={{ width: `${Math.min(100, utilizationPercent)}%` }}
                        ></div>
                      </div>

                      {isOverUtilized && (
                        <div className="flex items-center gap-1.5 text-[10px] text-rose-700 font-bold mt-1 font-mono bg-rose-50 p-2 rounded border border-rose-200">
                          <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                          <span>Overload: Booked hours exceed monthly capacity.</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {empToDelete && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-sm p-5 shadow-xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-200">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-[#262A2E] text-base">Delete {empToDelete.name}?</h3>
                <p className="text-xs text-[#6B7280] mt-1 leading-relaxed">
                  Are you sure you want to remove this team member from the roster?
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setEmpToDelete(null)}
                className="px-3 py-1.5 border border-gray-300 text-[#3A3F45] hover:bg-gray-50 rounded-lg text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteEmployee(empToDelete.id);
                  setEmpToDelete(null);
                }}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold cursor-pointer"
              >
                Delete Employee
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
