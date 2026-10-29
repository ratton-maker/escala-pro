import { initializeApp } from "firebase/app";
import { 
    initializeFirestore, 
    getFirestore, 
    doc, 
    getDoc, 
    getDocFromCache, 
    setDoc, 
    collection, 
    getDocs, 
    getDocsFromCache, 
    writeBatch, 
    query 
} from "firebase/firestore";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, User } from "firebase/auth";
import { firebaseConfig } from "../firebaseConfig";
import { Employee, ScheduleEntry, ScheduleState, ShiftType, HistoryLog } from "../types";

// Initialize Firebase
// We wrap this in a try-catch to avoid crashing if config is invalid
let db: any = null;
let auth: any = null;

try {
    // Basic check to see if user replaced the placeholder text
    if (!firebaseConfig.apiKey || firebaseConfig.apiKey.includes("SUA_API_KEY")) {
        console.warn("Firebase Config not set. Using LocalStorage fallback.");
    } else {
        const app = initializeApp(firebaseConfig);
        // Force long-polling to prevent WebChannel 10-second backend timeouts in iframe/browser sandboxes
        db = initializeFirestore(app, {
            experimentalForceLongPolling: true,
        });
        auth = getAuth(app);
    }
} catch (e) {
    console.warn("Firebase initialization notice:", e);
    try {
        const app = initializeApp(firebaseConfig);
        db = getFirestore(app);
        auth = getAuth(app);
    } catch (fallbackErr) {
        console.warn("Local fallback enabled:", fallbackErr);
    }
}

const DOC_ID = "main-schedule"; // Single document for settings/employees
const SCHEDULE_COLLECTION = "schedules"; // Collection for monthly schedule chunks
const HISTORY_COLLECTION = "history";

// --- AUTHENTICATION ---

export const login = async (email: string, pass: string) => {
    if (!auth) throw new Error("Firebase Auth not initialized");
    return await signInWithEmailAndPassword(auth, email, pass);
};

export const logout = async () => {
    if (!auth) return;
    return await signOut(auth);
};

export const subscribeToAuth = (callback: (user: User | null) => void) => {
    if (!auth) {
        callback(null);
        return () => {};
    }
    return onAuthStateChanged(auth, callback);
};

// --- FIRESTORE ---

export const loadDataFromCloud = async (): Promise<{ employees: Employee[] | null, schedule: ScheduleState | null, shifts: ShiftType[] | null }> => {
    if (!db) return { employees: null, schedule: null, shifts: null };

    // Timeout helper to avoid hanging on slow/offline connections
    const withTimeout = <T>(promise: Promise<T>, ms = 6000): Promise<T> => {
        return new Promise<T>((resolve, reject) => {
            const timer = setTimeout(() => reject(new Error("Timeout ao contactar servidor da nuvem")), ms);
            promise
                .then(res => { clearTimeout(timer); resolve(res); })
                .catch(err => { clearTimeout(timer); reject(err); });
        });
    };

    try {
        // 1. Load Main Settings (Employees, Shifts, Metadata)
        const docRef = doc(db, "company_data", DOC_ID);
        let docSnap: any = null;

        try {
            docSnap = await withTimeout(getDoc(docRef));
        } catch (networkErr) {
            // Attempt to retrieve from Firestore cache if offline
            try {
                docSnap = await getDocFromCache(docRef);
            } catch {
                throw networkErr;
            }
        }

        let employees: Employee[] | null = null;
        let shifts: ShiftType[] | null = null;
        let schedule: ScheduleState = {};
        let activeMonths: string[] | undefined;

        if (docSnap && docSnap.exists()) {
            const data = docSnap.data();
            employees = data.employees as Employee[];
            shifts = data.shifts as ShiftType[];
            activeMonths = data.activeMonths as string[] | undefined;
            
            // Legacy check: If schedule exists in main doc, load it (migration path)
            if (data.schedule && Object.keys(data.schedule).length > 0) {
                schedule = data.schedule as ScheduleState;
            }
        }

        // 2. Load Schedule Chunks from Sub-collection
        const scheduleQuery = query(collection(db, "company_data", DOC_ID, SCHEDULE_COLLECTION));
        let scheduleSnaps: any = null;

        try {
            scheduleSnaps = await withTimeout(getDocs(scheduleQuery));
        } catch {
            try {
                scheduleSnaps = await getDocsFromCache(scheduleQuery);
            } catch {
                scheduleSnaps = null;
            }
        }
        
        if (scheduleSnaps && !scheduleSnaps.empty) {
            scheduleSnaps.forEach((chunkDoc: any) => {
                const entries = chunkDoc.data().entries as ScheduleEntry[];
                if (entries) {
                    entries.forEach(entry => {
                        const key = `${entry.dateStr}_${entry.employeeId}`;
                        if (!schedule[key]) schedule[key] = [];
                        schedule[key].push(entry);
                    });
                }
            });
        }

        return {
            employees,
            schedule: Object.keys(schedule).length > 0 ? schedule : null,
            shifts
        };

    } catch (error) {
        console.warn("Servidor da nuvem indisponível ou offline:", error);
        throw error;
    }
};

