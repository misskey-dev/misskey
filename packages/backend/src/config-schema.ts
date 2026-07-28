/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';
import ipaddr from 'ipaddr.js';
import type * as Sentry from '@sentry/node';
import type * as SentryVue from '@sentry/vue';
import type { RedisOptions } from 'ioredis';

const unknownPropertyMessage = 'Unknown configuration property';
const invalidUrlMessage = 'Must be a valid URL';

export type ConfigValidationMode = 'strict' | 'legacy';

const legacyConfigWarning =
	'Configuration validation is disabled because configValidation is set to legacy. ' +
	'Run "pnpm --filter backend validate-config" to validate this configuration.';

const PortSchema = v.pipe(
	v.number(),
	v.safeInteger('Must be an integer'),
	v.minValue(0, 'Must be between 0 and 65535'),
	v.maxValue(65535, 'Must be between 0 and 65535'),
);

const PositiveIntegerSchema = v.pipe(
	v.number(),
	v.safeInteger('Must be an integer'),
	v.minValue(1, 'Must be a positive integer'),
);

const NonNegativeIntegerSchema = v.pipe(
	v.number(),
	v.safeInteger('Must be an integer'),
	v.minValue(0, 'Must be a non-negative integer'),
);

const PlainObjectSchema = v.pipe(
	v.unknown(),
	v.check(
		input => {
			if (typeof input !== 'object' || input === null || Array.isArray(input)) return false;
			const prototype = Object.getPrototypeOf(input);
			return prototype === Object.prototype || prototype === null;
		},
		'Must be an object',
	),
);

function strictConfigObject<const TEntries extends v.ObjectEntries>(entries: TEntries) {
	return v.pipe(PlainObjectSchema, v.strictObject(entries));
}

function looseConfigObject<const TEntries extends v.ObjectEntries>(entries: TEntries) {
	return v.pipe(PlainObjectSchema, v.looseObject(entries));
}

const UrlSchema = v.pipe(v.string(), v.url(invalidUrlMessage));

const CidrSchema = v.pipe(
	v.string(),
	v.check(value => {
		try {
			ipaddr.parseCIDR(value);
			return true;
		} catch {
			return false;
		}
	}, 'Must be a valid CIDR'),
);

const LogLevelSettingSchema = v.picklist(
	['debug', 'info', 'warn', 'error', 'fatal', 'off'],
	'Must be one of debug, info, warn, error, fatal, or off',
);

const AccessLogConfigurationSchema = strictConfigObject({
	statusClasses: v.optional(v.array(v.picklist(
		['2xx', '3xx', '4xx', '5xx'],
		'Must be one of 2xx, 3xx, 4xx, or 5xx',
	))),
	bodies: v.optional(strictConfigObject({
		request: v.optional(v.boolean()),
		response: v.optional(v.boolean()),
		maxBytes: v.optional(v.pipe(
			PositiveIntegerSchema,
			v.maxValue(128 * 1024, 'Must be no greater than 131072'),
		)),
	})),
});

const LoggingConfigSchema = strictConfigObject({
	format: v.optional(v.picklist(
		['pretty', 'json'],
		'Must be either pretty or json',
	)),
	level: v.optional(LogLevelSettingSchema),
	domains: v.optional(v.nullable(v.pipe(
		v.record(v.string(), LogLevelSettingSchema),
		v.check(
			domains => Object.keys(domains).every(domain =>
				domain.length > 0 &&
				domain.trim() === domain &&
				domain.split('.').every(segment => segment.length > 0)),
			'Domain names must not be empty, padded, or contain empty segments',
		),
	))),
	access: v.optional(AccessLogConfigurationSchema),
	sql: v.optional(strictConfigObject({
		disableQueryTruncation: v.optional(v.boolean()),
		enableQueryParamLogging: v.optional(v.boolean()),
	})),
});

