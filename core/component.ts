// ---------- ---------- ---------- ---------- ----------
// import
// ---------- ---------- ---------- ---------- ----------

// hyperapp
import type { VNode, Dispatch, Effect } from "hyperapp"
import { h, text } from "hyperapp"

// ---------- ---------- ---------- ---------- ----------
// exports
// ---------- ---------- ---------- ---------- ----------

export {
	el,
	concatAction, getClassList, deleteKeys
}

// ---------- ---------- ---------- ---------- ----------
// implementation
// ---------- ---------- ---------- ---------- ----------
/**
 * h 関数のラッパー
 */
const el = <S = any> (tag: string) => (
	props?: { [key: string]: any },
	...children: any[]
): VNode<S> => h(
	tag,
	props ?? {},
	children
		.flat()
		.filter(child =>
			child !== null &&
			child !== undefined
		)
		.map((child: any) => typeof child === "object" ? child : text(`${child }`))
)

// ---------- ---------- ---------- ---------- ----------
/**
 * アクションを結合する
 * 結合したアクションは、1フレーム後に実行される
 */
const concatAction = function <S, E> (
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
/**
 * props から クラスリストを取得する
 */
const getClassList = (
	props: { [key: string]: any }
): string[] => {
	return props.class
		? props.class.trim().split(" ").filter(Boolean)
		: []
}

// ---------- ---------- ---------- ---------- ----------
/**
 * props から 指定されたキーを削除する
 */
const deleteKeys = <
	T extends Record<string, any>
> (
	props  : T,
	...keys: (keyof T)[]
): Omit<T, (typeof keys)[number]> => {
	const result = { ...props } as any

	keys.forEach(key => delete result[key])

	return result
}
