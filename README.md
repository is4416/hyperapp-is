# hyperapp-is

hyperapp 用ユーティリティ集

ライブラリ名の is は、is4416 の is です\
自分用に作成しているユーティリティをまとめたライブラリです

---

## ファイル構成

```
index.ts: エクスポートの一覧

[core]
  ├ state.ts: state 操作に関するもの
  ├ component.ts: VNode の作成に関するもの
  └ effects.ts: Effectに関するもの

[dom]
  ├ utils.ts: DOM 操作に関するユーティリティ
  └ dialog.ts: DOM を利用したダイアログ

[animation]
  ├ raf.ts: requestAnimationFrame を state と連携する仕組み
  ├ easing.ts: イージング関数集
  └ properties.ts: raf.tsを利用した CSS アニメーション

[services]
  └ google.ts: Google 認証ユーティリティ
```

---

## 関数一覧 (interfaceは省略)

**core**
- state: getValue, setValue, getLocalState, setLocalState, createLocalKey
- component: el, concatAction, getClassList, deleteKeys
- effects: effect_toast

**dom**
- utils: getScrollMargin
- dialog: withLoadingDialog

**animation**
- raf: RAFTask, subscription_RAFManager
- easing: progress_easing
- properties: createRAFProperties, effect_RAFProperties

**services**
- google: getAccessToken, GoogleAuth

---

## 使い方

**core**

- `getValue`, `setValue`: keyNames には、取得・設定したい値までのパス

> ステートの構造に依存せずに目的の値が取得・設定できます\
> 汎用コンポーネントの作成に利用できます

例
```js
const state = {
	title: "ユーザー情報",
	user: {
		name: "青年",
		age : 20
	}
}

const title = getValue(state, ["title"], "タイトル情報")  // res: ユーザー情報
const name  = getValue(state, ["user", "name"], "名無し") // res: 青年
const age   = getValue(state, ["user", "age"], 0)         // res: 20
```

---

- `getLocalState`, `setLocalState`: ローカルステートのように値を取得・設定できます
- `createLocalKey` は、基本的には内部で使うための関数ですが、外部からも利用可能です

> `setLocalState` は、メインステートに追加ツリーを追加します\
> ユーザーはメインステートの改変を意識することなく、ローカルステートのように値を取得・設定できます\
> 汎用コンポーネントの作成で、ローカルステートが欲しいときに利用できます

例
```ts
interface LocalState {
	color?: string
	size ?: number
}

const localState = getLocalState(state, name, {
	color: "red"
}) // res: { color: "red" }

const newState = setLocalState(state, name, {
	color: "blue"
	size : 180
})

/* res:
	{
		title: "ユーザ情報",
		user : {
			name: "青年",
			age : 20
		},
		local_key_青年: {
			color : "blue",
			size  : 180
		}
	}
*/
```

---

- `el`: hyperapp の `h` 関数のラッパーです

> text関数の省略や、配列の省略などが可能です\
> JSXを使用する場合は、出番がありません

例
```ts
const body = el("body")
const div  = el("div")

const vnode = body({},
	div({}, "タイトル行"),
	div({}, "メイン")
)
```

---

- deleteKeys  : props から指定したキーを削除します
- getClassList: props からクラスリストを取得します
- concatAction: アクションを結合します

> 汎用コンポーネントを作成する場合などに使用できます

例
```ts
const button = el("button")

const MyButton = function <S> (
	props: {
		state: S
		onclick?: (state: S, e: Event) => S | [S, Effect<S>],
		keyNames: string[] // number までのパス
		[key: string]: any
	},
	child: any
): VNode<S> {
	const { state, onclick, keyNames } = props
	const classList = getClassList(props)

	// action
	const action_click = (state: S, e: Event) => {
		const count = getValue(state, keyNames, 0)
		const newState = setValue(state, keyNames, count + 1)

		// ユーザーが指定したアクションとの結合
		return concatAction(onclick, newState, e)
	}

	// vnode
	return button({
		type: "button",
		...deleteKeys(props, "state", "keyNames"),       // DOM に設定しない値を削除
		class  : classList.concat("MyButton").join(" "), // 取得したクラス名に MyButton を追加
		onclick: action_click
	}, child)
}
```

