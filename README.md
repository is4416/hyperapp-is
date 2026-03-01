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

interface State {
	tasks: RAFTask<State>[]
}

const initState: State = {
	tasks: []
}

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