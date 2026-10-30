import React, { useState, useMemo } from 'react';
import { 
  X, 
  Printer, 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  FileText, 
  Clock, 
  Users, 
  Download,
  Search,
  CheckCircle2,
  FileSpreadsheet
} from 'lucide-react';
import { utils, writeFile } from 'xlsx';
import { Employee, ShiftType, ScheduleState, ScheduleEntry } from '../types';
import { getEmployeeCategory } from '../constants';
import { exportDailyScheduleToPDF } from '../services/exportService';

interface DailyScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDate?: string; // YYYY-MM-DD
  employees: Employee[];
  shifts: ShiftType[];
  schedule: ScheduleState;
}

// Helpers
const toISODate = (d: Date) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getPortugueseDayOfWeek = (dateStr: string): string => {
  const parts = dateStr.split('-');
  if (parts.length !== 3) return '';
  const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
  const day = date.getDay();
  switch (day) {
    case 0: return 'Domingo';
    case 1: return 'Segunda-Feira';
    case 2: return 'Terça-Feira';
    case 3: return 'Quarta-Feira';
    case 4: return 'Quinta-Feira';
    case 5: return 'Sexta-Feira';
    case 6: return 'Sábado';
    default: return '';
  }
};

const formatTimeRange = (code: string, label: string): string => {
  const clean = code.trim();
  // If it's folga
  if (clean.toUpperCase().includes('FOLGA P/T')) return 'Folga por Troca';
  if (clean.toUpperCase().includes('FOLGA')) return 'Folga';
  
  // Format common time ranges into "HH:MM => HH:MM"
  if (clean === '00:00-08:15' || clean === '00-0815') return '00:00 => 08:15';
  if (clean === '07:45-16:45' || clean === '0745-1645') return '07:45 => 16:45';
  if (clean === '07:45-16:30' || clean === '0745-1630') return '07:45 => 16:30';
  if (clean === '07:45-16:15' || clean === '0745-1615') return '07:45 => 16:15';
  if (clean === '08:00-16:00' || clean === '0800-1600') return '08:00 => 16:00';
  if (clean === '08:00-15:00' || clean === '08-15') return '08:00 => 15:00';
  if (clean === '09:00-17:30' || clean === '09-1730') return '09:00 => 17:30';
  if (clean === '09:00-17:00' || clean === '09-17') return '09:00 => 17:00';
  if (clean === '13:00-20:00' || clean === '13-20') return '13:00 => 20:00';
  if (clean === '15:45-00:00' || clean === '1545-00') return '15:45 => 00:00';
  if (clean === '16:00-00:00' || clean === '16-00') return '16:00 => 00:00';
  
  // If has hyphen between hours like 08:00-15:00
  if (clean.includes('-')) {
    const [start, end] = clean.split('-');
    if (start && end && start.includes(':')) {
      return `${start.trim()} => ${end.trim()}`;
    }
  }

  return clean || label || '-';
};

// Check if an entry corresponds to the special duties/overlays: remunerado, PAO, FORM, TRIB, BALANÇAS
const isSpecialOverlay = (entry?: ScheduleEntry, shift?: ShiftType): boolean => {
  if (!entry && !shift) return false;
  const noteUpper = (entry?.note || '').toUpperCase();
  const codeUpper = (shift?.code || '').toUpperCase();
  const labelUpper = (shift?.label || '').toUpperCase();
  const idUpper = (shift?.id || '').toUpperCase();

  const isRemunerado = 
    noteUpper.includes('REMUNERAD') || 
    codeUpper.includes('REMUNERAD') || 
    labelUpper.includes('REMUNERAD') || 
    idUpper.includes('REMUNERAD');

  const isPAO = 
    noteUpper.includes('PAO') || 
    noteUpper.includes('P.A.O') || 
    codeUpper === 'PAO' || 
    codeUpper.includes('PAO') || 
    codeUpper.includes('P.A.O') || 
    labelUpper.includes('PAO') || 
    labelUpper.includes('P.A.O') || 
    labelUpper.includes('APOIO OPERACIONAL') || 
    idUpper === 'PAO';

  const isForm = 
    noteUpper.includes('FORM') || 
    codeUpper.includes('FORM') || 
    labelUpper.includes('FORM') || 
    labelUpper.includes('FORMAÇÃO') || 
    labelUpper.includes('FORMACAO') || 
    idUpper.includes('FORM');

  const isTrib = 
    noteUpper.includes('TRIB') || 
    codeUpper.includes('TRIB') || 
    labelUpper.includes('TRIBUNAL') || 
    labelUpper.includes('TRIB') || 
    idUpper === 'trib' || 
    idUpper.includes('TRIB');

  const isBalancas = 
    noteUpper.includes('BALANÇ') || 
    noteUpper.includes('BALANC') || 
    codeUpper.includes('BALANÇ') || 
    codeUpper.includes('BALANC') || 
    labelUpper.includes('BALANÇ') || 
    labelUpper.includes('BALANC') || 
    labelUpper.includes('PESAGEM') || 
    idUpper === 'balancas';

  return isRemunerado || isPAO || isForm || isTrib || isBalancas;
};

