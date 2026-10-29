import React from 'react';
import { Employee, ScheduleEntry, ShiftType, Selection, AppMode, ScheduleState } from '../types';
import { Lock, Copy, ClipboardPaste, Calendar as CalendarIcon, StickyNote, Plus, ChevronRight, FileText } from 'lucide-react';

interface ScheduleAgendaViewProps {
  days: Date[];
  employees: Employee[];
  shifts: ShiftType[];
  schedule: ScheduleState;
  selections: Selection[];
  mode: AppMode;
  filterEmployeeId?: string;
  selectedEmployeeIds?: string[];
  onCellClick: (dateStr: string, employeeId: string) => void;
  onCopyDay: (dateStr: string) => void;
  onPasteDay: (dateStr: string) => void;
  clipboardDay?: string;
  onOpenDailyReport?: (dateStr: string) => void;
}

const ScheduleAgendaView: React.FC<ScheduleAgendaViewProps> = ({
  days,
  employees,
  shifts,
  schedule,
  filterEmployeeId,
  selectedEmployeeIds = [],
  onCellClick,
  onCopyDay,
  onPasteDay,
  clipboardDay,
  onOpenDailyReport,
}) => {
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

  const todayStr = toISODate(new Date());

  const getDayFullName = (date: Date) => {
    const d = date.toLocaleDateString('pt-PT', { weekday: 'long' });
    return d.charAt(0).toUpperCase() + d.slice(1);
  };

  const scrollToToday = () => {
    const el = document.getElementById(`agenda-day-${todayStr}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Determine effective selected employee IDs
  const effectiveSelectedIds = React.useMemo(() => {
    if (selectedEmployeeIds && selectedEmployeeIds.length > 0) {
      return selectedEmployeeIds;
    }
    if (filterEmployeeId && filterEmployeeId !== 'all') {
      return [filterEmployeeId];
    }
    return [];
  }, [selectedEmployeeIds, filterEmployeeId]);

  const isNoneSelected = effectiveSelectedIds.includes('__NONE__');
  const isSingleEmployee = !isNoneSelected && effectiveSelectedIds.length === 1;
  const targetEmployee = isSingleEmployee ? employees.find(e => e.id === effectiveSelectedIds[0]) : null;

  // Employees to render in team cards
  const visibleEmployees = React.useMemo(() => {
    if (isNoneSelected) return [];
    if (effectiveSelectedIds.length === 0 || effectiveSelectedIds.length === employees.length) {
      return employees;
    }
    const set = new Set(effectiveSelectedIds);
    return employees.filter(e => set.has(e.id));
  }, [employees, effectiveSelectedIds, isNoneSelected]);

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-hidden">
      {/* Quick Jump Bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-white border-b border-slate-200 text-xs">
        <span className="text-slate-500 font-medium">
          {days.length} {days.length === 1 ? 'dia' : 'dias'} na vista móvel
        </span>
        {days.some(d => toISODate(d) === todayStr) && (
          <button
            onClick={scrollToToday}
            className="flex items-center gap-1 text-indigo-600 font-semibold hover:text-indigo-800 active:scale-95 transition-transform"
          >
            <CalendarIcon size={13} />
            Ir para Hoje
          </button>
        )}
      </div>

      {/* Agenda Feed */}
      <div className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-3 custom-scrollbar">
        {days.map((day) => {
          const dateStr = toISODate(day);
          const isWknd = isWeekend(day);
          const isToday = dateStr === todayStr;
          const dayName = getDayFullName(day);

          return (
            <div
              key={dateStr}
              id={`agenda-day-${dateStr}`}
              className={`rounded-xl border transition-all overflow-hidden ${
                isToday 
                  ? 'border-indigo-400 bg-white shadow-md ring-1 ring-indigo-200' 
                  : isWknd 
                    ? 'border-slate-300 bg-slate-100/90 shadow-sm' 
                    : 'border-slate-200 bg-white shadow-sm'
              }`}
            >
              {/* Day Header */}
              <div className={`px-3 py-2 flex items-center justify-between border-b ${
                isWknd ? 'bg-slate-200/70 border-slate-300' : 'bg-slate-50 border-slate-100'
              }`}>
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-lg flex flex-col items-center justify-center font-bold leading-none ${
                    isToday 
                      ? 'bg-indigo-600 text-white' 
                      : isWknd 
                        ? 'bg-slate-300 text-slate-800' 
                        : 'bg-slate-200 text-slate-700'
                  }`}>
                    <span className="text-xs">{day.getDate()}</span>
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold text-slate-800">{dayName}</span>
                      {isToday && (
                        <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.2 rounded font-bold">
                          Hoje
                        </span>
                      )}
                      {isWknd && !isToday && (
                        <span className="text-[10px] bg-slate-300/80 text-slate-700 px-1.5 py-0.2 rounded font-semibold">
                          Fim de Semana
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-500">
                      {day.toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' })}
                    </span>
                  </div>
                </div>

                {/* Day Action Buttons */}
                <div className="flex items-center gap-1">
                  {onOpenDailyReport && (
                    <button
                      onClick={() => onOpenDailyReport(dateStr)}
                      className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-white/80 rounded-lg transition"
                      title="Ver Folha de Serviço Diária (Folha Aprovada)"
                    >
                      <FileText size={15} />
                    </button>
                  )}
                  <button
                    onClick={() => onCopyDay(dateStr)}
                    className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-white/80 rounded-lg transition"
                    title="Copiar dia"
                  >
                    <Copy size={15} />
                  </button>
                  {clipboardDay && (
                    <button
                      onClick={() => onPasteDay(dateStr)}
                      className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition font-medium text-xs flex items-center gap-1"
                      title={`Colar escala de ${clipboardDay}`}
                    >
                      <ClipboardPaste size={15} />
                      <span className="hidden xs:inline">Colar</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Day Content */}
              <div className="p-2 sm:p-3">
                {isSingleEmployee && targetEmployee ? (
                  /* Focused view for single employee */
                  (() => {
                    const entryKey = `${dateStr}_${targetEmployee.id}`;
                    const entries = schedule[entryKey] || [];

                    return (
                      <div className="space-y-2">
                        {/* Employee Details Header Card */}
                        <div className="flex items-center justify-between px-3 py-1.5 bg-slate-100 rounded-lg border border-slate-200 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800">{targetEmployee.name}</span>
                            {targetEmployee.role && (
                              <span className="px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-semibold">
                                {targetEmployee.role}
                              </span>
                            )}
                          </div>
                          {targetEmployee.initials && (
                            <span className="font-mono text-[10px] text-slate-500 font-medium">
                              Matr. {targetEmployee.initials}
                            </span>
                          )}
                        </div>

                        <div
                          onClick={() => onCellClick(dateStr, targetEmployee.id)}
                          className="cursor-pointer active:scale-[0.99] transition-transform"
                        >
                          {entries.length === 0 ? (
                            <div className="flex items-center justify-between p-3 rounded-lg border border-dashed border-slate-300 bg-slate-50/50 hover:bg-slate-100/50 text-slate-400">
                              <span className="text-xs font-medium">Sem serviço / Folga</span>
                              <span className="text-xs text-indigo-600 font-semibold flex items-center gap-1">
                                <Plus size={14} /> Atribuir
                              </span>
                            </div>
                          ) : (
                            <div className="space-y-1.5">
                              {entries.map(entry => {
                                const shift = getShiftById(entry.shiftTypeId);
                                if (!shift) return null;

                                return (
                                  <div
                                    key={entry.id}
                                    className={`p-3 rounded-lg flex items-center justify-between ${shift.color} border border-black/5 shadow-sm`}
                                  >
                                    <div className="flex items-center gap-2.5">
                                      <span className={`text-sm font-black px-2 py-1 rounded bg-black/10 ${shift.textColor}`}>
                                        {shift.code}
                                      </span>
                                      <div>
                                        <p className={`text-xs font-bold leading-tight ${shift.textColor}`}>
                                          {shift.label}
                                        </p>
                                        {entry.note && (
                                          <p className="text-[11px] opacity-80 flex items-center gap-1 mt-0.5">
                                            <StickyNote size={11} /> {entry.note}
                                          </p>
                                        )}
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-1.5">
                                      {entry.isSwap && (
                                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-600 text-white">
                                          Troca
                                        </span>
                                      )}
                                      {entry.isExchange && (
                                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-orange-500 text-white">
                                          Permuta
                                        </span>
                                      )}
                                      {entry.isLocked && (
                                        <Lock size={12} className="opacity-70" />
                                      )}
                                      <ChevronRight size={16} className="opacity-50" />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  /* Team view: structured by FUNÇÃO (role) and HORÁRIO */
                  visibleEmployees.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                      Nenhum funcionário selecionado no filtro.
                    </div>
                  ) : (
                    (() => {
                      // Group visible employees by Função (emp.role)
                      const groupsMap = new Map<string, Employee[]>();
                      visibleEmployees.forEach(emp => {
                        const role = emp.role?.trim() || 'Geral';
                        if (!groupsMap.has(role)) groupsMap.set(role, []);
                        groupsMap.get(role)!.push(emp);
                      });

                      // Sort function groups
                      const sortedGroups = Array.from(groupsMap.entries());

                      return (
                        <div className="space-y-3">
                          {sortedGroups.map(([roleName, groupEmployees]) => {
                            // Sort employees in this function by Horário (working shifts first) then Matrícula then Nome
                            const sortedGroupEmployees = [...groupEmployees].sort((a, b) => {
                              const entriesA = schedule[`${dateStr}_${a.id}`] || [];
                              const entriesB = schedule[`${dateStr}_${b.id}`] || [];
                              const shiftA = entriesA[0] ? getShiftById(entriesA[0].shiftTypeId) : undefined;
                              const shiftB = entriesB[0] ? getShiftById(entriesB[0].shiftTypeId) : undefined;
                              
                              const isOffA = !shiftA || shiftA.isOffDay;
                              const isOffB = !shiftB || shiftB.isOffDay;

                              if (isOffA !== isOffB) {
                                return isOffA ? 1 : -1;
                              }
                              // Compare shift code / horario
                              const codeA = shiftA?.code || '';
                              const codeB = shiftB?.code || '';
                              if (codeA !== codeB) {
                                return codeA.localeCompare(codeB);
                              }
                              // Matrícula
                              const mA = a.initials || '';
                              const mB = b.initials || '';
                              if (mA !== mB) {
                                return mA.localeCompare(mB);
                              }
                              return a.name.localeCompare(b.name);
                            });

                            return (
                              <div key={roleName} className="space-y-1">
                                {/* Função Section Header */}
                                <div className="flex items-center justify-between px-2 py-0.5 bg-slate-100/80 rounded border-l-2 border-indigo-500 text-[11px] font-bold text-slate-700">
                                  <span>{roleName}</span>
                                  <span className="text-[10px] text-slate-500 font-normal">
                                    {sortedGroupEmployees.length} {sortedGroupEmployees.length === 1 ? 'efectivo' : 'efectivos'}
                                  </span>
                                </div>

                                {/* Cards in this function */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1.5">
                                  {sortedGroupEmployees.map(emp => {
                                    const entryKey = `${dateStr}_${emp.id}`;
                                    const entries = schedule[entryKey] || [];

                                    return (
                                      <div
                                        key={emp.id}
                                        onClick={() => onCellClick(dateStr, emp.id)}
                                        className={`flex items-center justify-between p-2 rounded-lg border cursor-pointer transition-all ${
                                          isWknd 
                                            ? 'border-slate-300/80 bg-slate-100 hover:bg-slate-200/60' 
                                            : 'border-slate-200/80 bg-white hover:border-indigo-300 hover:shadow-xs active:bg-slate-50'
                                        }`}
                                      >
                                        <div className="flex flex-col min-w-0 pr-1">
                                          {/* NOME */}
                                          <span className="text-xs font-bold text-slate-800 truncate">
                                            {emp.name}
                                          </span>
                                          {/* MATRÍCULA & FUNÇÃO */}
                                          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-0.5">
                                            {emp.initials && (
                                              <span className="font-mono bg-slate-100 px-1 py-0.2 rounded text-[9px] font-semibold text-slate-700">
                                                Matr. {emp.initials}
                                              </span>
                                            )}
                                          </div>
                                        </div>

                                        {/* HORÁRIO */}
                                        <div className="flex items-center gap-1 shrink-0 ml-2">
                                          {entries.length === 0 ? (
                                            <span className={`text-xs px-2 py-0.5 ${isWknd ? 'text-slate-400 font-medium' : 'text-slate-300'}`}>-</span>
                                          ) : (
                                            entries.map(entry => {
                                              const shift = getShiftById(entry.shiftTypeId);
                                              if (!shift) return null;
                                              const shiftBg = (!shift.color || shift.color === 'bg-white') && isWknd 
                                                ? 'bg-slate-200 text-slate-800' 
                                                : `${shift.color} ${shift.textColor}`;
                                              return (
                                                <div key={entry.id} className="flex flex-col items-end">
                                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded shadow-xs ${shiftBg}`}>
                                                    {shift.code}
                                                  </span>
                                                  {entry.note && (
                                                    <span className="text-[9px] text-slate-500 font-medium truncate max-w-[80px]">
                                                      {entry.note}
                                                    </span>
                                                  )}
                                                </div>
                                              );
                                            })
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()
                  )
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ScheduleAgendaView;
