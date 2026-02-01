import { Dispatch } from "hyperapp";
import { getValue, setValue } from "../core/state"
import { InternalEffect, RAFTask } from "./raf";
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
 */
export interface CarouselState {
	width: number
	index: number
	total: number
}

// ---------- ---------- ---------- ---------- ----------
// createRAFCarousel
// ---------- ---------- ---------- ---------- ----------
/**
 * subscription_RAFManager をベースにした Carousel アニメーション RAFTask を作成する
 * props は、基本的に RAFTask の値
 * 
 * @param {(t: number) => string} props.easing - easing 関数
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

		easing ?: (t: number) => number
		carouselState: CarouselState
	}
): RAFTask<S> {
	const { id, groupID, duration, delay, priority, easing = (t: number) => t, carouselState } = props
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
			"transform": (progress: number) => `translateX(${ - easing(progress) * carouselState.width }px)`
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
	const { id, groupID, duration, delay, priority, extension, easing, keyNames } = props

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
			id, groupID, duration, delay, finish, priority, extension, easing,
			carouselState: {
				index: carouselState.index + 1 < children.length ? carouselState.index + 1 : 0,
				total: children.length,
				width: width
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
			id, groupID, duration, delay, finish, priority, extension, easing,
			carouselState: {
				index: 0,
				total: children.length,
				width: width 
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
