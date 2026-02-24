import React, { useRef } from 'react';
import { Employee, ScheduleEntry, ShiftType, Selection, AppMode, ScheduleState } from '../types';
import { Lock, Copy, ClipboardPaste } from 'lucide-react';

interface ScheduleGridProps {
  days: Date[];
  employees: Employee[];
  shifts: ShiftType[];
  schedule: ScheduleState; // Key: "YYYY-MM-DD_EmpID", Value: Array of entries
  selections: Selection[];
  mode: AppMode;
  onCellClick: (dateStr: string, employeeId: string) => void;
  onCopyDay: (dateStr: string) => void;
  onPasteDay: (dateStr: string) => void;
  clipboardDay?: string;
}

const ScheduleGrid: React.FC<ScheduleGridProps> = ({
  days,
  employees,
  shifts,
  schedule,
  selections,
  mode,
  onCellClick,
  onCopyDay,
  onPasteDay,
  clipboardDay
}) => {
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const getDayName = (date: Date) => {
    const d = date.toLocaleDateString('pt-PT', { weekday: 'long' });
    return d.charAt(0).toUpperCase() + d.slice(1);
  };

  const toISODate = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const isWeekend = (date: Date) => {
    const day = date.getDay();
    return day === 0 || day === 6;
  };

  const getShiftById = (id: string) => shifts.find(s => s.id === id);

  const isSelected = (dateStr: string, empId: string) => {
    return selections.some(s => s.dateStr === dateStr && s.employeeId === empId);
  };

  return (
    <div className="flex flex-col h-full bg-white border rounded-lg shadow-sm overflow-hidden">
      <div 
        ref={tableContainerRef}
        className="overflow-auto relative w-full h-full custom-scrollbar"
      >
        <table className="border-collapse w-full min-w-max text-sm">
          {/* Header Row: Employees */}
          <thead className="bg-slate-100 sticky top-0 z-20 shadow-sm">
            <tr>
              <th className="sticky left-0 z-30 bg-slate-100 border-b border-r border-slate-300 p-2 min-w-[100px] text-left font-semibold text-slate-700">
                Dia
              </th>
              <th className="sticky left-[100px] z-30 bg-slate-100 border-b border-r border-slate-300 p-2 min-w-[100px] text-left font-semibold text-slate-700 shadow-md">
                Semana
              </th>
              {employees.map(emp => (
                <th key={emp.id} className="border-b border-r border-slate-300 p-2 min-w-[100px] text-center font-medium">
                  <div className="flex flex-col items-center">
                    <span className="font-bold text-slate-800">{emp.name}</span>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider">{emp.initials}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {days.map((day) => {
              const dateStr = toISODate(day);
              const isWknd = isWeekend(day);
              const dayName = getDayName(day);

              return (
                <tr key={dateStr} className={`hover:bg-slate-50 transition-colors ${isWknd ? 'bg-slate-50/50' : ''}`}>
                  {/* Date Column */}
                  <td className="sticky left-0 z-10 bg-white border-r border-b border-slate-200 p-2 font-medium text-slate-600 group min-w-[80px]">
                    <div className="flex items-center justify-between">
                        <span>{day.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' })}</span>
                        
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                                onClick={(e) => { e.stopPropagation(); onCopyDay(dateStr); }}
                                className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-indigo-600"
                                title="Copiar Dia"
                            >
                                <Copy size={14} />
                            </button>
                            
                            {clipboardDay && (
                                <button 
                                    onClick={(e) => { e.stopPropagation(); onPasteDay(dateStr); }}
                                    className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-emerald-600"
                                    title={`Colar (${clipboardDay})`}
                                >
                                    <ClipboardPaste size={14} />
                                </button>
                            )}
                        </div>
                    </div>
                  </td>
                  {/* Weekday Column */}
                  <td className={`sticky left-[100px] z-10 border-r border-b border-slate-200 p-2 font-medium shadow-md
                    ${isWknd ? 'bg-yellow-50 text-yellow-700' : 'bg-white text-slate-600'}`}>
                    {dayName}
                  </td>

                  {/* Employee Shift Cells */}
                  {employees.map((emp) => {
                    const entryKey = `${dateStr}_${emp.id}`;
                    const entries = schedule[entryKey] || [];
                    const selected = isSelected(dateStr, emp.id);

                    // Selection / Mode Styling
                    let borderClass = 'border-r border-b border-slate-200';
                    if (selected) {
                      if (mode === AppMode.SWAP) {
                        borderClass = 'border-2 border-blue-600 z-10'; 
                      } else {
                        borderClass = 'border-2 border-emerald-500 z-10'; 
                      }
                    }

                    return (
                      <td
                        key={emp.id}
                        onClick={() => onCellClick(dateStr, emp.id)}
                        className={`
                          relative p-0 cursor-pointer select-none transition-all duration-75
                          ${borderClass} h-12 align-top
                        `}
                      >
                         <div className="w-full h-full flex flex-col">
                            {entries.length === 0 ? (
                                <div className="w-full h-full text-slate-300 flex items-center justify-center text-xs">-</div>
                            ) : (
                                entries.map((entry, idx) => {
                                    const shift = getShiftById(entry.shiftTypeId);
                                    if (!shift) return null;
                                    
                                    // Split height dynamically
                                    
                                    return (
                                        <div 
                                            key={entry.id} 
                                            className={`
                                                flex-1 w-full flex items-center justify-center text-[10px] leading-none font-bold
                                                ${shift.color} ${shift.textColor}
                                                ${idx > 0 ? 'border-t border-black/10' : ''}
                                                relative overflow-hidden
                                            `}
                                        >
                                            <span className="truncate px-1">{shift.code}</span>
                                            {entry.note && (
                                                <div 
                                                    className="absolute top-0 right-0 w-0 h-0 border-t-[8px] border-l-[8px] border-t-orange-500 border-l-transparent" 
                                                    title={entry.note}
                                                ></div>
                                            )}
                                            {entry.isSwap && (
                                                <div className="absolute top-0 left-0 w-3 h-3 bg-indigo-600 text-white rounded-br text-[8px] flex items-center justify-center font-bold z-10" title="Troca">T</div>
                                            )}
                                            {entry.isExchange && (
                                                <div className="absolute top-0 left-0 w-3 h-3 bg-orange-500 text-white rounded-br text-[8px] flex items-center justify-center font-bold z-10" title="Permuta">P</div>
                                            )}
                                            {entry.isLocked && (
                                                <Lock size={8} className="absolute bottom-0.5 right-0.5 opacity-50" />
                                            )}
                                        </div>
                                    );
                                })
                            )}
                         </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ScheduleGrid;