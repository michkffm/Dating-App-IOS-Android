import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import pg from "pg";

const schema = await readFile(new URL("./schema.sql", import.meta.url), "utf8");
export function verifyProductionDbUrl(value){
  if(!value) throw new Error("DATABASE_URL required for production");
  const url=new URL(value);
  if(!["postgresql:","postgres:"].includes(url.protocol) || !url.hostname || !url.username || !url.password ||
     url.searchParams.getAll("sslmode").length!==1 || url.searchParams.get("sslmode")!=="verify-full" ||
     url.searchParams.has("uselibpqcompat") || url.searchParams.has("sslrootcert") ||
     url.searchParams.has("sslcert") || url.searchParams.has("sslkey")) throw new Error("Production database must use PostgreSQL with certificate and hostname verification");
  return value;
}

export async function openDb({ url, dir } = {}) {
  if (!url) {
    const db = new PGlite(dir);
    await db.exec(schema);
    return db;
  }
  const pool = new pg.Pool({ connectionString: url, max: 5, connectionTimeoutMillis: 5000, statement_timeout: 5000, idleTimeoutMillis: 15000 });
  pool.on("error", () => console.error("Database connection unavailable"));
  await pool.query(schema);
  return {
    query: pool.query.bind(pool),
    close: pool.end.bind(pool),
    async transaction(callback) {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        const value = await callback(client);
        await client.query("COMMIT");
        return value;
      } catch (error) {
        await client.query("ROLLBACK").catch(() => {});
        throw error;
      } finally { client.release(); }
    }
  };
}
