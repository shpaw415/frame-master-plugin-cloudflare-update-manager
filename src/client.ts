const remoteVersion = await fetch("/api/versionTest").then((res) => res.text());
