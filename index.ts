// core
export { getValue, setValue, getLocalState, setLocalState, createLocalKey } from './core/state'
export { el, concatAction, getClassList, deleteKeys } from "./core/component"
export { effect_toast } from "./core/effects"

// dom
export type { ScrollMargin } from "./dom/utils"
export { getScrollMargin } from "./dom/utils"
export { withLoadingDialog } from "./dom/dialog"

// animation
export type { RAFEvent } from "./animation/raf"
export { RAFTask, subscription_RAFManager } from "./animation/raf"
export { progress_easing } from "./animation/easing"
export type { CSSProperty } from "./animation/properties"
export { createRAFProperties, effect_RAFProperties } from './animation/properties'

// services
export type { GoogleScope, GetAccessTokenConfig, GoogleUser, GoogleAuthResult, GoogleAuthConfig, GoogleButtonOptions } from "./services/google"
export { getAccessToken, GoogleAuth } from "./services/google"
