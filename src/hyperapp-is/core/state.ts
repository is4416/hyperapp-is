// hyperapp-is / core / state.ts

// ---------- ---------- ---------- ---------- ----------
// type Keys
// ---------- ---------- ---------- ---------- ----------

export type Keys = readonly string[]

// ---------- ---------- ---------- ---------- ----------
// getValue
// ---------- ---------- ---------- ---------- ----------
/**
 * パスを辿って、ステートから値を取得する
 *
 * @template S
 * @template D
 * @param   {S}    state    - ステート
 * @param   {Keys} keyNames - 値までのパス
 * @param   {D}    def      - デフォルト値
 * @returns {D}             - 型保証は呼び出し側の責任
 */
export const getValue = function <S, D> (
	state   : S,
	keyNames: Keys,
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
// setValue
// ---------- ---------- ---------- ---------- ----------
/**
 * パスを辿って、ステートに値を設定して返す
 * 
 * @template S
 * @param   {S}    state    - ステート
 * @param   {Keys} keyNames - 値までのパス
 * @param   {any}  value    - 設定する値
 * @returns {S}
 */
export const setValue = function <S> (
	state   : S,
	keyNames: Keys,
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
// createLocalKey
// ---------- ---------- ---------- ---------- ----------
/**
 * IDからユニーク文字列を作成する
 * 
 * @param   {string} id - ユニークID
 * @returns {string}
 */
export const createLocalKey = (id: string): string => `local_key_${ id }`

// ---------- ---------- ---------- ---------- ----------
// getLocalState
// ---------- ---------- ---------- ---------- ----------
/**
 * ステートから、ローカルステートを取得する
 * 
 * @template S
 * @param   {S}                   state - ステート
 * @param   {string}              id    - ユニークID
 * @param   {Record<string, any>} def   - 初期値
 * @returns {Record<string, any>}
 */
export const getLocalState = function <S> (
	state: S,
	id   : string,
	def  : Record<string, any>
): Record<string, any> {
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
// setLocalState
// ---------- ---------- ---------- ---------- ----------
/**
 * ローカルステートを更新してステートを返す
 * 
 * @template S
 * @param   {S}                   state - ステート
 * @param   {string}              id    - ユニークID
 * @param   {Record<string, any>} value - 設定するローカルステート
 * @returns {S}
 */
export const setLocalState = function <S> (
	state: S,
	id   : string,
	value: Record<string, any>
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
