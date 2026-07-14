// ---------- ---------- ---------- ---------- ----------
// exports
// ---------- ---------- ---------- ---------- ----------

export type { ScrollMargin }

export { getScrollMargin }

// ---------- ---------- ---------- ---------- ----------
// implementation
// ---------- ---------- ---------- ---------- ----------
/**
 * スクロールマージンを管理する
 */
interface ScrollMargin {
	top   : number
	left  : number
	right : number
	bottom: number
}

// ---------- ---------- ---------- ---------- ----------
/**
 * スクロールマージンを取得する
 */
const getScrollMargin = function (e: Event): ScrollMargin {
	const el = e.currentTarget as HTMLElement
	if (!el) return { top: 0, left: 0, right: 0, bottom: 0 }

	return {
		top   : el.scrollTop,
		left  : el.scrollLeft,
		right : el.scrollWidth - (el.clientWidth + el.scrollLeft),
		bottom: el.scrollHeight - (el.clientHeight + el.scrollTop)
	}
}
