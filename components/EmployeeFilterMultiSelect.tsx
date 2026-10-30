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

  // All employee IDs
  const allIds = useMemo(() => employees.map(e => e.id), [employees]);

  // Check state cleanly
  const isNoneSelected = selectedIds.includes('__NONE__');
  const cleanSelectedIds = useMemo(
    () => selectedIds.filter(id => id !== '__NONE__'),
    [selectedIds]
  );
  const isAllSelected =
    !isNoneSelected && (cleanSelectedIds.length === 0 || cleanSelectedIds.length === employees.length);

  // Selected Set for fast lookup
  const selectedSet = useMemo(() => {
    if (isNoneSelected) {
      return new Set<string>();
    }
    if (isAllSelected) {
      return new Set<string>(allIds);
    }
    return new Set<string>(cleanSelectedIds);
  }, [isNoneSelected, isAllSelected, allIds, cleanSelectedIds]);

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

  // Toggle single employee (supports multiple selection at all times)
  const handleToggle = (empId: string) => {
    if (isAllSelected) {
      // If currently all selected and user clicks one, deselect this one
      const next = allIds.filter(id => id !== empId);
      onChange(next.length === 0 ? ['__NONE__'] : next);
      return;
    }

    if (isNoneSelected) {
      // If currently none are selected, select this clicked one
      onChange([empId]);
      return;
    }

    // Partial selection active
    if (selectedSet.has(empId)) {
      // Deselect this one
      const next = cleanSelectedIds.filter(id => id !== empId);
      if (next.length === 0) {
        onChange(['__NONE__']);
      } else {
        onChange(next);
      }
    } else {
      // Select this one (adds to existing multiple selection)
      const next = [...cleanSelectedIds, empId];
      if (next.length === employees.length) {
        onChange([]); // [] represents all selected
      } else {
        onChange(next);
      }
    }
  };

  // Select All
  const handleSelectAll = () => {
    onChange([]); // [] represents all
  };

  // Deselect All
  const handleClearAll = () => {
    onChange(['__NONE__']); // '__NONE__' explicitly means zero selected
  };

  // Toggle Role / Work Group (supports multi-selection across multiple groups)
  const handleToggleRole = (role: string) => {
    const roleEmpIds = employees.filter(e => e.role === role).map(e => e.id);
    if (roleEmpIds.length === 0) return;

    if (isAllSelected) {
      // If all are selected, clicking a group selects only that group first
      if (roleEmpIds.length === employees.length) {
        onChange([]);
      } else {
        onChange(roleEmpIds);
      }
      return;
    }

    if (isNoneSelected) {
      // If none selected, select this group
      onChange(roleEmpIds);
      return;
    }

    // Check if all members of this group are already selected
    const allRoleMembersSelected = roleEmpIds.every(id => selectedSet.has(id));

    let nextIds: string[];
    if (allRoleMembersSelected) {
      // Group was already selected, so unselect (toggle off) all members of this group
      const roleSet = new Set(roleEmpIds);
      nextIds = cleanSelectedIds.filter(id => !roleSet.has(id));
      if (nextIds.length === 0) {
        onChange(['__NONE__']);
        return;
      }
    } else {
      // Group was not fully selected, so add all members to current selection (multi-group)
      const combined = new Set([...cleanSelectedIds, ...roleEmpIds]);
      nextIds = Array.from(combined);
    }

    if (nextIds.length === employees.length) {
      onChange([]); // [] represents all selected
    } else {
      onChange(nextIds);
    }
  };

  // Human-readable trigger label
  const triggerLabel = useMemo(() => {
    if (isNoneSelected) {
      return 'Nenhum selecionado';
    }
    if (isAllSelected) {
      return `Todos (${employees.length})`;
    }

    // Check which roles are fully selected
    const fullySelectedRoles = distinctRoles.filter(role => {
      const rIds = employees.filter(e => e.role === role).map(e => e.id);
      return rIds.length > 0 && rIds.every(id => selectedSet.has(id));
    });

    const totalInFullySelectedRoles = fullySelectedRoles.reduce((acc, role) => {
      return acc + employees.filter(e => e.role === role).length;
    }, 0);

    // If exact match with selected roles
    if (fullySelectedRoles.length > 0 && totalInFullySelectedRoles === cleanSelectedIds.length) {
      if (fullySelectedRoles.length === 1) {
        return `${fullySelectedRoles[0]} (${cleanSelectedIds.length})`;
      }
      return `${fullySelectedRoles.length} Grupos (${cleanSelectedIds.length})`;
    }

    if (cleanSelectedIds.length === 1) {
      const single = employees.find(e => e.id === cleanSelectedIds[0]);
      return single ? `${single.name} (${single.initials})` : '1 selecionado';
    }
    return `${cleanSelectedIds.length} selecionados`;
  }, [isNoneSelected, isAllSelected, cleanSelectedIds, employees, distinctRoles, selectedSet]);

  const hasActiveFilter = !isAllSelected;

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      {/* Trigger Button */}
      <div className="flex items-center">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold shadow-2xs transition-all cursor-pointer ${
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
            className="ml-1 p-1 text-slate-400 hover:text-red-500 hover:bg-slate-100 rounded-md transition cursor-pointer"
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
              {isAllSelected ? employees.length : isNoneSelected ? 0 : cleanSelectedIds.length} de {employees.length}
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
                  className="absolute right-2 text-slate-400 hover:text-slate-600 cursor-pointer"
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
          {distinctRoles.length > 0 && (
            <div className="px-2 py-1.5 border-b border-slate-100 flex items-center gap-1 overflow-x-auto custom-scrollbar text-[10px]">
              <span className="text-slate-400 shrink-0 font-medium mr-0.5">Grupos:</span>
              {distinctRoles.map(role => {
                const roleEmps = employees.filter(e => e.role === role);
                const roleIds = roleEmps.map(e => e.id);
                const isFullyActive = !isNoneSelected && roleIds.length > 0 && roleIds.every(id => selectedSet.has(id));
                const isPartiallyActive = !isNoneSelected && !isFullyActive && roleIds.some(id => selectedSet.has(id));

                return (
                  <button
                    key={role}
                    type="button"
                    onClick={() => handleToggleRole(role)}
                    className={`px-2 py-0.5 rounded-md shrink-0 transition-all cursor-pointer font-medium flex items-center gap-1 ${
                      isFullyActive
                        ? 'bg-indigo-600 text-white shadow-2xs font-bold'
                        : isPartiallyActive
                        ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                    title={
                      isFullyActive
                        ? `Grupo ${role} ativo. Clique para desmarcar.`
                        : `Clique para adicionar o grupo ${role} à seleção.`
                    }
                  >
                    {isFullyActive && <Check size={10} strokeWidth={3} className="shrink-0" />}
                    <span>{role}</span>
                    <span className={`text-[9px] ${isFullyActive ? 'text-indigo-200' : 'text-slate-400'}`}>
                      ({roleEmps.length})
                    </span>
                  </button>
                );
              })}
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
                const isChecked = selectedSet.has(emp.id);

                return (
                  <div
                    key={emp.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleToggle(emp.id)}
                    onKeyDown={(e) => {
                      if (e.key === ' ' || e.key === 'Enter') {
                        e.preventDefault();
                        handleToggle(emp.id);
                      }
                    }}
                    className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer transition select-none ${
                      isChecked ? 'bg-indigo-50/60 hover:bg-indigo-50' : 'hover:bg-slate-50'
                    }`}
                  >
                    {/* Checkbox icon */}
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
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-medium truncate max-w-[90px]">
                          {emp.role}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer with Done button */}
          <div className="p-2 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">
              {isAllSelected
                ? 'Todos visíveis'
                : isNoneSelected
                ? 'Nenhum selecionado'
                : `${cleanSelectedIds.length} visíveis`}
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer"
            >
              Concluir
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
