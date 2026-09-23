import { mkdirSync } from "node:fs";
import { BuildUnifier } from "frame-master/plugin";
import cfFunctionAction from "frame-master-plugin-cloudflare-pages-functions-action";
import cloudflareupdatemanager from "../index";

const wranglerPort = 8789;

export const createEnvPlugin = () => {
	mkdirSync("test/actions", { recursive: true });
	return BuildUnifier({
		plugins: [
			{
				name: "proxy-to-wrangler",
				version: "0.0.0",
				serverConfig: {
					routes: {
						"/*": async (req) => {
							const url = new URL(req.url);
							url.port = wranglerPort.toString();
							const res = await fetch(url.toString(), req);
							const resText = await res.text();
							const headers = new Headers(res.headers);
							headers.delete("content-encoding");
							headers.delete("transfer-encoding");

							return new Response(resText, {
								status: res.status,
								statusText: res.statusText,
								headers,
							});
						},
					},
				},
				build: {
					buildConfig: {
						entrypoints: ["test/index.html"],
					},
				},
			},
			cfFunctionAction({
				actionBasePath: "test/actions",
				outDir: ".frame-master/build",
				serverPort: wranglerPort,
			}),
			cloudflareupdatemanager({
				paths: {
					notFound: "test/notFound.html",
					actionBasePath: "test/actions",
				},
				autoInjectCheckVersion: true,
			}),
		],
	});
};
