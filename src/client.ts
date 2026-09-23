import { FUNCTION_PATHS, VERSION_STORAGE_KEY } from "./shared";

const ENDPOINT = `/${FUNCTION_PATHS.versionTestEndpoint}`;
const REFRESH_QUERY = "__cf_refresh";

async function clearBrowserCaches() {
	if ("caches" in window) {
		const names = await caches.keys();
		await Promise.all(names.map((cacheName) => caches.delete(cacheName)));
	}
	if ("serviceWorker" in navigator) {
		const registrations = await navigator.serviceWorker.getRegistrations();
		await Promise.all(
			registrations.map((registration) => registration.unregister()),
		);
	}
}

function readVersion() {
	try {
		return localStorage.getItem(VERSION_STORAGE_KEY);
	} catch {
		return null;
	}
}

function writeVersion(value: string) {
	try {
		localStorage.setItem(VERSION_STORAGE_KEY, value);
		return true;
	} catch {
		return false;
	}
}

function stripRefreshParam() {
	const url = new URL(location.href);
	if (!url.searchParams.has(REFRESH_QUERY)) return;
	url.searchParams.delete(REFRESH_QUERY);
	history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
}

const checkVersion = async () => {
	const response = await fetch(ENDPOINT, { cache: "no-store" });
	if (!response.ok) return;
	const remoteVersion = (await response.text()).trim();
	if (!remoteVersion) return;

	const localVersion = readVersion();
	if (localVersion === null) {
		writeVersion(remoteVersion);
		return;
	}
	if (localVersion === remoteVersion) {
		stripRefreshParam();
		return;
	}

	await clearBrowserCaches();
	await fetch(ENDPOINT, { method: "DELETE", cache: "no-store" });
	if (!writeVersion(remoteVersion)) return;

	const next = new URL(location.href);
	next.searchParams.set(REFRESH_QUERY, remoteVersion);
	location.replace(next.toString());
};

if (typeof window !== "undefined") {
	const host = window as Window & { __CF_PAGES_UPDATE_CHECK__?: boolean };
	if (!host.__CF_PAGES_UPDATE_CHECK__) {
		host.__CF_PAGES_UPDATE_CHECK__ = true;
		await checkVersion().catch(() => {});
	}
}

export default checkVersion;
