// ---------- ---------- ---------- ---------- ----------
// exports
// ---------- ---------- ---------- ---------- ----------

export {
	withLoadingDialog
}

// ---------- ---------- ---------- ---------- ----------
// implementation
// ---------- ---------- ---------- ---------- ----------
/**
 * タスク実行中にローディングダイアログを表示する
 * onCancel を指定した場合は、Esc キーで onCancel が呼び出される
 */
const withLoadingDialog = async function <T> (
	task     : () => Promise<T>,
	onCancel?: () => void
): Promise<T> {

	// dialog
	const dialog = document.createElement("dialog")
	dialog.className = "withLoadingDialog"

	// Esc
	let canceled = false

	dialog.addEventListener("cancel", e => {
		if (!onCancel) {
			e.preventDefault()
			return
		}

		if (canceled) return
		canceled = true

		onCancel()
	})

	dialog.style.margin          = "auto auto"
	dialog.style.padding         = "0"
	dialog.style.border          = "0"
	dialog.style.outline         = "none"
	dialog.style.backgroundColor = "transparent"

	// svg
	const svg = document.createElementNS(
		"http://www.w3.org/2000/svg",
		"svg"
	)
	svg.setAttribute("viewBox", "0 -960 960 960")
	svg.setAttribute("width", "24px")
	svg.setAttribute("height", "24px")
	svg.setAttribute("fill", "#1F1F1F")

	svg.animate(
		[
			{ transform: "rotate(0deg)" },
			{ transform: "rotate(360deg)" }
		],
		{
			duration  : 1000,
			iterations: Infinity,
			easing    : "linear"
		}
	)

	// path
	const path = document.createElementNS(
		"http://www.w3.org/2000/svg",
		"path"
	)
	path.setAttribute(
		"d",
		"M325-111.5q-73-31.5-127.5-86t-86-127.5Q80-398 80-480.5t31.5-155q31.5-72.5 86-127t127.5-86Q398-880 480-880q17 0 28.5 11.5T520-840q0 17-11.5 28.5T480-800q-133 0-226.5 93.5T160-480q0 133 93.5 226.5T480-160q133 0 226.5-93.5T800-480q0-17 11.5-28.5T840-520q17 0 28.5 11.5T880-480q0 82-31.5 155t-86 127.5q-54.5 54.5-127 86T480.5-80Q398-80 325-111.5Z"
	)

	// span
	const span = document.createElement("span")
	span.textContent = "Loading..."

	span.style.marginLeft = "0.5rem"

	// append
	svg.appendChild(path)

	dialog.appendChild(svg)
	dialog.appendChild(span)

	// result
	let timerID: number | undefined = undefined

	try {
		timerID = setTimeout(() => {
			if (timerID === undefined) return

			document.body.appendChild(dialog)

			try {
				dialog.showModal()
			} catch {
				dialog.remove()
			}
		}, 250)

		return await task()

	} finally {

		// clear timer
		if (timerID !== 0) {
			clearTimeout(timerID)
			timerID = undefined
		}

		// remove dialog
		if (dialog.open) dialog.close()
		dialog.remove()
	}
}
