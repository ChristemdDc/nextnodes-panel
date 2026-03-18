// src/config/database.js - Conexión a SQLite
import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ruta a la base de datos (un archivo local)
const dbPath = path.resolve(__dirname, '../../auth.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error abriendo la base de datos SQLite:', err.message);
    process.exit(1);
  }
  console.log('✅ Conexión a SQLite exitosa (auth.db)');
});

// Promisify para usar async/await
db.run = promisify(db.run);
db.get = promisify(db.get);
db.all = promisify(db.all);
db.exec = promisify(db.exec);

/**
 * EJECUTAR UNA QUERY
 */
export async function query(sql, values = []) {
  try {
    // Para queries que devuelven filas (SELECT)
    const normalizedSql = sql.trim().toUpperCase();
    if (normalizedSql.startsWith('SELECT') || normalizedSql.startsWith('PRAGMA') || normalizedSql.startsWith('SHOW')) {
      return await db.all(sql, values);
    }
    
    // Para queries de modificación (INSERT, UPDATE, DELETE)
    // El motor de sqlite3 devuelve metadatos en 'this' si no es promisified, 
    // pero aquí usamos una versión simplificada.
    const result = await db.run(sql, values);
    return result;
  } catch (error) {
    console.error('❌ Query error:', sql, error.message);
    throw error;
  }
}

/**
 * EJECUTAR TRANSACCIÓN
 * En SQLite las transacciones son más simples
 */
export async function transaction(callback) {
  try {
    await db.run('BEGIN TRANSACTION');
    const result = await callback(db);
    await db.run('COMMIT');
    return result;
  } catch (error) {
    await db.run('ROLLBACK');
    throw error;
  }
}

export default db;
