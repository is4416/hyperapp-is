// hyperapp-is / core / navigator.ts

// ---------- ---------- ---------- ---------- ----------
// import
// ---------- ---------- ---------- ---------- ----------

import { VNode, Effect } from "hyperapp"
import {
	Keys_NavigatorItem,
	getValue, setValue, getLocalState, setLocalState,
	createLocalKey
} from "./state"
import { el, deleteKeys, SelectButton } from "./component"

// ---------- ---------- ---------- ---------- ----------
// interface NavigatorItem
// ---------- ---------- ---------- ---------- ----------

export interface NavigatorItem {
	parent     : NavigatorItem | null
	name       : string
	path       : string
	properties?: Record<string, any>
	children  ?: NavigatorItem[]
	extension ?: Record<string, any>
}

// ---------- ---------- ---------- ---------- ----------
// interface JsonEntry
// ---------- ---------- ---------- ---------- ----------

export interface JsonEntry <D> {
	name  : string
	data  : D
	isNode: boolean
}

// ---------- ---------- ---------- ---------- ----------
// interface NavigatorColumn
// ---------- ---------- ---------- ---------- ----------

export interface NavigatorColumn {
	name: string
	val : (item: NavigatorItem) => any
}

// ---------- ---------- ---------- ---------- ----------
// convertJsonToNavigatorItem
// ---------- ---------- ---------- ---------- ----------

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

	if (extension) {
		const ext = extension(result, data, depth)
		if (ext) result.extension = ext
	}

	const properties: Record<string, any> = {}
	let hasProperty = false

	const children  : NavigatorItem[] = []

	getEntries(data, depth).forEach(entry => {
		const isProperty = typeof entry.data !== "object" || Array.isArray(entry.data)

		if (isProperty) {
			properties[entry.name] = entry.data
			hasProperty = true

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
	if (isNode) result.children = children

	return result
}

// ---------- ---------- ---------- ---------- ----------
// getParentItems
// ---------- ---------- ---------- ---------- ----------

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
// vnodes
// ---------- ---------- ---------- ---------- ----------

const div    = el("div")
const table  = el("table")
const thead  = el("thead")
const tbody  = el("tbody")
const tr     = el("tr")
const th     = el("th")
const td     = el("td")
const ol     = el("ol")
const li     = el("li")
const button = el("button")
const input  = el("input")
const span   = el("span")

// ---------- ---------- ---------- ---------- ----------
// NavigatorFinder Component
// ---------- ---------- ---------- ---------- ----------

/**
 * ファインダー
 * 
 * - 必須項目
 * state, id, currentKeys
 * 
 * - columns
 * カラムの表示設定
 * 
 * - maxItemsCount
 * 最大表示させるアイテム数
 * 
 * - itemClick
 * 非ノードをクリックした際のアクション
 * 
 * - afterRender
 * レンダーフック
 * 
 * - extension
 * レンダーフックで参照できる拡張情報
 */

export const NavigatorFinder = function <S> (
	props: {
		state         : S
		id            : string
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
		id,
		currentKeys,
		maxItemsCount = 0,
		itemClick,
		afterRender,
		extension
	} = props
	const current = getValue(state, currentKeys, undefined) as NavigatorItem | undefined

	// localState
	const { searchText, selected } = getLocalState(state, id, {
		searchText: "",
		selected  : []
	})

	// selected filter
	const isFilter = selected.includes(`${ createLocalKey(id) }_filter`)

	// ---------- ---------- ----------
	// createColumns
	// ---------- ---------- ----------

	const createColumns = props.columns ?? ((directory: NavigatorItem | undefined) => {
		const result: NavigatorColumn[] = []

		if (!directory) return result

		result.push({
			name: "name",
			val : (item: NavigatorItem) => item.name
		})

		const children = directory.children

		if (children) {
			const names: string[] = []
			// 子アイテムのプロパティをすべて抽出
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

	// columns
	const columns = createColumns(current)

	// parentItems
	const parentItems = getParentItems(current)
	if (current) parentItems.push(current)

	// ---------- ---------- ----------
	// hitTest
	// ---------- ---------- ----------

	const hitTest = (text: string) => {
		const S = searchText.trim().toLowerCase()
		if (S === "") return false

		const keys: string[] = S.replace(/[ 　]+/g, " ").split(" ").filter(Boolean)
		if (keys.length === 0) return false

		if (typeof text !== "string") return false

		const sText = text.toLowerCase()
		return keys.every(key => sText.includes(key))
	} // end hitTest

	// ---------- ---------- ----------
	// getItems
	// ---------- ---------- ----------

	const getItems = (item: NavigatorItem | undefined): NavigatorItem[] => {
		if (!item || item.children === undefined) return []

		// filter
		const result = isFilter && searchText !== ""
			? item.children.filter(child => {
				return columns.some(col => hitTest(col.val(child)))
			})
			: item.children

		// maxCount
		const count = maxItemsCount === 0
			? result.length
			: Math.min(maxItemsCount, result.length)

		return result.slice(0, count)
	} // end getItems

	// items
	const items = getItems(current)

	// items count
	const count = current
		? (current as NavigatorItem).children?.length
		: 0

	// items hitCount
	const hitCount = isFilter
		? items.length
		: items.filter(item => columns.some(col => hitTest(col.val(item)))).length

	// ---------- ---------- ----------
	// action_parentClick
	// ---------- ---------- ----------

	const action_parentClick = (state: S, item: NavigatorItem) => {
		return setLocalState(
			setValue(state, currentKeys, item),
			id,
			{
				selected: []
			}
		)
	}
	
	// ---------- ---------- ----------
	// action_itemClick
	// ---------- ---------- ----------

	const action_itemClick = (state: S, item: NavigatorItem) => {

		// 子アイテムがすべてプロパティのときは移動しない
		const children = item.children
		if (!children) return state

		if (
			!children.some(child => typeof child === "object" && !Array.isArray(child))
		) return state

		// filterは解除
		return setLocalState(
			setValue(state, currentKeys, item),
			id,
			{
				selected: []
			}
		)
	}

	// ---------- ---------- ----------
	// action_inputSearchText
	// ---------- ---------- ----------

	const action_inputSearchText = (state: S, e: Event) => {
		const input = e.currentTarget as HTMLInputElement
		if (!input) return state

		return setLocalState(state, id, {
			searchText: input.value
		})
	} // end action_inputSearchText

	// ---------- ---------- ----------
	// action_copyFolderPath
	// ---------- ---------- ----------

	const action_copyFolderPath = (state: S) => {
		if (!current) return state
		navigator.clipboard.writeText(current.path)
		return state
	} // end action_copyFolderPath

	// ---------- ---------- ----------
	// VNode
	// ---------- ---------- ----------

	const vnode: VNode<S> = div({
		...deleteKeys(props, "state", "currentKeys", "columns", "itemClick", "afterRender", "extension")
	},
		// toolBar
		div({
			class: "toolBar"
		},
			input({
				type       : "text",
				placeholder: "search keys",
				value      : searchText,
				oninput    : action_inputSearchText
			}),
			SelectButton({
				state   : state,
				id      : `${ createLocalKey(id) }_filter`,
				keyNames: [createLocalKey(id), "selected"]
			}, "FILTER"),
			button({
				type   : "button",
				title  : "現在のフォルダパスを、クリップボードにコピー",
				onclick: action_copyFolderPath
			}, "COPY")
		),

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
						span({
							class: hitTest(col.val(item)) ? "hit" : ""
						},
							col.val(item)
						)
					))
				))
			)
		),

		// statusBar
		div({
			class: "statusBar"
		}, `items ${ items.length } / ${ count }` + (searchText !== "" ? ` (${ hitCount } hit)` : ""))
	)

	// ---------- ---------- ----------
	// afterRender
	// ---------- ---------- ----------

	return afterRender ? afterRender({ state, current, extension }, vnode) : vnode
}
