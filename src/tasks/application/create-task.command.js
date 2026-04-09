import {
	ConflictException,
	InvalidDataException
} from "../../shared/domain/errors.js"
import { Task } from "../domain/task.js"

export class CreateTaskCommand {
	#taskRepository
	#idGenerator
	#transactionManager
	#logger

	constructor(taskRepository, idGenerator, transactionManager, logger) {
		this.#taskRepository = taskRepository
		this.#idGenerator = idGenerator
		this.#transactionManager = transactionManager
		this.#logger = logger
	}

	async execute({ title }) {
		if (!title) {
			throw new InvalidDataException("Title is required")
		}

		return await this.#transactionManager.transaction(async () => {
			const id = this.#idGenerator.generate()

			const existing = await this.#taskRepository.findByTitle(title)
			if (existing) {
				throw new ConflictException("Task with this title already exists")
			}

			const task = Task.create(id, title)
			await this.#taskRepository.create(task)

			this.#logger.info("Task created", { id, title })

			return task.id
		})
	}
}
