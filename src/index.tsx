// index.tsx

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
	SelectButton
} from "./hyperapp-is"
import { InternalEffect } from "../dist/hyperapp-is"
import { marked } from "marked"

// ---------- ---------- ---------- ---------- ----------
// State
// ---------- ---------- ---------- ---------- ----------

interface State {
	tasks   : RAFTask<State>[]
	selected: string[]
	page    : string
	carousel: {
		pageNumber: number
	},
	navigator: {
		finder_current: NavigatorItem | undefined
	}
}

// ---------- ---------- ---------- ---------- ----------

const param: State = {
	tasks   : [],
	selected: [],
	page    : "0",
	carousel: {
		pageNumber: 0
	},
	navigator: {
		finder_current: undefined,
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

	// ---------- ---------- ----------
	// action_initCarousel
	// ---------- ---------- ----------

	const action_initCarousel = (state: State) => {

		// readme
		const effect_readme = async (dispatch: Dispatch<State>) => {
			const readme = await fetch("md/Carousel.md").then(data => {
				if (!data.ok) throw new Error("error readme")
				return data.text()
			})
			dispatch((state: State) => setValue(state, ["readme"], readme))
		}

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
			effect_readme,
			effect_InitCarousel(tasks, param1),
			effect_InitCarousel(tasks, param2),
			effect_InitCarousel(tasks, param3)
		]
	}

	// ---------- ---------- ----------
	// action_initNavigator
	// ---------- ---------- ----------

	const action_initNavigator = (state: State) => {

		// readme
		const effect_readme = async (dispatch: Dispatch<State>) => {
			const readme = await fetch("md/Navigator.md").then(data => {
				if (!data.ok) throw new Error("error readme")
				return data.text()
			})
			dispatch((state: State) => setValue(state, ["readme"], readme))
		} // end effect_readme

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

					result.push({
						name  : key,
						data  : obj,
						isNode: typeof obj === "object" && !Array.isArray(obj)
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

			dispatch((state: State) => setValue(state, navigator_finder, rootItem))
		} // end effect_loadJson

		return [
			state,
			effect_readme,
			effect_loadJson
		]
	}

	// ---------- ---------- ----------
	// createColumns
	// ---------- ---------- ----------
	/**
	 * 階層の深さにより columns を変更するサンプル
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
					<h3>#sample_navigatorFinder</h3>
					<NavigatorFinder
						state       = { state }
						id          = "navigator_finder"
						currentKeys = { navigator_finder }
						/* columns = { createColumns } */
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