const getSpecialOverlayLabel = (entry?: ScheduleEntry, shift?: ShiftType): string => {
  const note = (entry?.note || '').trim();
  const noteUpper = note.toUpperCase();
  const codeUpper = (shift?.code || '').toUpperCase();
  const labelUpper = (shift?.label || '').toUpperCase();
  const idUpper = (shift?.id || '').toUpperCase();

  let tag = '';
  if (noteUpper.includes('REMUNERAD') || codeUpper.includes('REMUNERAD') || labelUpper.includes('REMUNERAD') || idUpper.includes('REMUNERAD')) {
    tag = 'Remunerado';
  } else if (noteUpper.includes('PAO') || codeUpper.includes('PAO') || labelUpper.includes('PAO') || idUpper === 'PAO') {
    tag = 'PAO';
  } else if (noteUpper.includes('FORM') || codeUpper.includes('FORM') || labelUpper.includes('FORM') || idUpper.includes('FORM')) {
    tag = 'Formação';
  } else if (noteUpper.includes('TRIB') || codeUpper.includes('TRIB') || labelUpper.includes('TRIB') || idUpper === 'trib') {
    tag = 'Tribunal';
  } else if (noteUpper.includes('BALANÇ') || noteUpper.includes('BALANC') || codeUpper.includes('BALANÇ') || codeUpper.includes('BALANC') || idUpper === 'balancas') {
    tag = 'Balanças';
  }

  if (note) {
    if (note.toUpperCase() === tag.toUpperCase()) {
      return tag;
    }
    if (note.toUpperCase().includes(tag.toUpperCase())) {
      return note;
    }
    return tag ? `${tag} (${note})` : note;
  }

  return tag || shift?.label || shift?.code || '';
};

