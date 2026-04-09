import { randomBytes } from "node:crypto"

let _lastMs = 0
let _seq = 0n

const MAX_SEQ = 0x3fffffffffffffffffn

export const uuidv7 = () => {
	const now = Date.now()

	if (now > _lastMs || _seq >= MAX_SEQ) {
		_lastMs = now

		const buffer = randomBytes(10)

		const high = buffer.readBigUInt64BE(0)
		const low = BigInt(buffer.readUInt16BE(8))

		const fullRandom = (high << 16n) | low
		_seq = fullRandom & MAX_SEQ
	} else {
		_seq += 1n
	}

	const ts = BigInt(now)

	const seqHigh = _seq >> 62n
	const seqLow = _seq & 0x3fffffffffffffffn

	let uuidInt = ts << 80n
	uuidInt |= 0x7n << 76n
	uuidInt |= seqHigh << 64n
	uuidInt |= 0x2n << 62n
	uuidInt |= seqLow

	const hex = uuidInt.toString(16).padStart(32, "0")

	return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}
