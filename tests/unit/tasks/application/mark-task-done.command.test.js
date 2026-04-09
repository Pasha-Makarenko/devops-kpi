import assert from "node:assert/strict"
import { describe, it } from "node:test"
import {
	CONFLICT_EXCEPTION_CODE,
	ConflictException,
	NOT_FOUND_EXCEPTION_CODE,
	NotFoundException
} from "../../../../src/shared/domain/errors.js"
import { MarkTaskDoneCommand } from "../../../../src/tasks/application/mark-task-done.js"
import { Task, TaskStatus } from "../../../../src/tasks/domain/task.js"
import { createLoggerStub } from "../../../mocks/logger.stub.js"
import { createTaskRepositoryStub } from "../../../mocks/task-repository.stub.js"
import { createTransactionManagerStub } from "../../../mocks/transaction-manager.stub.js"

describe("MarkTaskDoneCommand (application)", () => {
	function makeSut(overrides = {}) {
		const taskRepository =
			overrides.taskRepository ?? createTaskRepositoryStub()
		const transactionManager =
			overrides.transactionManager ?? createTransactionManagerStub()
		const logger = overrides.logger ?? createLoggerStub()
		const command = new MarkTaskDoneCommand(
			taskRepository,
			transactionManager,
			logger
		)
		return { command, taskRepository, transactionManager, logger }
	}

	it("throws NotFoundException when task is missing", async () => {
		const taskRepository = createTaskRepositoryStub()
		taskRepository.setFindById(async () => null)
		const { command } = makeSut({ taskRepository })

		await assert.rejects(
			async () => command.execute({ taskId: "missing" }),
			(err) =>
				err instanceof NotFoundException &&
				err.code === NOT_FOUND_EXCEPTION_CODE
		)
		assert.equal(taskRepository.updated.length, 0)
	})

	it("marks pending task as done and persists update", async () => {
		const pending = Task.create("t-1", "Implement API")
		const taskRepository = createTaskRepositoryStub()
		taskRepository.setFindById(async (id) => (id === "t-1" ? pending : null))

		const { command, transactionManager, logger } = makeSut({ taskRepository })

		const id = await command.execute({ taskId: "t-1" })

		assert.equal(id, "t-1")
		assert.equal(transactionManager.calls, 1)
		assert.equal(pending.status, TaskStatus.DONE)
		assert.equal(taskRepository.updated.length, 1)
		assert.strictEqual(taskRepository.updated[0], pending)

		assert.equal(logger.infoCalls.length, 1)
		assert.equal(logger.infoCalls[0].msg, "Task marked as done")
		assert.deepEqual(logger.infoCalls[0].meta, { id: "t-1" })
	})

	it("propagates ConflictException when task is already done", async () => {
		const doneTask = new Task(
			"t-2",
			"Old task",
			TaskStatus.DONE,
			new Date("2020-01-01")
		)
		const taskRepository = createTaskRepositoryStub()
		taskRepository.setFindById(async (id) => (id === "t-2" ? doneTask : null))

		const { command } = makeSut({ taskRepository })

		await assert.rejects(
			async () => command.execute({ taskId: "t-2" }),
			(err) =>
				err instanceof ConflictException && err.code === CONFLICT_EXCEPTION_CODE
		)
		assert.equal(taskRepository.updated.length, 0)
	})
})
