// ---------- ---------- ---------- ---------- ----------
// import
// ---------- ---------- ---------- ---------- ----------

import { VNode, Dispatch } from "hyperapp"
import { getValue, setValue, createLocalKey } from "../core/state"
import { el, deleteKeys } from "../core/component"
import { InternalEffect, RAFEvent, RAFTask, subscription_RAFManager } from "../animation/raf"

// ---------- ---------- ---------- ---------- ----------
// interface CarouselState
// ---------- ---------- ---------- ---------- ----------
/**
 * Carousel コンポーネント情報
 * RAFTask.extension に保存する
 * 
 * 実行後に id を変更しても、反映されません
 * 実行後に step, duration, delay を変更した場合、次のタスクに反映されます
 * groupID, priority は未実装であり、値を設定しても動作に反映されません
 * 
 * @template S
 * @typedef {Object} CarouselState
 * 
 * @property {string}  id   - ユニークID
 * @property {number}  step - 移動するページ数。負で逆順。0で停止
 * 
 * option
 * @property {string} [groupID]  - 任意のグループナンバー (未実装)
 * @property {number} [duration] - 1回あたりの実行時間 (ms)
 * @property {number} [delay]    - 待機時間 (ms)
 * @property {number} [priority] - 処理優先巡視 (未実装)
 * @property {{ [key: string]: any}} [extension] - 拡張用プロパティ
 * 
 * event
 * @property {RAFEvent<S>} [action] - 毎フレーム発生するイベント
 * @property {RAFEvent<S>} [finish] - ページ切替後に発生するイベント
 * 
 * animation
 * @property {(t: number) => number} easing - easing 関数
 * 
 * report
 * @property {string[]} [reportPageIndex] - 現在表示中インデックスの出力パス
 */
export interface CarouselState <S> {
	id  : string
	step: number

	// option
	groupID  ?: string
	duration ?: number
	delay    ?: number
	priority ?: number
	extension?: { [key: string]: any }

	// event
	action?: RAFEvent<S>
	finish?: RAFEvent<S>

	// animation
	easing?: (t: number) => number

	// report
	reportPageIndex?: string[]
}

// ---------- ---------- ---------- ---------- ----------
// interface CarouselController
// ---------- ---------- ---------- ---------- ----------
/**
 * 外部から Carousel コンポーネントを操作するためのクラス
 * RAFTask.extension に保存する
 * 
 * @template S
 * @typedef {Object} CarouselController
 * 
 * - ページ移動を行う (移動中の場合は割り込む)
 * @property {(rafTask: RAFTask<S>, delta: number, skipSpeedRate?: number) => Promise<RAFTask<S>>} step
 * 
 * @property {(rafTask: RAFTask<S>, index: number, skipSpeedRate?: number) => Pronise<RAFTask<S>>} moveTo
 * - 指定インデックス番号に移動する (移動中の場合は割り込む)
 */
export interface CarouselController <S> {
	step  : (rafTask: RAFTask<S>, delta: number, skipSpeedRate?: number) => Promise <RAFTask<S>>
	moveTo: (RAFTask: RAFTask<S>, index: number, skipSpeedRate?: number) => Promise <RAFTask<S>>
}

// ---------- ---------- ---------- ---------- ----------
// Carousel Component
// ---------- ---------- ---------- ---------- ----------

// element
const div    = el("div")
const ul     = el("ul")
const li     = el("li")
const button = el("button")

/**
 * Carousel Component
 * 
 * @template S
 * @param {Object}   props                - props
 * @param {S}        props.state          - ステート
 * @param {string}   props.id             - ユニークID (DOM id)
 * @param {string[]} props.keyNames       - RAFTask 配列までのパス
 * @param {boolean} [props.controlButton] - ページ切り替えボタンを表示する (未実装)
 * @param {boolean} [props.controlBar]    - 現在位置を示すステータスバーを表示する
 * @param {number}  [skipSpeedRate]       - skip 時に duration に乗じる値
 * @param {any}      children             - 表示するページ (HTMLLIElement の子になる)
 */
