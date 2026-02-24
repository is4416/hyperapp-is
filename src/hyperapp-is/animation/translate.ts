import { Dispatch } from "hyperapp";
import { getValue, setValue } from "../core/state"
import { InternalEffect, RAFEvent, RAFTask } from "./raf";
import { CSSProperty, createRAFProperties } from "./properties";

// ---------- ---------- ---------- ---------- ----------
// interface TranslateState
// ---------- ---------- ---------- ---------- ----------
/**
 * Translate 管理用オブジェクト
 * 
 * @type {Object} TranslateState
 * @property {number} width - 移動量
 * @property {number} index - 先頭のインデックス
 * @property {number} total - 子の数
 * @property {(t: number) => number} easing - easing 関数
 */
export interface TranslateState {
	width : number
	index : number
	total : number
	easing: (t: number) => number
}

// ---------- ---------- ---------- ---------- ----------
// createRAFTranslate
// ---------- ---------- ---------- ---------- ----------
/**
 * subscription_RAFManager をベースにした Translate アニメーション RAFTask を作成する
 * props は、基本的に RAFTask の値
 * 
 * @param {TranslateState} props.translateState  - カルーセル情報
 */
export const createRAFTranslate = function <S> (
	props: {
		id      : string
		groupID?: string
		duration: number
		delay   : number

		finish?: (state: S, rafTask: RAFTask<S>) => S | [S, InternalEffect<S>]

		priority ?: number
		extension?: { [key: string]: any }

		translateState: TranslateState
	}
): RAFTask<S> {
	const { id, groupID, duration, delay, priority, translateState } = props
	const extension = {
		...props.extension,
		translateState
	}

	// finish
	const finish = (state: S, rafTask: RAFTask<S>): S | [S, InternalEffect<S>] => {
		const dom = document.getElementById(id) as HTMLElement
		if (!dom) return state

		const children = Array.from(dom?.children) as HTMLElement[]
		if (!children || children.length < 2) return state

		dom.style.transform = "translateX(0px)"

		const firstChild = dom.firstChild
		if (firstChild) dom.appendChild(firstChild)

		return [
			state,
			(dispatch: Dispatch<S>) => {
				const fn = props.finish
				if (fn) {
					requestAnimationFrame(() => dispatch((state: S) => fn(state, rafTask)))
				}
			}
		]
	}

	// properties
	const properties: CSSProperty[] = [{
		[`#${ id }`]: {
			"transform": (progress: number) => `translateX(${ - translateState.easing(progress) * translateState.width }px)`
		}
	}]

	return createRAFProperties({
		id, groupID, duration, delay, finish, priority, extension,
		properties
	})
}

// ---------- ---------- ---------- ---------- ----------
// effect_translateStart
// ---------- ---------- ---------- ---------- ----------
/**
 * subscription_RAFManager をベースにした Translate アニメーションエフェクト
 */
export const effect_translateStart = function <S> (
	props: {
		id      : string
		groupID?: string
		duration: number
		delay   : number

		finish?: (state: S, rafTask: RAFTask<S>) => S | [S, InternalEffect<S>]

		priority ?: number
		extension?: { [key: string]: any }

		easing ?: (t: number) => number

		keyNames: string[]
	}
): (dispatch: Dispatch<S>) => void {
	const { id, groupID, duration, delay, priority, extension, keyNames } = props
	const easing = props.easing ? props.easing : (t: number) => t

	// finish
	const finish = (state: S, rafTask: RAFTask<S>): S | [S, InternalEffect<S>] => {

		// dom
		const dom = document.getElementById(id) as HTMLElement
		if (!dom) return state

		const children = Array.from(dom?.children) as HTMLElement[]
		if (!children || children.length < 2) return state

		// width
		const width = children[1].offsetLeft - children[0].offsetLeft

		// translateState
		const translateState: TranslateState = rafTask.extension?.translateState
		if (!translateState) return state

		// newTask
		const newTask = createRAFTranslate({
			id, groupID, duration, delay, finish, priority, extension,
			translateState: {
				index : translateState.index + 1 < children.length ? translateState.index + 1 : 0,
				total : children.length,
				width : width,
				easing: translateState.easing
			}
		})

		return [
			state,
			(dispatch: Dispatch<S>) => {
				const fn = props.finish
				if (fn) requestAnimationFrame(() => dispatch((state: S) => fn(state, newTask)))

				const tasks = getValue(state, keyNames, [] as RAFTask<S>[])
					.filter(task => task.id !== id)
					.concat(newTask)
				requestAnimationFrame(() => dispatch((state: S) => setValue(state, keyNames, tasks)))
			}
		]
	}

	return (dispatch: Dispatch<S>) => {
		// dom
		const dom = document.getElementById(id) as HTMLElement
		const children = Array.from(dom?.children) as HTMLElement[]
		if (!children || children.length < 2) return

		// width
		const width = children[1].offsetLeft - children[0].offsetLeft

		// newTask
		const newTask = createRAFTranslate({
			id, groupID, duration, delay, finish, priority, extension,
			translateState: {
				index : 0,
				total : children.length,
				width : width,
				easing: easing
			}
		})

		dispatch((state: S) => {
			// tasks
			const tasks = getValue(state, keyNames, [] as RAFTask<S>[])
				.filter(task => task.id !== id)
				.concat(newTask)
			return setValue(state, keyNames, tasks)
		})
	}
}