---

- effect_toast: 設定した値を、一定時間経過後に元に戻します

例
```ts
const action = (state: S) => {
	return [
		{
			...state,
			message: "ready"
		},
		effect_toast({
			keyNames: ["message"],
			value   : "toast message",
			duration: 1000
		})
	]
}
```

> `message` に 1秒間 "toast message" と表示された後\
> "ready" という値に戻ります

---

**dom**

- getScrollMargin: スクロール状態を取得

> 無限スクロールなどに利用できます

例:
```ts
const action = (state: S, e: Event) => {
	const scrollMargin = getScrollMargin(e)

	if (scrollMargin.bottom < 100) {
		// 残り 100px で、アイテムの追加処理などを実行
		const newState = {
			...state,
			count: count + 10
		}
		return newState
	}

	return state
}
```

---

- withLoadingDialog: task 実行中、ローディングダイアログを表示します

> onCancel を指定した場合は、Esc キーで onCancel が呼び出されます

例
```ts
const json = await withLoadingDialog(async () => {
	const res = await fetch("/api/hoge")
	if (!res.ok) throw new Error("error: task")
	return res.json()
})
```

---

**animation**

- subscription_RAFManager: RAFTask 配列の実行を管理するサブスクリプション

> ステートに `RAFTask[]` の配列を用意します\
> `RAFTask` が追加されると、自動的にタスクの実行管理を開始します\
> タスクが完了すると、自動的に `RAFTask[]` から削除されます

例:
```ts
app({
	node,
	init: [
		{
			tasks  : [] as RAFTask[],
			message: ""
		},
		(dispatch: S) => {
			const newTask = new RAFTask({
				id      : "uniqueID",
				duration: 2000,
				action  : (state: S, task: RAFTask<S>) => {
					return {
						...state,
						message: `progress = ${ task.progress }`
					}
				}
			})
		}
	],
	view,
	subscription: (state: S) => [
		subscription_RAFManager(state, ["tasks"])
	]
})
```

`RAFTask` クラスの作成には、最低限次の項目を設定する必要があります

- id: タスク管理用のユニークIDを設定してください。DOMのIDとは関係ありません
- duration: 実行時間をミリ秒で指定してください
- action: 1フレームごとの処理内容を指定します。進捗状況は `RAFTask.progress` から取得できます

---

- effect_RAFProperties: RAFTask を利用して CSS プロパティをアニメーションする Effect

> CSSProperty により、複数の CSS アニメーションを同時処理することが可能です

例:
```ts
	const action = (state: S) => {
		const property: CSSProperty = {
			"button": {
				"fontSize": (progress: number) => `${ 1 + 1 * progress }rem`,
				"color"   : (progress: number) => `rgb(${ 255 * progress }, 0, 0)`
			}
		}

		return [state, effect_RAFProperties({
			id        : "uniqueID",
			duration  : 1000,
			properties: [ property ]
		})]
	}
```

> すべてのボタンに対して、1秒かけて文字サイズを拡大し、文字色を赤へ変化させるアニメーションのサンプルです

---

**services**

- GoogleAuth: Google Identity Services を利用した Google 認証クラス

> ログインボタンを作成しない場合は、`new GoogleAuth({ clientId: "hoge" })` だけで利用できます\
> インスタンス作成後、`initialize` を実行すると認証処理を開始します

例
```ts
const config: GoogleAuthConfig = {
	clientId: "your google api key"
}

const option: GoogleButtonOption = {
	renderButton: document.querySelector("article")
}

const auth = new GoogleAuth(config, option)

auth.initialize().then((res: GoogleAuthResult) => {
	const idToken = res.idToken
	const user = res.user

	alert("ログイン成功")
})

```