export const Carousel = function <S> (
	props: {
		state         : S
		id            : string
		keyNames      : string[]
		controlButton?: boolean
		controlBar   ?: boolean
		skipSpeedRate?: number
		[key: string] : any
	},
	children: any
): VNode<S> {
	const { state, id, keyNames, controlButton, controlBar, skipSpeedRate } = props

	// get task
	const task = getValue(state, keyNames, [] as RAFTask<S>[])
		.find(task => task.id === id)

	// get carouselState and carouselController
	const param     : CarouselState<S>      = task?.extension?.carouselState
	const controller: CarouselController<S> = task?.extension.carouselController

	// get index
	const index = param?.reportPageIndex
		? getValue(state, param.reportPageIndex, 0)
		: getValue(state, [createLocalKey(id), "reportPageIndex"] , 0)

	// children
	const items = Array.isArray(children) ? children : [children]

	// ---------- ---------- ----------
	// action_mouseenter
	// ---------- ---------- ----------
	const action_mouseenter = (state: S) => {
		const task = getValue(state, keyNames, [] as RAFTask<S>[])
			.find(task => task.id === id)
		if (!task) return state

		// 一時停止
		task.paused = true

		return state
	}

	// ---------- ---------- ----------
	// action_mouseleave
	// ---------- ---------- ----------
	const action_mouseleave = (state: S) => {
		const task = getValue(state, keyNames, [] as RAFTask<S>[])
			.find(task => task.id === id)
		if (!task) return state

		// 一時停止解除
		task.paused = false

		return state
	}

	// ---------- ---------- ----------
	// action_prevPage
	// ---------- ---------- ----------
	const action_prevPage = (state: S) => {
		const task = getValue(state, keyNames, [] as RAFTask<S>[])
			.find(task => task.id === id)
		if (!task) return state

		controller.step(
			task,
			- 1,
			skipSpeedRate ?? 0.3
		)

		return state
	}

	// ---------- ---------- ----------
	// action_nextPage
	// ---------- ---------- ----------
	const action_nextPage = (state: S) => {
		const task = getValue(state, keyNames, [] as RAFTask<S>[])
			.find(task => task.id === id)
		if (!task) return state

		controller.step(
			task,
			1,
			skipSpeedRate ?? 0.3
		)

		return state
	}

	// ---------- ---------- ----------
	// action_controlBarClick
	// ---------- ---------- ----------
	const action_ControlBarClick = (state: S, absoluteIndex: number) => {
		const task = getValue(state, keyNames, [] as RAFTask<S>[])
			.find(task => task.id === id)
		if (!task) return state

		const param: CarouselState <S> = task.extension?.carouselState
		if (!param) return state

		controller.moveTo(
			task,
			absoluteIndex,
			skipSpeedRate ?? 0.3
		)

		return state
	}

	// ---------- ---------- ----------
	// VNode
	// ---------- ---------- ----------
	return div({
		...deleteKeys(props, "state", "keyNames")
	},
		ul({
			onmouseenter: action_mouseenter,
			onmouseleave: action_mouseleave
		},
			items.map(item => li({}, item))
		),

		// controlButton, controlBar
		(controlButton || controlBar) && div({},
			controlButton
				? button({ onclick: action_prevPage }, "<")
				: null,

			controlBar
				? ul({}, items.map((_, i) => li({
						class  : i === index && "select",
						onclick: [action_ControlBarClick, i]
					},
						// param が取れない場合、選択なしにする
						param
							? i === index ? "◉" : "・"
							: "・"
					))
				)
				: ul({}),

			controlButton
				? button({ onclick: action_nextPage }, ">")
				: null
		)
	)
}

// ---------- ---------- ---------- ---------- ----------
// effect_InitCarousel
// ---------- ---------- ---------- ---------- ----------
/**
 * カルーセル内部管理データ
 * 
 * @typedef {Object} CarouselPrivateState
 * 
 * @property {HTMLUListElement} ul            - DOM
 * @property {number}           index         - 先頭の index 番号
 * @property {number}           step          - 移動するページ数 (負で逆順。0で停止)
 * @property {number}           startOffset   - 移動開始位置
 * @property {number}           targetOffset  - 移動終了位置
 * @property {number}           currentOffset - 現在位置
 * @property {HTMLLIElement[]}  cloneNodes    - クローンノードの配列
 */
