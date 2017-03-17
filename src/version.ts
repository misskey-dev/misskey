import prominence = require('prominence');
import git = require('git-last-commit');

const getVersion = new Promise<string>(async resolve => {
	const commit = await prominence(git).getLastCommit();

	const version = commit.shortHash;

	resolve(version);
});

export default getVersion;
