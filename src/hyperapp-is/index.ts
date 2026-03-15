// hyperapp-is / index.ts

// core
export type {
	Keys,
	Keys_String, Keys_ArrayString,
	Keys_Number, Keys_ArrayNumber,
	Keys_ArrayRAFTask,
	Keys_NavigatorItem,
} from "./core/state"
export type { NavigatorItem, JsonEntry, NavigatorColumn } from "./core/navigator"
export { getValue, setValue, getLocalState, setLocalState, createLocalKey } from "./core/state"
export { el, concatAction, getClassList, deleteKeys, Route, SelectButton, OptionButton } from "./core/component"
export { convertJsonToNavigatorItem, getParentItems, NavigatorFinder } from "./core/navigator"

// animation
export type { InternalEffect, RAFEvent } from "./animation/raf"
export type { CSSProperty } from "./animation/properties"
export { RAFTask, subscription_RAFManager } from "./animation/raf"
export { progress_easing } from "./animation/easing"
export { createUnits, createRAFProperties, effect_RAFProperties } from "./animation/properties"

// animationView
export type { CarouselState, CarouselController } from "./animationView/carousel"
export { Carousel, effect_InitCarousel } from "./animationView/carousel"

// dom
export type { ScrollMargin, MatrixState } from "./dom/utils"
export { getScrollMargin, getMatrixState } from "./dom/utils"
