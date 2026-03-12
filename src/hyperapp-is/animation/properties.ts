// hyperapp-is / animation / properties.ts

import { Dispatch } from "hyperapp"
import { getValue, setValue } from "../core/state"
import { InternalEffect, RAFTask } from "./raf"

// ---------- ---------- ---------- ---------- ----------
// interface CSSProperty
// ---------- ---------- ---------- ---------- ----------
/**
 * アニメーション進捗 (0〜1) を受け取り CSS 値を返す関数
 *
 * @type {Object.<string, Object.<string, (progress: number) => string>>} CSSProperty
 * @property {Object.<string, (progress: number) => string>} [selector]
 * @param {number} progress
 */
export interface CSSProperty {
	[selector: string]: {
		[name: string]: (progress: number) => string
	}
}

// ---------- ---------- ---------- ---------- ----------
// createUnits
// ---------- ---------- ---------- ---------- ----------
/**
 * CSSProperty[] から、doms と styles のセットに変換
 * 
 * @param   {CSSProperty[]} properties - プロパティ配列
 * @returns {doms: HTMLElement[], styles:{ [name: string]: (progress: number) => string}}
 */
export const createUnits = function (
	properties: CSSProperty[]
): {
	doms  : HTMLElement[],
	styles: {
		[name: string]: (progress: number) => string
	}
}[] {
	return properties.map(p => {
		const selector = Object.keys(p)[0]
		return {
			doms : Array.from(document.querySelectorAll<HTMLElement>(selector)),
			styles: p[selector]
		}
	})
}

// ---------- ---------- ---------- ---------- ----------
// createRAFProperties
// ---------- ---------- ---------- ---------- ----------
/**
 * subscription_RAFManager をベースにした CSS アニメーション RAFTask を作成する
 * props は基本的に RAFTask の値
 * 
 * @param {CSSProperty[]} props.properties - セレクタとスタイル設定のセット配列
 */
export const createRAFProperties = function <S> (
	props: {
		id      : string
		groupID?: string
		duration: number
		delay  ?: number

		finish?: (state: S, rafTask: RAFTask<S>) => S | [S, InternalEffect<S>]

		priority ?: number
		extension?: Record<string, any>

		properties: CSSProperty[]
	}
): RAFTask<S> {
	const { id, groupID, duration, delay, priority, extension, properties } = props

	// action
	const action = (state: S, rafTask: RAFTask<S>): S | [S, InternalEffect<S>] => {
		const progress = rafTask.progress ?? 0
		const units = createUnits(properties)

		// set styles
		units.forEach(unit => {
			for (const [name, fn] of Object.entries(unit.styles)) {
				unit.doms.forEach(dom => dom.style.setProperty(name, fn(progress)))
			}
		})

		return state
	}

	// finish
	const finish = (state: S, rafTask: RAFTask<S>): S | [S, InternalEffect<S>] => {
		const units = createUnits(properties)

		// release gpu layer
		units.forEach(unit => {
			unit.doms.forEach(dom => dom.style.willChange = "")
		})

		return [
			state,
			(dispatch: Dispatch<S>) => {
				const fn = props.finish
				if (fn) {
					requestAnimationFrame(() =>
						requestAnimationFrame(() =>
							dispatch((state: S) => fn(state, rafTask))
						)
					)
				}
			}
		]
	}

	return new RAFTask<S>({
		id, groupID, duration, delay,
		action, finish,
		priority,
		extension: {
			...extension,
			properties
		}
	})
}

// ---------- ---------- ---------- ---------- ----------
// effect_RAFProperties
// ---------- ---------- ---------- ---------- ----------
const GPU_LAYER = new Set(["transform", "opacity"])

/**
 * subscription_RAFManager をベースにした CSS アニメーションエフェクト
 * props は基本的に RAFTask の値
 * 
 * @param {CSSProperty[]} props.properties - セレクタとスタイル設定のセット配列
 * @param {string[]}      props.keyNames   - RAFTask 配列までのパス
 */
export const effect_RAFProperties = function <S> (
	props: {
		id      : string
		groupID?: string
		duration: number
		delay  ?: number

		finish?: (state: S, rafTask: RAFTask<S>) => S | [S, InternalEffect<S>]

		priority ?: number
		extension?: Record<string, any>

		properties: CSSProperty[]
		keyNames  : string[]
	}
): (dispatch : Dispatch<S>) => void {
	const { id, groupID, duration, delay, finish, priority, extension, properties, keyNames} = props

	// get doms
	const units = createUnits(properties)

	// set GPU Layer
	units.forEach(unit => {
		const val = [...new Set(Object.keys(unit.styles))].filter(name => GPU_LAYER.has(name)).join(",")
		unit.doms.forEach(dom => dom.style.willChange = val)
	})

	// newTask
	const newTask = createRAFProperties({
		id, groupID, duration, delay, finish, priority, extension, properties
	})

	// set newTask
	return (dispatch: Dispatch<S>) => {
		requestAnimationFrame(() => {
			dispatch((state: S) => {
				const tasks = getValue(state, keyNames, [] as RAFTask<S>[])
					.filter(task => task.id !== id)
					.concat(newTask)
				
				return setValue(state, keyNames, tasks)
			})
		})
	}
}
