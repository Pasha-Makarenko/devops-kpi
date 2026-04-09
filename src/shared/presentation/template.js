import fs from "node:fs/promises"
import path from "node:path"

export async function renderTemplate(templatePath, params) {
	const absolute = path.isAbsolute(templatePath)
		? templatePath
		: path.resolve(process.cwd(), templatePath)
	let html = await fs.readFile(absolute, "utf-8")
	for (const [key, value] of Object.entries(params)) {
		html = html.replaceAll(`[[${key}]]`, value ?? "")
	}
	return html
}
