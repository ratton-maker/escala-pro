import React from 'react';
import { ChevronLeft, ChevronRight, Calendar, ListFilter } from 'lucide-react';

interface DateNavigationProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
  viewMode: 'month' | 'custom';
  onViewModeChange: (mode: 'month' | 'custom') => void;
  customStartDate: string;
  customEndDate: string;
  onCustomRangeChange: (start: string, end: string) => void;
}

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const DateNavigation: React.FC<DateNavigationProps> = ({ 
  currentDate, 
  onDateChange,
  viewMode,
  onViewModeChange,
  customStartDate,
  customEndDate,
  onCustomRangeChange
}) => {
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // --- Month Logic ---
  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(parseInt(e.target.value));
    onDateChange(newDate);
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    if (!isNaN(val) && val > 1900 && val < 2100) {
        const newDate = new Date(currentDate);
        newDate.setFullYear(val);
        onDateChange(newDate);
    }
  };

  const nextMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + 1);
    onDateChange(newDate);
  };

  const prevMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() - 1);
    onDateChange(newDate);
  };

  // --- Render ---
  return (
    <div className="flex items-center gap-1.5 sm:gap-3 flex-wrap sm:flex-nowrap justify-center">
      
      {/* Mode Toggle */}
      <div className="bg-slate-100 p-0.5 sm:p-1 rounded-lg flex text-[11px] sm:text-xs font-semibold border border-slate-200">
        <button 
          onClick={() => onViewModeChange('month')}
          className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-md transition-all ${viewMode === 'month' ? 'bg-white text-indigo-600 shadow-xs font-bold' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Mensal
        </button>
        <button 
          onClick={() => onViewModeChange('custom')}
          className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-md transition-all ${viewMode === 'custom' ? 'bg-white text-indigo-600 shadow-xs font-bold' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Período
        </button>
      </div>

      <div className="h-5 sm:h-6 w-px bg-slate-200 hidden xs:block"></div>

      {viewMode === 'month' ? (
        /* Month Controls */
        <div className="flex items-center gap-1 sm:gap-2 bg-white p-0.5 sm:p-1 rounded-lg border border-slate-200 shadow-xs">
          <button 
            onClick={prevMonth}
            className="p-1 sm:p-1.5 hover:bg-slate-100 active:bg-slate-200 text-slate-600 rounded-md transition"
            title="Mês Anterior"
          >
            <ChevronLeft size={16} className="sm:w-[18px] sm:h-[18px]" />
          </button>

          <div className="flex items-center gap-0.5 sm:gap-1 px-0.5 sm:px-1">
            <div className="relative">
                <select 
                    value={currentMonth} 
                    onChange={handleMonthChange}
                    className="appearance-none bg-transparent font-bold text-slate-800 text-xs sm:text-sm py-1 pl-1 pr-4 sm:pl-2 sm:pr-6 cursor-pointer focus:outline-none hover:bg-slate-50 rounded"
                >
                    {MONTHS.map((m, i) => (
                        <option key={i} value={i}>{m}</option>
                    ))}
                </select>
            </div>
            
            <input 
                type="number" 
                value={currentYear}
                onChange={handleYearChange}
                className="w-12 sm:w-16 bg-transparent font-bold text-slate-800 text-xs sm:text-sm py-1 px-0.5 sm:px-1 text-center focus:outline-none focus:bg-slate-50 rounded"
            />
          </div>

          <button 
            onClick={nextMonth}
            className="p-1 sm:p-1.5 hover:bg-slate-100 active:bg-slate-200 text-slate-600 rounded-md transition"
            title="Próximo Mês"
          >
            <ChevronRight size={16} className="sm:w-[18px] sm:h-[18px]" />
          </button>
        </div>
      ) : (
        /* Custom Range Controls */
        <div className="flex items-center gap-1 sm:gap-2 bg-white p-1 sm:p-1.5 rounded-lg border border-slate-200 shadow-xs text-xs">
            <input 
                type="date" 
                value={customStartDate}
                onChange={(e) => onCustomRangeChange(e.target.value, customEndDate)}
                className="bg-slate-50 border border-slate-200 rounded px-1.5 py-1 text-[11px] sm:text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 max-w-[110px] sm:max-w-none"
            />
            <span className="text-slate-400 text-[10px] sm:text-xs">até</span>
            <input 
                type="date" 
                value={customEndDate}
                min={customStartDate}
                onChange={(e) => onCustomRangeChange(customStartDate, e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded px-1.5 py-1 text-[11px] sm:text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 max-w-[110px] sm:max-w-none"
            />
        </div>
      )}
    </div>
  );
};

export default DateNavigation;