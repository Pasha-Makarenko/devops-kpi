const MAX_BODY_SIZE = 1024 * 1024
const JSON_CONTENT_TYPE = "application/json"
const HTML_CONTENT_TYPE = "text/html"

const parseBody = async (req) => {
	const buffers = []
	let totalSize = 0

	for await (const chunk of req) {
		totalSize += chunk.length

		if (totalSize > MAX_BODY_SIZE) {
			throw new Error("Request body too large")
		}

		buffers.push(chunk)
	}

	const data = Buffer.concat(buffers).toString()
	try {
		return data ? JSON.parse(data) : {}
	} catch {
		return data
	}
}

export const createResponseHandler =
	(errorHandler) => (handler) => async (req, res, params, query) => {
		try {
			if (["POST", "PUT", "PATCH"].includes(req.method)) {
				req.body = await parseBody(req)
			}

			const result = await handler({
				req,
				res,
				params,
				query,
				body: req.body
			})

			if (result === undefined) return

			let contentType = JSON_CONTENT_TYPE
			let body
			if (
				result !== null &&
				typeof result === "object" &&
				"representations" in result
			) {
				const selected = selectRepresentation(
					result.representations,
					req.headers.accept
				)
				contentType = selected.contentType
				body = serializeBody(contentType, selected.body)
			} else if (
				result !== null &&
				typeof result === "object" &&
				"contentType" in result
			) {
				contentType = result.contentType
				const raw = "body" in result ? result.body : ""
				body = serializeBody(contentType, raw)
			} else {
				body = JSON.stringify(result)
			}

			if (!res.headersSent) {
				res.setHeader("Content-Type", contentType)
			}
			res.end(body)
		} catch (error) {
			const { code, message } = errorHandler(error)
			res.statusCode = code
			const accept = req.headers.accept ?? ""
			if (accept.includes(HTML_CONTENT_TYPE)) {
				if (!res.headersSent) {
					res.setHeader("Content-Type", HTML_CONTENT_TYPE)
				}
				res.end(
					`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Error</title></head><body><h1>Error ${code}</h1><p>${escapeHtml(message)}</p></body></html>`
				)
			} else {
				if (!res.headersSent) {
					res.setHeader("Content-Type", JSON_CONTENT_TYPE)
				}
				res.end(JSON.stringify({ error: message }))
			}
		}
	}

function selectRepresentation(representations, acceptHeader) {
	const accept = acceptHeader ?? ""
	const wantsHtml = accept.includes(HTML_CONTENT_TYPE)
	const wantsJson = accept.includes(JSON_CONTENT_TYPE) || accept.includes("*/*")

	if (wantsHtml && representations[HTML_CONTENT_TYPE] !== undefined) {
		return {
			contentType: HTML_CONTENT_TYPE,
			body: representations[HTML_CONTENT_TYPE]
		}
	}
	if (wantsJson && representations[JSON_CONTENT_TYPE] !== undefined) {
		return {
			contentType: JSON_CONTENT_TYPE,
			body: representations[JSON_CONTENT_TYPE]
		}
	}
	if (representations[JSON_CONTENT_TYPE] !== undefined) {
		return {
			contentType: JSON_CONTENT_TYPE,
			body: representations[JSON_CONTENT_TYPE]
		}
	}
	if (representations[HTML_CONTENT_TYPE] !== undefined) {
		return {
			contentType: HTML_CONTENT_TYPE,
			body: representations[HTML_CONTENT_TYPE]
		}
	}
	throw new Error("No supported representation configured")
}

function serializeBody(contentType, raw) {
	return contentType === JSON_CONTENT_TYPE && typeof raw !== "string"
		? JSON.stringify(raw)
		: raw
}

function escapeHtml(s) {
	return String(s)
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
}