// ---------- ---------- ---------- ---------- ----------
// effect_translateRollback
// ---------- ---------- ---------- ---------- ----------
/**
 * アニメーション中のカルーセルを、元の位置に戻す
 */
export const effect_translateRollback = function <S> (
	props: {
		id      : string
		keyNames: string[]
		paused ?: boolean
		finish ?: RAFEvent<S>
	}
): (dispatch: Dispatch<S>) => void {
	const { id, keyNames, paused } = props

	return (dispatch: Dispatch<S>) => {
		dispatch((state: S) => {
			// get tasks
			const tasks = getValue(state, keyNames, [] as RAFTask<S>[])
			const task  = tasks.find(task => task.id === id)
			if (!task) return state

			// get carouseState
			const param = task.extension?.translateState
			if (!param) return state

			// pause
			task.paused = true

			// get dom
			const dom = document.getElementById(id)
			if (!dom) return state

			const children = Array.from(dom.children) as HTMLElement[]
			if (!children || children.length < 2) return state

			// get width (動作済みの幅を取得)
			const width = (children[1].offsetLeft - children[0].offsetLeft)
				* param.easing(task.progress)

			// clone
			const cloneTask = task.clone()

			// newTask (動作済みの幅を戻すアニメーション)
			const newTask = new RAFTask<S>({
				id      : `${ id }_remove`,
				duration: 200,
				action: (state: S, rafTask: RAFTask<S>): S | [S, InternalEffect<S>] => {
					const val = - width + rafTask.progress * width
					dom.style.transform = `translateX(${ val }px)`
					return state
				},
				finish: (state: S, rafTask: RAFTask<S>): S | [S, InternalEffect<S>] => {
					dom.style.transform = "translateX(0px)"
					cloneTask.paused = paused ?? false

					const fn = props.finish
					if (fn) {
						requestAnimationFrame(() => dispatch((state: S) => fn(state, cloneTask)))
					}

					return setValue(
						state,
						keyNames,
						getValue(state, keyNames, [] as RAFTask<S>[])
							.filter(task => task.id !== id && task.id !== `${ id }_remove`)
							.concat(cloneTask)
					)
				}
			}) // end newTask

			// 巻き戻しアニメーションに差し替える
			return setValue(
				state,
				keyNames,
				tasks
					.filter(task => task.id !== id)
					.concat(newTask)
			)
		}) // end dispatch
	}
}

// ---------- ---------- ---------- ---------- ----------
// effect_translateRollforward
// ---------- ---------- ---------- ---------- ----------
/**
 * アニメーション中のカルーセルを、早送りする
 */
