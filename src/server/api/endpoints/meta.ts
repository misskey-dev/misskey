/**
 * Module dependencies
 */
import * as os from 'os';
import config from '../../../config';
import Meta from '../../../models/meta';

const pkg = require('../../../../package.json');
const client = require('../../../../built/client/meta.json');

/**
 * Show core info
 */
export default () => new Promise(async (res, rej) => {
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
