// hyperapp-is / core / component.ts

import { h, text, VNode, Dispatch, Effect } from "hyperapp"
import {
	Keys_String, Keys_ArrayString,
	getValue, setValue
} from "./state"

// ========== ========== ========== ========== ==========
// 補助関数
// ========== ========== ========== ========== ==========

// ---------- ---------- ---------- ---------- ----------
// el
// ---------- ---------- ---------- ---------- ----------
/**
 * h 関数のラッパー
 * 他でjsxを使用した場合、hが競合する可能性があるので作成した
 * 
 * @template S
 * @param   {string} tag - タグ名
 * @returns {(props:{ [key: string] any }, ...children:any[]) => VNode<S>}
 */
export const el = (tag: string) => <S> (
	props?: { [key: string]: any },
	...children: any[]
): VNode<S> => h(
	tag,
	props ?? {},
	children
		.flat()
		.map((child: any) => typeof child === "object" ? child : text(child))
)

/* element */
const button = el("button")

// ---------- ---------- ---------- ---------- ----------
// concatAction
// ---------- ---------- ---------- ---------- ----------
/**
 * アクションを結合して結果を返す
 * 
 * @template S
 * @template E
 * @param   {undefined | (state: S, e: E) => S | [S, Effect<S>]} action   - 結合するアクション
 * @param   {S}                                                  newState - 結合するステート
 * @param   {E}                                                  e        - イベント (任意のイベント型)
 * @returns {S | [S, Effect<S>]}
 */
export const concatAction = function <S, E> (
	action  : undefined | ((state: S, e: E) => S | [S, Effect<S>]),
	newState: S,
	e       : E
): S | [S, Effect<S>] {
	if (!action) return newState

	const effect = (dispatch: Dispatch<S>) => {

		// 次の描画を待たないと、newStateと同時にdispatchが走ってしまい、DOMが存在しない可能性がある
		// effect_initializeNodesを機能させるため、dispatch を描画後まで保留する
		requestAnimationFrame(() => {
			dispatch((state: S) => action(state, e))
		})
	}

	return [newState, effect]
}

// ---------- ---------- ---------- ---------- ----------
// getClassList
// ---------- ---------- ---------- ---------- ----------
/**
 * props から classList を取得
 * 
 * @param   {Record<string, any>} props - props
 * @returns {string[]}
 */
export const getClassList = (
	props: { [key: string]: any }
): string[] => {
	return props.class
		? props.class.trim().split(" ").filter(Boolean)
		: []
}

// ---------- ---------- ---------- ---------- ----------
// deleteKeys
// ---------- ---------- ---------- ---------- ----------
/**
 * props から不要なキーを削除する
 * 
 * @template T
 * @param   {T}            props - props
 * @param   {(keyof T)[])} keys  - 削除するキー
 * @returns {Omit<T, (typeof keys)[number]>}
 */
export const deleteKeys = <
	T extends Record<string, any>
> (
	props  : T,
	...keys: (keyof T)[]
): Omit<T, (typeof keys)[number]> => {
	const result = { ...props } as any

	keys.forEach(key => delete result[key])

	return result
}

// ========== ========== ========== ========== ==========
// コンポーネント
// ========== ========== ========== ========== ==========

// ---------- ---------- ---------- ---------- ----------
// Route
// ---------- ---------- ---------- ---------- ----------
/**
 * ステート内の文字とmatchした時、VNodeを返す
 * 
 * @template S
 * @param   {Record<string, any>} props          - props
 * @param   {S}                   props.state    - ステート
 * @param   {Keys_String}         props.keyNames - ステート内の文字までのパス
 * @param   {string}              props.match    - 一致判定する文字
 * @param   {any}                 children       - 出力する内容 (VNode / 配列 / 文字など)
 * @returns {VNode<S> | null}
 */
export const Route = function <S> (
	props: {
		state   : S
		keyNames: Keys_String
		match   : string
	},
	children: any
): VNode<S> | null {
	const { state, keyNames, match } = props
	const selectedName = getValue(state, keyNames, "")

	// nullの場合、VNodeは生成されない
	return selectedName === match ? children : null
}

