import { spawn, spawnSync } from "node:child_process"
import { setTimeout as delay } from "node:timers/promises"
import { createPool } from "mariadb"
import { GenericContainer, Wait } from "testcontainers"
import { getFreePort } from "./get-free-port.js"
import { repoRoot } from "./repo-root.js"

const MARIADB_IMAGE = "mariadb:10.6-jammy"

export class IntegrationContext {
	maria
	appProcess
	apiPort = 0
	baseUrl
	dbHost = ""
	dbPort = 0
	dbUser = "mywebapp"
	dbPassword = "testsecret"
	dbName = "mywebapp"

	async setup() {
		this.maria = await new GenericContainer(MARIADB_IMAGE)
			.withEnvironment({
				MARIADB_ROOT_PASSWORD: "root",
				MARIADB_DATABASE: this.dbName,
				MARIADB_USER: this.dbUser,
				MARIADB_PASSWORD: this.dbPassword
			})
			.withExposedPorts(3306)
			.withWaitStrategy(Wait.forLogMessage(/ready for connections/i))
			.start()

		this.dbHost = this.maria.getHost()
		this.dbPort = this.maria.getMappedPort(3306)
		this.apiPort = await getFreePort()

		const dbArgs = [
			"--dbHost",
			this.dbHost,
			"--dbPort",
			String(this.dbPort),
			"--dbUser",
			this.dbUser,
			"--dbPassword",
			this.dbPassword,
			"--dbName",
			this.dbName
		]

		const migrateResult = spawnSync(
			process.execPath,
			["src/migrate.js", "--", ...dbArgs],
			{
				cwd: repoRoot,
				encoding: "utf8",
				env: { ...process.env, NODE_ENV: "test" }
			}
		)

		if (migrateResult.status !== 0) {
			const err = migrateResult.stderr || migrateResult.stdout || ""
			await this.maria.stop().catch(() => {})
			throw new Error(`migrate failed (exit ${migrateResult.status}): ${err}`)
		}

		this.baseUrl = `http://127.0.0.1:${this.apiPort}`

		this.appProcess = spawn(
			process.execPath,
			[
				"src/index.js",
				"--port",
				String(this.apiPort),
				"--nodeEnv",
				"test",
				...dbArgs
			],
			{
				cwd: repoRoot,
				env: { ...process.env, NODE_ENV: "test" },
				stdio: ["ignore", "pipe", "pipe"]
			}
		)

		let stderrBuf = ""
		this.appProcess.stderr?.on("data", (chunk) => {
			stderrBuf += String(chunk)
			if (stderrBuf.length > 8000) {
				stderrBuf = stderrBuf.slice(-4000)
			}
		})

		this.appProcess.on("exit", (code) => {
			if (code !== 0 && code !== null) {
				console.error(`App exited with code ${code}\n${stderrBuf}`)
			}
		})

		await this.waitForReady()
	}

	async waitForReady() {
		const proc = this.appProcess
		if (!proc) throw new Error("App process not started")

		for (let i = 0; i < 120; i++) {
			if (proc.exitCode !== null && proc.exitCode !== undefined) {
				throw new Error(
					`Server exited with code ${proc.exitCode} before becoming ready`
				)
			}
			try {
				const res = await fetch(`${this.baseUrl}/health/ready`)
				if (res.ok) return
			} catch {
				// still starting
			}
			await delay(250)
		}
		throw new Error("Server startup timeout (health/ready)")
	}

	async clearDatabase() {
		const pool = createPool({
			host: this.dbHost,
			port: this.dbPort,
			user: this.dbUser,
			password: this.dbPassword,
			database: this.dbName
		})
		try {
			await pool.query("TRUNCATE TABLE tasks")
		} finally {
			await pool.end()
		}
	}

	async cleanup() {
		if (this.appProcess && !this.appProcess.killed) {
			this.appProcess.kill("SIGTERM")
			await delay(500).catch(() => {})
			if (this.appProcess.exitCode === null) {
				this.appProcess.kill("SIGKILL")
			}
		}
		if (this.maria) {
			await this.maria.stop()
		}
	}
}
