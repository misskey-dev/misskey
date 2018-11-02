import $ from 'cafy';
import * as os from 'os';
import config from '../../../config';
import Meta from '../../../models/meta';
import Emoji from '../../../models/emoji';
import define from '../define';

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
	const met: any = (await Meta.findOne()) || {};

	const emojis = await Emoji.find({ host: null }, {
		fields: {
			_id: false
		}
	});

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

		broadcasts: met.broadcasts || [],
		disableRegistration: met.disableRegistration,
		disableLocalTimeline: met.disableLocalTimeline,
		driveCapacityPerLocalUserMb: config.localDriveCapacityMb,
		recaptchaSitekey: config.recaptcha ? config.recaptcha.site_key : null,
		swPublickey: config.sw ? config.sw.public_key : null,
		hidedTags: (me && me.isAdmin) ? met.hidedTags : undefined,
		bannerUrl: met.bannerUrl,
		maxNoteTextLength: config.maxNoteTextLength,

		emojis: emojis,

		features: ps.detail ? {
			registration: !met.disableRegistration,
			localTimeLine: !met.disableLocalTimeline,
			elasticsearch: config.elasticsearch ? true : false,
			recaptcha: config.recaptcha ? true : false,
			objectStorage: config.drive && config.drive.storage === 'minio',
			twitter: config.twitter ? true : false,
			serviceWorker: config.sw ? true : false,
			userRecommendation: config.user_recommendation ? config.user_recommendation : {}
		} : undefined
	});
}));
