// ---------- ---------- ---------- ---------- ----------
// exports
// ---------- ---------- ---------- ---------- ----------

export {
	getValue, setValue,
	getLocalState, setLocalState, createLocalKey
}

// ---------- ---------- ---------- ---------- ----------
// implementation
// ---------- ---------- ---------- ---------- ----------
/**
 * state の keyNames をたどって値を取得する
 */
const getValue = function <S, D> (
	state   : S,
	keyNames: string[],
	def     : D
): D {
	let result = state as any

	for (const key of keyNames) {
		if (
			result == null ||
			typeof result !== "object"
		) return def

		if (Object.prototype.hasOwnProperty.call(result, key)) {
			result = result[key]
		} else {
			return def
		}
	}

	return result as D
}

// ---------- ---------- ---------- ---------- ----------
/**
 * state の keyNames をたどって値を設定する
 */
const setValue = function <S> (
	state   : S,
	keyNames: string[],
	value   : any
): S {
	let result = { ...state } as any
	let current = result

	for (let i = 0; i < keyNames.length; i++) {
		const key = keyNames[i]

		if (
			Object.prototype.hasOwnProperty.call(current, key) &&
			current[key] != null &&
			typeof current[key] === "object"
		) {
			current[key] = { ...current[key] }
		} else {
			current[key] = {}
		}

		if (keyNames.length - 1 === i) {
			current[key] = value
		}

		current = current[key]
	}

	return result as S
}

// ---------- ---------- ---------- ---------- ----------
/**
 * ユニーク文字を作成する
 */
const createLocalKey = (id: string): string => `local_key_${ id }`

// ---------- ---------- ---------- ---------- ----------
/**
 * state にぶら下げられたローカルステートを取得する
 */
const getLocalState = function <S, T> (
	state: S,
	id   : string,
	def  : T
): T {
	const localKey = createLocalKey(id)
	const obj = Object.prototype.hasOwnProperty.call(state, localKey)
		? (state as any)[localKey]
		: {}

	return {
		...def,
		...obj
	}
}

// ---------- ---------- ---------- ---------- ----------
/**
 * state にローカルステートをぶら下げる
 */
const setLocalState = function <S, T> (
	state: S,
	id   : string,
	value: T
): S {
	const localKey = createLocalKey(id)
	const obj = Object.prototype.hasOwnProperty.call(state, localKey)
		? (state as any)[localKey]
		: {}

	return {
		...state,
		[localKey]: {
			...obj,
			...value
		}
	}
}
