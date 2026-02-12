// ---------- ---------- ---------- ---------- ----------
// import
// ---------- ---------- ---------- ---------- ----------

import { VNode, Dispatch } from "hyperapp"
import { getValue, setValue, getLocalState, setLocalState } from "../core/state"
import { el, concatAction, getClassList, deleteKeys } from "../core/component"
import { InternalEffect, RAFEvent, RAFTask, subscription_RAFManager } from "../animation/raf"

/*
	effect_InitCarousel で、DOM のサイズを事前に積む方式だと、致命的に可変サイズに向かないことが判明
	ループの最初で、都度 offsetLeft を見て移動サイズを確定させる方式に変更することとする
	また、step を最初につくることで、rollBack / rollForward は省力化できる
	同時に通常ループも step 経由となるため、まず実装するのは Controller.step になる

	おそらく carouselPrivateState に必要な情報も変更になるので、見直し

	なかなかの書き直しとなりました TT

	コンポーネントの UL は、display: flex に固定することとします
	最初から、必要なスタイルをスタイルをある程度組み込むことにします
*/


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
// interface CarouselController
// ---------- ---------- ---------- ---------- ----------
/**
 * 外部から Carousel コンポーネントを操作するためのクラス
 * RAFTask.extension に保存する
 * 
 * @template S
 * @typedef {Object} CarouselController
 */
export interface CarouselController <S> {
	step       : (rafTask: RAFTask<S>, delta: number) => Promise <RAFTask<S>>
	rollBack   : (rafTask: RAFTask<S>) => Promise <RAFTask<S>>
	rollForward: (rafTask: RAFTask<S>) => Promise <RAFTask<S>>
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

