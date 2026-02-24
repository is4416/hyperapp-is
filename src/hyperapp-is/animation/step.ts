// hyperapp-ui / animation / step.ts

import { Effect, Dispatch } from "hyperapp"
import { setValue, getLocalState, setLocalState } from "../core/state"

// ---------- ---------- ---------- ---------- ----------
// action_throwMessageTick
// ---------- ---------- ---------- ---------- ----------

const action_throwMessageTick = function <S> (
	keyNames: string[],
	id      : string,
	text    : string,
	interval: number,
): (state: S) => S | [S, Effect<S>] {
	const NO_TIMER = 0

	return (state: S) => {
		const local = getLocalState(state, id, {
			timerID: NO_TIMER,
			msg    : "",
			index  : 0,
			paused : false
		})
		if (local.timerID !== NO_TIMER) clearTimeout(local.timerID)
		if (local.paused) return state

		const index = text === local.msg ? local.index : 0

		return [
			setValue(state, keyNames, text.slice(0, index + 1)),
			(dispatch: Dispatch<S>) => {
				dispatch((state: S) => setLocalState(state, id, {
					timerID: index + 1 < text.length
						? setTimeout(() => {
							dispatch(action_throwMessageTick(
								keyNames,
								id,
								text,
								interval
							))
						}, Math.max(0, interval))
						: 0,
					msg  : text,
					index: index + 1
				}))
			}
		]
	}
}

// ---------- ---------- ---------- ---------- ----------
// effect_throwMessageStart
// ---------- ---------- ---------- ---------- ----------
/**
 * ステートに文字を一文字ずつ流し込むエフェクト
 * 
 * @template S
 * @param   {string[]} keyNames - 値までのパス
 * @param   {string}   id       - ユニークID
 * @param   {string}   text     - 流し込む文字
 * @param   {number}   interval - 次の文字を流し込むまでの間隔（ms）
 * @returns {(dispatch: Dispatch<S>) => void}
 */
export const effect_throwMessageStart = function <S> (
	keyNames: string[],
	id      : string,
	text    : string,
	interval: number,
): (dispatch: Dispatch<S>) => void {
	return (dispatch: Dispatch<S>) => {
		dispatch((state: S) => setLocalState(state, id, {
			keyNames: keyNames,
			msg     : "",
			interval: interval,
			index   : 0,
			paused  : false
		}))

		dispatch(action_throwMessageTick(keyNames, id, text, interval))
	}
}

// ---------- ---------- ---------- ---------- ----------
// effect_throwMessagePause
// ---------- ---------- ---------- ---------- ----------
/**
 * throwMessageを一時停止する
 * 
 * @template S
 * @param   {string} id - ユニークID
 * @returns {(dispatch: Dispatch<S>) => void}
 */
export const effect_throwMessagePause = function <S> (
	id: string
): (dispatch: Dispatch<S>) => void {
	return (dispatch: Dispatch<S>) => {
		dispatch((state: S) => setLocalState(state, id, { paused: true }))
	}
}

// ---------- ---------- ---------- ---------- ----------
// effect_throwMessageResume
// ---------- ---------- ---------- ---------- ----------
/**
 * 一時停止したthrowMessageを再開する
 * 
 * @template S
 * @param   {string} id - ユニークID
 * @returns {(dispatch: Dispatch<S>) => void}
 */
export const effect_throwMessageResume = function <S> (
	id: string
): (dispatch: Dispatch<S>) => void {
	return (dispatch: Dispatch<S>) => {
		dispatch((state: S) => setLocalState(state, id, { paused: false }))

		dispatch((state: S) => {
			const { keyNames, msg, interval } = getLocalState(state, id, {
				keyNames: [],
				msg     : "",
				interval: 0,
				paused   : false
			})

			return action_throwMessageTick(keyNames, id, msg, interval)
		})
	}
}
