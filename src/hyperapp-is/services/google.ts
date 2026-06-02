// ========== ========== ========== ========== ==========
// import
// ========== ========== ========== ========== ==========

import type { Dispatch, Effect } from "hyperapp"

// ========== ========== ========== ========== ==========
// type
// ========== ========== ========== ========== ==========

// ---------- ---------- ---------- ---------- ----------
// type GoogleScope
// ---------- ---------- ---------- ---------- ----------

export type GoogleScope =

// --------------------
	// 基本（必須系）
	// --------------------
	| "openid"
	| "email"
	| "profile"

	// --------------------
	// Google Drive
	// --------------------
	| "https://www.googleapis.com/auth/drive"
	| "https://www.googleapis.com/auth/drive.readonly"
	| "https://www.googleapis.com/auth/drive.file"
	| "https://www.googleapis.com/auth/drive.metadata.readonly"
	| "https://www.googleapis.com/auth/drive.appdata"

	// --------------------
	// Google Calendar
	// --------------------
	| "https://www.googleapis.com/auth/calendar"
	| "https://www.googleapis.com/auth/calendar.readonly"
	| "https://www.googleapis.com/auth/calendar.events"
	| "https://www.googleapis.com/auth/calendar.events.readonly"

	// --------------------
	// Gmail
	// --------------------
	| "https://www.googleapis.com/auth/gmail.readonly"
	| "https://www.googleapis.com/auth/gmail.modify"
	| "https://www.googleapis.com/auth/gmail.send"
	| "https://www.googleapis.com/auth/gmail.compose"
	| "https://www.googleapis.com/auth/gmail.labels"

	// --------------------
	// Google Sheets
	// --------------------
	| "https://www.googleapis.com/auth/spreadsheets"
	| "https://www.googleapis.com/auth/spreadsheets.readonly"

	// --------------------
	// Google Docs
	// --------------------
	| "https://www.googleapis.com/auth/documents"
	| "https://www.googleapis.com/auth/documents.readonly"

	// --------------------
	// Google Slides
	// --------------------
	| "https://www.googleapis.com/auth/presentations"
	| "https://www.googleapis.com/auth/presentations.readonly"

	// --------------------
	// Google Forms
	// --------------------
	| "https://www.googleapis.com/auth/forms"
	| "https://www.googleapis.com/auth/forms.responses.readonly"

	// --------------------
	// YouTube
	// --------------------
	| "https://www.googleapis.com/auth/youtube.readonly"
	| "https://www.googleapis.com/auth/youtube"
	| "https://www.googleapis.com/auth/youtube.upload"
	| "https://www.googleapis.com/auth/youtube.force-ssl"

	// --------------------
	// Userinfo系（レガシー互換）
	// --------------------
	| "https://www.googleapis.com/auth/userinfo.email"
	| "https://www.googleapis.com/auth/userinfo.profile"

	// --------------------
	// ローカル拡張（安全逃げ道）
	// --------------------
	| (string & {})

// ========== ========== ========== ========== ==========
// interface
// ========== ========== ========== ========== ==========

// ---------- ---------- ---------- ---------- ----------
// interface GoogleAccountsId
// ---------- ---------- ---------- ---------- ----------

export interface GoogleAccountsId {
	initialize(
		config: {
			client_id   : string
			auto_select?: boolean
			ux_mode    ?: "popup" | "redirect"
			callback: (
				response: {
					credential: string
				}
			) => void
		}
	): void

	disableAutoSelect(): void
	cancel(): void

	prompt(callback?: (notification: any) => void): void

	renderButton(
		parent: HTMLElement,
		options?: {
			theme?: "outline" | "filled_blue" | "filled_black"
			size ?: "large" | "medium" | "small"
			text ?: "signin_with" | "signup_with" | "continue_with"
			shape?: "rectangular" | "pill" | "circle" | "square"
		}
	): void

	revoke(
		hint: string, // email or sub
		callback: () => void
	): void
}

// ---------- ---------- ---------- ---------- ----------
// interface GoogleTokenClient
// ---------- ---------- ---------- ---------- ----------

export interface GoogleTokenClient {
	requestAccessToken(options?: {
		prompt?: "none" | "consent" | "select_account"
	}): void
}

// ---------- ---------- ---------- ---------- ----------
// interface GoogleAccountsOAuth2
// ---------- ---------- ---------- ---------- ----------

export interface GoogleAccountsOAuth2 {
	initTokenClient(config: {
		client_id: string
		scope    : string
		callback : (response: {
			access_token?: string
			error       ?: string
		}) => void
	}): GoogleTokenClient
}

// ---------- ---------- ---------- ---------- ----------
// interface GoogleAccounts
// ---------- ---------- ---------- ---------- ----------

export interface GoogleAccounts {
	id    : GoogleAccountsId
	oauth2: GoogleAccountsOAuth2
}

// ---------- ---------- ---------- ---------- ----------
// interface Google
// ---------- ---------- ---------- ---------- ----------

export interface Google {
	accounts: GoogleAccounts
}

// ---------- ---------- ---------- ---------- ----------
// interface GoogleAuthConfig
// ---------- ---------- ---------- ---------- ----------

export interface GoogleAuthConfig {
	clientId   : string
	autoSelect?: boolean              // default: true
	uxMode    ?: "popup" | "redirect" // default: "popup"
}

// ---------- ---------- ---------- ---------- ----------
// interface GoogleUser
// ---------- ---------- ---------- ---------- ----------

export interface GoogleUser {
	name   : string
	email  : string
	picture: string
	sub    : string
}