export const effect_translateRollforward = function <S> (
	props: {
		id      : string
		keyNames: string[]
		paused ?: boolean
		finish ?: RAFEvent<S>
	}
): (dispatch: Dispatch<S>) => void {
	const { id, keyNames, paused } = props

	return (dispatch: Dispatch<S>) => {
		dispatch((state: S) => {
			// get tasks
			const tasks = getValue(state, keyNames, [] as RAFTask<S>[])
			const task  = tasks.find(task => task.id === id)
			if (!task) return state

			// get carouseState
			const param = task.extension?.translateState
			if (!param) return state

			// pause
			task.paused = true

			// get dom
			const dom = document.getElementById(id)
			if (!dom) return state

			const children = Array.from(dom.children) as HTMLElement[]
			if (!children || children.length < 2) return state

			// get maxWidth
			const maxWidth = children[1].offsetLeft - children[0].offsetLeft

			// get width (動作済みの幅を取得)
			const width = maxWidth * param.easing(task.progress)

			// clone
			const cloneTask = task.clone()

			// newTask (残りの幅を進めるアニメーション)
			const newTask = new RAFTask<S>({
				id      : `${ id }_remove`,
				duration: 200,

				action: (state: S, rafTask: RAFTask<S>): S | [S, InternalEffect<S>] => {
					const val = - width - rafTask.progress * (maxWidth - width)
					dom.style.transform = `translateX(${ val }px)`
					return state
				},

				finish: (state: S, rafTask: RAFTask<S>): S | [S, InternalEffect<S>] => {
					cloneTask.paused = paused ?? false

					// props.finish
					const propsFn = props.finish
					if (propsFn) {
						requestAnimationFrame(() => dispatch((state: S) => propsFn(state, cloneTask)))
					}

					// cloneTask.finish
					const cloneFn = cloneTask.finish
					if (cloneFn) {
						requestAnimationFrame(() => dispatch((state: S) => cloneFn(state, cloneTask)))
					}

					return setValue(
						state,
						keyNames,
						getValue(state, keyNames, [] as RAFTask<S>[])
							.filter(task => task.id !== id && task.id !== `${ id }_remove`)
							.concat(cloneTask)
					)
				}
			}) // end newTask

			// 早送りアニメーションに差し替える
			return setValue(
				state,
				keyNames,
				tasks
					.filter(task => task.id !== id)
					.concat(newTask)
			)
		}) // end dispatch
	}
}

// ---------- ---------- ---------- ---------- ----------
// action_translateSlide
// ---------- ---------- ---------- ---------- ----------
/**
 * カルーセルを任意のインデックスまで移動する
 */
