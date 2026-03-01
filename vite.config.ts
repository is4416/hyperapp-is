import { defineConfig } from "vite"

export default defineConfig ({
	base: "/hyperapp-is/",
	esbuild: {
		jsxFactory: "h"
	},
	build: {
		minify: false,
		outDir: "docs"
	}
})
