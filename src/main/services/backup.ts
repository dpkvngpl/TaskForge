import fs from 'fs';
import path from 'path';

export class BackupService {
  private dataPath: string;

  constructor(dataPath: string) {
    this.dataPath = dataPath;
  }

  runBackup(): void {
    const dbPath = path.join(this.dataPath, 'taskforge.db');
    const backupPath = path.join(this.dataPath, 'taskforge.db.bak');

    if (fs.existsSync(dbPath)) {
      try {
        fs.copyFileSync(dbPath, backupPath);
        console.log('Database backup created:', backupPath);
      } catch (err) {
        console.error('Backup failed:', err);
      }
    }
  }
}
