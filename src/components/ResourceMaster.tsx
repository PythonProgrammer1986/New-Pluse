import React, { useState } from 'react';
import { Employee, TaskTimeBooking } from '../types';
import { Users, Plus, Trash2, Edit2, Check, UserPlus, Award, Calendar, Percent, ShieldAlert } from 'lucide-react';

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

  // Inline editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingHours, setEditingHours] = useState('160');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!empName) return;
    const hours = parseFloat(empHours) || 0;
    onAddEmployee(empName, hours);
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
      
      {/* Overview Intro Banner */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-[#FFC20E]" />
            <h3 className="font-extrabold text-sm uppercase tracking-wider font-mono">
              Resource Master Database
            </h3>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
            Define team rosters and set monthly contract/operational hours. This master register calculates resource availability thresholds, planned tasks overhead, and actual utilization metrics.
          </p>
        </div>
        <div className="px-3 py-1 bg-[#FFC20E]/10 border border-[#FFC20E]/20 text-[#FFC20E] text-[10px] font-mono font-bold uppercase rounded-md shrink-0">
          Capacity Planner Active
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Register New Employee Form */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <UserPlus className="w-4 h-4 text-[#FFC20E]" />
            <h4 className="font-bold text-slate-800 dark:text-white text-xs uppercase tracking-wider">
              Add New Employee
            </h4>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Marcus Aurelius"
                value={empName}
                onChange={(e) => setEmpName(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC20E] font-semibold shadow-sm placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
            </div>

            <div>
              <label className="block text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1">
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
                className="w-full text-xs px-3.5 py-2.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFC20E] font-mono font-semibold shadow-sm placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
              <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 block">
                Standard full-time is 160 hrs/month (40 hrs &times; 4 weeks).
              </span>
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-[#FFC20E] hover:bg-[#E5B200] text-slate-950 font-extrabold text-xs rounded-lg shadow-sm flex items-center justify-center gap-1.5 cursor-pointer font-mono"
            >
              <Plus className="w-4 h-4" />
              <span>Log Employee</span>
            </button>
          </form>
        </div>

        {/* Right Column: Employee Roster with Capacity & Utilization cards */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-600 dark:text-slate-400 font-mono">
              Team Roster, Hours & Utilization Real-Time Report ({employees.length} Members)
            </h4>
          </div>

          {employees.length === 0 ? (
            <div className="p-8 bg-slate-50 dark:bg-slate-900 border border-dashed border-slate-250 rounded-xl text-center text-slate-400">
              <Users className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-750 mb-2" />
              <span className="text-xs font-semibold block text-slate-700 dark:text-slate-300">Roster Empty</span>
              <span className="text-[10px] mt-1 block">Add team members on the left to activate hours reporting.</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {employees.map((emp) => {
                // Calculate hours booked against this employee
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
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-xl p-5 shadow-sm space-y-4 flex flex-col justify-between"
                  >
                    <div>
                      {/* Name Header and Edit Actions */}
                      <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800/60 pb-2">
                        {editingId === emp.id ? (
                          <div className="flex items-center gap-1.5 w-full">
                            <input
                              type="text"
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              className="text-xs font-bold px-2 py-1 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded focus:ring-1 focus:ring-[#FFC20E] focus:outline-none"
                            />
                            <input
                              type="number"
                              value={editingHours}
                              onChange={(e) => setEditingHours(e.target.value)}
                              className="text-xs font-bold px-2 py-1 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded w-16 text-center font-mono focus:ring-1 focus:ring-[#FFC20E] focus:outline-none"
                            />
                            <button
                              onClick={() => saveEdit(emp.id)}
                              className="p-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded cursor-pointer"
                              title="Save changes"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-2">
                              <div className="w-2.5 h-2.5 rounded-full bg-slate-950 dark:bg-[#FFC20E]"></div>
                              <span className="text-xs font-extrabold text-slate-900 dark:text-white uppercase font-mono">
                                {emp.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => startEdit(emp)}
                                className="p-1 text-slate-400 hover:text-blue-500 transition-colors cursor-pointer"
                                title="Edit employee specs"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => {
                                  if (window.confirm(`Are you sure you want to delete ${emp.name}? All tasks booked against them will be removed.`)) {
                                    onDeleteEmployee(emp.id);
                                  }
                                }}
                                className="p-1 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                                title="Delete employee from roster"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Stat Metrics Grid */}
                      <div className="grid grid-cols-2 gap-3 pt-3">
                        <div className="bg-slate-50 dark:bg-slate-850/60 p-2 rounded-lg border border-slate-150 dark:border-slate-800 text-center">
                          <span className="text-[9px] text-slate-400 font-bold uppercase block font-mono">Monthly Target</span>
                          <span className="text-xs font-bold font-mono text-slate-800 dark:text-slate-200 mt-0.5 block">{availHours} hrs</span>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-850/60 p-2 rounded-lg border border-slate-150 dark:border-slate-800 text-center">
                          <span className="text-[9px] text-slate-400 font-bold uppercase block font-mono">Actual Booked</span>
                          <span className={`text-xs font-bold font-mono mt-0.5 block ${isOverUtilized ? 'text-rose-500 font-extrabold' : 'text-slate-800 dark:text-slate-200'}`}>
                            {totalActual} hrs
                          </span>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-850/60 p-2 rounded-lg border border-slate-150 dark:border-slate-800 text-center">
                          <span className="text-[9px] text-slate-400 font-bold uppercase block font-mono">Planned Tasks</span>
                          <span className="text-xs font-bold font-mono text-slate-800 dark:text-slate-200 mt-0.5 block">{totalPlanned} hrs</span>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-850/60 p-2 rounded-lg border border-slate-150 dark:border-slate-800 text-center">
                          <span className="text-[9px] text-slate-400 font-bold uppercase block font-mono">Available Left</span>
                          <span className="text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5 block">{hoursLeft} hrs</span>
                        </div>
                      </div>
                    </div>

                    {/* Utilization Bar and Warning limits */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-850 mt-3 space-y-1.5">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-slate-400 font-bold uppercase font-mono flex items-center gap-1">
                          <Percent className="w-3 h-3 text-[#FFC20E]" />
                          Utilization Rate:
                        </span>
                        <span className={`font-mono font-bold ${isOverUtilized ? 'text-rose-500 font-black' : 'text-slate-800 dark:text-slate-200'}`}>
                          {utilizationPercent}%
                        </span>
                      </div>

                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-300 ${
                            isOverUtilized 
                              ? 'bg-rose-500' 
                              : utilizationPercent >= 85 
                                ? 'bg-amber-500' 
                                : 'bg-[#FFC20E]'
                          }`}
                          style={{ width: `${Math.min(100, utilizationPercent)}%` }}
                        ></div>
                      </div>

                      {isOverUtilized && (
                        <div className="flex items-center gap-1 text-[9px] text-rose-500 font-bold mt-1 font-mono uppercase bg-rose-500/10 p-1.5 rounded border border-rose-500/20">
                          <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                          <span>Overload Detected! Booked hours exceed target limits.</span>
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

    </div>
  );
}
