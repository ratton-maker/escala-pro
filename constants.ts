import { Employee, ShiftType } from './types';

export const INITIAL_EMPLOYEES: Employee[] = [
  { id: '1', name: 'PAIS', role: 'CMDT', initials: 'PA' },
  { id: '2', name: 'PISCO', role: 'SVISOR', initials: 'PI' },
  { id: '3', name: 'ELZO', role: 'SVISOR', initials: 'EL' },
  { id: '4', name: 'PINA', role: 'ESCRIT.', initials: 'PN' },
  { id: '5', name: 'SERRÃO', role: 'FISCALIZAÇÃO', initials: 'SE' },
  { id: '6', name: 'BORBINHA', role: 'FISCALIZAÇÃO', initials: 'BO' },
  { id: '7', name: 'RAMINHOS', role: 'FISCALIZAÇÃO', initials: 'RA' },
  { id: '8', name: 'TEIXEIRA', role: 'MOTOCICLOS', initials: 'TE' },
  { id: '9', name: 'SILVA', role: 'MOTOCICLOS', initials: 'SI' },
  { id: '10', name: 'BEJA', role: 'MOTOCICLOS', initials: 'BE' },
  { id: '11', name: 'TOMÁS', role: 'MOTOCICLOS', initials: 'TO' },
  { id: '12', name: 'DIAS', role: 'MOTOCICLOS', initials: 'DI' },
  { id: '13', name: 'LINO', role: 'MOTOCICLOS', initials: 'LI' },
  { id: '14', name: 'NABAIS', role: 'PARQUE 1', initials: 'NA' },
];

export const SHIFT_TYPES: ShiftType[] = [
  { id: 'folga', code: 'FOLGA', label: 'Folga Semanal', color: 'bg-yellow-300', textColor: 'text-black', isOffDay: true },
  
  // User's Requested Times (using original IDs where possible to preserve data)
  { id: '00-0815', code: '00:00-08:15', label: 'Noite', color: 'bg-white', textColor: 'text-slate-800', isOffDay: false },
  { id: '0745-1645', code: '07:45-16:45', label: 'Dia', color: 'bg-white', textColor: 'text-slate-800', isOffDay: false },
  { id: '0745-1630', code: '07:45-16:30', label: 'Dia', color: 'bg-white', textColor: 'text-slate-800', isOffDay: false },
  { id: '0745-1615', code: '07:45-16:15', label: 'Dia', color: 'bg-white', textColor: 'text-slate-800', isOffDay: false },
  { id: '0800-1600', code: '08:00-16:00', label: 'Dia', color: 'bg-white', textColor: 'text-slate-800', isOffDay: false },
  { id: '08-15', code: '08:00-15:00', label: 'Dia', color: 'bg-white', textColor: 'text-slate-800', isOffDay: false }, // Preserved ID
  { id: '09-1730', code: '09:00-17:30', label: 'Dia', color: 'bg-white', textColor: 'text-slate-800', isOffDay: false }, // Preserved ID
  { id: '09-17', code: '09:00-17:00', label: 'Dia', color: 'bg-white', textColor: 'text-slate-800', isOffDay: false }, // Preserved ID
  { id: '13-20', code: '13:00-20:00', label: 'Tarde', color: 'bg-white', textColor: 'text-slate-800', isOffDay: false }, // Preserved ID
  { id: '1545-00', code: '15:45-00:00', label: 'Tarde/Noite', color: 'bg-white', textColor: 'text-slate-800', isOffDay: false }, // Preserved ID
  { id: '16-00', code: '16:00-00:00', label: 'Tarde/Noite', color: 'bg-white', textColor: 'text-slate-800', isOffDay: false }, // Preserved ID

  // Restored Special Shifts
  { id: 'acidentes', code: 'ACIDENTES', label: 'Piquete Acidentes', color: 'bg-red-500', textColor: 'text-white', isOffDay: false },
  { id: 'radar', code: 'RADAR', label: 'Fiscalização Radar', color: 'bg-orange-400', textColor: 'text-black', isOffDay: false },
  { id: 'trib', code: 'TRIB', label: 'Tribunal', color: 'bg-purple-300', textColor: 'text-black', isOffDay: false },
  { id: 'exc', code: 'EXC', label: 'Excecional', color: 'bg-blue-400', textColor: 'text-white', isOffDay: false },
  { id: 'balancas', code: 'BALANÇAS', label: 'Pesagem', color: 'bg-amber-400', textColor: 'text-black', isOffDay: false },
  
  { id: 'folga_troca', code: 'FOLGA P/T', label: 'Folga por Troca', color: 'bg-gray-400', textColor: 'text-white', isOffDay: true },
];
