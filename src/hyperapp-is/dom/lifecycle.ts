// hyperapp-ui / dom / lifecycle.ts

import { Effect, Subscription, Dispatch } from "hyperapp"
import { getValue, setValue, getLocalState, setLocalState } from "../core/state"

// ---------- ---------- ---------- ---------- ----------
// effect_setTimedValue
// ---------- ---------- ---------- ---------- ----------
/**
 * ステートに存在時間制限付きの値を設定するエフェクト
 *
 * @template S
 * @template T
 * @param   {string[]} keyNames - 値までのパス
 * @param   {string}   id       - ユニークID
 * @param   {number}   timeout  - 存在可能時間（ms）
 * @param   {T}        value    - 一時的に設定する値
 * @param   {T | null} reset    - タイムアウト後に設定する値
 * @returns {(dispatch: Dispatch<S>) => void}
 */
export const effect_setTimedValue = function <S, T> (
	keyNames: string[],
	id      : string,
	timeout : number,
	value   : T,
	reset   : T | null = null
): (dispatch: Dispatch<S>) => void {
	const NO_TIMER = 0

	return (dispatch: Dispatch<S>) => {
		dispatch((state: S) => {
			const { timerID } = getLocalState(state, id, { timerID: NO_TIMER })
			if (timerID !== NO_TIMER) clearTimeout(timerID)
			
			return setLocalState(
				setValue(state, keyNames, value),
				id,
				{
					timerID: setTimeout(() => {
						dispatch((state: S) => setLocalState(
							setValue(state, keyNames, reset),
							id,
							{
								timerID: NO_TIMER
							}
						))
					}, Math.max(0, timeout))
				}
			)
		})
	}
}

// ---------- ---------- ---------- ---------- ----------
// effect_nodesInitialize
// ---------- ---------- ---------- ---------- ----------
/**
 * DOM生成後にノードを取得して初期化処理を実行するエフェクト
 *
 * @template S
 * @param   {{id: string. event: (state: S, element: Element) => S | [S, Effect<S>]}[]} nodes
 *  - 初期化対象ノード定義配列
 * @returns {(dispatch: Dispatch<S>) => void}
 */
export const effect_nodesInitialize = function <S> (
	nodes: {
		id   : string
		event: (state: S, element: Element) => S | [S, Effect<S>]
	}[]
): (dispatch: Dispatch<S>) => void {
	const done = new Set<string>()

	return (dispatch: Dispatch<S>) => {
		nodes.forEach(node => {
			if (done.has(node.id)) return
			done.add(node.id)

			const element = document.getElementById(node.id)
			if (element) dispatch([node.event, element])
		})
	}
}

// ---------- ---------- ---------- ---------- ----------
// subscription_nodesCleanup
// ---------- ---------- ---------- ---------- ----------
/**
 * @type {Object} CleanupNode
 * @property {string}                           id       - ユニークID
 * @property {(state: S) => S | [S, Effect<S>]} finalize - クリーンアップイベント
 */

/**
 * DOMが存在しない場合、クリーンアップ処理を実行するサブスクリプション
 * クリーンアップは、DOMが廃棄された直後ではなく、次のアクション時に実行されます
 * 
 * @template S
 * @param   {CleanupNode<S>[]} nodes - クリーンアップ対象ノード定義配列
 * @returns {Subscription<S>[]}
 */
export const subscription_nodesCleanup = function <S>(
	nodes: {
		id      : string
		finalize: (state: S) => S | [S, Effect<S>]
	}[]
): Subscription<S>[] {
	const key = `local_key_nodesCleanup`

	return nodes.map(node => [
		(dispatch: Dispatch<S>, payload: typeof node) => {
			dispatch((state: S) => {
				const dom = document.getElementById(payload.id)
				const keys = [key, payload.id, "initialized"]

				const initialized = getValue(state, keys, false)

				// initialize
				if (dom && !initialized) {
					return setValue(state, keys, true)
				}

				// finalize
				if (!dom && initialized) {
					const newState = setValue(state, keys, false)
					return payload.finalize(newState)
				}

				return state
			})

			return () => {}
		},
		node
	])
}

// ---------- ---------- ---------- ---------- ----------
// subscription_nodesLifecycleByIds
// ---------- ---------- ---------- ---------- ----------
/**
 * @type {Object} LifecycleNode
 * @property {string}                                                    id         - ユニークID
 * @property {(state: S, element: Element | null) => S | [S, Effect<S>]} initialize - 初期化イベント
 * @property {(state: S, element: Element | null) => S | [S, Effect<S>]} finalize   - 終了イベント
 */

/**
 * 登録されたIDを元に、初期化・終了処理を実行するサブスクリプション
 * IDに一致するDOMが存在する場合、イベント時がセットされます
 * 
 * @template S
 * @param   {string[]}        keyNames - 文字配列までのパス
 * @param   {LifecycleNode[]} nodes    - 監視対象ノード定義配列
 * @returns {Subscription<S>[]}
 */
export const subscription_nodesLifecycleByIds = function <S> (
	keyNames: string[],
	nodes: {
		id        : string
		initialize: (state: S, element: Element | null) => S | [S, Effect<S>]
		finalize  : (state: S, element: Element | null) => S | [S, Effect<S>]
	}[]
): Subscription<S>[] {
	const key  = "local_key_nodesLifecycleByIds"

	return nodes.map(node => [
		(dispatch: Dispatch<S>, payload: typeof node) => {
			dispatch((state: S) => {
				const dom  = document.getElementById(payload.id)
				const keys = [key, payload.id, "initialized"]

				const list = getValue(state, keyNames, [] as string[])
				const initialized = getValue(state, keys, false)

				// initialize
				if (list.includes(payload.id) && !initialized) {
					const newState = setValue(state, keys, true)
					return node.initialize(newState, dom)
				}

				// finalize
				if (!list.includes(payload.id) && initialized) {
					const newState = setValue(state, keys, false)
					return node.finalize(newState, dom)
				}

				return state
			})

			return () => {}
		}
		,
		node
	])
}
