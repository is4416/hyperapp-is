// hyperapp-is / dom / utils.ts

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
