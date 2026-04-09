import {
	executor,
	idGenerator,
	logger,
	transactionManager
} from "../shared/shared.module.js"
import { CreateTaskCommand } from "./application/create-task.command.js"
import { MarkTaskDoneCommand } from "./application/mark-task-done.js"
import { TaskRepository } from "./infrastructure/task.repository.js"

export const taskRepository = new TaskRepository(executor)
export const createTaskCommand = new CreateTaskCommand(
	taskRepository,
	idGenerator,
	transactionManager,
	logger.child("CreateTaskCommand")
)
export const markTaskDoneCommand = new MarkTaskDoneCommand(
	taskRepository,
	transactionManager,
	logger.child("MarkTaskDoneCommand")
)
