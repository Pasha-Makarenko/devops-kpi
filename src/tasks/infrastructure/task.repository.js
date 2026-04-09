import { Task } from "../domain/task.js"

export class TaskRepository {
	#executor

	constructor(executor) {
		this.#executor = executor
	}

	async findById(id) {
		const res = await this.#executor("SELECT * FROM tasks WHERE id = :id", {
			id
		})
		const row = Array.isArray(res) && res.length > 0 ? res[0] : null

		if (!row) {
			return null
		}

		return new Task(row.id, row.title, row.status, row.created_at)
	}

	async findByTitle(title) {
		const res = await this.#executor(
			"SELECT * FROM tasks WHERE title = :title",
			{
				title
			}
		)
		const row = Array.isArray(res) && res.length > 0 ? res[0] : null

		if (!row) {
			return null
		}

		return new Task(row.id, row.title, row.status, row.created_at)
	}

	async create(task) {
		await this.#executor("INSERT INTO tasks (id, title) VALUES (:id, :title)", {
			id: task.id,
			title: task.title
		})
	}

	async update(task) {
		await this.#executor(
			"UPDATE tasks SET title = :title, status = :status WHERE id = :id",
			{ id: task.id, title: task.title, status: task.status }
		)
	}
}
