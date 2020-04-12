import $ from 'cafy';
import config from '../../../config';
import define from '../define';
import { fetchMeta } from '../../../misc/fetch-meta';
import { Emojis, Users } from '../../../models';
import { DB_MAX_NOTE_TEXT_LENGTH } from '../../../misc/hard-limits';

export const meta = {
	desc: {
		'ja-JP': 'インスタンス情報を取得します。',
		'en-US': 'Get the information of this instance.'
	},

	tags: ['meta'],

	requireCredential: false as const,

	params: {
		detail: {
			validator: $.optional.bool,
			default: true
		}
	},

	res: {
		type: 'object' as const,
		optional: false as const, nullable: false as const,
		properties: {
			version: {
				type: 'string' as const,
				optional: false as const, nullable: false as const,
				description: 'The version of Misskey of this instance.',
				example: config.version
			},
			name: {
				type: 'string' as const,
				optional: false as const, nullable: false as const,
				description: 'The name of this instance.',
			},
			description: {
				type: 'string' as const,
				optional: false as const, nullable: false as const,
				description: 'The description of this instance.',
			},
			announcements: {
				type: 'array' as const,
				optional: false as const, nullable: false as const,
				items: {
					type: 'object' as const,
					optional: false as const, nullable: false as const,
					properties: {
						title: {
							type: 'string' as const,
							optional: false as const, nullable: false as const,
							description: 'The title of the announcement.',
						},
						text: {
							type: 'string' as const,
							optional: false as const, nullable: false as const,
							description: 'The text of the announcement. (can be HTML)',
						},
					}
				},
				description: 'The announcements of this instance.',
			},
			disableRegistration: {
				type: 'boolean' as const,
				optional: false as const, nullable: false as const,
				description: 'Whether disabled open registration.',
			},
			disableLocalTimeline: {
				type: 'boolean' as const,
				optional: false as const, nullable: false as const,
				description: 'Whether disabled LTL and STL.',
			},
			disableGlobalTimeline: {
				type: 'boolean' as const,
				optional: false as const, nullable: false as const,
				description: 'Whether disabled GTL.',
			},
		}
	}
};

export default define(meta, async (ps, me) => {
	const instance = await fetchMeta(true);

	const emojis = await Emojis.find({
		where: {
			host: null
		},
		order: {
			category: 'ASC',
			name: 'ASC'
		},
		cache: {
			id: 'meta_emojis',
			milliseconds: 3600000	// 1 hour
		}
	});

	const response: any = {
		maintainerName: instance.maintainerName,
		maintainerEmail: instance.maintainerEmail,

		version: config.version,

		name: instance.name,
		uri: config.url,
		description: instance.description,
		langs: instance.langs,
		tosUrl: instance.ToSUrl,
		repositoryUrl: instance.repositoryUrl,
		feedbackUrl: instance.feedbackUrl,

		secure: config.https != null,

		disableRegistration: instance.disableRegistration,
		disableLocalTimeline: instance.disableLocalTimeline,
		disableGlobalTimeline: instance.disableGlobalTimeline,
		driveCapacityPerLocalUserMb: instance.localDriveCapacityMb,
		driveCapacityPerRemoteUserMb: instance.remoteDriveCapacityMb,
		cacheRemoteFiles: instance.cacheRemoteFiles,
		proxyRemoteFiles: instance.proxyRemoteFiles,
		enableRecaptcha: instance.enableRecaptcha,
		recaptchaSiteKey: instance.recaptchaSiteKey,
		swPublickey: instance.swPublicKey,
		mascotImageUrl: instance.mascotImageUrl,
		bannerUrl: instance.bannerUrl,
		errorImageUrl: instance.errorImageUrl,
		iconUrl: instance.iconUrl,
		maxNoteTextLength: Math.min(instance.maxNoteTextLength, DB_MAX_NOTE_TEXT_LENGTH),
		emojis: await Emojis.packMany(emojis),
		requireSetup: (await Users.count({
			host: null,
		})) === 0,
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
			miauth: true,
		};
	}

	if (me && me.isAdmin) {
		response.useStarForReactionFallback = instance.useStarForReactionFallback;
		response.pinnedUsers = instance.pinnedUsers;
		response.hiddenTags = instance.hiddenTags;
		response.blockedHosts = instance.blockedHosts;
		response.recaptchaSecretKey = instance.recaptchaSecretKey;
		response.proxyAccountId = instance.proxyAccountId;
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
		response.objectStorageUseProxy = instance.objectStorageUseProxy;
	}

	return response;
});
