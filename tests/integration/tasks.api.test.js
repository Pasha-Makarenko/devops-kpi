import assert from "node:assert/strict"
import { before, beforeEach, describe, test } from "node:test"
import { getGlobalTestContext } from "./helpers/setup.js"

describe("Tasks API (integration)", () => {
	let ctx

	before(async () => {
		ctx = await getGlobalTestContext()
	})

	beforeEach(async () => {
		await ctx.clearDatabase()
	})

	test("GET /tasks returns empty list", async () => {
		const res = await fetch(`${ctx.baseUrl}/tasks`)
		assert.equal(res.status, 200)
		const body = await res.json()
		assert.ok(Array.isArray(body))
		assert.equal(body.length, 0)
	})

	test("POST /tasks creates task and GET lists it", async () => {
		const title = `Task ${Date.now()}`

		const create = await fetch(`${ctx.baseUrl}/tasks`, {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ title })
		})
		assert.equal(create.status, 200)
		const created = await create.json()
		assert.ok(created.id)
		assert.equal(typeof created.id, "string")

		const list = await fetch(`${ctx.baseUrl}/tasks`)
		assert.equal(list.status, 200)
		const tasks = await list.json()
		assert.equal(tasks.length, 1)
		assert.equal(tasks[0].title, title)
		assert.equal(tasks[0].id, created.id)
	})

	test("POST /tasks with duplicate title returns 409", async () => {
		const title = `Dup ${Date.now()}`

		const first = await fetch(`${ctx.baseUrl}/tasks`, {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ title })
		})
		assert.equal(first.status, 200)

		const second = await fetch(`${ctx.baseUrl}/tasks`, {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ title })
		})
		assert.equal(second.status, 409)
		const err = await second.json()
		assert.ok(err.error)
	})

	test("POST /tasks without title returns 400", async () => {
		const res = await fetch(`${ctx.baseUrl}/tasks`, {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({})
		})
		assert.equal(res.status, 400)
	})

	test("POST /tasks/{id}/done marks task done", async () => {
		const title = `Done ${Date.now()}`

		const create = await fetch(`${ctx.baseUrl}/tasks`, {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ title })
		})
		const { id } = await create.json()

		const done = await fetch(`${ctx.baseUrl}/tasks/${id}/done`, {
			method: "POST"
		})
		assert.equal(done.status, 200)
		const body = await done.json()
		assert.equal(body.id, id)

		const list = await fetch(`${ctx.baseUrl}/tasks`)
		const tasks = await list.json()
		assert.equal(tasks[0].status, "done")
	})

	test("POST /tasks/{id}/done for missing id returns 404", async () => {
		const res = await fetch(
			`${ctx.baseUrl}/tasks/00000000-0000-4000-8000-000000000000/done`,
			{ method: "POST" }
		)
		assert.equal(res.status, 404)
	})

	test("POST /tasks/{id}/done twice returns 409", async () => {
		const title = `Twice ${Date.now()}`

		const create = await fetch(`${ctx.baseUrl}/tasks`, {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ title })
		})
		const { id } = await create.json()

		const first = await fetch(`${ctx.baseUrl}/tasks/${id}/done`, {
			method: "POST"
		})
		assert.equal(first.status, 200)

		const second = await fetch(`${ctx.baseUrl}/tasks/${id}/done`, {
			method: "POST"
		})
		assert.equal(second.status, 409)
	})
})
