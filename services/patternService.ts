import { Employee, ShiftType, ScheduleEntry } from '../types';

export const generatePatternSchedule = (
  targetEmployeeIds: string[],
  startDate: string,
  daysToGenerate: number,
  allEmployees: Employee[],
  shifts: ShiftType[],
  pattern: string
): ScheduleEntry[] => {
  const targetEmployees = allEmployees.filter(e => targetEmployeeIds.includes(e.id));
  if (targetEmployees.length === 0) return [];

  // 1. Parse Pattern
  // Expected format: "ShiftCode1, ShiftCode2, FOLGA, ShiftCode3"
  // We split by comma and trim.
  const patternParts = pattern.split(',').map(p => p.trim()).filter(p => p.length > 0);

  if (patternParts.length === 0) {
    throw new Error("O padrão está vazio. Insira uma sequência de turnos separados por vírgula.");
  }

  // 2. Resolve Shift Types
  // We try to match each part to a ShiftType ID, Code, or Label (case-insensitive)
  // If "FOLGA" or "OFF", we treat it as a rest day (no shift entry).
  const resolvedPattern: (string | null)[] = patternParts.map(part => {
    const upperPart = part.toUpperCase();

    // 1. Explicit mapping for "FOLGA" or "F" to the 'folga' shift type (if it exists)
    // This ensures they appear as "Folga" (Yellow) instead of empty cells.
    const folgaShift = shifts.find(s => s.id === 'folga' || s.code.toUpperCase() === 'FOLGA');
    if (folgaShift && (upperPart === 'FOLGA' || upperPart === 'F')) {
        return folgaShift.id;
    }

    // 2. Explicit "Empty" keywords
    if (upperPart === 'OFF' || upperPart === 'EMPTY' || upperPart === 'X') {
      return null; // No shift
    }

    // 3. Try exact code match
    const byCode = shifts.find(s => s.code.toUpperCase() === upperPart);
    if (byCode) return byCode.id;

    // 4. Try label match
    const byLabel = shifts.find(s => s.label.toUpperCase() === upperPart);
    if (byLabel) return byLabel.id;

    // 5. Try ID match
    const byId = shifts.find(s => s.id === part);
    if (byId) return byId.id;

    // 6. Partial match on label (risky but helpful)
    const byPartialLabel = shifts.find(s => s.label.toUpperCase().includes(upperPart));
    if (byPartialLabel) return byPartialLabel.id;

    throw new Error(`Não foi possível identificar o turno: "${part}". Verifique os códigos em 'Gerir Tipos de Turno'.`);
  });

  const generatedEntries: ScheduleEntry[] = [];
  const start = new Date(startDate);

  // 3. Generate Schedule
  // Loop through days
  for (let dayOffset = 0; dayOffset < daysToGenerate; dayOffset++) {
    const currentDate = new Date(start);
    currentDate.setDate(start.getDate() + dayOffset);
    
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const day = String(currentDate.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    // Determine which step of the pattern we are in
    // We use modulo arithmetic to cycle through the pattern
    const patternIndex = dayOffset % resolvedPattern.length;
    const shiftTypeId = resolvedPattern[patternIndex];

    if (shiftTypeId) {
      // Create entry for EACH target employee
      targetEmployees.forEach(emp => {
        generatedEntries.push({
          id: crypto.randomUUID(),
          dateStr: dateStr,
          employeeId: emp.id,
          shiftTypeId: shiftTypeId,
          isLocked: false
        });
      });
    }
  }

  return generatedEntries;
};
