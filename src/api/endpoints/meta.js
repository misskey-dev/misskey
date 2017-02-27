'use strict';

/**
 * Module dependencies
 */
import prominence from 'prominence';
import git from 'git-last-commit';

/**
 * @swagger
 * /meta:
 *   post:
 *     summary: Show the misskey's information
 *     responses:
 *       200:
 *         description: Success
 *         schema:
 *           type: object
 *           properties:
 *             maintainer:
 *               description: maintainer's name
 *               type: string
 *             commit:
 *               description: latest commit's hash
 *               type: string
 *             secure:
 *               description: whether the server supports secure protcols
 *               type: boolean
 *
 *       default:
 *         description: Failed
 *         schema:
 *           $ref: "#/definitions/Error"
 */

/**
 * Show core info
 *
 * @param {Object} params
 * @return {Promise<object>}
 */
module.exports = (params) =>
	new Promise(async (res, rej) => {
		const commit = await prominence(git).getLastCommit();

		res({
			maintainer: config.maintainer,
			commit: commit.shortHash,
			secure: config.https.enable
		});
	});