export const DailyScheduleModal: React.FC<DailyScheduleModalProps> = ({
  isOpen,
  onClose,
  initialDate,
  employees,
  shifts,
  schedule
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(() => initialDate || toISODate(new Date()));
  const [searchTerm, setSearchTerm] = useState('');

  // Sync when initialDate changes
  React.useEffect(() => {
    if (initialDate) {
      setSelectedDate(initialDate);
    }
  }, [initialDate]);

  if (!isOpen) return null;

  // Previous and Next day navigation
  const handlePrevDay = () => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() - 1);
    setSelectedDate(toISODate(date));
  };

  const handleNextDay = () => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() + 1);
    setSelectedDate(toISODate(date));
  };

  const handleToday = () => {
    setSelectedDate(toISODate(new Date()));
  };


  // Build the daily data rows in the EXACT order of the schedule grid (employees)
  const shiftMap = useMemo(() => new Map(shifts.map(s => [s.id, s])), [shifts]);

  const { rows, totalActiveCount, totalOffCount } = useMemo(() => {
    let activeCount = 0;
    let offCount = 0;

    const allRows = employees.map(emp => {
      const key = `${selectedDate}_${emp.id}`;
      const entries = schedule[key] || [];

      // Seleciona a última alteração feita nesta célula (caso tenha vários horários/diligências)
      const lastEntry = entries.length > 0 ? entries[entries.length - 1] : undefined;
      const lastShift = lastEntry ? shiftMap.get(lastEntry.shiftTypeId) : undefined;

      // Verifica se a célula mais recente é "remunerado, PAO, FORM, TRIB, BALANÇAS"
      const isOverlay = isSpecialOverlay(lastEntry, lastShift);

      let effectiveEntry: ScheduleEntry | undefined = lastEntry;
      let effectiveShift: ShiftType | undefined = lastShift;
      let specialIndication = '';

      if (isOverlay && lastEntry) {
        specialIndication = getSpecialOverlayLabel(lastEntry, lastShift);

        // Assume o horário anterior:
        // Procura a entrada anterior que define horário/escala base nesta célula
        let anteriorEntry: ScheduleEntry | undefined = undefined;
        if (entries.length >= 2) {
          for (let i = entries.length - 2; i >= 0; i--) {
            const candidate = entries[i];
            const candidateShift = candidate ? shiftMap.get(candidate.shiftTypeId) : undefined;
            if (!isSpecialOverlay(candidate, candidateShift)) {
              anteriorEntry = candidate;
              break;
            }
          }
          if (!anteriorEntry) {
            anteriorEntry = entries[0];
          }
        }

        if (anteriorEntry) {
          effectiveEntry = anteriorEntry;
          effectiveShift = shiftMap.get(anteriorEntry.shiftTypeId);
        } else {
          // Se não havia horário prévio na célula, o padrão do dia é Folga
          effectiveEntry = undefined;
          effectiveShift = undefined;
        }
      }

      // Obtém a nota / observação da entrada efetiva ou da célula
      const cellNote = effectiveEntry?.note?.trim() || '';
      const noteUpper = cellNote.toUpperCase();

      // Determine Função (sub-role / post from Gestão de Funcionários)
      let funcao = emp.role || '';
      if (emp.role && (emp.role.includes('PARQUE') || emp.role.includes('ESCRIT.') || emp.role.includes('S.I.P.E.'))) {
        if (emp.role.includes('PARQUE') && emp.role.includes('1')) funcao = 'Coordenador Parque de Viaturas';
        else if (emp.role.includes('ESCRIT.')) funcao = 'Secção De Inquéritos';
        else funcao = emp.role;
      }
      if (noteUpper.includes('S.I.P.E.')) funcao = 'S.I.P.E.';
      if (noteUpper.includes('INQUÉRITOS') || noteUpper.includes('INQUERITOS')) funcao = 'Secção De Inquéritos';
      if (noteUpper.includes('MODERADOS')) funcao = 'Serviços Moderados';

      // Determine Categoria
      const categoria = getEmployeeCategory(emp);

      // Determine Matrícula: uses MATRÍCULA (emp.initials) from Gestão de Funcionários
      const matricula = (emp.initials && emp.initials.trim()) ? emp.initials.trim() : emp.id;

      // Determine Horário, Folga, and Indisponibilidades com base na entrada assumida
      const isAbsenceKeyword = 
        noteUpper.includes('LIC') || 
        noteUpper.includes('PARENTAL') || 
        noteUpper.includes('FÉRIAS') || 
        noteUpper.includes('FERIAS') || 
        noteUpper.includes('DOENÇA') || 
        noteUpper.includes('DOENCA') || 
        noteUpper.includes('BAIXA') || 
        noteUpper.includes('PRISÃO') || 
        noteUpper.includes('PRISAO') || 
        noteUpper.includes('DISPENSA') ||
        noteUpper.includes('INDISPON') ||
        noteUpper.includes('CASAMENTO') ||
        noteUpper.includes('LUTO') ||
        noteUpper.includes('MATERNIDADE') ||
        noteUpper.includes('PATERNIDADE');

      let horario = '';
      let isHour = false;
      let isFolga = false;
      let isIndisponivel = false;

      if (isAbsenceKeyword) {
        horario = cellNote || (effectiveShift ? effectiveShift.label : 'Indisponível');
        isIndisponivel = true;
        offCount++;
      } else if (effectiveShift) {
        const formatted = formatTimeRange(effectiveShift.code, effectiveShift.label);
        const hasTime = /\b\d{1,2}:\d{2}\b/.test(formatted);
        const lowerLabel = (effectiveShift.label || '').toLowerCase();
        const lowerCode = (effectiveShift.code || '').toLowerCase();

        // Check if employee is on Folga
        if (
          effectiveShift.id === 'folga' || 
          effectiveShift.id === 'folga_troca' || 
          lowerCode.includes('folga') || 
          lowerLabel.includes('folga') || 
          formatted.toLowerCase().includes('folga')
        ) {
          horario = (effectiveShift.id === 'folga_troca' || lowerCode.includes('troca')) ? 'Folga por Troca' : 'Folga';
          isFolga = true;
          offCount++;
        } else if (hasTime) {
          horario = formatted;
          isHour = true;
          activeCount++;
        } else {
          // Different from hours, and not folga -> goes to Indisponibilidades/Diligência
          horario = cellNote || effectiveShift.label || effectiveShift.code;
          isIndisponivel = true;
          offCount++;
        }
      } else {
        // No shift assigned -> regular Folga (stays in main table)
        horario = 'Folga';
        isFolga = true;
        offCount++;
      }

      // Determine Observações: coloca essa indicação nas observações
      let observacoes = '';
      if (specialIndication) {
        if (cellNote && cellNote.toUpperCase() !== specialIndication.toUpperCase()) {
          observacoes = `${cellNote} • ${specialIndication}`;
        } else {
          observacoes = specialIndication;
        }
      } else if (cellNote) {
        if (isIndisponivel && horario === cellNote) {
          observacoes = '';
        } else {
          observacoes = cellNote;
        }
      } else if (effectiveEntry?.isSwap || effectiveEntry?.isExchange) {
        observacoes = 'Troca de Turno';
      }

      return {
        emp,
        entry: lastEntry || effectiveEntry,
        shift: effectiveShift || lastShift,
        funcao,
        categoria,
        matricula,
        nome: emp.name,
        horario,
        observacoes,
        isHour,
        isFolga,
        isIndisponivel
      };
    });

    return {
      rows: allRows,
      totalActiveCount: activeCount,
      totalOffCount: offCount
    };
  }, [employees, schedule, selectedDate, shiftMap]);

  // Filter rows by search term if active, preserving schedule grid order
  const filteredRows = useMemo(() => {
    if (!searchTerm.trim()) return rows;
    const term = searchTerm.toLowerCase();
    return rows.filter(row =>
      row.nome.toLowerCase().includes(term) ||
      row.matricula.toLowerCase().includes(term) ||
      row.horario.toLowerCase().includes(term) ||
      row.funcao.toLowerCase().includes(term) ||
      row.categoria.toLowerCase().includes(term) ||
      row.observacoes.toLowerCase().includes(term)
    );
  }, [rows, searchTerm]);

  // Main table contains active service (hours) AND folgas, preserving grid order.
  // The indisponibilidades section at the bottom contains exclusively real leaves and diligências.
  const mainRows = useMemo(() => filteredRows.filter(r => !r.isIndisponivel), [filteredRows]);
  const indisponibilidadeRows = useMemo(() => filteredRows.filter(r => r.isIndisponivel), [filteredRows]);

  const extractionDateTime = useMemo(() => {
    const now = new Date();
    const dStr = toISODate(now);
    const timeStr = now.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
    return `${dStr} ${timeStr}`;
  }, []);

  const dayOfWeek = getPortugueseDayOfWeek(selectedDate);

  const handleExportDailyExcel = () => {
    const titleRow = [`CM LISBOA - Escala de Serviço APROVADA para ${dayOfWeek} dia: ${selectedDate}`];
    const subTitleRow = [`Órgão Base - Funções de Situação Diária`];
    const emptyRow: string[] = [];
    const header = ['Função', 'Categoria', 'Matrícula', 'Nome', 'Horário', 'Observações'];

    const mainRowsData = mainRows.map(r => [
      r.funcao || '',
      r.categoria,
      r.matricula,
      r.nome,
      r.horario,
      r.observacoes
    ]);

    const indisponibilidadesData = indisponibilidadeRows.length > 0 ? [
      emptyRow,
      ['Indisponibilidade/Diligência', '', '', '', '', `Total Efectivos da Função: ${indisponibilidadeRows.length}`],
      ...indisponibilidadeRows.map(r => [
        r.funcao || '',
        r.categoria,
        r.matricula,
        r.nome,
        r.horario,
        r.observacoes
      ])
    ] : [];

    const footerRow = [
      `Data/Hora de extracção: ${extractionDateTime}`,
      '',
      '',
      '',
      '',
      `Total Efectivos: ${filteredRows.length}`
    ];

    const ws = utils.aoa_to_sheet([
      titleRow,
      subTitleRow,
      emptyRow,
      header,
      ...mainRowsData,
      ...indisponibilidadesData,
      emptyRow,
      footerRow
    ]);

    ws['!cols'] = [
      { wch: 25 },
      { wch: 20 },
      { wch: 12 },
      { wch: 32 },
      { wch: 24 },
      { wch: 24 }
    ];

    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "Folha Diária");
    writeFile(wb, `escala_diaria_${selectedDate}.xlsx`);
  };

  const handleExportDailyPDF = () => {
    exportDailyScheduleToPDF(
      selectedDate,
      dayOfWeek,
      mainRows.map(r => ({
        funcao: r.funcao || '',
        categoria: r.categoria,
        matricula: r.matricula,
        nome: r.nome,
        horario: r.horario,
        observacoes: r.observacoes
      })),
      indisponibilidadeRows.map(r => ({
        funcao: r.funcao || '',
        categoria: r.categoria,
        matricula: r.matricula,
        nome: r.nome,
        horario: r.horario,
        observacoes: r.observacoes
      })),
      extractionDateTime
    );
  };

  const handlePrint = () => {
    try {
      window.print();
    } catch {
      handleExportDailyPDF();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex justify-center p-2 sm:p-4 print:p-0 print:bg-white print:overflow-visible">
      {/* Backdrop click to close (disabled in print) */}
      <div className="fixed inset-0 print:hidden" onClick={onClose} />

      {/* Main Container */}
      <div className="relative w-full max-w-5xl bg-white rounded-xl shadow-2xl flex flex-col z-10 print:shadow-none print:w-full print:max-w-none print:rounded-none">
        
        {/* Top Control Bar (Hidden when Printing) */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-slate-800 text-white rounded-t-xl print:hidden border-b border-slate-700">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-500/20 text-indigo-400 rounded-lg">
              <FileText size={20} />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold leading-tight">
                Escala de Serviço Diária (Folha Aprovada)
              </h2>
              <p className="text-[11px] text-slate-300">
                Visualização oficial pronta para consulta e impressão
              </p>
            </div>
          </div>

          {/* Date Navigator */}
          <div className="flex items-center gap-1 bg-slate-700/70 p-1 rounded-lg border border-slate-600">
            <button
              onClick={handlePrevDay}
              className="p-1.5 hover:bg-slate-600 rounded text-slate-200 transition"
              title="Dia Anterior"
            >
              <ChevronLeft size={16} />
            </button>
            <input 
              type="date"
              value={selectedDate}
              onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
              className="bg-slate-800 text-white text-xs font-semibold px-2 py-1 rounded border border-slate-600 focus:outline-none focus:border-indigo-400"
            />
            <button
              onClick={handleNextDay}
              className="p-1.5 hover:bg-slate-600 rounded text-slate-200 transition"
              title="Dia Seguinte"
            >
              <ChevronRight size={16} />
            </button>
            <button
              onClick={handleToday}
              className="ml-1 px-2 py-1 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 rounded text-white transition"
            >
              Hoje
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <div className="relative hidden md:block">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Filtrar por nome/matrícula..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1 bg-slate-700 text-white placeholder-slate-400 text-xs rounded-lg border border-slate-600 focus:outline-none focus:border-indigo-400 w-44"
              />
            </div>

            <button
              onClick={handleExportDailyExcel}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold transition shadow-sm"
              title="Exportar Folha Diária para Excel (.xlsx)"
            >
              <FileSpreadsheet size={15} />
              <span className="hidden sm:inline">Excel</span>
            </button>

            <button
              onClick={handleExportDailyPDF}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-700 hover:bg-rose-600 text-white rounded-lg text-xs font-semibold transition shadow-sm"
              title="Exportar / Descarregar Folha Diária em PDF"
            >
              <Download size={15} />
              <span>PDF</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition shadow-sm"
              title="Imprimir Folha Diária"
            >
              <Printer size={15} />
              <span className="hidden sm:inline">Imprimir</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition"
              title="Fechar"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Scrollable Printable Document Body */}
        <div className="flex-1 overflow-auto p-4 sm:p-8 bg-slate-100 print:bg-white print:p-0 print:overflow-visible">
          <div className="daily-schedule-printable max-w-[850px] mx-auto bg-white p-6 sm:p-8 rounded-lg shadow-sm border border-slate-200 text-black font-sans print:shadow-none print:border-none print:p-2 print:max-w-none">
            
            {/* Document Header */}
            <div className="text-center mb-4">
              <h1 className="text-lg sm:text-xl font-bold uppercase tracking-wider text-slate-900">
                CM LISBOA
              </h1>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">
                CM LSB AMD-Esqª de Trânsito da Amadora
              </h2>
            </div>

            {/* Sub-header */}
            <div className="mb-3 space-y-1">
              <div className="text-sm sm:text-base font-bold text-slate-900">
                Escala de Serviço APROVADA para {dayOfWeek} dia: {selectedDate}
              </div>
              <div className="text-xs sm:text-sm font-bold text-slate-900">
                Orgão Base - Funções de Situação Diária
              </div>
            </div>

            {/* Official Report Table */}
            <div className="border border-black overflow-hidden mb-4">
              <table className="w-full text-left border-collapse text-[11px] sm:text-xs">
                <thead>
                  {/* Top Header Row */}
                  <tr className="border-b border-black divide-x divide-black bg-white">
                    <th className="py-2 px-2 font-bold text-center align-middle w-[18%]">
                      Função
                    </th>
                    <th colSpan={3} className="py-1 px-2 font-bold text-center border-b border-black">
                      Elemento
                    </th>
                    <th className="py-2 px-2 font-bold text-center align-middle w-[24%]">
                      Horário
                    </th>
                    <th className="py-2 px-2 font-bold text-center align-middle w-[16%]">
                      Observações
                    </th>
                  </tr>
                  {/* Sub Header for Elemento */}
                  <tr className="border-b border-black divide-x divide-black bg-white text-[10px] sm:text-[11px]">
                    <th className="p-0 border-r border-black"></th>
                    <th className="py-1 px-1.5 font-bold text-center w-[16%]">
                      Categoria
                    </th>
                    <th className="py-1 px-1.5 font-bold text-center w-[12%]">
                      Matrícula
                    </th>
                    <th className="py-1 px-2 font-bold text-center w-[24%]">
                      Nome
                    </th>
                    <th className="p-0 border-l border-black"></th>
                    <th className="p-0 border-l border-black"></th>
                  </tr>
                </thead>

                <tbody>
                  {/* Escala Diária Principal (Horários e Folgas na ordem da grelha) */}
                  {mainRows.map((row) => (
                    <tr 
                      key={row.emp.id} 
                      className="border-b border-black divide-x divide-black hover:bg-slate-50 transition-colors"
                    >
                      <td className="py-1 px-2 text-slate-800 font-medium">
                        {row.funcao || ''}
                      </td>
                      <td className="py-1 px-1.5 text-center text-slate-800">
                        {row.categoria}
                      </td>
                      <td className="py-1 px-1.5 text-center font-mono text-slate-800 font-medium">
                        {row.matricula}
                      </td>
                      <td className="py-1 px-2 font-semibold text-slate-900 uppercase">
                        {row.nome}
                      </td>
                      <td className="py-1 px-2 text-center font-medium text-slate-800">
                        {row.horario}
                      </td>
                      <td className="py-1 px-2 text-center text-slate-700">
                        {row.observacoes}
                      </td>
                    </tr>
                  ))}

                  {/* Secção de Indisponibilidades / Diligências no final da folha */}
                  {indisponibilidadeRows.length > 0 && (
                    <React.Fragment>
                      <tr className="bg-slate-200 border-t border-b border-black font-bold text-slate-900">
                        <td colSpan={4} className="py-1 px-2 text-[11px] sm:text-xs">
                          Indisponibilidade/Diligência
                        </td>
                        <td colSpan={2} className="py-1 px-2 text-right text-[10px] sm:text-[11px] whitespace-nowrap">
                          Total Efectivos da Função: {indisponibilidadeRows.length}
                        </td>
                      </tr>

                      {indisponibilidadeRows.map((row) => (
                        <tr 
                          key={row.emp.id} 
                          className="border-b border-black divide-x divide-black hover:bg-slate-50 transition-colors"
                        >
                          <td className="py-1 px-2 text-slate-800 font-medium">
                            {row.funcao || ''}
                          </td>
                          <td className="py-1 px-1.5 text-center text-slate-800">
                            {row.categoria}
                          </td>
                          <td className="py-1 px-1.5 text-center font-mono text-slate-800 font-medium">
                            {row.matricula}
                          </td>
                          <td className="py-1 px-2 font-semibold text-slate-900 uppercase">
                            {row.nome}
                          </td>
                          <td className="py-1 px-2 text-center font-medium text-slate-800">
                            {row.horario}
                          </td>
                          <td className="py-1 px-2 text-center text-slate-700">
                            {row.observacoes}
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  )}

                  {filteredRows.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-slate-500 italic">
                        Nenhum funcionário encontrado para esta data ou pesquisa.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Document Footer */}
            <div className="pt-2 border-t border-black text-[10px] sm:text-[11px] text-slate-900 mt-2">
              <div className="flex flex-wrap items-center justify-between gap-2 font-medium mb-1">
                <div>
                  Data/Hora de extracção: {extractionDateTime}
                </div>
                <div className="font-mono">
                  Pág. 1 / 1
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between pt-1 border-t border-slate-300 text-[10px] sm:text-[11px] font-semibold text-slate-800">
                <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
                  <span>Total Efectivos: <b className="text-slate-950 font-bold">{filteredRows.length}</b></span>
                  <span className="text-slate-400">|</span>
                  <span>Em Serviço: <b className="text-emerald-800 font-bold">{mainRows.filter(r => r.isHour).length}</b></span>
                  <span className="text-slate-400">|</span>
                  <span>Folgas: <b className="text-amber-800 font-bold">{mainRows.filter(r => r.isFolga).length}</b></span>
                  <span className="text-slate-400">|</span>
                  <span>Indisponibilidades: <b className="text-slate-900 font-bold">{indisponibilidadeRows.length}</b></span>
                </div>
              </div>
            </div>

            {/* Summary statistics bar on screen */}
            <div className="mt-4 pt-3 border-t border-dashed border-slate-300 flex flex-wrap items-center justify-between text-xs text-slate-500 print:hidden">
              <div className="flex items-center gap-4">
                <span>Total Efectivos: <b className="text-slate-900">{filteredRows.length}</b></span>
                <span>Em Serviço (Horas): <b className="text-emerald-700">{mainRows.filter(r => r.isHour).length}</b></span>
                <span>Folgas: <b className="text-amber-700">{mainRows.filter(r => r.isFolga).length}</b></span>
                <span>Indisponibilidades: <b className="text-slate-700">{indisponibilidadeRows.length}</b></span>
              </div>
              <div className="text-[11px] text-slate-400">
                * Pessoal em serviço e folgas na grelha principal; indisponibilidades e diligências no final da folha.
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Print Specific CSS */}
      <style>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .daily-schedule-printable {
            border: none !important;
            box-shadow: none !important;
            margin: 0 !important;
            padding: 0 !important;
            max-width: 100% !important;
            width: 100% !important;
          }
          tr {
            page-break-inside: avoid;
          }
        }
      `}</style>
    </div>
  );
};

export default DailyScheduleModal;
