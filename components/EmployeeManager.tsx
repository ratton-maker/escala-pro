import React, { useState } from 'react';
import { Employee } from '../types';
import { X, Plus, Trash2, Save, User, ArrowUp, ArrowDown } from 'lucide-react';

interface EmployeeManagerProps {
  employees: Employee[];
  onSave: (employee: Employee) => void;
  onDelete: (id: string) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  onClose: () => void;
}

const EmployeeManager: React.FC<EmployeeManagerProps> = ({ employees, onSave, onDelete, onReorder, onClose }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Employee>>({});

  const handleEdit = (emp: Employee) => {
    setEditingId(emp.id);
    setFormData(emp);
  };

  const handleNew = () => {
    setEditingId('NEW');
    setFormData({ id: crypto.randomUUID(), name: '', role: '', initials: '' });
  };

  const handleSave = () => {
    if (formData.name && formData.role && formData.initials && formData.id) {
      onSave(formData as Employee);
      setEditingId(null);
      setFormData({});
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
        
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <User className="text-indigo-600" />
            Gestão de Funcionários
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition text-slate-500">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          
          {/* List Header */}
          <div className="grid grid-cols-12 gap-4 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider px-2">
            <div className="col-span-1 text-center">Ord.</div>
            <div className="col-span-4">Nome</div>
            <div className="col-span-3">Função</div>
            <div className="col-span-2">Matrícula</div>
            <div className="col-span-2 text-right">Ações</div>
          </div>

          <div className="space-y-2">
            {employees.map((emp, index) => (
              <div key={emp.id} className="grid grid-cols-12 gap-4 items-center p-3 rounded-lg border border-slate-100 bg-white hover:border-slate-300 transition-colors">
                {editingId === emp.id ? (
                  <>
                    <div className="col-span-1"></div>
                    <div className="col-span-4">
                      <input 
                        className="w-full border rounded px-2 py-1 text-sm" 
                        value={formData.name} 
                        onChange={e => setFormData({...formData, name: e.target.value})}
                        placeholder="Nome"
                      />
                    </div>
                    <div className="col-span-3">
                      <input 
                        className="w-full border rounded px-2 py-1 text-sm" 
                        value={formData.role} 
                        onChange={e => setFormData({...formData, role: e.target.value})}
                        placeholder="Função"
                      />
                    </div>
                    <div className="col-span-2">
                      <input 
                        className="w-full border rounded px-2 py-1 text-sm uppercase" 
                        value={formData.initials} 
                        onChange={e => setFormData({...formData, initials: e.target.value})}
                        placeholder="Matrícula"
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
                  </>
                ) : (
                  <>
                    <div className="col-span-1 flex flex-col items-center gap-1">
                        <button 
                            disabled={index === 0}
                            onClick={() => onReorder(index, index - 1)}
                            className="text-slate-400 hover:text-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            <ArrowUp size={14} />
                        </button>
                        <button 
                            disabled={index === employees.length - 1}
                            onClick={() => onReorder(index, index + 1)}
                            className="text-slate-400 hover:text-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            <ArrowDown size={14} />
                        </button>
                    </div>
                    <div className="col-span-4 font-medium text-slate-700">{emp.name}</div>
                    <div className="col-span-3 text-sm text-slate-500">{emp.role}</div>
                    <div className="col-span-2 text-xs font-bold bg-slate-100 px-2 py-1 rounded w-fit">{emp.initials}</div>
                    <div className="col-span-2 flex justify-end gap-2 opacity-0 hover:opacity-100 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEdit(emp)} className="text-indigo-600 hover:bg-indigo-50 p-1 rounded">
                        Edit
                      </button>
                      <button onClick={() => onDelete(emp.id)} className="text-red-500 hover:bg-red-50 p-1 rounded">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
            
            {/* New Employee Form Row */}
            {editingId === 'NEW' && (
               <div className="grid grid-cols-12 gap-4 items-center p-3 rounded-lg border-2 border-indigo-100 bg-indigo-50/30">
                  <div className="col-span-1"></div>
                  <div className="col-span-4">
                    <input 
                      autoFocus
                      className="w-full border border-indigo-200 rounded px-2 py-1 text-sm" 
                      value={formData.name} 
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      placeholder="Nome do Funcionário"
                    />
                  </div>
                  <div className="col-span-3">
                    <input 
                      className="w-full border border-indigo-200 rounded px-2 py-1 text-sm" 
                      value={formData.role} 
                      onChange={e => setFormData({...formData, role: e.target.value})}
                      placeholder="Função (ex: Fiscal)"
                    />
                  </div>
                  <div className="col-span-2">
                    <input 
                      className="w-full border border-indigo-200 rounded px-2 py-1 text-sm uppercase" 
                      value={formData.initials} 
                      onChange={e => setFormData({...formData, initials: e.target.value})}
                      placeholder="Nº"
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
              Adicionar Novo Funcionário
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeManager;