/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable, Inject } from '@nestjs/common';
import * as v from 'valibot';
import * as mi from '@/misc/schema/index.js';
import { DI } from '@/di-symbols.js';
import type { MiMeta } from '@/models/Meta.js';
import { ModerationLogService } from '@/core/ModerationLogService.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { MetaService } from '@/core/MetaService.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireAdmin: true,
	kind: 'write:admin:meta',
} as const;

export const paramDef = v.object({
	disableRegistration: v.optional(v.nullable(v.boolean())),
	pinnedUsers: v.optional(v.nullable(v.array(v.string()))),
	hiddenTags: v.optional(v.nullable(v.array(v.string()))),
	blockedHosts: v.optional(v.nullable(v.array(v.string()))),
	sensitiveWords: v.optional(v.nullable(v.array(v.string()))),
	prohibitedWords: v.optional(v.nullable(v.array(v.string()))),
	prohibitedWordsForNameOfUser: v.optional(v.nullable(v.array(v.string()))),
	themeColor: v.optional(v.nullable(v.pipe(v.string(), v.regex(/^#[0-9a-fA-F]{6}$/)))),
	mascotImageUrl: v.optional(v.nullable(v.string())),
	bannerUrl: v.optional(v.nullable(v.string())),
	serverErrorImageUrl: v.optional(v.nullable(v.string())),
	infoImageUrl: v.optional(v.nullable(v.string())),
	notFoundImageUrl: v.optional(v.nullable(v.string())),
	iconUrl: v.optional(v.nullable(v.string())),
	app192IconUrl: v.optional(v.nullable(v.string())),
	app512IconUrl: v.optional(v.nullable(v.string())),
	backgroundImageUrl: v.optional(v.nullable(v.string())),
	logoImageUrl: v.optional(v.nullable(v.string())),
	name: v.optional(v.nullable(v.string())),
	shortName: v.optional(v.nullable(v.string())),
	description: v.optional(v.nullable(v.string())),
	defaultLightTheme: v.optional(v.nullable(v.string())),
	defaultDarkTheme: v.optional(v.nullable(v.string())),
	clientOptions: v.optional(v.object({
		entrancePageStyle: v.optional(v.picklist(['classic', 'simple'])),
		showTimelineForVisitor: v.optional(v.boolean()),
		showActivitiesForVisitor: v.optional(v.boolean()),
	})),
	cacheRemoteFiles: v.optional(v.boolean()),
	cacheRemoteSensitiveFiles: v.optional(v.boolean()),
	emailRequiredForSignup: v.optional(v.boolean()),
	enableHcaptcha: v.optional(v.boolean()),
	hcaptchaSiteKey: v.optional(v.nullable(v.string())),
	hcaptchaSecretKey: v.optional(v.nullable(v.string())),
	enableMcaptcha: v.optional(v.boolean()),
	mcaptchaSiteKey: v.optional(v.nullable(v.string())),
	mcaptchaInstanceUrl: v.optional(v.nullable(v.string())),
	mcaptchaSecretKey: v.optional(v.nullable(v.string())),
	enableRecaptcha: v.optional(v.boolean()),
	recaptchaSiteKey: v.optional(v.nullable(v.string())),
	recaptchaSecretKey: v.optional(v.nullable(v.string())),
	enableTurnstile: v.optional(v.boolean()),
	turnstileSiteKey: v.optional(v.nullable(v.string())),
	turnstileSecretKey: v.optional(v.nullable(v.string())),
	enableTestcaptcha: v.optional(v.boolean()),
	googleAnalyticsMeasurementId: v.optional(v.nullable(v.string())),
	sensitiveMediaDetection: v.optional(v.picklist(['none', 'all', 'local', 'remote'])),
	sensitiveMediaDetectionSensitivity: v.optional(v.picklist(['medium', 'low', 'high', 'veryLow', 'veryHigh'])),
	setSensitiveFlagAutomatically: v.optional(v.boolean()),
	enableSensitiveMediaDetectionForVideos: v.optional(v.boolean()),
	sensitiveMediaDetectionApiUrl: v.optional(v.nullable(v.string())),
	sensitiveMediaDetectionApiKey: v.optional(v.nullable(v.string())),
	sensitiveMediaDetectionTimeout: v.optional(mi.integer({ min: 1 })),
	sensitiveMediaDetectionMaxImagesPerRequest: v.optional(mi.integer({ min: 1 })),
	maintainerName: v.optional(v.nullable(v.string())),
	maintainerEmail: v.optional(v.nullable(v.string())),
	langs: v.optional(v.array(v.string())),
	deeplAuthKey: v.optional(v.nullable(v.string())),
	deeplIsPro: v.optional(v.boolean()),
	enableEmail: v.optional(v.boolean()),
	email: v.optional(v.nullable(v.string())),
	smtpSecure: v.optional(v.boolean()),
	smtpHost: v.optional(v.nullable(v.string())),
	smtpPort: v.optional(v.nullable(mi.integer())),
	smtpUser: v.optional(v.nullable(v.string())),
	smtpPass: v.optional(v.nullable(v.string())),
	enableServiceWorker: v.optional(v.boolean()),
	swPublicKey: v.optional(v.nullable(v.string())),
	swPrivateKey: v.optional(v.nullable(v.string())),
	tosUrl: v.optional(v.nullable(v.string())),
	repositoryUrl: v.optional(v.nullable(v.string())),
	feedbackUrl: v.optional(v.nullable(v.string())),
	impressumUrl: v.optional(v.nullable(v.string())),
	privacyPolicyUrl: v.optional(v.nullable(v.string())),
	inquiryUrl: v.optional(v.nullable(v.string())),
	useObjectStorage: v.optional(v.boolean()),
	objectStorageBaseUrl: v.optional(v.nullable(v.string())),
	objectStorageBucket: v.optional(v.nullable(v.string())),
	objectStoragePrefix: v.optional(v.nullable(v.pipe(v.string(), v.regex(/^[a-zA-Z0-9-._]*$/)))),
	objectStorageEndpoint: v.optional(v.nullable(v.string())),
	objectStorageRegion: v.optional(v.nullable(v.string())),
	objectStoragePort: v.optional(v.nullable(mi.integer())),
	objectStorageAccessKey: v.optional(v.nullable(v.string())),
	objectStorageSecretKey: v.optional(v.nullable(v.string())),
	objectStorageUseSSL: v.optional(v.boolean()),
	objectStorageUseProxy: v.optional(v.boolean()),
	objectStorageSetPublicRead: v.optional(v.boolean()),
	objectStorageS3ForcePathStyle: v.optional(v.boolean()),
	enableIpLogging: v.optional(v.boolean()),
	enableActiveEmailValidation: v.optional(v.boolean()),
	enableVerifymailApi: v.optional(v.boolean()),
	verifymailAuthKey: v.optional(v.nullable(v.string())),
	enableTruemailApi: v.optional(v.boolean()),
	truemailInstance: v.optional(v.nullable(v.string())),
	truemailAuthKey: v.optional(v.nullable(v.string())),
	enableChartsForRemoteUser: v.optional(v.boolean()),
	enableChartsForFederatedInstances: v.optional(v.boolean()),
	enableStatsForFederatedInstances: v.optional(v.boolean()),
	enableServerMachineStats: v.optional(v.boolean()),
	enableIdenticonGeneration: v.optional(v.boolean()),
	serverRules: v.optional(v.array(v.string())),
	bannedEmailDomains: v.optional(v.array(v.string())),
	preservedUsernames: v.optional(v.array(v.string())),
	manifestJsonOverride: v.optional(v.string()),
	enableFanoutTimeline: v.optional(v.boolean()),
	enableFanoutTimelineDbFallback: v.optional(v.boolean()),
	perLocalUserUserTimelineCacheMax: v.optional(mi.integer()),
	perRemoteUserUserTimelineCacheMax: v.optional(mi.integer()),
	perUserHomeTimelineCacheMax: v.optional(mi.integer()),
	perUserListTimelineCacheMax: v.optional(mi.integer()),
	enableReactionsBuffering: v.optional(v.boolean()),
	notesPerOneAd: v.optional(mi.integer()),
	silencedHosts: v.optional(v.nullable(v.array(v.string()))),
	mediaSilencedHosts: v.optional(v.nullable(v.array(v.string()))),
	summalyProxy: v.optional(v.nullable(v.pipe(v.string(), v.description('[Deprecated] Use "urlPreviewSummaryProxyUrl" instead.')))),
	urlPreviewEnabled: v.optional(v.boolean()),
	urlPreviewAllowRedirect: v.optional(v.boolean()),
	urlPreviewTimeout: v.optional(mi.integer()),
	urlPreviewMaximumContentLength: v.optional(mi.integer()),
	urlPreviewRequireContentLength: v.optional(v.boolean()),
	urlPreviewUserAgent: v.optional(v.nullable(v.string())),
	urlPreviewSummaryProxyUrl: v.optional(v.nullable(v.string())),
	urlPreviewSensitiveList: v.optional(v.nullable(v.array(v.string()))),
	federation: v.optional(v.picklist(['all', 'none', 'specified'])),
	federationHosts: v.optional(v.array(v.string())),
	deliverSuspendedSoftware: v.optional(v.array(v.object({
		software: v.string(),
		versionRange: v.string(),
	}))),
	singleUserMode: v.optional(v.boolean()),
	ugcVisibilityForVisitor: v.optional(v.picklist(['all', 'local', 'none'])),
	proxyRemoteFiles: v.optional(v.boolean()),
	signToActivityPubGet: v.optional(v.boolean()),
	allowExternalApRedirect: v.optional(v.boolean()),
	enableRemoteNotesCleaning: v.optional(v.boolean()),
	remoteNotesCleaningExpiryDaysForEachNotes: v.optional(v.number()),
	remoteNotesCleaningMaxProcessingDurationInMinutes: v.optional(v.number()),
	showRoleBadgesOfRemoteUsers: v.optional(v.boolean()),
});

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.meta)
		private serverSettings: MiMeta,

		private metaService: MetaService,
		private moderationLogService: ModerationLogService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const set = {} as Partial<MiMeta>;

			if (typeof ps.disableRegistration === 'boolean') {
				set.disableRegistration = ps.disableRegistration;
			}

			if (Array.isArray(ps.pinnedUsers)) {
				set.pinnedUsers = ps.pinnedUsers.filter(Boolean);
			}

			if (Array.isArray(ps.hiddenTags)) {
				set.hiddenTags = ps.hiddenTags.filter(Boolean);
			}

			if (Array.isArray(ps.blockedHosts)) {
				set.blockedHosts = ps.blockedHosts.filter(Boolean).map(x => x.toLowerCase());
			}

			if (Array.isArray(ps.sensitiveWords)) {
				set.sensitiveWords = ps.sensitiveWords.filter(Boolean);
			}
			if (Array.isArray(ps.prohibitedWords)) {
				set.prohibitedWords = ps.prohibitedWords.filter(Boolean);
			}
			if (Array.isArray(ps.prohibitedWordsForNameOfUser)) {
				set.prohibitedWordsForNameOfUser = ps.prohibitedWordsForNameOfUser.filter(Boolean);
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

			if (ps.infoImageUrl !== undefined) {
				set.infoImageUrl = ps.infoImageUrl;
			}

			if (ps.notFoundImageUrl !== undefined) {
				set.notFoundImageUrl = ps.notFoundImageUrl;
			}

			if (ps.backgroundImageUrl !== undefined) {
				set.backgroundImageUrl = ps.backgroundImageUrl;
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

			if (ps.clientOptions !== undefined) {
				set.clientOptions = {
					...this.serverSettings.clientOptions,
					...ps.clientOptions,
				};
			}

			if (ps.cacheRemoteFiles !== undefined) {
				set.cacheRemoteFiles = ps.cacheRemoteFiles;
			}

			if (ps.cacheRemoteSensitiveFiles !== undefined) {
				set.cacheRemoteSensitiveFiles = ps.cacheRemoteSensitiveFiles;
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

			if (ps.enableTestcaptcha !== undefined) {
				set.enableTestcaptcha = ps.enableTestcaptcha;
			}

			if (ps.googleAnalyticsMeasurementId !== undefined) {
				// 空文字列をnullにしたいので??は使わない
				// eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
				set.googleAnalyticsMeasurementId = ps.googleAnalyticsMeasurementId || null;
			}

			if (ps.sensitiveMediaDetection !== undefined) {
				set.sensitiveMediaDetection = ps.sensitiveMediaDetection;
			}

			if (ps.sensitiveMediaDetectionSensitivity !== undefined) {
				set.sensitiveMediaDetectionSensitivity = ps.sensitiveMediaDetectionSensitivity;
			}

			if (ps.setSensitiveFlagAutomatically !== undefined) {
				set.setSensitiveFlagAutomatically = ps.setSensitiveFlagAutomatically;
			}

			if (ps.enableSensitiveMediaDetectionForVideos !== undefined) {
				set.enableSensitiveMediaDetectionForVideos = ps.enableSensitiveMediaDetectionForVideos;
			}

			if (ps.sensitiveMediaDetectionApiUrl !== undefined) {
				set.sensitiveMediaDetectionApiUrl = ps.sensitiveMediaDetectionApiUrl === '' ? null : ps.sensitiveMediaDetectionApiUrl;
			}

			if (ps.sensitiveMediaDetectionApiKey !== undefined) {
				set.sensitiveMediaDetectionApiKey = ps.sensitiveMediaDetectionApiKey === '' ? null : ps.sensitiveMediaDetectionApiKey;
			}

			if (ps.sensitiveMediaDetectionTimeout !== undefined) {
				set.sensitiveMediaDetectionTimeout = ps.sensitiveMediaDetectionTimeout;
			}

			if (ps.sensitiveMediaDetectionMaxImagesPerRequest !== undefined) {
				set.sensitiveMediaDetectionMaxImagesPerRequest = ps.sensitiveMediaDetectionMaxImagesPerRequest;
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
				set.repositoryUrl = URL.canParse(ps.repositoryUrl!) ? ps.repositoryUrl : null;
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

			if (ps.useObjectStorage !== undefined) {
				set.useObjectStorage = ps.useObjectStorage;
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
				set.enableChartsForFederatedInstances = ps.enableChartsForFederatedInstances;
			}

			if (ps.enableStatsForFederatedInstances !== undefined) {
				set.enableStatsForFederatedInstances = ps.enableStatsForFederatedInstances;
			}

			if (ps.enableServerMachineStats !== undefined) {
				set.enableServerMachineStats = ps.enableServerMachineStats;
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

			if (ps.enableFanoutTimeline !== undefined) {
				set.enableFanoutTimeline = ps.enableFanoutTimeline;
			}

			if (ps.enableFanoutTimelineDbFallback !== undefined) {
				set.enableFanoutTimelineDbFallback = ps.enableFanoutTimelineDbFallback;
			}

			if (ps.perLocalUserUserTimelineCacheMax !== undefined) {
				set.perLocalUserUserTimelineCacheMax = ps.perLocalUserUserTimelineCacheMax;
			}

			if (ps.perRemoteUserUserTimelineCacheMax !== undefined) {
				set.perRemoteUserUserTimelineCacheMax = ps.perRemoteUserUserTimelineCacheMax;
			}

			if (ps.perUserHomeTimelineCacheMax !== undefined) {
				set.perUserHomeTimelineCacheMax = ps.perUserHomeTimelineCacheMax;
			}

			if (ps.perUserListTimelineCacheMax !== undefined) {
				set.perUserListTimelineCacheMax = ps.perUserListTimelineCacheMax;
			}

			if (ps.enableReactionsBuffering !== undefined) {
				set.enableReactionsBuffering = ps.enableReactionsBuffering;
			}

			if (ps.notesPerOneAd !== undefined) {
				set.notesPerOneAd = ps.notesPerOneAd;
			}

			if (ps.bannedEmailDomains !== undefined) {
				set.bannedEmailDomains = ps.bannedEmailDomains;
			}

			if (ps.urlPreviewEnabled !== undefined) {
				set.urlPreviewEnabled = ps.urlPreviewEnabled;
			}

			if (ps.urlPreviewAllowRedirect !== undefined) {
				set.urlPreviewAllowRedirect = ps.urlPreviewAllowRedirect;
			}

			if (ps.urlPreviewTimeout !== undefined) {
				set.urlPreviewTimeout = ps.urlPreviewTimeout;
			}

			if (ps.urlPreviewMaximumContentLength !== undefined) {
				set.urlPreviewMaximumContentLength = ps.urlPreviewMaximumContentLength;
			}

			if (ps.urlPreviewRequireContentLength !== undefined) {
				set.urlPreviewRequireContentLength = ps.urlPreviewRequireContentLength;
			}

			if (ps.urlPreviewUserAgent !== undefined) {
				const value = (ps.urlPreviewUserAgent ?? '').trim();
				set.urlPreviewUserAgent = value === '' ? null : ps.urlPreviewUserAgent;
			}

			if (ps.summalyProxy !== undefined || ps.urlPreviewSummaryProxyUrl !== undefined) {
				const value = ((ps.urlPreviewSummaryProxyUrl ?? ps.summalyProxy) ?? '').trim();
				set.urlPreviewSummaryProxyUrl = value === '' ? null : value;
			}

			if (Array.isArray(ps.urlPreviewSensitiveList)) {
				set.urlPreviewSensitiveList = ps.urlPreviewSensitiveList.filter(Boolean);
			}

			if (ps.federation !== undefined) {
				set.federation = ps.federation;
			}

			if (ps.deliverSuspendedSoftware !== undefined) {
				set.deliverSuspendedSoftware = ps.deliverSuspendedSoftware;
			}

			if (Array.isArray(ps.federationHosts)) {
				set.federationHosts = ps.federationHosts.filter(Boolean).map(x => x.toLowerCase());
			}

			if (ps.singleUserMode !== undefined) {
				set.singleUserMode = ps.singleUserMode;
			}

			if (ps.ugcVisibilityForVisitor !== undefined) {
				set.ugcVisibilityForVisitor = ps.ugcVisibilityForVisitor;
			}

			if (ps.proxyRemoteFiles !== undefined) {
				set.proxyRemoteFiles = ps.proxyRemoteFiles;
			}

			if (ps.signToActivityPubGet !== undefined) {
				set.signToActivityPubGet = ps.signToActivityPubGet;
			}

			if (ps.allowExternalApRedirect !== undefined) {
				set.allowExternalApRedirect = ps.allowExternalApRedirect;
			}

			if (ps.enableRemoteNotesCleaning !== undefined) {
				set.enableRemoteNotesCleaning = ps.enableRemoteNotesCleaning;
			}

			if (ps.remoteNotesCleaningExpiryDaysForEachNotes !== undefined) {
				set.remoteNotesCleaningExpiryDaysForEachNotes = ps.remoteNotesCleaningExpiryDaysForEachNotes;
			}

			if (ps.remoteNotesCleaningMaxProcessingDurationInMinutes !== undefined) {
				set.remoteNotesCleaningMaxProcessingDurationInMinutes = ps.remoteNotesCleaningMaxProcessingDurationInMinutes;
			}

			if (ps.showRoleBadgesOfRemoteUsers !== undefined) {
				set.showRoleBadgesOfRemoteUsers = ps.showRoleBadgesOfRemoteUsers;
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
