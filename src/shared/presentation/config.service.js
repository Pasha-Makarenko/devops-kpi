export class ConfigService {
	#config

	constructor(config) {
		this.#config = Object.freeze(config)
	}

	get values() {
		return this.#config
	}

	get nodeEnv() {
		return this.#config.nodeEnv
	}

	get port() {
		return this.#config.port
	}

	get dbHost() {
		return this.#config.dbHost
	}

	get dbPort() {
		return this.#config.dbPort
	}

	get dbUser() {
		return this.#config.dbUser
	}

	get dbPassword() {
		return this.#config.dbPassword
	}

	get dbName() {
		return this.#config.dbName
	}

	get isDevelopment() {
		return this.#normalizedEnv === "development"
	}

	get isProduction() {
		return this.#normalizedEnv === "production"
	}

	get isTest() {
		return this.#normalizedEnv === "test"
	}

	get #normalizedEnv() {
		return String(this.#config.nodeEnv ?? "").toLowerCase()
	}
}
