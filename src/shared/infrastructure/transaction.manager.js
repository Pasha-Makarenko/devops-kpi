export class TransactionManager {
	#pool
	#als
	#logger

	constructor(pool, als, logger) {
		this.#pool = pool
		this.#als = als
		this.#logger = logger
	}

	async transaction(callback) {
		let conn
		try {
			conn = await this.#pool.getConnection()
			await conn.beginTransaction()

			const result = await this.#als.run(conn, async () => await callback(conn))
			await conn.commit()
			return result
		} catch (err) {
			// await conn.rollback()
			if (conn) {
				try {
					await conn.rollback()
				} catch (error) {
					this.#logger.error("Failed to rollback transaction", { error })
				}
			}
			throw err
		} finally {
			if (conn) conn.release()
		}
	}
}
