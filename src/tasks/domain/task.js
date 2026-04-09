import { ConflictException } from "../../shared/domain/errors.js"

export const TaskStatus = {
	PENDING: "pending",
	DONE: "done"
}

export class Task {
	#id
	#title
	#status
	#createdAt

	constructor(id, title, status, createdAt) {
		this.#id = id
		this.#title = title
		this.#status = status
		this.#createdAt = createdAt
	}

	static create(id, title) {
		return new Task(id, title, TaskStatus.PENDING, new Date())
	}

	get id() {
		return this.#id
	}

	get title() {
		return this.#title
	}

	get status() {
		return this.#status
	}

	get createdAt() {
		return this.#createdAt
	}

	done() {
		if (this.#status === TaskStatus.DONE) {
			throw new ConflictException("Task already done", {
				taskId: this.#id
			})
		}

		this.#status = TaskStatus.DONE
	}
}