	// ---------- ---------- ----------
	// action_mouseenter
	// ---------- ---------- ----------
	/**
	 * rafTask.progress の値に応じて、rollBack / rollForward を行う
	 */
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
	} // end action_mouseenter

	// ---------- ---------- ----------
	// action_mouseleave
	// ---------- ---------- ----------
	/**
	 * pause 解除
	 */
	const action_mouseleave = (state: S) => {
		const task = getValue(state, keyNames, [] as RAFTask<S>[])
			.find(task => task.id === id)
		if (!task) return state

		task.paused = false

		return state
	}

	// ---------- ---------- ----------
	// action_controlBarClick
	// ---------- ---------- ----------
	/**
	 * マニュアルページ移動
	 */
	const action_controlBarClick = (state: S, index: number) => {
		const rafTask = getValue(state, keyNames, [] as RAFTask<S>[])
			.find(task => task.id === id)
		if (!rafTask) return state

		controller.step(rafTask, index)

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
		controlBar && div({},
			ul({},
				items.map((item, i) => li({
					class: i === index && "select",
					onclick: [action_controlBarClick, i]
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

	// const
	const SKIP_SPEED = 200

	// get id
	const id = carouselState.id

	// effect_InitCarousel.dispatch
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

		// ---------- ---------- ----------
		// CarouselPrivateState
		// ---------- ---------- ----------

		const carouselPrivateState: CarouselPrivateState = {
			ul           : ul,
			index        : 0,
			step         : 0,
			startOffset  : 0,
			targetOffset : 0,
			currentOffset: 0,
			cloneNodes   : []
		}

		// ---------- ---------- ----------
		// function reverseLookup
		// ---------- ---------- ----------
		/**
		 * 相対インデックを絶対インデックスに変換
		 * クローンがある場合は動作しません
		 * 
		 * @param   {number} index - 相対インデックス
		 * @returns {number}       - 絶対インデックス
		 */
		const reverseLookup = (index: number) => {
			const leftIndex = carouselPrivateState.index
			return ((index - leftIndex) % children.length + children.length) % children.length
		}

		// ---------- ---------- ----------
		// function getMoveSize
		// ---------- ---------- ----------
		/**
		 * carouselPrivate.step を参照し、必要となる移動量を返す
		 */
		const getMoveSize = () => {
			let result  = 0

			for (let i = 0; i < Math.abs(carouselPrivateState.step); i++) {
				const index = carouselPrivateState.step < 0
					? children.length - 1 - (i % children.length)
					: i % children.length
				result += widths[reverseLookup(index)]
			}

			return result
		} // end function getMoveSize

		// ---------- ---------- ----------
		// function getCloneCount
		// ---------- ---------- ----------
		/**
		 * carouselPrivate.step を参照し、必要となるクローンの数を返す
		 */
		const getCloneCount = () => {

			let size = 0
			const safeMargin = 1 // 丸め誤差を考慮したマージン
			const moveSize   = getMoveSize() + safeMargin

			let i = 0
			while (size < moveSize - safeMargin) {
				const index = carouselPrivateState.step < 0
					? children.length - 1 - (i % children.length)
					: i % children.length
				size += widths[reverseLookup(index)]

				i = i + 1 // next
			}

			return i
		} // end getCloneCount

		// ---------- ---------- ----------
		// addClones
		// ---------- ---------- ----------
		/**
		 * クローンを作成し追加する
		 * クローンは、carouselPrivateState.cloneNodes に追加される
		 * 作成済みのクローンは消去されない
		 * クローンには、クラス名 `carousel_clone` が追加される
		 * 
		 * @param {number} count - 追加するクローンの数
		 * @returns {void}
		 */
		const addClones = (count: number) => {
			for (let i = 0; i < count; i++) {

				// step < 0 の場合は、後ろから順に
				// step > 0 の場合は、前から順にクローンする
				const index = carouselPrivateState.step < 0
					? children.length - 1 - (i % children.length) + i
					: i % children.length
				const child = ul.children[index] as HTMLLIElement

				// クローンの挿入
				if (child) {

					// clone
					const clone = child.cloneNode(true) as HTMLLIElement

					// step < 0 の場合は、一番最後に
					// step > 0 の場合は、一番前にクローンを挿入する
					if (carouselPrivateState.step < 0) {
						ul.insertBefore(clone, ul.firstChild)
					} else {
						ul.appendChild(clone)
					}

					// 初回時にすでにクローンが存在する可能性がある
					// どうしても DOM に判別用のキーが必要なので追加する
					clone.classList.add("carousel_clone")

					// クローン作成状況を登録する
					carouselPrivateState.cloneNodes.push(clone)
				}
			}
		} // end addClones

		// ---------- ---------- ----------
		// CarouselController
		// ---------- ---------- ----------

		const carouselController: CarouselController <S> = {

			// ---------- ---------- ----------
			// step
			// ---------- ---------- ----------

			step: (rafTask: RAFTask<S>, delta: number): Promise <RAFTask<S>> => {
				return new Promise((resolve, reject) => {

					// get carouselState
					const carouselState: CarouselState<S> = rafTask.extension?.carouselState
					if (!carouselState) return reject()

					// ul が消えていれば終了
					if (!carouselPrivateState.ul.isConnected) {
						rafTask.isDone = true
						return reject()
					}

					// 一時停止
					const paused = rafTask.paused
					rafTask.paused = true

					// ---------- ---------- ----------
					// function getCurrentPosition
					// ---------- ---------- ----------
					/**
					 * 現在場所の情報を取得する
					 * offset も必要かなあ？
					 * 
					 * absoluteIndex - 絶対 index
					 * relativeIndex - 相対 index
					 */
					const getCurrentPosition = (): {
						absoluteIndex: number
						relativeIndex: number
					} | null => {
						let index    = - 1 // 相対 index
						let absolute = - 1 // 絶対 index

						const border = Math.abs(carouselPrivateState.currentOffset)
						const items  = carouselPrivateState.ul.children
						for (let i = 0, size = 0; i < items.length; i++) {
							size += items[i].getBoundingClientRect().width
							if (size >= border) {
								index = i
								break
							}
						}
						if (index === -1) return null

						// 移動前の index (絶対値)
						const baseIndex = ((carouselPrivateState.index - carouselPrivateState.step) % children.length + children.length) % children.length

						// 現在の index (絶対値)
						absolute = ((baseIndex
							- (
								carouselPrivateState.step < 0
									? children.length - 1 - index
									: - index
							)) % children.length + children.length) % children.length

						return {
							absoluteIndex: absolute,
							relativeIndex: index,
						}
					} // end getCurrentPosition

					// index (絶対値) を取得
					const currentPosition = getCurrentPosition()
					if (!currentPosition) return reject()

					// 移動先を取得 (現在地からの相対)
					const stepTo = currentPosition.relativeIndex + (delta - currentPosition.absoluteIndex)

					// とりあえずクローン先はあるものとして動作確認
					const targetOffset = - (carouselPrivateState.ul.children[stepTo] as HTMLLIElement).offsetLeft

					// 移動先の決定
					carouselPrivateState.startOffset  = carouselPrivateState.currentOffset
					carouselPrivateState.index        = currentPosition.absoluteIndex
					carouselPrivateState.targetOffset = targetOffset

					// cloneTask
					const cloneTask = rafTask.clone()

					// action
					const action = (state: S, rafTask: RAFTask<S>): S | [S, InternalEffect<S>] => {
						const val = carouselPrivateState.startOffset
							+ (carouselPrivateState.targetOffset - carouselPrivateState.startOffset)
							* rafTask.progress
						carouselPrivateState.ul.style.transform = `translateX(${ val }px)`
						carouselPrivateState.currentOffset = val
						return state
					}

					// finish
					const finish = (state: S, rafTask: RAFTask<S>): S | [S, InternalEffect<S>] => {
						let newState = state
alert("finish")
						if (carouselState.reportPageIndex) {
							newState = setValue(
								newState,
								carouselState.reportPageIndex,
								delta - currentPosition.absoluteIndex // 仮
							)
						} else {
							newState = setLocalState(
								newState,
								id,
								{ index: delta - currentPosition.absoluteIndex} // 仮
							)
						}

						const tasks = getValue(state, keyNames, [] as RAFTask<S>[])
							.filter(task => task.id !== `${ task.id }_step`)
							.concat(cloneTask)
						
						return [
							setValue(newState, keyNames, tasks),
							(dispatch: Dispatch<S>) => {
								const fn = cloneTask.finish
								if (fn) {
									requestAnimationFrame(() => dispatch((state: S) => [fn, cloneTask]))
								}
								resolve(cloneTask)
							}
						]
					}

					// newTask
					const newTask = new RAFTask<S>({
						id: `${ rafTask.id }_step`,
						duration: 2000,
						action,
						finish
					})

					requestAnimationFrame(() => {
						dispatch((state: S) => {
							const tasks = getValue(state, keyNames, [] as RAFTask<S>[])
								.filter(task => task.id !== id)
								.concat(newTask)
							return setValue(state, keyNames, tasks)
						})
					})

					// 追加で必要なクローンノードの作成
					// 移動 (現在地からクローンノードの左端まで)
					// DOM 入れ替え
					// index 再設定
					// finish

					
				}) // end Promise
			}, // end CarouselController.step

			// ---------- ---------- ----------
			// rollBack
			// ---------- ---------- ----------

			rollBack: (rafTask: RAFTask<S>): Promise <RAFTask<S>> => {
				return new Promise((resolve, reject) => {

					// progress === 0 で終了
					if (rafTask.progress === 0) return reject()

					// 一時停止
					const paused = rafTask.paused
					rafTask.paused = true

					// get carouselState
					const carouselState: CarouselState<S> = rafTask.extension?.carouselState
					if (!carouselState) return reject()

					// ul が消えていれば終了
					if (!carouselPrivateState.ul.isConnected) {
						rafTask.isDone = true
						return reject()
					}

					// クローン作成
					const cloneTask = rafTask.clone()

					// ---------- ---------- ----------
					// rollBack.newTask
					// ---------- ---------- ----------

					const newTask = new RAFTask<S>({
						id      : `${ rafTask.id }_rollBack`,
						duration: SKIP_SPEED,
						delay   : 0,

						// action
						action: (state: S, rafTask: RAFTask<S>): S | [S, InternalEffect<S>] => {
							const val = carouselPrivateState.currentOffset
								+ (carouselPrivateState.startOffset - carouselPrivateState.currentOffset)
								* rafTask.progress
							carouselPrivateState.currentOffset = val
							carouselPrivateState.ul.style.transform = `translateX(${ val }px)`
							return state
						},

						// finish
						finish: (state: S, rafTask: RAFTask<S>): S | [S, InternalEffect<S>] => {
							cloneTask.paused = paused
							const tasks = getValue(state, keyNames, [] as RAFTask<S>[])
								.filter(task => task.id !== rafTask.id)
								.concat(cloneTask)
							return [
								setValue(state, keyNames, tasks),
								(dispatch: Dispatch<S>) => {
									// if (callback) callback(cloneTask)
									resolve(cloneTask)
								}
							]
						}
					}) // end rollBack.newTask

					// rollBack.dispatch
					requestAnimationFrame(() => {
						dispatch((state: S) => {
							const tasks = getValue(state, keyNames, [] as RAFTask<S>[])
								.filter(task => task.id !== rafTask.id)
								.concat(newTask)
							return setValue(state, keyNames, tasks)
						})
					})
				})
			}, // end CarouselController.rollBack

			// ---------- ---------- ----------
			// rollForward
			// ---------- ---------- ----------

			rollForward: (rafTask: RAFTask<S>): Promise <RAFTask<S>> => {
				return new Promise((resolve, reject) => {

					// 一時停止
					const paused = rafTask.paused
					rafTask.paused = true

					// get carouselState
					const carouselState: CarouselState<S> = rafTask.extension?.carouselState
					if (!carouselState) return reject()

					// ul が消えていれば終了
					if (!carouselPrivateState.ul.isConnected) {
						rafTask.isDone = true
						return reject()
					}

					// クローン作成
					const cloneTask = rafTask.clone()

					// ---------- ---------- ----------
					// rollForward.newTask
					// ---------- ---------- ----------

					const newTask = new RAFTask<S>({
						id      : `${ rafTask.id }_rollForward`,
						duration: SKIP_SPEED,
						delay   : 0,

						// action
						action: (state: S, rafTask: RAFTask<S>): S | [S, InternalEffect<S>] => {
							const val = carouselPrivateState.currentOffset
								+ (carouselPrivateState.targetOffset - carouselPrivateState.currentOffset)
								* rafTask.progress
							carouselPrivateState.currentOffset = val
							carouselPrivateState.ul.style.transform = `translateX(${ val }px)`
							return state
						},

						// finish
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
										requestAnimationFrame(() => dispatch((state: S) => [fn, cloneTask]))
									}
									resolve(cloneTask)
								}
							]
						}
					}) // end rollForward.newTask

					// dispatch
					requestAnimationFrame(() => {
						dispatch((state: S) => {
							const tasks = getValue(state, keyNames, [] as RAFTask<S>[])
								.filter(task => task.id !== rafTask.id)
								.concat(newTask)
							return setValue(state, keyNames, tasks)
						})
					})
				})
			} // end rollForward

		} // end CarouselController

		// ---------- ---------- ----------
		// action
		// ---------- ---------- ----------

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

				// remove cloneNodes
				carouselPrivateState.cloneNodes.forEach(node => node.remove())
				carouselPrivateState.cloneNodes = []

				// add cloneNodes
				addClones(getCloneCount())

				// get startOffset, targetOffset
				// get Rect
				const nodeA = ul.children[0] as HTMLLIElement
				const nodeB = ul.children[Math.abs(carouselPrivateState.step)] as HTMLElement
				const rectA = nodeA.getBoundingClientRect()
				const rectB = nodeB.getBoundingClientRect()

				// get Offset
				carouselPrivateState.startOffset  = carouselPrivateState.step < 0 ? rectA.left - rectB.left : 0
				carouselPrivateState.targetOffset = carouselPrivateState.step < 0 ? 0 : rectA.left - rectB.left
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
					requestAnimationFrame(() => dispatch((state: S) => [fn, rafTask]))
				}
			}]
		} // end action

		// ---------- ---------- ----------
		// finish
		// ---------- ---------- ----------

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
					requestAnimationFrame(() => dispatch((state: S) => [fn, rafTask]))
				}
			}]
		} // end finith

		// set GPU Layer
		ul.style.willChange = "transform"

		// effect_InitCarousel.dispatch
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
		}) // end effect_InitCarousel.dispatch

	} // end result
}
