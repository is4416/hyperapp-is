// ---------- ---------- ---------- ---------- ----------
// import
// ---------- ---------- ---------- ---------- ----------

// hyperapp
import { Dispatch, Effect } from "hyperapp"

// hyperapp-is
import { getValue, setValue } from "./state"

// ---------- ---------- ---------- ---------- ----------
// exports
// ---------- ---------- ---------- ---------- ----------

export {
	effect_toast
}

// ---------- ---------- ---------- ---------- ----------
// implementation
// ---------- ---------- ---------- ---------- ----------
/**
 * 一定時間値を設定した後、元の値に戻す
 */
const effect_toast = function <S> (
	props: {
		keyNames : string[]
		value    : any
		duration?: number
	}
): Effect<S> {
	const { keyNames, value, duration = 2000 } = props

	const fn = (dispatch: Dispatch<S>, thisValue: any) => {
		setTimeout(() => {
			dispatch((state: S) => {
				if (getValue(state, keyNames, undefined) !== value) return state
				return setValue(state, keyNames, thisValue)
			})
		}, duration)
	} // end fn

	return (dispatch: Dispatch<S>) => {
		dispatch((state: S) => {
			const thisValue = getValue(state, keyNames, undefined)
			fn(dispatch, thisValue)
			return setValue(state, keyNames, value)
		})
	}
}
