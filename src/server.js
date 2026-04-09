import http from "node:http"

export const createServer = ({ router, logger, staticHandler }) => {
	const server = http.createServer((req, res) => {
		;(async () => {
			const fullUrl = new URL(req.url ?? "/", `http://${req.headers.host}`)
			const urlPath = fullUrl.pathname

			if (staticHandler && req.method === "GET") {
				const handled = await staticHandler(req, res, urlPath)
				if (handled) return
			}

			const route = router.find(req.method, urlPath)
			if (!route) {
				res.statusCode = 404
				res.setHeader("Content-Type", "application/json")
				res.end(JSON.stringify({ error: "Not found" }))
				return
			}

			route.handler(
				req,
				res,
				route.params,
				Object.fromEntries(fullUrl.searchParams)
			)
		})().catch((error) => {
			logger.error("Unhandled request error", { error })
			if (!res.headersSent) {
				res.statusCode = 500
				res.setHeader("Content-Type", "application/json")
				res.end(JSON.stringify({ error: "Internal Server Error" }))
			}
		})
	})

	return {
		start(portOrFd) {
			const onListen = () => logger.info("Server is running")
			if (
				typeof portOrFd === "object" &&
				portOrFd !== null &&
				"fd" in portOrFd
			) {
				server.listen({ fd: portOrFd.fd }, onListen)
			} else {
				server.listen(portOrFd, onListen)
			}
		},
		stop() {
			return new Promise((resolve, reject) => {
				server.close((error) => {
					if (error) return reject(error)
					logger.info("Server stopped")
					resolve()
				})
			})
		}
	}
}
