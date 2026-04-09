export class BaseException extends Error {
	constructor(message, details) {
		super(message)
		this.details = details
	}

	serialize() {
		return {
			message: this.message,
			details: this.details
		}
	}
}

export const CONFLICT_EXCEPTION_CODE = "CONFLICT"

export class ConflictException extends BaseException {
	code = CONFLICT_EXCEPTION_CODE

	constructor(message = "Conflict occurred", details) {
		super(message, details)
	}
}

export const INVALID_DATA_EXCEPTION_CODE = "INVALID_DATA"

export class InvalidDataException extends BaseException {
	code = INVALID_DATA_EXCEPTION_CODE

	constructor(message = "Invalid data", details) {
		super(message, details)
	}
}

export const NOT_FOUND_EXCEPTION_CODE = "NOT_FOUND"

export class NotFoundException extends BaseException {
	code = NOT_FOUND_EXCEPTION_CODE

	constructor(message = "Not found", details) {
		super(message, details)
	}
}
