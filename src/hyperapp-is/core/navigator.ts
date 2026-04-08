// hyperapp-is / core / navigator.ts

// ---------- ---------- ---------- ---------- ----------
// import
// ---------- ---------- ---------- ---------- ----------

import { VNode, Effect } from "hyperapp"
import {
	Keys_NavigatorItem,
	getValue, setValue, getLocalState, setLocalState,
	createLocalKey,
} from "./state"
import {
	ScrollMargin, getScrollMargin
} from "../dom/utils"
import { el, deleteKeys, SelectButton } from "./component"
import { ServerHotChannel } from "vite"

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

const div    = el("div")
const table  = el("table")
const thead  = el("thead")
const tbody  = el("tbody")
const tr     = el("tr")
const th     = el("th")
const td     = el("td")
const ol     = el("ol")
const ul     = el("ul")
const li     = el("li")
const button = el("button")
const input  = el("input")
const span   = el("span")
const svg    = el("svg")
const rect   = el("rect")
const path   = el("path")

// ---------- ---------- ---------- ---------- ----------
// NavigatorFinder Component
// ---------- ---------- ---------- ---------- ----------

/**
 * ファインダー
 * 
 * - 必須項目
 * state, id, currentKeys
 * 
 * - 拡張項目
 * columns, plugIn, afterRender
 * 
 * - columns
 * カラムの表示設定
 * 
 * - plugIn
 * プラグインの追加
 * 
 * - afterRender
 * レンダーフック
 */