const DatabaseSchema = strictConfigObject({
	host: v.string(),
	port: PortSchema,
	db: v.optional(v.string()),
	user: v.optional(v.string()),
	pass: v.optional(v.string()),
	disableCache: v.optional(v.boolean()),
	extra: v.optional(v.record(v.string(), v.unknown())),
});

const DatabaseSlaveSchema = strictConfigObject({
	host: v.string(),
	port: PortSchema,
	db: v.string(),
	user: v.string(),
	pass: v.string(),
});

// Redisが管理するオプションは更新で増える可能性があるため、Misskey固有の項目だけ検証して未知キーを保持する。
export type RedisOptionsSource = Partial<RedisOptions> & {
	host: string;
	port: number;
	family?: 0 | 4 | 6;
	pass?: string;
	db?: number;
	prefix?: string;
};

const RedisOptionsSourceSchema = looseConfigObject({
	host: v.string(),
	port: PortSchema,
	family: v.optional(v.picklist([0, 4, 6], 'Must be one of 0, 4, or 6')),
	pass: v.optional(v.string()),
	db: v.optional(NonNegativeIntegerSchema),
	prefix: v.optional(v.string()),
}) as v.GenericSchema<unknown, RedisOptionsSource>;

const FulltextSearchSchema = strictConfigObject({
	provider: v.optional(v.picklist(
		['sqlLike', 'sqlPgroonga', 'meilisearch'],
		'Must be one of sqlLike, sqlPgroonga, or meilisearch',
	)),
});

// Meilisearchクライアントへは文字列で渡すため、YAMLで数値として記述されたポートもここで正規化する。
const MeilisearchPortSchema = v.pipe(
	v.union([
		PortSchema,
		v.pipe(
			v.string(),
			v.check(value => {
				const number = Number(value);
				return Number.isSafeInteger(number) && number >= 0 && number <= 65535;
			}, 'Must be an integer between 0 and 65535'),
		),
	], 'Must be an integer between 0 and 65535'),
	v.transform(String),
);

const MeilisearchSchema = strictConfigObject({
	host: v.string(),
	port: MeilisearchPortSchema,
	apiKey: v.string(),
	ssl: v.optional(v.boolean()),
	index: v.string(),
	scope: v.optional(v.union([
		v.picklist(['local', 'global'], 'Must be either local or global'),
		v.array(v.string()),
	])),
});

export type SentryBackendConfig = {
	options: Partial<Sentry.NodeOptions>;
	enableNodeProfiling: boolean;
	disabledIntegrations?: string[];
};

// Sentryが管理するoptionsとintegration設定は、SDK更新との互換性を保つため未知キーを許可する。
const SentryNodeOptionsSchema =
	looseConfigObject({}) as v.GenericSchema<unknown, Partial<Sentry.NodeOptions>>;

const SentryBackendConfigSchema = strictConfigObject({
	options: SentryNodeOptionsSchema,
	enableNodeProfiling: v.boolean(),
	disabledIntegrations: v.optional(v.array(v.string())),
});

export type SentryFrontendConfig = {
	options: Partial<SentryVue.BrowserOptions> & { dsn: string };
	vueIntegration?: SentryVue.VueIntegrationOptions | null;
	browserTracingIntegration?: Parameters<typeof SentryVue.browserTracingIntegration>[0] | null;
	replayIntegration?: Parameters<typeof SentryVue.replayIntegration>[0] | null;
};

const SentryBrowserOptionsSchema = looseConfigObject({
	dsn: v.string(),
}) as v.GenericSchema<unknown, SentryFrontendConfig['options']>;

const SentryVueIntegrationOptionsSchema =
	looseConfigObject({}) as v.GenericSchema<unknown, SentryVue.VueIntegrationOptions>;

const SentryBrowserTracingOptionsSchema =
	looseConfigObject({}) as v.GenericSchema<unknown, NonNullable<SentryFrontendConfig['browserTracingIntegration']>>;

