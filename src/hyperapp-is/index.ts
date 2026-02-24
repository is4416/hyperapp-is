// core
export {
	getValue, setValue, getLocalState, setLocalState, createLocalKey,
	el, concatAction, getClassList, deleteKeys, Route, SelectButton, OptionButton
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
export { getScrollMargin, getMatrixState, marquee } from "./dom"
