export function createTaskRepositoryStub() {
	const created = []
	const updated = []
	let findByTitleImpl = async (_title) => null
	let findByIdImpl = async (_id) => null

	return {
		created,
		updated,
		setFindByTitle(fn) {
			findByTitleImpl = fn
		},
		setFindById(fn) {
			findByIdImpl = fn
		},
		findByTitle(title) {
			return findByTitleImpl(title)
		},
		findById(id) {
			return findByIdImpl(id)
		},
		async create(task) {
			created.push(task)
		},
		async update(task) {
			updated.push(task)
		}
	}
}
