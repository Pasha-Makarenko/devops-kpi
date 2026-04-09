import { escapeHtml } from "../../shared/presentation/utils.js"

function renderTasksTable(tasks) {
	const rows = tasks
		.map(
			(task) => `<tr>
<td>${escapeHtml(task.id)}</td>
<td>${escapeHtml(task.title)}</td>
<td>${escapeHtml(task.status)}</td>
<td>${escapeHtml(task.created_at)}</td>
</tr>`
		)
		.join("")

	return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Tasks</title></head><body><h1>Tasks</h1><table border="1" cellpadding="6" cellspacing="0"><thead><tr><th>id</th><th>title</th><th>status</th><th>created_at</th></tr></thead><tbody>${rows}</tbody></table></body></html>`
}

export const getTasksRoutes = ({
	executor,
	logger,
	createTaskCommand,
	markTaskDoneCommand
}) => [
	{
		pattern: "GET /tasks",
		handler: async () => {
			const tasks = await executor("SELECT * FROM tasks")
			logger.info("Listed tasks", { count: tasks.length })
			return {
				representations: {
					"application/json": tasks,
					"text/html": renderTasksTable(tasks)
				}
			}
		}
	},
	{
		pattern: "POST /tasks",
		handler: async ({ body }) => {
			const id = await createTaskCommand.execute({ title: body.title })
			return {
				representations: {
					"application/json": { id },
					"text/html": `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Task created</title></head><body><h1>Task created</h1><p>id: ${escapeHtml(id)}</p></body></html>`
				}
			}
		}
	},
	{
		pattern: "POST /tasks/{id}/done",
		handler: async ({ params }) => {
			const id = await markTaskDoneCommand.execute({ taskId: params.id })
			return {
				representations: {
					"application/json": { id },
					"text/html": `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Task updated</title></head><body><h1>Task marked as done</h1><p>id: ${escapeHtml(id)}</p></body></html>`
				}
			}
		}
	}
]
