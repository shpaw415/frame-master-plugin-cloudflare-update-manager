import { join } from "node:path";
import { getBuildUnifierContext } from "frame-master/plugin";
import type { FrameMasterPlugin } from "frame-master/plugin/types";
import { name, version } from "./package.json";
import { CLEAR_SITE_DATA, FUNCTION_PATHS } from "./src/shared";

export type CloudflareUpdateManagerPluginOptions = {
	paths: {
		notFound: string | (() => string);
		actionBasePath: string;
	};
	autoInjectCheckVersion?: boolean;
};

export { CLEAR_SITE_DATA, FUNCTION_PATHS };

const NO_STORE_HEADERS = {
	"Cache-Control": "no-store, no-cache, must-revalidate",
	"CDN-Cache-Control": "no-store",
	Pragma: "no-cache",
} as const;

const SCRIPT_MARKER = "data-cf-pages-update-manager";

function versionFunctionSource(currentVersion: string) {
	return `"no-action";
const CURRENT_VERSION = ${JSON.stringify(currentVersion)};
const noStore = ${JSON.stringify(NO_STORE_HEADERS)};
export const onRequestGet = () => new Response(CURRENT_VERSION, { headers: noStore });
export const onRequestDelete = () => new Response("clear browser cache", {
	headers: {
		...noStore,
		"Clear-Site-Data": ${JSON.stringify(CLEAR_SITE_DATA)},
	},
});
`;
}

function scriptTag(script: string) {
	return `<script type="module" ${SCRIPT_MARKER}>${script}</script>`;
}

function injectScript(html: string, script: string) {
	if (html.includes(SCRIPT_MARKER)) return html;
	const tag = scriptTag(script);
	if (/<head\b[^>]*>/i.test(html)) {
		return html.replace(/<head\b[^>]*>/i, (open) => `${open}${tag}`);
	}
	if (/<\/body>/i.test(html)) {
		return html.replace(/<\/body>/i, `${tag}</body>`);
	}
	return `${tag}${html}`;
}

let clientScriptPromise: Promise<string> | undefined;

function loadClientScript() {
	clientScriptPromise ??= (async () => {
		const built = await Bun.build({
			entrypoints: [join(import.meta.dir, "src/client.ts")],
			target: "browser",
			format: "esm",
		});
		if (!built.success) {
			const message = built.logs.map((log) => log.message).join("\n");
			throw new Error(message || "Failed to bundle the update checker");
		}
		const output = built.outputs[0];
		if (!output) throw new Error("Update checker bundle was empty");
		return (await output.text()).replaceAll("</script", "<\\/script");
	})();
	return clientScriptPromise;
}

async function injectBuiltHtml(result: Bun.BuildOutput) {
	if (!result.success) return;
	const script = await loadClientScript();
	await Promise.all(
		result.outputs
			.filter((output) => output.path.endsWith(".html"))
			.map(async (output) => {
				const html = await output.text();
				const next = injectScript(html, script);
				if (next !== html) await Bun.write(output.path, next);
			}),
	);
}

/**
 * cloudflare-update-manager - Frame-Master Plugin
 *
 * Drops the browser cache for every file on the origin after a new Cloudflare Pages deploy.
 */
export default function cloudflareupdatemanager(
	props: CloudflareUpdateManagerPluginOptions,
): FrameMasterPlugin {
	const pathToVersionTestEndpoint = join(
		props.paths.actionBasePath,
		FUNCTION_PATHS.versionTestFilePath,
	);
	const autoInjectEnabled = props.autoInjectCheckVersion ?? true;
	const virtualModuleContent = versionFunctionSource(Bun.randomUUIDv7());

	return {
		name,
		version,
		build: {
			buildConfig: async () => {
				return {
					files: {
						"404.html":
							typeof props.paths.notFound === "function"
								? props.paths.notFound()
								: await Bun.file(props.paths.notFound).text(),
					},
					entrypoints: ["404.html"],
				};
			},
			afterBuild: async (_buildConfig, result) => {
				if (!autoInjectEnabled) return;
				await injectBuiltHtml(result);
			},
		},
		createContext() {
			getBuildUnifierContext()?.setBuildConfig?.(name, {
				buildConfig: {
					files: {
						[pathToVersionTestEndpoint]: virtualModuleContent,
					},
					entrypoints: [pathToVersionTestEndpoint],
				},
				afterBuild: async (_buildConfig, result) => {
					if (!autoInjectEnabled) return;
					await injectBuiltHtml(result);
				},
			});
		},
		router: autoInjectEnabled
			? {
					html_rewrite: {
						rewrite: async (rewriter) => {
							const script = await loadClientScript();
							rewriter.on("head", {
								element(element) {
									element.prepend(scriptTag(script), { html: true });
								},
							});
						},
					},
				}
			: undefined,
		virtualModules: {
			[pathToVersionTestEndpoint]: {
				contents: virtualModuleContent,
				injectRuntime: true,
				loader: "js",
			},
		},
	};
}
