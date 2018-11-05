import $ from 'cafy';
import * as os from 'os';
import config from '../../../config';
import Emoji from '../../../models/emoji';
import define from '../define';
import fetchMeta from '../../../misc/fetch-meta';

const pkg = require('../../../../package.json');
const client = require('../../../../built/client/meta.json');

export const meta = {
	stability: 'stable',

	desc: {
		'ja-JP': 'インスタンス情報を取得します。',
		'en-US': 'Get the information of this instance.'
	},

	requireCredential: false,

	params: {
		detail: {
			validator: $.bool.optional,
			default: true
		}
	},
};

export default define(meta, (ps, me) => new Promise(async (res, rej) => {
	const instance = await fetchMeta();

	const emojis = await Emoji.find({ host: null }, {
		fields: {
			_id: false
		}
	});

	res({
		maintainer: config.maintainer,

		version: pkg.version,
		clientVersion: client.version,

		name: instance.name,
		description: instance.description,

		secure: config.https != null,
		machine: os.hostname(),
		os: os.platform(),
		node: process.version,

		cpu: {
			model: os.cpus()[0].model,
			cores: os.cpus().length
		},

		broadcasts: instance.broadcasts || [],
		disableRegistration: instance.disableRegistration,
		disableLocalTimeline: instance.disableLocalTimeline,
		driveCapacityPerLocalUserMb: instance.localDriveCapacityMb,
		driveCapacityPerRemoteUserMb: instance.remoteDriveCapacityMb,
		cacheRemoteFiles: instance.cacheRemoteFiles,
		recaptchaSitekey: config.recaptcha ? config.recaptcha.site_key : null,
		swPublickey: config.sw ? config.sw.public_key : null,
		hidedTags: (me && me.isAdmin) ? instance.hidedTags : undefined,
		bannerUrl: instance.bannerUrl,
		maxNoteTextLength: instance.maxNoteTextLength,

		emojis: emojis,

		features: ps.detail ? {
			registration: !instance.disableRegistration,
			localTimeLine: !instance.disableLocalTimeline,
			elasticsearch: config.elasticsearch ? true : false,
			recaptcha: config.recaptcha ? true : false,
			objectStorage: config.drive && config.drive.storage === 'minio',
			twitter: config.twitter ? true : false,
			github: config.github ? true : false,
			serviceWorker: config.sw ? true : false,
			userRecommendation: config.user_recommendation ? config.user_recommendation : {}
		} : undefined
	});
}));
