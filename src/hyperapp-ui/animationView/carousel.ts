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
 */
export interface CarouselController <S> {
	step       : (rafTask: RAFTask<S>, delta: number, callback?: (rafTask: RAFTask<S>) => void) => void
	rollBack   : (rafTask: RAFTask<S>, callback?: (rafTask: RAFTask<S>) => void) => void
	rollForward: (rafTask: RAFTask<S>, callback?: (rafTask: RAFTask<S>) => void ) => void
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
	// ただし、前回のローカルステートが残っている可能性がある
	// 今の所回避方法が思いつかない
	// スタートの表示順番がずれる程度なので、とりあえず気にしないことにする
	const index = carouselState?.reportPageIndex
		? getValue(state, carouselState.reportPageIndex, 0)
		: getLocalState(state, id, { index: 0 }).index

	// children
	const items = Array.isArray(children) ? children : [children]

	// action_mouseenter
	const action_mouseenter = (state: S) => {
		const rafTask = getValue(state, keyNames, [] as RAFTask<S>[])
			.find(task => task.id === id)
		if (!rafTask) return state

		if (rafTask.progress < 0.4) {
			controller.rollBack(rafTask)
		} else {
			controller.rollForward(rafTask)
		}

		return state
	}

	// action_mouseleave
	const action_mouseleave = (state: S) => {
		// 実装やりなおし
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
			items.map(item => li({}, item))
		),
		controlBar && div({},
			ul({},
				items.map((item, i) => li({
					class: i === index && "select"
				}, "○"))
			)
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
		// クローンが混在している可能性があるので、排除する
		const children = (Array.from(ul.children) as HTMLLIElement[])
			.filter(child => {
				if (child.classList.contains("carousel_clone")) {
					child.remove()
					return false
				}
				return true
			})
		if (!children || children.length === 0) return

		// get widths
		const widths: number[] = []
		for (let i = 0; i < children.length; i++) {
			widths[i] = children[i].getBoundingClientRect().width
		}

		// CarouselPrivateState
		const carouselPrivateState: CarouselPrivateState = {
			ul           : ul,
			index        : 0,
			step         : 0,
			startOffset  : 0,
			targetOffset : 0,
			currentOffset: 0,
			cloneNodes   : []
		}

		// CarouselController
		const carouselController: CarouselController <S> = {

			// step
			step: (rafTask: RAFTask<S>, delta: number, callback?: (rafTask: RAFTask<S>) => void): void => {
			},

			// rollBack
			rollBack: (rafTask: RAFTask<S>, callback?: (rafTask: RAFTask<S>) => void) => {
				// progress === 0 で終了
				if (rafTask.progress === 0) return

				// 一時停止
				const paused = rafTask.paused
				rafTask.paused = true

				// get carouselState
				const carouselState: CarouselState<S> = rafTask.extension?.carouselState
				if (!carouselState) return

				// ul が消えていれば終了
				if (!carouselPrivateState.ul.isConnected) {
					rafTask.isDone = true
					return
				}

				// クローン作成
				const cloneTask = rafTask.clone()

				// newTask
				const newTask = new RAFTask<S>({
					id      : `${ rafTask.id }_rollBack`,
					duration: SKIP_SPEED,
					delay   : 0,
					action: (state: S, rafTask: RAFTask<S>): S | [S, InternalEffect<S>] => {
						const val = carouselPrivateState.currentOffset
							+ (carouselPrivateState.startOffset - carouselPrivateState.currentOffset)
							* rafTask.progress
						carouselPrivateState.currentOffset = val
						carouselPrivateState.ul.style.transform = `translateX(${ val }px)`
						return state
					},
					finish: (state: S, rafTask: RAFTask<S>): S | [S, InternalEffect<S>] => {
						cloneTask.paused = paused
						const tasks = getValue(state, keyNames, [] as RAFTask<S>[])
							.filter(task => task.id !== rafTask.id)
							.concat(cloneTask)
						return [
							setValue(state, keyNames, tasks),
							(dispatch: Dispatch<S>) => {
								if (callback) callback(cloneTask)
							}
						]
					}
				}) // end newTask

				// dispatch
				requestAnimationFrame(() => {
					dispatch((state: S) => {
						const tasks = getValue(state, keyNames, [] as RAFTask<S>[])
							.filter(task => task.id !== rafTask.id)
							.concat(newTask)
						return setValue(state, keyNames, tasks)
					})
				})
			},

			// rollForward
			rollForward: (rafTask: RAFTask<S>, callback?: (rafTask: RAFTask<S>) => void) => {

				// 一時停止
				const paused = rafTask.paused
				rafTask.paused = true

				// get carouselState
				const carouselState: CarouselState<S> = rafTask.extension?.carouselState
				if (!carouselState) return

				// ul が消えていれば終了
				if (!carouselPrivateState.ul.isConnected) {
					rafTask.isDone = true
					return
				}

				// クローン作成
				const cloneTask = rafTask.clone()

				// newTask
				const newTask = new RAFTask<S>({
					id      : `${ rafTask.id }_rollForward`,
					duration: SKIP_SPEED,
					delay   : 0,
					action: (state: S, rafTask: RAFTask<S>): S | [S, InternalEffect<S>] => {
						const val = carouselPrivateState.currentOffset
							+ (carouselPrivateState.targetOffset - carouselPrivateState.currentOffset)
							* rafTask.progress
						carouselPrivateState.currentOffset = val
						carouselPrivateState.ul.style.transform = `translateX(${ val }px)`
						return state
					},
					finish: (state: S, rafTask: RAFTask<S>): S | [S, InternalEffect<S>] => {
						cloneTask.paused = paused
						const tasks = getValue(state, keyNames, [] as RAFTask<S>[])
							.filter(task => task.id !== rafTask.id)
							.concat(cloneTask)
						return [
							setValue(state, keyNames, tasks),
							(dispatch: Dispatch<S>) => {
								const fn = cloneTask.finish
								if (fn) {
									requestAnimationFrame(() => {
										dispatch((state: S) => fn(state, cloneTask))
										if (callback) callback(cloneTask)
									})
								} else {
									if (callback) callback(cloneTask)
								}
							}
						]
					}
				}) // end newTask

				// dispatch
				requestAnimationFrame(() => {
					dispatch((state: S) => {
						const tasks = getValue(state, keyNames, [] as RAFTask<S>[])
							.filter(task => task.id !== rafTask.id)
							.concat(newTask)
						return setValue(state, keyNames, tasks)
					})
				})
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

						// 初回時にすでにクローンが存在する可能性がある
						// どうしても DOM に判別用のキーが必要なので追加する
						clone.classList.add("carousel_clone")

						carouselPrivateState.cloneNodes.push(clone)
					}
				}

				// get startOffset, targetOffset
				const nodeA = ul.children[0] as HTMLLIElement
				const nodeB = ul.children[Math.abs(step)] as HTMLElement
				const rectA = nodeA.getBoundingClientRect()
				const rectB = nodeB.getBoundingClientRect()

				carouselPrivateState.startOffset  = step < 0 ? rectA.left - rectB.left : 0
				carouselPrivateState.targetOffset = step < 0 ? 0 : rectA.left - rectB.left
			}

			// 現在位置を作成
			carouselPrivateState.currentOffset = carouselPrivateState.startOffset
				+ (carouselPrivateState.targetOffset - carouselPrivateState.startOffset)
				* easing(rafTask.progress)

			// style 適用
			ul.style.transform = `translateX(${ carouselPrivateState.currentOffset }px)`

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
