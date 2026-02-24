import { utils, writeFile } from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Employee, ScheduleEntry, ShiftType, ScheduleState } from '../types';

export const exportToExcel = (
  days: Date[],
  employees: Employee[],
  shifts: ShiftType[],
  schedule: ScheduleState,
  fileName: string
) => {
  // Prepare data for Excel
  const header = ['Funcionário', ...days.map(d => d.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' }))];
  
  const data = employees.map(emp => {
    const row: any[] = [emp.name];
    days.forEach(day => {
      const dateStr = day.toISOString().split('T')[0];
      const key = `${dateStr}_${emp.id}`;
      const entries = schedule[key] || [];
      
      if (entries.length === 0) {
        row.push('');
      } else {
        const cellValue = entries.map(e => {
          const shift = shifts.find(s => s.id === e.shiftTypeId);
          let val = shift ? shift.code : '?';
          if (e.note) val += ` (${e.note})`;
          return val;
        }).join(', ');
        row.push(cellValue);
      }
    });
    return row;
  });

  const ws = utils.aoa_to_sheet([header, ...data]);
  const wb = utils.book_new();
  utils.book_append_sheet(wb, ws, "Escala");
  writeFile(wb, `${fileName}.xlsx`);
};

export const exportToPDF = (
  days: Date[],
  employees: Employee[],
  shifts: ShiftType[],
  schedule: ScheduleState,
  fileName: string,
  title: string
) => {
  const doc = new jsPDF('l', 'mm', 'a4'); // Landscape

  doc.setFontSize(16);
  doc.text(title, 14, 15);
  doc.setFontSize(10);
  doc.text(`Gerado em: ${new Date().toLocaleString('pt-PT')}`, 14, 22);

  const head = [['Funcionário', ...days.map(d => d.toLocaleDateString('pt-PT', { day: '2-digit' }))]];
  
  const body = employees.map(emp => {
    const row: string[] = [emp.name];
    days.forEach(day => {
      const dateStr = day.toISOString().split('T')[0];
      const key = `${dateStr}_${emp.id}`;
      const entries = schedule[key] || [];
      
      if (entries.length === 0) {
        row.push('');
      } else {
        const cellValue = entries.map(e => {
          const shift = shifts.find(s => s.id === e.shiftTypeId);
          return shift ? shift.code : '?';
        }).join('\n'); // New line for multiple shifts? Or comma? PDF table cells handle newlines.
        row.push(cellValue);
      }
    });
    return row;
  });

  autoTable(doc, {
    head: head,
    body: body,
    startY: 25,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 1, overflow: 'linebreak' },
    headStyles: { fillColor: [63, 81, 181], textColor: 255, fontStyle: 'bold' },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 30 } }, // Employee name column
    didParseCell: (data) => {
        // Color cells based on content? (Advanced feature, maybe later)
    }
  });

  doc.save(`${fileName}.pdf`);
};
