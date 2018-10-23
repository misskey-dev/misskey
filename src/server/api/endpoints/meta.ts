import * as os from 'os';
import config from '../../../config';
import Meta from '../../../models/meta';
import { ILocalUser } from '../../../models/user';

const pkg = require('../../../../package.json');
const client = require('../../../../built/client/meta.json');

export const meta = {
	stability: 'stable',

	desc: {
		'ja-JP': 'インスタンス情報を取得します。',
		'en-US': 'Get the information of this instance.'
	},

	requireCredential: false,

	params: {},
};

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

		broadcasts: meta.broadcasts || [],
		disableRegistration: meta.disableRegistration,
		disableLocalTimeline: meta.disableLocalTimeline,
		driveCapacityPerLocalUserMb: config.localDriveCapacityMb,
		recaptchaSitekey: config.recaptcha ? config.recaptcha.site_key : null,
		swPublickey: config.sw ? config.sw.public_key : null,
		hidedTags: (me && me.isAdmin) ? meta.hidedTags : undefined,
		bannerUrl: meta.bannerUrl,
		maxNoteTextLength: config.maxNoteTextLength,

		features: {
			registration: !meta.disableRegistration,
			localTimeLine: !meta.disableLocalTimeline,
			elasticsearch: config.elasticsearch ? true : false,
			recaptcha: config.recaptcha ? true : false,
			objectStorage: config.drive && config.drive.storage === 'minio',
			twitter: config.twitter ? true : false,
			serviceWorker: config.sw ? true : false,
			userRecommendation: config.user_recommendation ? config.user_recommendation : {}
		}
	});
});
