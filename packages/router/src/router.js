export class Router {
	#routes = []
	#dynamicSegmentsFactor
	#handlerWrapper

	constructor(
		handlerWrapper = (handler) => handler,
		dynamicSegmentsFactor = 10
	) {
		this.#dynamicSegmentsFactor = dynamicSegmentsFactor
		this.#handlerWrapper = handlerWrapper
	}

	handle(pattern, handler) {
		const [method, path] = pattern.split(" ")
		const segments = path.split("/").filter(Boolean)

		this.#routes.push({
			method: method.toUpperCase(),
			path,
			segments,
			handler: this.#handlerWrapper(handler),
			score:
				segments.filter((s) => !s.startsWith("{")).length *
					this.#dynamicSegmentsFactor -
				segments.length
		})

		this.#routes.sort(
			(a, b) => b.score - a.score || b.segments.length - a.segments.length
		)
	}

	find(method, url) {
		const segments = url.split("/").filter(Boolean)

		for (const route of this.#routes) {
			if (route.method !== method && route.method !== "ANY") continue
			if (route.segments.length !== segments.length) continue

			const params = {}
			let isMatch = true

			for (let i = 0; i < route.segments.length; i++) {
				const segment = route.segments[i]
				const urlSegment = segments[i]

				if (segment.startsWith("{") && segment.endsWith("}")) {
					params[segment.slice(1, -1)] = urlSegment
				} else if (segment !== urlSegment) {
					isMatch = false
					break
				}
			}

			if (isMatch) return { handler: route.handler, params }
		}

		return null
	}
}
