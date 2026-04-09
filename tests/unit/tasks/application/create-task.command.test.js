import assert from "node:assert/strict"
import { describe, it } from "node:test"
import {
	CONFLICT_EXCEPTION_CODE,
	ConflictException,
	INVALID_DATA_EXCEPTION_CODE,
	InvalidDataException
} from "../../../../src/shared/domain/errors.js"
import { CreateTaskCommand } from "../../../../src/tasks/application/create-task.command.js"
import { Task, TaskStatus } from "../../../../src/tasks/domain/task.js"
import { createIdGeneratorStub } from "../../../mocks/id-generator.stub.js"
import { createLoggerStub } from "../../../mocks/logger.stub.js"
import { createTaskRepositoryStub } from "../../../mocks/task-repository.stub.js"
import { createTransactionManagerStub } from "../../../mocks/transaction-manager.stub.js"

describe("CreateTaskCommand (application)", () => {
	function makeSut(overrides = {}) {
		const taskRepository =
			overrides.taskRepository ?? createTaskRepositoryStub()
		const idGenerator =
			overrides.idGenerator ?? createIdGeneratorStub(["gen-42"])
		const transactionManager =
			overrides.transactionManager ?? createTransactionManagerStub()
		const logger = overrides.logger ?? createLoggerStub()
		const command = new CreateTaskCommand(
			taskRepository,
			idGenerator,
			transactionManager,
			logger
		)
		return { command, taskRepository, idGenerator, transactionManager, logger }
	}

	it("throws InvalidDataException when title is missing", async () => {
		const { command } = makeSut()

		await assert.rejects(
			async () => command.execute({ title: "" }),
			(err) =>
				err instanceof InvalidDataException &&
				err.code === INVALID_DATA_EXCEPTION_CODE
		)
	})

	it("throws ConflictException when title already exists", async () => {
		const taskRepository = createTaskRepositoryStub()
		const existing = Task.create("existing-id", "Duplicate title")
		taskRepository.setFindByTitle(async (title) =>
			title === "Duplicate title" ? existing : null
		)

		const { command } = makeSut({ taskRepository })

		await assert.rejects(
			async () => command.execute({ title: "Duplicate title" }),
			(err) =>
				err instanceof ConflictException && err.code === CONFLICT_EXCEPTION_CODE
		)
		assert.equal(taskRepository.created.length, 0)
	})

	it("creates task inside transaction and returns new id", async () => {
		const { command, taskRepository, transactionManager, logger, idGenerator } =
			makeSut()

		const id = await command.execute({ title: "New task" })

		assert.equal(id, "gen-42")
		assert.equal(transactionManager.calls, 1)
		assert.equal(idGenerator.callCount, 1)
		assert.equal(taskRepository.created.length, 1)
		const saved = taskRepository.created[0]
		assert.equal(saved.id, "gen-42")
		assert.equal(saved.title, "New task")
		assert.equal(saved.status, TaskStatus.PENDING)
		assert.ok(saved.createdAt instanceof Date)

		assert.equal(logger.infoCalls.length, 1)
		assert.equal(logger.infoCalls[0].msg, "Task created")
		assert.deepEqual(logger.infoCalls[0].meta, {
			id: "gen-42",
			title: "New task"
		})
	})
})
