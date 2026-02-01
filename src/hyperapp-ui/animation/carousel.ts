import { Dispatch } from "hyperapp";
import { getValue, setValue } from "../core/state"
import { InternalEffect, RAFEvent, RAFTask } from "./raf";
import { CSSProperty, createRAFProperties } from "./properties";

// ---------- ---------- ---------- ---------- ----------
// interface CarouselState
// ---------- ---------- ---------- ---------- ----------
/**
 * Carousel 管理用オブジェクト
 * 
 * @type {Object} CarouselState
 * @property {number} width - 移動量
 * @property {number} index - 先頭のインデックス
 * @property {number} total - 子の数
 * @property {(t: number) => number} easing - easing 関数
 */
export interface CarouselState {
	width : number
	index : number
	total : number
	easing: (t: number) => number
}

// ---------- ---------- ---------- ---------- ----------
// createRAFCarousel
// ---------- ---------- ---------- ---------- ----------
/**
 * subscription_RAFManager をベースにした Carousel アニメーション RAFTask を作成する
 * props は、基本的に RAFTask の値
 * 
 * @param {CarouselState} props.carouselState  - カルーセル情報
 */
export const createRAFCarousel = function <S> (
	props: {
		id      : string
		groupID?: string
		duration: number
		delay   : number

		finish?: (state: S, rafTask: RAFTask<S>) => S | [S, InternalEffect<S>]

		priority ?: number
		extension?: { [key: string]: any }

		carouselState: CarouselState
	}
): RAFTask<S> {
	const { id, groupID, duration, delay, priority, carouselState } = props
	const extension = {
		...props.extension,
		carouselState
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
			"transform": (progress: number) => `translateX(${ - carouselState.easing(progress) * carouselState.width }px)`
		}
	}]

	return createRAFProperties({
		id, groupID, duration, delay, finish, priority, extension,
		properties
	})
}

// ---------- ---------- ---------- ---------- ----------
// effect_carouselStart
// ---------- ---------- ---------- ---------- ----------
/**
 * subscription_RAFManager をベースにした Carousel アニメーションエフェクト
 */
export const effect_carouselStart = function <S> (
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

		// carouselState
		const carouselState: CarouselState = rafTask.extension?.carouselState
		if (!carouselState) return state

		// newTask
		const newTask = createRAFCarousel({
			id, groupID, duration, delay, finish, priority, extension,
			carouselState: {
				index : carouselState.index + 1 < children.length ? carouselState.index + 1 : 0,
				total : children.length,
				width : width,
				easing: carouselState.easing
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
		const newTask = createRAFCarousel({
			id, groupID, duration, delay, finish, priority, extension,
			carouselState: {
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
// effect_carouselRollback
// ---------- ---------- ---------- ---------- ----------
/**
 * アニメーション中のカルーセルを、元の位置に戻す
 */
export const effect_carouselRollback = function <S> (
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
			const param = task.extension?.carouselState
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
				duration: 300,
				action: (state: S, rafTask: RAFTask<S>): S | [S, InternalEffect<S>] => {
					const val = - width + param.easing(rafTask.progress) * width
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
