/*
 * SPDX-FileCopyrightText: syuilo and misskey-project , Type4ny-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import type { MiMeta } from '@/models/Meta.js';
import { ModerationLogService } from '@/core/ModerationLogService.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { MetaService } from '@/core/MetaService.js';
import { envOption } from '@/env.js';
import { DI } from '@/di-symbols.js';
import type { Config } from '@/config.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireAdmin: true,
	kind: 'write:admin:meta',
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		disableRegistration: { type: 'boolean', nullable: true },
		pinnedUsers: {
			type: 'array',
			nullable: true,
			items: {
				type: 'string',
			},
		},
		hiddenTags: {
			type: 'array',
			nullable: true,
			items: {
				type: 'string',
			},
		},
		blockedHosts: {
			type: 'array',
			nullable: true,
			items: {
				type: 'string',
			},
		},
		sensitiveWords: {
			type: 'array',
			nullable: true,
			items: {
				type: 'string',
			},
		},
		prohibitedWords: {
			type: 'array',
			nullable: true,
			items: {
				type: 'string',
			},
		},
		themeColor: {
			type: 'string',
			nullable: true,
			pattern: '^#[0-9a-fA-F]{6}$',
		},
		mascotImageUrl: { type: 'string', nullable: true },
		bannerUrl: { type: 'string', nullable: true },
		serverErrorImageUrl: { type: 'string', nullable: true },
		googleAnalyticsId: { type: 'string', nullable: true },
		infoImageUrl: { type: 'string', nullable: true },
		notFoundImageUrl: { type: 'string', nullable: true },
		iconUrl: { type: 'string', nullable: true },
		app192IconUrl: { type: 'string', nullable: true },
		app512IconUrl: { type: 'string', nullable: true },
		backgroundImageUrl: { type: 'string', nullable: true },
		backgroundImageUrls: {
			type: 'array',
			items: {
				type: 'string',
			},
		},
		logoImageUrl: { type: 'string', nullable: true },
		name: { type: 'string', nullable: true },
		shortName: { type: 'string', nullable: true },
		description: { type: 'string', nullable: true },
		defaultLightTheme: { type: 'string', nullable: true },
		defaultDarkTheme: { type: 'string', nullable: true },
		cacheRemoteFiles: { type: 'boolean' },
		cacheRemoteSensitiveFiles: { type: 'boolean' },
		emailRequiredForSignup: { type: 'boolean' },
		enableHcaptcha: { type: 'boolean' },
		hcaptchaSiteKey: { type: 'string', nullable: true },
		hcaptchaSecretKey: { type: 'string', nullable: true },
		enableMcaptcha: { type: 'boolean' },
		mcaptchaSiteKey: { type: 'string', nullable: true },
		mcaptchaInstanceUrl: { type: 'string', nullable: true },
		mcaptchaSecretKey: { type: 'string', nullable: true },
		enableRecaptcha: { type: 'boolean' },
		recaptchaSiteKey: { type: 'string', nullable: true },
		recaptchaSecretKey: { type: 'string', nullable: true },
		enableTurnstile: { type: 'boolean' },
		turnstileSiteKey: { type: 'string', nullable: true },
		turnstileSecretKey: { type: 'string', nullable: true },
		sensitiveMediaDetection: {
			type: 'string',
			enum: ['none', 'all', 'local', 'remote'],
		},
		sensitiveMediaDetectionSensitivity: {
			type: 'string',
			enum: ['medium', 'low', 'high', 'veryLow', 'veryHigh'],
		},
		setSensitiveFlagAutomatically: { type: 'boolean' },
		enableSensitiveMediaDetectionForVideos: { type: 'boolean' },
		proxyAccountId: { type: 'string', format: 'misskey:id', nullable: true },
		maintainerName: { type: 'string', nullable: true },
		maintainerEmail: { type: 'string', nullable: true },
		langs: {
			type: 'array',
			items: {
				type: 'string',
			},
		},
		DiscordWebhookUrl: { type: 'string', nullable: true },
		DiscordWebhookUrlWordBlock: { type: 'string', nullable: true },
		deeplAuthKey: { type: 'string', nullable: true },
		deeplIsPro: { type: 'boolean' },
		enableEmail: { type: 'boolean' },
		email: { type: 'string', nullable: true },
		smtpSecure: { type: 'boolean' },
		smtpHost: { type: 'string', nullable: true },
		smtpPort: { type: 'integer', nullable: true },
		smtpUser: { type: 'string', nullable: true },
		smtpPass: { type: 'string', nullable: true },
		enableServiceWorker: { type: 'boolean' },
		swPublicKey: { type: 'string', nullable: true },
		swPrivateKey: { type: 'string', nullable: true },
		tosUrl: { type: 'string', nullable: true },
		repositoryUrl: { type: 'string', nullable: true },
		feedbackUrl: { type: 'string', nullable: true },
		impressumUrl: { type: 'string', nullable: true },
		privacyPolicyUrl: { type: 'string', nullable: true },
		inquiryUrl: { type: 'string', nullable: true },
		useObjectStorage: { type: 'boolean' },
		objectStorageBaseUrl: { type: 'string', nullable: true },
		requestEmojiAllOk: { type: 'boolean', nullable: true },
		objectStorageBucket: { type: 'string', nullable: true },
		objectStoragePrefix: { type: 'string', nullable: true },
		objectStorageEndpoint: { type: 'string', nullable: true },
		objectStorageRegion: { type: 'string', nullable: true },
		objectStoragePort: { type: 'integer', nullable: true },
		objectStorageAccessKey: { type: 'string', nullable: true },
		objectStorageSecretKey: { type: 'string', nullable: true },
		objectStorageUseSSL: { type: 'boolean' },
		objectStorageUseProxy: { type: 'boolean' },
		objectStorageSetPublicRead: { type: 'boolean' },
		objectStorageS3ForcePathStyle: { type: 'boolean' },
		enableIpLogging: { type: 'boolean' },
		enableActiveEmailValidation: { type: 'boolean' },
		enableVerifymailApi: { type: 'boolean' },
		verifymailAuthKey: { type: 'string', nullable: true },
		enableTruemailApi: { type: 'boolean' },
		truemailInstance: { type: 'string', nullable: true },
		truemailAuthKey: { type: 'string', nullable: true },
		enableChartsForRemoteUser: { type: 'boolean' },
		enableChartsForFederatedInstances: { type: 'boolean' },
		enableServerMachineStats: { type: 'boolean' },
		enableIdenticonGeneration: { type: 'boolean' },
		serverRules: { type: 'array', items: { type: 'string' } },
		bannedEmailDomains: { type: 'array', items: { type: 'string' } },
		preservedUsernames: { type: 'array', items: { type: 'string' } },
		manifestJsonOverride: { type: 'string' },
		enableFanoutTimeline: { type: 'boolean' },
		enableFanoutTimelineDbFallback: { type: 'boolean' },
		perLocalUserUserTimelineCacheMax: { type: 'integer' },
		perRemoteUserUserTimelineCacheMax: { type: 'integer' },
		perUserHomeTimelineCacheMax: { type: 'integer' },
		perUserListTimelineCacheMax: { type: 'integer' },
		notesPerOneAd: { type: 'integer' },
		silencedHosts: {
			type: 'array',
			nullable: true,
			items: {
				type: 'string',
			},
		},
		mediaSilencedHosts: {
			type: 'array',
			nullable: true,
			items: {
				type: 'string',
			},
		},
		summalyProxy: {
			type: 'string',
			nullable: true,
			description: '[Deprecated] Use "urlPreviewSummaryProxyUrl" instead.',
		},
		urlPreviewEnabled: { type: 'boolean', nullable: true },
		urlPreviewTimeout: { type: 'integer', nullable: true },
		urlPreviewMaximumContentLength: { type: 'integer', nullable: true },
		urlPreviewRequireContentLength: { type: 'boolean', nullable: true },
		urlPreviewUserAgent: { type: 'string', nullable: true },
		urlPreviewSummaryProxyUrl: { type: 'string', nullable: true },
		EmojiBotToken: { type: 'string', nullable: true },
		ApiBase: { type: 'string', nullable: true },
		enableGDPRMode: { type: 'boolean', nullable: true },
		enableProxyCheckio: { type: 'boolean', nullable: true },
		proxyCheckioApiKey: { type: 'string', nullable: true },
		iconLight: { type: 'string', nullable: true },
		iconDark: { type: 'string', nullable: true },
		bannerLight: { type: 'string', nullable: true },
		bannerDark: { type: 'string', nullable: true },
		pointName: { type: 'string', nullable: true },
	},
	required: [],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject(DI.config)
		private config: Config,
		private metaService: MetaService,
		private moderationLogService: ModerationLogService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const set = {} as Partial<MiMeta>;
			if (!envOption.managed || this.config.rootUserName === me.username) {
				if (typeof ps.disableRegistration === 'boolean') {
					set.disableRegistration = ps.disableRegistration;
				}

				if (ps.useObjectStorage !== undefined) {
					set.useObjectStorage = ps.useObjectStorage;
				}

				if (ps.pointName !== undefined) {
					set.pointName = ps.pointName;
				}

				if (ps.objectStorageBaseUrl !== undefined) {
					set.objectStorageBaseUrl = ps.objectStorageBaseUrl;
				}

				if (ps.objectStorageBucket !== undefined) {
					set.objectStorageBucket = ps.objectStorageBucket;
				}

				if (ps.objectStoragePrefix !== undefined) {
					set.objectStoragePrefix = ps.objectStoragePrefix;
				}

				if (ps.objectStorageEndpoint !== undefined) {
					set.objectStorageEndpoint = ps.objectStorageEndpoint;
				}

				if (ps.objectStorageRegion !== undefined) {
					set.objectStorageRegion = ps.objectStorageRegion;
				}

				if (ps.objectStoragePort !== undefined) {
					set.objectStoragePort = ps.objectStoragePort;
				}

				if (ps.objectStorageAccessKey !== undefined) {
					set.objectStorageAccessKey = ps.objectStorageAccessKey;
				}

				if (ps.objectStorageSecretKey !== undefined) {
					set.objectStorageSecretKey = ps.objectStorageSecretKey;
				}

				if (ps.objectStorageUseSSL !== undefined) {
					set.objectStorageUseSSL = ps.objectStorageUseSSL;
				}

				if (ps.objectStorageUseProxy !== undefined) {
					set.objectStorageUseProxy = ps.objectStorageUseProxy;
				}

				if (ps.objectStorageSetPublicRead !== undefined) {
					set.objectStorageSetPublicRead = ps.objectStorageSetPublicRead;
				}

				if (ps.objectStorageS3ForcePathStyle !== undefined) {
					set.objectStorageS3ForcePathStyle = ps.objectStorageS3ForcePathStyle;
				}

				if (ps.enableServerMachineStats !== undefined) {
					set.enableServerMachineStats = ps.enableServerMachineStats;
				}

				if (ps.cacheRemoteFiles !== undefined) {
					set.cacheRemoteFiles = ps.cacheRemoteFiles;
				}

				if (ps.cacheRemoteSensitiveFiles !== undefined) {
					set.cacheRemoteSensitiveFiles = ps.cacheRemoteSensitiveFiles;
				}

				if (ps.enableFanoutTimeline !== undefined) {
					set.enableFanoutTimeline = ps.enableFanoutTimeline;
				}

				if (ps.enableFanoutTimelineDbFallback !== undefined) {
					set.enableFanoutTimelineDbFallback =
						ps.enableFanoutTimelineDbFallback;
				}

				if (ps.perLocalUserUserTimelineCacheMax !== undefined) {
					set.perLocalUserUserTimelineCacheMax =
						ps.perLocalUserUserTimelineCacheMax;
				}

				if (ps.perRemoteUserUserTimelineCacheMax !== undefined) {
					set.perRemoteUserUserTimelineCacheMax =
						ps.perRemoteUserUserTimelineCacheMax;
				}

				if (ps.perUserHomeTimelineCacheMax !== undefined) {
					set.perUserHomeTimelineCacheMax = ps.perUserHomeTimelineCacheMax;
				}

				if (ps.perUserListTimelineCacheMax !== undefined) {
					set.perUserListTimelineCacheMax = ps.perUserListTimelineCacheMax;
				}
			}

			if (Array.isArray(ps.pinnedUsers)) {
				set.pinnedUsers = ps.pinnedUsers.filter(Boolean);
			}

			if (Array.isArray(ps.hiddenTags)) {
				set.hiddenTags = ps.hiddenTags.filter(Boolean);
			}

			if (Array.isArray(ps.blockedHosts)) {
				set.blockedHosts = ps.blockedHosts
					.filter(Boolean)
					.map((x) => x.toLowerCase());
			}

			if (Array.isArray(ps.sensitiveWords)) {
				set.sensitiveWords = ps.sensitiveWords.filter(Boolean);
			}
			if (Array.isArray(ps.prohibitedWords)) {
				set.prohibitedWords = ps.prohibitedWords.filter(Boolean);
			}
			if (Array.isArray(ps.silencedHosts)) {
				let lastValue = '';
				set.silencedHosts = ps.silencedHosts.sort().filter((h) => {
					const lv = lastValue;
					lastValue = h;
					return h !== '' && h !== lv && !set.blockedHosts?.includes(h);
				});
			}
			if (Array.isArray(ps.mediaSilencedHosts)) {
				let lastValue = '';
				set.mediaSilencedHosts = ps.mediaSilencedHosts.sort().filter((h) => {
					const lv = lastValue;
					lastValue = h;
					return h !== '' && h !== lv && !set.blockedHosts?.includes(h);
				});
			}
			if (ps.themeColor !== undefined) {
				set.themeColor = ps.themeColor;
			}
			if (ps.DiscordWebhookUrl !== undefined) {
				set.DiscordWebhookUrl = ps.DiscordWebhookUrl;
			}
			if (ps.DiscordWebhookUrlWordBlock !== undefined) {
				set.DiscordWebhookUrlWordBlock = ps.DiscordWebhookUrlWordBlock;
			}
			if (ps.EmojiBotToken !== undefined) {
				set.EmojiBotToken = ps.EmojiBotToken;
			}
			if (ps.ApiBase !== undefined) {
				set.ApiBase = ps.ApiBase;
			}
			if (ps.mascotImageUrl !== undefined) {
				set.mascotImageUrl = ps.mascotImageUrl;
			}

			if (ps.bannerUrl !== undefined) {
				set.bannerUrl = ps.bannerUrl;
			}

			if (ps.iconUrl !== undefined) {
				set.iconUrl = ps.iconUrl;
			}

			if (ps.app192IconUrl !== undefined) {
				set.app192IconUrl = ps.app192IconUrl;
			}

			if (ps.app512IconUrl !== undefined) {
				set.app512IconUrl = ps.app512IconUrl;
			}

			if (ps.serverErrorImageUrl !== undefined) {
				set.serverErrorImageUrl = ps.serverErrorImageUrl;
			}
			if (ps.googleAnalyticsId !== undefined) {
				set.googleAnalyticsId = ps.googleAnalyticsId;
			}
			if (typeof ps.enableProxyCheckio === 'boolean') {
				set.enableProxyCheckio = ps.enableProxyCheckio;
			}

			if (ps.proxyCheckioApiKey !== undefined) {
				set.proxyCheckioApiKey = ps.proxyCheckioApiKey ?? undefined;
			}

			if (ps.infoImageUrl !== undefined) {
				set.infoImageUrl = ps.infoImageUrl;
			}

			if (ps.enableGDPRMode !== undefined) {
				set.enableGDPRMode = ps.enableGDPRMode ?? undefined;
			}

			if (typeof ps.requestEmojiAllOk === 'boolean') {
				set.requestEmojiAllOk = ps.requestEmojiAllOk;
			}

			if (ps.notFoundImageUrl !== undefined) {
				set.notFoundImageUrl = ps.notFoundImageUrl;
			}

			if (ps.backgroundImageUrl !== undefined) {
				set.backgroundImageUrl = ps.backgroundImageUrl;
			}
			if (ps.backgroundImageUrls !== undefined) {
				set.backgroundImageUrls = ps.backgroundImageUrls.map(url => ({ url }));
			}

			if (ps.logoImageUrl !== undefined) {
				set.logoImageUrl = ps.logoImageUrl;
			}

			if (ps.name !== undefined) {
				set.name = ps.name;
			}

			if (ps.shortName !== undefined) {
				set.shortName = ps.shortName;
			}

			if (ps.description !== undefined) {
				set.description = ps.description;
			}

			if (ps.defaultLightTheme !== undefined) {
				set.defaultLightTheme = ps.defaultLightTheme;
			}

			if (ps.defaultDarkTheme !== undefined) {
				set.defaultDarkTheme = ps.defaultDarkTheme;
			}

			if (ps.emailRequiredForSignup !== undefined) {
				set.emailRequiredForSignup = ps.emailRequiredForSignup;
			}

			if (ps.enableHcaptcha !== undefined) {
				set.enableHcaptcha = ps.enableHcaptcha;
			}

			if (ps.hcaptchaSiteKey !== undefined) {
				set.hcaptchaSiteKey = ps.hcaptchaSiteKey;
			}

			if (ps.hcaptchaSecretKey !== undefined) {
				set.hcaptchaSecretKey = ps.hcaptchaSecretKey;
			}

			if (ps.enableMcaptcha !== undefined) {
				set.enableMcaptcha = ps.enableMcaptcha;
			}

			if (ps.mcaptchaSiteKey !== undefined) {
				set.mcaptchaSitekey = ps.mcaptchaSiteKey;
			}

			if (ps.mcaptchaInstanceUrl !== undefined) {
				set.mcaptchaInstanceUrl = ps.mcaptchaInstanceUrl;
			}

			if (ps.mcaptchaSecretKey !== undefined) {
				set.mcaptchaSecretKey = ps.mcaptchaSecretKey;
			}

			if (ps.enableRecaptcha !== undefined) {
				set.enableRecaptcha = ps.enableRecaptcha;
			}

			if (ps.recaptchaSiteKey !== undefined) {
				set.recaptchaSiteKey = ps.recaptchaSiteKey;
			}

			if (ps.recaptchaSecretKey !== undefined) {
				set.recaptchaSecretKey = ps.recaptchaSecretKey;
			}

			if (ps.enableTurnstile !== undefined) {
				set.enableTurnstile = ps.enableTurnstile;
			}

			if (ps.turnstileSiteKey !== undefined) {
				set.turnstileSiteKey = ps.turnstileSiteKey;
			}

			if (ps.turnstileSecretKey !== undefined) {
				set.turnstileSecretKey = ps.turnstileSecretKey;
			}

			if (ps.sensitiveMediaDetection !== undefined) {
				set.sensitiveMediaDetection = ps.sensitiveMediaDetection;
			}

			if (ps.sensitiveMediaDetectionSensitivity !== undefined) {
				set.sensitiveMediaDetectionSensitivity =
					ps.sensitiveMediaDetectionSensitivity;
			}

			if (ps.setSensitiveFlagAutomatically !== undefined) {
				set.setSensitiveFlagAutomatically = ps.setSensitiveFlagAutomatically;
			}

			if (ps.enableSensitiveMediaDetectionForVideos !== undefined) {
				set.enableSensitiveMediaDetectionForVideos =
					ps.enableSensitiveMediaDetectionForVideos;
			}

			if (ps.proxyAccountId !== undefined) {
				set.proxyAccountId = ps.proxyAccountId;
			}

			if (ps.maintainerName !== undefined) {
				set.maintainerName = ps.maintainerName;
			}

			if (ps.maintainerEmail !== undefined) {
				set.maintainerEmail = ps.maintainerEmail;
			}

			if (Array.isArray(ps.langs)) {
				set.langs = ps.langs.filter(Boolean);
			}

			if (ps.enableEmail !== undefined) {
				set.enableEmail = ps.enableEmail;
			}

			if (ps.email !== undefined) {
				set.email = ps.email;
			}

			if (ps.smtpSecure !== undefined) {
				set.smtpSecure = ps.smtpSecure;
			}

			if (ps.smtpHost !== undefined) {
				set.smtpHost = ps.smtpHost;
			}

			if (ps.smtpPort !== undefined) {
				set.smtpPort = ps.smtpPort;
			}

			if (ps.smtpUser !== undefined) {
				set.smtpUser = ps.smtpUser;
			}

			if (ps.smtpPass !== undefined) {
				set.smtpPass = ps.smtpPass;
			}

			if (ps.enableServiceWorker !== undefined) {
				set.enableServiceWorker = ps.enableServiceWorker;
			}

			if (ps.swPublicKey !== undefined) {
				set.swPublicKey = ps.swPublicKey;
			}

			if (ps.swPrivateKey !== undefined) {
				set.swPrivateKey = ps.swPrivateKey;
			}

			if (ps.tosUrl !== undefined) {
				set.termsOfServiceUrl = ps.tosUrl;
			}

			if (ps.repositoryUrl !== undefined) {
				set.repositoryUrl = URL.canParse(ps.repositoryUrl!)
					? ps.repositoryUrl
					: null;
			}

			if (ps.feedbackUrl !== undefined) {
				set.feedbackUrl = ps.feedbackUrl;
			}

			if (ps.impressumUrl !== undefined) {
				set.impressumUrl = ps.impressumUrl;
			}

			if (ps.privacyPolicyUrl !== undefined) {
				set.privacyPolicyUrl = ps.privacyPolicyUrl;
			}

			if (ps.inquiryUrl !== undefined) {
				set.inquiryUrl = ps.inquiryUrl;
			}

			if (ps.deeplAuthKey !== undefined) {
				if (ps.deeplAuthKey === '') {
					set.deeplAuthKey = null;
				} else {
					set.deeplAuthKey = ps.deeplAuthKey;
				}
			}

			if (ps.deeplIsPro !== undefined) {
				set.deeplIsPro = ps.deeplIsPro;
			}

			if (ps.enableIpLogging !== undefined) {
				set.enableIpLogging = ps.enableIpLogging;
			}

			if (ps.enableActiveEmailValidation !== undefined) {
				set.enableActiveEmailValidation = ps.enableActiveEmailValidation;
			}

			if (ps.enableVerifymailApi !== undefined) {
				set.enableVerifymailApi = ps.enableVerifymailApi;
			}

			if (ps.verifymailAuthKey !== undefined) {
				if (ps.verifymailAuthKey === '') {
					set.verifymailAuthKey = null;
				} else {
					set.verifymailAuthKey = ps.verifymailAuthKey;
				}
			}

			if (ps.enableTruemailApi !== undefined) {
				set.enableTruemailApi = ps.enableTruemailApi;
			}

			if (ps.truemailInstance !== undefined) {
				if (ps.truemailInstance === '') {
					set.truemailInstance = null;
				} else {
					set.truemailInstance = ps.truemailInstance;
				}
			}

			if (ps.truemailAuthKey !== undefined) {
				if (ps.truemailAuthKey === '') {
					set.truemailAuthKey = null;
				} else {
					set.truemailAuthKey = ps.truemailAuthKey;
				}
			}

			if (ps.enableChartsForRemoteUser !== undefined) {
				set.enableChartsForRemoteUser = ps.enableChartsForRemoteUser;
			}

			if (ps.enableChartsForFederatedInstances !== undefined) {
				set.enableChartsForFederatedInstances =
					ps.enableChartsForFederatedInstances;
			}

			if (ps.enableIdenticonGeneration !== undefined) {
				set.enableIdenticonGeneration = ps.enableIdenticonGeneration;
			}

			if (ps.serverRules !== undefined) {
				set.serverRules = ps.serverRules;
			}

			if (ps.preservedUsernames !== undefined) {
				set.preservedUsernames = ps.preservedUsernames;
			}

			if (ps.manifestJsonOverride !== undefined) {
				set.manifestJsonOverride = ps.manifestJsonOverride;
			}

			if (ps.notesPerOneAd !== undefined) {
				set.notesPerOneAd = ps.notesPerOneAd;
			}

			if (ps.bannedEmailDomains !== undefined) {
				set.bannedEmailDomains = ps.bannedEmailDomains;
			}

			if (typeof ps.urlPreviewEnabled === 'boolean') {
				set.urlPreviewEnabled = ps.urlPreviewEnabled;
			}

			if (typeof ps.urlPreviewTimeout === 'number') {
				set.urlPreviewTimeout = ps.urlPreviewTimeout;
			}

			if (typeof ps.urlPreviewMaximumContentLength === 'number') {
				set.urlPreviewMaximumContentLength = ps.urlPreviewMaximumContentLength;
			}

			if (ps.urlPreviewRequireContentLength !== undefined) {
				set.urlPreviewRequireContentLength = ps.urlPreviewRequireContentLength ?? undefined;
			}

			if (ps.urlPreviewUserAgent !== undefined) {
				const value = (ps.urlPreviewUserAgent ?? '').trim();
				set.urlPreviewUserAgent = value === '' ? null : ps.urlPreviewUserAgent;
			}

			if (
				ps.summalyProxy !== undefined ||
				ps.urlPreviewSummaryProxyUrl !== undefined
			) {
				const value = (
					ps.urlPreviewSummaryProxyUrl ??
					ps.summalyProxy ??
					''
				).trim();
				set.urlPreviewSummaryProxyUrl = value === '' ? null : value;
			}
			if (ps.bannerDark !== undefined) {
				set.bannerDark = ps.bannerDark;
			}
			if (ps.bannerLight !== undefined) {
				set.bannerLight = ps.bannerLight;
			}
			if (ps.iconDark !== undefined) {
				set.iconDark = ps.iconDark;
			}
			if (ps.iconLight !== undefined) {
				set.iconLight = ps.iconLight;
			}
			const before = await this.metaService.fetch(true);

			await this.metaService.update(set);

			const after = await this.metaService.fetch(true);

			this.moderationLogService.log(me, 'updateServerSettings', {
				before,
				after,
			});
		});
	}
}
