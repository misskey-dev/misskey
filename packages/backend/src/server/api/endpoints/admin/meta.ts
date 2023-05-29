import { Inject, Injectable } from '@nestjs/common';
import { MAX_NOTE_TEXT_LENGTH } from '@/const.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { MetaService } from '@/core/MetaService.js';
import type { Config } from '@/config.js';
import { DI } from '@/di-symbols.js';
import { DEFAULT_POLICIES } from '@/core/RoleService.js';

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<'admin/meta'> {
	name = 'admin/meta' as const;
	constructor(
		@Inject(DI.config)
		private config: Config,

		private metaService: MetaService,
	) {
		super(async (ps, me) => {
			const instance = await this.metaService.fetch(true);

			return {
				maintainerName: instance.maintainerName,
				maintainerEmail: instance.maintainerEmail,
				version: this.config.version,
				name: instance.name,
				uri: this.config.url,
				description: instance.description,
				langs: instance.langs,
				tosUrl: instance.termsOfServiceUrl,
				repositoryUrl: instance.repositoryUrl,
				feedbackUrl: instance.feedbackUrl,
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
				errorImageUrl: instance.errorImageUrl,
				iconUrl: instance.iconUrl,
				backgroundImageUrl: instance.backgroundImageUrl,
				logoImageUrl: instance.logoImageUrl,
				defaultLightTheme: instance.defaultLightTheme,
				defaultDarkTheme: instance.defaultDarkTheme,
				enableEmail: instance.enableEmail,
				enableServiceWorker: instance.enableServiceWorker,
				translatorAvailable: instance.deeplAuthKey != null,
				policies: { ...DEFAULT_POLICIES, ...instance.policies },

				cacheRemoteFiles: instance.cacheRemoteFiles,
				pinnedUsers: instance.pinnedUsers,
				hiddenTags: instance.hiddenTags,
				blockedHosts: instance.blockedHosts,
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
				enableChartsForRemoteUser: instance.enableChartsForRemoteUser,
				enableChartsForFederatedInstances: instance.enableChartsForFederatedInstances,
			};
		});
	}
}
