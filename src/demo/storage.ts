type TableName = "moc" | "ptw" | "activity" | "notifications" | "userProfile";

type DemoDB = Record<string, any[]>;

const DB_KEY = "UNI_DEMO_DB_V1";

function isBrowser() {
  return typeof window !== "undefined";
}

function readDB(): DemoDB {
  if (!isBrowser()) return {};
  try {
    return JSON.parse(sessionStorage.getItem(DB_KEY) || "{}");
  } catch {
    return {};
  }
}

function writeDB(db: DemoDB) {
  if (!isBrowser()) return;
  sessionStorage.setItem(DB_KEY, JSON.stringify(db));
}

// Export aliases for seed.ts compatibility
export function loadDb(): DemoDB {
  return readDB();
}

export function saveDb(db: DemoDB) {
  writeDB(db);
}

function ensureTable(db: DemoDB, table: TableName) {
  if (!db[table]) db[table] = [];
}

export function listRecords<T = any>(table: TableName): T[] {
  const db = readDB();
  ensureTable(db, table);
  return db[table] as T[];
}

export function getRecord<T = any>(table: TableName, id: string): T | null {
  const rows = listRecords<T>(table);
  return (rows as any[]).find((r) => r?.id === id) ?? null;
}

export function upsertRecord(table: TableName, record: any) {
  const db = readDB();
  ensureTable(db, table);

  const rows = db[table];
  const idx = rows.findIndex((r) => r?.id === record?.id);

  if (idx >= 0) rows[idx] = { ...rows[idx], ...record };
  else rows.unshift(record);

  writeDB(db);
}

export function createRecord(table: TableName, record: any) {
  const db = readDB();
  ensureTable(db, table);
  
  const rows = db[table];
  rows.unshift(record);
  
  writeDB(db);
  return record;
}

export function updateRecord(table: TableName, id: string, patch: any) {
  const existing = getRecord<any>(table, id);
  if (!existing) return;
  upsertRecord(table, { ...existing, ...patch });
}

export function pushActivity(item: any) {
  // store activity as table "activity" with generated id if missing
  const id = item?.id ?? `ACT-${Math.random().toString(16).slice(2)}`;
  upsertRecord("activity", { id, ...item });
}

export function notify(item: any) {
  const id = item?.id ?? `NTF-${Math.random().toString(16).slice(2)}`;
  upsertRecord("notifications", { id, ...item });
}

// Export entire database as JSON string
export function exportDb(): string {
  const db = readDB();
  return JSON.stringify(db, null, 2);
}

// Import database from JSON string with validation
export function importDb(json: string): void {
  if (!isBrowser()) return;
  
  try {
    const parsed = JSON.parse(json);
    
    // Minimal schema validation - ensure it's an object
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      throw new Error('Invalid database format: must be an object');
    }
    
    // Validate that values are arrays (tables should contain arrays of records)
    for (const key in parsed) {
      if (!Array.isArray(parsed[key])) {
        throw new Error(`Invalid table format: "${key}" must be an array`);
      }
    }
    
    // If validation passes, write to storage
    writeDB(parsed);
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error('Invalid JSON format');
    }
    throw error;
  }
}