export const NavigatorFinder = function <S> (
	props: {
		state            : S
		id               : string
		currentKeys      : Keys_NavigatorItem
		columns         ?: (directory: NavigatorItem | undefined) => NavigatorColumn[]
		plugIn          ?: (state: S, localState: Record<string, any>) => VNode<S>[]
		toolBarNode     ?: (state: S, localState: Record<string, any>, vnode: VNode<S>) => VNode<S>
		parentItemsNode ?: (state: S, localState: Record<string, any>, vnode: VNode<S>) => VNode<S>
		statusBarNode   ?: (state: S, localState: Record<string, any>, vnode: VNode<S>) => VNode<S>
		afterRender     ?: (state: S, localState: Record<string, any>, vnode: VNode<S>) => VNode<S>
		[key: string]: any
	}
): VNode<S> {
	const {
		state,
		id,
		currentKeys,
		plugIn,
		afterRender
	} = props

	// current
	const current = getValue(state, currentKeys, undefined) as NavigatorItem | undefined

	// localState
	const localState = getLocalState(state, id, {
		searchText: "" as string,                   // 検索テキスト
		selected  : [] as string[],                 // 選択されているボタン名
		sortType  : undefined,                      // ソート用比較関数: (a: NavigatorItem, b: NavigatorItem) => number
		reverse   : false as boolean,               // ソートを逆順にするか
		sortKey   : undefined as undefined | string // 使用されているソート名 (column.name)
	})

	// selected filter
	const isFilter = localState.selected.includes(`${ createLocalKey(id) }_filter`)

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

		const S = localState.searchText.trim().toLowerCase()
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
		const result = isFilter && localState.searchText !== ""
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
	if (localState.sortType) {
		items.sort(localState.sortType)
		if (localState.reverse) items.reverse()
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
			reverse : localState.sortKey === column.name ? !localState.reverse : false,
			sortKey : column.name
		})
	} // end action_sort

	// ---------- ---------- ----------
	// VNode
	// ---------- ---------- ----------

	// toolBarNode
	const toolBarNode = div({
		class: "toolBar"
	},
		input({
			type       : "text",
			placeholder: "search keys",
			value      : localState.searchText,
			oninput    : action_inputSearchText
		}),

		button({
			type   : "button",
			title  : "delete keys",
			onclick: (state: S) => {
				return setLocalState(state, id, {
					searchText: ""
				})
			}
		}, icon_trashBox),

		SelectButton({
			state   : state,
			id      : `${ createLocalKey(id) }_filter`,
			keyNames: [createLocalKey(id), "selected"],
			title   : "filter"
		}, icon_filter),
	)

	// parentItemsNode
	const parentItemsNode = div({
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
			title  : "copy",
			onclick: action_copyFolderPath
		}, icon_copy)
	)

	// itemsNode
	const itemsNode = div({
		class: "items"
	},
		table({},
			thead({},
				tr({},
					columns.map(col => th({
						class  : col.compare ? "sort" : "",
						onclick: [action_sort, col]
					},
						col.name + (localState.sortKey === col.name
							? (localState.reverse ? " ▼" : " ▲")
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

	// statusBarNode
	const statusBarNode = div({ class: "statusBar" }, message)

	// vnode
	const vnode: VNode<S> = div({
		...deleteKeys(
			props,
			"state",
			"currentKeys",
			"columns",
			"plugIn",
			"toolBarNode",
			"parentItemsNode",
			"statusBarNode",
			"afterRender"
		)
	},
		div({
			class: "rapper"
		},
			props.toolBarNode ? props.toolBarNode(state, localState, toolBarNode) : toolBarNode,
			props.parentItemsNode ? props.parentItemsNode(state, localState, parentItemsNode) : parentItemsNode,
			itemsNode,
			props.statusBarNode ? props.statuBarNode(state, localState, statusBarNode) : statusBarNode
		),

		// plugIn
		plugIn
			? plugIn(state, localState)
			: []
	)

	// ---------- ---------- ----------
	// afterRender
	// ---------- ---------- ----------

	return afterRender ? afterRender(state, localState, vnode) : vnode
}

// ---------- ---------- ---------- ---------- ----------
// svg icon
// ---------- ---------- ---------- ---------- ----------

// icon_depth
const icon_depth = svg({
	width         : 24,
	height        : 24,
	viewBox       : "0 0 24 24",
	fill          : "none",
	stroke        : "currentColor",
	strokeWidth   : 2,
	strokeLinecap : "round",
	strokeLinejoin: "round"
},
	rect({
		x     : 9,
		y     : 3,
		width : 6,
		height: 4,
		rx    : 1
	}),

	rect({
		x     : 3,
		y     : 15,
		width : 6,
		height: 4,
		rx    : 1
	}),

	rect({
		x     : 15,
		y     : 15,
		width : 6,
		height: 4,
		rx    : 1
	}),

	path({
		d: "M12 7v4"
	}),
	path({
		d: "M6 15v-4h12v4"
	})
)

// icon_name
const icon_name = svg({
	width         : 24,
	height        : 24,
	viewBox       : "0 0 24 24",
	fill          : "none",
	stroke        : "currentColor",
	strokeWidth   : 2,
	strokeLinecap : "round",
	strokeLinejoin: "round"
},
	path({ d: "M4 18l2-8 2 8M5 14h2" }),

	path({ d: "M10 10h6l-6 8h6" }),

	path({ d: "M20 6v12" }),
	path({ d: "M17 15l3 3 3-3" })
)

// icon_directory
const icon_directory = svg({
	width         : 24,
	height        : 24,
	viewBox       : "0 0 24 24",
	fill          : "none",
	stroke        : "currentColor",
	strokeWidth   : 2,
	strokeLinecap : "round",
	strokeLinejoin: "round"
},
	path({ d: "M3 7h6l2 2h10v8a2 2 0 0 1-2 2H3z" })
)

// icon_file
const icon_file = svg({
	width         : 24,
	height        : 24,
	viewBox       : "0 0 24 24",
	fill          : "none",
	stroke        : "currentColor",
	strokeWidth   : 2,
	strokeLinecap : "round",
	strokeLinejoin: "round"
},
	path({ d: "M6 2h9l5 5v15a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" }),

	path({ d: "M14 2v6h6" })
)

// icon_trashBox
const icon_trashBox = svg({
	viewBox       : "0 0 24 24",
	width         : 24,
	height        : 24,
	fill          : "none",
	stroke        : "currentColor",
	strokeWidth   : 2,
	strokeLinecap : "round",
	strokeLinejoin: "round"
},
	path({ d: "M3 6h18" }),
	path({ d: "M8 6V4h8v2" }),
	path({ d: "M6 6l1 14h10l1-14" }),
	path({ d: "M10 11v6" }),
	path({ d: "M14 11v6" })
)

// icon_filter
const icon_filter = svg({
	viewBox       : "0 0 24 24",
	width         : 24,
	height        : 24,
	fill          : "none",
	stroke        : "currentColor",
	strokeWidth   : 2,
	strokeLinecap : "round",
	strokeLinejoin: "round"
},
	path({ d: "M3 5h18" }),
	path({ d: "M6 12h12" }),
	path({ d: "M10 19h4" })
)

// icon_copy
const icon_copy = svg({
	viewBox       : "0 0 24 24",
	width         : 24,
	height        : 24,
	fill          : "none",
	stroke        : "currentColor",
	strokeWidth   : 2,
	strokeLinecap : "round",
	strokeLinejoin: "round"
},
	path({ d: "M9 9h11v11H9z" }),
	path({ d: "M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" })
)

// ---------- ---------- ---------- ---------- ----------
// interface SearchResult
// ---------- ---------- ---------- ---------- ----------

/**
 * 検索結果
 * 
 * - item
 * ヒットしたアイテム
 * 
 * - depth
 * current からの深度
 */

export interface SearchResult {
	item : NavigatorItem
	depth: number
}

// ---------- ---------- ---------- ---------- ----------
// NavigatorSearch Component (NavigatorFinder plugIn)
// ---------- ---------- ---------- ---------- ----------

/**
 * ファイルサーチ - NavigatorFinder プラグイン
 * 
 * - 必須項目
 * state, id, currentKeys, searchResult, hitTest, maxItemsCount
 * 
 * - searchResult
 * カードとして表示するVNode
 * 
 * - hitTest
 * 抽出条件
 * 
 * - maxItemsCount
 * 最初に表示させるカードの最大数
 * 
 * - 拡張項目
 * afterRender
 * 
 * - afterRender
 * レンダーフック
 */
export const NavigatorSearch = function <S> (
	props: {
		state           : S
		id              : string
		currentKeys     : Keys_NavigatorItem
		searchResult    : (item: NavigatorItem, depth: number) => VNode<S> | VNode<S>[]
		hitTest         : (item: NavigatorItem) => boolean
		maxItemsCount   : number
		toolBarNode    ?: (state: S, localState: Record<string, any>, vnode: VNode<S>) => VNode<S>
		parentItemsNode?: (state: S, localState: Record<string, any>, vnode: VNode<S>) => VNode<S>
		statusBarNode  ?: (state: S, localState: Record<string, any>, vnode: VNode<S>) => VNode<S>
		afterRender    ?: (state: S, localState: Record<string, any>, vnode: VNode<S>) => VNode<S>
		[key: string]   : any
	}
): VNode<S> {
	const {
		state,
		id,
		currentKeys,
		searchResult,
		hitTest,
		afterRender
	} = props

	// localKey
	const localKey = createLocalKey(id)

	// localState
	const localState = getLocalState(state, id, {
		maxItemsCount: props.maxItemsCount as number,                                             // カードの最大表示数
		sortName     : undefined as undefined | string,                                           // ソート名
		sortFn       : undefined as undefined | ((a: SearchResult, b: SearchResult) => number),   // 比較関数
		isDirectory  : true, // ディレクトリを表示
		isFile       : true  // ファイルを表示
	})

	// current
	const current = getValue(state, currentKeys, undefined) as NavigatorItem | undefined

	// ---------- ---------- ----------
	// searchItems
	// ---------- ---------- ----------

	/**
	 * アイテムの検索
	 * 検索アイテムのフラット化をしていないので、速度によっては拡張を検討
	 */

	const searchItems = (item: NavigatorItem, depth: number): SearchResult[] => {
		if (!item) return []
		const result: SearchResult[] = []

		if (hitTest(item)) result.push({ item, depth })

		if (item.children && item.children.length !== 0) {
			item.children.forEach(child => {
				const r = searchItems(child, depth + 1)
				if (r.length !== 0) result.push(...r)
			})
		}

		return result
	} // end searchItems

	// get items
	const items = current
		? searchItems(current, 0)
		: []

	// sort
	if (localState.sortFn !== undefined) items.sort(localState.sortFn)

	// drawItems (filter, maxItemsCount の適用)
	const drawItems = items.filter(item => {
		return item.item.children
			? localState.isDirectory
			: localState.isFile
	}).slice(0, localState.maxItemsCount)

	// get parentItems
	const parentItems = current
		? getParentItems(current).concat(current)
		: []

	// message
	const message = `hit ${ items.length } items`

	// ---------- ---------- ----------
	// action_itemsScroll
	// ---------- ---------- ----------

	/**
	 * items のスクロール状況で、maxItemsCount を追加
	 */

	const action_itemsScroll = (state: S, e: Event) => {
		const margin: ScrollMargin = getScrollMargin(e)

		return setLocalState(state, id, {
			maxItemsCount: margin.bottom < 10
				? localState.maxItemsCount + 10 < items.length
					? localState.maxItemsCount + 10
					: Math.max(10, items.length)
				: localState.maxItemsCount
		})
	}

	// ---------- ---------- ----------
	// action_setSort
	// ---------- ---------- ----------

	/**
	 * 仕様するソート名をセット
	 * sortFn をステートに持つように変更する場合、ここも修正
	 */

	const action_setSort = (state: S, newSortName: string) => {
		const reverse = localState.sortName === newSortName

		const obj: Record<string, any> = {
			"depth"  : (a: SearchResult, b: SearchResult) => a.depth - b.depth,
			"name"   : (a: SearchResult, b: SearchResult) => {
				if (a.item.name === b.item.name) return 0
				return a.item.name < b.item.name ? - 1 : 1
			}
		}

		const fn = obj[newSortName] !== undefined
			? reverse
				? (a: SearchResult, b: SearchResult) => obj[newSortName](b, a)
				: (a: SearchResult, b: SearchResult) => obj[newSortName](a, b)
			: (a: SearchResult, b: SearchResult) => {
				return a.depth === b.depth
					? obj["name"](a, b)
					: obj["depth"](a, b)
			}

		return setLocalState(state, id, {
			sortName: reverse ? `r_${ newSortName }` : newSortName,
			sortFn  : fn
		})
	}

	// ---------- ---------- ----------
	// vnode
	// ---------- ---------- ----------

	const toolBarNode = div({
		class: "toolBar"
	},
		// sort
		button({
			type   : "button",
			title  : "sort depth",
			onclick: [action_setSort, "depth"]
		}, icon_depth),

		button({
			type   : "button",
			title  : "sort name",
			onclick: [action_setSort, "name"]
		}, icon_name),

		// filter
		button({
			type   : "button",
			class  : localState.isDirectory ? "" : "ignore",
			title  : "directory",
			onclick: (state: S) => setLocalState(state, id, {
				isDirectory: !localState.isDirectory
			})
		}, icon_directory),

		button({
			type   : "button",
			class  : localState.isFile ? "" : "ignore",
			title  : "file",
			onclick: (state: S) => setLocalState(state, id, {
				isFile: !localState.isFile
			})
		}, icon_file)
	)

	// parentItemsNode
	const parentItemsNode = div({
		class: "parentItems"
	},
		ol({},
			parentItems.map(item => li({
				onclick: (state: S) => setValue(state, currentKeys, item)
			}, item.name))
		)
	)

	// itemsNode
	const itemsNode = div({
		class   : "items",
		onscroll: action_itemsScroll
	},
		ul({},
			drawItems.map(item => li({
				class: "item",
				key  : item.item.path,
				title: item.item.path
			}, searchResult(item.item, item.depth)))
		)
	)

	// statusBarNode
	const statusBarNode = div({
		class: "statusBar"
	}, message)

	// vnode
	const vnode = div({
		...deleteKeys(
			props,
			"state",
			"currentKeys",
			"searchResult",
			"hitTest",
			"maxItemsCount",
			"toolBarNode",
			"parentItemsNode",
			"statusBarNode",
			"afterRender"
		)
	},
		props.toolBarNode ? props.toolBarNode(state, localState, toolBarNode) : toolBarNode,
		props.parentItemsNode ? props.parentItemsNode(state, localState, parentItemsNode) : parentItemsNode,
		itemsNode,
		props.statusBarNode ? props.statusBarNode(state, localState, statusBarNode) : statusBarNode
	)

	// ---------- ---------- ----------
	// afterRender
	// ---------- ---------- ----------

	return afterRender ? afterRender(state, localState, vnode): vnode
}
