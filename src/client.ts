const remoteVersion = await fetch("/api/versionTest").then((res) => res.text());

const localVersion = localStorage.getItem("CF_PAGES_CURRENT_VERSION");

if (remoteVersion !== localVersion) {
	localStorage.setItem("CF_PAGES_CURRENT_VERSION", remoteVersion);
	await fetch("/api/versionTest", { method: "DELETE" });
	location.reload();
}
