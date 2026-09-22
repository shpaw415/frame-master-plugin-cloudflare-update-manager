import { loadRuntimePluginFromPlugins } from "frame-master/testing";
import { createEnvPlugin } from "./shared";

await loadRuntimePluginFromPlugins(createEnvPlugin());