// ---------- ---------- ---------- ---------- ----------
// SelectButton
// ---------- ---------- ---------- ---------- ----------
const REVERSE_PREFIX = "r_"

/**
 * クリックで、クラス名のselectをトグルするボタン
 * 
 * @template S
 * @param   {Record<string, any>} props          - props
 * @param   {S}                   props.state    - ステート
 * @param   {Keys_ArrayString}    props.keyNames - ステート内の文字配列までのパス
 * @param   {string}              props.id       - ユニークID
 * @param   {boolean}            [props.reverse] - 反転選択するか
 * @param   {any}                 children       - 子要素 (VNode / string / 配列など)
 * @returns {VNode<S>}
 */
export const SelectButton = function <S> (
	props: {
		state        : S
		keyNames     : Keys_ArrayString
		id           : string
		reverse?     : boolean
		[key: string]: any
	},
	children: any
): VNode<S> {
	const { state, keyNames, id, reverse = false } = props

	// classList
	const classList = getClassList(props).filter(item => {
		const name = item.toLowerCase()
		return name !== "select" && name !== "reverse"
	})
	const selectedNames = getValue(state, keyNames, []) as string[]
	if (selectedNames.includes(id)) classList.push("select")
	if (selectedNames.includes(`${ REVERSE_PREFIX }${ id }`)) classList.push("reverse")

	// action
	const action = (state: S, e: MouseEvent) => {
		const selectedNames = getValue(state, keyNames, []) as string[]
		const newList = selectedNames.includes(id)
			? reverse
				? selectedNames.filter(item => item !== id).concat(`${ REVERSE_PREFIX }${ id }`)
				: selectedNames.filter(item => item !== id)
			: selectedNames.includes(`${ REVERSE_PREFIX }${ id }`)
				? selectedNames.filter(item => item !== `${ REVERSE_PREFIX }${ id }`)
				: selectedNames.concat(id)
		const newState = setValue(state, keyNames, newList)
		return concatAction(props.onclick, newState, e)
	}

	// VNode
	return button({
		type: "button",
		...deleteKeys(props, "state", "keyNames", "reverse"),
		class  : classList.join(" "),
		onclick: action
	}, children)
}

// ---------- ---------- ---------- ---------- ----------
// OptionButton
// ---------- ---------- ---------- ---------- ----------
/**
 * クリックで、クラス名のselectを排他的に選択するボタン
 * 
 * @template S
 * @param   {Record<string, any>} props          - props
 * @param   {S}                   props.state    - ステート
 * @param   {Keys_String}         props.keyNames - ステート内の文字までのパス
 * @param   {string}              props.id       - ユニークID
 * @param   {boolean}            [props.reverse] - 反転選択するか
 * @param   {any}                 children       - 子要素 (VNode / string / 配列など)
 * @returns {VNode<S>}
 */

export const OptionButton = function <S> (
	props: {
		state        : S
		keyNames     : Keys_String
		id           : string
		reverse?     : boolean
		[key: string]: any
	},
	children: any
): VNode<S> {
	const { state, keyNames, id, reverse = false } = props

	// classList
	const classList = getClassList(props).filter(item => {
		const name = item.toLowerCase()
		return name !== "select" && name !== "reverse"
	})
	const selectedName = getValue(state, keyNames, "") as string
	if (selectedName === id) classList.push("select")
	if (selectedName === `${ REVERSE_PREFIX }${ id }`) classList.push("reverse")

	// action
	const action = (state: S, e: MouseEvent) => {
		const selectedName = getValue(state, keyNames, "") as string
		const newValue = selectedName === id && reverse
			? `${ REVERSE_PREFIX }${ id }`
			: id
		const newState = setValue(state, keyNames, newValue)
		return concatAction(props.onclick, newState, e)
	}

	// VNode
	return button({
		type: "button",
		...deleteKeys(props, "state", "keyNames", "reverse"),
		class  : classList.join(" "),
		onclick: action
	}, children)
}
