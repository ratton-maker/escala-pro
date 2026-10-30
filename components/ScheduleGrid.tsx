import React, { useRef, useMemo, useState } from 'react';
import { Employee, ScheduleEntry, ShiftType, Selection, AppMode, ScheduleState } from '../types';
import { Lock, Copy, ClipboardPaste, FileText, ArrowUpDown } from 'lucide-react';

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
  onOpenDailyReport?: (dateStr: string) => void;
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
  clipboardDay,
  onOpenDailyReport
}) => {
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const getDayName = (date: Date) => {
    const d = date.toLocaleDateString('pt-PT', { weekday: 'long' });
    return d.charAt(0).toUpperCase() + d.slice(1);
  };

  const getDayShortName = (date: Date) => {
    const d = date.toLocaleDateString('pt-PT', { weekday: 'short' });
    return d.replace('.', '').toUpperCase();
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

  const [orderByRole, setOrderByRole] = useState(false);

  // Structure employees: when orderByRole is active, group by FUNÇÃO -> MATRÍCULA -> NOME
  const sortedEmployees = useMemo(() => {
    if (!orderByRole) return employees;
    return [...employees].sort((a, b) => {
      const roleA = a.role || '';
      const roleB = b.role || '';
      const roleComp = roleA.localeCompare(roleB);
      if (roleComp !== 0) return roleComp;
      const matA = a.initials || '';
      const matB = b.initials || '';
      const matComp = matA.localeCompare(matB);
      if (matComp !== 0) return matComp;
      return a.name.localeCompare(b.name);
    });
  }, [employees, orderByRole]);

  return (
    <div className="flex flex-col h-full bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
      <div 
        ref={tableContainerRef}
        className="overflow-auto relative w-full h-full custom-scrollbar"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <table className="border-collapse w-full min-w-max text-sm">
          {/* Header Row: Employees */}
          <thead className="bg-slate-100 sticky top-0 z-20 shadow-xs">
            <tr>
              <th className="sticky left-0 z-30 bg-slate-100 border-b border-r border-slate-300 p-1.5 sm:p-2 min-w-[68px] w-[68px] sm:min-w-[90px] sm:w-[90px] md:min-w-[100px] md:w-[100px] text-center sm:text-left font-semibold text-slate-700">
                <span className="sm:hidden text-xs">Data</span>
                <span className="hidden sm:inline">Dia</span>
              </th>
              <th className="hidden sm:table-cell sticky sm:left-[90px] md:left-[100px] z-30 bg-slate-100 border-b border-r border-slate-300 p-1.5 sm:p-2 sm:min-w-[90px] sm:w-[90px] md:min-w-[100px] md:w-[100px] text-left font-semibold text-slate-700 shadow-xs">
                <div className="flex items-center justify-between">
                  <span>Semana</span>
                  <button
                    onClick={() => setOrderByRole(!orderByRole)}
                    className={`p-1 rounded transition-colors ${
                      orderByRole 
                        ? 'bg-indigo-100 text-indigo-700' 
                        : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200'
                    }`}
                    title={orderByRole ? "Agrupado por Função (Clique para ordem da lista)" : "Clique para agrupar por Função e Matrícula"}
                  >
                    <ArrowUpDown size={12} />
                  </button>
                </div>
              </th>
              {sortedEmployees.length === 0 ? (
                <th className="border-b border-r border-slate-300 p-2 text-center text-xs text-slate-400 font-normal italic min-w-[220px]">
                  Nenhum funcionário selecionado no filtro
                </th>
              ) : (
                sortedEmployees.map(emp => (
                  <th key={emp.id} className="border-b border-r border-slate-300 p-1.5 sm:p-2 min-w-[84px] sm:min-w-[105px] text-center font-medium bg-slate-100">
                    <div className="flex flex-col items-center gap-0.5">
                      {/* NOME */}
                      <span className="font-bold text-slate-800 text-xs sm:text-sm truncate max-w-[80px] sm:max-w-[100px]" title={emp.name}>
                        {emp.name}
                      </span>
                      {/* FUNÇÃO */}
                      {emp.role && (
                        <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/60 truncate max-w-[80px] sm:max-w-[100px]" title={`Função: ${emp.role}`}>
                          {emp.role}
                        </span>
                      )}
                      {/* MATRÍCULA */}
                      {emp.initials && (
                        <span className="text-[9px] text-slate-500 font-mono tracking-wider" title={`Matrícula: ${emp.initials}`}>
                          {emp.initials}
                        </span>
                      )}
                    </div>
                  </th>
                ))
              )}
            </tr>
          </thead>

          <tbody>
            {days.map((day) => {
              const dateStr = toISODate(day);
              const isWknd = isWeekend(day);
              const dayName = getDayName(day);
              const dayShort = getDayShortName(day);

              return (
                <tr 
                  key={dateStr} 
                  className={`transition-colors ${isWknd ? 'bg-slate-100 hover:bg-slate-200/60' : 'hover:bg-slate-50'}`}
                >
                  {/* Date Column: Merged compact date on mobile, expanded on desktop */}
                  <td className={`sticky left-0 z-10 border-r border-b border-slate-200 p-1 sm:p-2 font-medium min-w-[68px] w-[68px] sm:min-w-[90px] sm:w-[90px] md:min-w-[100px] md:w-[100px]
                    ${isWknd ? 'bg-slate-100 text-slate-800 font-semibold' : 'bg-white text-slate-600'}`}>
                    
                    {/* Mobile View: Date + Short Day */}
                    <div className="sm:hidden flex flex-col items-center justify-center py-0.5 text-center">
                      <span className="text-xs font-bold leading-tight text-slate-800">
                        {day.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' })}
                      </span>
                      <span className={`text-[9px] font-bold leading-tight mt-0.5 uppercase tracking-wide px-1 py-0.2 rounded ${
                        isWknd ? 'text-slate-800 bg-slate-200/90' : 'text-slate-500'
                      }`}>
                        {dayShort}
                      </span>
                      <div className="flex items-center gap-1 mt-1">
                        {onOpenDailyReport && (
                          <button
                            onClick={(e) => { e.stopPropagation(); onOpenDailyReport(dateStr); }}
                            className="p-0.5 text-indigo-600 hover:text-indigo-800 active:bg-indigo-50 rounded"
                            title="Ver Folha Diária (Aprovada)"
                          >
                            <FileText size={11} />
                          </button>
                        )}
                        {clipboardDay && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); onPasteDay(dateStr); }}
                            className="px-1 py-0.5 bg-emerald-100 text-emerald-700 active:bg-emerald-200 rounded text-[9px] font-bold flex items-center gap-0.5 shadow-xs"
                            title={`Colar escala de ${clipboardDay}`}
                          >
                            <ClipboardPaste size={9} /> Colar
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Desktop View: Date + Copy/Paste on Hover */}
                    <div className="hidden sm:flex items-center justify-between group">
                      <span>{day.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' })}</span>
                      
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {onOpenDailyReport && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); onOpenDailyReport(dateStr); }}
                            className={`p-1 rounded text-slate-400 hover:text-indigo-600 ${isWknd ? 'hover:bg-slate-200' : 'hover:bg-slate-100'}`}
                            title="Ver Escala Diária (Folha Aprovada)"
                          >
                            <FileText size={14} />
                          </button>
                        )}

                        <button 
                          onClick={(e) => { e.stopPropagation(); onCopyDay(dateStr); }}
                          className={`p-1 rounded text-slate-400 hover:text-indigo-600 ${isWknd ? 'hover:bg-slate-200' : 'hover:bg-slate-100'}`}
                          title="Copiar Dia"
                        >
                          <Copy size={14} />
                        </button>
                        
                        {clipboardDay && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); onPasteDay(dateStr); }}
                            className={`p-1 rounded text-slate-400 hover:text-emerald-600 ${isWknd ? 'hover:bg-slate-200' : 'hover:bg-slate-100'}`}
                            title={`Colar (${clipboardDay})`}
                          >
                            <ClipboardPaste size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Weekday Column (hidden on mobile, shown on sm:) */}
                  <td className={`hidden sm:table-cell sticky sm:left-[90px] md:left-[100px] z-10 border-r border-b border-slate-200 p-2 font-medium sm:min-w-[90px] sm:w-[90px] md:min-w-[100px] md:w-[100px] shadow-xs
                    ${isWknd ? 'bg-slate-100 text-slate-800 font-semibold' : 'bg-white text-slate-600'}`}>
                    <div className="flex items-center gap-1.5">
                      {isWknd && (
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 inline-block"></span>
                      )}
                      <span>{dayName}</span>
                    </div>
                  </td>

                  {/* Employee Shift Cells */}
                  {sortedEmployees.length === 0 ? (
                    <td className={`p-3 text-center text-xs text-slate-400 border-r border-b border-slate-200 ${isWknd ? 'bg-slate-100' : 'bg-white'}`}>
                      -
                    </td>
                  ) : (
                    sortedEmployees.map((emp) => {
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
                          ${isWknd ? 'bg-slate-100 hover:bg-slate-200/60' : 'bg-white hover:bg-slate-50/80'}
                        `}
                      >
                         <div className={`w-full h-full flex flex-col ${isWknd ? 'bg-slate-100' : 'bg-white'}`}>
                            {entries.length === 0 ? (
                                <div className={`w-full h-full flex items-center justify-center text-xs ${isWknd ? 'bg-slate-100 text-slate-400 font-medium' : 'text-slate-300'}`}>-</div>
                            ) : (
                                entries.map((entry, idx) => {
                                    const shift = getShiftById(entry.shiftTypeId);
                                    if (!shift) return null;
                                    
                                    // If shift color is white (default work shifts), adapt to bg-slate-100 on weekend so the whole row stays consistently light gray
                                    const shiftBg = (!shift.color || shift.color === 'bg-white') && isWknd ? 'bg-slate-100' : (shift.color || 'bg-white');

                                    return (
                                        <div 
                                            key={entry.id} 
                                            className={`
                                                flex-1 w-full flex items-center justify-center text-[10px] leading-none font-bold
                                                ${shiftBg} ${shift.textColor}
                                                ${idx > 0 ? 'border-t border-black/10' : ''}
                                                relative overflow-hidden
                                            `}
                                            title={`${emp.name}${emp.role ? ` • ${emp.role}` : ''}${emp.initials ? ` • Matr. ${emp.initials}` : ''} | Horário: ${shift.label} (${shift.code})${entry.note ? ` - ${entry.note}` : ''}`}
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
                  }))}
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