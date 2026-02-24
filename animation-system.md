# rAF / Animation System

requestAnimationFrame によるフレーム単位のアニメーションを、  
hyperappのステート管理と連携させたシステムです

- ステートに RAFTask 配列を持ち、この情報をもとにフレーム単位でアニメーションが実行されます
- ステートの値が変更された時点で、サブスクリプションにより `requestAnimationFrame` がセットされます
- RAFTask に保存された情報によりアニメーションが処理され、必要に応じて次の `requestAnimationFrame` がセットされます
- アニメーションは `RAFTask.duration` の時間 (ms) 実行され、必要に応じて `finish` イベントが実行されます

フロー図:
```
ステート変更
   ↓
サブスクリプション
   ↓
rAF 実行 (rafTask.action)
   ↓
終了処理 (rafTask.finish)
```

## フロー解説

1. RAFTask の登録
	- createRAFxxx で RAFTask を作成
	- effect_RAFxxx でステートに登録（薄いラッパー）

1. サブスクリプションによる実行管理
	- subscription_RAFManager がステート上の RAFTask 配列を監視
	- フレームごとに requestAnimationFrame をセットし、各 RAFTask に実行を通知

1. 描画処理
	- 各 RAFTask.action が描画やアニメーション処理を実行
	- 任意でステートを更新したり、副作用を発生させることが可能

1. 終了処理
	- 描画完了後に RAFTask.finish がコールバックされる
	- subscription_RAFManager が終了済みの RAFTask をステートから削除
	- finish 内で次の RAFTask 登録がなければ処理は終了

## 補足

- RAFTask は、内部でリアルタイムに更新する値を持つクラスオブジェクト  
`action` `finish` に描画ロジックを持ちます
- createRAFxxx は RAFTask 作成用の補助関数
- effect_RAFxxx は作成した RAFTask をステートに登録するためのラッパー
- この構造により、ステート管理と rAF のリアルタイム描画が統合され、  
  アニメーションの開始・進行・終了がすべてステート経由で追跡可能になります

## sample: button[id="app"] のフォントを、赤色に変更していく

```ts
// button.click
const action = (state: State) => {
	const effect = effect_RAFProperties({
		id        : "app",
		keyNames  : ["tasks"],
		duration  : 1000,
		properties: [{
			["#app"]: {
				"color": (progress: number) => {
					const r = 255 * progress
					const g = 0
					const b = 0
					return `rgb(${r}, ${g}, ${b})`
				}
			}
		}]
	})

	return [state, effect]
}

// app
app({
	node: document.getElementById("app") as HTMLElement,

	init: {
		tasks: [] as RAFTask<State>[] // ステートに RAFTask 配列が必要
	},

	view: (state: State) => (
		<button
			type    = "button"
			id      = "app"
			onclick = { action }
		>
			Hello World
		</button>
	)

	subscriptions: (state: State) => [
		// RAFTask 配列を監視、実行開始・終了を制御するサブスクリプションを登録
		subscription_RAFManager(state, ["tasks"])
	]
})

```

### 解説

`properties` には `CSSProperty[]` を設定させる仕様としています

```ts
interface CSSProperty {
	[selector: string]: {
		[name: string]: (progress: number) => string
	}
}
```

`before` / `after` 形式ではなく、進捗状況により CSS 値を出力させる関数としています  
これにより複雑な形式の CSS 値を出力することができます

例
```ts
{
	["#hogre"]: {
		"transform": (progress: number) => {
			return `translate(${ 100 * progress }px, ${ 3 * progress }rem)`
		}
	}
}
```

### 補足

`progress` は、0から1までの数値を返します  
関数を自由に決めることができるため、`easing` 処理なども実装できます

`easing` 用のプリセットも、別ファイルで用意しています。  
[progress_easing.ts](src/hyperapp-is/animation/easing.ts)

## hyperapp でのコンポーネント初期化について

hyperapp にはライフサイクルイベントが採用されていないため、コンポーネント単体では初期化処理を行うことができません。  
必ずステートに対してアクションを起こす必要があり、その後の監視は基本的にサブスクリプションで行われます。

1. view にコンポーネントを配置する  
2. 必要であれば、subscriptions に監視用 Subscription を登録する  
3. 開始アクションを実行する  

