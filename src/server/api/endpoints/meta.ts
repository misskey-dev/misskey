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

	const response: any = {
		maintainer: instance.maintainer,

		version: pkg.version,
		clientVersion: client.version,

		name: instance.name,
		description: instance.description,
		langs: instance.langs,

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
		enableRecaptcha: instance.enableRecaptcha,
		recaptchaSiteKey: instance.recaptchaSiteKey,
		swPublickey: config.sw ? config.sw.public_key : null,
		bannerUrl: instance.bannerUrl,
		maxNoteTextLength: instance.maxNoteTextLength,

		emojis: emojis,
	};

	if (ps.detail) {
		response.features = {
			registration: !instance.disableRegistration,
			localTimeLine: !instance.disableLocalTimeline,
			elasticsearch: config.elasticsearch ? true : false,
			recaptcha: instance.enableRecaptcha,
			objectStorage: config.drive && config.drive.storage === 'minio',
			twitter: instance.enableTwitterIntegration,
			github: instance.enableGithubIntegration,
			discord: instance.enableDiscordIntegration,
			serviceWorker: config.sw ? true : false,
			userRecommendation: config.user_recommendation ? config.user_recommendation : {}
		};
	}

	if (me && (me.isAdmin || me.isModerator)) {
		response.hidedTags = instance.hidedTags;
		response.recaptchaSecretKey = instance.recaptchaSecretKey;
		response.proxyAccount = instance.proxyAccount;
		response.enableTwitterIntegration = instance.enableTwitterIntegration;
		response.twitterConsumerKey = instance.twitterConsumerKey;
		response.twitterConsumerSecret = instance.twitterConsumerSecret;
		response.enableGithubIntegration = instance.enableGithubIntegration;
		response.githubClientId = instance.githubClientId;
		response.githubClientSecret = instance.githubClientSecret;
		response.enableDiscordIntegration = instance.enableDiscordIntegration;
		response.discordClientId = instance.discordClientId;
		response.discordClientSecret = instance.discordClientSecret;
	}

	res(response);
}));
