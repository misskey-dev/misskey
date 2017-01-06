'use strict';

/**
 * Module dependencies
 */
import prominence from 'prominence';
import git from 'git-last-commit';

/**
 * Show core info
 *
 * @param {Object} params
 * @return {Promise<object>}
 */
module.exports = (params) =>
	new Promise(async (res, rej) =>
{
	const commit = await prominence(git).getLastCommit();

	res({
		maintainer: config.maintainer,
		commit: commit.shortHash,
		secure: config.https.enable
	});
});
