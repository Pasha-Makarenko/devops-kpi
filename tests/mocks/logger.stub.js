export function createLoggerStub() {
	const infoCalls = []
	return {
		infoCalls,
		info(msg, meta) {
			infoCalls.push({ msg, meta })
		}
	}
}
