/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { IsNull, LessThanOrEqual, MoreThan, Brackets } from 'typeorm';
import { Inject, Injectable } from '@nestjs/common';
import JSON5 from 'json5';
import type { AdsRepository } from '@/models/_.js';
import { MAX_NOTE_TEXT_LENGTH } from '@/const.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import { MetaService } from '@/core/MetaService.js';
import { InstanceActorService } from '@/core/InstanceActorService.js';
import type { Config } from '@/config.js';
import { DI } from '@/di-symbols.js';
import { DEFAULT_POLICIES } from '@/core/RoleService.js';

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
			},
			providesTarball: {
				type: 'boolean',
				optional: false, nullable: false,
			},
			name: {
				type: 'string',
				optional: false, nullable: false,
			},
			shortName: {
				type: 'string',
				optional: false, nullable: true,
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
				optional: false, nullable: true,
				default: 'https://github.com/misskey-dev/misskey',
			},
			feedbackUrl: {
				type: 'string',
				optional: false, nullable: true,
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
			enableMcaptcha: {
				type: 'boolean',
				optional: false, nullable: false,
			},
			mcaptchaSiteKey: {
				type: 'string',
				optional: false, nullable: true,
			},
			mcaptchaInstanceUrl: {
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
				optional: false, nullable: false,
				default: '/assets/ai.png',
			},
			bannerUrl: {
				type: 'string',
				optional: false, nullable: false,
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
			maxNoteTextLength: {
				type: 'number',
				optional: false, nullable: false,
			},
			ads: {
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
							example: 'xxxxxxxxxx',
						},
						url: {
							type: 'string',
							optional: false, nullable: false,
							format: 'url',
						},
						place: {
							type: 'string',
							optional: false, nullable: false,
						},
						ratio: {
							type: 'number',
							optional: false, nullable: false,
						},
						imageUrl: {
							type: 'string',
							optional: false, nullable: false,
							format: 'url',
						},
						dayOfWeek: {
							type: 'integer',
							optional: false, nullable: false,
						},
					},
				},
			},
			notesPerOneAd: {
				type: 'number',
				optional: false, nullable: false,
				default: 0,
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
			mediaProxy: {
				type: 'string',
				optional: false, nullable: false,
			},
			features: {
				type: 'object',
				optional: true, nullable: false,
				properties: {
					registration: {
						type: 'boolean',
						optional: false, nullable: false,
					},
					localTimeline: {
						type: 'boolean',
						optional: false, nullable: false,
					},
					globalTimeline: {
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
			backgroundImageUrl: {
				type: 'string',
				optional: false, nullable: true,
			},
			impressumUrl: {
				type: 'string',
				optional: false, nullable: true,
			},
			logoImageUrl: {
				type: 'string',
				optional: false, nullable: true,
			},
			privacyPolicyUrl: {
				type: 'string',
				optional: false, nullable: true,
			},
			serverRules: {
				type: 'array',
				optional: false, nullable: false,
				items: {
					type: 'string',
				},
			},
			themeColor: {
				type: 'string',
				optional: false, nullable: true,
			},
			policies: {
				type: 'object',
				optional: false, nullable: false,
				ref: 'RolePolicies',
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

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.config)
		private config: Config,

		@Inject(DI.adsRepository)
		private adsRepository: AdsRepository,

		private userEntityService: UserEntityService,
		private metaService: MetaService,
		private instanceActorService: InstanceActorService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const instance = await this.metaService.fetch(true);

			const ads = await this.adsRepository.createQueryBuilder('ads')
				.where('ads.expiresAt > :now', { now: new Date() })
				.andWhere('ads.startsAt <= :now', { now: new Date() })
				.andWhere(new Brackets(qb => {
					// 曜日のビットフラグを確認する
					qb.where('ads.dayOfWeek & :dayOfWeek > 0', { dayOfWeek: 1 << new Date().getDay() })
						.orWhere('ads.dayOfWeek = 0');
				}))
				.getMany();

			const response: any = {
				maintainerName: instance.maintainerName,
				maintainerEmail: instance.maintainerEmail,

				version: this.config.version,
				providesTarball: this.config.publishTarballInsteadOfProvideRepositoryUrl,

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
				enableMcaptcha: instance.enableMcaptcha,
				mcaptchaSiteKey: instance.mcaptchaSitekey,
				mcaptchaInstanceUrl: instance.mcaptchaInstanceUrl,
				enableRecaptcha: instance.enableRecaptcha,
				recaptchaSiteKey: instance.recaptchaSiteKey,
				enableTurnstile: instance.enableTurnstile,
				turnstileSiteKey: instance.turnstileSiteKey,
				swPublickey: instance.swPublicKey,
				themeColor: instance.themeColor,
				mascotImageUrl: instance.mascotImageUrl,
				bannerUrl: instance.bannerUrl,
				infoImageUrl: instance.infoImageUrl,
				serverErrorImageUrl: instance.serverErrorImageUrl,
				notFoundImageUrl: instance.notFoundImageUrl,
				iconUrl: instance.iconUrl,
				backgroundImageUrl: instance.backgroundImageUrl,
				logoImageUrl: instance.logoImageUrl,
				maxNoteTextLength: MAX_NOTE_TEXT_LENGTH,
				// クライアントの手間を減らすためあらかじめJSONに変換しておく
				defaultLightTheme: instance.defaultLightTheme ? JSON.stringify(JSON5.parse(instance.defaultLightTheme)) : null,
				defaultDarkTheme: instance.defaultDarkTheme ? JSON.stringify(JSON5.parse(instance.defaultDarkTheme)) : null,
				ads: ads.map(ad => ({
					id: ad.id,
					url: ad.url,
					place: ad.place,
					ratio: ad.ratio,
					imageUrl: ad.imageUrl,
					dayOfWeek: ad.dayOfWeek,
				})),
				notesPerOneAd: instance.notesPerOneAd,
				enableEmail: instance.enableEmail,
				enableServiceWorker: instance.enableServiceWorker,

				translatorAvailable: instance.deeplAuthKey != null,

				serverRules: instance.serverRules,

				policies: { ...DEFAULT_POLICIES, ...instance.policies },

				mediaProxy: this.config.mediaProxy,

				...(ps.detail ? {
					cacheRemoteFiles: instance.cacheRemoteFiles,
					cacheRemoteSensitiveFiles: instance.cacheRemoteSensitiveFiles,
					requireSetup: !await this.instanceActorService.realLocalUsersPresent(),
				} : {}),
			};

			if (ps.detail) {
				const proxyAccount = instance.proxyAccountId ? await this.userEntityService.pack(instance.proxyAccountId).catch(() => null) : null;

				response.proxyAccountName = proxyAccount ? proxyAccount.username : null;
				response.features = {
					registration: !instance.disableRegistration,
					emailRequiredForSignup: instance.emailRequiredForSignup,
					hcaptcha: instance.enableHcaptcha,
					recaptcha: instance.enableRecaptcha,
					turnstile: instance.enableTurnstile,
					objectStorage: instance.useObjectStorage,
					serviceWorker: instance.enableServiceWorker,
					miauth: true,
				};
			}

			return response;
		});
	}
}
