import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Employee } from '../types';
import { Filter, Check, ChevronDown, X, Search, Users } from 'lucide-react';

interface EmployeeFilterMultiSelectProps {
  employees: Employee[];
  selectedIds: string[];
  onChange: (selectedIds: string[]) => void;
  className?: string;
}

export const EmployeeFilterMultiSelect: React.FC<EmployeeFilterMultiSelectProps> = ({
  employees,
  selectedIds,
  onChange,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click or Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Determine if all are currently selected
  const allIds = useMemo(() => employees.map(e => e.id), [employees]);
  const isAllSelected = selectedIds.length === 0 || selectedIds.length === employees.length;

  // Selected Set for quick lookup
  const selectedSet = useMemo(() => {
    if (isAllSelected) {
      return new Set(allIds);
    }
    return new Set(selectedIds);
  }, [selectedIds, isAllSelected, allIds]);

  // Distinct roles for quick filter chips
  const distinctRoles = useMemo(() => {
    const roles = Array.from(new Set(employees.map(e => e.role).filter(Boolean)));
    return roles.sort();
  }, [employees]);

  // Filtered employees by search
  const filteredEmployees = useMemo(() => {
    if (!searchQuery.trim()) return employees;
    const q = searchQuery.toLowerCase().trim();
    return employees.filter(
      e =>
        e.name.toLowerCase().includes(q) ||
        (e.role && e.role.toLowerCase().includes(q)) ||
        (e.initials && e.initials.toLowerCase().includes(q))
    );
  }, [employees, searchQuery]);

  // Toggle single employee
  const handleToggle = (empId: string) => {
    if (isAllSelected) {
      // If currently all selected and user clicks one, deselect that one
      const next = allIds.filter(id => id !== empId);
      onChange(next);
    } else {
      if (selectedSet.has(empId)) {
        const next = selectedIds.filter(id => id !== empId);
        // If user deselects down to empty, keep it empty or treat as none
        onChange(next);
      } else {
        const next = [...selectedIds, empId];
        // If now all are selected, normalize to empty array (meaning all)
        if (next.length === employees.length) {
          onChange([]);
        } else {
          onChange(next);
        }
      }
    }
  };

  // Select All
  const handleSelectAll = () => {
    onChange([]); // [] represents all
  };

  // Deselect All
  const handleClearAll = () => {
    // Select none: pass a non-existent marker or empty array?
    // In our convention:
    // [] = all selected
    // ['__NONE__'] = none selected
    // specific IDs = only those selected
    onChange(['__NONE__']);
  };

  // Select by Role
  const handleSelectRole = (role: string) => {
    const roleEmpIds = employees.filter(e => e.role === role).map(e => e.id);
    if (roleEmpIds.length === employees.length) {
      onChange([]);
    } else {
      onChange(roleEmpIds);
    }
  };

  // Human-readable trigger label
  const triggerLabel = useMemo(() => {
    if (selectedIds.includes('__NONE__') || (!isAllSelected && selectedIds.length === 0)) {
      return 'Nenhum selecionado';
    }
    if (isAllSelected) {
      return `Todos (${employees.length})`;
    }
    if (selectedIds.length === 1) {
      const single = employees.find(e => e.id === selectedIds[0]);
      return single ? `${single.name} (${single.initials})` : '1 selecionado';
    }
    return `${selectedIds.length} selecionados`;
  }, [selectedIds, isAllSelected, employees]);

  const hasActiveFilter = !isAllSelected;

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      {/* Trigger Button */}
      <div className="flex items-center">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold shadow-2xs transition-all ${
            hasActiveFilter
              ? 'bg-indigo-50 border-indigo-300 text-indigo-700 hover:bg-indigo-100/70'
              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
          title="Filtro de Funcionários (Múltipla Escolha)"
        >
          <Filter
            size={13}
            className={hasActiveFilter ? 'text-indigo-600 shrink-0' : 'text-slate-400 shrink-0'}
          />
          <span className="truncate max-w-[120px] sm:max-w-[170px]">{triggerLabel}</span>
          <ChevronDown
            size={13}
            className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {/* Quick clear button if a filter is active */}
        {hasActiveFilter && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleSelectAll();
            }}
            className="ml-1 p-1 text-slate-400 hover:text-red-500 hover:bg-slate-100 rounded-md transition"
            title="Limpar filtro (Ver Todos)"
          >
            <X size={13} />
          </button>
        )}
      </div>

      {/* Popover Dropdown */}
      {isOpen && (
        <div
          className="absolute right-0 sm:left-auto mt-1.5 w-[280px] sm:w-[320px] max-w-[calc(100vw-24px)] bg-white rounded-xl shadow-xl border border-slate-200 z-50 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
          style={{ maxHeight: '420px' }}
        >
          {/* Header */}
          <div className="p-2.5 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
              <Users size={14} className="text-indigo-600" />
              <span>Filtrar Funcionários</span>
            </div>
            <span className="text-[11px] font-medium text-slate-500">
              {isAllSelected ? employees.length : selectedIds.includes('__NONE__') ? 0 : selectedIds.length} de {employees.length}
            </span>
          </div>

          {/* Search Input */}
          <div className="p-2 border-b border-slate-100">
            <div className="relative flex items-center">
              <Search size={13} className="absolute left-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Pesquisar por nome ou função..."
                className="w-full pl-8 pr-7 py-1 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-slate-50/50"
                autoFocus
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 text-slate-400 hover:text-slate-600"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          {/* Quick Select Actions */}
          <div className="px-2.5 py-1.5 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between text-[11px]">
            <button
              type="button"
              onClick={handleSelectAll}
              className="font-semibold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
            >
              Selecionar Todos
            </button>
            <span className="text-slate-300">|</span>
            <button
              type="button"
              onClick={handleClearAll}
              className="font-semibold text-slate-500 hover:text-red-600 hover:underline cursor-pointer"
            >
              Desmarcar Todos
            </button>
          </div>

          {/* Role filter chips */}
          {distinctRoles.length > 1 && (
            <div className="px-2 py-1.5 border-b border-slate-100 flex items-center gap-1 overflow-x-auto custom-scrollbar text-[10px]">
              <span className="text-slate-400 shrink-0 font-medium mr-0.5">Grupos:</span>
              {distinctRoles.map(role => (
                <button
                  key={role}
                  type="button"
                  onClick={() => handleSelectRole(role)}
                  className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 shrink-0 transition"
                >
                  {role}
                </button>
              ))}
            </div>
          )}

          {/* Employees List */}
          <div className="overflow-y-auto flex-1 p-1 max-h-[220px] custom-scrollbar divide-y divide-slate-50">
            {filteredEmployees.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">
                Nenhum funcionário encontrado.
              </div>
            ) : (
              filteredEmployees.map(emp => {
                const isChecked = selectedIds.includes('__NONE__') ? false : selectedSet.has(emp.id);

                return (
                  <label
                    key={emp.id}
                    onClick={() => handleToggle(emp.id)}
                    className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer transition select-none ${
                      isChecked ? 'bg-indigo-50/50 hover:bg-indigo-50' : 'hover:bg-slate-50'
                    }`}
                  >
                    {/* Custom Checkbox */}
                    <div
                      className={`w-4 h-4 rounded flex items-center justify-center border transition-colors shrink-0 ${
                        isChecked
                          ? 'bg-indigo-600 border-indigo-600 text-white'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isChecked && <Check size={11} strokeWidth={3} />}
                    </div>

                    {/* Initials badge */}
                    <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold flex items-center justify-center shrink-0">
                      {emp.initials}
                    </span>

                    {/* Name & Role */}
                    <div className="flex-1 min-w-0 flex items-center justify-between gap-1">
                      <span className="text-xs font-bold text-slate-800 truncate">
                        {emp.name}
                      </span>
                      {emp.role && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-500 font-medium truncate max-w-[90px]">
                          {emp.role}
                        </span>
                      )}
                    </div>
                  </label>
                );
              })
            )}
          </div>

          {/* Footer with Done button */}
          <div className="p-2 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">
              {isAllSelected
                ? 'Todos visíveis'
                : selectedIds.includes('__NONE__')
                ? 'Nenhum selecionado'
                : `${selectedIds.length} visíveis`}
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
            >
              Concluir
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
