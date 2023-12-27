/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { MetaService } from '@/core/MetaService.js';
import type { Config } from '@/config.js';
import { DI } from '@/di-symbols.js';
import { DEFAULT_POLICIES } from '@/core/RoleService.js';

export const meta = {
	tags: ['meta'],

	requireCredential: true,
	requireAdmin: true,
	kind: 'read:admin:meta',

	res: {
		type: 'object',
		optional: false, nullable: false,
		properties: {
			cacheRemoteFiles: {
				type: 'boolean',
				optional: false, nullable: false,
			},
			cacheRemoteSensitiveFiles: {
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
			enableTurnstile: {
				type: 'boolean',
				optional: false, nullable: false,
			},
			turnstileSiteKey: {
				type: 'string',
				optional: false, nullable: true,
			},
			swPublickey: {
				type: 'string',
				optional: false, nullable: true,
			},
			mascotImageUrl: {
				type: 'string',
				optional: false, nullable: true,
				default: '/assets/ai.png',
			},
			bannerUrl: {
				type: 'string',
				optional: false, nullable: true,
			},
			serverErrorImageUrl: {
				type: 'string',
				optional: false, nullable: true,
			},
			infoImageUrl: {
				type: 'string',
				optional: false, nullable: true,
			},
			notFoundImageUrl: {
				type: 'string',
				optional: false, nullable: true,
			},
			iconUrl: {
				type: 'string',
				optional: false, nullable: true,
			},
			app192IconUrl: {
				type: 'string',
				optional: false, nullable: true,
			},
			app512IconUrl: {
				type: 'string',
				optional: false, nullable: true,
			},
			enableEmail: {
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
			silencedHosts: {
				type: 'array',
				optional: true,
				nullable: false,
				items: {
					type: 'string',
					optional: false,
					nullable: false,
				},
			},
			pinnedUsers: {
				type: 'array',
				optional: false, nullable: false,
				items: {
					type: 'string',
				},
			},
			hiddenTags: {
				type: 'array',
				optional: false, nullable: false,
				items: {
					type: 'string',
				},
			},
			blockedHosts: {
				type: 'array',
				optional: false, nullable: false,
				items: {
					type: 'string',
				},
			},
			sensitiveWords: {
				type: 'array',
				optional: false, nullable: false,
				items: {
					type: 'string',
				},
			},
			bannedEmailDomains: {
				type: 'array',
				optional: true, nullable: false,
				items: {
					type: 'string',
					optional: false, nullable: false,
				},
			},
			preservedUsernames: {
				type: 'array',
				optional: false, nullable: false,
				items: {
					type: 'string',
				},
			},
			hcaptchaSecretKey: {
				type: 'string',
				optional: false, nullable: true,
			},
			recaptchaSecretKey: {
				type: 'string',
				optional: false, nullable: true,
			},
			turnstileSecretKey: {
				type: 'string',
				optional: false, nullable: true,
			},
			sensitiveMediaDetection: {
				type: 'string',
				optional: false, nullable: false,
			},
			sensitiveMediaDetectionSensitivity: {
				type: 'string',
				optional: false, nullable: false,
			},
			setSensitiveFlagAutomatically: {
				type: 'boolean',
				optional: false, nullable: false,
			},
			enableSensitiveMediaDetectionForVideos: {
				type: 'boolean',
				optional: false, nullable: false,
			},
			proxyAccountId: {
				type: 'string',
				optional: false, nullable: true,
				format: 'id',
			},
			email: {
				type: 'string',
				optional: false, nullable: true,
			},
			smtpSecure: {
				type: 'boolean',
				optional: false, nullable: false,
			},
			smtpHost: {
				type: 'string',
				optional: false, nullable: true,
			},
			smtpPort: {
				type: 'number',
				optional: false, nullable: true,
			},
			smtpUser: {
				type: 'string',
				optional: false, nullable: true,
			},
			smtpPass: {
				type: 'string',
				optional: false, nullable: true,
			},
			swPrivateKey: {
				type: 'string',
				optional: false, nullable: true,
			},
			useObjectStorage: {
				type: 'boolean',
				optional: false, nullable: false,
			},
			objectStorageBaseUrl: {
				type: 'string',
				optional: false, nullable: true,
			},
			objectStorageBucket: {
				type: 'string',
				optional: false, nullable: true,
			},
			objectStoragePrefix: {
				type: 'string',
				optional: false, nullable: true,
			},
			objectStorageEndpoint: {
				type: 'string',
				optional: false, nullable: true,
			},
			objectStorageRegion: {
				type: 'string',
				optional: false, nullable: true,
			},
			objectStoragePort: {
				type: 'number',
				optional: false, nullable: true,
			},
			objectStorageAccessKey: {
				type: 'string',
				optional: false, nullable: true,
			},
			objectStorageSecretKey: {
				type: 'string',
				optional: false, nullable: true,
			},
			objectStorageUseSSL: {
				type: 'boolean',
				optional: false, nullable: false,
			},
			objectStorageUseProxy: {
				type: 'boolean',
				optional: false, nullable: false,
			},
			objectStorageSetPublicRead: {
				type: 'boolean',
				optional: false, nullable: false,
			},
			enableIpLogging: {
				type: 'boolean',
				optional: false, nullable: false,
			},
			enableActiveEmailValidation: {
				type: 'boolean',
				optional: false, nullable: false,
			},
			enableVerifymailApi: {
				type: 'boolean',
				optional: false, nullable: false,
			},
			verifymailAuthKey: {
				type: 'string',
				optional: false, nullable: true,
			},
			enableChartsForRemoteUser: {
				type: 'boolean',
				optional: false, nullable: false,
			},
			enableChartsForFederatedInstances: {
				type: 'boolean',
				optional: false, nullable: false,
			},
			enableServerMachineStats: {
				type: 'boolean',
				optional: false, nullable: false,
			},
			enableIdenticonGeneration: {
				type: 'boolean',
				optional: false, nullable: false,
			},
			manifestJsonOverride: {
				type: 'string',
				optional: false, nullable: false,
			},
			policies: {
				type: 'object',
				optional: false, nullable: false,
			},
			enableFanoutTimeline: {
				type: 'boolean',
				optional: false, nullable: false,
			},
			enableFanoutTimelineDbFallback: {
				type: 'boolean',
				optional: false, nullable: false,
			},
			perLocalUserUserTimelineCacheMax: {
				type: 'number',
				optional: false, nullable: false,
			},
			perRemoteUserUserTimelineCacheMax: {
				type: 'number',
				optional: false, nullable: false,
			},
			perUserHomeTimelineCacheMax: {
				type: 'number',
				optional: false, nullable: false,
			},
			perUserListTimelineCacheMax: {
				type: 'number',
				optional: false, nullable: false,
			},
			notesPerOneAd: {
				type: 'number',
				optional: false, nullable: false,
			},
			backgroundImageUrl: {
				type: 'string',
				optional: false, nullable: true,
			},
			deeplAuthKey: {
				type: 'string',
				optional: false, nullable: true,
			},
			deeplIsPro: {
				type: 'boolean',
				optional: false, nullable: false,
			},
			defaultDarkTheme: {
				type: 'string',
				optional: false, nullable: true,
			},
			defaultLightTheme: {
				type: 'string',
				optional: false, nullable: true,
			},
			description: {
				type: 'string',
				optional: false, nullable: true,
			},
			disableRegistration: {
				type: 'boolean',
				optional: false, nullable: false,
			},
			impressumUrl: {
				type: 'string',
				optional: false, nullable: true,
			},
			maintainerEmail: {
				type: 'string',
				optional: false, nullable: true,
			},
			maintainerName: {
				type: 'string',
				optional: false, nullable: true,
			},
			name: {
				type: 'string',
				optional: false, nullable: true,
			},
			shortName: {
				type: 'string',
				optional: false, nullable: true,
			},
			objectStorageS3ForcePathStyle: {
				type: 'boolean',
				optional: false, nullable: false,
			},
			privacyPolicyUrl: {
				type: 'string',
				optional: false, nullable: true,
			},
			repositoryUrl: {
				type: 'string',
				optional: false, nullable: false,
			},
			summalyProxy: {
				type: 'string',
				optional: false, nullable: true,
			},
			themeColor: {
				type: 'string',
				optional: false, nullable: true,
			},
			tosUrl: {
				type: 'string',
				optional: false, nullable: true,
			},
			uri: {
				type: 'string',
				optional: false, nullable: false,
			},
			version: {
				type: 'string',
				optional: false, nullable: false,
			},
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
	},
	required: [],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.config)
		private config: Config,

		private metaService: MetaService,
	) {
		super(meta, paramDef, async () => {
			const instance = await this.metaService.fetch(true);

			return {
				maintainerName: instance.maintainerName,
				maintainerEmail: instance.maintainerEmail,
				version: this.config.version,
				name: instance.name,
				shortName: instance.shortName,
				uri: this.config.url,
				description: instance.description,
				langs: instance.langs,
				tosUrl: instance.termsOfServiceUrl,
				repositoryUrl: instance.repositoryUrl,
				feedbackUrl: instance.feedbackUrl,
				impressumUrl: instance.impressumUrl,
				privacyPolicyUrl: instance.privacyPolicyUrl,
				disableRegistration: instance.disableRegistration,
				emailRequiredForSignup: instance.emailRequiredForSignup,
				enableHcaptcha: instance.enableHcaptcha,
				hcaptchaSiteKey: instance.hcaptchaSiteKey,
				enableRecaptcha: instance.enableRecaptcha,
				recaptchaSiteKey: instance.recaptchaSiteKey,
				enableTurnstile: instance.enableTurnstile,
				turnstileSiteKey: instance.turnstileSiteKey,
				swPublickey: instance.swPublicKey,
				themeColor: instance.themeColor,
				mascotImageUrl: instance.mascotImageUrl,
				bannerUrl: instance.bannerUrl,
				serverErrorImageUrl: instance.serverErrorImageUrl,
				notFoundImageUrl: instance.notFoundImageUrl,
				infoImageUrl: instance.infoImageUrl,
				iconUrl: instance.iconUrl,
				app192IconUrl: instance.app192IconUrl,
				app512IconUrl: instance.app512IconUrl,
				backgroundImageUrl: instance.backgroundImageUrl,
				logoImageUrl: instance.logoImageUrl,
				defaultLightTheme: instance.defaultLightTheme,
				defaultDarkTheme: instance.defaultDarkTheme,
				enableEmail: instance.enableEmail,
				enableServiceWorker: instance.enableServiceWorker,
				translatorAvailable: instance.deeplAuthKey != null,
				cacheRemoteFiles: instance.cacheRemoteFiles,
				cacheRemoteSensitiveFiles: instance.cacheRemoteSensitiveFiles,
				pinnedUsers: instance.pinnedUsers,
				hiddenTags: instance.hiddenTags,
				blockedHosts: instance.blockedHosts,
				silencedHosts: instance.silencedHosts,
				sensitiveWords: instance.sensitiveWords,
				preservedUsernames: instance.preservedUsernames,
				hcaptchaSecretKey: instance.hcaptchaSecretKey,
				recaptchaSecretKey: instance.recaptchaSecretKey,
				turnstileSecretKey: instance.turnstileSecretKey,
				sensitiveMediaDetection: instance.sensitiveMediaDetection,
				sensitiveMediaDetectionSensitivity: instance.sensitiveMediaDetectionSensitivity,
				setSensitiveFlagAutomatically: instance.setSensitiveFlagAutomatically,
				enableSensitiveMediaDetectionForVideos: instance.enableSensitiveMediaDetectionForVideos,
				proxyAccountId: instance.proxyAccountId,
				summalyProxy: instance.summalyProxy,
				email: instance.email,
				smtpSecure: instance.smtpSecure,
				smtpHost: instance.smtpHost,
				smtpPort: instance.smtpPort,
				smtpUser: instance.smtpUser,
				smtpPass: instance.smtpPass,
				swPrivateKey: instance.swPrivateKey,
				useObjectStorage: instance.useObjectStorage,
				objectStorageBaseUrl: instance.objectStorageBaseUrl,
				objectStorageBucket: instance.objectStorageBucket,
				objectStoragePrefix: instance.objectStoragePrefix,
				objectStorageEndpoint: instance.objectStorageEndpoint,
				objectStorageRegion: instance.objectStorageRegion,
				objectStoragePort: instance.objectStoragePort,
				objectStorageAccessKey: instance.objectStorageAccessKey,
				objectStorageSecretKey: instance.objectStorageSecretKey,
				objectStorageUseSSL: instance.objectStorageUseSSL,
				objectStorageUseProxy: instance.objectStorageUseProxy,
				objectStorageSetPublicRead: instance.objectStorageSetPublicRead,
				objectStorageS3ForcePathStyle: instance.objectStorageS3ForcePathStyle,
				deeplAuthKey: instance.deeplAuthKey,
				deeplIsPro: instance.deeplIsPro,
				enableIpLogging: instance.enableIpLogging,
				enableActiveEmailValidation: instance.enableActiveEmailValidation,
				enableVerifymailApi: instance.enableVerifymailApi,
				verifymailAuthKey: instance.verifymailAuthKey,
				enableChartsForRemoteUser: instance.enableChartsForRemoteUser,
				enableChartsForFederatedInstances: instance.enableChartsForFederatedInstances,
				enableServerMachineStats: instance.enableServerMachineStats,
				enableIdenticonGeneration: instance.enableIdenticonGeneration,
				bannedEmailDomains: instance.bannedEmailDomains,
				policies: { ...DEFAULT_POLICIES, ...instance.policies },
				manifestJsonOverride: instance.manifestJsonOverride,
				enableFanoutTimeline: instance.enableFanoutTimeline,
				enableFanoutTimelineDbFallback: instance.enableFanoutTimelineDbFallback,
				perLocalUserUserTimelineCacheMax: instance.perLocalUserUserTimelineCacheMax,
				perRemoteUserUserTimelineCacheMax: instance.perRemoteUserUserTimelineCacheMax,
				perUserHomeTimelineCacheMax: instance.perUserHomeTimelineCacheMax,
				perUserListTimelineCacheMax: instance.perUserListTimelineCacheMax,
				notesPerOneAd: instance.notesPerOneAd,
			};
		});
	}
}
