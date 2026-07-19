// ---------- ---------- ---------- ---------- ----------
// exports
// ---------- ---------- ---------- ---------- ----------

export type { ScrollMargin }

export {
	d, css,
	getScrollMargin
}

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
 * DOM 作成用のラッパー
 */
const d = (
	parent      : HTMLElement | null,
	tag         : string,
	properties ?: Record<string,      string>,
	...children : any[]
): HTMLElement => {
	const result = document.createElement(tag)

	Object.entries(properties ?? {}).forEach(([key, val]) =>
		result.setAttribute(key, val)
	)

	children.forEach(child => {
		if (child == null) return
		child instanceof Node
			? result.appendChild(child)
			: result.appendChild(document.createTextNode(`${ child }`))
	})

	if (parent) parent.appendChild(result)

	return result
}

// ---------- ---------- ---------- ---------- ----------
/**
 * DOM へ style を設定するラッパー
 */
const css = (
	element: HTMLElement,
	styles : Partial<CSSStyleDeclaration>
): HTMLElement => {
	Object.assign(element.style, styles)
	return element
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
