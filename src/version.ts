const getVersion = new Promise<string>(async resolve => {
	const ぱっけーじ = require('../package.json');

	const version = ぱっけーじ.version;

	resolve(version);
});

export default getVersion;
