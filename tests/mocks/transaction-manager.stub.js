export function createTransactionManagerStub() {
	let calls = 0
	return {
		get calls() {
			return calls
		},
		async transaction(fn) {
			calls += 1
			return await fn()
		}
	}
}
