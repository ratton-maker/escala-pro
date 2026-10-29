import React, { useState } from 'react';
import { ShiftType, ScheduleEntry } from '../types';
import { X, Trash2, Plus, StickyNote, Briefcase } from 'lucide-react';

interface ShiftEditorProps {
  shifts: ShiftType[];
  currentEntries: ScheduleEntry[];
  onAddShift: (shiftId: string, note?: string) => void;
  onRemoveEntry: (entryId: string) => void;
  onClose: () => void;
}

const ShiftEditor: React.FC<ShiftEditorProps> = ({ 
  shifts, 
  currentEntries,
  onAddShift, 
  onRemoveEntry, 
  onClose,
}) => {
  const [note, setNote] = useState('');
  const [selectedShiftId, setSelectedShiftId] = useState<string | null>(null);

  const handleAdd = () => {
    if (selectedShiftId) {
        onAddShift(selectedShiftId, note);
        setNote('');
        setSelectedShiftId(null);
    }
  };

  return (
    <div className="fixed inset-x-0 bottom-0 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 z-50 
      bg-white md:rounded-xl shadow-2xl border border-slate-200 w-full md:w-[650px] max-h-[85vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 fade-in">
      
      <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
        <h3 className="font-semibold text-slate-800 flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-indigo-600" />
          Gerir Serviços do Dia
        </h3>
        <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-full transition">
          <X size={20} className="text-slate-500" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
        
        {/* Current Assignments */}
        {currentEntries.length > 0 && (
            <div className="mb-6 space-y-2">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                    Serviços Atribuídos
                </label>
                {currentEntries.map(entry => {
                    const shift = shifts.find(s => s.id === entry.shiftTypeId);
                    return (
                        <div key={entry.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50">
                            <div className="flex items-center gap-3">
                                <div className={`px-2 py-1 rounded text-xs font-bold ${shift?.color} ${shift?.textColor}`}>
                                    {shift?.code}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium text-slate-700">{shift?.label}</span>
                                    {entry.note && (
                                        <span className="text-xs text-slate-500 flex items-center gap-1">
                                            <StickyNote size={10} /> {entry.note}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <button 
                                onClick={() => onRemoveEntry(entry.id)}
                                className="text-red-500 hover:bg-red-50 p-1.5 rounded-full transition"
                                title="Remover"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    );
                })}
            </div>
        )}

        <div className="border-t border-slate-100 my-4"></div>

        {/* Add New */}
        <div className="space-y-4">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Adicionar Novo Serviço / Diligência
            </label>
            
            {/* Note Input */}
            <div className="space-y-2">
                <div className="flex gap-2 items-center bg-slate-50 p-2 rounded-lg border border-slate-200 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all">
                    <StickyNote size={18} className="text-slate-400" />
                    <input
                        type="text"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Nota / Diligência (ex: Tribunal, Piquete)"
                        className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
                    />
                </div>
                
                {/* Quick Chips */}
                <div className="flex flex-wrap gap-1.5">
                    {['Tribunal', 'Piquete', 'Patrulha', 'Formação', 'Reunião', 'Apoio', 'Transporte'].map(tag => (
                        <button
                            key={tag}
                            onClick={() => setNote(tag)}
                            className="text-[10px] px-2 py-1 bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 border border-slate-200 hover:border-indigo-200 rounded-full transition-colors"
                        >
                            {tag}
                        </button>
                    ))}
                </div>
            </div>

            {/* Shift Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-[200px] overflow-y-auto custom-scrollbar p-1">
                {[...shifts].sort((a, b) => a.code.localeCompare(b.code)).map(shift => (
                    <button
                        key={shift.id}
                        onClick={() => setSelectedShiftId(shift.id)}
                        className={`
                            flex flex-col items-center justify-center p-2 rounded-lg border text-center transition-all
                            ${selectedShiftId === shift.id 
                                ? `ring-2 ring-indigo-500 ring-offset-1 ${shift.color}` 
                                : 'bg-white border-slate-200 hover:border-indigo-300'
                            }
                        `}
                    >
                        <span className={`text-xs font-bold ${selectedShiftId === shift.id ? shift.textColor : 'text-slate-700'}`}>
                            {shift.code}
                        </span>
                        <span className="text-[9px] text-slate-500 truncate w-full">{shift.label}</span>
                    </button>
                ))}
            </div>
        </div>
      </div>

      <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
        <button 
          onClick={onClose}
          className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-200 transition"
        >
          Fechar
        </button>
        <button 
          onClick={handleAdd}
          disabled={!selectedShiftId}
          className="bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition shadow-sm flex items-center gap-2"
        >
          <Plus size={16} />
          Adicionar
        </button>
      </div>
    </div>
  );
};

export default ShiftEditor;