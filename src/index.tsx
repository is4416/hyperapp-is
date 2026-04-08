// index.tsx

// ---------- ---------- ---------- ---------- ----------
// import
// ---------- ---------- ---------- ---------- ----------

import { app, VNode, Dispatch, Effect } from "hyperapp"
import h from "hyperapp-jsx-pragma"
import {
	Keys_String, Keys_NavigatorItem, Keys_ArrayRAFTask,
	setValue,
	OptionButton, Route,
	RAFTask, subscription_RAFManager,
	Carousel, effect_InitCarousel, CarouselState,
	progress_easing,
	NavigatorFinder, NavigatorItem, convertJsonToNavigatorItem, JsonEntry,
	NavigatorColumn,
	NavigatorSearch
} from "./hyperapp-is"
import { InternalEffect } from "../dist/hyperapp-is"

// ---------- ---------- ---------- ---------- ----------
// State
// ---------- ---------- ---------- ---------- ----------

interface State {
	page    : string
	selected: string[]
	tasks   : RAFTask<State>[]
	carousel: {
		pageNumber: number
	},
	navigator: {
		finder_current: NavigatorItem | undefined
		search_current: NavigatorItem | undefined
	}
}

// ---------- ---------- ---------- ---------- ----------

const param: State = {
	page    : "0",
	selected: [],
	tasks   : [],
	carousel: {
		pageNumber: 0
	},
	navigator: {
		finder_current: undefined,
		search_current: undefined
	}
}

// ---------- ---------- ---------- ---------- ----------
// Entry Point
// ---------- ---------- ---------- ---------- ----------

