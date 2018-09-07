/**
 * Module dependencies
 */
import * as os from 'os';
import config from '../../../config';
import Meta from '../../../models/meta';
import { ILocalUser } from '../../../models/user';

const pkg = require('../../../../package.json');
const client = require('../../../../built/client/meta.json');

/**
 * Show core info
 */
export default (params: any, me: ILocalUser) => new Promise(async (res, rej) => {
	const meta: any = (await Meta.findOne()) || {};

	res({
		maintainer: config.maintainer,

		version: pkg.version,
		clientVersion: client.version,

		name: config.name || 'Misskey',
		description: config.description,

		secure: config.https != null,
		machine: os.hostname(),
		os: os.platform(),
		node: process.version,
		cpu: {
			model: os.cpus()[0].model,
			cores: os.cpus().length
		},
		broadcasts: meta.broadcasts,
		disableRegistration: meta.disableRegistration,
		driveCapacityPerLocalUserMb: config.localDriveCapacityMb,
		recaptchaSitekey: config.recaptcha ? config.recaptcha.site_key : null,
		swPublickey: config.sw ? config.sw.public_key : null,
		hidedTags: (me && me.isAdmin) ? meta.hidedTags : undefined
	});
});
