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
		globalThis.WRANGLER_PROCESS?.kill();
		globalThis.WRANGLER_PROCESS = undefined;
	});

	const createEnv = (runServer: boolean = false) =>
		createPluginTestEnv({
			plugins: createEnvPlugin(),
			runServerStart: runServer,
			startServer: runServer,
		});

	test("notFound in build output", async () => {
		env = await createEnv();

		const buildResult = await env.build();

		const absOutdir = join(
			process.cwd(),
			env.builder.getConfig()?.outdir as string,
		);

		const notFoundOutput = buildResult.outputs.find(
			(out) => out.path === join(absOutdir, "404.html"),
		);
		expect(notFoundOutput).toBeDefined();
		expect(await notFoundOutput?.text()).toContain("Not found");

		const builtHtml = await Bun.file(join(absOutdir, "404.html")).text();
		expect(builtHtml).toContain("data-cf-pages-update-manager");
		expect(builtHtml).toContain("api/__CF_MANAGER__/versionTest");
	});

	test("checkVersion - deleteCache", async () => {
		env = await createEnv(true);
		const res = await env.fetch("/api/__CF_MANAGER__/versionTest");

		const versionRemote = await res.text();
		expect(versionRemote).toSatisfy((id) =>
			new RegExp(/^.*-.*-.*-.*-.*$/).test(id),
		);
		expect(res.headers.get("cache-control")).toContain("no-store");

		const deleteCacheRes = await env.fetch("/api/__CF_MANAGER__/versionTest", {
			method: "DELETE",
		});

		expect(deleteCacheRes.status).toBe(200);
		expect(deleteCacheRes.headers.get("clear-site-data")).toBe('"cache"');
		expect(deleteCacheRes.headers.get("cache-control")).toContain("no-store");
		expect(await deleteCacheRes.text()).toBe("clear browser cache");
	});
});
