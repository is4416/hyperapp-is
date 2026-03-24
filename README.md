# hyperapp-is

Lightweight. Declarative. Composable.

Reusable component foundation library for Hyperapp v2.

State-structure independent design + RAF-based animation system.

---

## Features

- State-path based reusable component design
- Local state helpers  
	`getLocalState`, `setLocalState`, `createLocalKey`
- Action composition utility  
	`concatAction`
- Class / props utilities  
	`getClassList`, `deleteKeys`
- requestAnimationFrame task system  
	`RAFTask`, `subscription_RAFManager`
- Built-in animated Carousel component

---

## Installation

``` bash
npm install hyperapp-is
```

Peer dependencies:

- hyperapp v2
- hyperapp-jsx-pragma (when using JSX)

---

## Basic Usage (Carousel Example)

``` ts
import { app } from "hyperapp"
import h from "hyperapp-jsx-pragma"
import {
	RAFTask, subscription_RAFManager,
	Carousel, effect_InitCarousel
} from "hyperapp-is"

// State
interface State {
	tasks: RAFTask<State>[]
}

const initState: State = {
	tasks: []
}

// Entry Point
app({
	node: document.getElementById("app") as HTMLElement,

	init: [initState, effect_InitCarousel(["tasks"], {
		id      : "carousel",
		duration: 2000,
		delay   : 1000,
		step    : 1
	})],

	subscriptions: (state) => [
		subscription_RAFManager(state, ["tasks"])
	],

	view: (state) => (<Carousel
		state    = { state }
		id       = "carousel"
		keyNames = { ["tasks"] }
	>
		<div>Slide 1</div>
		<div>Slide 2</div>
		<div>Slide 3</div>
	</Carousel>)
})
```

---

## Concept

hyperapp-is allows components to:

- Remain independent from root state structure
- Store internal state without polluting user state
- Compose actions safely
- Manage animations declaratively via RAFTask

Designed for building reusable UI components on top of Hyperapp.

---

## Documentation

Full documentation and detailed design notes are available on GitHub:

https://github.com/is4416/hyperapp-is

---

## License

MIT

---

# hyperapp-is

Hyperapp で再利用可能なコンポーネントを作成するためのライブラリです  
hyperapp-is の is は、is4416 の略です

