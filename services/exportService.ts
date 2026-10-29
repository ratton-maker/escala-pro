import { utils, writeFile } from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Employee, ScheduleEntry, ShiftType, ScheduleState } from '../types';

// Helper to trigger safe download in browsers/sandboxed iframes
const savePdfSafely = (doc: jsPDF, fileName: string) => {
  try {
    doc.save(`${fileName}.pdf`);
  } catch {
    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${fileName}.pdf`;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 500);
  }
};

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
        }).join('\n');
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
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 30 } },
  });

  savePdfSafely(doc, fileName);
};

export interface DailyReportRow {
  funcao: string;
  categoria: string;
  matricula: string;
  nome: string;
  horario: string;
  observacoes: string;
}

export const exportDailyScheduleToPDF = (
  selectedDate: string,
  dayOfWeek: string,
  mainRows: DailyReportRow[],
  indisponibilidadeRows: DailyReportRow[],
  extractionDateTime: string
) => {
  const doc = new jsPDF('p', 'mm', 'a4'); // Portrait A4

  // Header Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('CM LISBOA', 105, 15, { align: 'center' });
  doc.setFontSize(12);
  doc.text('CM LSB AMD-Esqª de Trânsito da Amadora', 105, 22, { align: 'center' });

  doc.setFontSize(10);
  doc.text(`Escala de Serviço APROVADA para ${dayOfWeek} dia: ${selectedDate}`, 14, 32);
  doc.setFontSize(9);
  doc.text('Órgão Base - Funções de Situação Diária', 14, 38);

  // Prepare table rows
  const tableRows: any[] = [];

  // Main schedule rows
  mainRows.forEach(row => {
    tableRows.push([
      row.funcao || '',
      row.categoria || '',
      row.matricula || '',
      row.nome || '',
      row.horario || '',
      row.observacoes || ''
    ]);
  });

  // Indisponibilidades section if present
  if (indisponibilidadeRows.length > 0) {
    tableRows.push([
      {
        content: 'Indisponibilidade/Diligência',
        colSpan: 4,
        styles: { fontStyle: 'bold', fillColor: [230, 230, 230], textColor: [0, 0, 0] }
      },
      {
        content: `Total Efectivos da Função: ${indisponibilidadeRows.length}`,
        colSpan: 2,
        styles: { fontStyle: 'bold', halign: 'right', fillColor: [230, 230, 230], textColor: [0, 0, 0] }
      }
    ]);

    indisponibilidadeRows.forEach(row => {
      tableRows.push([
        row.funcao || '',
        row.categoria || '',
        row.matricula || '',
        row.nome || '',
        row.horario || '',
        row.observacoes || ''
      ]);
    });
  }

  autoTable(doc, {
    startY: 42,
    head: [
      [
        { content: 'Função', styles: { halign: 'center' } },
        { content: 'Categoria', styles: { halign: 'center' } },
        { content: 'Matrícula', styles: { halign: 'center' } },
        { content: 'Nome', styles: { halign: 'center' } },
        { content: 'Horário', styles: { halign: 'center' } },
        { content: 'Observações', styles: { halign: 'center' } }
      ]
    ],
    body: tableRows,
    theme: 'plain',
    styles: {
      fontSize: 8,
      cellPadding: 1.5,
      textColor: [20, 20, 20],
      lineColor: [0, 0, 0],
      lineWidth: 0.1,
      overflow: 'linebreak'
    },
    headStyles: {
      fillColor: [240, 240, 240],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      lineColor: [0, 0, 0],
      lineWidth: 0.2
    },
    columnStyles: {
      0: { cellWidth: 32 }, // Função
      1: { cellWidth: 26, halign: 'center' }, // Categoria
      2: { cellWidth: 18, halign: 'center' }, // Matrícula
      3: { cellWidth: 48, fontStyle: 'bold' }, // Nome
      4: { cellWidth: 38, halign: 'center' }, // Horário
      5: { cellWidth: 26, halign: 'center' }  // Observações
    },
    didDrawPage: (data) => {
      // Footer on every page
      const pageHeight = doc.internal.pageSize.height || 297;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(`Data/Hora de extracção: ${extractionDateTime}`, 14, pageHeight - 8);
      const str = `Pág. ${data.pageNumber}`;
      doc.text(str, 196, pageHeight - 8, { align: 'right' });
    }
  });

  savePdfSafely(doc, `escala_diaria_${selectedDate}`);
};

