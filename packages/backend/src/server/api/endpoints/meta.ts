import config from '@/config/index.js';
import define from '../define.js';
import { fetchMeta } from '@/misc/fetch-meta.js';
import { Ads, Emojis, Users } from '@/models/index.js';
import { DB_MAX_NOTE_TEXT_LENGTH } from '@/misc/hard-limits.js';
import { MoreThan } from 'typeorm';
import { MAX_NOTE_TEXT_LENGTH } from '@/const.js';

export const meta = {
	tags: ['meta'],

	requireCredential: false,

	res: {
		type: 'object',
		optional: false, nullable: false,
		properties: {
			maintainerName: {
				type: 'string',
				optional: false, nullable: true,
			},
			maintainerEmail: {
				type: 'string',
				optional: false, nullable: true,
			},
			version: {
				type: 'string',
				optional: false, nullable: false,
				example: config.version,
			},
			name: {
				type: 'string',
				optional: false, nullable: false,
			},
			uri: {
				type: 'string',
				optional: false, nullable: false,
				format: 'url',
				example: 'https://misskey.example.com',
			},
			description: {
				type: 'string',
				optional: false, nullable: true,
			},
			langs: {
				type: 'array',
				optional: false, nullable: false,
				items: {
					type: 'string',
					optional: false, nullable: false,
				},
			},
			tosUrl: {
				type: 'string',
				optional: false, nullable: true,
			},
			repositoryUrl: {
				type: 'string',
				optional: false, nullable: false,
				default: 'https://github.com/misskey-dev/misskey',
			},
			feedbackUrl: {
				type: 'string',
				optional: false, nullable: false,
				default: 'https://github.com/misskey-dev/misskey/issues/new',
			},
			defaultDarkTheme: {
				type: 'string',
				optional: false, nullable: true,
			},
			defaultLightTheme: {
				type: 'string',
				optional: false, nullable: true,
			},
			disableRegistration: {
				type: 'boolean',
				optional: false, nullable: false,
			},
			disableLocalTimeline: {
				type: 'boolean',
				optional: false, nullable: false,
			},
			disableGlobalTimeline: {
				type: 'boolean',
				optional: false, nullable: false,
			},
			driveCapacityPerLocalUserMb: {
				type: 'number',
				optional: false, nullable: false,
			},
			driveCapacityPerRemoteUserMb: {
				type: 'number',
				optional: false, nullable: false,
			},
			cacheRemoteFiles: {
				type: 'boolean',
				optional: false, nullable: false,
			},
			emailRequiredForSignup: {
				type: 'boolean',
				optional: false, nullable: false,
			},
			enableHcaptcha: {
				type: 'boolean',
				optional: false, nullable: false,
			},
			hcaptchaSiteKey: {
				type: 'string',
				optional: false, nullable: true,
			},
			enableRecaptcha: {
				type: 'boolean',
				optional: false, nullable: false,
			},
			recaptchaSiteKey: {
				type: 'string',
				optional: false, nullable: true,
			},
			swPublickey: {
				type: 'string',
				optional: false, nullable: true,
			},
			mascotImageUrl: {
				type: 'string',
				optional: false, nullable: false,
				default: '/assets/ai.png',
			},
			bannerUrl: {
				type: 'string',
				optional: false, nullable: false,
			},
			errorImageUrl: {
				type: 'string',
				optional: false, nullable: false,
				default: 'https://xn--931a.moe/aiart/yubitun.png',
			},
			iconUrl: {
				type: 'string',
				optional: false, nullable: true,
			},
			maxNoteTextLength: {
				type: 'number',
				optional: false, nullable: false,
			},
			emojis: {
				type: 'array',
				optional: false, nullable: false,
				items: {
					type: 'object',
					optional: false, nullable: false,
					properties: {
						id: {
							type: 'string',
							optional: false, nullable: false,
							format: 'id',
						},
						aliases: {
							type: 'array',
							optional: false, nullable: false,
							items: {
								type: 'string',
								optional: false, nullable: false,
							},
						},
						category: {
							type: 'string',
							optional: false, nullable: true,
						},
						host: {
							type: 'string',
							optional: false, nullable: true,
						},
						url: {
							type: 'string',
							optional: false, nullable: false,
							format: 'url',
						},
					},
				},
			},
			ads: {
				type: 'array',
				optional: false, nullable: false,
				items: {
					type: 'object',
					optional: false, nullable: false,
					properties: {
						place: {
							type: 'string',
							optional: false, nullable: false,
						},
						url: {
							type: 'string',
							optional: false, nullable: false,
							format: 'url',
						},
						imageUrl: {
							type: 'string',
							optional: false, nullable: false,
							format: 'url',
						},
					},
				},
			},
			requireSetup: {
				type: 'boolean',
				optional: false, nullable: false,
				example: false,
			},
			enableEmail: {
				type: 'boolean',
				optional: false, nullable: false,
			},
			enableTwitterIntegration: {
				type: 'boolean',
				optional: false, nullable: false,
			},
			enableGithubIntegration: {
				type: 'boolean',
				optional: false, nullable: false,
			},
			enableDiscordIntegration: {
				type: 'boolean',
				optional: false, nullable: false,
			},
			enableServiceWorker: {
				type: 'boolean',
				optional: false, nullable: false,
			},
			translatorAvailable: {
				type: 'boolean',
				optional: false, nullable: false,
			},
			proxyAccountName: {
				type: 'string',
				optional: false, nullable: true,
			},
			features: {
				type: 'object',
				optional: true, nullable: false,
				properties: {
					registration: {
						type: 'boolean',
						optional: false, nullable: false,
					},
					localTimeLine: {
						type: 'boolean',
						optional: false, nullable: false,
					},
					globalTimeLine: {
						type: 'boolean',
						optional: false, nullable: false,
					},
					elasticsearch: {
						type: 'boolean',
						optional: false, nullable: false,
					},
					hcaptcha: {
						type: 'boolean',
						optional: false, nullable: false,
					},
					recaptcha: {
						type: 'boolean',
						optional: false, nullable: false,
					},
					objectStorage: {
						type: 'boolean',
						optional: false, nullable: false,
					},
					twitter: {
						type: 'boolean',
						optional: false, nullable: false,
					},
					github: {
						type: 'boolean',
						optional: false, nullable: false,
					},
					discord: {
						type: 'boolean',
						optional: false, nullable: false,
					},
					serviceWorker: {
						type: 'boolean',
						optional: false, nullable: false,
					},
					miauth: {
						type: 'boolean',
						optional: true, nullable: false,
						default: true,
					},
				},
			},
			userStarForReactionFallback: {
				type: 'boolean',
				optional: true, nullable: false,
			},
			pinnedUsers: {
				type: 'array',
				optional: true, nullable: false,
				items: {
					type: 'string',
					optional: false, nullable: false,
				},
			},
			hiddenTags: {
				type: 'array',
				optional: true, nullable: false,
				items: {
					type: 'string',
					optional: false, nullable: false,
				},
			},
			blockedHosts: {
				type: 'array',
				optional: true, nullable: false,
				items: {
					type: 'string',
					optional: false, nullable: false,
				},
			},
			hcaptchaSecretKey: {
				type: 'string',
				optional: true, nullable: true,
			},
			recaptchaSecretKey: {
				type: 'string',
				optional: true, nullable: true,
			},
			proxyAccountId: {
				type: 'string',
				optional: true, nullable: true,
				format: 'id',
			},
			twitterConsumerKey: {
				type: 'string',
				optional: true, nullable: true,
			},
			twitterConsumerSecret: {
				type: 'string',
				optional: true, nullable: true,
			},
			githubClientId: {
				type: 'string',
				optional: true, nullable: true,
			},
			githubClientSecret: {
				type: 'string',
				optional: true, nullable: true,
			},
			discordClientId: {
				type: 'string',
				optional: true, nullable: true,
			},
			discordClientSecret: {
				type: 'string',
				optional: true, nullable: true,
			},
			summaryProxy: {
				type: 'string',
				optional: true, nullable: true,
			},
			email: {
				type: 'string',
				optional: true, nullable: true,
			},
			smtpSecure: {
				type: 'boolean',
				optional: true, nullable: false,
			},
			smtpHost: {
				type: 'string',
				optional: true, nullable: true,
			},
			smtpPort: {
				type: 'string',
				optional: true, nullable: true,
			},
			smtpUser: {
				type: 'string',
				optional: true, nullable: true,
			},
			smtpPass: {
				type: 'string',
				optional: true, nullable: true,
			},
			swPrivateKey: {
				type: 'string',
				optional: true, nullable: true,
			},
			useObjectStorage: {
				type: 'boolean',
				optional: true, nullable: false,
			},
			objectStorageBaseUrl: {
				type: 'string',
				optional: true, nullable: true,
			},
			objectStorageBucket: {
				type: 'string',
				optional: true, nullable: true,
			},
			objectStoragePrefix: {
				type: 'string',
				optional: true, nullable: true,
			},
			objectStorageEndpoint: {
				type: 'string',
				optional: true, nullable: true,
			},
			objectStorageRegion: {
				type: 'string',
				optional: true, nullable: true,
			},
			objectStoragePort: {
				type: 'number',
				optional: true, nullable: true,
			},
			objectStorageAccessKey: {
				type: 'string',
				optional: true, nullable: true,
			},
			objectStorageSecretKey: {
				type: 'string',
				optional: true, nullable: true,
			},
			objectStorageUseSSL: {
				type: 'boolean',
				optional: true, nullable: false,
			},
			objectStorageUseProxy: {
				type: 'boolean',
				optional: true, nullable: false,
			},
			objectStorageSetPublicRead: {
				type: 'boolean',
				optional: true, nullable: false,
			},
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		detail: { type: 'boolean', default: true },
	},
	required: [],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, me) => {
	const instance = await fetchMeta(true);

	const emojis = await Emojis.find({
		where: {
			host: null,
		},
		order: {
			category: 'ASC',
			name: 'ASC',
		},
		cache: {
			id: 'meta_emojis',
			milliseconds: 3600000,	// 1 hour
		},
	});

	const ads = await Ads.find({
		where: {
			expiresAt: MoreThan(new Date()),
		},
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
		disableRegistration: instance.disableRegistration,
		disableLocalTimeline: instance.disableLocalTimeline,
		disableGlobalTimeline: instance.disableGlobalTimeline,
		driveCapacityPerLocalUserMb: instance.localDriveCapacityMb,
		driveCapacityPerRemoteUserMb: instance.remoteDriveCapacityMb,
		emailRequiredForSignup: instance.emailRequiredForSignup,
		enableHcaptcha: instance.enableHcaptcha,
		hcaptchaSiteKey: instance.hcaptchaSiteKey,
		enableRecaptcha: instance.enableRecaptcha,
		recaptchaSiteKey: instance.recaptchaSiteKey,
		swPublickey: instance.swPublicKey,
		themeColor: instance.themeColor,
		mascotImageUrl: instance.mascotImageUrl,
		bannerUrl: instance.bannerUrl,
		errorImageUrl: instance.errorImageUrl,
		iconUrl: instance.iconUrl,
		backgroundImageUrl: instance.backgroundImageUrl,
		logoImageUrl: instance.logoImageUrl,
		maxNoteTextLength: MAX_NOTE_TEXT_LENGTH, // 後方互換性のため
		emojis: await Emojis.packMany(emojis),
		defaultLightTheme: instance.defaultLightTheme,
		defaultDarkTheme: instance.defaultDarkTheme,
		ads: ads.map(ad => ({
			id: ad.id,
			url: ad.url,
			place: ad.place,
			ratio: ad.ratio,
			imageUrl: ad.imageUrl,
		})),
		enableEmail: instance.enableEmail,

		enableTwitterIntegration: instance.enableTwitterIntegration,
		enableGithubIntegration: instance.enableGithubIntegration,
		enableDiscordIntegration: instance.enableDiscordIntegration,

		enableServiceWorker: instance.enableServiceWorker,

		translatorAvailable: instance.deeplAuthKey != null,

		...(ps.detail ? {
			pinnedPages: instance.pinnedPages,
			pinnedClipId: instance.pinnedClipId,
			cacheRemoteFiles: instance.cacheRemoteFiles,
			requireSetup: (await Users.count({
				host: null,
			})) === 0,
		} : {}),
	};

	if (ps.detail) {
		const proxyAccount = instance.proxyAccountId ? await Users.pack(instance.proxyAccountId).catch(() => null) : null;

		response.proxyAccountName = proxyAccount ? proxyAccount.username : null;
		response.features = {
			registration: !instance.disableRegistration,
			localTimeLine: !instance.disableLocalTimeline,
			globalTimeLine: !instance.disableGlobalTimeline,
			emailRequiredForSignup: instance.emailRequiredForSignup,
			elasticsearch: config.elasticsearch ? true : false,
			hcaptcha: instance.enableHcaptcha,
			recaptcha: instance.enableRecaptcha,
			objectStorage: instance.useObjectStorage,
			twitter: instance.enableTwitterIntegration,
			github: instance.enableGithubIntegration,
			discord: instance.enableDiscordIntegration,
			serviceWorker: instance.enableServiceWorker,
			miauth: true,
		};

		if (me && me.isAdmin) {
			response.useStarForReactionFallback = instance.useStarForReactionFallback;
			response.pinnedUsers = instance.pinnedUsers;
			response.hiddenTags = instance.hiddenTags;
			response.blockedHosts = instance.blockedHosts;
			response.hcaptchaSecretKey = instance.hcaptchaSecretKey;
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
			response.objectStorageSetPublicRead = instance.objectStorageSetPublicRead;
			response.objectStorageS3ForcePathStyle = instance.objectStorageS3ForcePathStyle;
			response.deeplAuthKey = instance.deeplAuthKey;
			response.deeplIsPro = instance.deeplIsPro;
		}
	}

	return response;
});
