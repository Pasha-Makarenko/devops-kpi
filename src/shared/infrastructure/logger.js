export class Logger {
	#als
	#context

	constructor(als, context = "System") {
		this.#als = als
		this.#context = context
	}

	child(context) {
		return new Logger(this.#als, context)
	}

	info(message, meta = {}) {
		this.#log("INFO", message, meta, console.log)
	}

	error(message, meta = {}) {
		this.#log("ERROR", message, meta, console.error)
	}

	#log(level, message, meta, executor) {
		const requestId = this.#als.getStore()?.requestId

		const logEntry = {
			timestamp: new Date().toISOString(),
			level,
			context: this.#context,
			...(requestId && { requestId }),
			message,
			...meta
		}

		executor(JSON.stringify(logEntry))
	}
}
