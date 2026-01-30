# hyperapp-ui

HyperappでのUI構築を支援する、再利用可能なコンポーネントと状態操作ユーティリティです。  
Reusable UI components and state management utilities for Hyperapp.

[example](https://is4416.github.io/hyperapp-ui/)  
※ 本ライブラリの実装サンプル

本ライブラリは **イミュータブルなステート更新** と **シンプルな副作用管理** を前提として設計されています。  
JSX を使用する場合は `hyperapp-jsx-pragma` を前提としています。

## Functions / 関数リスト

**core / state.ts**
- [getValue](#getvalue)
- [setValue](#setvalue)
- [getLocalState](#getlocalstate)
- [setLocalState](#setlocalstate)

**core / component.ts**
- [el](#el)
- [concatAction](#concataction)
- [getClassList](#getclasslist)
- [deleteKeys](#deletekeys)
- [Route](#route)
- [SelectButton](#selectbutton)
- [OptionButton](#optionbutton)

**animation / step.ts**
- [effect_throwMessageStart](#effect_throwmessagestart)
- [effect_throwMessagePause](#effect_throwmessagepause--effect_throwmessageresume)
- [effect_throwMessageResume](#effect_throwmessagepause--effect_throwmessageresume)

**animation / raf.ts**
- [InternalEffect](#internaleffect)
- [RAFRuntime](#rafruntime)
- [RAFTask](#raftask)
- [subscription_RAFManager](#subscription_rafmanager)

**animation / properties.ts**
- [CSSProperty](#cssproperty)
- [createUnits](#createunits)
- [createRAFProperties](#createrafproperties)
- [effect_RAFProperties](#effect_rafproperties)

**animation / easing.ts**
- [progress_easing](#progress_easing)

**animation / carousel.ts**
- [CarouselState](#carouselstate)
- [createRAFCarousel](#createrafcarousel)
- [effect_carouselStart](#effect_carouselstart)

**dom / utils.ts**
- [ScrollMargin](#scrollmargin)
- [getScrollMargin](#getscrollmargin)
- [MatrixState](#matrixstate)
- [getMatrixState](#getmatrixstate)
- [marquee](#marquee)

**dom / lifecycle.ts**
- [effect_setTimedValue](#effect_settimedvalue)
- [effect_nodesInitialize](#effect_nodesinitialize)
- [subscription_nodesCleanup](#subscription_nodescleanup)
- [subscription_nodesLifecycleByIds](#subscription_nodeslifecyclebyids)

## Design / 設計方針

### ライブラリの目的

Hyperapp はステートの形に制約がないため、コンポーネントを作る際にはどのステートを参照・更新するかを事前に決めておく必要があります。  
本ライブラリでは、コンポーネントに「目的の値がどこにあるか」を通知する設計を採用することにより、hyperapp の自由度を保ちつつ、再利用可能な構造を提供します。

---

### core / state.ts

基本的なステート操作関数

- `getValue` / `setValue`           : パスを指定して値を取得・設定
- `getLocalState` / `setLocalState` : コンポーネント内部の一時状態を ID キーで管理

---

### core / component.ts

基本コンポーネント設計関数

- `el`           : hyperapp h 関数のラッパー
- `concatAction` : アクションを統合して結果を返す
- `getClassList` : props から classList を取得
- `deleteKeys`   : props から不要なキーを削除
- `Route`        : ステート内の文字と match した時、VNode を返す
- `SelectButton` / `OptionButton` : クリックで、クラス名 `select` をトグルするボタン

---

### animation / step.ts

タイマーを利用したアニメーションのステップ処理

- `effect_throwMessageStart` / `effect_throwMessagePause` / `effect_throwMessageResume` :  
    ステートに文字を1文字ずつ流し込むエフェクト

---

### animation / raf.ts

requestAnimationFrame を利用した処理

- `InternalEffect`          : Dispatch の内部処理から呼び出されるエフェクトで、戻り値とならない  
  設計意図を明示するための型エイリアス (型としては `Effect` と同一)
- `RAFRuntime`              : 即時反映が必要な mutable 処理専用オブジェクト
- `RAFTask`                 : rAF タスク定義オブジェクト
- `subscription_RAFManager` : RAFTask をフレームごとに実行させるサブスクリプション  
  タスクの並び替え・進捗管理・終了判定を一括で行う

---

### animation / properties.ts

rAF を利用した CSS設定

- `CSSProperty`          : CSS 設定用オブジェクト
- `createUnits`          : CSSProperty[] から doms と styles のセットに変換
- `createRAFProperties`  : CSS アニメーション RAFTask を作成する
- `effect_RAFProperties` : rAF をベースにした、CSSアニメーションエフェクト

---

### animation / easing.ts

- `progress_easing` : easing プリセット

---

### animation / carousel.ts

- `CarouselState`        : Carousel 管理用オブジェクト
- `createRAFCarousel`    : Carousel アニメーション RAFTask を作成する
- `effect_carouselStart` : subscription_RAFManager をベースにした Carousel アニメーションエフェクト

---

### dom / utils

DOM を直接扱うユーティリティ

- `ScrollMargin`    : スクロールの余白を管理するオブジェクト
- `getScrollMargin` : スクロールの余白を取得
- `MatrixState`     : transform 情報
- `getMatrixState`  : DOM から transfrom 情報を取得する
- `marquee`         : Carousel 風に DOM が流れるアニメーションを実行する

---

### dom / lifecycle.ts

DOM のライフサイクルを管理するための関数

- `effect_setTimedValue`      : 存在時間制限付きの値をステートにセットするエフェクト
- `effect_nodesInitialize`    : DOM 生成後にノードを初期化するためのエフェクト
- `subscription_nodesCleanup` : DOM が存在しない場合にクリーンアップ処理を行うためのサブスクリプション
- `subscription_nodesLifecycleByIds` : 登録された id を元に DOM を監視し、初期化・終了処理を行うためのサブスクリプション

## source file / ソースファイル

```
src
 └ hyperapp-ui
     ├ index.ts
     │
     ├ core
     │  ├ state.ts
     │  │   getValue, setValue, getLocalState, setLocalState
     │  │
     │  └ component.ts
     │       el, concatAction, getClassList, deleteKeys
     │       Route, SelectButton, OptionButton
     │
     ├ animation
     │  ├ step.ts
     │  │   effect_throwMessageStart, effect_throwMessagePause, effect_throwMessageResume
     │  │
     │  ├ raf.ts
     │  │   InternalEffect
     │  │   RAFRuntime
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
     │  └ carousel.ts
     │       CarouselState
     │       createRAFCarousel
     │       effect_carouselStart
     │
     └ dom
         ├ utils.ts
         │   ScrollMargin
         │   getScrollMargin
         │   MatrixState
         │   getMatrixState
         │   marquee
         │
         └ lifecycle.ts
              effect_setTimedValue
              effect_nodesInitialize
              subscription_nodesCleanup
              subscription_nodesLifecycleByIds
```

## hyperapp-ui/core

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

### el
Hyperapp の h 関数ラッパー。JSX と競合する場合に使用  
children の処理も同時に行っているため、本ライブラリでは VNode を作成する際に使用しています

```ts
export const el = (tag: string) => <S> (
	props   ?: { [key: string]: any },
	children?: Array<any>
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

## hyperapp-ui/animation

### effect_throwMessageStart
文字を一文字ずつ流し込むエフェクト

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

このときアクションを `(state: S) => S | [S, Effect<S>]` とせず `(state: S) => S | [S, InternalEffect<S>]`とすることで、  
エフェクトが戻り値とならないことを明示します ( Dispatch 内でエフェクトが戻せない罠対策です )

**ポイント**

- 戻り値として使用されず、Dispatch 内でのみ実行される
- `Effect<S>` と同一
- 内部専用であることを、型で明示

---

### RAFRuntime
`requestAnimationFrame` による処理において  
即時反映が必要な mutable な実行状態を管理するオブジェクト


```ts
export interface RAFRuntime {
	startTime  ?: number
	currentTime?: number
	pausedTime ?: number
	paused     ?: boolean
	isDone     ?: boolean

	progress ?: number
	deltaTime?: number
}
```

- startTime  ?: アクション開始時間
- currentTime?: 実行時間
- pausedTime ?: 一時停止時間
- paused     ?: 一時停止フラグ
- isDone     ?: 処理終了フラグ
- progress   ?: 進捗状況 (0 - 1)
- deltaTime  ?: 前回からの経過時間

**重要**

`RAFRuntime` は、mutable なオブジェクトとして扱われます  
ステートにセットする際はクローンせず、参照を維持してください

**概要**

rAF のフレーム中に、即座に反映する必要がある状態を保持します  
`subscription_RAFManager` が直接参照・更新します  
ステートとは役割を分離しています

---

### RAFTask
requestAnimationFrame (rAF) を管理するためのオブジェクト

!! **RAFTask** は内部に mutable な runtime を持つため、将来的にクラスへ移行する予定です !!

```ts
export interface RAFTask <S> {
	id      : string
	groupID?: string
	duration: number
	delay  ?: number

	// runtime accessors
	readonly progress ?: number
	readonly deltaTime?: number
	paused?: boolean

	// event
	action : (state: S, rafTask: RAFTask<S>) => S | [S, InternalEffect<S>]
	finish?: (state: S, rafTask: RAFTask<S>) => S | [S, InternalEffect<S>]

	// mutable
	runtime: RAFRuntime

	// extension
	priority ?: number
	extension?: { [key: string]: any }
}
```

基本情報
- id      : ユニークID
- groupID?: グループID
- duration: 1回あたりの処理時間 (ms)
- delay  ?: 開始までの待機時間 (ms)

時間情報 (内部管理用)
- progress ?: 進捗状況 (0 - 1)   // readonly
- deltaTime?: 前回からの実行時間 // readonly
- paused   ?: 一時停止フラグ     // runtime.paused の公開用プロパティ

アクション
- action : アクション
- finish?: 終了時アクション

実行制御・拡張
- runtime   : runtime (mutable)
- priority ?: 処理優先順位
- extension?: 拡張用オプション

**重要**
action / finish は、Dispatch 内で実行されるため、エフェクトを返すことができません  
(dispatch の再入・無限ループを防ぐための制約です)  
エフェクトが必要な場合、`setTimeout` / `setInterval` / `requestAnimationFrame`  
などの非同期境界を必ず挟んでください

例: ` requestAnimationFrame(() => dispatch(...))`

---

### subscription_RAFManager
RAFTask 配列をフレームごとに実行するサブスクリプション

```ts
export const subscription_RAFManager = function <S> (
	state   : S,
	keyNames: string[]
): Subscription<S>
```
*リアルタイム制御のため、ステート内の RAFTask.isDone は直接変更されます*

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
		extension?: { [key: string]: any }

		properties: CSSProperty[]
	}
): RAFTask<S>
```

props は、基本的に RAFTask の値

- properties: セレクタとスタイル設定のセット配列

**重要**
finish は、Dispatch 内で実行されるため、エフェクトを返すことができません  
(dispatch の再入・無限ループを防ぐための制約です)  
エフェクトが必要な場合、`setTimeout` / `setInterval` / `requestAnimationFrame`  
などの非同期境界を必ず挟んでください

例: ` requestAnimationFrame(() => dispatch(...))`

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
		extension?: { [key: string]: any }

		properties: CSSProperty[]
		keyNames  : string[]
	}
): (dispatch : Dispatch<S>) => void
```

props は、基本的に RAFTask の値

- properties: セレクタとスタイル設定のセット配列
- keyNames  : RAFTask 配列までのパス

**重要**
finish は、Dispatch 内で実行されるため、エフェクトを返すことができません  
(dispatch の再入・無限ループを防ぐための制約です)  
エフェクトが必要な場合、`setTimeout` / `setInterval` / `requestAnimationFrame`  
などの非同期境界を必ず挟んでください

例: ` requestAnimationFrame(() => dispatch(...))`

---

### CarouselState
Carousel 管理用オブジェクト

```ts
export interface CarouselState {
	width: number
	index: number
	total: number
}
```

- width: 移動量
- index: 先頭のインデックス
- total: 子の数

---

### createRAFCarousel
subscription_RAFManager をベースにした Carousel アニメーション RAFTask を作成する

```ts
export const createRAFCarousel = function <S> (
	props: {
		id      : string
		groupID?: string
		duration: number
		delay   : number

		finish?: (state: S, rafTask: RAFTask<S>) => S | [S, InternalEffect<S>]

		priority ?: number
		extension?: { [key: string]: any }

		easing ?: (t: number) => number
		carouselState: CarouselState
	}
): RAFTask<S>
```

- props は、基本的に RAFTask の値
- easing       : easing 関数
- carouselState: カルーセル情報

**重要**
finish は、Dispatch 内で実行されるため、エフェクトを返すことができません  
(dispatch の再入・無限ループを防ぐための制約です)  
エフェクトが必要な場合、`setTimeout` / `setInterval` / `requestAnimationFrame`  
などの非同期境界を必ず挟んでください

例: ` requestAnimationFrame(() => dispatch(...))`

---

### effect_carouselStart
`subscription_RAFManager` をベースにした Carousel アニメーションエフェクトです

```ts
export const effect_carouselStart = function <S> (
	props: {
		id      : string
		groupID?: string
		duration: number
		delay   : number

		finish?: (state: S, rafTask: RAFTask<S>) => S | [S, InternalEffect<S>]

		priority ?: number
		extension?: { [key: string]: any }

		easing ?: (t: number) => number

		keyNames: string[]
	}
): (dispatch: Dispatch<S>) => void
```

- props は、基本的に RAFTask の値
- easing  : easing 関数
- keyNames: RAFTask 配列までのパス

**説明**

marquee は単純な DOM に対しての副作用で、Carousel としての動作は  
ステート経由で rAF を制御しているこちらに集約されることになります

marquee はステートを通さず直接 DOM に対して副作用を発生させるため  
用途によっては marquee に優位性があります

- marquee : DOM 直接操作。軽量で即時反映
- effect_carouselStart : Hyperapp のステート経由で管理。RAFManager と連携可能

**重要**
finish は、Dispatch 内で実行されるため、エフェクトを返すことができません  
(dispatch の再入・無限ループを防ぐための制約です)  
エフェクトが必要な場合、`setTimeout` / `setInterval` / `requestAnimationFrame`  
などの非同期境界を必ず挟んでください

例: ` requestAnimationFrame(() => dispatch(...))`

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

## hyperapp-ui/dom

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

### marquee
Carousel 風に DOM が流れるアニメーションを実行します

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

### effect_setTimedValue
ステートに存在時間制限付きの値を設定

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

## Notes
- This library assumes immutable state updates.
- Designed for Hyperapp with effect-based side effects.
- JSX usage assumes `hyperapp-jsx-pragma`.

## License
MIT