[example](https://is4416.github.io/hyperapp-is/)  
※ 本ライブラリの実装サンプル

本ライブラリは **イミュータブルなステート更新** と **シンプルな副作用管理** を前提として設計されています。  
JSX を使用する場合は `hyperapp-jsx-pragma` を前提としています。

## Functions / 関数リスト

npm で非公開の関数 (実験用)は、解説に記載します

**core / state.ts**
- [Keys](#keys)
- [getValue](#getvalue)
- [setValue](#setvalue)
- [getLocalState](#getlocalstate)
- [setLocalState](#setlocalstate)
- [createLocalKey](#createlocalkey)

**core / component.ts**
- [Keys_String](#keys_string-keys_arraystring)
- [Keys_ArrayString](#keys_string-keys_arraystring)
- [el](#el)
- [concatAction](#concataction)
- [getClassList](#getclasslist)
- [deleteKeys](#deletekeys)
- [Route](#route)
- [SelectButton](#selectbutton)
- [OptionButton](#optionbutton)

**core / navigator.ts**
- [Keys_NavigatorItem](#keys_navigatoritem)
- [NavigatorItem](#navigatoritem)
- [JsonEntry](#jsonentry)
- [NavigatorColumn](#navigatorcolumn)
- [convertJsonToNavigatorItem](#convertjsontonavigatoritem)
- [getParentItems](#getparentitems)
- [NavigatorFinder](#navigatorfinder)

**animation / step.ts**
- [effect_throwMessageStart](#effect_throwmessagestart)
- [effect_throwMessagePause](#effect_throwmessagepause--effect_throwmessageresume)
- [effect_throwMessageResume](#effect_throwmessagepause--effect_throwmessageresume)
- [marquee](#marquee)

**animation / raf.ts**
- [InternalEffect](#internaleffect)
- [RAFEvent](#rafevent)
- [RAFTask](#raftask)
- [subscription_RAFManager](#subscription_rafmanager)

**animation / properties.ts**
- [CSSProperty](#cssproperty)
- [createUnits](#createunits)
- [createRAFProperties](#createrafproperties)
- [effect_RAFProperties](#effect_rafproperties)

**animation / easing.ts**
- [progress_easing](#progress_easing)

**animation / translate.ts**
- [TranslateState](#translatestate)
- [createRAFTranslate](#createraftranslate)
- [effect_translateStart](#effect_translatestart)
- [effect_translateRollback](#effect_translaterollback)
- [effect_translateRollforward](#effect_translaterollforward)
- [effect_translateSlide](#effect_translateslide)

**animationView / carouselts**
- [CarouselState](#carouselstate)
- [CarouselController](#carouselcontroller)
- [Carousel](#carousel)
- [effect_InitCarousel](#effect_initcarousel)

**dom / utils.ts**
- [ScrollMargin](#scrollmargin)
- [getScrollMargin](#getscrollmargin)
- [MatrixState](#matrixstate)
- [getMatrixState](#getmatrixstate)

**dom / lifecycle.ts**
- [effect_setTimedValue](#effect_settimedvalue)
- [effect_nodesInitialize](#effect_nodesinitialize)
- [subscription_nodesCleanup](#subscription_nodescleanup)
- [subscription_nodesLifecycleByIds](#subscription_nodeslifecyclebyids)

## source file / ソースファイル

```
src
 └ hyperapp-is
	 ├ index.ts
	 │
	 ├ core
	 │  ├ state.ts
	 │  │   Keys
	 │  │   getValue, setValue, getLocalState, setLocalState, createLocalKey
	 │  │
	 │  ├ component.ts
	 │  │   Keys_String, Keys_ArrayString
	 │  │   el, concatAction, getClassList, deleteKeys
	 │  │   Route, SelectButton, OptionButton
	 │  │
	 │  └ navigator.ts
	 │       Keys_NavigatorItem, NavigatorItem, JsonEntry, NavigatorColumn
	 │       convertJsonToNavigatorItem, getParentItems, NavigatorFinder
	 │
	 ├ animation
	 │  ├ step.ts
	 │  │   effect_throwMessageStart, effect_throwMessagePause, effect_throwMessageResume, marquee
	 │  │
	 │  ├ raf.ts
	 │  │   InternalEffect
	 │  │   RAFEvent
	 │  │   RAFTask
	 │  │   subscription_RAFManager
	 │  │
	 │  ├ properties.ts
	 │  │   CSSProperty
	 │  │   createRAFProperties
	 │  │   effect_RAFProperties
	 │  │
	 │  ├ easing.ts
	 │  │   progress_easing
	 │  │
	 │  └ translate.ts
	 │       TranslateState
	 │       createRAFTranslate
	 │       effect_translateStart
	 │       effect_translateRollback
	 │       effect_translateRollforward
	 │       effect_translateSlide
	 │
	 ├ animationView
	 │  └ carousel.ts
	 │
	 └ dom
		 ├ utils.ts
		 │   ScrollMargin
		 │   getScrollMargin
		 │   MatrixState
		 │   getMatrixState
		 │
		 └ lifecycle.ts
			  effect_setTimedValue
			  effect_nodesInitialize
			  subscription_nodesCleanup
			  subscription_nodesLifecycleByIds
```

## hyperapp-is/core

### Keys
ステートの任意の値までのパスを表す、文字配列の型エイリアス

```ts
export type Keys = readonly string[]
```

---

### getValue
パスを辿ってステートから値を取得  
安全にアクセス可能

```ts
export const getValue = function <S, D> (
	state   : S,
	keyNames: string[],
	def     : D
): D
```
*型保証は呼び出し側の責任*

- state   : ステート
- keyNames: 値までのパス
- def     : デフォルト値

---

### setValue
パスを辿ってステートに値を設定し、immutable な新しいステートを返す

```ts
export const setValue = function <S> (
	state   : S,
	keyNames: string[],
	value   : any
): S
```
- state   : ステート
- keyNames: 値までのパス
- value   : 設定する値

---

### getLocalState
ID に紐づいたローカルステートを取得

```ts
export const getLocalState = function <S> (
	state: S,
	id   : string,
	def  : { [key: string]: any }
): { [key: string]: any }
```

- state: ステート
- id   : ユニークID
- def  : 初期値

---

### setLocalState
ローカルステートを更新して新しいステートを返す

```ts
export const setLocalState = function <S> (
	state: S,
	id   : string,
	value: { [key: string]: any }
): S
```

- state: ステート
- id   : ユニークID
- value: 設定するローカルステート

---

### createLocalKey
ID からユニーク文字列を作成する

```ts
export const createLocalKey = (id: string): string => `local_key_${ id }`
```

---

### Keys_String, Keys_ArrayString
ステートの任意の値までのパスを表す、文字配列の型エイリアス

---

### el
Hyperapp の h 関数ラッパー。JSX と競合する場合に使用  
children の処理も同時に行っているため、本ライブラリでは VNode を作成する際に使用しています

```ts
export const el = (tag: string) => <S> (
	props   ?: { [key: string]: any },
	children?: Array
): VNode<S>
```

- tag: タグ名

---

### concatAction
アクションを結合して結果を返す  
`effect_nodesInitialize` と組み合わせ可能

```ts
export const concatAction = function <S, E> (
	action  : undefined | ((state: S, e: E) => S | [S, Effect<S>]),
	newState: S,
	e       : E
): S | [S, Effect<S>]
```
*newStateを設定後、DOM描画を待ち、次の action に結合します*

- action  : 結合するアクション
- newState: 結合するステート
- e       : イベント (任意のイベント型)

---

### getClassList
props オブジェクトから classList を取得

```ts
export const getClassList = (
	props: { [key: string]: any }
): string[]
```

- props: props

---

### deleteKeys
props から不要なキーを除去

```ts
export const deleteKeys = <T extends Record<string, any>> (
	props  : T,
	...keys: (keyof T)[]
): Omit<T, (typeof keys)[number]>
```

- props  : props
- ...keys: 削除するキー

---

### Route
ステート値と一致した場合に VNode を返す  
条件付きレンダリングに利用

```ts
export const Route = function <S> (
	props: {
		state   : S
		keyNames: string[]
		match   : string
	},
	children: any
): VNode<S> | null
```
*返値に `null` が設定された場合 `VNode` は生成されません*

- props         : props
- props.state   : ステート
- props.keyNames: ステート内の文字までのパス
- props.match   : 一致判定する文字
- children      : 出力する内容 (VNode / 配列 / 文字など)

---

### SelectButton
クラス名 `select` をトグルするボタン  
複数選択可能

```ts
export const SelectButton = function <S> (
	props: {
		state        : S
		keyNames     : string[]
		id           : string
		reverse?     : boolean
		[key: string]: any
	},
	children: any
): VNode<S>
```
*クリックにより、クラス名 `select` がトグルされます*

- props         : props
- props.state   : ステート
- props.keyNames: ステート内の文字配列までのパス
- props.id      : ユニークID
- props.reverse?: 反転選択するか
- children      : 子要素 (VNode / string / 配列など)

---

### OptionButton
クラス名 `select` を単一選択で切り替えるボタン  
単一選択用

```ts
export const OptionButton = function <S> (
	props: {
		state        : S
		keyNames     : string[]
		id           : string
		reverse?     : boolean
		[key: string]: any
	},
	children: any
): VNode<S>
```
*クリックにより、クラス名 `select` が排他的に選択されます*

- props         : props
- props.state   : ステート
- props.keyNames: ステート内の文字までのパス
- props.id      : ユニークID
- props.reverse?: 反転選択するか
- children      : 子要素 (VNode / string / 配列など)

---

### Keys_NavigatorItem
ステートの任意の値までのパスを表す、文字配列の型エイリアス

---

### NavigatorItem
ツリー構造となるナビゲーションオブジェクト

```ts
export interface NavigatorItem {
	parent     : NavigatorItem | null
	name       : string
	properties?: Record<string, any>
	children  ?: NavigatorItem[]
	path       : string
	extension ?: Record<string, any>
}
```

- parent    : 親アイテム
- name      : 名前
- properties: プロパティ
- children  : 子アイテム
- path      : パス
- extension : 拡張オブジェクト

---

### JsonEntry
getEntriesの返す値

```ts
export interface JsonEntry <D> {
	name  : string
	data  : D
	isNode: boolean
}
```

- name  : 名前
- data  : データ
- isNode: ディレクトリか

---

### NavigatorColumn
NavigatorFinder に渡すヘッダーと値

```ts
export interface NavigatorColumn {
	name    : string
	val     : (item: NavigatorItem) => any
	text   ?: (item: NavigatorItem) => string
	compare?: (a: NavigatorItem, b: NavigatorItem) => number
}
```

- name   : 名前
- val    : 値を返す関数 (VNode等も可)
- text   : val が string ではない時に設定するテキスト
- compare: 比較関数

`compare` を設置したカラムだけ、ソート対象となります

---

### convertJsonToNavigatorItem
Json から NavigatorItem に変換  
getEntries の採用により、JSON の形を問わない

```ts
export const convertJsonToNavigatorItem = function <D> (
	props: {
		parent     : NavigatorItem | null
		name       : string
		data       : D
		getEntries : (data: D, depth: number) => JsonEntry<D>[]
		isNode     : boolean
		depth     ?: number
		extension ?: (item: NavigatorItem, data: D, depth: number) => Record<string, any> | undefined
	}
): NavigatorItem
```

- parent    : 親アイテム
- name      : 名前
- data      : データ
- getEntries: JsonEntry配列を返す関数
- isNode    : ディレクトリか
- depth     : 階層の深さ
- extension : NavigatorItem.extensionに格納する拡張データ

---

### getParentItems
NavigatorItem から 親アイテムのリストを取得する  
自分自信はリストに含まない

```ts
export const getParentItems = (
	item: NavigatorItem | undefined
): NavigatorItem[]
```

---

### NavigatorFinder
ナビゲーターファインダーコンポーネント

```ts
export const NavigatorFinder = function <S> (
	props: {
		state         : S
		id            : string
		currentKeys   : Keys_NavigatorItem
		columns      ?: (directory: NavigatorItem | undefined) => NavigatorColumn[]
		afterRender  ?: (props: {
			state     : S
			localState: Recrod<string, any>
		}, vnode: VNode<S>) => VNode<S>
		[key: string]: any
	}
): VNode<S>
```

- state        : ステート
- id           : ユニークID (DOM ID)
- currentKeys  : カレント NavigatorItem までのパス
- columns      : NavigatorColumn の配列を返す関数
- afterRender  : レンダーフック

vnode
```html
<div>
	<div class="main">
		<section>
			<div class="toolBar">
				<input type="text" />
				<button type="button">FILTER</button>
			</div>

			<div class="parentItems">
				<ol>
					<li>parent</li>
				</ol>
				<button type="button">COPY</button>
			</div>

			<div class="items">
				<table>
					<thead>
						<tr>
							<th>ヘッダー</th>
							<th class="sort">ソート付きヘッダー</th>
						</tr>
					</thead>
					<tbody>
						<tr>
							<td class="file"><span>value</span></td>
							<td class="directory"><span>value</span></td>
						</tr>
					</tbody>
				</table>
			</div>
		</section>
	</div>

	<!-- statusBar -->
	<div class="statusBar">message</div>
</div>
```

---

## hyperapp-is/animation

### effect_throwMessageStart
文字を一文字ずつ流し込むエフェクト

*実験用コードのため、npm 非公開です*


```ts
export const effect_throwMessageStart = function <S> (
	keyNames: string[],
	id      : string,
	text    : string,
	interval: number,
): (dispatch: Dispatch<S>) => void
```

- keyNames: 値までのパス
- id      : ユニークID
- text    : 流し込む文字
- interval: 次の文字を流し込むまでの間隔 (ms)

---

### effect_throwMessagePause / effect_throwMessageResume
throwMessage を一時停止・再開

*実験用コードのため、npm 非公開です*

```ts
export const effect_throwMessagePause = function <S> (
	id: string
): (dispatch: Dispatch<S>) => void
```
```ts
export const effect_throwMessageResume = function <S> (
	id: string
): (dispatch: Dispatch<S>) => void
```

- id: ユニークID

---

### marquee
Translate 風に DOM が流れるアニメーションを実行します

*実験用コードのため、npm 非公開です*

```ts
export const marquee = function <S> (
	props: {
		ul      : HTMLUListElement
		duration: number
		interval: number
		easing ?: (t: number) => number
	}
): { start: () => void, stop : () => void }
```
*ステートから独立して `requestAnimationFrame` により直接 DOM を変更します*

**パラメータ**
- props.ul      : アニメーション対象の <ul> エレメント
- props.duration: 実行時間 (ms)
- props.interval: 待機時間 (ms)
- props.easing  : easing 関数

**戻値**
- start(): アニメーションを開始
- stop() : アニメーションを停止

---

### InternalEffect
Dispatch の内部処理（finish / action）から呼び出されることを前提としたエフェクト  
Action の戻り値としては返されず、Dispatch の実行フロー内で直接実行される  
型としては `Effect<S>` と同一で「Dispatch 内部専用」という役割と設計意図を明示するための型エイリアス

```ts
type InternalEffect<S> = Effect<S>
```

**説明**

Dispatch で呼ばれるアクションでは、エフェクトを直接返すことはできません  
しかし、非同期処理でエフェクトを使用したいこともあります

このときアクションを `(state: S) => S | [S, Effect<S>]` とせず `(state: S) => S | [S, InternalEffect<S>]`とすることで、エフェクトが戻り値とならないことを明示します ( Dispatch 内でエフェクトが戻せない罠対策です )  
具体的には `requestAnimationFrame` などを使用して時間差で Dispatch してください

**ポイント**

- 戻り値として使用されず、Dispatch 内でのみ実行される
- `Effect<S>` と同一
- 内部専用であることを、型で明示

**Dispatch例**

```ts
	return [state, (dispatch: Dispatch) => {
		requestAnimationFrame(() =>
			dispatch(state: S) => [state, effect]
		)
	}]
```
*requestAnimationFrame などで、Dispatch 外部に移動した後、Dispatch します (どうしても1フレーム遅延します)*

---

### RAFEvent
RAFTask で使用されるイベント  
hyperapp で使用される通常のアクション と同一なものですが  
`payload` と `Effect` の型名が再定義されています

```ts
type RAFEvent = <S> (state: S, rafTask: RAFTask<S>) => S | [S, InternalEffect<S>]
```

---

### RAFTask
requestAnimationFrame (rAF) を管理するためのクラス

```ts
export class RAFTask <S> {
	// constructor
	constructor (props: {
		id        : string
		groupID  ?: string
		duration  : number
		delay    ?: number
		action    : RAFEvent<S>
		finish   ?: RAFEvent<S>
		priority ?: number
		extension?: Record<string, any>
	})

	// getter
	id       : string
	duration : number
	delay    : number
	action   : RAFEvent<S>
	finish   : RAFEvent<S>
	progress : number
	deltaTime: number

	// getter / setter
	groupID  : string | undefined
	priority : number
	extension: Record<string, any>
	isDone   : boolean
	paused   : boolean

	// method
	clone: RAFTask<S>
}
```

**constructor**

基本
- id      : rAF のユニークID
- duration: 1回の実行時間 (ms)
- action  : 毎フレームごとのアクション

拡張
- groupID  : 任意のグループID
- delay    : 初回実行までの待機時間 (ms)
- finish   : 最終フレームで実行されるアクション
- priority : 処理の優先順位
- extension: 任意の拡張データ

**property**

getter
- id       : rAF のユニークID
- duration : 1回の実行時間 (ms)
- delay    : 初回実行までの待機時間 (ms)
- action   : 毎フレームごとのアクション
- finish   : 最終フレームで実行されるアクション
- progress : 進捗状況 (0 - 1)
- deltaTime: 前回アクションからの経過時間 (ms)

getter / setter
- groupID  : 任意のグループID
- priority : 処理の優先順位
- extension: 任意の拡張データ
- isDone   : 終了状況の取得 / 設定
- paused   : 一時停止状況の取得 / 設定

**method**

- clone: 時間を初期化したクローンを作成して返す

---

### subscription_RAFManager
RAFTask 配列をフレームごとに実行するサブスクリプション

```ts
export const subscription_RAFManager = function <S> (
	state   : S,
	keyNames: string[]
): Subscription<S>
```

- state   : ステート
- keyNames: RAFTask 配列までのパス

[詳細説明](animation-system.md)

---

### CSSProperty
CSS設定用オブジェクト

```ts
export interface CSSProperty {
	[selector: string]: {
		[name: string]: (progress: number) => string
	}
}
```

- selector: セレクター
- selector.[name] => fn
	- name: CSS プロパティ名
	- fn(progress): CSS 値を計算する関数

---

### createUnits
CSSProperty を変換する補助関数  
selector から、doms を取得してセットにします

```ts
export const createUnits = function (
	properties: CSSProperty[]
): {
	doms  : HTMLElement[],
	styles: {
		[name: string]: (progress: number) => string
	}
}[]
```

- properties: プロパティ配列

---

### createRAFProperties
subscription_RAFManager をベースにした CSS アニメーション RAFTask を作成する

```ts
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
): RAFTask<S>
```

props は、基本的に RAFTask の値

- properties: セレクタとスタイル設定のセット配列

---

### effect_RAFProperties
CSS プロパティをフレーム単位で段階的に変更

```ts
export const effect_RAFProperties = function <S>(
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
): (dispatch : Dispatch<S>) => void
```

props は、基本的に RAFTask の値

- properties: セレクタとスタイル設定のセット配列
- keyNames  : RAFTask 配列までのパス

---

### TranslateState
Translate 管理用オブジェクト

*実験用コードのため、npm 非公開です*

```ts
export interface TranslateState {
	width : number
	index : number
	total : number
	easing: (t: number) => number
}
```

- width : 移動量
- index : 先頭のインデックス
- total : 子の数
- easing: easing 関数

---

### createRAFTranslate
subscription_RAFManager をベースにした Translate アニメーション RAFTask を作成する

*実験用コードのため、npm 非公開です*

```ts
export const createRAFTranslate = function <S> (
	props: {
		id      : string
		groupID?: string
		duration: number
		delay   : number

		finish?: (state: S, rafTask: RAFTask<S>) => S | [S, InternalEffect<S>]

		priority ?: number
		extension?: Record<string, any>

		translateState: TranslateState
	}
): RAFTask<S>
```

- props は、基本的に RAFTask の値
- translateState: Translate情報

---

### effect_translateStart
`subscription_RAFManager` をベースにした Translate アニメーションエフェクトです

*実験用コードのため、npm 非公開です*

```ts
export const effect_translateStart = function <S> (
	props: {
		id      : string
		groupID?: string
		duration: number
		delay   : number

		finish?: (state: S, rafTask: RAFTask<S>) => S | [S, InternalEffect<S>]

		priority ?: number
		extension?: Record<string, any>

		easing ?: (t: number) => number

		keyNames: string[]
	}
): (dispatch: Dispatch<S>) => void
```

- props は、基本的に RAFTask の値
- easing  : easing 関数
- keyNames: RAFTask 配列までのパス

**説明**

marquee は単純な DOM に対しての副作用で、Translate としての動作は  
ステート経由で rAF を制御しているこちらに集約されることになります

marquee はステートを通さず直接 DOM に対して副作用を発生させるため  
用途によっては marquee に優位性があります

- marquee : DOM 直接操作。軽量で即時反映
- effect_translateStart : Hyperapp のステート経由で管理。RAFManager と連携可能

### effect_translateRollback
アニメーション中のTranslateを、元の位置に戻す

*実験用コードのため、npm 非公開です*

```ts
export const effect_translateRollback = function <S> (
	props: {
		id      : string
		keyNames: string[]
		paused ?: boolean
		finish ?: RAFEvent<S>
	}
): (dispatch: Dispatch<S>)
```

- id      : ユニークID
- keyNames: RAFTask 配列までのパス
- paused  : 実行後、一時停止するか
- finish  : 実行後に呼び出されるイベント

**注意**
`effect_translateStart` に依存しています  
上記エフェクトでループしている id に対して使用します

---

### effect_translateRollforward
アニメーション中のTranslateを、早送りする

*実験用コードのため、npm 非公開です*

```ts
export const effect_translateRollforward = function <S> (
	props: {
		id      : string
		keyNames: string[]
		paused ?: boolean
		finish ?: RAFEvent<S>
	}
): (dispatch: Dispatch<S>)
```

- id      : ユニークID
- keyNames: RAFTask 配列までのパス
- paused  : 実行後、一時停止するか
- finish  : 実行後に呼び出されるイベント

**注意**
`effect_translateStart` に依存しています  
上記エフェクトでループしている id に対して使用します

---

### effect_translateSlide
Translateを任意のインデックスまで移動する

*実験用コードのため、npm 非公開です*

```ts
export const effect_translateSlide = function <S> (
	props: {
		id      : string
		keyNames: string[]
		index   : number
		paused ?: boolean
		finish ?: RAFEvent<S>
	}
): (dispatch: Dispatch<S>) => void
```

- id      : ユニークID
- keyNames: RAFTask 配列までのパス
- index   : 移動先のインデックス
- paused  : 実行後、一時停止するか
- finish  : 実行後に呼び出されるイベント

**注意**
`effect_translateStart` に依存しています  
上記エフェクトでループしている id に対して使用します

---

### progress_easing
easing プリセット

```ts
export const progress_easing = {

	// basic
	linear       : (t: number) => t,
	easeInQuad   : (t: number) => t * t,
	easeOutQuad  : (t: number) => 1 - (1 - t) * (1 - t),
	easeInOutQuad: (t: number) => t < 0.5
		? 2 * t * t
		: 1 - Math.pow(-2 * t + 2, 2) / 2,

	// cubic
	easeInCubic   : (t: number) => t * t * t,
	easeOutCubic  : (t: number) => 1 - Math.pow(1 - t, 3),
	easeInOutCubic: (t: number) => t < 0.5
		? 4 * t * t * t
		: 1 - Math.pow(-2 * t + 2, 3) / 2,

	// quart
	easeInQuart   : (t: number) => t * t * t * t,
	easeOutQuart  : (t: number) => 1 - Math.pow(1 - t, 4),
	easeInOutQuart: (t: number) => t < 0.5
		? 8 * t * t * t * t
		: 1 - Math.pow(-2 * t + 2, 4) / 2,

	// back (跳ねる)
	easeOutBack: (t: number) => {
		const c1 = 1.70158
		const c3 = c1 + 1
		return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
	},

	// bounce
	easeOutBounce: (t: number) => {
		const n1 = 7.5625
		const d1 = 2.75

		if (t < 1 / d1) {
			return n1 * t * t
		} else if (t < 2 / d1) {
			return n1 * (t -= 1.5 / d1) * t + 0.75
		} else if (t < 2.5 / d1) {
			return n1 * (t -= 2.25 / d1) * t + 0.9375
		} else {
			return n1 * (t -= 2.625 / d1) * t + 0.984375
		}
	},

	// elastic
	easeOutElastic: (t: number) => {
		const c4 = (2 * Math.PI) / 3

		return t === 0
			? 0
			: t === 1
			? 1
			: Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1
	}
}
```

## hyperapp-is/animationView

### CarouselState
Carousel コンポーネント情報  
RAFTask.extension に保存されます

```ts
export interface CarouselState <S> {
	id  : string
	step: number

	// option
	groupID  ?: string
	duration ?: number
	delay    ?: number
	priority ?: number
	extension?: Record<string, any>

	// event
	action?: RAFEvent<S>
	finish?: RAFEvent<S>

	// animation
	easing?: (t: number) => number

	// report
	reportPageIndex?: string[]
}
```
基本的には `RAFTask` に準拠します  
カルーセルを動作せるため `effect_InitCarousel` に渡すための値です  

必須項目
- id: `Carousel` コンポーネントの id を指定してください
- step: 移動するアイテムの数で、負の数は逆回転。0 は停止となります

拡張項目
- easing: アニメーションの動作を指定する関数  
指定しない場合は `(t: number) => t` (linear) となります

- reportPagreIndex: 現在一番左端に表示されているアイテムのインデックスを受けるパス  
コントロールバーを自作したい時などに利用できます

---

### CarouselController
外部から Carousel コンポーネントを操作するためのクラス  
RAFTask.extension に保存されます

```ts
export interface CarouselController <S> {
	step  : (rafTask: RAFTask<S>, delta: number, skipSpeedRate?: number) => Promise <RAFTask<S>>
	moveTo: (rafTask: RAFTask<S>, index: number, skipSpeedRage?: number) => Promise <RAFTask<S>>
}
```

- step: `delta` で指定した方向にページを移動します (相対値)  
スキップ時のスピードは、変更前の `duration` に `skipSpeedRate` を乗じたものになります  
終了時に処理を割り込ませたい場合は、`Promsie` により処理します

- moveTo: `index` で指定したページに移動します (絶対値)  
スキップ時のスピードは、変更前の `duration` に `skipSpeedRate` を乗じたものになります  
終了時に処理を割り込ませたい場合は、`Promsie` により処理します

### Carousel
カルーセルコンポーネントです  
`CarouselState` を引数に `effect_InitCarousel` を実行することで動作開始します  
`subscription_RAFManager` を使用するので、予め `subscriptions` に追加してください

```ts
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
): VNode<S>
```

- state        : ステート
- id           : ユニークID (DOM の id)
- keyNames     : RAFTask 配列までのパス
- controlButton: 操作ボタンを表示するか (未実装)
- controlBar   : 操作バーを表示するか
- skipSpeedRate: スキップ時の動作速度

### effect_InitCarousel
カルーセルを初期化し起動するエフェクト

```ts
export const effect_InitCarousel = function <S> (
	keyNames     : string[],
	carouselState: CarouselState<S>
): (dispatch: Dispatch<S>) => void
```

- keyNames     : RAFTask 配列までのパス
- carouselState: カルーセルの動作設定

## hyperapp-is/dom

### ScrollMargin
スクロールの余白を管理するオブジェクト

```ts
export interface ScrollMargin {
	top   : number
	left  : number
	right : number
	bottom: number
}
```

- top   : 上までの余白
- left  : 左までの余白
- right : 右までの余白
- bottom: 下までの余白

---

### getScrollMargin
スクロールの余白を取得

```ts
export const getScrollMargin = function (e: Event): ScrollMargin
```

- e: イベント

---

### MatrixState
transform 情報

```ts
export interface MatrixState {
	translate: {
		x: number
		y: number
		z: number
	}

	scale: {
		x: number
		y: number
		z: number
	}

	// radian
	rotate: {
		x: number
		y: number
		z: number
	}
}
```

---

### getMatrixState
DOM から transfrom 情報を取得する

```ts
export const getMatrixState = (
	dom: HTMLElement
): MatrixState | null
```

- dom : 情報を取得する DOM

---

### effect_setTimedValue
ステートに存在時間制限付きの値を設定

*実験用コードのため、npm 非公開です*

```ts
export const effect_setTimedValue = function <S, T> (
	keyNames: string[],
	id      : string,
	timeout : number,
	value   : T,
	reset   : T | null = null
): (dispatch: Dispatch<S>) => void
```

- keyNames: 値までのパス
- id      : ユニークID
- timeout : 存在可能時間 (ms)
- value   : 一時的に設定する値
- reset   : タイムアウト後に設定する値

---

### effect_nodesInitialize
VNode マウント後の初期化処理を実行

*実験用コードのため、npm 非公開です*

```ts
export const effect_nodesInitialize = function <S> (
	nodes: {
		id   : string
		event: (state: S, element: Element) => S | [S, Effect<S>]
	}[]
): (dispatch: Dispatch<S>) => void
```

- nodes      : 初期化対象ノード定義配列
- nodes.id   : ユニークID
- nodes.event: 初期化イベント

---

### subscription_nodesCleanup
DOM 消失時にクリーンアップ処理を実行

*実験用コードのため、npm 非公開です*

```ts
export const subscription_nodesCleanup = function <S>(
	nodes: {
		id      : string
		finalize: (state: S) => S | [S, Effect<S>]
	}[]
): Subscription<S>[]
```

- nodes         : クリーンアップ対象ノード定義配列
- nodes.id      : ユニークID
- nodes.finalize: 終了時イベント

---

### subscription_nodesLifecycleByIds
ステート上の ID 配列変化に応じて initialize / finalize を自動管理

*実験用コードのため、npm 非公開です*

```ts
export const subscription_nodesLifecycleByIds = function <S> (
	keyNames: string[],
	nodes: {
		id        : string
		initialize: (state: S, element: Element | null) => S | [S, Effect<S>]
		finalize  : (state: S, element: Element | null) => S | [S, Effect<S>]
	}[]
): Subscription<S>[]
```

- keyNames        : 文字配列までのパス
- nodes           : 監視対象ノード定義配列
- nodes.id        : ユニークID
- nodes.initialize: 初期化イベント
- nodes.finalize  : 終了時イベント
