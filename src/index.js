import { createResponseHandler, Router } from "@devops-kpi/router"
import { createServer } from "./server.js"
import { errorHandler } from "./shared/presentation/error.handler.js"
import { createRequestMiddleware } from "./shared/presentation/request.middleware.js"
import { getSharedRoutes } from "./shared/presentation/routes.js"
import { createStaticHandler } from "./shared/presentation/static.handler.js"
import {
	configService,
	executor,
	logger,
	pool,
	requestAls
} from "./shared/shared.module.js"
import { getTasksRoutes } from "./tasks/presentation/routes.js"
import { createTaskCommand, markTaskDoneCommand } from "./tasks/tasks.module.js"

const router = new Router(createResponseHandler(errorHandler))

const BUSINESS_ENDPOINTS = [
	"GET /tasks — list all tasks",
	"POST /tasks (body: { title }) — create task",
	"POST /tasks/:id/done — mark task as done"
]

const routes = [
	...getSharedRoutes({
		pool,
		logger,
		businessEndpoints: BUSINESS_ENDPOINTS,
		rootTemplatePath: "public/index.html",
		rootTemplateParams: { STATIC_PREFIX: "/static" }
	}),
	...getTasksRoutes({
		executor,
		logger,
		createTaskCommand,
		markTaskDoneCommand
	})
]

const requestMiddleware = createRequestMiddleware(requestAls)
for (const route of routes) {
	router.handle(route.pattern, requestMiddleware(route.handler))
}

const staticHandler = createStaticHandler("public", "/static")

const server = createServer({ router, logger, staticHandler })
const listenFds = Number(process.env.LISTEN_FDS ?? 0)
if (listenFds >= 1) {
	server.start({ fd: 3 })
} else {
	server.start(configService.port)
}

async function shutdown(signal) {
	try {
		logger.info(`Received ${signal}, shutting down gracefully`)
		await server.stop()
		await pool.end()
		logger.info("Pool closed")
		process.exit(0)
	} catch (err) {
		logger.error("Shutdown error", err)
		process.exit(1)
	}
}

process.on("SIGTERM", () => shutdown("SIGTERM"))
process.on("SIGINT", () => shutdown("SIGINT"))
