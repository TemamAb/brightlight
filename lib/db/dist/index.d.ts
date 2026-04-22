import pg from "pg";
declare let pool: pg.Pool | null;
declare let db: any;
export { db, pool };
export default db;
export * from "./schema";
//# sourceMappingURL=index.d.ts.map