import { BuildUnifier } from "frame-master/plugin";
import cfFunctionAction from "frame-master-plugin-cloudflare-pages-functions-action";
import cloudflareupdatemanager from "../index";

export const createEnvPlugin = () =>
	BuildUnifier({
		plugins: [
			cfFunctionAction({
				actionBasePath: "test/actions",
				outDir: ".frame-master/build",
			}),
			cloudflareupdatemanager({
				paths: {
					notFound: "test/notFound.html",
					actionBasePath: "test/actions",
				},
			}),
		],
	});
