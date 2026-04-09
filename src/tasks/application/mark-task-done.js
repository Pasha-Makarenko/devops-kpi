import { NotFoundException } from "../../shared/domain/errors.js"

export class MarkTaskDoneCommand {
	#taskRepository
	#transactionManager
	#logger

	constructor(taskRepository, transactionManager, logger) {
		this.#taskRepository = taskRepository
		this.#transactionManager = transactionManager
		this.#logger = logger
	}

	async execute({ taskId }) {
		return await this.#transactionManager.transaction(async () => {
			const task = await this.#taskRepository.findById(taskId)

			if (!task) {
				throw new NotFoundException("Task not found")
			}

			task.done()

			await this.#taskRepository.update(task)

			this.#logger.info("Task marked as done", { id: task.id })

			return task.id
		})
	}
}
