// hyperapp-is / index.ts

// core
export type {
	Keys, Keys_String, Keys_ArrayString, Keys_NavigatorItem,
	NavigatorItem, JsonEntry, NavigatorColumn
} from "./core"

export {
	getValue, setValue, getLocalState, setLocalState, createLocalKey,
	el, concatAction, getClassList, deleteKeys, Route, SelectButton, OptionButton,
	convertJsonToNavigatorItem, getParentItems, NavigatorFinder
} from "./core"

// animation
export type {
	InternalEffect, RAFEvent, CSSProperty
} from "./animation"

export {
	RAFTask, subscription_RAFManager,
	progress_easing,
	createUnits, createRAFProperties, effect_RAFProperties
} from "./animation"

// animationView
export type { CarouselState, CarouselController } from "./animationView"
export { Carousel, effect_InitCarousel } from "./animationView"

// dom
export type { ScrollMargin, MatrixState } from "./dom"
export { getScrollMargin, getMatrixState } from "./dom"
