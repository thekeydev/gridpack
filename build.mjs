import { build, context } from "esbuild";

let watch = process.argv.includes("--watch");

let shared = {
	entryPoints: ["src/index.js"],
	bundle: true,
	external: ["react", "react-dom"],
	jsx: "automatic",
	loader: { ".js": "jsx", ".jsx": "jsx", ".md": "text" },
	minify: true,
	sourcemap: true,
};

let configs = [
	{ ...shared, format: "esm", outfile: "dist/index.esm.js" },
	{ ...shared, format: "cjs", outfile: "dist/index.cjs.js" },
	{ ...shared, entryPoints: ["demo/index.jsx"],
		format: "iife", outfile: "demo/index.js", external: undefined },
];

if (watch) {
	let contexts = await Promise.all(configs.map(c => context(c)));
	await Promise.all(contexts.map(c => c.watch()));
	console.log("watching...");
} else {
	await Promise.all(configs.map(c => build(c)));
}
