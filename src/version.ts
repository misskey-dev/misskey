const getVersion = new Promise<string>(async resolve => {
	const package = require('../package.json');

	const version = package.version;

	resolve(version);
});

export default getVersion;