export const effect_translateSlide = function <S> (
	props: {
		id      : string
		keyNames: string[]
		index   : number
		paused ?: boolean
		finish ?: RAFEvent<S>
	}
): (dispatch: Dispatch<S>) => void {
	const { id, keyNames, index, paused, finish } = props

	// dispatch
	return (dispatch: Dispatch<S>) => {
		// get dom
		const dom = document.getElementById(id)
		if (!dom) return

		const children = Array.from(dom.children) as HTMLElement[]
		if (!children || children.length < index || children.length < 2) return

		// dispatch
		dispatch((state: S) => {
			// get task
			const tasks = getValue(state, keyNames, [] as RAFTask<S>[])
			const task  = tasks.find(task => task.id === id)
			if (!task) return state

			// get translateState
			const param = task.extension?.translateState
			if (!param) return state

			// 移動先の取得
			const moveTo = index - param.index

			// moveTo が 0 のときは、移動せずに Rollback だけ行う
			// Rollback
			if (moveTo === 0) {
				return [state, effect_translateRollback({
					id, keyNames, paused, finish
				})]
			}

			// 現在のタスクを一時停止
			task.paused = true

			// 現在のタスクをコピー
			const cloneTask = task.clone()

			// 今移動しようとしている幅
			const maxWidth = children[1].offsetLeft - children[0].offsetLeft

			// すでに移動済みの幅
			const width = param.easing(task.progress) * maxWidth

			// クローン配列
			const cloneNodes: HTMLElement[] = []

			// 更新用のタスク
			let newTask: RAFTask<S>

			if (moveTo > 0) {
				// Next

				// 足りない DOM をクローン
				for (let i = 0; i < moveTo - 1; i++) {
					const cloneNode = children[i].cloneNode(true) as HTMLElement
					cloneNodes.push(cloneNode)
					dom.appendChild(cloneNode)
				}

				// 残りの移動量を計測
				const reWidth = (dom.children[moveTo] as HTMLElement).offsetLeft
					- children[0].offsetLeft - width

				// create newTask
				newTask = new RAFTask<S>({
					id      : `${ id }_slide`,
					duration: 200,

					action: (state: S, rafTask: RAFTask<S>): S | [S, InternalEffect<S>] => {
						const val = - width - rafTask.progress * reWidth
						dom.style.transform = `translateX(${ val }px)`
						return state
					},

					finish: (state: S, rafTask: RAFTask<S>): S | [S, InternalEffect<S>] => {
						// set cloneTask.paused
						cloneTask.paused = paused ?? false

						// delete cloneNodes
						cloneNodes.forEach(node => node.remove())

						// move children
						// translateStart は、右にバッファを一つ持つ構造です
						// そのため move children は 1つ少なくなります
						for (let i = 0; i < moveTo - 1; i++) {
							const firstChild = dom.firstChild
							if (firstChild) dom.appendChild(firstChild)
						}

						// translateState.index を、一つ手前の数に調整
						cloneTask.extension.translateState.index = index === 0
							? cloneTask.extension.translateState.total
							: index - 1

						// props.finish
						const propsFn = props.finish
						if (propsFn) {
							requestAnimationFrame(() => dispatch((state: S) => propsFn(state, cloneTask)))
						}

						// cloneTask.finish
						const cloneFn = cloneTask.finish
						if (cloneFn) {
							requestAnimationFrame(() => dispatch((state: S) => cloneFn(state, cloneTask)))
						}

						return setValue(
							state,
							keyNames,
							getValue(state, keyNames, [] as RAFTask<S>[])
								.filter(task => task.id !== id && task.id !== `${ id }_slide`)
								.concat(cloneTask)
						)
					}
				})
			} else {
				// Back
				const need = Math.abs(moveTo)

				// 足りない DOM をクローン
				for (let i = 0; i < need + 1; i++) {
					const cloneNode = children[children.length - 1 - i].cloneNode(true) as HTMLElement
					cloneNodes.push(cloneNode)
					dom.insertBefore(cloneNode, dom.firstChild)
				}

				// 残りの移動量を計測
				const reWidth = (dom.children[need] as HTMLElement).offsetLeft
					- (dom.children[0] as HTMLElement).offsetLeft
					+ width

				// set translate
				dom.style.transform = `translateX(${ - reWidth }px)`

				newTask = new RAFTask({
					id      : `${ id }_slide`,
					duration: 200,

					action: (state: S, rafTask: RAFTask<S>): S | [S, InternalEffect<S>] => {
						const val = - width + rafTask.progress * reWidth
						dom.style.transform = `translateX(${ val }px)`
						return state
					},

					finish: (state: S, rafTask: RAFTask<S>): S | [S, InternalEffect<S>] => {
						// set cloneTask.paused
						cloneTask.paused = paused ?? false

						// delete cloneNodes
						cloneNodes.forEach(node => node.remove())

						// move children

						// cloneTask.finish で、一つ消されてしまうので、1つ余分に移動する !! コレダ!!
						for (let i = 0; i < need + 1; i++) {
							const lastChild = dom.children[dom.children.length - 1] as HTMLElement
							if (lastChild) dom.insertBefore(lastChild, dom.firstChild)
						}

						// translateState.index を、一つ手前の数に調整
						cloneTask.extension.translateState.index = index === 0
							? cloneTask.extension.translateState.total
							: index - 1

							// props.finish
						const propsFn = props.finish
						if (propsFn) {
							requestAnimationFrame(() => dispatch((state: S) => propsFn(state, cloneTask)))
						}

						// cloneTask.finish
						const cloneFn = cloneTask.finish
						if (cloneFn) {
							requestAnimationFrame(() => dispatch((state: S) => cloneFn(state, cloneTask)))
						}

						return setValue(
							state,
							keyNames,
							getValue(state, keyNames, [] as RAFTask<S>[])
								.filter(task => task.id !== id && task.id !== `${ id }_slide`)
								.concat(cloneTask)
						)
					}
				})
			}

			// タスクの更新
			return setValue(
				state,
				keyNames,
				tasks
					.filter(task => task.id !== id)
					.concat(newTask)
			)
		})
	}
}

