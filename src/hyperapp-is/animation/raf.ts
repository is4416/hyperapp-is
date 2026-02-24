// hyperapp-ui / animation / raf.ts

import { Dispatch, Effect, Subscription } from "hyperapp"
import { getValue, setValue } from "../core/state"

// ---------- ---------- ---------- ---------- ----------
// type InternalEffect
// ---------- ---------- ---------- ---------- ----------
/**
 * 戻値としては返されないことを示したエフェクト
 * Effect の型エイリアス
 */
export type InternalEffect<S> = Effect<S>

// ---------- ---------- ---------- ---------- ----------
// type RAFEvent
// ---------- ---------- ---------- ---------- ----------
/**
 * RAFTask の action, finish
 * 型エイリアス
 */
export type RAFEvent<S> = (state: S, rafTask: RAFTask<S>) => S | [S, InternalEffect<S>]

// ---------- ---------- ---------- ---------- ----------
// class RAFTask
// ---------- ---------- ---------- ---------- ----------

// Symbol
// subscription_RAFManager のみで使用される専用メソッド
// Symbol を知らない限り、モジュールの外からは呼べない
const _isStart = Symbol("RAFTask.isStart")

export class RAFTask <S> {
	// field
	#id        : string
	#groupID  ?: string
	#duration  : number
	#delay     : number
	#action    : RAFEvent<S>
	#finish   ?: RAFEvent<S>
	#priority  : number
	#extension : { [key: string]: any }

	#startTime  ?: number
	#currentTime?: number
	#pausedTime ?: number
	#paused      : boolean

	#deltaTime?: number

	#isDone: boolean

	// constructor
	constructor (props: {
		id        : string
		groupID  ?: string
		duration  : number
		delay    ?: number
		action    : RAFEvent<S>
		finish   ?: RAFEvent<S>
		priority ?: number
		extension?: { [key: string]: any }
	}) {
		this.#id        = props.id
		this.#groupID   = props.groupID
		this.#duration  = props.duration
		this.#delay     = props.delay ?? 0
		this.#action    = props.action
		this.#finish    = props.finish
		this.#priority  = props.priority ?? 0
		this.#extension = props.extension ?? {}
		this.#isDone    = false
		this.#paused    = false
	}

	// getter
	get id()         : string { return this.#id }
	get groupID()    : string | undefined { return this.#groupID }
	get duration()   : number { return this.#duration }
	get delay()      : number { return this.#delay }
	get action()     : RAFEvent<S> { return this.#action }
	get finish()     : RAFEvent<S> | undefined { return this.#finish }
	get priority()   : number { return this.#priority }
	get extension()  : { [key: string]: any } { return this.#extension }
	get progress()   : number {
		if (this.#startTime === undefined || this.#currentTime === undefined) return 0
		return Math.min(
			1,
			Math.max(
				0,
				(this.#currentTime - this.#startTime) /
				Math.max(1, this.#duration)
			)
		)
	}
	get deltaTime(): number { return this.#deltaTime ?? 0 }
	get isDone()   : boolean {
		if (this.#isDone) return true
		if (this.#pausedTime !== undefined) return false
		return this.progress === 1
	}
	get paused()   : boolean { return this.#paused }

	// setter
	set groupID(val: string | undefined) { this.#groupID = val }
	set priority(val: number) { this.#priority = val }
	set extension(val: { [key: string]: any }) { this.#extension = val}
	set isDone(val: boolean) { this.#isDone = val }
	set paused(val: boolean) { this.#paused = val }

	// private method: _isStart
	/**
	 * アクションを開始して良いか判定する
	 * 現在時間等のアップデートも同時に行われる
	 * subscription_RAFManager でのみ使用される
	 * 
	 * @param   {number} now - requestAnimatinFrame が返す絶対時間
	 * @returns {boolan}     - アクションを実行して良いか判定
	 */
	private [_isStart](now: number): boolean {
		// done
		if (this.isDone) return false

		// startTime
		if (this.#startTime === undefined) this.#startTime = now + this.#delay

		// pause
		if (this.paused) {
			if (this.#pausedTime === undefined) this.#pausedTime = now
			this.#deltaTime   = 0
			this.#currentTime = now
			return false
		}

		// resume
		if (!this.paused && this.#pausedTime !== undefined) {
			this.#startTime  = this.#startTime + now - this.#pausedTime
			this.#pausedTime = undefined
		}

		// deltaTime
		this.#deltaTime = now < this.#startTime
			? 0
			: now - (this.#currentTime ?? now)

		// currentTime
		this.#currentTime = now

		// result
		this.#isDone = this.progress === 1
		return !this.#isDone
	}

	// method: clone
	/**
	 * 時間を初期化したクローンを作成して返す
	 */
	clone(): RAFTask<S> {
		return new RAFTask<S> ({
			id       : this.id,
			groupID  : this.groupID,
			duration : this.duration,
			delay    : this.delay,
			action   : this.action,
			finish   : this.finish,
			priority : this.priority,
			extension: this.extension
		})
	}
}

// ---------- ---------- ---------- ---------- ----------
// subscription_RAFManager
// ---------- ---------- ---------- ---------- ----------
/**
 * RAFTask 配列をフレームごとに実行するサブスクリプション
 * 
 * @template S
 * @param   {S}        state    - ステート
 * @param   {string[]} keyNames - RAFTask 配列までのパス
 * @returns {Subscription<S>}
 */
export const subscription_RAFManager = function <S>(
	state   : S,
	keyNames: string[]
): Subscription<S> {
	let rID = 0 // rAF timerID

	// result
	return [
		(dispatch: Dispatch<S>, payload: RAFTask<S>[]) => {
			if (payload.length === 0) return () => {
				if (rID !== 0) cancelAnimationFrame(rID)
			}

			// rAF callback
			const loop = (now: number) => {
				dispatch((state: S) => {
					const tasks = getValue(state, keyNames, [] as RAFTask<S>[])

					const newTasks: RAFTask<S>[] = tasks.map(task => {
						if (task.isDone) return null

						// action
						if (task[_isStart](now)) {
							requestAnimationFrame(() =>
								dispatch((state: S) => task.action(state, task))
							)
						}

						// finish
						if (task.isDone) {
							const fn = task.finish
							if (fn) {
								requestAnimationFrame(() =>
									dispatch((state: S) => fn(state, task))
								)
							}
							return null
						}

						// next
						return task
					}).filter(task => task !== null)

					// next loop
					if (newTasks.length !== 0) rID = requestAnimationFrame(loop)

					// set state
					return setValue(state, keyNames, newTasks)
				})
			}

			// set animation
			rID = requestAnimationFrame(loop)

			// finalize
			return () => {
				if (rID !== 0) cancelAnimationFrame(rID)
			}
		},

		// payload
		getValue(state, keyNames, [] as RAFTask<S>[])
			.filter(task => !task.isDone)
			.sort((a, b) => b.priority - a.priority)
	]
}
