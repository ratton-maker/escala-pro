import React, { useState, useMemo } from 'react';
import { Employee } from '../types';
import { CATEGORY_OPTIONS, getEmployeeCategory } from '../constants';
import { X, Plus, Trash2, Save, User, ArrowUp, ArrowDown, Search, ShieldCheck } from 'lucide-react';

interface EmployeeManagerProps {
  employees: Employee[];
  onSave: (employee: Employee) => void;
  onDelete: (id: string) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  onClose: () => void;
}

const EmployeeManager: React.FC<EmployeeManagerProps> = ({ 
  employees, 
  onSave, 
  onDelete, 
  onReorder, 
  onClose 
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Employee>>({});
  const [searchFilter, setSearchFilter] = useState('');

  const handleEdit = (emp: Employee) => {
    setEditingId(emp.id);
    setFormData({
      ...emp,
      category: emp.category?.trim() || getEmployeeCategory(emp)
    });
  };

  const handleNew = () => {
    setEditingId('NEW');
    setFormData({ 
      id: crypto.randomUUID(), 
      name: '', 
      category: 'Agente Principal', 
      role: '', 
      initials: '' 
    });
  };

  const handleSave = () => {
    if (formData.name && formData.id) {
      const finalCategory = (formData.category && formData.category.trim()) 
        ? formData.category.trim() 
        : getEmployeeCategory(formData);

      onSave({
        id: formData.id,
        name: formData.name.trim(),
        role: formData.role?.trim() || '',
        initials: formData.initials?.trim() || '',
        category: finalCategory
      });
      setEditingId(null);
      setFormData({});
    }
  };

  // Filter employees by search term if active
  const filteredEmployeesWithIndex = useMemo(() => {
    return employees
      .map((emp, originalIndex) => ({ emp, originalIndex }))
      .filter(({ emp }) => {
        if (!searchFilter.trim()) return true;
        const term = searchFilter.toLowerCase();
        const cat = (emp.category || getEmployeeCategory(emp)).toLowerCase();
        return (
          emp.name.toLowerCase().includes(term) ||
          cat.includes(term) ||
          emp.role.toLowerCase().includes(term) ||
          emp.initials.toLowerCase().includes(term)
        );
      });
  }, [employees, searchFilter]);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-800 flex items-center gap-2">
              <User className="text-indigo-600" size={22} />
              Gestão de Funcionários / Equipa
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Gestão de Nome, Categoria, Função e Matrícula dos operacionais
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-slate-200 rounded-full transition text-slate-500"
            title="Fechar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search bar and counter */}
        <div className="px-6 py-3 bg-white border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              value={searchFilter}
              onChange={e => setSearchFilter(e.target.value)}
              placeholder="Pesquisar por nome, categoria, função ou matrícula..."
              className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
            {searchFilter && (
              <button 
                onClick={() => setSearchFilter('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>
          <div className="text-xs text-slate-500 font-medium">
            Total: <span className="font-bold text-slate-800">{employees.length}</span> funcionários
          </div>
        </div>

        {/* Data List for Categories */}
        <datalist id="category-options-list">
          {CATEGORY_OPTIONS.map(cat => (
            <option key={cat} value={cat} />
          ))}
        </datalist>

        {/* Table Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
          
          {/* List Header */}
          <div className="grid grid-cols-12 gap-2 sm:gap-3 mb-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider px-2">
            <div className="col-span-1 text-center">Ord.</div>
            <div className="col-span-3">Nome</div>
            <div className="col-span-3">Categoria</div>
            <div className="col-span-2">Função</div>
            <div className="col-span-1 text-center">Matrícula</div>
            <div className="col-span-2 text-right">Ações</div>
          </div>

          <div className="space-y-2">
            {filteredEmployeesWithIndex.map(({ emp, originalIndex }) => (
              <div 
                key={emp.id} 
                className="grid grid-cols-12 gap-2 sm:gap-3 items-center p-2.5 sm:p-3 rounded-lg border border-slate-100 bg-white hover:border-slate-300 transition-colors"
              >
                {editingId === emp.id ? (
                  <>
                    <div className="col-span-1 text-center text-xs font-mono text-slate-400">
                      {originalIndex + 1}
                    </div>
                    {/* Nome */}
                    <div className="col-span-3">
                      <input 
                        className="w-full border border-indigo-300 rounded px-2 py-1 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20" 
                        value={formData.name || ''} 
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Nome"
                      />
                    </div>
                    {/* Categoria */}
                    <div className="col-span-3">
                      <input 
                        list="category-options-list"
                        className="w-full border border-indigo-300 rounded px-2 py-1 text-xs sm:text-sm bg-indigo-50/40 text-indigo-950 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20" 
                        value={formData.category || ''} 
                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                        placeholder="Ex: Agente Principal"
                      />
                    </div>
                    {/* Função */}
                    <div className="col-span-2">
                      <input 
                        className="w-full border border-indigo-300 rounded px-2 py-1 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" 
                        value={formData.role || ''} 
                        onChange={e => setFormData({ ...formData, role: e.target.value })}
                        placeholder="Função"
                      />
                    </div>
                    {/* Matrícula */}
                    <div className="col-span-1">
                      <input 
                        className="w-full border border-indigo-300 rounded px-1.5 py-1 text-xs sm:text-sm font-mono text-center uppercase focus:outline-none focus:ring-2 focus:ring-indigo-500/20" 
                        value={formData.initials || ''} 
                        onChange={e => setFormData({ ...formData, initials: e.target.value })}
                        placeholder="Nº"
                      />
                    </div>
                    {/* Ações */}
                    <div className="col-span-2 flex justify-end gap-1.5">
                      <button 
                        onClick={handleSave} 
                        className="bg-emerald-600 hover:bg-emerald-700 text-white p-1.5 rounded transition"
                        title="Guardar alterações"
                      >
                        <Save size={16} />
                      </button>
                      <button 
                        onClick={() => setEditingId(null)} 
                        className="text-slate-400 hover:bg-slate-100 p-1.5 rounded transition"
                        title="Cancelar"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Reorder Arrows */}
                    <div className="col-span-1 flex flex-col items-center gap-0.5">
                      <button 
                        disabled={originalIndex === 0 || !!searchFilter}
                        onClick={() => onReorder(originalIndex, originalIndex - 1)}
                        className="text-slate-400 hover:text-indigo-600 disabled:opacity-20 disabled:cursor-not-allowed transition"
                        title="Mover para cima"
                      >
                        <ArrowUp size={13} />
                      </button>
                      <button 
                        disabled={originalIndex === employees.length - 1 || !!searchFilter}
                        onClick={() => onReorder(originalIndex, originalIndex + 1)}
                        className="text-slate-400 hover:text-indigo-600 disabled:opacity-20 disabled:cursor-not-allowed transition"
                        title="Mover para baixo"
                      >
                        <ArrowDown size={13} />
                      </button>
                    </div>

                    {/* Nome */}
                    <div className="col-span-3 font-semibold text-slate-800 text-xs sm:text-sm truncate" title={emp.name}>
                      {emp.name}
                    </div>

                    {/* Categoria */}
                    <div className="col-span-3">
                      <span className="inline-flex items-center gap-1 text-[11px] sm:text-xs font-semibold text-indigo-800 bg-indigo-50 border border-indigo-100/80 px-2 py-0.5 rounded-md truncate max-w-full">
                        <ShieldCheck size={12} className="text-indigo-600 shrink-0" />
                        <span className="truncate">{emp.category?.trim() || getEmployeeCategory(emp)}</span>
                      </span>
                    </div>

                    {/* Função */}
                    <div className="col-span-2 text-xs text-slate-600 truncate" title={emp.role || '-'}>
                      {emp.role || '-'}
                    </div>

                    {/* Matrícula */}
                    <div className="col-span-1 text-center">
                      <span className="inline-block text-xs font-mono font-bold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                        {emp.initials || emp.id}
                      </span>
                    </div>

                    {/* Ações */}
                    <div className="col-span-2 flex justify-end gap-1">
                      <button 
                        onClick={() => handleEdit(emp)} 
                        className="text-indigo-600 hover:bg-indigo-50 px-2 py-1 rounded text-xs font-medium transition"
                      >
                        Editar
                      </button>
                      <button 
                        onClick={() => onDelete(emp.id)} 
                        className="text-red-500 hover:bg-red-50 p-1 rounded transition"
                        title="Remover"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}

            {filteredEmployeesWithIndex.length === 0 && (
              <div className="py-8 text-center text-slate-400 text-xs sm:text-sm italic">
                Nenhum funcionário encontrado para a pesquisa informada.
              </div>
            )}
            
            {/* New Employee Form Row */}
            {editingId === 'NEW' && (
              <div className="grid grid-cols-12 gap-2 sm:gap-3 items-center p-3 rounded-lg border-2 border-indigo-200 bg-indigo-50/40">
                <div className="col-span-1 text-center text-xs font-mono text-indigo-400 font-bold">
                  NOVO
                </div>
                {/* Nome */}
                <div className="col-span-3">
                  <input 
                    autoFocus
                    className="w-full border border-indigo-300 rounded px-2 py-1 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20" 
                    value={formData.name || ''} 
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Nome completo"
                  />
                </div>
                {/* Categoria */}
                <div className="col-span-3">
                  <input 
                    list="category-options-list"
                    className="w-full border border-indigo-300 rounded px-2 py-1 text-xs sm:text-sm bg-white text-indigo-950 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20" 
                    value={formData.category || ''} 
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    placeholder="Categoria (ex: Agente Principal)"
                  />
                </div>
                {/* Função */}
                <div className="col-span-2">
                  <input 
                    className="w-full border border-indigo-300 rounded px-2 py-1 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" 
                    value={formData.role || ''} 
                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                    placeholder="Função (ex: Fiscal)"
                  />
                </div>
                {/* Matrícula */}
                <div className="col-span-1">
                  <input 
                    className="w-full border border-indigo-300 rounded px-1.5 py-1 text-xs sm:text-sm font-mono text-center uppercase focus:outline-none focus:ring-2 focus:ring-indigo-500/20" 
                    value={formData.initials || ''} 
                    onChange={e => setFormData({ ...formData, initials: e.target.value })}
                    placeholder="Matrícula"
                  />
                </div>
                {/* Ações */}
                <div className="col-span-2 flex justify-end gap-1.5">
                  <button 
                    onClick={handleSave} 
                    disabled={!formData.name?.trim()}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white p-1.5 rounded transition shadow-xs"
                    title="Guardar novo funcionário"
                  >
                    <Save size={16} />
                  </button>
                  <button 
                    onClick={() => setEditingId(null)} 
                    className="text-slate-500 hover:bg-slate-200 p-1.5 rounded transition"
                    title="Cancelar"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200">
          {!editingId && (
            <button 
              onClick={handleNew}
              className="w-full py-2.5 sm:py-3 rounded-lg border-2 border-dashed border-slate-300 text-slate-600 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50/60 transition flex items-center justify-center gap-2 font-semibold text-xs sm:text-sm"
            >
              <Plus size={18} />
              Adicionar Novo Funcionário
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeManager;