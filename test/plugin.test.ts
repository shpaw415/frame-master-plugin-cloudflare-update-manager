import { afterEach, describe, expect, test } from "bun:test";
import { join } from "node:path";
import { createPluginTestEnv, type PluginTestEnv } from "frame-master/testing";
import { createEnvPlugin } from "./shared";

/**
 * Integration tests for cloudflare-update-manager using the Frame-Master plugin test suite.
 * @see https://github.com/shpaw415/frame-master/tree/main/test-suite
 */
describe("cloudflare-update-manager", () => {
	let env: PluginTestEnv | undefined;
	afterEach(async () => {
		await env?.dispose();
		env = undefined;
	});

	const createEnv = () =>
		createPluginTestEnv({
			plugins: createEnvPlugin(),
			runServerStart: false,
		});

	test("notFound in build output", async () => {
		env = await createEnv();

		// Replace with assertions for your routes / build hooks
		expect(env.pluginLoader.getPlugins().some((p) => p.name)).toBe(true);

		const buildResult = await env.build();

		console.log(buildResult);

		const absOutdir = join(
			process.cwd(),
			env.builder.getConfig()?.outdir as string,
		);

		const notFoundOutput = buildResult.outputs.find(
			(out) => out.path === join(absOutdir, "404.html"),
		);
		expect(notFoundOutput).toBeDefined();
		expect(await notFoundOutput?.text()).toContain("Not found");
	});

	/*test("build function with cfFunctionAction", async () => {
		env = await createPluginTestEnv({
			plugins: createEnvPlugin(),
		});
	});*/
});