addEventListener("load", () => {

	// ---------- ---------- ----------
	// variable
	// ---------- ---------- ----------

	const tasks: Keys_ArrayRAFTask             = ["tasks"]
	const page : Keys_String                   = ["page"]
	const navigator_finder: Keys_NavigatorItem = ["navigator", "finder_current"]
	const navigator_search: Keys_NavigatorItem = ["navigator", "search_current"]

	// ---------- ---------- ----------
	// action_initCarousel
	// ---------- ---------- ----------

	const action_initCarousel = (state: State) => {

		// init carousel1 state
		const param1: CarouselState<State> = {
			id  : "sample_carousel1",
			step: 1
		}

		// init carousel2 state
		const param2: CarouselState<State> = {
			id      : "sample_carousel2",
			step    : -1,
			duration: 3000,
			delay   : 500,
			easing  : progress_easing.easeOutBounce
		}

		// init carousel3 state
		const param3: CarouselState<State> = {
			id      : "sample_carousel3",
			step    : 1,
			duration: 2000,
			delay   : 0,
			finish  : (state: State, rafTask: RAFTask<State>): State | [State, InternalEffect<State>] => {
				const id = "sample_carousel3"

				const dom = document.getElementById(id) as HTMLElement
				if (!dom) return state

				const ul = dom.querySelector("ul") as HTMLUListElement
				if (!ul) return state

				const child = ul.firstChild as HTMLLIElement
				if (!child)	return state

				const pageNumber = Number(child.getAttribute("absoluteIndex"))

				if (pageNumber !== 0 && pageNumber !== 3) return state

				const newTask = rafTask.clone()
				const param: CarouselState<State> = newTask.extension?.carouselState
				if (!param) return state

				param.step = pageNumber === 0 ? 1 : -1

				return setValue(state, tasks, state.tasks
					.filter(task => task.id !== id)
					.concat(newTask)
				)
			}
		}

		// set effect
		return [
			state,
			effect_InitCarousel(tasks, param1),
			effect_InitCarousel(tasks, param2),
			effect_InitCarousel(tasks, param3)
		]
	}

	// ---------- ---------- ----------
	// action_initNavigator
	// ---------- ---------- ----------

	const action_initNavigator = (state: State) => {

		// loadJson
		const effect_loadJson = async (dispatch: Dispatch<State>) => {
			const json = await fetch("isYoshihiro.json").then(data => {
				if (!data.ok) throw new Error("error loadJson")
				return data.json()
			})

			// getEntries
			const getEntries = (data: Record<string, any>, depth: number) => {
				const result: JsonEntry<Record<string, any>>[] = []

				Object.keys(data).forEach(key => {
					const obj = data[key]
					const isNode = Object.keys(obj).some(key => typeof obj[key] === "object" && !Array.isArray(obj[key]))

					result.push({
						name  : key,
						data  : obj,
						isNode
					})
				})
	
				return result
			} // end getEntries

			// convert
			const rootItem = convertJsonToNavigatorItem({
				parent: null,
				name  : "isYoshihiro",
				data  : json,
				getEntries,
				isNode: true,
				extension: (item: NavigatorItem, data: Record<string, any>, depth: number) => {
					return {
						depth: depth
					}
				}
			})

			// dispatch
			dispatch((state: State) => setValue(
				setValue(state, navigator_search, rootItem),
				navigator_finder,
				rootItem
			))
		} // end effect_loadJson

		return [
			state,
			effect_loadJson
		]
	}

	// ---------- ---------- ----------
	// createColumns
	// ---------- ---------- ----------

	/**
	 * 階層の深さにより columns を変更するサンプル (使用していません)
	 */

	const createColumns = (directory: NavigatorItem | undefined) => {

		// extension に保存していた depth を取得
		const depth: number = directory?.extension?.depth

		const result: NavigatorColumn[] = []

		result.push({
			name: "name",
			val : (item: NavigatorItem) => item.name
		})

		if (depth <= 1) {
			result.push({
				name: "count",
				val : (item: NavigatorItem) => item.children?.length ?? 0
			})
		}

		if (depth === 2) {
			result.push({
				name: "Image",
				val : (item: NavigatorItem) => item.properties?.I ?? ""
			})
			result.push({
				name: "readFiles",
				val : (item: NavigatorItem) => item.properties?.R ?? ""
			})
			result.push({
				name: "Tag",
				val : (item: NavigatorItem) => item.properties?.T ?? ""
			})
		}

		return result
	}

	// ---------- ---------- ----------
	// plugIn
	// ---------- ---------- ----------

	const plugIns = (props: {
		state     : State,
		localState: Record<string, any>
	}): VNode<State>[] => {
		return [
			(<div>add plugIn 1</div>),
			(<div>add plugIn 2</div>)
		]
	}

	// ---------- ---------- ----------
	// app
	// ---------- ---------- ----------

	app({
		view: (state: State) => (<div id="app">

			{/* *** nav *** */}
			<nav><ul>
				<li>
					<OptionButton
						state    = { state }
						id       = "carousel"
						keyNames = { page }
						onclick  = { action_initCarousel }
					>Carousel</OptionButton>
				</li>
				<li>
					<OptionButton
						state    = { state }
						id       = "navigator"
						keyNames = { page }
						onclick  = { action_initNavigator }
					>Navigator</OptionButton>
				</li>
			</ul></nav>

			{/* *** main *** */}
			<main>
				{/* *** Carousel *** */}
				<Route
					state    = { state }
					keyNames = { page }
					match    = "carousel"
				>
					<h2>Carousel</h2>
					<h3>#sample_carousel1</h3>
					<Carousel
						state    = { state }
						id       = "sample_carousel1"
						keyNames = { tasks }
						class    = "carousel"
					>
						<img src = "./sample-image/pic1.jpg" />
						<img src = "./sample-image/pic2.jpg" />
						<img src = "./sample-image/pic3.jpg" />
					</Carousel>

					<h3>#sample_carousel2</h3>
					<Carousel
						state         = { state }
						id            = "sample_carousel2"
						keyNames      = { tasks }
						class         = "carousel"
						controlButton = { true }
						controlBar    = { true }
					>
						<img src = "./sample-image/pic1.jpg" />
						<img src = "./sample-image/pic2.jpg" />
						<img src = "./sample-image/pic3.jpg" />
					</Carousel>

					<h3>#sample_carousel3</h3>
					<Carousel
						state    = { state }
						id       = "sample_carousel3"
						keyNames = { tasks }
						class    = "carousel"
						controlBar = { true }
					>
						<img src = "./sample-image/img1.jpg" />
						<img src = "./sample-image/img2.jpg" />
						<img src = "./sample-image/img3.jpg" />
						<img src = "./sample-image/img4.jpg" />
						<img src = "./sample-image/img5.jpg" />
					</Carousel>
				</Route>

				{/* *** Navigator *** */}
				<Route
					state    = { state }
					keyNames = { page }
					match    = "navigator"
				>
					<h2>Navigator</h2>
					<h3>#sample_navigatorFinder + NavigatorSerch</h3>
					<NavigatorFinder
						state       = { state }
						id          = "navigator_finder"
						currentKeys = { navigator_finder }
						class       = "navigator_finder_simple"
						plugIn = {
							(state: State, localState: Record<string, any>) => {
								const keys: string[] = localState.searchText
									.trim()
									.replace(/[ 　]+/g, " ")
									.replace(/^ | $/g, "")
									.split(" ")
									.filter(Boolean)

								return [
									(<NavigatorSearch
										state        = { state }
										id           = "navigator_search"
										currentKeys  = { ["navigator", "search_current"] }
										searchResult = {
											(item: NavigatorItem, depth: number) => (<div
												onclick = {
													(state: State) => {
														const isDirectory = item.children !== undefined
														return setValue(
															state,
															["navigator", "finder_current"],
															isDirectory ? item : item.parent
														)
													}
												}
											>
												<div>
													<span>{ item.children === undefined ? "" : "[D]"}</span>
													<span>{ `(${ depth })` }</span>
													<span>{ item.name }</span>
												</div>
											</div>)
										}
										hitTest = {
											(item: NavigatorItem) => {
												if (keys.length === 0) return true
												return keys.every(key => item.name.indexOf(key) !== -1)
											}
										}
										maxItemsCount = { 10 }
									/>)
								]
							}
						}
					/>
				</Route>
			</main>
		</div>),

		node: document.getElementById("app") as HTMLElement,
		init: param,
		subscriptions: (state: State) => [
			subscription_RAFManager(state, tasks)
		]
	})
})