// ---------- ---------- ---------- ---------- ----------
// interface GoogleAuthResult
// ---------- ---------- ---------- ---------- ----------

export interface GoogleAuthResult {
	idToken: string
	user   : GoogleUser
}

// ---------- ---------- ---------- ---------- ----------
// interface GetAccessTokenConfig
// ---------- ---------- ---------- ---------- ----------

export interface GetAccessTokenConfig {
	clientId: string
	scope   : GoogleScope[]
	prompt ?: "none" | "select_account" | "consent" // default: "select_account"
}

// ========== ========== ========== ========== ==========
// procedure
// ========== ========== ========== ========== ==========

// ---------- ---------- ---------- ---------- ----------
// getGoogle
// ---------- ---------- ---------- ---------- ----------

// 2重読み込み防止用の変数
let googlePromise: Promise<Google> | null = null

/**
 * Google 変数を取得する
 */
export const getGoogle = async (): Promise<Google> => {
	if ((window as any).google) return (window as any).google

	if (googlePromise) return googlePromise

	googlePromise = new Promise((resolve, reject) => {
		const script = document.createElement("script")
		script.src = "https://accounts.google.com/gsi/client"

		// success
		script.addEventListener("load", () => {
			const result = (window as any).google

			if (result) {
				resolve(result)
			} else {
				reject(new Error("error: loadGoogle: 001"))
			}
		})

		// error
		script.addEventListener("error", () => {
			reject(new Error("error: loadGoogle: 002"))
		})

		// append child
		document.body.appendChild(script)
	})

	return googlePromise
}

// ---------- ---------- ---------- ---------- ----------
// getGoogleAuthResult
// ---------- ---------- ---------- ---------- ----------
/**
 * idToken から ユーザー情報を取得
 *
 * @param {string} idToken - ユーザートークン
 * @returns {GoogleAuthResult}
 */
export const getGoogleAuthResult = (idToken: string): GoogleAuthResult => {
	const base64 = idToken.split(".")[1]
		.replace(/-/g, "+")
		.replace(/_/g, "/")

	const decode = (str: string) => decodeURIComponent(
		atob(str)
			.split("")
			.map(c => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
			.join("")
	)

	const payload = JSON.parse(decode(base64))

	const user = {
		name   : payload.name,
		email  : payload.email,
		picture: payload.picture,
		sub    : payload.sub
	}

	return {
		idToken,
		user
	}
}

// ---------- ---------- ---------- ---------- ----------
// getAccessToken
// ---------- ---------- ---------- ---------- ----------

export const getAccessToken = async (config: GetAccessTokenConfig): Promise<string> => {
	const google = await getGoogle()

	return new Promise((resolve, reject) => {
		// variable
		const prompt = config.prompt ?? "select_account"

		// initialize
		const tokenClient = google.accounts.oauth2.initTokenClient({
			client_id: config.clientId,
			scope    : config.scope.join(" "),
			callback : (response: {
				access_token?: string
				error       ?: string
			}) => {
				if (response.error) {
					reject(response)
				} else {
					if (response.access_token) {
						resolve(response.access_token)
					} else {
						reject(new Error("No access_token"))
					}
				}
			}
		}) // end initialize

		// request AccessToken
		tokenClient.requestAccessToken({ prompt }) // prompt == "none" のときには、事前にログインが必要
	})
}

// ---------- ---------- ---------- ---------- ----------
// class GoogleAuth
// ---------- ---------- ---------- ---------- ----------

interface GoogleButtonOptions {
	renderButton?: HTMLElement
	theme       ?: "outline" | "filled_blue" | "filled_black"      // default: outline
	size        ?: "large" | "medium" | "small"                    // default: medium
	text        ?: "signin_with" | "signup_with" | "continue_with" // default: signin_with
	shape       ?: "rectangular" | "pill" | "circle" | "square"    // default: rectangular
}

export class GoogleAuth {
	// field
	#config     : GoogleAuthConfig
	#options    : GoogleButtonOptions
	#google    ?: Google
	#initialized: boolean

	// constructor
	constructor (config: GoogleAuthConfig, options?: GoogleButtonOptions) {
		this.#config  = config
		this.#options = options ?? {}
		this.#initialized = false
	}

	// method: initialize
	async initialize(): Promise<GoogleAuthResult | null> {
		if (this.#initialized) {
			throw new Error("Already initialized")
		}
		this.#initialized = true

		this.#google = await getGoogle()

		const client = this.#google.accounts.id

		if (this.#options?.renderButton) {
			client.renderButton(this.#options.renderButton, {
				theme: this.#options.theme ?? "outline",
				size : this.#options.size  ?? "medium",
				text : this.#options.text  ?? "signin_with",
				shape: this.#options.shape ?? "rectangular",
			})
		}

		return new Promise(resolve => {
			let resolved = false

			const callback = (response: { credential: string }) => {
				if (resolved) return
				resolved = true
				resolve(getGoogleAuthResult(response.credential))
			}

			client.initialize({
				client_id  : this.#config.clientId,
				auto_select: this.#config.autoSelect ?? true,
				ux_mode    : this.#config.uxMode ?? "popup",
				callback
			})

			client.prompt((notification) => {
				if (
					!resolved && (
						notification.isNotDisplayed() ||
						notification.isSkippedMoment()
					)
				) {
					resolved = true
					resolve(null)
				}
			})
		})
	}

	// method: logout
	logout(hint: string): void {
		if (!this.#google) return

		const client = this.#google.accounts.id

		client.disableAutoSelect()
		client.cancel()
		client.revoke(hint, () => {})

		this.#initialized = false
	}
}
