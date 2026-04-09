import { createPool } from "mariadb"

export const getPool = (configService) =>
	createPool({
		host: configService.dbHost,
		port: configService.dbPort,
		user: configService.dbUser,
		password: configService.dbPassword,
		database: configService.dbName,
		namedPlaceholders: true
	})

export const createExecutor = (pool, als) => async (sql, params) => {
	const target = als.getStore() ?? pool
	return target.query(sql, params)
}
