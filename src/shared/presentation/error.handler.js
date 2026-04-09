import {
	BaseException,
	CONFLICT_EXCEPTION_CODE,
	INVALID_DATA_EXCEPTION_CODE,
	NOT_FOUND_EXCEPTION_CODE
} from "../domain/errors.js"

const ERROR_CODE_MAP = {
	[CONFLICT_EXCEPTION_CODE]: 409,
	[INVALID_DATA_EXCEPTION_CODE]: 400,
	[NOT_FOUND_EXCEPTION_CODE]: 404
}

export const errorHandler = (error) => {
	let message = "Internal server error"
	let code = 500

	if (error instanceof BaseException) {
		message = error.message
		code = ERROR_CODE_MAP[error.code] ?? 500
	}

	return { code, message }
}
