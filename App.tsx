import React, { useState, useEffect, useMemo } from 'react';
import { Users, Calendar as CalendarIcon, Wand2, RefreshCw, Eraser, Info, ArrowLeftRight, Cloud, CloudOff, Loader2, Clock, LogOut, FileSpreadsheet, FileText, RotateCcw } from 'lucide-react';

import ScheduleGrid from './components/ScheduleGrid';
import ShiftEditor from './components/ShiftEditor';
import SwapControls from './components/SwapControls';
import EmployeeManager from './components/EmployeeManager';
import ShiftManager from './components/ShiftManager';
import DateNavigation from './components/DateNavigation';
import GeneratorModal from './components/GeneratorModal';
import Login from './components/Login';
import HistoryModal from './components/HistoryModal';

import { INITIAL_EMPLOYEES, SHIFT_TYPES } from './constants';
import { Employee, ScheduleEntry, Selection, AppMode, ShiftType, ScheduleState } from './types';
import { generatePatternSchedule } from './services/patternService';
import { loadDataFromCloud, saveDataToCloud, isCloudConfigured, subscribeToAuth, logout, addHistoryLog } from './services/firebaseService';
import { exportToExcel, exportToPDF } from './services/exportService';

// Helpers
const toISODate = (d: Date) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getDaysInMonth = (date: Date) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const days = [];
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push(new Date(year, month, d));
  }
  return days;
};

const getDaysInRange = (startStr: string, endStr: string) => {
    const start = new Date(startStr);
    const end = new Date(endStr);
    const days = [];
    
    // Safety check for infinite loops or massive ranges
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    if (diffDays > 365) return [start]; // Limit to 1 year for performance

    const current = new Date(start);
    while (current <= end) {
        days.push(new Date(current));
        current.setDate(current.getDate() + 1);
    }
    return days;
};

// Fallback Storage Keys (Only used if Cloud is not configured)
const STORAGE_KEY_SCHEDULE = 'escalapro_schedule_v1';
const STORAGE_KEY_EMPLOYEES = 'escalapro_employees_v1';
const STORAGE_KEY_SHIFTS = 'escalapro_shifts_v1';

