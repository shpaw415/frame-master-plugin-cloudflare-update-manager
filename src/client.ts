import { FUNCTION_PATHS } from "./shared";

const checkVersion = async () => {
	const remoteVersion = await fetch(
		`/${FUNCTION_PATHS.versionTestEndpoint}`,
	).then((res) => res.text());
	const localVersion = localStorage.getItem("CF_PAGES_CURRENT_VERSION");
	if (remoteVersion !== localVersion) {
		localStorage.setItem("CF_PAGES_CURRENT_VERSION", remoteVersion);
		await fetch(`/${FUNCTION_PATHS.versionTestEndpoint}`, {
			method: "DELETE",
		});
		location.reload();
	}
};

if (typeof window !== "undefined") {
	await checkVersion();
}

export default checkVersion;
