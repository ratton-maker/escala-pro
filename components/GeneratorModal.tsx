import React, { useState, useEffect } from 'react';
import { Wand2, X, Play, Users, Calendar, CheckSquare, Square, ArrowRight } from 'lucide-react';
import { Employee } from '../types';

interface GeneratorModalProps {
  employees: Employee[];
  onGenerate: (selectedEmployeeIds: string[], startDate: string, endDate: string, pattern: string) => void;
  onClose: () => void;
  isGenerating: boolean;
}

const GeneratorModal: React.FC<GeneratorModalProps> = ({ employees, onGenerate, onClose, isGenerating }) => {
  const [pattern, setPattern] = useState('');
  
  // Default start date: tomorrow
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });

  // Default end date: 30 days from start
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 31);
    return d.toISOString().split('T')[0];
  });

  const [selectedEmpIds, setSelectedEmpIds] = useState<string[]>([]);

  // Update end date automatically if start date changes (optional UX improvement, keep simple for now or logic gets complex)
  // Instead, let's just ensure end date is valid on submit

  const toggleEmployee = (id: string) => {
    setSelectedEmpIds(prev => 
      prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selectedEmpIds.length === employees.length) {
      setSelectedEmpIds([]);
    } else {
      setSelectedEmpIds(employees.map(e => e.id));
    }
  };

  const handleRun = () => {
    if (selectedEmpIds.length === 0) return alert("Selecione pelo menos um funcionário.");
    if (!startDate) return alert("Selecione uma data de início.");
    if (!endDate) return alert("Selecione uma data de fim.");
    if (new Date(endDate) < new Date(startDate)) return alert("A data de fim deve ser posterior à data de início.");
    if (!pattern.trim()) return alert("Defina um padrão de escala.");
    
    onGenerate(selectedEmpIds, startDate, endDate, pattern);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
              <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600">
                  <Wand2 size={24} />
              </div>
              <div>
                  <h2 className="text-lg font-bold text-slate-800">Gerador de Escala (Padrão)</h2>
                  <p className="text-sm text-slate-500">Defina o período, a sequência e a quem aplicar</p>
              </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
              <X size={24} />
          </button>
        </div>

        <div className="overflow-y-auto p-6 space-y-6 custom-scrollbar">
            
            {/* Step 1: Who */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                        <Users size={16} className="text-indigo-500" />
                        1. Selecione os Funcionários
                    </label>
                    <button 
                        onClick={toggleAll}
                        className="text-xs font-medium text-indigo-600 hover:text-indigo-800"
                    >
                        {selectedEmpIds.length === employees.length ? "Desmarcar Todos" : "Selecionar Todos"}
                    </button>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 border border-slate-200 rounded-lg p-3 bg-slate-50 max-h-[150px] overflow-y-auto custom-scrollbar">
                    {employees.map(emp => {
                        const isSelected = selectedEmpIds.includes(emp.id);
                        return (
                            <div 
                                key={emp.id}
                                onClick={() => toggleEmployee(emp.id)}
                                className={`
                                    flex items-center gap-2 p-2 rounded border cursor-pointer select-none transition-all
                                    ${isSelected ? 'bg-indigo-100 border-indigo-300 text-indigo-900' : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-200'}
                                `}
                            >
                                {isSelected ? <CheckSquare size={16} className="text-indigo-600" /> : <Square size={16} className="text-slate-300" />}
                                <div className="flex flex-col overflow-hidden">
                                    <span className="text-xs font-bold truncate">{emp.name}</span>
                                    <span className="text-[10px] opacity-75">{emp.role}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                    <Calendar size={16} className="text-indigo-500" />
                    2. Defina o Período
                </label>
                
                <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <div className="flex-1">
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Início</label>
                        <input 
                            type="date" 
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>
                    <ArrowRight className="text-slate-300 mt-4" size={20} />
                    <div className="flex-1">
                        <label className="block text-xs font-semibold text-slate-500 mb-1">Fim</label>
                        <input 
                            type="date" 
                            value={endDate}
                            min={startDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>
                </div>
            </div>

            {/* Step 3: Pattern */}
            <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
                    <Wand2 size={16} className="text-indigo-500" />
                    3. Qual a sequência de serviço?
                </label>
                <textarea
                    className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none h-24 resize-none"
                    placeholder="Ex: 09-17, 09-17, 16-00, FOLGA, FOLGA"
                    value={pattern}
                    onChange={(e) => setPattern(e.target.value)}
                />
                <p className="text-xs text-slate-500">
                    Dica: Separe os turnos por vírgulas. Use os códigos (ex: 09-17) ou nomes (ex: Manhã). Use "FOLGA" para dias livres.
                </p>
            </div>
        </div>

        <div className="p-5 bg-slate-50 border-t border-slate-200 flex justify-end gap-3 shrink-0">
            <button 
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition"
            >
                Cancelar
            </button>
            <button 
                onClick={handleRun}
                disabled={isGenerating}
                className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition shadow-sm disabled:opacity-70"
            >
                {isGenerating ? 'A Processar...' : 'Gerar Escala'}
                {!isGenerating && <Play size={16} />}
            </button>
        </div>
      </div>
    </div>
  );
};

export default GeneratorModal;