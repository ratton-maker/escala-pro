import { GoogleGenAI, Type } from "@google/genai";
import { Employee, ShiftType, ScheduleEntry } from '../types';

export const generateSmartSchedule = async (
  targetEmployeeIds: string[],
  startDate: string,
  daysToGenerate: number,
  allEmployees: Employee[],
  shifts: ShiftType[],
  pattern: string
): Promise<ScheduleEntry[]> => {
  if (!process.env.API_KEY) {
    console.error("API Key missing in environment variables");
    throw new Error("A API Key não foi encontrada. Configure a variável de ambiente 'API_KEY' nas definições do seu alojamento (GitHub Secrets, Vercel, etc).");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Filter only the targeted employees
  const targetEmployees = allEmployees.filter(e => targetEmployeeIds.includes(e.id));
  
  if (targetEmployees.length === 0) return [];

  const empList = targetEmployees.map(e => `${e.id}:${e.name}`).join(', ');
  const shiftList = shifts.map(s => `${s.id}:${s.code}(${s.label})`).join(', ');

  const prompt = `
    You are a schedule generator assistant.
    
    Task: Create a work schedule for the following specific employees.
    Start Date: ${startDate}
    Duration: ${daysToGenerate} days.
    
    Target Employees: [${empList}]
    Available Shift Types (ID:Code): [${shiftList}]
    
    USER INSTRUCTION (Pattern): "${pattern}"
    
    Rules:
    1. Parse the user's pattern (which might use natural language like "Morning", "Night", "Off") and map it to the closest available Shift Type ID.
    2. Apply this sequence REPEATEDLY for the duration of the requested days for EACH selected employee.
    3. IMPORTANT: You MUST generate entries for EVERY SINGLE DAY from the Start Date up to (Start Date + Duration - 1). Do not stop early.
    4. If multiple employees are selected, apply the SAME pattern to all of them starting on the Start Date, unless the user instruction implies a staggered rotation.
    5. If the user instruction is vague, default to matching the shift codes provided.
    
    Output:
    Return a pure JSON array of ScheduleEntry objects.
  `;

  try {
    let response;
    let attempts = 0;
    const maxAttempts = 3;

    while (true) {
      try {
        attempts++;
        response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  dateStr: { type: Type.STRING, description: "YYYY-MM-DD" },
                  employeeId: { type: Type.STRING },
                  shiftTypeId: { type: Type.STRING },
                  note: { type: Type.STRING, description: "Optional note if specified in pattern" }
                },
                required: ["dateStr", "employeeId", "shiftTypeId"]
              }
            }
          }
        });
        break; // Success
      } catch (callError: any) {
        const msg = callError.message || JSON.stringify(callError);
        if ((msg.includes("503") || msg.includes("high demand") || msg.includes("UNAVAILABLE")) && attempts < maxAttempts) {
            console.warn(`Gemini overloaded (503), retrying attempt ${attempts}/${maxAttempts}...`);
            await new Promise(resolve => setTimeout(resolve, 2000 * attempts)); // Wait 2s, then 4s
            continue;
        }
        throw callError;
      }
    }

    // Clean up potential markdown code blocks from the response
    let jsonStr = response.text || '[]';
    jsonStr = jsonStr.replace(/```json/g, '').replace(/```/g, '').trim();

    let data;
    try {
      data = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("Failed to parse JSON from Gemini:", jsonStr);
      throw new Error("A IA gerou uma resposta inválida. Tente novamente.");
    }
    
    // Validate and add IDs
    return data.map((entry: any) => ({
      ...entry,
      id: crypto.randomUUID(),
      isLocked: false
    }));

  } catch (error: any) {
    console.error("Gemini Scheduling Error:", error);
    
    const errorMessage = error.message || JSON.stringify(error);

    // 0. Erro: Sobrecarga (503) - Se chegou aqui é porque as tentativas falharam
    if (errorMessage.includes("503") || errorMessage.includes("high demand") || errorMessage.includes("UNAVAILABLE")) {
        throw new Error(
            "O sistema de IA está com muita procura neste momento (Erro 503).\n" +
            "Por favor, aguarde 1 minuto e tente novamente."
        );
    }

    // 1. Erro: Projeto desligado
    if (errorMessage.includes("Generative Language API has not been used") || errorMessage.includes("SERVICE_DISABLED")) {
        throw new Error(
           "A API do Gemini está desligada no seu projeto Google.\n" +
           "Aceda a: https://console.developers.google.com/apis/api/generative-language.googleapis.com/overview \n" +
           "Selecione o seu projeto e clique em 'ENABLE' (Ativar)."
        );
    }

    // 2. Erro: Chave Bloqueada (provavelmente usando a chave do Firebase)
    if (errorMessage.includes("API_KEY_SERVICE_BLOCKED") || errorMessage.includes("Requests to this API... are blocked")) {
        throw new Error(
            "A Chave API atual está bloqueada para IA. \n" +
            "Provavelmente está a usar a chave do Firebase, que tem restrições.\n\n" +
            "SOLUÇÃO:\n" +
            "1. Vá a https://aistudio.google.com/app/apikey \n" +
            "2. Crie uma NOVA chave API.\n" +
            "3. No Vercel, vá a Settings > Environment Variables e atualize a variável 'API_KEY' com esta nova chave."
        );
    }

    throw new Error(error.message || "Erro desconhecido ao comunicar com a IA.");
  }
};