interface CarouselPrivateState {
	ul           : HTMLUListElement
	index        : number
	step         : number
	startOffset  : number
	targetOffset : number
	currentOffset: number
	cloneNodes   : HTMLLIElement[]
}

/**
 * カルーセルを初期化し起動するエフェクト
 * 
 * @param {string[]}      keyNames      - RAFTask 配列までのパス
 * @param {CarouselState} carouselState - カルーセル情報
 * @returns {(dispatch: Dispatch<S>) => void}
 */
export const effect_InitCarousel = function <S> (
	keyNames     : string[],
	carouselState: CarouselState<S>
): (dispatch: Dispatch<S>) => void {
	return (dispatch: Dispatch<S>) => {
		// どうしても画像ロードを待つ必要があるため、非同期処理に閉じ込めます
		(async () => {

			// CarouselState, easing
			const param  = carouselState
			const easing = param.easing ?? ((t: number) => t)

			// check dom
			const div = document.getElementById(param.id)
			if (!div) return

			const ul = div.querySelector("ul")
			if (!ul) return

			// cloneNode className
			const cloneClass = `${ param.id }_clone`

			// clear cloneNodes
			const children = (Array.from(ul.children) as HTMLLIElement[])
				.filter((li, i) => {
					if (li.classList.contains(cloneClass)) {
						li.remove()
						return false
					}
					li.setAttribute("absoluteIndex", `${ i }`) // もう面倒だから、DOMに絶対値情報保存する
					return true
				})
			if (!children || children.length === 0) return

			// 画像読み込み待機
			const waitImages = async () => {
				const images = Array.from(ul.querySelectorAll("img"))
				return Promise.all(
					images.map(img => {
						if (img.complete) return Promise.resolve()
						return new Promise<void>(resolve => {
							img.onload  = () => resolve()
							img.onerror = () => resolve()
						})
					})
				)
			}
			await waitImages()

			// get widths (幅 + Margin)
			const widths = children.map(child => {
				const width       = child.getBoundingClientRect().width
				const style       = getComputedStyle(child)
				const marginLeft  = parseFloat(style.marginLeft)
				const marginRight = parseFloat(style.marginRight)
				return width + marginLeft + marginRight
			})

			// get ul gap
			const ulStyle = getComputedStyle(ul)
			const gap = parseFloat(ulStyle.columnGap || ulStyle.gap || "0")
			const ulGap = isNaN(gap) ? 0 : gap

			// reportIndex path
			const reportPageIndex = param.reportPageIndex ?? [createLocalKey(param.id), "reportPageIndex"]

			// dispatch
			dispatch((state: S) => {

				// ---------- ---------- ----------
				// CarouselPrivateState
				// ---------- ---------- ----------
				const privateParam: CarouselPrivateState = {
					ul,
					step         : 0,
					index        : 0,
					startOffset  : 0,
					targetOffset : 0,
					currentOffset: 0,
					cloneNodes   : []
				}

				// ---------- ---------- ----------
				// function getCurrentState
				// ---------- ---------- ----------
				/**
				 * 相対、絶対インデックスの取得
				 * 先頭オフセット値の取得
				 * 入れ替えが必要な DOM の数を取得
				 */
				const getCurrentState = (): {
					relativeIndex: number
					absoluteIndex: number
					offset       : number
					toggleCount  : number
				} => {
					let relativeIndex = - 1
					let absoluteIndex = - 1
					let offset = 0

					for (let i = 0, width = offset; i < privateParam.ul.children.length; i++) {
						const li = privateParam.ul.children[i] as HTMLLIElement
						const index = Number(li.getAttribute("absoluteIndex"))

						if (Math.abs(privateParam.currentOffset) >= width) {
							relativeIndex = i
							absoluteIndex = index
							offset = privateParam.currentOffset + width
						}

						// next
						width += widths[absoluteIndex]
						if (i !== 0) width += ulGap
					}

					return {
						relativeIndex : relativeIndex,
						absoluteIndex : absoluteIndex,
						offset        : offset,
						toggleCount   : privateParam.step < 0
							? Math.abs(privateParam.step) - relativeIndex
							: relativeIndex
					}
				} // end getCurrentState

				// ---------- ---------- ----------
				// controller
				// ---------- ---------- ----------
				const controller: CarouselController <S> = {

					// ---------- ---------- ----------
					// controller.step
					// ---------- ---------- ----------
					step: (
						rafTask       : RAFTask<S>,
						delta         : number,
						skipSpeedRate?: number
					): Promise <RAFTask<S>> => {

						// 一時停止
						const paused   = rafTask.paused
						rafTask.paused = true

						// result
						return new Promise((resolve, reject) => {

							// currentState
							const currentState = getCurrentState()

							// delete cloneNodes
							privateParam.cloneNodes.forEach(node => node.remove())
							privateParam.cloneNodes = []

							// DOM の入れ替え
							for (let i = 0; i < currentState.toggleCount; i++) {
								const node = privateParam.step < 0
									? privateParam.ul.lastChild
									: privateParam.ul.firstChild
								if (node) {
									if (privateParam.step < 0) {
										privateParam.ul.insertBefore(node, privateParam.ul.firstChild)
									} else {
										privateParam.ul.appendChild(node)
									}
								}
							}

							// create cloneNodes
							let cloneWidth = 0

							for (let i = 0; i < Math.abs(delta); i++) {
								const index = delta < 0
									? privateParam.ul.children.length - 1 - i
									: i
								const cloneNode = privateParam.ul.children[index].cloneNode(true) as HTMLLIElement
								cloneNode.classList.add(cloneClass)
								privateParam.cloneNodes.push(cloneNode)
								if (delta < 0) {
									privateParam.ul.insertBefore(cloneNode, privateParam.ul.firstChild)
								} else {
									privateParam.ul.appendChild(cloneNode)
								}

								// get width
								const absoluteIndex = Number(cloneNode.getAttribute("absoluteIndex"))
								cloneWidth += widths[absoluteIndex]

								// add gap
								if (i !== 0) cloneWidth += ulGap
							} // end create cloneNodes

							// privateParamの調整
							privateParam.step  = delta
							privateParam.index = ((currentState.absoluteIndex + delta) % children.length + children.length) % children.length

							privateParam.startOffset = delta < 0
								? currentState.offset - cloneWidth
								: currentState.offset

							privateParam.currentOffset = privateParam.startOffset

							privateParam.targetOffset = delta < 0
								? 0
								: - cloneWidth

							// スタイル適用
							privateParam.ul.style.transform = `translateX(${ privateParam.currentOffset }px)`

							// newTask
							const newTask: RAFTask<S> = new RAFTask({
								id      : `${ param.id }_step`,
								duration: rafTask.duration * (skipSpeedRate ?? 0.1),
								action,
								finish: (state: S, rafTask: RAFTask<S>): S | [S, InternalEffect<S>] => {
									rafTask.paused = paused

									const res      = finish(state, rafTask)
									const newState = Array.isArray(res)
										? res[0]
										: res

									// 一時停止状況の復元
									rafTask.paused = paused

									resolve(rafTask)

									return newState
								},
							}) // end newTask

							// dispatch
							requestAnimationFrame(() => dispatch((state: S) => {
								const tasks = getValue(state, keyNames, [] as RAFTask<S>[])
									.filter(task => task.id !== `${ param.id }_step` && task.id !== param.id)
									.concat(newTask)
								return setValue(state, keyNames, tasks)
							}))
						})
					}, // end controller.step

					// ---------- ---------- ----------
					// controller.moveTo
					// ---------- ---------- ----------
					moveTo: (rafTask: RAFTask<S>, index: number, skipSpeedRate?: number): Promise <RAFTask<S>> => {
						return controller.step(
							rafTask,
							index - getCurrentState().absoluteIndex,
							skipSpeedRate
						)
					}

				} // end controller

				// ---------- ---------- ----------
				// task_action
				// ---------- ---------- ----------
				const action = (state: S, rafTask: RAFTask<S>): S | [S, InternalEffect<S>] => {
					if (!privateParam.ul.isConnected) return state
					if (rafTask.paused) return state

					// privateParam.currentOffset の調整
					privateParam.currentOffset = privateParam.startOffset
						+ (privateParam.targetOffset - privateParam.startOffset)
						* easing(rafTask.progress)

					// style 適用
					privateParam.ul.style.transform = `translateX(${ privateParam.currentOffset }px)`

					return [state, (dispatch: Dispatch<S>) => {
						// action 割り込み
						const fn = param.action
						if (fn) requestAnimationFrame(() => dispatch((state: S) => [fn, rafTask]))
					}]
				}

				// ---------- ---------- ----------
				// task_finish
				// ---------- ---------- ----------
				const finish = (state: S, rafTask: RAFTask<S>): S | [S, InternalEffect<S>] => {
					if (!privateParam.ul.isConnected) return state

					// set reportPageIndex
					let newState = setValue(state, reportPageIndex, privateParam.index)

					// delete cloneNodes
					privateParam.cloneNodes.forEach(node => node.remove())
					privateParam.cloneNodes = []

					// DOM の入れ替え
					for (let i = 0; i < Math.abs(privateParam.step); i++) {
						const node = privateParam.step < 0
							? privateParam.ul.lastChild as HTMLLIElement
							: privateParam.ul.firstChild as HTMLLIElement
						if (privateParam.step < 0) {
							privateParam.ul.insertBefore(node, privateParam.ul.firstChild)
						} else {
							privateParam.ul.appendChild(node)
						}
					}

					// set index
					privateParam.step  = param.step
					privateParam.index = ((privateParam.index + privateParam.step) % children.length + children.length) % children.length

					// add cloneNodes
					let cloneWidth = 0
					for (let i = 0; i < Math.abs(privateParam.step); i++) {
						const index = privateParam.step < 0
							? privateParam.ul.children.length - 1 - i
							: i
						const cloneNode = privateParam.ul.children[index].cloneNode(true) as HTMLLIElement
						cloneNode.classList.add(cloneClass)
						privateParam.cloneNodes.push(cloneNode)
						if (privateParam.step < 0) {
							privateParam.ul.insertBefore(cloneNode, privateParam.ul.firstChild)
						} else {
							privateParam.ul.appendChild(cloneNode)
						}

						// get width
						const absoluteIndex = Number(cloneNode.getAttribute("absoluteIndex"))
						cloneWidth += widths[absoluteIndex]

						// add gap
						if (i !== 0) cloneWidth += ulGap
					}

					// privateParam の調整
					privateParam.startOffset  = privateParam.step < 0
						? - cloneWidth
						: 0
					privateParam.targetOffset = privateParam.step < 0
						? 0
						: - cloneWidth
					privateParam.currentOffset = privateParam.startOffset

					// set dom
					privateParam.ul.style.transform = `translateX(${ privateParam.currentOffset }px)`

					newState = setValue(
						newState,
						keyNames,
						getValue(newState, keyNames, [] as RAFTask<S>[])
							.filter(task => task.id !== param.id)
							.concat(createTask())
					)

					return [newState, (dispatch: Dispatch<S>) => {
						// finish 割り込み
						const fn = param.finish
						if (fn) requestAnimationFrame(() => dispatch((state: S) => [fn, rafTask]))
					}]
				}

				// ---------- ---------- ----------
				// createTask
				// ---------- ---------- ----------
				const createTask = (): RAFTask<S> => {
					return new RAFTask<S>({
						id      : param.id,
						groupID : param.groupID,
						duration: param.duration ?? 1000,
						delay   : param.delay ?? 2000,
						action,
						finish,
						priority : param.priority ?? 0,
						extension: {
							...param.extension,
							carouselState     : param,
							carouselController: controller
						}
					})
				} // end createTask

				// ---------- ---------- ----------
				// startTask
				// ---------- ---------- ----------
				const startTask = new RAFTask<S>({
					id      : param.id,
					groupID : param.groupID,
					duration: 0,
					delay   : 0,
					action  : (state: S, rafTask: RAFTask<S>): S | [S, InternalEffect<S>] => state,
					finish,
					extension: {
						carouselState     : param,
						carouselController: controller
					}
				})

				// ---------- ---------- ----------
				// result
				// ---------- ---------- ----------
				return setValue(
					state,
					keyNames,
					getValue(state, keyNames, [] as RAFTask<S>[])
						.filter(task => task.id !== param.id)
						.concat(startTask)
				)

			}) // end dispatch
		})() // end sync
	} // end result
} // end effect
