export function createIdGeneratorStub(sequence = ["generated-id-1"]) {
	let i = 0
	return {
		generate() {
			const id = sequence[i] ?? `generated-id-${i + 1}`
			i += 1
			return id
		},
		get callCount() {
			return i
		}
	}
}
