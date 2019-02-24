import $ from 'cafy';
import * as os from 'os';
import config from '../../../config';
import Emoji from '../../../models/emoji';
import define from '../define';
import fetchMeta from '../../../misc/fetch-meta';
import * as pkg from '../../../../package.json';

export const meta = {
	stability: 'stable',

	desc: {
		'ja-JP': 'インスタンス情報を取得します。',
		'en-US': 'Get the information of this instance.'
	},

	tags: ['meta'],

	requireCredential: false,

	params: {
		detail: {
			validator: $.optional.bool,
			default: true
		}
	},

	res: {
		type: 'object',
		properties: {
			version: {
				type: 'string',
				description: 'The version of Misskey of this instance.',
				example: pkg.version
			},
			name: {
				type: 'string',
				description: 'The name of this instance.',
			},
			description: {
				type: 'string',
				description: 'The description of this instance.',
			},
			announcements: {
				type: 'array',
				items: {
					type: 'object',
					properties: {
						title: {
							type: 'string',
							description: 'The title of the announcement.',
						},
						text: {
							type: 'string',
							description: 'The text of the announcement. (can be HTML)',
						},
					}
				},
				description: 'The announcements of this instance.',
			},
			disableRegistration: {
				type: 'boolean',
				description: 'Whether disabled open registration.',
			},
			disableLocalTimeline: {
				type: 'boolean',
				description: 'Whether disabled LTL and STL.',
			},
			disableGlobalTimeline: {
				type: 'boolean',
				description: 'Whether disabled GTL.',
			},
		}
	}
};

export default define(meta, async (ps, me) => {
	const instance = await fetchMeta();

	const emojis = await Emoji.find({ host: null }, {
		fields: {
			_id: false
		}
	});

	const response: any = {
		maintainer: instance.maintainer,

		version: pkg.version,

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

		announcements: instance.announcements || [],
		disableRegistration: instance.disableRegistration,
		disableLocalTimeline: instance.disableLocalTimeline,
		disableGlobalTimeline: instance.disableGlobalTimeline,
		driveCapacityPerLocalUserMb: instance.localDriveCapacityMb,
		driveCapacityPerRemoteUserMb: instance.remoteDriveCapacityMb,
		cacheRemoteFiles: instance.cacheRemoteFiles,
		enableRecaptcha: instance.enableRecaptcha,
		recaptchaSiteKey: instance.recaptchaSiteKey,
		swPublickey: instance.swPublicKey,
		mascotImageUrl: instance.mascotImageUrl,
		bannerUrl: instance.bannerUrl,
		errorImageUrl: instance.errorImageUrl,
		maxNoteTextLength: instance.maxNoteTextLength,
		emojis: emojis,
		enableEmail: instance.enableEmail,

		enableTwitterIntegration: instance.enableTwitterIntegration,
		enableGithubIntegration: instance.enableGithubIntegration,
		enableDiscordIntegration: instance.enableDiscordIntegration,
	};

	if (ps.detail) {
		response.features = {
			registration: !instance.disableRegistration,
			localTimeLine: !instance.disableLocalTimeline,
			globalTimeLine: !instance.disableGlobalTimeline,
			elasticsearch: config.elasticsearch ? true : false,
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
		};
	}

	if (me && (me.isAdmin || me.isModerator)) {
		response.hidedTags = instance.hidedTags;
		response.recaptchaSecretKey = instance.recaptchaSecretKey;
		response.proxyAccount = instance.proxyAccount;
		response.twitterConsumerKey = instance.twitterConsumerKey;
		response.twitterConsumerSecret = instance.twitterConsumerSecret;
		response.githubClientId = instance.githubClientId;
		response.githubClientSecret = instance.githubClientSecret;
		response.discordClientId = instance.discordClientId;
		response.discordClientSecret = instance.discordClientSecret;
		response.enableExternalUserRecommendation = instance.enableExternalUserRecommendation;
		response.externalUserRecommendationEngine = instance.externalUserRecommendationEngine;
		response.externalUserRecommendationTimeout = instance.externalUserRecommendationTimeout;
		response.summalyProxy = instance.summalyProxy;
		response.email = instance.email;
		response.smtpSecure = instance.smtpSecure;
		response.smtpHost = instance.smtpHost;
		response.smtpPort = instance.smtpPort;
		response.smtpUser = instance.smtpUser;
		response.smtpPass = instance.smtpPass;
		response.swPrivateKey = instance.swPrivateKey;
	}

	return response;
});
