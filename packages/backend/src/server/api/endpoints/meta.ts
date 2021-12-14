import $ from 'cafy';
import config from '@/config/index';
import define from '../define';
import { fetchMeta } from '@/misc/fetch-meta';
import { Ads, Emojis, Users } from '@/models/index';
import { DB_MAX_NOTE_TEXT_LENGTH } from '@/misc/hard-limits';
import { MoreThan } from 'typeorm';

export const meta = {
	tags: ['meta'],

	requireCredential: false as const,

	params: {
		detail: {
			validator: $.optional.bool,
			default: true,
		},
	},

	res: {
		type: 'object' as const,
		optional: false as const, nullable: false as const,
		properties: {
			maintainerName: {
				type: 'string' as const,
				optional: false as const, nullable: true as const,
			},
			maintainerEmail: {
				type: 'string' as const,
				optional: false as const, nullable: true as const,
			},
			version: {
				type: 'string' as const,
				optional: false as const, nullable: false as const,
				example: config.version,
			},
			name: {
				type: 'string' as const,
				optional: false as const, nullable: false as const,
			},
			uri: {
				type: 'string' as const,
				optional: false as const, nullable: false as const,
				format: 'url',
				example: 'https://misskey.example.com',
			},
			description: {
				type: 'string' as const,
				optional: false as const, nullable: true as const,
			},
			langs: {
				type: 'array' as const,
				optional: false as const, nullable: false as const,
				items: {
					type: 'string' as const,
					optional: false as const, nullable: false as const,
				},
			},
			tosUrl: {
				type: 'string' as const,
				optional: false as const, nullable: true as const,
			},
			repositoryUrl: {
				type: 'string' as const,
				optional: false as const, nullable: false as const,
				default: 'https://github.com/misskey-dev/misskey',
			},
			feedbackUrl: {
				type: 'string' as const,
				optional: false as const, nullable: false as const,
				default: 'https://github.com/misskey-dev/misskey/issues/new',
			},
			secure: {
				type: 'boolean' as const,
				optional: false as const, nullable: false as const,
				default: false,
			},
			disableRegistration: {
				type: 'boolean' as const,
				optional: false as const, nullable: false as const,
			},
			disableLocalTimeline: {
				type: 'boolean' as const,
				optional: false as const, nullable: false as const,
			},
			disableGlobalTimeline: {
				type: 'boolean' as const,
				optional: false as const, nullable: false as const,
			},
			driveCapacityPerLocalUserMb: {
				type: 'number' as const,
				optional: false as const, nullable: false as const,
			},
			driveCapacityPerRemoteUserMb: {
				type: 'number' as const,
				optional: false as const, nullable: false as const,
			},
			cacheRemoteFiles: {
				type: 'boolean' as const,
				optional: false as const, nullable: false as const,
			},
			proxyRemoteFiles: {
				type: 'boolean' as const,
				optional: false as const, nullable: false as const,
			},
			emailRequiredForSignup: {
				type: 'boolean' as const,
				optional: false as const, nullable: false as const,
			},
			enableHcaptcha: {
				type: 'boolean' as const,
				optional: false as const, nullable: false as const,
			},
			hcaptchaSiteKey: {
				type: 'string' as const,
				optional: false as const, nullable: true as const,
			},
			enableRecaptcha: {
				type: 'boolean' as const,
				optional: false as const, nullable: false as const,
			},
			recaptchaSiteKey: {
				type: 'string' as const,
				optional: false as const, nullable: true as const,
			},
			swPublickey: {
				type: 'string' as const,
				optional: false as const, nullable: true as const,
			},
			mascotImageUrl: {
				type: 'string' as const,
				optional: false as const, nullable: false as const,
				default: '/assets/ai.png',
			},
			bannerUrl: {
				type: 'string' as const,
				optional: false as const, nullable: false as const,
			},
			errorImageUrl: {
				type: 'string' as const,
				optional: false as const, nullable: false as const,
				default: 'https://xn--931a.moe/aiart/yubitun.png',
			},
			iconUrl: {
				type: 'string' as const,
				optional: false as const, nullable: true as const,
			},
			maxNoteTextLength: {
				type: 'number' as const,
				optional: false as const, nullable: false as const,
				default: 500,
			},
			emojis: {
				type: 'array' as const,
				optional: false as const, nullable: false as const,
				items: {
					type: 'object' as const,
					optional: false as const, nullable: false as const,
					properties: {
						id: {
							type: 'string' as const,
							optional: false as const, nullable: false as const,
							format: 'id',
						},
						aliases: {
							type: 'array' as const,
							optional: false as const, nullable: false as const,
							items: {
								type: 'string' as const,
								optional: false as const, nullable: false as const,
							},
						},
						category: {
							type: 'string' as const,
							optional: false as const, nullable: true as const,
						},
						host: {
							type: 'string' as const,
							optional: false as const, nullable: true as const,
						},
						url: {
							type: 'string' as const,
							optional: false as const, nullable: false as const,
							format: 'url',
						},
					},
				},
			},
			ads: {
				type: 'array' as const,
				optional: false as const, nullable: false as const,
				items: {
					type: 'object' as const,
					optional: false as const, nullable: false as const,
					properties: {
						place: {
							type: 'string' as const,
							optional: false as const, nullable: false as const,
						},
						url: {
							type: 'string' as const,
							optional: false as const, nullable: false as const,
							format: 'url',
						},
						imageUrl: {
							type: 'string' as const,
							optional: false as const, nullable: false as const,
							format: 'url',
						},
					},
				},
			},
			requireSetup: {
				type: 'boolean' as const,
				optional: false as const, nullable: false as const,
				example: false,
			},
			enableEmail: {
				type: 'boolean' as const,
				optional: false as const, nullable: false as const,
			},
			enableTwitterIntegration: {
				type: 'boolean' as const,
				optional: false as const, nullable: false as const,
			},
			enableGithubIntegration: {
				type: 'boolean' as const,
				optional: false as const, nullable: false as const,
			},
			enableDiscordIntegration: {
				type: 'boolean' as const,
				optional: false as const, nullable: false as const,
			},
			enableServiceWorker: {
				type: 'boolean' as const,
				optional: false as const, nullable: false as const,
			},
			translatorAvailable: {
				type: 'boolean' as const,
				optional: false as const, nullable: false as const,
			},
			proxyAccountName: {
				type: 'string' as const,
				optional: false as const, nullable: true as const,
			},
			features: {
				type: 'object' as const,
				optional: true as const, nullable: false as const,
				properties: {
					registration: {
						type: 'boolean' as const,
						optional: false as const, nullable: false as const,
					},
					localTimeLine: {
						type: 'boolean' as const,
						optional: false as const, nullable: false as const,
					},
					globalTimeLine: {
						type: 'boolean' as const,
						optional: false as const, nullable: false as const,
					},
					elasticsearch: {
						type: 'boolean' as const,
						optional: false as const, nullable: false as const,
					},
					hcaptcha: {
						type: 'boolean' as const,
						optional: false as const, nullable: false as const,
					},
					recaptcha: {
						type: 'boolean' as const,
						optional: false as const, nullable: false as const,
					},
					objectStorage: {
						type: 'boolean' as const,
						optional: false as const, nullable: false as const,
					},
					twitter: {
						type: 'boolean' as const,
						optional: false as const, nullable: false as const,
					},
					github: {
						type: 'boolean' as const,
						optional: false as const, nullable: false as const,
					},
					discord: {
						type: 'boolean' as const,
						optional: false as const, nullable: false as const,
					},
					serviceWorker: {
						type: 'boolean' as const,
						optional: false as const, nullable: false as const,
					},
					miauth: {
						type: 'boolean' as const,
						optional: true as const, nullable: false as const,
						default: true,
					},
				},
			},
			userStarForReactionFallback: {
				type: 'boolean' as const,
				optional: true as const, nullable: false as const,
			},
			pinnedUsers: {
				type: 'array' as const,
				optional: true as const, nullable: false as const,
				items: {
					type: 'string' as const,
					optional: false as const, nullable: false as const,
				},
			},
			hiddenTags: {
				type: 'array' as const,
				optional: true as const, nullable: false as const,
				items: {
					type: 'string' as const,
					optional: false as const, nullable: false as const,
				},
			},
			blockedHosts: {
				type: 'array' as const,
				optional: true as const, nullable: false as const,
				items: {
					type: 'string' as const,
					optional: false as const, nullable: false as const,
				},
			},
			hcaptchaSecretKey: {
				type: 'string' as const,
				optional: true as const, nullable: true as const,
			},
			recaptchaSecretKey: {
				type: 'string' as const,
				optional: true as const, nullable: true as const,
			},
			proxyAccountId: {
				type: 'string' as const,
				optional: true as const, nullable: true as const,
				format: 'id',
			},
			twitterConsumerKey: {
				type: 'string' as const,
				optional: true as const, nullable: true as const,
			},
			twitterConsumerSecret: {
				type: 'string' as const,
				optional: true as const, nullable: true as const,
			},
			githubClientId: {
				type: 'string' as const,
				optional: true as const, nullable: true as const,
			},
			githubClientSecret: {
				type: 'string' as const,
				optional: true as const, nullable: true as const,
			},
			discordClientId: {
				type: 'string' as const,
				optional: true as const, nullable: true as const,
			},
			discordClientSecret: {
				type: 'string' as const,
				optional: true as const, nullable: true as const,
			},
			summaryProxy: {
				type: 'string' as const,
				optional: true as const, nullable: true as const,
			},
			email: {
				type: 'string' as const,
				optional: true as const, nullable: true as const,
			},
			smtpSecure: {
				type: 'boolean' as const,
				optional: true as const, nullable: false as const,
			},
			smtpHost: {
				type: 'string' as const,
				optional: true as const, nullable: true as const,
			},
			smtpPort: {
				type: 'string' as const,
				optional: true as const, nullable: true as const,
			},
			smtpUser: {
				type: 'string' as const,
				optional: true as const, nullable: true as const,
			},
			smtpPass: {
				type: 'string' as const,
				optional: true as const, nullable: true as const,
			},
			swPrivateKey: {
				type: 'string' as const,
				optional: true as const, nullable: true as const,
			},
			useObjectStorage: {
				type: 'boolean' as const,
				optional: true as const, nullable: false as const,
			},
			objectStorageBaseUrl: {
				type: 'string' as const,
				optional: true as const, nullable: true as const,
			},
			objectStorageBucket: {
				type: 'string' as const,
				optional: true as const, nullable: true as const,
			},
			objectStoragePrefix: {
				type: 'string' as const,
				optional: true as const, nullable: true as const,
			},
			objectStorageEndpoint: {
				type: 'string' as const,
				optional: true as const, nullable: true as const,
			},
			objectStorageRegion: {
				type: 'string' as const,
				optional: true as const, nullable: true as const,
			},
			objectStoragePort: {
				type: 'number' as const,
				optional: true as const, nullable: true as const,
			},
			objectStorageAccessKey: {
				type: 'string' as const,
				optional: true as const, nullable: true as const,
			},
			objectStorageSecretKey: {
				type: 'string' as const,
				optional: true as const, nullable: true as const,
			},
			objectStorageUseSSL: {
				type: 'boolean' as const,
				optional: true as const, nullable: false as const,
			},
			objectStorageUseProxy: {
				type: 'boolean' as const,
				optional: true as const, nullable: false as const,
			},
			objectStorageSetPublicRead: {
				type: 'boolean' as const,
				optional: true as const, nullable: false as const,
			},
		},
	},
};

export default define(meta, async (ps, me) => {
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

		secure: config.https != null,

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
		mascotImageUrl: instance.mascotImageUrl,
		bannerUrl: instance.bannerUrl,
		errorImageUrl: instance.errorImageUrl,
		iconUrl: instance.iconUrl,
		backgroundImageUrl: instance.backgroundImageUrl,
		logoImageUrl: instance.logoImageUrl,
		maxNoteTextLength: Math.min(instance.maxNoteTextLength, DB_MAX_NOTE_TEXT_LENGTH),
		emojis: await Emojis.packMany(emojis),
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
			proxyRemoteFiles: instance.proxyRemoteFiles,
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
