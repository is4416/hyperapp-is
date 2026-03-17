// hyperapp-is / core / navigator.ts

import { VNode, Effect } from "hyperapp"
import {
	Keys_NavigatorItem,
	getValue, setValue
} from "./state"
import { el, deleteKeys } from "./component"

/* element */
const div    = el("div")
const table  = el("table")
const thead  = el("thead")
const tbody  = el("tbody")
const tr     = el("tr")
const th     = el("th")
const td     = el("td")
const ul     = el("ul")
const ol     = el("ol")
const li     = el("li")
const button = el("button")
const input  = el("input")
const span   = el("span")

// ---------- ---------- ---------- ---------- ----------
// interface NavigatorItem
// ---------- ---------- ---------- ---------- ----------
/**
 * ツリー構造となるナビゲーションオブジェクト
 * 
 * parent     - 親アイテム
 * name       - 名前
 * properties - プロパティオブジェクト
 * children   - 子アイテムリスト (undefinedのときはファイル)
 * path       - パス
 * extension  - 拡張情報
 */
export interface NavigatorItem {
	parent     : NavigatorItem | null
	name       : string
	properties?: Record<string, any>
	children  ?: NavigatorItem[]
	path       : string
	extension ?: Record<string, any>
}

// ---------- ---------- ---------- ---------- ----------
// interface JsonEntry
// ---------- ---------- ---------- ---------- ----------
/**
 * getEntriesで返すオブジェクト
 * 
 * name       - 名前
 * data       - データ
 * isNode     - ディレクトリか
 */
export interface JsonEntry <D> {
	name  : string
	data  : D
	isNode: boolean
}

// ---------- ---------- ---------- ---------- ----------
// interface NavigatorColumn
// ---------- ---------- ---------- ---------- ----------
/**
 * ヘッダー名と値
 */
export interface NavigatorColumn {
	name: string
	val : (item: NavigatorItem) => any
}

// ---------- ---------- ---------- ---------- ----------
// convertJsonToNavigatorItem
// ---------- ---------- ---------- ---------- ----------
/**
 * Json から NavigatorItem に変換
 * getEntries の採用により、JSON の形を問わない
 * extension により、任意情報を保存できる
 */

export const convertJsonToNavigatorItem = function <D> (
	props: {
		parent     : NavigatorItem | null
		name       : string
		data       : D
		getEntries : (data: D, depth: number) => JsonEntry<D>[]
		isNode     : boolean
		depth     ?: number
		extension ?: (item: NavigatorItem, data: D, depth: number) => Record<string, any> | undefined
	}
): NavigatorItem {
	const { parent, name, data, getEntries, isNode, depth = 0, extension } = props

	const result: NavigatorItem = {
		parent,
		name,
		path: parent ? parent.path + "/" + name : "/" + name
	}

	// 拡張情報
	if (extension) {
		const ext = extension(result, data, depth)
		if (ext) result.extension = ext
	}

	const properties: Record<string, any> = {}
	let hasProperty = false

	const children  : NavigatorItem[] = []

	getEntries(data, depth).forEach(entry => {
		const isProperty = typeof entry.data !== "object" || Array.isArray(entry.data)

		// プロパティ
		if (isProperty) {
			properties[entry.name] = entry.data
			hasProperty = true

		// 子アイテム
		} else {
			children.push(convertJsonToNavigatorItem({
				parent: result,
				name  : entry.name,
				data  : entry.data,
				getEntries,
				isNode: entry.isNode,
				depth : depth + 1,
				extension
			}))
		}
	})

	if (hasProperty) result.properties = properties
	if (isNode) result.children = children // ファイルのときは undefined

	return result
}

// ---------- ---------- ---------- ---------- ----------
// getParentItems
// ---------- ---------- ---------- ---------- ----------
/**
 * NavigatorItem の親をリストで取得する
 */
export const getParentItems = (item: NavigatorItem | undefined): NavigatorItem[] => {
	if (!item) return []

	const result: NavigatorItem[] = []

	let cd: NavigatorItem | null = item.parent
	while (cd) {
		result.push(cd)
		cd = cd.parent
	}

	return result.reverse()
}

