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

export default define(meta, (ps, me) => fetchMeta()
	.then(instance => Emoji.find({ host: null }, {
			fields: { _id: false }
		})
		.then(emojis => ({
			maintainer: instance.maintainer,

			version: pkg.version,
			clientVersion: client.version,

			name: instance.name,
			uri: config.url,
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
			disableGlobalTimeline: instance.disableGlobalTimeline,
			driveCapacityPerLocalUserMb: instance.localDriveCapacityMb,
			driveCapacityPerRemoteUserMb: instance.remoteDriveCapacityMb,
			cacheRemoteFiles: instance.cacheRemoteFiles,
			enableRecaptcha: instance.enableRecaptcha,
			recaptchaSiteKey: instance.recaptchaSiteKey,
			mascotImageUrl: instance.mascotImageUrl,
			swPublickey: instance.swPublicKey,
			bannerUrl: instance.bannerUrl,
			errorImageUrl: instance.errorImageUrl,
			maxNoteTextLength: instance.maxNoteTextLength,
			emojis: emojis,
			enableEmail: instance.enableEmail,

			enableTwitterIntegration: instance.enableTwitterIntegration,
			enableGithubIntegration: instance.enableGithubIntegration,
			enableDiscordIntegration: instance.enableDiscordIntegration,

			...(ps.detail ? {
				registration: !instance.disableRegistration,
				localTimeLine: !instance.disableLocalTimeline,
				globalTimeLine: !instance.disableGlobalTimeline,
				elasticsearch: !!config.elasticsearch,
				recaptcha: instance.enableRecaptcha,
				objectStorage: config.drive && config.drive.storage === 'minio',
				twitter: instance.enableTwitterIntegration,
				github: instance.enableGithubIntegration,
				discord: instance.enableDiscordIntegration,
				serviceWorker: instance.enableServiceWorker,
				userRecommendation: {
					external: instance.enableExternalUserRecommendation,
					engine: instance.externalUserRecommendationEngine,
					timeout: instance.externalUserRecommendationTimeout
				}
			} : {}),

			...(me && (me.isAdmin || me.isModerator) ? {
				hidedTags: instance.hidedTags,
				recaptchaSecretKey: instance.recaptchaSecretKey,
				proxyAccount: instance.proxyAccount,
				twitterConsumerKey: instance.twitterConsumerKey,
				twitterConsumerSecret: instance.twitterConsumerSecret,
				githubClientId: instance.githubClientId,
				githubClientSecret: instance.githubClientSecret,
				discordClientId: instance.discordClientId,
				discordClientSecret: instance.discordClientSecret,
				enableExternalUserRecommendation: instance.enableExternalUserRecommendation,
				externalUserRecommendationEngine: instance.externalUserRecommendationEngine,
				externalUserRecommendationTimeout: instance.externalUserRecommendationTimeout,
				summalyProxy: instance.summalyProxy,
				email: instance.email,
				smtpSecure: instance.smtpSecure,
				smtpHost: instance.smtpHost,
				smtpPort: instance.smtpPort,
				smtpUser: instance.smtpUser,
				smtpPass: instance.smtpPass,
				swPrivateKey: instance.swPrivateKey
			} : {})
		}))));
