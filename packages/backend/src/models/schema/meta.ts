/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';
import * as mi from '@/misc/schema/index.js';
import { packedRolePoliciesSchema } from '@/models/schema/role.js';

// NOTE: legacy 側は MetaLite → MetaDetailedOnly → MetaDetailed → MetaClientOptions の順で
// 宣言しているが、MetaLite が MetaClientOptions を参照するので (循環ではない) 先に宣言する。
export const packedMetaClientOptionsSchema = v.object({
	entrancePageStyle: v.picklist(['classic', 'simple']),
	showTimelineForVisitor: v.boolean(),
	showActivitiesForVisitor: v.boolean(),
});
mi.defineEntity('MetaClientOptions', packedMetaClientOptionsSchema);

export type PackedMetaClientOptions = v.InferOutput<typeof packedMetaClientOptionsSchema>;

export const packedMetaLiteSchema = v.object({
	maintainerName: v.nullable(v.string()),
	maintainerEmail: v.nullable(v.string()),
	version: v.string(),
	providesTarball: v.boolean(),
	name: v.nullable(v.string()),
	shortName: v.nullable(v.string()),
	uri: mi.example(mi.urlString(), 'https://misskey.example.com'),
	description: v.nullable(v.string()),
	langs: v.array(v.string()),
	tosUrl: v.nullable(v.string()),
	// NOTE: legacy 側は `optional: false` かつ `default` 付き (= required のまま default を出す)
	// なので `v.optional()` では包まず openApi() で default だけを出力する
	repositoryUrl: v.pipe(v.nullable(v.string()), mi.openApi({ default: 'https://github.com/misskey-dev/misskey' })),
	feedbackUrl: v.pipe(v.nullable(v.string()), mi.openApi({ default: 'https://github.com/misskey-dev/misskey/issues/new' })),
	defaultDarkTheme: v.nullable(v.string()),
	defaultLightTheme: v.nullable(v.string()),
	clientOptions: packedMetaClientOptionsSchema,
	disableRegistration: v.boolean(),
	emailRequiredForSignup: v.boolean(),
	enableHcaptcha: v.boolean(),
	hcaptchaSiteKey: v.nullable(v.string()),
	enableMcaptcha: v.boolean(),
	mcaptchaSiteKey: v.nullable(v.string()),
	mcaptchaInstanceUrl: v.nullable(v.string()),
	enableRecaptcha: v.boolean(),
	recaptchaSiteKey: v.nullable(v.string()),
	enableTurnstile: v.boolean(),
	turnstileSiteKey: v.nullable(v.string()),
	enableTestcaptcha: v.boolean(),
	googleAnalyticsMeasurementId: v.nullable(v.string()),
	swPublickey: v.nullable(v.string()),
	mascotImageUrl: v.pipe(v.string(), mi.openApi({ default: '/assets/ai.png' })),
	bannerUrl: v.nullable(v.string()),
	serverErrorImageUrl: v.nullable(v.string()),
	infoImageUrl: v.nullable(v.string()),
	notFoundImageUrl: v.nullable(v.string()),
	iconUrl: v.nullable(v.string()),
	maxNoteTextLength: v.number(),
	ads: v.array(v.object({
		id: mi.example(mi.idString(), 'xxxxxxxxxx'),
		url: mi.urlString(),
		place: v.string(),
		ratio: v.number(),
		imageUrl: mi.urlString(),
		dayOfWeek: mi.integer(),
		isSensitive: v.optional(v.boolean()),
	})),
	notesPerOneAd: v.pipe(v.number(), mi.openApi({ default: 0 })),
	enableEmail: v.boolean(),
	enableServiceWorker: v.boolean(),
	translatorAvailable: v.boolean(),
	sentryForFrontend: v.nullable(v.object({
		// legacy 側は properties と `additionalProperties: true` の併用なので、
		// v.object の出力に additionalProperties だけを openApi() で足す
		options: v.pipe(v.object({
			dsn: v.string(),
		}), mi.openApi({ additionalProperties: true })),
		vueIntegration: v.nullish(mi.anyRecord()),
		browserTracingIntegration: v.nullish(mi.anyRecord()),
		replayIntegration: v.nullish(mi.anyRecord()),
	})),
	mediaProxy: v.string(),
	enableUrlPreview: v.boolean(),
	backgroundImageUrl: v.nullable(v.string()),
	impressumUrl: v.nullable(v.string()),
	logoImageUrl: v.nullable(v.string()),
	privacyPolicyUrl: v.nullable(v.string()),
	inquiryUrl: v.nullable(v.string()),
	serverRules: v.array(v.string()),
	themeColor: v.nullable(v.string()),
	policies: packedRolePoliciesSchema,
	noteSearchableScope: v.pipe(v.picklist(['local', 'global']), mi.openApi({ default: 'local' })),
	maxFileSize: v.number(),
	federation: v.picklist(['all', 'specified', 'none']),
});
mi.defineEntity('MetaLite', packedMetaLiteSchema);

export type PackedMetaLite = v.InferOutput<typeof packedMetaLiteSchema>;

export const packedMetaDetailedOnlySchema = v.object({
	features: v.optional(v.object({
		registration: v.boolean(),
		emailRequiredForSignup: v.boolean(),
		localTimeline: v.boolean(),
		globalTimeline: v.boolean(),
		hcaptcha: v.boolean(),
		turnstile: v.boolean(),
		recaptcha: v.boolean(),
		objectStorage: v.boolean(),
		serviceWorker: v.boolean(),
		miauth: v.optional(v.boolean(), true),
	})),
	proxyAccountName: v.nullable(v.string()),
	requireSetup: mi.example(v.boolean(), false),
	cacheRemoteFiles: v.boolean(),
	cacheRemoteSensitiveFiles: v.boolean(),
});
mi.defineEntity('MetaDetailedOnly', packedMetaDetailedOnlySchema);

export type PackedMetaDetailedOnly = v.InferOutput<typeof packedMetaDetailedOnlySchema>;

export const packedMetaDetailedSchema = mi.composeEntity('MetaDetailed', [
	packedMetaLiteSchema,
	packedMetaDetailedOnlySchema,
]);

// NOTE: 合成 entity の公開型は素の交差型で書く (user.ts の同種の NOTE 参照)
export type PackedMetaDetailed = PackedMetaLite & PackedMetaDetailedOnly;