const SentryReplayOptionsSchema =
	looseConfigObject({}) as v.GenericSchema<unknown, NonNullable<SentryFrontendConfig['replayIntegration']>>;

const SentryFrontendConfigSchema = strictConfigObject({
	options: SentryBrowserOptionsSchema,
	vueIntegration: v.optional(v.nullable(SentryVueIntegrationOptionsSchema)),
	browserTracingIntegration: v.optional(v.nullable(SentryBrowserTracingOptionsSchema)),
	replayIntegration: v.optional(v.nullable(SentryReplayOptionsSchema)),
});

const OtelBackendConfigSchema = strictConfigObject({
	endpoint: v.optional(UrlSchema),
	headers: v.optional(v.record(v.string(), v.string())),
	sampleRate: v.optional(v.pipe(
		v.number(),
		v.minValue(0, 'Must be between 0 and 1'),
		v.maxValue(1, 'Must be between 0 and 1'),
	)),
	capturePgSpans: v.optional(v.boolean()),
	capturePgStatement: v.optional(v.boolean()),
	capturePgConnectionSpans: v.optional(v.boolean()),
	captureRedisCommandSpans: v.optional(v.boolean()),
	captureRedisConnectionSpans: v.optional(v.boolean()),
	captureRedisRootSpans: v.optional(v.boolean()),
	resourceAttributes: v.optional(v.record(v.string(), v.string())),
	propagateTraceToRemote: v.optional(v.boolean()),
	jobTraceContextMode: v.optional(v.picklist(
		['link', 'parent'],
		'Must be either link or parent',
	)),
});

const TrustProxySchema = v.union([
	v.boolean(),
	v.string(),
	v.array(v.string()),
	NonNegativeIntegerSchema,
], 'Must be a boolean, string, string array, or non-negative integer');

const ConfigSourceWithMetadataSchema = strictConfigObject({
	_NOTE_: v.optional(v.string()),
	configValidation: v.optional(v.picklist(
		['strict', 'legacy'],
		'Must be either strict or legacy',
	)),
	url: v.optional(UrlSchema),
	port: v.optional(PortSchema),
	socket: v.optional(v.string()),
	trustProxy: v.optional(TrustProxySchema),
	chmodSocket: v.optional(v.pipe(
		v.string(),
		v.regex(/^[0-7]{3,4}$/, 'Must be a three or four digit octal mode'),
	)),
	enableIpRateLimit: v.optional(v.boolean()),
	disableHsts: v.optional(v.boolean()),
	db: DatabaseSchema,
	dbReplications: v.optional(v.boolean()),
	dbSlaves: v.optional(v.array(DatabaseSlaveSchema)),
	redis: RedisOptionsSourceSchema,
	redisForPubsub: v.optional(RedisOptionsSourceSchema),
	redisForJobQueue: v.optional(RedisOptionsSourceSchema),
	redisForTimelines: v.optional(RedisOptionsSourceSchema),
	redisForReactions: v.optional(RedisOptionsSourceSchema),
	fulltextSearch: v.optional(FulltextSearchSchema),
	meilisearch: v.optional(MeilisearchSchema),
	sentryForBackend: v.optional(SentryBackendConfigSchema),
	otelForBackend: v.optional(OtelBackendConfigSchema),
	sentryForFrontend: v.optional(SentryFrontendConfigSchema),
	publishTarballInsteadOfProvideRepositoryUrl: v.optional(v.boolean()),
	setupPassword: v.optional(v.string()),
	proxy: v.optional(UrlSchema),
	proxySmtp: v.optional(UrlSchema),
	proxyBypassHosts: v.optional(v.array(v.string())),
	allowedPrivateNetworks: v.optional(v.array(CidrSchema)),
	maxFileSize: v.optional(PositiveIntegerSchema),
	clusterLimit: v.optional(PositiveIntegerSchema),
	threadPoolSize: v.optional(PositiveIntegerSchema),
	id: v.pipe(
		v.string(),
		v.transform(value => value.toLowerCase()),
		v.picklist(
			['aid', 'aidx', 'meid', 'meidg', 'ulid', 'objectid'],
			'Must be one of aid, aidx, meid, meidg, ulid, or objectid',
		),
	),
	outgoingAddress: v.optional(v.string()),
	outgoingAddressFamily: v.optional(v.picklist(
		['ipv4', 'ipv6', 'dual'],
		'Must be one of ipv4, ipv6, or dual',
	)),
	deliverJobConcurrency: v.optional(PositiveIntegerSchema),
	inboxJobConcurrency: v.optional(PositiveIntegerSchema),
	relationshipJobConcurrency: v.optional(PositiveIntegerSchema),
	deliverJobPerSec: v.optional(PositiveIntegerSchema),
	inboxJobPerSec: v.optional(PositiveIntegerSchema),
	relationshipJobPerSec: v.optional(PositiveIntegerSchema),
	deliverJobMaxAttempts: v.optional(PositiveIntegerSchema),
	inboxJobMaxAttempts: v.optional(PositiveIntegerSchema),
	mediaProxy: v.optional(UrlSchema),
	videoThumbnailGenerator: v.optional(UrlSchema),
	perChannelMaxNoteCacheCount: v.optional(NonNegativeIntegerSchema),
	perUserNotificationsMaxCount: v.optional(NonNegativeIntegerSchema),
	deactivateAntennaThreshold: v.optional(NonNegativeIntegerSchema),
	pidFile: v.optional(v.string()),
	logging: v.optional(LoggingConfigSchema),
});

