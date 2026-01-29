// hyperapp-ui / dom / utils.ts

// ---------- ---------- ---------- ---------- ----------
// interface ScrollMargin
// ---------- ---------- ---------- ---------- ----------
/**
 * スクロールの余白
 * 
 * @type {Object} ScrollMargin
 * @property {number} top    - 上までの余白
 * @property {number} left   - 左までの余白
 * @property {number} right  - 右までの余白
 * @property {number} bottom - 下までの余白
 */
export interface ScrollMargin {
	top   : number
	left  : number
	right : number
	bottom: number
}

// ---------- ---------- ---------- ---------- ----------
// getScrollMargin
// ---------- ---------- ---------- ---------- ----------
/**
 * スクロールの余白を取得する
 * 
 * @param   {Event} e - イベント
 * @returns {ScrollMargin}
 */
export const getScrollMargin = function (e: Event): ScrollMargin {
	const el = e.currentTarget as HTMLElement
	if (!el) return { top: 0, left: 0, right: 0, bottom: 0 }

	return {
		top   : el.scrollTop,
		left  : el.scrollLeft,
		right : el.scrollWidth - (el.clientWidth + el.scrollLeft),
		bottom: el.scrollHeight - (el.clientHeight + el.scrollTop)
	}
}

// ---------- ---------- ---------- ---------- ----------
// interface MatorixState
// ---------- ---------- ---------- ---------- ----------
/**
 * transform 情報
 */
export interface MatrixState {
	translate: {
		x: number
		y: number
		z: number
	}

	scale: {
		x: number
		y: number
		z: number
	}

	// radian
	rotate: {
		x: number
		y: number
		z: number
	}
}

// ---------- ---------- ---------- ---------- ----------
// getMatrixState
// ---------- ---------- ---------- ---------- ----------
/**
 * DOM から transfrom 情報を取得する
 * 
 * @param {HTMLElement} dom - 情報を取得する DOM
 * @returns {MatrixState}
 */
export const getMatrixState = (dom: HTMLElement): MatrixState | null => {
	const style     = getComputedStyle(dom)
	const transform = style.transform
	if (!transform || transform === 'none') return null

	let m: DOMMatrix
	try {
		m = new DOMMatrix(transform)
	} catch {
		return null
	}

	const scaleX = Math.hypot(m.m11, m.m12, m.m13)
	const scaleY = Math.hypot(m.m21, m.m22, m.m23)
	const scaleZ = Math.hypot(m.m31, m.m32, m.m33)

	let rotateX = 0
	let rotateY = 0
	let rotateZ = 0

	if (scaleX && scaleY && scaleZ) {
		rotateY = Math.asin(-m.m13 / scaleZ)

		const EPS = 1e-8
		if (Math.cos(rotateY) > EPS) {
			rotateX = Math.atan2(m.m23 / scaleZ, m.m33 / scaleZ)
			rotateZ = Math.atan2(m.m12 / scaleY, m.m11 / scaleX)
		}
	}

	return {
		translate: {
			x: m.m41,
			y: m.m42,
			z: m.m43
		},

		scale: {
			x: scaleX,
			y: scaleY,
			z: scaleZ
		},

		// radian
		rotate: {
			x: rotateX,
			y: rotateY,
			z: rotateZ
		}
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
 * @param {number}                 props.interval - 待機時間 (ms)
 * @param {(t: number) => number} [props.easing]  - easing 関数
 * @returns {{start: () => void, stop: () => void}}
 */
export const marquee = function <S> (
	props: {
		element : HTMLElement
		duration: number
		interval: number
		easing ?: (t: number) => number
	}
): { start: () => void, stop : () => void } {
	const { element, duration, interval, easing = (t: number) => t } = props

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
		}, interval)
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