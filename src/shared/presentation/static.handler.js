import fs from "node:fs"
import path from "node:path"

const MIME = {
	".ico": "image/x-icon",
	".css": "text/css",
	".js": "application/javascript",
	".json": "application/json",
	".png": "image/png",
	".jpg": "image/jpeg",
	".jpeg": "image/jpeg",
	".gif": "image/gif",
	".svg": "image/svg+xml",
	".webp": "image/webp",
	".woff": "font/woff",
	".woff2": "font/woff2"
}

export function createStaticHandler(publicDir, urlPrefix = "/static") {
	const baseDir = path.isAbsolute(publicDir)
		? publicDir
		: path.resolve(process.cwd(), publicDir)

	return async (_req, res, pathname) => {
		if (!pathname.startsWith(urlPrefix)) return false

		const subPath = pathname.slice(urlPrefix.length) || "/"
		const decoded = decodeURIComponent(subPath)
		const filePath = path.join(baseDir, decoded)

		if (path.relative(baseDir, filePath).startsWith("..")) {
			res.statusCode = 403
			res.setHeader("Content-Type", "text/plain")
			res.end("Forbidden")
			return true
		}

		try {
			const stat = await fs.promises.stat(filePath)
			if (!stat.isFile()) return false

			const ext = path.extname(filePath)
			const contentType = MIME[ext] ?? "application/octet-stream"
			res.setHeader("Content-Type", contentType)
			const stream = fs.createReadStream(filePath)
			stream.pipe(res)
			return true
		} catch (err) {
			if (err.code === "ENOENT") return false
			res.statusCode = 500
			res.setHeader("Content-Type", "text/plain")
			res.end("Internal server error")
			return true
		}
	}
}
