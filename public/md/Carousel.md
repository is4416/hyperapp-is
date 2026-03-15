# Carousel
コンポーネントの使用には、次のステップが必要です

- コンポーネントの設定

```ts
export const Carousel = function <S> (
	props: {
		state         : S
		id            : string
		keyNames      : Keys_ArrayRAFTask
		controlButton?: boolean
		controlBar   ?: boolean
		skipSpeedRate?: number
		[key: string] : any
	},
	children: any
): VNode<S>
```

| props         | 説明                         | 備考               |
| ---           | ---                          | ---                |
| state         | ステート                     | 必須               |
| keyNames      | RAFTask[] までのパス         | 必須               |
| controlBar    | コントロールバーを表示する   | オプション         |
| controlBar    | コントロールボタンを表示する | オプション         |
| skipSpeedRate | スキップ時の速度             | オプション (0 - 1) |

- サブスクリプションに `subscription_RAFManager` を用意
- ステートに `RAFTask[]` を用意
- エフェクトで初期化

例
```ts
const param: State = {
  tasks: [] // RAFTask[] <- ステートに RAFTask[] を用意
}

app({
  view: (state: State) => (<div id="app">
 
    {/* コンポーネントの設定 */}
    <Carousel
      state    = { state }
      id       = "carousel"
      keyNames = ["tasks"]
    >
      <div>1</div>
      <div>2</div>
      <div>3</div>
    </Carousel>
  </div>),

  {/* サブスクリプションに `subscription_RAFManager` を用意 */}
  subscriptions: (state: State) => [
    subscription_RAFManager(state, ["tasks"])
  ],

  {/* ステートに RAFTask[] を用意 + エフェクトで初期化 */
  init: [param, (dispatch: Dispatch) => {
    dispatch((state: State) => {
      return [state, effect_InitCarousel(["tasks"], {
        id  : "carousel",
        step: 1
      }))
    })
  }],

  node: document.getElementById("app") as HTMLElement
})
```

---

コンポーネントは、概ね次の形になります  
`controlBar` `controlButton` の値の有無で、若干形状が変わります

```html
  <div id = { id }>
    <ul>{
      children.map((child, i) => (<li
        absoluteIndex = `${ i }`
      >{ child }</li>))
    }</ul>

    <!-- controlBar -->
    <div>
      <button></button>
      <ul>{
        children.map(child => (<li>・</li>))
      }</ul>
      <button></button>
    </div>
  </div>
```

---

コンポーネントのスタイルは提供しないので、任意のスタイルを適用してください

参考
```css
.carousel {
	overflow     : hidden;
	border       : 3px black solid;
	border-radius: 0.5rem;

	> ul {
		list-style: none;
		display   : flex;

		> li {
			flex-shrink: 0;

			> img {
				width       : 100%;
				height      : 100%;
				aspect-ratio: 1;
				object-fit  : cover;
			}
		}
	}

	/* controlBar */
	> div {
		display    : flex;
		align-items: center;
		padding    : 0.5rem;

		> ul {
			list-style: none;
			display   : flex;

			> li {
				margin-right: 0.5rem;
				cursor      : pointer;

				&.select {
					color : red;
					cursor: auto;
				}
			}
		}

		/* controlButton */
		> button {
			margin-right: 0.5rem;
			padding     : 5px;
		}
	}
}

#sample_carousel1,
#sample_carousel2 {
	> ul {
		> li {
			width: calc(100% / 3);
		}
	}
}

#sample_carousel3 {
	> ul {
		> li {
			width: calc(100% / 5);
		}
	}
}
```

---

コンポーネントの動作は、エフェクトに設定する値で行います

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
	reportPageIndex?: Keys_Number
}
```

```ts
export const effect_InitCarousel = function <S> (
	keyNames     : Keys_ArrayRAFTask,
	carouselState: CarouselState<S>
): (dispatch: Dispatch<S>) => void
```

---

#sample_carousel1

```ts
const param1: CarouselState<State> = {
	id  : "sample_carousel1",
	step: 1
}
```

`id` `step` の設定は必須です  
`step` に負の数を指定すると、逆回転になります

---

#sample_carousel2

```ts
const param2: CarouselState<State> = {
	id      : "sample_carousel2",
	step    : -1,
	duration: 3000,
	delay   : 500,
	easing  : progress_easing.easeOutBounce // default: (t: number) => t
}
```

`duration` は、1回あたりのアニメーション実行時間  
`delay` は、アニメーション開始までの待機時間  
`easing` は、動作に関する設定

---

#sample_carousel3
```ts
const param3: CarouselState<State> = {
	id      : "sample_carousel3",
	step    : 1,
	duration: 2000,
	delay   : 0,
	finish  : (state: State, rafTask: RAFTask<State>): State | [State, InternalEffect<State>] => {
		const id = "sample_carousel3"

		const dom = document.getElementById(id) as HTMLElement
		if (!dom) return state

		const ul = dom.querySelector("ul") as HTMLUListElement
		if (!ul) return state

		const child = ul.firstChild as HTMLLIElement
		if (!child)	return state

		const pageNumber = Number(child.getAttribute("absoluteIndex"))

		if (pageNumber !== 0 && pageNumber !== 3) return state

		const newTask = rafTask.clone()
		const param: CarouselState<State> = newTask.extension?.carouselState
		if (!param) return state

		param.step = pageNumber === 0 ? 1 : -1

		return setValue(state, tasks, state.tasks
			.filter(task => task.id !== id)
			.concat(newTask)
		)
	}
}
```

`finish` は、タスク終了後に呼ばれるコールバック  
(フレームごとに呼ばれる `action` も用意しています)

ステートの `RAFTask` を置き換えることで、動作を変更します  
`RAFTask.extension.carouselState` に、変更前のステートが含まれています

今回は使用しませんが `RAFTask.extension.carouselController` を使用し、外部からコンポーネントを動作させることも可能です

```ts
export interface CarouselController <S> {
	step  : (rafTask: RAFTask<S>, delta: number, skipSpeedRate?: number) => Promise <RAFTask<S>>
	moveTo: (RAFTask: RAFTask<S>, index: number, skipSpeedRate?: number) => Promise <RAFTask<S>>
}
```

