import assert from "node:assert/strict"
import { describe, it } from "node:test"
import {
	CONFLICT_EXCEPTION_CODE,
	ConflictException
} from "../../../../src/shared/domain/errors.js"
import { Task, TaskStatus } from "../../../../src/tasks/domain/task.js"

describe("Task (domain)", () => {
	it("TaskStatus exposes expected values", () => {
		assert.equal(TaskStatus.PENDING, "pending")
		assert.equal(TaskStatus.DONE, "done")
	})

	it("Task.create sets pending status and preserves id and title", () => {
		const task = Task.create("id-1", "Write tests")

		assert.equal(task.id, "id-1")
		assert.equal(task.title, "Write tests")
		assert.equal(task.status, TaskStatus.PENDING)
		assert.ok(task.createdAt instanceof Date)
	})

	it("done() transitions pending task to done", () => {
		const task = Task.create("id-2", "Ship feature")

		task.done()

		assert.equal(task.status, TaskStatus.DONE)
	})

	it("done() throws ConflictException when already done", () => {
		const task = Task.create("id-3", "Close ticket")
		task.done()

		assert.throws(
			() => task.done(),
			(err) =>
				err instanceof ConflictException &&
				err.code === CONFLICT_EXCEPTION_CODE &&
				err.message === "Task already done" &&
				err.details?.taskId === "id-3"
		)
	})
})