という **2〜3ステップ** が必ず必要となりますが、本ライブラリでは、この仕様を「制約」ではなく **設計指針** として扱っています。  
これにより、

1. ステートの変更
1. サブスクリプションによる監視
1. 副作用の実行

という一貫した流れで処理されるため、

- 初期化タイミングが完全にコントロール下にある
- 処理の開始・終了がすべてステートで追跡可能
- DOM 依存処理が分離される

といったメリットがあります

## raf.ts

### InternalEffect
Effectの型エイリアス  
Dispatch の中から呼ばれるイベントの戻り値として設定されています  
値を返さず、Dispatch 内部専用という役割を明示するものです

### RAFEvent
RAFTask で使用されるイベント  
hyperapp で使用される通常のアクション と同一なものですが  
`payload` と `Effect` の型名が再定義されています

### RAFTask
`requestAnimationFrame` (rAF) を管理するためのクラス
このクラスは **情報管理と描画** を担当します  

### subscription_RAFManager
`requestAnimationFrame` を利用し `RAFTask` をフレームごとに実行するサブスクリプション  
このサブスクリプションは **時間管理** を担当します

## properties.ts

### CSSProperty
CSS設定オブジェクト  
`RAFTask.extension.properties` に登録します

### createUnits
`CSSProperty` の selector から DOM を取得してセットにします  
`CSSProperty` から拡張した RAFTask を作成するために使用する補助関数です

### createRAFProperties
`subscription_RAFManager` をベースにした CSS アニメーション RAFTask を作成する  
このオブジェクトは **情報管理と描画** を担当します  

### effect_RAFProperties
`subscription_RAFManager` をベースにした CSS アニメーションエフェクト  
このエフェクトは `createRAFProperties` により作成した `RAFTask` を  
**ステートに登録** するためのラッパーです

## translate.ts
現在 `animationView / carousel.ts` を開発中であり、将来的には `translate.ts` は廃止予定です

### TranslateState
Translate 管理用オブジェクト  
`RAFTask.extension.translateState` に登録します

### createRAFTranslate
`subscription_RAFManager` をベースにした Translate アニメーション RAFTask を作成する  
このオブジェクトは **情報管理と描画** を担当します  

### effect_translateStart
`subscription_RAFManager` をベースにした Translate アニメーションエフェクト  
このエフェクトは `createRAFTranslate` により作成した `RAFTask` を  
**ステートに登録** するためのラッパーです

### effect_translateRollback
アニメーション中の Translate を、元の位置に戻すエフェクト  
`effect_translateStar` に依存しており `effect_translateStar` 実行中の id に対して  
エフェクトを適用する前提となっています

### effect_translateRollforward
アニメーション中の Translate を、早送りする  
`effect_translateStar` に依存しており `effect_translateStar` 実行中の id に対して  
エフェクトを適用する前提となっています

### effect_translateRollforward
Translate を任意のインデックスまで移動する  
`effect_translateStar` に依存しており `effect_translateStar` 実行中の id に対して  
エフェクトを適用する前提となっています

## その他

- `step.ts` は、rAF を使用したアニメーションライブラリではありません
- `dom/utils` に存在する `marquee` は、カルーセルのような動作を提供しますが、単純な DOM 操作です  
  制御もステート駆動ではなく、実行時に取得するコントローラーにより行います
- `dom/lifecycle.ts` に存在する `subscription_nodesCleanup` は、  
  DOM を監視してメモリリークを防止する目的で作成したサブスクリプションです  
  基本的には **DOM ではなくステートを追跡して制御する設計** が望ましいと考えています  
  そのため、`subscription_nodesCleanup` の出番はあまり多くないでしょう

## 最後に

この animation-system は、`RAFTask` `subscription_RAFManager`  
のみで、基本的にはどのようなアニメーションでも実装できるよう作成しています

その他に作成したエフェクト類は、これをベースに汎用性があるよう作成しているものです  
そのため、同じDOMの検索が複数回発生しているなど **速度的に最速ではありません**

ライブラリの理解が進んだユーザーは、エフェクト類はコードの参考例として頂き  
`RAFTask` の `action` や `finish` 等を直接作成されるとよろしいでしょう
