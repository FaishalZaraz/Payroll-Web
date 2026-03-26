import 'dotenv/config';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema.js';

// process.env.DATABASE_URL format: "file:./sqlite.db"
const dbPath = process.env.DATABASE_URL!.replace('file:', '');
const sqlite = new Database(dbPath);
sqlite.pragma('foreign_keys = ON');

export const db = drizzle(sqlite, { schema });
export const queryClient: import('better-sqlite3').Database = sqlite;
