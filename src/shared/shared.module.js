import { AsyncLocalStorage } from "node:async_hooks"
import config from "../config.js"
import { createExecutor, getPool } from "./infrastructure/db.js"
import { IdGenerator } from "./infrastructure/id.generator.js"
import { Logger } from "./infrastructure/logger.js"
import { TransactionManager } from "./infrastructure/transaction.manager.js"
import { ConfigService } from "./presentation/config.service.js"

export const configService = new ConfigService(config)

export const connAls = new AsyncLocalStorage()
export const requestAls = new AsyncLocalStorage()

export const pool = getPool(configService)
export const executor = createExecutor(pool, connAls)

export const logger = new Logger(requestAls)
export const idGenerator = new IdGenerator()
export const transactionManager = new TransactionManager(pool, connAls, logger)
