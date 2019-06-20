import $ from 'cafy';
import * as os from 'os';
import config from '../../../config';
import define from '../define';
import { fetchMeta } from '../../../misc/fetch-meta';
import * as pkg from '../../../../package.json';
import { Emojis } from '../../../models';
import { types, bool } from '../../../misc/schema';
import { getConnection } from 'typeorm';
import redis from '../../../db/redis';

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
		type: types.object,
		optional: bool.false, nullable: bool.false,
		properties: {
			version: {
				type: types.string,
				optional: bool.false, nullable: bool.false,
				description: 'The version of Misskey of this instance.',
				example: pkg.version
			},
			name: {
				type: types.string,
				optional: bool.false, nullable: bool.false,
				description: 'The name of this instance.',
			},
			description: {
				type: types.string,
				optional: bool.false, nullable: bool.false,
				description: 'The description of this instance.',
			},
			announcements: {
				type: types.array,
				optional: bool.false, nullable: bool.false,
				items: {
					type: types.object,
					optional: bool.false, nullable: bool.false,
					properties: {
						title: {
							type: types.string,
							optional: bool.false, nullable: bool.false,
							description: 'The title of the announcement.',
						},
						text: {
							type: types.string,
							optional: bool.false, nullable: bool.false,
							description: 'The text of the announcement. (can be HTML)',
						},
					}
				},
				description: 'The announcements of this instance.',
			},
			disableRegistration: {
				type: types.boolean,
				optional: bool.false, nullable: bool.false,
				description: 'Whether disabled open registration.',
			},
			disableLocalTimeline: {
				type: types.boolean,
				optional: bool.false, nullable: bool.false,
				description: 'Whether disabled LTL and STL.',
			},
			disableGlobalTimeline: {
				type: types.boolean,
				optional: bool.false, nullable: bool.false,
				description: 'Whether disabled GTL.',
			},
			enableEmojiReaction: {
				type: types.boolean,
				optional: bool.false, nullable: bool.false,
				description: 'Whether enabled emoji reaction.',
			},
		}
	}
};

export default define(meta, async (ps, me) => {
	const instance = await fetchMeta(true);

	const emojis = await Emojis.find({ where: { host: null }, cache: 3600000 }); // 1 hour

	const response: any = {
		maintainerName: instance.maintainerName,
		maintainerEmail: instance.maintainerEmail,

		version: pkg.version,

		name: instance.name,
		uri: config.url,
		description: instance.description,
		langs: instance.langs,
		ToSUrl: instance.ToSUrl,
		repositoryUrl: instance.repositoryUrl,
		feedbackUrl: instance.feedbackUrl,

		secure: config.https != null,
		machine: os.hostname(),
		os: os.platform(),
		node: process.version,
		psql: await getConnection().query('SHOW server_version').then(x => x[0].server_version),
		redis: redis.server_info.redis_version,

		cpu: {
			model: os.cpus()[0].model,
			cores: os.cpus().length
		},

		announcements: instance.announcements || [],
		disableRegistration: instance.disableRegistration,
		disableLocalTimeline: instance.disableLocalTimeline,
		disableGlobalTimeline: instance.disableGlobalTimeline,
		enableEmojiReaction: instance.enableEmojiReaction,
		driveCapacityPerLocalUserMb: instance.localDriveCapacityMb,
		driveCapacityPerRemoteUserMb: instance.remoteDriveCapacityMb,
		cacheRemoteFiles: instance.cacheRemoteFiles,
		enableRecaptcha: instance.enableRecaptcha,
		recaptchaSiteKey: instance.recaptchaSiteKey,
		swPublickey: instance.swPublicKey,
		mascotImageUrl: instance.mascotImageUrl,
		bannerUrl: instance.bannerUrl,
		errorImageUrl: instance.errorImageUrl,
		iconUrl: instance.iconUrl,
		maxNoteTextLength: instance.maxNoteTextLength,
		emojis: emojis,
		enableEmail: instance.enableEmail,

		enableTwitterIntegration: instance.enableTwitterIntegration,
		enableGithubIntegration: instance.enableGithubIntegration,
		enableDiscordIntegration: instance.enableDiscordIntegration,

		enableServiceWorker: instance.enableServiceWorker,
	};

	if (ps.detail) {
		response.features = {
			registration: !instance.disableRegistration,
			localTimeLine: !instance.disableLocalTimeline,
			globalTimeLine: !instance.disableGlobalTimeline,
			elasticsearch: config.elasticsearch ? true : false,
			recaptcha: instance.enableRecaptcha,
			objectStorage: instance.useObjectStorage,
			twitter: instance.enableTwitterIntegration,
			github: instance.enableGithubIntegration,
			discord: instance.enableDiscordIntegration,
			serviceWorker: instance.enableServiceWorker,
		};
	}

	if (me && (me.isAdmin || me.isModerator)) {
		response.useStarForReactionFallback = instance.useStarForReactionFallback;
		response.pinnedUsers = instance.pinnedUsers;
		response.hiddenTags = instance.hiddenTags;
		response.blockedHosts = instance.blockedHosts;
		response.recaptchaSecretKey = instance.recaptchaSecretKey;
		response.proxyAccount = instance.proxyAccount;
		response.twitterConsumerKey = instance.twitterConsumerKey;
		response.twitterConsumerSecret = instance.twitterConsumerSecret;
		response.githubClientId = instance.githubClientId;
		response.githubClientSecret = instance.githubClientSecret;
		response.discordClientId = instance.discordClientId;
		response.discordClientSecret = instance.discordClientSecret;
		response.summalyProxy = instance.summalyProxy;
		response.email = instance.email;
		response.smtpSecure = instance.smtpSecure;
		response.smtpHost = instance.smtpHost;
		response.smtpPort = instance.smtpPort;
		response.smtpUser = instance.smtpUser;
		response.smtpPass = instance.smtpPass;
		response.swPrivateKey = instance.swPrivateKey;
		response.useObjectStorage = instance.useObjectStorage;
		response.objectStorageBaseUrl = instance.objectStorageBaseUrl;
		response.objectStorageBucket = instance.objectStorageBucket;
		response.objectStoragePrefix = instance.objectStoragePrefix;
		response.objectStorageEndpoint = instance.objectStorageEndpoint;
		response.objectStorageRegion = instance.objectStorageRegion;
		response.objectStoragePort = instance.objectStoragePort;
		response.objectStorageAccessKey = instance.objectStorageAccessKey;
		response.objectStorageSecretKey = instance.objectStorageSecretKey;
		response.objectStorageUseSSL = instance.objectStorageUseSSL;
	}

	return response;
});
