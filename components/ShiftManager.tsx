import React, { useState } from 'react';
import { ShiftType } from '../types';
import { X, Plus, Trash2, Save, Clock, Palette } from 'lucide-react';

interface ShiftManagerProps {
  shifts: ShiftType[];
  onSave: (shift: ShiftType) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

const COLOR_PRESETS = [
  { bg: 'bg-white', text: 'text-slate-800', name: 'Branco' },
  { bg: 'bg-slate-100', text: 'text-slate-900', name: 'Cinza Claro' },
  { bg: 'bg-yellow-300', text: 'text-black', name: 'Amarelo (Folga)' },
  { bg: 'bg-blue-50', text: 'text-blue-900', name: 'Azul Claro' },
  { bg: 'bg-blue-500', text: 'text-white', name: 'Azul Forte' },
  { bg: 'bg-red-500', text: 'text-white', name: 'Vermelho' },
  { bg: 'bg-orange-400', text: 'text-black', name: 'Laranja' },
  { bg: 'bg-green-100', text: 'text-green-800', name: 'Verde Claro' },
  { bg: 'bg-emerald-500', text: 'text-white', name: 'Esmeralda' },
  { bg: 'bg-purple-300', text: 'text-black', name: 'Roxo' },
  { bg: 'bg-pink-100', text: 'text-pink-900', name: 'Rosa' },
  { bg: 'bg-indigo-600', text: 'text-white', name: 'Indigo' },
];

const ShiftManager: React.FC<ShiftManagerProps> = ({ shifts, onSave, onDelete, onClose }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<ShiftType>>({});

  const handleEdit = (shift: ShiftType) => {
    setEditingId(shift.id);
    setFormData(shift);
  };

  const handleNew = () => {
    setEditingId('NEW');
    setFormData({ 
        id: crypto.randomUUID(), 
        code: '', 
        label: '', 
        color: 'bg-white', 
        textColor: 'text-slate-800', 
        isOffDay: false 
    });
  };

  const handleSave = () => {
    if (formData.code && formData.label && formData.id) {
      onSave(formData as ShiftType);
      setEditingId(null);
      setFormData({});
    }
  };

  const selectColor = (bg: string, text: string) => {
      setFormData({ ...formData, color: bg, textColor: text });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden">
        
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Clock className="text-indigo-600" />
            Gestão de Tipos de Turno
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition text-slate-500">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          
          {/* List Header */}
          <div className="grid grid-cols-12 gap-4 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider px-2">
            <div className="col-span-2">Cor</div>
            <div className="col-span-2">Código</div>
            <div className="col-span-5">Descrição</div>
            <div className="col-span-3 text-right">Ações</div>
          </div>

          <div className="space-y-2">
            {[...shifts].sort((a, b) => a.code.localeCompare(b.code)).map(shift => (
              <div key={shift.id} className="grid grid-cols-12 gap-4 items-center p-3 rounded-lg border border-slate-100 bg-white hover:border-slate-300 transition-colors">
                {editingId === shift.id ? (
                  /* EDIT MODE */
                  <div className="col-span-12 grid grid-cols-12 gap-4 items-center bg-slate-50 p-2 -m-2 rounded-lg border border-indigo-200">
                    <div className="col-span-12 mb-2">
                        <label className="text-xs font-bold text-slate-500 flex items-center gap-1 mb-1">
                            <Palette size={12} /> Cor do Turno
                        </label>
                        <div className="flex gap-2 flex-wrap">
                            {COLOR_PRESETS.map((c) => (
                                <button
                                    key={c.bg}
                                    onClick={() => selectColor(c.bg, c.text)}
                                    className={`w-6 h-6 rounded-full border shadow-sm ${c.bg} ${formData.color === c.bg ? 'ring-2 ring-offset-1 ring-indigo-500 scale-110' : 'hover:scale-110'}`}
                                    title={c.name}
                                />
                            ))}
                        </div>
                    </div>
                    
                    <div className="col-span-3">
                      <input 
                        className="w-full border rounded px-2 py-1 text-sm font-bold" 
                        value={formData.code} 
                        onChange={e => setFormData({...formData, code: e.target.value})}
                        placeholder="Cód (ex: 08-16)"
                      />
                    </div>
                    <div className="col-span-7">
                      <input 
                        className="w-full border rounded px-2 py-1 text-sm" 
                        value={formData.label} 
                        onChange={e => setFormData({...formData, label: e.target.value})}
                        placeholder="Descrição (ex: Turno da Manhã)"
                      />
                    </div>
                    <div className="col-span-2 flex justify-end gap-2">
                      <button onClick={handleSave} className="text-green-600 hover:bg-green-50 p-1 rounded">
                        <Save size={18} />
                      </button>
                      <button onClick={() => setEditingId(null)} className="text-slate-400 hover:bg-slate-100 p-1 rounded">
                        <X size={18} />
                      </button>
                    </div>
                  </div>
                ) : (
                  /* VIEW MODE */
                  <>
                    <div className="col-span-2">
                        <div className={`px-2 py-1 rounded text-xs font-bold text-center border ${shift.color} ${shift.textColor}`}>
                            Aa
                        </div>
                    </div>
                    <div className="col-span-2 font-bold text-slate-700">{shift.code}</div>
                    <div className="col-span-5 text-sm text-slate-500 truncate">{shift.label}</div>
                    <div className="col-span-3 flex justify-end gap-2 opacity-0 hover:opacity-100 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEdit(shift)} className="text-indigo-600 hover:bg-indigo-50 p-1 rounded">
                        Edit
                      </button>
                      <button 
                        onClick={() => onDelete(shift.id)} 
                        className="text-red-500 hover:bg-red-50 p-1 rounded"
                        title="Eliminar"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
            
            {/* NEW SHIFT FORM */}
            {editingId === 'NEW' && (
               <div className="grid grid-cols-12 gap-4 items-center p-4 rounded-lg border-2 border-indigo-100 bg-indigo-50/30">
                  <div className="col-span-12 mb-2">
                        <label className="text-xs font-bold text-indigo-800 flex items-center gap-1 mb-1">
                            Selecione a Cor
                        </label>
                        <div className="flex gap-2 flex-wrap">
                            {COLOR_PRESETS.map((c) => (
                                <button
                                    key={c.bg}
                                    onClick={() => selectColor(c.bg, c.text)}
                                    className={`w-6 h-6 rounded-full border shadow-sm ${c.bg} ${formData.color === c.bg ? 'ring-2 ring-offset-1 ring-indigo-500' : ''}`}
                                />
                            ))}
                        </div>
                  </div>

                  <div className="col-span-3">
                    <input 
                      autoFocus
                      className="w-full border border-indigo-200 rounded px-2 py-1 text-sm font-bold" 
                      value={formData.code} 
                      onChange={e => setFormData({...formData, code: e.target.value})}
                      placeholder="Cód."
                    />
                  </div>
                  <div className="col-span-7">
                    <input 
                      className="w-full border border-indigo-200 rounded px-2 py-1 text-sm" 
                      value={formData.label} 
                      onChange={e => setFormData({...formData, label: e.target.value})}
                      placeholder="Descrição do Turno"
                    />
                  </div>
                  <div className="col-span-2 flex justify-end gap-2">
                    <button onClick={handleSave} className="bg-indigo-600 text-white p-1.5 rounded hover:bg-indigo-700 shadow-sm">
                      <Save size={16} />
                    </button>
                    <button onClick={() => setEditingId(null)} className="text-slate-500 hover:bg-slate-200 p-1.5 rounded">
                      <X size={16} />
                    </button>
                  </div>
               </div>
            )}
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200">
          {!editingId && (
            <button 
              onClick={handleNew}
              className="w-full py-3 rounded-lg border-2 border-dashed border-slate-300 text-slate-500 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 transition flex items-center justify-center gap-2 font-medium"
            >
              <Plus size={20} />
              Criar Novo Turno
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShiftManager;