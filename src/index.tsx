// ---------- ---------- ---------- ---------- ----------
// import 
// ---------- ---------- ---------- ---------- ----------

import { app, VNode, Dispatch } from "hyperapp"
import h from "hyperapp-jsx-pragma"
import {
	setValue,
	Route, SelectButton, OptionButton,

	effect_nodesInitialize, effect_setTimedValue, subscription_nodesCleanup,

	effect_throwMessageStart, effect_throwMessagePause, effect_throwMessageResume,

	InternalEffect, RAFTask, subscription_RAFManager, 
	progress_easing,

	effect_RAFProperties,
	
	CarouselState, effect_carouselStart,

	ScrollMargin, getScrollMargin,
	marquee,
	getValue,
} from "./hyperapp-ui"

// ---------- ---------- ---------- ---------- ----------
// State
// ---------- ---------- ---------- ---------- ----------
/**
 * ステート
 * タブごとに分けてあります
 */
interface State {
	debug  : string
	tabName: string

	selectButton: {
		selected: string[]
	},

	optionButton: {
		group1: string
		group2: string
	},

	effect: {
		timedText: string
		throwMsg : string
		node     : VNode<State> | null
		easing   : keyof typeof progress_easing
	},

	subscriptions: {
		finalize: boolean
		tasks   : RAFTask<State>[]
	},

	dom: {
		margin: ScrollMargin
	},

	carousel: {
		index: number
	}
}

// ---------- ---------- ---------- ---------- ----------
// action_setTimedNode
// ---------- ---------- ---------- ---------- ----------
/**
 * effect タブをクリックした時のアクション
 */
const action_effectButtonClick = (state: State) => {
	const label = (<label>Label</label>)
	const text  = Array.from({length: 40}).map((_, i) => i).join("")

	return [
		state,
		effect_nodesInitialize([
			{
				id: "initTest",
				event: (state: State, element: Element) => {
					const input = element as HTMLInputElement
					input.value = `initTest: width = ${ input.clientWidth }, height = ${ input.clientHeight }`
					return state
				}
			}
		]),
		effect_setTimedValue(["effect", "timedText"], "timedText", 2000, "timedText", ""),
		effect_setTimedValue(["effect", "node"], "label1", 2000, label, null),
		effect_throwMessageStart(["effect", "throwMsg"], "msg", text, 50)
	]
}

// ---------- ---------- ---------- ---------- ----------
// action_throwAction
// ---------- ---------- ---------- ---------- ----------
/**
 * ディスパッチを強制するためのアクション
 */
const action_throwAction = (state: State) => {
	return { ...state }
}

// ---------- ---------- ---------- ---------- ----------
// action_toggleFinalize
// ---------- ---------- ---------- ---------- ----------
/**
 * state.subscriptionsfinalize: boolean のトグル
 */
const action_toggleFinalize = (state: State) => {
	return setValue(state, ["subscriptions", "finalize"], !state.subscriptions.finalize)
}

// ---------- ---------- ---------- ---------- ----------
// action_move
// ---------- ---------- ---------- ---------- ----------
/**
 * rAF でのアニメーション (transform)
 */
const action_move = (state: State) => {
	const effect = effect_RAFProperties({
		id: "raf",
		keyNames: ["subscriptions", "tasks"],
		duration: 1000,

		properties: [{
			["#raf"]: {
				"transform": (progress: number) => {
					const fn = progress_easing[state.effect.easing]
					return `translate(${ fn(progress) * 10}rem, 0)`
				}
			}
		}],

		finish: (state: State, rafTask: RAFTask<State>) => {
			const dom = document.getElementById(rafTask.id)
			if (!dom) return state
			setTimeout(() => {
				dom.style.transform = "translate(0, 0)"
			}, 1000)
			return state
		}
	})

	return [state, effect]
}

// ---------- ---------- ---------- ---------- ----------
// action_setEasing
// ---------- ---------- ---------- ---------- ----------
/**
 * ステートの easing 関数を、変更する
 */
const action_setEasing = (state: State, e: Event) => {
	const element = e.currentTarget as HTMLSelectElement
	return setValue(state, ["effect", "easing"], element.value)
}

// ---------- ---------- ---------- ---------- ----------
// action_setProperties
// ---------- ---------- ---------- ---------- ----------
/**
 * rAF でのアニメーション (font-size, margin)
 */
const action_setProperties = (state: State) => {

	const effect = effect_RAFProperties({
		id        : "rafP",
		duration  : 1000,
		properties: [{
			"#rafP": {
				"font-size": (progress: number) => `${ 1 + (progress * 3) }rem`,
				"margin"   : (progress: number) => `0.5rem 0 0.5rem ${ 2 + progress * 5}rem`
			}
		}],
		finish: (state: State, rafTask: RAFTask<State>) => {
			const dom = document.getElementById(rafTask.id)
			if (!dom) return state
			setTimeout(() => {
				dom.style.fontSize = "1rem"
				dom.style.margin = "0.5rem 0 0.5rem 2rem"
			}, 1000)
			return state
		},
		keyNames  : ["subscriptions", "tasks"],
	})

	return [state, effect]
}

// ---------- ---------- ---------- ---------- ----------
// action_scroll
// ---------- ---------- ---------- ---------- ----------
/**
 * ScrollMargin 取得のテスト
 */
const action_scroll = (state: State, e: Event) => {
	return setValue(state, ["dom", "margin"], getScrollMargin(e))
}

// ---------- ---------- ---------- ---------- ----------
// action_carouselButtonClick
// ---------- ---------- ---------- ---------- ----------

// Marquee controler
let controls: { start: () => void, stop: () => void } | null = null

/**
 * carousel タブのクリック
 */
const action_carouselButtonClick = (state: State) => {

	// ---------- ---------- ----------
	// marquee
	// ---------- ---------- ----------

	// すでに動作済みであれば stop
	if (controls) controls.stop()

	// marquee を動作させるエフェクトを作成
	const effect_setMarquee = (dispatch: Dispatch<State>) => {
		dispatch((state: State) => {
			const ul = document.getElementById("marquee") as HTMLUListElement
			if (!ul) return state

			controls = marquee({
				element : ul,
				duration: 2000,
				interval: 1000,
				easing  : progress_easing.easeOutCubic
			})

			setTimeout(() => controls?.start(), 1000)

			return state
		})
	}

	// ---------- ---------- ----------
	// carousel_finish
	// ---------- ---------- ----------

	// carousel: finish (アクティブな index 番号を取得して、ステートを変更)
	const carousel_finish = (state: State, rafTask: RAFTask<State>): State | [State, InternalEffect<State>] => {
		const carouselState: CarouselState = rafTask.extension?.carouselState
		if (!carouselState) return state

		return setValue(state, ["carousel", "index"], carouselState.index)
	}

	// result
	return [
		state,
		effect_setMarquee,
		effect_carouselStart({
			id      : "carousel",
			duration: 2000,
			delay   : 1000,
			finish  : carousel_finish,
			easing  : progress_easing.easeOutCubic,
			keyNames: ["subscriptions", "tasks"]
		})
	]
}

// ---------- ---------- ---------- ---------- ----------
// action_carouselPause
// ---------- ---------- ---------- ---------- ----------
/**
 * #carousel にマウスが乗った場合のアニメーション
 * 動作途中の rAF アニメーションを差し替えるテスト
 */
const action_carouselPause = (state: State) => {
	// get task
	const tasks = getValue(state, ["subscriptions", "tasks"], [] as RAFTask<State>[])
	const task  = tasks.find(task => task.id === "carousel")
	if (!task) return state

	// pause
	task.paused = true

	// get dom
	const dom = document.getElementById(task.id)
	if (!dom) return state

	const children = Array.from(dom.children) as HTMLElement[]
	if (!children || children.length < 2) return state

	// get width (動作済みの幅を取得)
	const width = (children[1].offsetLeft - children[0].offsetLeft)
		* progress_easing.easeOutCubic(task.progress)

	// clone (現在のタスクをクローン)
	const cloneTask  = task.clone()

	// newTask (動作済みの幅を戻すアニメーション)
	const newTask = new RAFTask<State>({
		id      : "carousel_remove",
		duration: 300,

		action: (state: State, rafTask: RAFTask<State>): State | [State, InternalEffect<State>] => {
			const val = - width + progress_easing.easeOutCubic(rafTask.progress) * width

			dom.style.transform = `translateX(${ val }px)`
			return state
		},

		// 巻き戻しアニメーション終了時には、クローンした元のアニメーションに差し替える
		finish: (state: State, rafTask: RAFTask<State>): State | [State, InternalEffect<State>] => {
			dom.style.transform = "translateX(0px)"
			cloneTask.paused = false

			return setValue(state, ["subscriptions", "tasks"],
				getValue(state, ["subscriptions", "tasks"], [] as RAFTask<State>[])
					.filter(task => task.id !== "carousel" && task.id !== "carousel_remove")
					.concat(cloneTask)
			)
		}
	})

	// 巻き戻しアニメーションに差し替える
	return setValue(state, ["subscriptions", "tasks"],
		tasks
			.filter(task => task.id !== "carousel")
			.concat(newTask)
	)
}

// ---------- ---------- ---------- ---------- ----------
// action_carouselResume
// ---------- ---------- ---------- ---------- ----------
/**
 * #カルーセルからマウスが離れた場合のアニメーション
 */
const action_carouselResume = (state: State) => {
	// get task
	const task = getValue(state, ["subscriptions", "tasks"], [] as RAFTask<State>[])
		.find(task => task.id === "carousel")

	// 一時停止解除
	if (task) task.paused = false

	return state
}

// ---------- ---------- ---------- ---------- ----------
// Entry Point
// ---------- ---------- ---------- ---------- ----------

addEventListener("load", () => {

	// progress_easing
	const easingList: string[] = (() => {
		const r: string[] = []
		for (const p in progress_easing) {
			r.push(p)
		}
		return r
	})()

	// State
	const param: State = {
		debug  : "init...",
		tabName: "",

		selectButton: {
			selected: []
		},

		optionButton: {
			group1: "",
			group2: ""
		},

		effect: {
			timedText: "",
			throwMsg : "",
			node     : null,
			easing   : "linear"
		},

		subscriptions: {
			finalize: false,
			tasks   : [],
		},

		dom: {
			margin: { top: 0, left: 0, right: 0, bottom: 0 },
		},

		carousel: {
			index: 0
		}
	}

	// app
	app({
		node: document.getElementById("app") as HTMLElement,
		init: param,

		view: (state: State) => (<main>

			{/* *** Tabs Header *** */}
			<div>
				<OptionButton state={state} keyNames={["tabName"]} id="page1">SelectButton</OptionButton>
				<OptionButton state={state} keyNames={["tabName"]} id="page2">OptionButton</OptionButton>
				<OptionButton
					state    = { state }
					keyNames = { ["tabName"] }
					id       = "page3"
					onclick  = { action_effectButtonClick }
				>Effect</OptionButton>
				<OptionButton state={state} keyNames={["tabName"]} id="page4">Subscriptions</OptionButton>
				<OptionButton state={state} keyNames={["tabName"]} id="page5">DOM / Event</OptionButton>
				<OptionButton
					state    = {state}
					keyNames = {["tabName"]}
					id       = "page6"
					onclick  = { action_carouselButtonClick }
				>Carousel</OptionButton>
			</div>

			{/* *** Tabs Body *** */}
			<div>
				{/* *** page1: SelectButton *** */}
				<Route state={state} keyNames={["tabName"]} match="page1">
					<h2>SelectButton example</h2>

					<h3>select / none</h3>
					<SelectButton state={state} keyNames={["selectButton", "selected"]} id="btn1">select / none</SelectButton>

					<h3>select / reverse / none</h3>
					<SelectButton state={state} keyNames={["selectButton", "selected"]} id="btn2" reverse={true}>select / reverse / none</SelectButton>
				</Route>

				{/* *** page2: OptionButton *** */}
				<Route state={state} keyNames={["tabName"]} match="page2">
					<h2>OptionButton example</h2>

					<h3>select</h3>
					<OptionButton state={state} keyNames={["optionButton", "group1"]} id="g1_btn1">group1_btn1</OptionButton>
					<OptionButton state={state} keyNames={["optionButton", "group1"]} id="g1_btn2">group1_btn2</OptionButton>
					<OptionButton state={state} keyNames={["optionButton", "group1"]} id="g1_btn3">group1_btn3</OptionButton>

					<h3>select / reverse</h3>
					<OptionButton state={state} keyNames={["optionButton", "group2"]} id="g2_btn1" reverse={true}>group2_btn1</OptionButton>
					<OptionButton state={state} keyNames={["optionButton", "group2"]} id="g2_btn2" reverse={true}>group2_btn2</OptionButton>
					<OptionButton state={state} keyNames={["optionButton", "group2"]} id="g2_btn3" reverse={true}>group2_btn3</OptionButton>
				</Route>

				{/* *** page3: Effect *** */}
				<Route state={state} keyNames={["tabName"]} match="page3">
					<h2>Effect example</h2>

					<h3>effect_initializeNodes</h3>
					<input type="text" id="initTest" />

					<h3>effect_setTimedValue</h3>
					<input type="text" id="timedText" value={ state.effect.timedText } />
					{ state.effect.node }

					<h3>effect_throwMessage</h3>
					<input type="text" id="msg" value={ state.effect.throwMsg } />
					<div>
						<button
							type    = "button"
							onclick = {(state: State) => [state, effect_throwMessagePause("msg")]}
						>pause</button>
						<button
							type    = "button"
							onclick = {(state: State) => [state, effect_throwMessageResume("msg")]}
						>resume</button>
					</div>

					<h2>rAF / Animation System</h2>

					<h3>effect_rAFProperties - transform</h3>
					<button state={state} onclick={action_move} id="raf">{ state.effect.easing }</button><br/>
					<select onchange={action_setEasing}>{
						easingList.map(p => (<option>{p}</option>))
					}</select>

					<h3>effect_rAFProperties - font-size</h3>
					<button state={state} onclick={action_setProperties} id="rafP">font</button>
				</Route>

				{/* *** page4: Subscriptions *** */}
				<Route state={state} keyNames={["tabName"]} match="page4">
					<h2>Subscriptions example</h2>

					<h2>subscription_nodesCleanup</h2>
					<button type="button" onclick={action_throwAction}>throw action</button>
					<button type="button" onclick={action_toggleFinalize}>toggle object</button>
					{ state.subscriptions.finalize ? (<span id="dom">object</span>) : null }
				</Route>

				{/* *** page5: DOM / Event *** */}
				<Route state={state} keyNames={["tabName"]} match="page5">
					<h2>DOM / Event example</h2>

					<h3>getScrollMargin</h3>
					<div id="parent" onscroll={action_scroll}>
						<div id="child">スクロールしてください</div>
					</div>
					<div>{ JSON.stringify(state.dom.margin) }</div>
				</Route>

				{/* *** page6: Carousel *** */}
				<Route state={state} keyNames={["tabName"]} match="page6">
					<h2>Carousel</h2>
					<ul
						id           = "carousel"
						onmouseenter = { action_carouselPause }
						onmouseleave = { action_carouselResume }
					>{
						Array.from({length: 5}).map((_, i) => (<li>{i}</li>))
					}</ul>
					<div>{ state.carousel.index }</div>

					<h2>marquee</h2>
					<ul id="marquee">{
						Array.from({length: 5}).map((_, i) => (<li>{i}</li>))
					}</ul>
				</Route>
			</div>
		</main>),

		subscriptions: (state: State) => [
			...subscription_nodesCleanup([{
				id      : "dom",
				finalize: (state: State) => {
					alert("finalize")
					return state
				}
			}]),
			subscription_RAFManager(state, ["subscriptions", "tasks"])
		]
	})
})