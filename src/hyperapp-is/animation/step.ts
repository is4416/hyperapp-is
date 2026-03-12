// hyperapp-is / animation / step.ts

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

// ---------- ---------- ---------- ---------- ----------
// marquee
// ---------- ---------- ---------- ---------- ----------
/**
 * Carousel 風に DOM が流れるアニメーションを実行する
 * 
 * @param {Object}                 props          - props
 * @param {HTMLElement}            props.element  - DOM
 * @param {number}                 props.duration - 実行時間 (ms)
 * @param {number}                 props.delay    - 待機時間 (ms)
 * @param {(t: number) => number} [props.easing]  - easing 関数
 * @returns {{start: () => void, stop: () => void}}
 */
export const marquee = function <S> (
	props: {
		element : HTMLElement
		duration: number
		delay   : number
		easing ?: (t: number) => number
	}
): { start: () => void, stop : () => void } {
	const { element, duration, delay, easing = (t: number) => t } = props

	// function calcWidth
	const calcWidth = () => {
		const children = Array.from(element.children) as HTMLElement[]
		return !children || children.length < 2
			? 0
			: children[1].offsetLeft - children[0].offsetLeft
	}

	// variable
	let rID       = 0
	let timerID   = 0
	let startTime = 0
	let width     = 0

	// requestAnimationFrame callback
	const action = (now: number) => {

		// set startTime
		if (startTime === 0) startTime = now

		// get progress
		const progress = Math.min((now - startTime) / Math.max(1, duration))

		// set property
		element.style.transform = `translateX(${ - easing(progress) * width }px)`

		// next
		if (progress < 1) {
			rID = requestAnimationFrame(action)
			return
		}

		// reset property
		element.style.transform = `translateX(0px)`

		// set children
		const firstChild = element.children[0]
		if (!firstChild) return

		// loop
		element.appendChild(firstChild)

		// loop
		timerID = window.setTimeout(() => {
			startTime = 0
			rID       = requestAnimationFrame(action)
		}, delay)
	}

	// result
	return {
		start: () => {

			// 二重起動防止
			if (rID !== 0) return

			// get width
			width = calcWidth()
			if (width === 0) return

			// set gpu layer
			element.style.willChange = "transform"

			// start animation
			rID = requestAnimationFrame(action)
		},

		stop : () => {
			// cancel animation
			cancelAnimationFrame(rID)

			// stop timer
			clearTimeout(timerID)

			// clear gpy layer
			element.style.willChange = ""
			element.style.transform  = ""

			// clear ID
			rID     = 0
			timerID = 0
		}
	}
}