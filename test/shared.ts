import { BuildUnifier } from "frame-master/plugin";
import cfFunctionAction from "frame-master-plugin-cloudflare-pages-functions-action";
import cloudflareupdatemanager from "../index";

const wranglerPort = 8789;

export const createEnvPlugin = () =>
	BuildUnifier({
		plugins: [
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
			}),
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
							const removeList = ["content-encoding", "transfer-encoding"];

							const filteredHeaders = Object.entries(res.headers).filter(
								([name, _value]) => !removeList.includes(name.toLowerCase()),
							);

							return new Response(resText, {
								status: res.status,
								statusText: res.statusText,
								headers: Object.fromEntries(filteredHeaders),
							});
						},
					},
				},
			},
		],
	});
