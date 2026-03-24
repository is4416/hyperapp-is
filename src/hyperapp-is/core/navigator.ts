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
	name    : string
	val     : (item: NavigatorItem) => any
	text   ?: (item: NavigatorItem) => string
	compare?: (a: NavigatorItem, b: NavigatorItem) => number
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

	let properties: Record<string, any> = {}
	let hasProperties = false

	const children  : NavigatorItem[] = []

	getEntries(data, depth).forEach(entry => {
		const isProperty = typeof entry.data !== "object" || Array.isArray(entry.data)

		if (isProperty) {
			properties[entry.name] = entry.data
			hasProperties = true

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

	if (hasProperties) result.properties = properties
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

const div     = el("div")
const section = el("section")
const table   = el("table")
const thead   = el("thead")
const tbody   = el("tbody")
const tr      = el("tr")
const th      = el("th")
const td      = el("td")
const ol      = el("ol")
const ul      = el("ul")
const li      = el("li")
const button  = el("button")
const input   = el("input")
const span    = el("span")

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
		afterRender  ?: (props: {
			state     : S
			localState: Record<string, any>
		}, vnode: VNode<S>) => VNode<S>
		extension   ?: Record<string, any>
		[key: string]: any
	}
): VNode<S> {
	const {
		state,
		id,
		currentKeys,
		afterRender
	} = props
	const current = getValue(state, currentKeys, undefined) as NavigatorItem | undefined

	// localState
	const { searchText, selected, sortType, reverse, sortKey } = getLocalState(state, id, {
		searchText: "",        // 検索テキスト
		selected  : [],        // 選択されているボタン名
		sortType  : undefined, // ソート用比較関数
		reverse   : false,     // ソートを逆順にするか
		sortKey   : undefined  // 使用されているソート名 (column.name)
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
			name   : "name",
			val    : (item: NavigatorItem) => item.name,
			compare: (a: NavigatorItem, b: NavigatorItem) => {
				return a.name.localeCompare(b.name)
			}
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

	const hitTest = (text: unknown) => {
		if (typeof text !== "string") return false

		const S = searchText.trim().toLowerCase()
		if (S === "") return false

		const keys: string[] = S.replace(/[ 　]+/g, " ").split(" ").filter(Boolean)
		if (keys.length === 0) return false

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
				return columns.some(col => hitTest(
					col.text ? col.text(child) : col.val(child)
				))
			})
			: item.children

		return result
	} // end getItems

	// items
	const items = getItems(current)

	// sort
	if (sortType) {
		items.sort(sortType)
		if (reverse) items.reverse()
	}

	// items count
	const count = current
		? (current as NavigatorItem).children?.length
		: 0

	// items hitCount
	const hitCount = isFilter
		? items.length
		: items.filter(item => columns.some(col => hitTest(
			col.text ? col.text(item) : col.val(item)
		))).length

	// message
	const message = `hit items = ${ hitCount } / ${ count }`

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
		if (!children || children.length === 0) return state

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
	// action_sort
	// ---------- ---------- ----------

	const action_sort = (state: S, column: NavigatorColumn) => {
		if (column.compare === undefined) return state

		return setLocalState(state, id, {
			sortType: column.compare,
			reverse : sortKey === column.name ? !reverse : false,
			sortKey : column.name
		})
	} // end action_sort

	// ---------- ---------- ----------
	// VNode
	// ---------- ---------- ----------

	const vnode: VNode<S> = div({
		...deleteKeys(
			props,
			"state",
			"currentKeys",
			"columns",
			"afterRender"
		)
	},
		div({
			class: "main"
		},
			section({},
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
				),

				div({
					class: "parentItems"
				},
					ol({},
						parentItems.map(parent => li({
							key    : parent.path,
							onclick: [action_parentClick, parent]
						}, parent.name))
					),
					button({
						type   : "button",
						title  : "現在のフォルダパスを、クリップボードにコピー",
						onclick: action_copyFolderPath
					}, "COPY")
				),

				div({
					class: "items"
				},
					table({},
						thead({},
							tr({},
								columns.map(col => th({
									class  : col.compare ? "sort" : "",
									onclick: [action_sort, col]
								},
									col.name + (sortKey === col.name
										? (reverse ? " ▼" : " ▲")
										: ""
									)
								))
							)
						),

						tbody({},
							items.map(item => tr({
								key    : item.path,
								class  : item.children === undefined
									? "file"
									: "directory",
								onclick: item.children === undefined
									? undefined
									: [action_itemClick, item]
							},
								columns.map(col => {
									const v = col.val(item)
									const t = col.text ? col.text(item) : typeof v === "string" ? v : ""
									return td({
										title: t
									},
										span({
											class: hitTest(t) ? "hit" : ""
										},
											v
										)
									)
								})
							))
						)
					)
				)
			)
		),

		// statusBar
		div({ class: "statusBar" }, message)
	)

	// ---------- ---------- ----------
	// afterRender
	// ---------- ---------- ----------

	return afterRender ? afterRender({
		state,
		localState: {
			searchText,
			selected,
			sortType,
			reverse,
			sortKey
		}
	}, vnode) : vnode
}
