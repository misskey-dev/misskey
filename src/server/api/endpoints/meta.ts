/**
 * Module dependencies
 */
import * as os from 'os';
import version from '../../../version';
import config from '../../../conf';
import Meta from '../models/meta';

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
 *               description: whether the server supports secure protocols
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
 * @param {any} params
 * @return {Promise<any>}
 */
module.exports = (params) => new Promise(async (res, rej) => {
	const meta = (await Meta.findOne()) || {};

	res({
		maintainer: config.maintainer,
		version: version,
		secure: config.https != null,
		machine: os.hostname(),
		os: os.platform(),
		node: process.version,
		cpu: {
			model: os.cpus()[0].model,
			cores: os.cpus().length
		},
		top_image: meta.top_image,
		broadcasts: meta.broadcasts
	});
});
