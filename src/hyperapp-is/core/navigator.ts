// ---------- ---------- ---------- ---------- ----------
// import
// ---------- ---------- ---------- ---------- ----------

import { VNode, Dispatch } from "hyperapp"
import { getValue, setValue, getLocalState, setLocalState } from "./state"
import { el, deleteKeys, getClassList } from "./component"

// ---------- ---------- ---------- ---------- ----------
// interface NavigatorItem
// ---------- ---------- ---------- ---------- ----------

export interface NavigatorItem {
	name       : string
	parent    ?: NavigatorItem
	children  ?: NavigatorItem[]
	properties?: {
		[key: string]: any
	}
}

// ---------- ---------- ---------- ---------- ----------
// interface NavigatorJson
// ---------- ---------- ---------- ---------- ----------

export interface NavigatorJson {
	name       : string
	properties?: { [key: string]: any }
	children  ?: NavigatorJson[]
}

// ---------- ---------- ---------- ---------- ----------
// jsonToNavigatorItem
// ---------- ---------- ---------- ---------- ----------

export const jsonToNavigatorItem = (jsonData: NavigatorJson): NavigatorItem => {
	const result: NavigatorItem = {
		name: jsonData.name
	}

	if (jsonData.properties) {
		result.properties = { ...jsonData.properties }
	}

	if (jsonData.children) {
		result.children = jsonData.children.map((child: NavigatorJson) => {
			const obj = jsonToNavigatorItem(child)
			obj.parent = result
			return obj
		})
	}

	return result
}

// ---------- ---------- ---------- ---------- ----------
// navigatorItemToJson
// ---------- ---------- ---------- ---------- ----------

export const navigatorItemToJson = (item: NavigatorItem): NavigatorJson => {
	const result: NavigatorJson = {
		name      : item.name,
		properties: item.properties ? { ...item.properties } : undefined
	}
	result.children = item.children?.map(child => navigatorItemToJson(child))

	return result
}