// ---------- ---------- ---------- ---------- ----------
// NavigatorFinder Component
// ---------- ---------- ---------- ---------- ----------
/**
 * ナビゲーションファインダーコンポーネント
 */
export const NavigatorFinder = function <S> (
	props: {
		state         : S
		currentKeys   : Keys_NavigatorItem
		columns      ?: (directory: NavigatorItem | undefined) => NavigatorColumn[]
		maxItemsCount?: number
		itemClick    ?: (state: S, item: NavigatorItem) => S | [S, Effect<S>]
		afterRender  ?: (props: {
			state     : S
			current  ?: NavigatorItem
			extension?: Record<string, any>
		}, vnode: VNode<S>) => VNode<S>
		extension   ?: Record<string, any>
		[key: string]: any
	}
): VNode<S> {
	const {
		state,
		currentKeys,
		maxItemsCount = 0,
		itemClick,
		afterRender,
		extension
	} = props
	const current = getValue(state, currentKeys, undefined) as NavigatorItem | undefined

	// createColumns
	const createColumns = props.columns ?? ((directory: NavigatorItem | undefined) => {
		const result: NavigatorColumn[] = []

		if (!directory) return result

		result.push({
			name: "name",
			val : (item: NavigatorItem) => item.name
		})

		// get properties
		const children = directory.children

		if (children) {

			// get names
			const names: string[] = []

			// get properties
			// 子アイテムのプロパティをすべて確認して抽出しています
			children.forEach(child => {
				if (child.properties) {
					Object.keys(child.properties).forEach(key => names.push(key))
				}
			})

			// add NavigatorColumn
			Array.from(new Set(names)).forEach(name => {
				result.push({
					name,
					val: (item: NavigatorItem) => {
						const p = item.properties
						return p
							? p[name] ?? ""
							: ""
					}
				})
			})
		}

		return result
	}) // end createColumns

	const columns = createColumns(current)

	// parentItems
	const parentItems = getParentItems(current)
	if (current) parentItems.push(current)

	// getItems
	const getItems = (item: NavigatorItem | undefined): NavigatorItem[] => {
		if (!item || item.children === undefined) return []
		const count = maxItemsCount === 0
			? item.children.length
			: Math.min(maxItemsCount, item.children.length)
		return item.children.slice(0, count)
	} // end getItems

	// items
	const items = getItems(current)
	const count = current
		? (current as NavigatorItem).children?.length
		: 0
	
	// action_parentClick
	const action_parentClick = (state: S, item: NavigatorItem) => {
		return setValue(state, currentKeys, item)
	}
	
	// action_itemClick
	const action_itemClick = (state: S, item: NavigatorItem) => {

		// 子アイテムがすべてプロパティのときは移動しない
		const children = item.children
		if (!children) return state

		if (
			!children.some(child => typeof child === "object" && !Array.isArray(child))
		) return state

		return setValue(state, currentKeys, item)
	}

	// VNode
	const vnode: VNode<S> = div({
		...deleteKeys(props, "state", "currentKeys", "columns", "itemClick", "afterRender", "extension")
	},
		// toolBar
		div({
			class: "toolBar"
		}, "toolBar (未実装)"),

		// parentItems
		ol({},
			parentItems.map(parent => li({
				key    : parent.path,
				onclick: [action_parentClick, parent]
			}, parent.name))
		),

		// items
		table({},
			thead({},
				tr({},
					columns.map(col => th({}, col.name))
				)
			),

			tbody({},
				items.map(item => tr({
					key    : item.path,
					onclick: item.children === undefined
						? itemClick ? [itemClick, item] : undefined
						: [action_itemClick, item]
				},
					columns.map(col => td({
						title: col.val(item)
					},
						col.val(item)
					))
				))
			)
		),

		// statusBar
		div({
			class: "statusBar"
		}, `items ${ items.length } / ${ count }`)
	)

	// afterRender
	return afterRender ? afterRender({ state, current, extension }, vnode) : vnode
}