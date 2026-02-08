// import
import { VNode, Dispatch } from "hyperapp"
import { getValue, setValue, getLocalState, setLocalState } from "../core/state"
import { el, concatAction, getClassList, deleteKeys } from "../core/component"
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
 * @property {string[]} reportPageIndex - 現在表示中インデックスの出力パス
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
// interface CarouselControler
// ---------- ---------- ---------- ---------- ----------
/**
 * 外部から Carousel コンポーネントを操作するためのクラス
 * RAFTask.extension に保存する
 * 
 * @template S
 * @typedef {Object} CarouselController
 * 
 * @property {(rafTask: RAFTask<S>) => void} rollBack    - 強制ルールバック
 * @property {(rafTask: RAFTask<S>) => void} rollForward - 強制早送り
 */
export interface CarouselController <S> {
	rollBack   : (rafTask: RAFTask<S>) => void
	rollForward: (rafTask: RAFTask<S>) => void
}

// ---------- ---------- ---------- ---------- ----------
// Carousel
// ---------- ---------- ---------- ---------- ----------

// element
const div = el("div")
const ul  = el("ul")
const li  = el("li")

/**
 * Carousel コンポーネント
 * 
 * @template S
 * @param {Object}   props                - props
 * @param {S}        props.state          - ステート
 * @param {string}   props.id             - ユニークID (DOM id)
 * @param {string[]} props.keyNames       - RAFTask 配列までのパス
 * @param {boolean} [props.controlButton] - ページ切り替えボタンを表示する
 * @param {boolean} [props.controlBar]    - 現在位置を示すステータスバーを表示する
 * @param {any}      children             - 表示するページ (HTMLLIElement の子になる)
 */
