// Inventory only: do not print personal records, password hashes, or tokens.
import { DatabaseSync } from 'node:sqlite';
import { existsSync } from 'node:fs';
for (const file of ['pb_data/data.db', 'pb_data/auxiliary.db']) {
  if (!existsSync(file)) continue;
  const db = new DatabaseSync(file, { readOnly: true });
  for (const { name } of db.prepare("select name from sqlite_master where type='table' and name not like 'sqlite_%'").all()) {
    const quoted = '"' + String(name).replaceAll('"', '""') + '"';
    const { count } = db.prepare(`select count(*) as count from ${quoted}`).get();
    console.log(JSON.stringify({ file, table: name, rows: count }));
  }
  db.close();
}
