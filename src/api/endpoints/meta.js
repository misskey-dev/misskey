'use strict';

/**
 * Module dependencies
 */
import Git from 'nodegit';

/**
 * Show core info
 *
 * @param {Object} params
 * @return {Promise<object>}
 */
module.exports = (params) =>
	new Promise(async (res, rej) =>
{
	const repository = await Git.Repository.open(__dirname + '/../../');

	res({
		maintainer: config.maintainer,
		commit: (await repository.getHeadCommit()).sha(),
		secure: config.https.enable
	});
});
