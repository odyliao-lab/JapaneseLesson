import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

const [dataPath, backupPath] = process.argv.slice(2);
if (!dataPath || !backupPath) throw new Error("Usage: node backup-local-db.mjs DATA_PATH BACKUP_PATH");

fs.mkdirSync(backupPath, { recursive: true });
const candidates = fs.readdirSync(dataPath, { recursive: true, withFileTypes: true })
  .filter((entry) => entry.isFile() && entry.name.endsWith(".sqlite") && entry.name !== "metadata.sqlite")
  .map((entry) => path.join(entry.parentPath, entry.name));
if (candidates.length !== 1) throw new Error(`Expected one D1 SQLite database, found ${candidates.length}.`);

const stamp = new Date().toISOString().replaceAll(":", "").replaceAll("-", "").replace("T", "-").slice(0, 15);
const output = path.join(backupPath, `japanese-lesson-${stamp}.sqlite`);
const db = new DatabaseSync(candidates[0]);
try {
  db.exec(`VACUUM INTO '${output.replaceAll("'", "''")}'`);
} finally {
  db.close();
}

const backups = fs.readdirSync(backupPath)
  .filter((name) => /^japanese-lesson-.*\.sqlite$/.test(name))
  .map((name) => ({ name, time: fs.statSync(path.join(backupPath, name)).mtimeMs }))
  .sort((a, b) => b.time - a.time);
for (const stale of backups.slice(30)) fs.rmSync(path.join(backupPath, stale.name));
process.stdout.write(output);
