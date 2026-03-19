// hyperapp-is / dom / lifecycle.ts

// ---------- ---------- ---------- ---------- ----------
// import
// ---------- ---------- ---------- ---------- ----------

import { Effect, Subscription, Dispatch } from "hyperapp"
import { getValue, setValue, getLocalState, setLocalState } from "../core/state"

// ---------- ---------- ---------- ---------- ----------
// effect_setTimedValue
// ---------- ---------- ---------- ---------- ----------

/**
 * ステートに存在時間制限付きの値を設定するエフェクト
 * 
 * - value
 * 一時的に設定する値
 * 
 * - reset
 * タイムアウト後に設定する値
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
 * DOM 生成後、初期化処理を実行するエフェクト
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
 * DOM が存在しない場合、クリーンアップ処理を実行するサブスクリプション
 * クリーンアップは DOM が廃棄された直後ではなく、次のアクション時に実行される
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
 * 登録されたIDを元に、初期化・終了処理を実行するサブスクリプション
 * DOM が存在する場合、イベントがセットされます
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
		},
		node
	])
}
