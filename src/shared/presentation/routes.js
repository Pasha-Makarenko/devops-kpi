import { renderTemplate } from "./template.js"

function createRootHandler({
	businessEndpoints,
	rootTemplatePath = "public/index.html",
	rootTemplateParams = {}
}) {
	const defaultParams = {
		STATIC_PREFIX: "/static",
		ENDPOINTS_LIST: ""
	}

	return async ({ req }) => {
		if (!req.headers.accept?.includes("text/html")) {
			return { contentType: "text/plain", body: "Expect text/html" }
		}
		const endpointsList = businessEndpoints.map((e) => `<li>${e}</li>`).join("")
		const params = {
			...defaultParams,
			...rootTemplateParams,
			ENDPOINTS_LIST: endpointsList
		}
		try {
			const body = await renderTemplate(rootTemplatePath, params)
			return { contentType: "text/html", body }
		} catch (err) {
			if (err.code !== "ENOENT") throw err
			const fallback = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Endpoints</title></head><body><h1>Endpoints</h1><ul>${params.ENDPOINTS_LIST}</ul></body></html>`
			return { contentType: "text/html", body: fallback }
		}
	}
}

export const getSharedRoutes = ({
	pool,
	logger,
	businessEndpoints = [],
	rootTemplatePath,
	rootTemplateParams
}) => [
	{
		pattern: "GET /",
		handler: createRootHandler({
			businessEndpoints,
			rootTemplatePath,
			rootTemplateParams
		})
	},
	{
		pattern: "GET /health/alive",
		handler: () => ({
			contentType: "text/plain",
			body: "OK"
		})
	},
	{
		pattern: "GET /health/ready",
		handler: async ({ res }) => {
			try {
				const conn = await pool.getConnection()
				await conn.ping()
				conn.release()
				logger.info("Health ready: DB OK")
				return { contentType: "text/plain", body: "OK" }
			} catch (error) {
				logger.error("Health ready: DB unavailable", error)
				res.statusCode = 500
				return { contentType: "text/plain", body: "Database unavailable" }
			}
		}
	}
]
