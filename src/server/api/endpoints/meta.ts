/**
 * Module dependencies
 */
import * as os from 'os';
import config from '../../../config';
import Meta from '../../../models/meta';

const pkg = require('../../../../package.json');
const client = require('../../../../built/client/meta.json');

/**
 * @swagger
 * /meta:
 *   note:
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
 */
module.exports = (params) => new Promise(async (res, rej) => {
	const meta: any = (await Meta.findOne()) || {};

	res({
		maintainer: config.maintainer,

		version: pkg.version,
		clientVersion: client.version,

		secure: config.https != null,
		machine: os.hostname(),
		os: os.platform(),
		node: process.version,
		cpu: {
			model: os.cpus()[0].model,
			cores: os.cpus().length
		},
		broadcasts: meta.broadcasts
	});
});