export const ConfigSourceSchema = v.pipe(
	ConfigSourceWithMetadataSchema,
	// 有効化された機能が参照する関連設定も、起動前に揃っていることを保証する。
	v.forward(
		v.check(
			config => config.dbReplications !== true || (config.dbSlaves?.length ?? 0) > 0,
			'dbSlaves must contain at least one replica when dbReplications is enabled',
		),
		['dbSlaves'],
	),
	v.forward(
		v.check(
			config => config.fulltextSearch?.provider !== 'meilisearch' || config.meilisearch != null,
			'meilisearch must be configured when fulltextSearch.provider is meilisearch',
		),
		['meilisearch'],
	),
	v.transform(({ _NOTE_: _, configValidation: __, ...source }) => source),
);

export type ConfigSource = v.InferOutput<typeof ConfigSourceSchema>;
export type FulltextSearchProvider = NonNullable<NonNullable<ConfigSource['fulltextSearch']>['provider']>;
export type OtelBackendConfig = NonNullable<ConfigSource['otelForBackend']>;

export type ParseConfigSourceOptions = {
	forceValidation?: boolean;
	onWarning?: (message: string) => void;
};

export function getConfigValidationMode(input: unknown): ConfigValidationMode {
	if (
		typeof input === 'object' &&
		input !== null &&
		'configValidation' in input &&
		input.configValidation === 'legacy'
	) {
		return 'legacy';
	}

	return 'strict';
}

export function parseConfigSource(input: unknown, options: ParseConfigSourceOptions = {}): ConfigSource {
	if (!options.forceValidation && getConfigValidationMode(input) === 'legacy') {
		// legacyは旧バージョンと同じ無検証動作を維持し、呼び出し側へ警告だけを通知する。
		options.onWarning?.(legacyConfigWarning);

		const { _NOTE_: _, configValidation: __, ...source } = input as Record<string, unknown>;
		return source as ConfigSource;
	}

	const result = v.safeParse(ConfigSourceSchema, input);
	if (result.success) return result.output;

	const issues = result.issues.map(issue => {
		const path = v.getDotPath(issue) ?? '<root>';
		const message = issue.type === 'strict_object' && issue.expected === 'never'
			? unknownPropertyMessage
			: issue.message;
		return `- ${path}: ${message}`;
	});
	throw new Error(`Invalid configuration:\n${issues.join('\n')}`);
}