export const Carousel = function <S> (
	props: {
		state         : S
		id            : string
		keyNames      : string[]
		controlButton?: boolean
		controlBar   ?: boolean
		[key: string] : any
	},
	children: any
): VNode<S> {
	const { state, id, keyNames, controlButton, controlBar } = props

	// get task
	const task = getValue(state, keyNames, [] as RAFTask<S>[])
		.find(task => task.id === id)
	
	// get carouselState and carouselController
	const carouselState: CarouselState<S>      = task?.extension?.carouselState
	const controller   : CarouselController<S> = task?.extension.carouselController

	// get index
	// reportPageIndex が指定されていなければ、ローカルステートから取得する
	const index = carouselState?.reportPageIndex
		? getValue(state, carouselState.reportPageIndex, 0)
		: getLocalState(state, id, { index: 0 }).index

	// children
	const items = Array.isArray(children) ? children : [children]

	// action_mouseenter
	// rollBack or rollForward and pause
	const action_mouseenter = (state: S) => {
		const task = getValue(state, keyNames, [] as RAFTask<S>[])
			.find(task => task.id === id)
		if (!task) return state

		if (controller) {
			if (task.progress < 0.5) {
				controller.rollBack(task)
			} else {
				controller.rollForward(task)
			}
		}

		task.paused = true

		return state
	}

	// action_mouseleave
	const action_mouseleave = (state: S) => {
		const task = getValue(state, keyNames, [] as RAFTask<S>[])
			.find(task => task.id === id)
		if (!task) return state

		task.paused = false

		return state
	}

	// VNode
	return div({
		...deleteKeys(props, "state", "keyNames")
	},
		ul({
			onmouseenter: action_mouseenter,
			onmouseleave: action_mouseleave
		},
			items.map(item => li({
				style: {
					margin    : 0,
					border    : "none",
					flexShrink: 0
				}
			}, item))
		),
		controlBar && div({}, index)
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
 * @property {HTMLUListElement} ul           - DOM
 * @property {number}           index        - 先頭の index 番号
 * @property {number}           step         - 移動するページ数 (負で逆順。0で停止)
 * @property {number}           startOffset  - 移動開始位置
 * @property {number}           targetOffset - 移動終了位置
 * @property {HTMLLIElement[]}  cloneNodes   - クローンノードの配列
 */
interface CarouselPrivateState {
	ul          : HTMLUListElement
	index       : number
	step        : number
	startOffset : number
	targetOffset: number
	cloneNodes  : HTMLLIElement[]
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
	const SKIP_SPEED = 200

	// get id
	const id = carouselState.id

	// dispatch
	return (dispatch: Dispatch<S>) => {
		// get div
		const div = document.getElementById(id)
		if (!div) return

		// get ul
		const ul = div.children[0] as HTMLUListElement
		if (!ul) return

		// get children
		const children = Array.from(ul.children) as HTMLLIElement[]
		if (!children || children.length === 0) return

		// get widths
		const widths: number[] = []
		for (let i = 0; i < children.length; i++) {
			widths[i] = children[i].getBoundingClientRect().width
		}

		// CarouselPrivateState
		const carouselPrivateState: CarouselPrivateState = {
			ul          : ul,
			index       : 0,
			step        : 0,
			startOffset : 0,
			targetOffset: 0,
			cloneNodes  : []
		}

		// CarouselController
		const carouselController: CarouselController <S> = {
			// rollBack
			rollBack: (rafTask: RAFTask<S>) => {
				if (rafTask.progress === 0) return

				const cloneTask = rafTask.clone()

				const easing = carouselState.easing ?? ((t: number) => t)

				const maxWidth      = Math.abs(carouselPrivateState.targetOffset - carouselPrivateState.startOffset)
				const currentOffset = easing(rafTask.progress) * maxWidth

				const newTask = new RAFTask({
					id      : `${ rafTask.id }_rollBack`,
					groupID : rafTask.groupID,
					duration: SKIP_SPEED,
					delay   : 0,

					// action
					action: (state: S, rafTask: RAFTask<S>): S | [S, InternalEffect<S>] => {
						const val = carouselPrivateState.step < 0
							? - maxWidth + currentOffset - rafTask.progress * currentOffset
							: - currentOffset + rafTask.progress * currentOffset
						carouselPrivateState.ul.style.transform = `translateX(${ val }px)`
						return state
					},

					// finish
					finish: (state: S, rafTask: RAFTask<S>): S | [S, InternalEffect<S>] => {
						const tasks = getValue(state, keyNames, [] as RAFTask<S>[])
							.filter(task => task.id !== `${ rafTask.id }_rollBack`)

						return setValue(state, keyNames, tasks.concat(cloneTask))
					}
				})

				requestAnimationFrame(() => dispatch((state: S) => {
					const tasks = getValue(state, keyNames, [] as RAFTask<S>[])
						.filter(task => task.id !== rafTask.id)
					return setValue(state, keyNames, tasks.concat(newTask))
				}))
			},

			// rollForward
			rollForward: (rafTask: RAFTask<S>) => {
				if (rafTask.progress === 0) return

				const cloneTask = rafTask.clone()

				const easing = carouselState.easing ?? ((t: number) => t)

				const maxWidth      = Math.abs(carouselPrivateState.targetOffset - carouselPrivateState.startOffset)
				const currentOffset = easing(rafTask.progress) * maxWidth
				const width         = maxWidth - currentOffset

				const newTask = new RAFTask({
					id      : `${ rafTask.id }_rollForward`,
					groupID : rafTask.groupID,
					duration: SKIP_SPEED,

					delay   : 0,

					// action
					action: (state: S, rafTask: RAFTask<S>): S | [S, InternalEffect<S>] => {
						const val = carouselPrivateState.step < 0
							? - maxWidth + currentOffset + rafTask.progress * width
							: - currentOffset - rafTask.progress * width
						carouselPrivateState.ul.style.transform = `translateX(${ val }px)`
						return state
					},

					// finish
					finish: (state: S, rafTask: RAFTask<S>): S | [S, InternalEffect<S>] => {
						const paused = cloneTask.paused
						cloneTask.paused = false

						let newState = state
						const fn = cloneTask.finish
						if (fn) {
							const res = fn(state, cloneTask)
							newState = Array.isArray(res) ? res[0] : res
						}

						cloneTask.paused = paused

						const tasks = getValue(state, keyNames, [] as RAFTask<S>[])
							.filter(task => task.id !== `${ rafTask.id }_rollForward`)

						return setValue(newState, keyNames, tasks.concat(cloneTask))
					}
				})

				requestAnimationFrame(() => dispatch((state: S) => {
					const tasks = getValue(state, keyNames, [] as RAFTask<S>[])
						.filter(task => task.id !== rafTask.id)
					return setValue(state, keyNames, tasks.concat(newTask))
				}))
			}
		}

		// action
		const action = (state: S, rafTask: RAFTask<S>): S | [S, InternalEffect<S>] => {
			// get carouselState
			const carouselState: CarouselState<S> = rafTask.extension?.carouselState
			if (!carouselState) return state

			// easing
			const easing = carouselState.easing ?? ((t: number) => t)

			// ul が消えていれば終了
			if (!carouselPrivateState.ul.isConnected) {
				rafTask.isDone = true
				return state
			}

			// 一時停止中であれば終了
			if (rafTask.paused) return state

			// step = 0 であれば終了
			if (carouselPrivateState.step === 0) return state

			// クローンノードがなければ作成
			if (carouselPrivateState.cloneNodes.length === 0) {
				// step
				const step  = carouselPrivateState.step

				// remove cloneNodes
				carouselPrivateState.cloneNodes.forEach(node => node.remove())
				carouselPrivateState.cloneNodes = []

				const reverseLookup = (index: number) => {
					const leftIndex = carouselPrivateState.index
					return ((index - leftIndex) % children.length + children.length) % children.length
				}

				// 移動幅を取得する関数
				const getMoveSize = () => {
					let result  = 0

					for (let i = 0; i < Math.abs(step); i++) {
						const index = step < 0
							? children.length - 1 - (i % children.length)
							: i % children.length
						result += widths[reverseLookup(index)]
					}

					return result
				}

				// 移動幅から、clone が必要な数を取得する
				const getCloneCount = () => {
					let size = 0
					const safeMargin = 1 // 丸め誤差を考慮したマージン
					const moveSize   = getMoveSize() + safeMargin

					let i = 0
					while (size < moveSize - safeMargin) {
						const index = step < 0
							? children.length - 1 - (i % children.length)
							: i % children.length
						size += widths[reverseLookup(index)]

						i = i + 1 // next
					}

					return i
				}

				// add cloneNode
				for (let i = 0, count = getCloneCount(); i < count; i++) {
					const index = step < 0
						? children.length - 1 - (i % children.length) + i
						: i % children.length
					const child = ul.children[index] as HTMLLIElement

					if (child) {
						const clone = child.cloneNode(true) as HTMLLIElement

						if (step < 0) {
							ul.insertBefore(clone, ul.firstChild)
						} else {
							ul.appendChild(clone)
						}

						carouselPrivateState.cloneNodes.push(clone)
					}
				}

				// get startOffset, targetOffset
				const nodeA = ul.children[0] as HTMLLIElement
				const nodeB = ul.children[Math.abs(step)] as HTMLElement
				const rectA = nodeA.getBoundingClientRect()
				const rectB = nodeB.getBoundingClientRect()

				carouselPrivateState.startOffset  = step < 0 ? rectB.left - rectA.left : 0
				carouselPrivateState.targetOffset = step < 0 ? 0 : rectB.left - rectA.left
			}

			// 移動位置を取得
			const currentOffset = - carouselPrivateState.startOffset
				- (carouselPrivateState.targetOffset - carouselPrivateState.startOffset)
				* easing(rafTask.progress)

			// style 適用
			ul.style.transform = `translateX(${ currentOffset }px)`

			// result
			return [state, (dispatch: Dispatch<S>) => {
				// アクション割り込み
				const fn = carouselState.action
				if (fn) {
					requestAnimationFrame(() => dispatch((state: S) => fn(state, rafTask)))
				}
			}]
		}

		// finish
		const finish = (state: S, rafTask: RAFTask<S>): S | [S, InternalEffect<S>] => {
			// get carouselState
			const carouselState: CarouselState<S> = rafTask.extension?.carouselState
			if (!carouselState) return state

			// ul が消えていれば終了
			if (!carouselPrivateState.ul.isConnected) {
				rafTask.isDone = true
				return state
			}

			// 一時停止中であれば終了
			if (rafTask.paused) return state

			// クローンしたノードの削除
			carouselPrivateState.cloneNodes.forEach(node => node.remove())
			carouselPrivateState.cloneNodes = []

			// ノードの移動
			for (let i = 0; i < Math.abs(carouselPrivateState.step); i++) {
				if (carouselPrivateState.step < 0) {
					const child = ul.lastChild
					if (child) ul.insertBefore(child, ul.firstChild)
				} else {
					const child = ul.firstChild
					if (child) ul.appendChild(child)
				}
			}

			// style 適用
			ul.style.transform  = "translateX(0px)"
			ul.style.willChange = ""

			// carouselPrivateState の補正
			// index の補正
			const length = carouselPrivateState.ul.children.length
			const index  = carouselPrivateState.index
			const step   = carouselState.step
			carouselPrivateState.index = ((index + step) % length + length) % length
			carouselPrivateState.step = carouselState.step
			carouselPrivateState.startOffset  = 0
			carouselPrivateState.targetOffset = 0

			// 次のタスクを作成
			const newTask = new RAFTask<S>({
				id       : id,
				groupID  : carouselState.groupID,
				duration : carouselState.duration ?? 1000,
				delay    : carouselState.delay ?? 2000,
				action   : action,
				finish   : finish,
				priority : carouselState.priority ?? 0,
				extension: {
					...carouselState.extension,
					carouselState,
					carouselController
				}
			})

			// get tasks
			const tasks = getValue(state, keyNames, [] as RAFTask<S>[])
				.filter(task => task.id !== carouselState.id)

			// new State
			let newState = setValue(state, keyNames, tasks.concat(newTask))

			// reportPageIndex
			if (carouselState.reportPageIndex) {
				// レポートが設定されている場合は、index を指定されたステートに保存する
				newState = setValue(
					newState,
					carouselState.reportPageIndex,
					(((carouselPrivateState.index - step) % children.length) + children.length) % children.length
				)
			} else {
				// レポートが設定されていない場合は、ローカルステートに保存する
				newState = setLocalState(
					newState,
					id,
					{
						index: (((carouselPrivateState.index - step) % children.length) + children.length) % children.length
					}
				)
			}

			// result
			return [newState, (dispatch: Dispatch<S>) => {
				// アクション割り込み
				const fn = carouselState.finish
				if (fn) {
					requestAnimationFrame(() => dispatch((state: S) => fn(state, rafTask)))
				}
			}]
		}

		// set GPU Layer
		ul.style.willChange = "transform"

		// dispatch
		dispatch((state: S) => {
			// get tasks
			const tasks = getValue(state, keyNames, [] as RAFTask<S>[])
				.filter(task => task.id !== carouselState.id)

			// create task
			const task = new RAFTask({
				id       : carouselState.id,
				groupID  : carouselState.groupID,
				duration : 0,
				delay    : 0,
				action   : (state: S, rafTask: RAFTask<S>) => state,
				finish   : finish,
				priority : carouselState.priority ?? 0,
				extension: {
					...carouselState.extension,
					carouselState,
					carouselController
				}
			})

			// result
			return setValue(state, keyNames, tasks.concat(task))
		})
	}
}
