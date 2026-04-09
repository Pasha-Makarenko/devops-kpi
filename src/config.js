import { parseArgs } from "node:util"
import { buildAppConfig } from "./config.build.js"

export { buildAppConfig }

const options = {
	nodeEnv: { type: "string" },
	port: { type: "string" },
	dbHost: { type: "string" },
	dbPort: { type: "string" },
	dbUser: { type: "string" },
	dbPassword: { type: "string" },
	dbName: { type: "string" }
}

const { values } = parseArgs({ options, strict: false })

export default buildAppConfig(values)
