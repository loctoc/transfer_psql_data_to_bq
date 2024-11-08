import pg from 'pg';
import Cursor from "pg-cursor";

const { Client } = pg;

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

await client.connect();

export async function runQueryWithCursor(query, cb) {
  const cursor = client.query(new Cursor(query));
  let rowCount = 0;
  while (true) {
    const rows = await cursor.read(10000);
    if (rows.length === 0) {
      break;
    }
    rowCount += rows.length;
    console.log(`Fetched ${rowCount} rows`);
    cb(rows);
  }
  await cursor.close();
  return rowCount;
}

