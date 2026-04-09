#!/usr/bin/env node

import { AsyncLocalStorage } from "node:async_hooks"
import fs from "node:fs/promises"
import path from "node:path"
import { pathToFileURL } from "node:url"
import { parseArgs } from "node:util"
import { buildAppConfig } from "./config.build.js"
import { getPool } from "./shared/infrastructure/db.js"
import { Logger } from "./shared/infrastructure/logger.js"
import { ConfigService } from "./shared/presentation/config.service.js"

const migrateLogger = new Logger(new AsyncLocalStorage(), "Migrate")

const argv = process.argv.slice(2)
const argsForParse = argv[0] === "--" ? argv.slice(1) : argv

const { values } = parseArgs({
	args: argsForParse,
	options: {
		dbHost: { type: "string" },
		dbPort: { type: "string" },
		dbUser: { type: "string" },
		dbPassword: { type: "string" },
		dbName: { type: "string" }
	},
	strict: false
})

let pool
try {
	const configService = new ConfigService(buildAppConfig(values))
	pool = getPool(configService)
} catch (err) {
	migrateLogger.error(err.message ?? "Invalid configuration")
	process.exit(1)
}

const MIGRATIONS_TABLE = `
CREATE TABLE IF NOT EXISTS migrations (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
`.trim()

async function ensureMigrationsTable(conn) {
	await conn.query(MIGRATIONS_TABLE)
	migrateLogger.info("Migrations table ready")
}

async function getAppliedNames(conn) {
	const rows = await conn.query("SELECT name FROM migrations ORDER BY id")
	return new Set(rows.map((r) => r.name))
}

async function runMigration(conn, name, migrationsDir) {
	const fullPath = path.join(migrationsDir, name)
	const url = pathToFileURL(fullPath).href
	const mod = await import(url)
	if (typeof mod.up !== "function") {
		throw new Error(`Migration ${name}: missing up(pool)`)
	}
	await mod.up(pool)
	await conn.query("INSERT INTO migrations (name) VALUES (?)", [name])
	migrateLogger.info("Ran migration", { name })
}

async function migrate() {
	const cwd = process.cwd()
	let migrationsDir = path.resolve(cwd, "migrations")
	try {
		await fs.stat(migrationsDir)
	} catch {
		migrationsDir = path.resolve(cwd, "src", "migrations")
	}
	let conn
	try {
		const stat = await fs.stat(migrationsDir)
		if (!stat.isDirectory()) {
			migrateLogger.error("migrations dir is not a directory", {
				path: migrationsDir
			})
			process.exit(1)
		}
	} catch (err) {
		if (err.code === "ENOENT") {
			migrateLogger.error("migrations directory not found", {
				path: migrationsDir
			})
			process.exit(1)
		}
		throw err
	}

	const files = (await fs.readdir(migrationsDir))
		.filter((f) => f.endsWith(".js"))
		.sort()

	if (files.length === 0) {
		migrateLogger.info("No migration files found")
		await pool.end()
		return
	}

	try {
		conn = await pool.getConnection()
		await ensureMigrationsTable(conn)
		const applied = await getAppliedNames(conn)
		for (const name of files) {
			if (applied.has(name)) {
				migrateLogger.info("Skip migration (already applied)", { name })
				continue
			}
			await runMigration(conn, name, migrationsDir)
		}
		migrateLogger.info("Migrations finished")
	} catch (err) {
		migrateLogger.error("Migration failed", { error: err.message })
		process.exit(1)
	} finally {
		if (conn) conn.release()
		await pool.end()
	}
}

migrate()
