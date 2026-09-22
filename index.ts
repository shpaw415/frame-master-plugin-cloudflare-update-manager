import { join } from "node:path";
import { getBuildUnifierContext } from "frame-master/plugin";
import type { FrameMasterPlugin } from "frame-master/plugin/types";
import { name, version } from "./package.json";

export type CloudflareUpdateManagerPluginOptions = {
	paths: {
		notFound: string | (() => string);
		actionBasePath: string;
	};
};

export const FUNCTION_PATHS = {
	versionTestEndpoint: "api/versionTest.js",
} as const;

/**
 * cloudflare-update-manager - Frame-Master Plugin
 *
 * Description: Add your plugin description here
 */
export default function cloudflareupdatemanager(
	props: CloudflareUpdateManagerPluginOptions,
): FrameMasterPlugin {
	const pathToVersionTestEndpoint = join(
		props.paths.actionBasePath,
		FUNCTION_PATHS.versionTestEndpoint,
	);
	const virtualModuleContent = `
	const CURRENT_VERSION = "${Bun.randomUUIDv7()}";
	export const onRequestGet = () => { return new Response(CURRENT_VERSION); } ;
	export const onRequestDelete = () => { return new Response("clear browser cache", {
		headers: {
			"Clear-Site-Data": "*",
		},
	}); } ;
	`;
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
		},
		createContext() {
			getBuildUnifierContext()?.setBuildConfig?.(name, {
				buildConfig: {
					files: {
						[pathToVersionTestEndpoint]: virtualModuleContent,
					},
					entrypoints: [pathToVersionTestEndpoint],
				},
			});
		},
		virtualModules: {
			[pathToVersionTestEndpoint]: {
				contents: virtualModuleContent,
				injectRuntime: true,
				loader: "js",
			},
		},
	};
}
