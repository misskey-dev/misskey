const fs = require("fs");
const locales = require("../locales");
const meta = require("../package.json");
const v = { _version_: meta.version };

// frontend:locales
fs.mkdirSync(__dirname + "/../built/_frontend_dist_/locales", {
	recursive: true,
});
for (const [lang, locale] of Object.entries(locales)) {
	fs.writeFileSync(
		__dirname +
			`/../built/_frontend_dist_/locales/${lang}.${meta.version}.json`,
		JSON.stringify({ ...locale, ...v }),
		"utf-8"
	);
}

// backend:script
fs.rmSync(__dirname + "/../packages/backend/built/server/web/boot.js", {
	recursive: true,
	force: true,
});
const content = fs.readFileSync(
	__dirname + "/../packages/backend/src/server/web/boot.js",
	{ encoding: "utf8" }
);
fs.writeFileSync(
	__dirname + "/built/boot.js",
	content.replace("LANGS", JSON.stringify(Object.keys(locales)))
);
