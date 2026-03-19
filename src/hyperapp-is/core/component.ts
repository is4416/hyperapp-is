// hyperapp-is / core / component.ts

// ---------- ---------- ---------- ---------- ----------
// import
// ---------- ---------- ---------- ---------- ----------

import { h, text, VNode, Dispatch, Effect } from "hyperapp"
import {
	Keys_String, Keys_ArrayString,
	getValue, setValue
} from "./state"

// ---------- ---------- ---------- ---------- ----------
// el
// ---------- ---------- ---------- ---------- ----------

/**
 * h 関数のラッパー
 * hが競合する可能性があるので作成した
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

// ---------- ---------- ---------- ---------- ----------
// concatAction
// ---------- ---------- ---------- ---------- ----------

/**
 * アクションを結合して結果を返す
 */

export const concatAction = function <S, E> (
	action  : undefined | ((state: S, e: E) => S | [S, Effect<S>]),
	newState: S,
	e       : E
): S | [S, Effect<S>] {
	if (!action) return newState

	const effect = (dispatch: Dispatch<S>) => {
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

// ---------- ---------- ---------- ---------- ----------
// Route Component
// ---------- ---------- ---------- ---------- ----------

/**
 * ステート内の文字とmatchした時、VNodeを返す
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
// vnodes
// ---------- ---------- ---------- ---------- ----------

const button = el("button")

// ---------- ---------- ---------- ---------- ----------
// SelectButton Component
// ---------- ---------- ---------- ---------- ----------

const REVERSE_PREFIX = "r_"

/**
 * クリックで、クラス名 select をトグルするボタン
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

	// ---------- ---------- ----------
	// action
	// ---------- ---------- ----------

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

	// ---------- ---------- ----------
	// VNode
	// ---------- ---------- ----------

	return button({
		type: "button",
		...deleteKeys(props, "state", "keyNames", "reverse"),
		class  : classList.join(" "),
		onclick: action
	}, children)
}

// ---------- ---------- ---------- ---------- ----------
// OptionButton Component
// ---------- ---------- ---------- ---------- ----------

/**
 * クリックで、クラス名 select を排他的に選択するボタン
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

	// ---------- ---------- ----------
	// action
	// ---------- ---------- ----------

	const action = (state: S, e: MouseEvent) => {
		const selectedName = getValue(state, keyNames, "") as string
		const newValue = selectedName === id && reverse
			? `${ REVERSE_PREFIX }${ id }`
			: id
		const newState = setValue(state, keyNames, newValue)
		return concatAction(props.onclick, newState, e)
	}

	// ---------- ---------- ----------
	// VNode
	// ---------- ---------- ----------

	return button({
		type: "button",
		...deleteKeys(props, "state", "keyNames", "reverse"),
		class  : classList.join(" "),
		onclick: action
	}, children)
}
