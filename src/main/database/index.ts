import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    throw new Error('Database not initialised. Call initDatabase() first.');
  }
  return db;
}

export function initDatabase(dataPath: string, migrationsPath: string): void {
  // Ensure data directory exists
  if (!fs.existsSync(dataPath)) {
    fs.mkdirSync(dataPath, { recursive: true });
  }

  const dbPath = path.join(dataPath, 'taskforge.db');
  db = new Database(dbPath);

  // Performance settings
  db.pragma('journal_mode = WAL');      // Write-Ahead Logging for better concurrency
  db.pragma('synchronous = NORMAL');     // Good balance of safety and speed
  db.pragma('foreign_keys = ON');        // Enforce foreign key constraints
  db.pragma('busy_timeout = 5000');      // Wait up to 5s if DB is locked

  // Run migrations
  runMigrations(migrationsPath);
}

function runMigrations(migrationsPath: string): void {
  if (!db) return;

  const currentVersion = db.pragma('user_version', { simple: true }) as number;

  // Read all migration files sorted by number
  const migrationFiles = fs.readdirSync(migrationsPath)
    .filter(f => f.endsWith('.sql'))
    .sort();

  for (const file of migrationFiles) {
    // Extract version number from filename: "001_initial.sql" → 1
    const match = file.match(/^(\d+)/);
    if (!match) continue;

    const version = parseInt(match[1], 10);
    if (version <= currentVersion) continue;

    const sql = fs.readFileSync(path.join(migrationsPath, file), 'utf8');

    db.transaction(() => {
      db!.exec(sql);
      db!.pragma(`user_version = ${version}`);
    })();

    console.log(`Migration applied: ${file}`);
  }
}

export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}
