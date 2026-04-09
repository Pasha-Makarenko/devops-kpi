import { uuidv7 } from "../infrastructure/utils.js"

export const createRequestMiddleware = (als) => (handler) => (args) => {
	const requestId = args?.req?.headers["x-request-id"] ?? uuidv7()

	return als.run(
		{
			requestId
		},
		async () => {
			return handler(args)
		}
	)
}