export const saveDataToCloud = async (
    employees: Employee[], 
    schedule: ScheduleState, 
    shifts: ShiftType[],
    changedMonths?: Set<string> | null
) => {
    if (!db) return;

    try {
        const batch = writeBatch(db);
        const mainRef = doc(db, "company_data", DOC_ID);

        // 1. Prepare Data Groups
        const groups: Record<string, ScheduleEntry[]> = {};
        Object.values(schedule).flat().forEach(entry => {
            const monthKey = entry.dateStr.substring(0, 7); // YYYY-MM
            if (!groups[monthKey]) groups[monthKey] = [];
            groups[monthKey].push(entry);
        });

        const activeMonths = Object.keys(groups);

        // Update Main Doc (Always update metadata)
        batch.set(mainRef, {
            employees,
            shifts,
            activeMonths, // Track which months have data
            lastUpdated: new Date().toISOString(),
            schedule: {} // Keep main doc light
        }, { merge: true });

        // 2. Write Schedule Chunks
        // If changedMonths is provided, only write those. Otherwise write all (e.g. initial save or recovery).
        const monthsToWrite = changedMonths ? Array.from(changedMonths) : activeMonths;

        monthsToWrite.forEach(month => {
            // Only write if we have data for this month, OR if it's in changedMonths (it might have been cleared)
            // If it was cleared, groups[month] will be undefined. We should write an empty entry list or delete?
            // For now, let's write empty list if undefined, to effectively "clear" it in the chunk.
            const entries = groups[month] || [];
            const chunkRef = doc(db, "company_data", DOC_ID, SCHEDULE_COLLECTION, month);
            batch.set(chunkRef, { entries });
        });

        await batch.commit();
        console.log(`Data saved to cloud. Chunks written: ${monthsToWrite.length}`);

    } catch (error) {
        console.error("Error writing document: ", error);
        throw error;
    }
};

// --- HISTORY ---

export const addHistoryLog = async (action: HistoryLog['action'], details: string, userEmail: string) => {
    if (!db) return;
    try {
        const log: HistoryLog = {
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            userEmail,
            action,
            details
        };
        // Add to subcollection
        await setDoc(doc(db, "company_data", DOC_ID, HISTORY_COLLECTION, log.id), log);
    } catch (e) {
        console.error("Error adding history log:", e);
    }
};

export const getHistoryLogs = async (limitCount = 50): Promise<HistoryLog[]> => {
    if (!db) return [];
    try {
        const q = query(
            collection(db, "company_data", DOC_ID, HISTORY_COLLECTION),
        );
        const snapshot = await getDocs(q);
        const logs: HistoryLog[] = [];
        snapshot.forEach(doc => logs.push(doc.data() as HistoryLog));
        
        // Sort in memory
        return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, limitCount);
    } catch (e) {
        console.error("Error fetching history logs:", e);
        return [];
    }
};

export const isCloudConfigured = () => {
    return db !== null;
};