import { InvalidDataException } from "./shared/domain/errors.js"

export function buildAppConfig(values) {
	if (!values.dbHost) {
		throw new InvalidDataException("DB host is required")
	}

	if (!values.dbPort) {
		throw new InvalidDataException("DB port is required")
	}

	if (!values.dbUser) {
		throw new InvalidDataException("DB user is required")
	}

	if (!values.dbPassword) {
		throw new InvalidDataException("DB password is required")
	}

	if (!values.dbName) {
		throw new InvalidDataException("DB name is required")
	}

	return {
		nodeEnv: values.nodeEnv ?? process.env.NODE_ENV ?? "development",
		port: Number(values.port ?? 5200),
		dbHost: values.dbHost,
		dbPort: Number(values.dbPort),
		dbUser: values.dbUser,
		dbPassword: values.dbPassword,
		dbName: values.dbName
	}
}