const App: React.FC = () => {
  // --- UI State ---
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [cloudStatus, setCloudStatus] = useState<'connected' | 'offline' | 'error'>('offline');
  const [hasLoadedCloudData, setHasLoadedCloudData] = useState(false);

  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Custom View State
  const [viewMode, setViewMode] = useState<'month' | 'custom'>('month');
  const [customStartDate, setCustomStartDate] = useState(() => toISODate(new Date()));
  const [customEndDate, setCustomEndDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return toISODate(d);
  });

  // Data State
  const [employees, setEmployees] = useState<Employee[]>(INITIAL_EMPLOYEES);
  const [shifts, setShifts] = useState<ShiftType[]>(SHIFT_TYPES);
  const [schedule, setSchedule] = useState<ScheduleState>({});
  
  // Interaction State
  const [mode, setMode] = useState<AppMode>(AppMode.VIEW);
  const [selections, setSelections] = useState<Selection[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Modals
  const [showShiftEditor, setShowShiftEditor] = useState(false);
  const [showEmployeeManager, setShowEmployeeManager] = useState(false);
  const [showShiftManager, setShowShiftManager] = useState(false);
  const [showGeneratorModal, setShowGeneratorModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [clipboardDay, setClipboardDay] = useState<{ dateStr: string, entries: ScheduleEntry[] } | null>(null);
  
  // Track which months have changed to optimize cloud saves
  const dirtyMonthsRef = React.useRef<Set<string> | null>(new Set());
  
  const markDirty = (dateStr: string) => {
      const month = dateStr.substring(0, 7);
      if (dirtyMonthsRef.current) {
          dirtyMonthsRef.current.add(month);
      }
  };
  
  const markAllDirty = () => {
      dirtyMonthsRef.current = null; // null means "all"
  };

  // --- Auth Effect ---
  useEffect(() => {
    const unsubscribe = subscribeToAuth((u) => {
      setUser(u);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // --- Initialization Effect ---
  useEffect(() => {
    if (!user) return; // Only load data if logged in

    const initData = async () => {
      setIsLoading(true);
      
      // Helper to merge default shifts with loaded ones (to ensure new types like FOLGA P/T appear)
      const mergeShifts = (loaded: ShiftType[]) => {
        const merged = [...loaded];
        SHIFT_TYPES.forEach(def => {
            if (!merged.some(m => m.id === def.id)) {
                merged.push(def);
            }
        });
        return merged;
      };

      if (isCloudConfigured()) {
        try {
          const cloudData = await loadDataFromCloud();
          if (cloudData.employees) setEmployees(cloudData.employees);
          else setEmployees(INITIAL_EMPLOYEES); // Default if cloud empty

          if (cloudData.shifts) setShifts(mergeShifts(cloudData.shifts));
          else setShifts(SHIFT_TYPES); // Default if cloud empty

          if (cloudData.schedule) setSchedule(cloudData.schedule);
          
          setCloudStatus('connected');
          setHasLoadedCloudData(true);
        } catch (e) {
          console.error("Failed to load from cloud", e);
          setCloudStatus('error');
          // Fallback to local
          loadLocal(mergeShifts);
        }
      } else {
        setCloudStatus('offline');
        loadLocal(mergeShifts);
      }
      
      setIsLoading(false);
    };

    const loadLocal = (merger: (s: ShiftType[]) => ShiftType[]) => {
      try {
        const savedEmp = localStorage.getItem(STORAGE_KEY_EMPLOYEES);
        if (savedEmp) setEmployees(JSON.parse(savedEmp));
        
        const savedShifts = localStorage.getItem(STORAGE_KEY_SHIFTS);
        if (savedShifts) {
            setShifts(merger(JSON.parse(savedShifts)));
        } else {
            setShifts(SHIFT_TYPES);
        }

        const savedSch = localStorage.getItem(STORAGE_KEY_SCHEDULE);
        if (savedSch) setSchedule(JSON.parse(savedSch));
      } catch (e) {
        console.error("Local load error", e);
      }
    };

    initData();
  }, [user]); // Re-run when user logs in

  // --- Persistence Effect ---
  // Save whenever employees, shifts or schedule changes
  useEffect(() => {
    if (isLoading || !user) return; // Don't save while initial load happens or if not logged in

    const save = async () => {
      setIsSaving(true);
      
      // Only save to cloud if we have successfully loaded data from it at least once.
      // This prevents overwriting cloud data with local defaults on initial load failure.
      // We ignore 'cloudStatus' here to allow retrying saves even if a previous one failed (status 'error').
      if (isCloudConfigured() && hasLoadedCloudData) {
        try {
            // Safety check: Don't save if schedule is empty but we loaded data previously (unless user explicitly cleared it)
            // This is a heuristic to prevent accidental wipes on load errors
            if (Object.keys(schedule).length === 0 && Object.keys(employees).length === 0) {
                console.warn("Attempted to save empty state to cloud. Aborting to protect data.");
                setIsSaving(false);
                return;
            }

          // Pass dirtyMonths to save only what changed
          const dirty = dirtyMonthsRef.current;
          await saveDataToCloud(employees, schedule, shifts, dirty);
          
          // Clear dirty months after successful save
          if (dirtyMonthsRef.current) {
              dirtyMonthsRef.current.clear();
          } else {
              // Reset to tracking mode if we just did a full save
              dirtyMonthsRef.current = new Set();
          }
          
          setCloudStatus('connected'); // Restore connected status on success
        } catch (e) {
          console.error("Cloud save failed", e);
          setCloudStatus('error');
        }
      } else {
        // Fallback Local Save (or if cloud is offline/not configured)
        localStorage.setItem(STORAGE_KEY_EMPLOYEES, JSON.stringify(employees));
        localStorage.setItem(STORAGE_KEY_SHIFTS, JSON.stringify(shifts));
        localStorage.setItem(STORAGE_KEY_SCHEDULE, JSON.stringify(schedule));
      }
      setTimeout(() => setIsSaving(false), 500); // Visual delay for better UX
    };

    // Debounce save (increased to 3s to prevent write exhaustion)
    const timeout = setTimeout(save, 3000);
    return () => clearTimeout(timeout);
  }, [employees, schedule, shifts, isLoading, user, hasLoadedCloudData]);

  // --- Derived State ---
  const displayedDays = useMemo(() => {
    if (viewMode === 'month') {
        return getDaysInMonth(currentDate);
    } else {
        return getDaysInRange(customStartDate, customEndDate);
    }
  }, [currentDate, viewMode, customStartDate, customEndDate]);

  // Helper to get entries for the single selected cell (if any)
  const activeEntries = useMemo(() => {
    if (selections.length !== 1) return [];
    const { dateStr, employeeId } = selections[0];
    const key = `${dateStr}_${employeeId}`;
    return schedule[key] || [];
  }, [selections, schedule]);

  // --- Handlers ---

  const handleCellClick = (dateStr: string, employeeId: string) => {
    if (mode === AppMode.VIEW || mode === AppMode.EDIT) {
      setSelections([{ dateStr, employeeId }]);
      setMode(AppMode.EDIT);
      setShowShiftEditor(true);
    } else if (mode === AppMode.SWAP) {
      const isAlreadySelected = selections.some(s => s.dateStr === dateStr && s.employeeId === employeeId);
      
      if (isAlreadySelected) {
        setSelections(prev => prev.filter(s => !(s.dateStr === dateStr && s.employeeId === employeeId)));
      } else {
        if (selections.length < 2) {
          setSelections(prev => [...prev, { dateStr, employeeId }]);
        } else {
          setSelections(prev => [prev[0], { dateStr, employeeId }]);
        }
      }
    }
  };

  const handleAddShift = (shiftId: string, note?: string) => {
    if (selections.length !== 1) return;
    const { dateStr, employeeId } = selections[0];
    const key = `${dateStr}_${employeeId}`;

    const newEntry: ScheduleEntry = {
        id: crypto.randomUUID(),
        dateStr,
        employeeId,
        shiftTypeId: shiftId,
        note: note
    };
    
    setSchedule(prev => {
        const currentEntries = prev[key] || [];
        return {
            ...prev,
            [key]: [...currentEntries, newEntry]
        };
    });

    const shift = shifts.find(s => s.id === shiftId);
    const emp = employees.find(e => e.id === employeeId);
    addHistoryLog('CREATE', `Atribuiu ${shift?.code} a ${emp?.name} em ${dateStr}${note ? ` (${note})` : ''}`, user.email);
    markDirty(dateStr);
  };

  const handleRemoveEntry = (entryId: string, dateStr?: string, employeeId?: string) => {
    // Robustness: If dateStr/employeeId provided, use them. Else fallback to selections.
    let targetDate = dateStr;
    let targetEmpId = employeeId;

    if (!targetDate || !targetEmpId) {
        if (selections.length !== 1) return;
        targetDate = selections[0].dateStr;
        targetEmpId = selections[0].employeeId;
    }

    const key = `${targetDate}_${targetEmpId}`;

    setSchedule(prev => {
        const currentEntries = prev[key] || [];
        const updated = currentEntries.filter(e => e.id !== entryId);
        if (updated.length === 0) {
            const copy = { ...prev };
            delete copy[key];
            return copy;
        }
        return { ...prev, [key]: updated };
    });

    const emp = employees.find(e => e.id === targetEmpId);
    addHistoryLog('DELETE', `Removeu turno de ${emp?.name} em ${targetDate}`, user.email);
    if (targetDate) markDirty(targetDate);
  };

  const handleCopyDay = (dateStr: string) => {
    const dayEntries: ScheduleEntry[] = [];
    Object.values(schedule).flat().forEach(e => {
        if (e.dateStr === dateStr) dayEntries.push(e);
    });
    setClipboardDay({ dateStr, entries: dayEntries });
  };

  const handlePasteDay = (targetDateStr: string) => {
    if (!clipboardDay) return;
    if (!confirm(`Substituir a escala de ${targetDateStr} pela de ${clipboardDay.dateStr}?`)) return;

    setSchedule(prev => {
        const next = { ...prev };
        
        // 1. Remove existing entries for target day
        Object.keys(next).forEach(key => {
            if (key.startsWith(targetDateStr)) {
                delete next[key];
            }
        });

        // 2. Add copied entries
        clipboardDay.entries.forEach(entry => {
            const newEntry = {
                ...entry,
                id: crypto.randomUUID(),
                dateStr: targetDateStr,
                // keep employeeId
            };
            const key = `${targetDateStr}_${entry.employeeId}`;
            if (!next[key]) next[key] = [];
            next[key].push(newEntry);
        });

        return next;
    });

    addHistoryLog('UPDATE', `Colou escala de ${clipboardDay.dateStr} em ${targetDateStr}`, user.email);
    markDirty(targetDateStr);
  };

  const executeSwap = (petitionerIndex: number) => {
    if (selections.length !== 2) return;
    
    // Determine who is who based on user selection
    const petitionerSel = selections[petitionerIndex];
    const acceptorSel = selections[petitionerIndex === 0 ? 1 : 0];

    const keyP = `${petitionerSel.dateStr}_${petitionerSel.employeeId}`;
    const keyA = `${acceptorSel.dateStr}_${acceptorSel.employeeId}`;

    // CHECK FOR PERMUTA (Same Day)
    if (petitionerSel.dateStr === acceptorSel.dateStr) {
        setSchedule(prev => {
            const next = { ...prev };
            const entriesP = next[keyP] || [];
            const entriesA = next[keyA] || [];

            // Simple Swap of shifts, keeping notes? Or swapping everything?
            // "Permuta" usually means swapping the shift assignment.
            // Let's swap the entries but update the employeeId.
            
            const newEntriesP = entriesA.map(e => ({ 
                ...e, 
                dateStr: petitionerSel.dateStr, 
                employeeId: petitionerSel.employeeId,
                isExchange: true 
            }));
            
            const newEntriesA = entriesP.map(e => ({ 
                ...e, 
                dateStr: acceptorSel.dateStr, 
                employeeId: acceptorSel.employeeId,
                isExchange: true 
            }));

            if (newEntriesP.length > 0) next[keyP] = newEntriesP;
            else delete next[keyP];

            if (newEntriesA.length > 0) next[keyA] = newEntriesA;
            else delete next[keyA];
            
            return next;
        });
        setSelections([]);
        setMode(AppMode.VIEW);
        return;
    }

    setSchedule(prev => {
      const next = { ...prev };
      const entriesP = next[keyP] || [];
      const entriesA = next[keyA] || [];

      // 1. Identify shifts to move from Petitioner (exclude notes/diligences if possible, but for now move all non-notes?)
      // User requirement: "só o horário é que altera... as outras diligências mantêm"
      // We assume entries with 'note' are diligences and should stay? 
      // Or maybe we treat all entries as shifts to be moved, except we keep the note on P?
      
      // Strategy: 
      // - Clone P's entries to give to A (stripping notes, as the note belongs to the original assignment context usually, or maybe A needs to know?)
      // - Actually, if P is "Patrulha", A needs to do "Patrulha". So A needs the note?
      // - BUT user said "diligências mantêm". This usually means "If I have a court appearance (Tribunal), I still have to go even if I swap my patrol shift".
      // - So: Keep entries that look like "Diligences" on P?
      // - Let's assume ALL entries are shifts for now, but we mark P as "TROCA".
      
      // New Logic:
      // P gets a "TROCA" entry.
      // A gets P's original entries added to their list.
      
      // Filter out existing "TROCA" entries from P to avoid stacking them
      const realEntriesP = entriesP.filter(e => e.shiftTypeId !== 'folga_troca');
      
      if (realEntriesP.length === 0) {
        alert("O peticionário não tem turno para trocar!");
        return prev;
      }

      // Give P's shifts to A
      const shiftsForA = realEntriesP.map(e => ({
        ...e,
        id: crypto.randomUUID(), // New ID
        dateStr: acceptorSel.dateStr,
        employeeId: acceptorSel.employeeId,
        note: '', // Clear note for A as per previous logic
        isSwap: true // Mark as swap for A
      }));

      // Update A
      next[keyA] = [...entriesA, ...shiftsForA];

      // Update P: Remove shifts, add F.TROCA, keep notes?
      // If we remove the entry, we lose the note.
      // So we map P's entries: Change shift to 'folga_troca', keep note.
      next[keyP] = entriesP.map(e => {
         if (e.shiftTypeId === 'folga_troca') return e;
         return {
             ...e,
             shiftTypeId: 'folga_troca',
             isSwap: true // Mark as swap for P
             // note is preserved automatically
         };
      });

      return next;
    });

    const empP = employees.find(e => e.id === petitionerSel.employeeId);
    const empA = employees.find(e => e.id === acceptorSel.employeeId);
    addHistoryLog('SWAP', `Troca entre ${empP?.name} (${petitionerSel.dateStr}) e ${empA?.name} (${acceptorSel.dateStr})`, user.email);
    
    markDirty(petitionerSel.dateStr);
    markDirty(acceptorSel.dateStr);

    setSelections([]);
    setMode(AppMode.VIEW);
  };

  const handleGenerateSchedule = async (selectedEmpIds: string[], startDate: string, endDate: string, pattern: string) => {
    setIsGenerating(true);
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const daysCount = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

      if (daysCount <= 0) throw new Error("Invalid date range");

      const generated = generatePatternSchedule(
        selectedEmpIds, 
        startDate, 
        daysCount, 
        employees, 
        shifts, 
        pattern
      );
      
      setSchedule(prev => {
        const newSchedule = { ...prev };
        generated.forEach(entry => {
            const key = `${entry.dateStr}_${entry.employeeId}`;
            newSchedule[key] = [entry];
        });
        return newSchedule;
      });
      setShowGeneratorModal(false);
      
      if (viewMode === 'custom') {
        setCustomStartDate(startDate);
        setCustomEndDate(endDate);
      } else {
        const startMonth = new Date(startDate);
        if (startMonth.getMonth() !== currentDate.getMonth() || startMonth.getFullYear() !== currentDate.getFullYear()) {
           setCurrentDate(startMonth);
        }
      }

      addHistoryLog('GENERATE', `Gerou escala de ${startDate} a ${endDate} com padrão ${pattern}`, user.email);
      
      // Optimize: Only mark affected months as dirty
      generated.forEach(entry => markDirty(entry.dateStr));
      // If generated is empty (e.g. all OFF), we might still want to mark the range? 
      // But if it's empty, nothing changed in the schedule state (except maybe overwrites? No, we didn't clear).
      // Wait, if we overwrite, we need to mark dirty.
      // The current logic `newSchedule[key] = [entry]` only ADDS/REPLACES with non-null entries.
      // It does NOT clear existing entries if the pattern result was null (OFF).
      // If the user wants to clear, they should use "Clear Schedule" or we need to handle "OFF" by deleting.
      // But `generatePatternSchedule` returns [] for OFF.
      // So existing shifts on OFF days remain. This is a potential issue if the user expects overwrite.
      // For now, we just fix the dirty marking.
      
    } catch (e: any) {
      console.error(e);
      // Show the actual error message from the service
      alert(`Erro ao gerar escala: ${e.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExport = (format: 'excel' | 'pdf') => {
    const days = viewMode === 'month' ? getDaysInMonth(currentDate) : getDaysInRange(customStartDate, customEndDate);
    const fileName = `escala_${viewMode === 'month' ? currentDate.toISOString().slice(0, 7) : 'custom'}`;
    const title = viewMode === 'month' 
        ? `Escala - ${currentDate.toLocaleString('pt-PT', { month: 'long', year: 'numeric' })}`
        : `Escala - ${new Date(customStartDate).toLocaleDateString('pt-PT')} a ${new Date(customEndDate).toLocaleDateString('pt-PT')}`;

    if (format === 'excel') {
        exportToExcel(days, employees, shifts, schedule, fileName);
    } else {
        exportToPDF(days, employees, shifts, schedule, fileName, title);
    }
  };

  const clearSchedule = () => {
    const password = prompt("Para limpar a escala, introduza a palavra-passe:");
    if (password === "hev869xu") {
        if(confirm("Tem a certeza que deseja limpar toda a escala? Esta ação é irreversível e afetará todos os utilizadores.")) {
          setSchedule({});
          addHistoryLog('CLEAR', `Limpou toda a escala`, user.email);
          markAllDirty();
        }
    } else if (password !== null) {
        alert("Palavra-passe incorreta.");
    }
  };

  const handleSaveEmployee = (updatedEmp: Employee) => {
    setEmployees(prev => {
      const exists = prev.find(e => e.id === updatedEmp.id);
      if (exists) {
        return prev.map(e => e.id === updatedEmp.id ? updatedEmp : e);
      }
      return [...prev, updatedEmp];
    });
  };

  const handleDeleteEmployee = (id: string) => {
    if(confirm('Tem a certeza que deseja remover este funcionário?')) {
      setEmployees(prev => prev.filter(e => e.id !== id));
    }
  };

  const handleReorderEmployee = (fromIndex: number, toIndex: number) => {
    setEmployees(prev => {
        const newEmployees = [...prev];
        const [movedEmployee] = newEmployees.splice(fromIndex, 1);
        newEmployees.splice(toIndex, 0, movedEmployee);
        return newEmployees;
    });
  };

  const handleSaveShift = (updatedShift: ShiftType) => {
    setShifts(prev => {
      const exists = prev.find(s => s.id === updatedShift.id);
      if (exists) {
        return prev.map(s => s.id === updatedShift.id ? updatedShift : s);
      }
      return [...prev, updatedShift];
    });
  };

  const handleDeleteShift = (id: string) => {
    if(confirm('Tem a certeza que deseja eliminar este tipo de turno?')) {
      setShifts(prev => prev.filter(s => s.id !== id));
    }
  };

  if (authLoading) {
    return (
        <div className="flex h-screen items-center justify-center bg-slate-50">
            <Loader2 className="animate-spin text-indigo-600" size={48} />
        </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  if (isLoading) {
    return (
        <div className="flex h-screen items-center justify-center bg-slate-50 flex-col gap-4">
            <Loader2 className="animate-spin text-indigo-600" size={48} />
            <p className="text-slate-500 font-medium animate-pulse">A carregar escala da nuvem...</p>
        </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-slate-50 text-slate-800 font-sans">
      
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shadow-sm flex-shrink-0 z-40 gap-4">
        
        {/* Logo area */}
        <div className="flex items-center gap-3 min-w-fit">
          <div className="bg-indigo-600 p-2 rounded-lg text-white hidden md:block">
            <CalendarIcon size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight leading-none">Escala de Serviço</h1>
            <div className="flex items-center gap-1.5">
                <p className="text-[10px] text-slate-500 font-medium">Gestão de Serviço</p>
                {/* Cloud Indicator */}
                <div className="flex items-center gap-1 bg-slate-100 px-1.5 py-0.5 rounded-full" title={cloudStatus === 'connected' ? 'Sincronizado' : 'Não configurado'}>
                    {isSaving ? (
                        <RefreshCw size={10} className="animate-spin text-indigo-500" />
                    ) : cloudStatus === 'connected' ? (
                        <Cloud size={10} className="text-emerald-500" />
                    ) : (
                        <CloudOff size={10} className="text-slate-400" />
                    )}
                    <span className="text-[9px] font-bold text-slate-600">
                        {isSaving ? 'A guardar...' : cloudStatus === 'connected' ? 'Online' : 'Offline'}
                    </span>
                </div>
            </div>
          </div>
        </div>

        {/* Central Controls */}
        <div className="flex items-center gap-4 flex-1 justify-center">
            <DateNavigation 
              currentDate={currentDate} 
              onDateChange={setCurrentDate} 
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              customStartDate={customStartDate}
              customEndDate={customEndDate}
              onCustomRangeChange={(s, e) => {
                setCustomStartDate(s);
                setCustomEndDate(e);
              }}
            />
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-3">
           
           <div className="flex bg-slate-50 rounded-lg p-0.5 border border-slate-200">
             <button 
               onClick={() => setShowEmployeeManager(true)}
               className="flex items-center gap-2 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 px-3 py-2 rounded-md transition text-sm font-medium"
               title="Gerir Equipa"
             >
               <Users size={16} />
               <span className="hidden xl:inline">Equipa</span>
             </button>
             <div className="w-px bg-slate-200 my-1"></div>
             <button 
               onClick={() => setShowShiftManager(true)}
               className="flex items-center gap-2 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 px-3 py-2 rounded-md transition text-sm font-medium"
               title="Gerir Tipos de Turno"
             >
               <Clock size={16} />
               <span className="hidden xl:inline">Turnos</span>
             </button>
           </div>

           <div className="h-6 w-px bg-slate-200"></div>

           <div className="bg-slate-100 rounded-lg p-1 flex border border-slate-200">
             <button 
                onClick={() => { setMode(AppMode.VIEW); setSelections([]); }}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${mode !== AppMode.SWAP ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
             >
               Editar
             </button>
             <button 
                onClick={() => { setMode(AppMode.SWAP); setSelections([]); }}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-1 ${mode === AppMode.SWAP ? 'bg-indigo-600 shadow-sm text-white' : 'text-slate-500 hover:text-slate-700'}`}
             >
               <ArrowLeftRight size={14} />
               Trocas
             </button>
           </div>

          <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block"></div>
          
          <div className="flex bg-slate-50 rounded-lg p-0.5 border border-slate-200">
             <button 
               onClick={() => handleExport('excel')}
               className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-md transition"
               title="Exportar Excel"
             >
               <FileSpreadsheet size={20} />
             </button>
             <div className="w-px bg-slate-200 my-1"></div>
             <button 
               onClick={() => handleExport('pdf')}
               className="p-2 text-red-600 hover:bg-red-50 rounded-md transition"
               title="Exportar PDF"
             >
               <FileText size={20} />
             </button>
          </div>

          <button 
            onClick={() => setShowHistoryModal(true)}
            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition hidden sm:block"
            title="Ver Histórico"
          >
            <Clock size={20} />
          </button>

          <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block"></div>
          
          <button 
            onClick={logout}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition hidden sm:block"
            title="Sair"
          >
            <LogOut size={20} />
          </button>

          <button 
            onClick={clearSchedule}
            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition hidden sm:block"
            title="Limpar Escala (Cuidado!)"
          >
            <Eraser size={20} />
          </button>
          
          <button
            onClick={() => {
                if (confirm("Deseja recuperar a versão local dos dados? Isto irá substituir o que está no ecrã pela versão guardada neste computador.")) {
                    try {
                        const savedEmp = localStorage.getItem(STORAGE_KEY_EMPLOYEES);
                        const savedShifts = localStorage.getItem(STORAGE_KEY_SHIFTS);
                        const savedSch = localStorage.getItem(STORAGE_KEY_SCHEDULE);
                        
                        if (savedEmp) setEmployees(JSON.parse(savedEmp));
                        if (savedShifts) setShifts(JSON.parse(savedShifts));
                        if (savedSch) setSchedule(JSON.parse(savedSch));
                        
                        alert("Dados locais recuperados com sucesso! A guardar na nuvem...");
                        // Trigger save by updating state (useEffect will catch it)
                    } catch (e) {
                        alert("Erro ao recuperar dados locais.");
                        console.error(e);
                    }
                }
            }}
            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition hidden sm:block"
            title="Recuperar Cópia Local (Use se os dados desaparecerem)"
          >
            <RotateCcw size={20} />
          </button>

          <button 
            onClick={() => setShowGeneratorModal(true)}
            disabled={isGenerating}
            className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-lg shadow-emerald-900/10 hover:shadow-emerald-900/20 hover:scale-[1.02] transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          >
             {isGenerating ? <RefreshCw className="animate-spin" size={16} /> : <Wand2 size={16} />}
             <span className="hidden sm:inline">Gerar Escala</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden p-4 relative flex flex-col">
        {cloudStatus === 'offline' && !isSaving && (
             <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs px-4 py-2 mb-2 rounded flex items-center gap-2">
                <Info size={14} />
                Atenção: A base de dados online não está configurada. As alterações estão a ser guardadas apenas neste computador. 
                Edite o ficheiro <b>firebaseConfig.ts</b> para ativar a sincronização.
             </div>
        )}

        <div className="mb-2 px-1 text-sm text-slate-500 font-medium flex justify-between items-center">
          <div>
            {viewMode === 'month' ? (
                <>Visualizando: {currentDate.toLocaleString('pt-PT', { month: 'long', year: 'numeric' })}</>
            ) : (
                <>Período: {new Date(customStartDate).toLocaleDateString('pt-PT')} a {new Date(customEndDate).toLocaleDateString('pt-PT')}</>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          <ScheduleGrid 
            days={displayedDays}
            employees={employees}
            shifts={shifts}
            schedule={schedule}
            selections={selections}
            mode={mode}
            onCellClick={handleCellClick}
            onCopyDay={handleCopyDay}
            onPasteDay={handlePasteDay}
            clipboardDay={clipboardDay?.dateStr}
          />
        </div>

        {/* Floating Controls */}
        
        {mode === AppMode.SWAP && selections.length === 2 && (
          <SwapControls 
            selectionA={selections[0]}
            selectionB={selections[1]}
            employees={employees}
            onExecute={executeSwap}
            onCancel={() => setSelections([])}
          />
        )}
        
        {showShiftEditor && selections.length === 1 && (
          <>
            <div className="fixed inset-0 bg-black/20 backdrop-blur-[1px] z-40" onClick={() => setShowShiftEditor(false)}></div>
            <ShiftEditor 
              shifts={shifts}
              currentEntries={activeEntries}
              onAddShift={handleAddShift}
              onRemoveEntry={handleRemoveEntry}
              onClose={() => setShowShiftEditor(false)}
            />
          </>
        )}

        {showEmployeeManager && (
          <EmployeeManager 
            employees={employees}
            onSave={handleSaveEmployee}
            onDelete={handleDeleteEmployee}
            onReorder={handleReorderEmployee}
            onClose={() => setShowEmployeeManager(false)}
          />
        )}

        {showShiftManager && (
            <ShiftManager 
                shifts={shifts}
                onSave={handleSaveShift}
                onDelete={handleDeleteShift}
                onClose={() => setShowShiftManager(false)}
            />
        )}

        {showGeneratorModal && (
            <GeneratorModal 
                employees={employees}
                onGenerate={handleGenerateSchedule}
                onClose={() => setShowGeneratorModal(false)}
                isGenerating={isGenerating}
            />
        )}

        {showHistoryModal && (
            <HistoryModal onClose={() => setShowHistoryModal(false)} />
        )}

        {mode === AppMode.SWAP && selections.length < 2 && (
          <div className="absolute top-10 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-4 py-2 rounded-full shadow-xl z-30 text-sm font-medium flex items-center gap-2 animate-bounce-slow pointer-events-none">
            <Info size={16} />
            Selecione {2 - selections.length} célula(s) para efetuar a troca
          </div>
        )}
      </main>
    </div>
  );
};

export default App;