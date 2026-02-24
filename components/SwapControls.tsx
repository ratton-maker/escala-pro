import React from 'react';
import { Selection, Employee } from '../types';
import { ArrowRight, X } from 'lucide-react';

interface SwapControlsProps {
  selectionA: Selection;
  selectionB: Selection;
  employees: Employee[];
  onExecute: (petitionerIndex: number) => void;
  onCancel: () => void;
}

const SwapControls: React.FC<SwapControlsProps> = ({ selectionA, selectionB, employees, onExecute, onCancel }) => {
  const empA = employees.find(e => e.id === selectionA.employeeId);
  const empB = employees.find(e => e.id === selectionB.employeeId);

  if (!empA || !empB) return null;

  const dateA = new Date(selectionA.dateStr).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' });
  const dateB = new Date(selectionB.dateStr).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' });

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white p-4 rounded-xl shadow-2xl flex flex-col gap-4 animate-in slide-in-from-bottom-5 fade-in w-[90%] max-w-lg border border-slate-700">
      <div className="flex justify-between items-start">
        <div>
          <h4 className="font-bold text-indigo-300">Troca de Serviço</h4>
          <p className="text-xs text-slate-400 mt-1">Quem pede a folga (Peticionário)?</p>
        </div>
        <button 
          onClick={onCancel}
          className="p-1 hover:bg-slate-800 rounded-lg transition text-slate-400"
        >
          <X size={20} />
        </button>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        {/* Option 1: A asks B */}
        <button 
          onClick={() => onExecute(0)}
          className="bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-indigo-500 p-3 rounded-lg text-left transition group"
        >
          <div className="text-xs text-slate-500 mb-1">Peticionário (Folga)</div>
          <div className="font-bold text-white flex items-center gap-2">
            {empA.name} 
            <span className="text-[10px] bg-slate-700 px-1 rounded">{dateA}</span>
          </div>
          <div className="flex justify-center my-2 text-slate-600 group-hover:text-indigo-400">
            <ArrowRight size={16} />
          </div>
          <div className="text-xs text-slate-500 mb-1">Aceitante (Dupla)</div>
          <div className="font-medium text-slate-300 flex items-center gap-2">
            {empB.name}
            <span className="text-[10px] bg-slate-700 px-1 rounded">{dateB}</span>
          </div>
        </button>

        {/* Option 2: B asks A */}
        <button 
          onClick={() => onExecute(1)}
          className="bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-indigo-500 p-3 rounded-lg text-left transition group"
        >
          <div className="text-xs text-slate-500 mb-1">Peticionário (Folga)</div>
          <div className="font-bold text-white flex items-center gap-2">
            {empB.name}
            <span className="text-[10px] bg-slate-700 px-1 rounded">{dateB}</span>
          </div>
          <div className="flex justify-center my-2 text-slate-600 group-hover:text-indigo-400">
            <ArrowRight size={16} />
          </div>
          <div className="text-xs text-slate-500 mb-1">Aceitante (Dupla)</div>
          <div className="font-medium text-slate-300 flex items-center gap-2">
            {empA.name}
            <span className="text-[10px] bg-slate-700 px-1 rounded">{dateA}</span>
          </div>
        </button>
      </div>
    </div>
  );
};

export default SwapControls;
