import { uuidv7 } from "./utils.js"

export class IdGenerator {
	generate() {
		return uuidv7()
	}
}
