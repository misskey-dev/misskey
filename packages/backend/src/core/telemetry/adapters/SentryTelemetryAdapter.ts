/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import Logger from '@/logger.js';
import type { LogTraceContext } from '@/logging/types.js';
import type * as SentryNode from '@sentry/node';
import type { NodeOptions } from '@sentry/node';
import type { OtelBackendRuntimeConfig, OtlpExportTarget, SentryBackendConfig, TelemetryAdapter, TelemetryCaptureMessageOptions } from './TelemetryAdapter.js';

// OpenTelemetryAdapterのDEFAULT_SHUTDOWN_TIMEOUTと揃え、Sentryのtransportが詰まってもプロセス終了を妨げないようにする。
const DEFAULT_SHUTDOWN_TIMEOUT = 5000;
const logger = new Logger('telemetry', 'green');

type SentryIntegrationsOption = NonNullable<NodeOptions['integrations']>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SentryIntegrationFactory = Extract<SentryIntegrationsOption, (integrations: any[]) => any[]>;
type SentryIntegration = Parameters<SentryIntegrationFactory>[0][number];
type SentryNodeOptions = NodeOptions;
type SentryDataCollection = NonNullable<NodeOptions['dataCollection']>;

/** 中継元のアドレスや利用者を特定できるHTTPヘッダー名の断片 */
const PEER_IDENTIFYING_HEADER_SNIPPETS = ['forwarded', '-ip', 'remote-', 'via', '-user'];

/**
 * Misskeyが既定で適用する収集範囲
 *
 * Sentry v11 は `dataCollection` 未指定だと全て収集するため、利用者の情報が意図せず送信されないよう既定を絞る
 * 緩める場合は設定ファイルの `dataCollection` で明示する
 */
export const DEFAULT_SENTRY_DATA_COLLECTION: SentryDataCollection = {
	// IPやユーザーIDの自動付与はしない。調査に必要な識別子はTelemetryService側で明示的に渡す
	userInfo: false,
	// backendは認証にCookieを使わないため、収集しても調査の役に立たない
	cookies: false,
	// GETのAPI呼び出しはアクセストークンを`i`クエリパラメータでも受け取るため落とす
	urlQueryParams: false,
	httpHeaders: {
		request: { deny: PEER_IDENTIFYING_HEADER_SNIPPETS },
		response: { deny: PEER_IDENTIFYING_HEADER_SNIPPETS },
	},
	// リクエスト・レスポンス本文はノートやチャットの内容を含む
	httpBodies: [],
	// クエリのバインド値や書き込みペイロードは利用者の投稿内容を含む
	databaseQueryData: false,
	genAI: { inputs: false, outputs: false },
};

type BuildSentryIntegrationsOptions = {
	disabledIntegrations?: string[];
	enableNodeProfiling: boolean;
	nodeProfilingIntegration?: () => SentryIntegration;
	warn?: (message: string) => void;
};

export function buildSentryIntegrations(options: BuildSentryIntegrationsOptions): SentryIntegrationFactory {
	return (defaults) => {
		const disabledIntegrations = new Set(options.disabledIntegrations ?? []);
		const defaultIntegrationNames = new Set(defaults.map((integration) => integration.name));
		const unknownIntegrations = [...disabledIntegrations].filter((name) => !defaultIntegrationNames.has(name));

		if (unknownIntegrations.length > 0) {
			(options.warn ?? console.warn)(`Unknown Sentry integration configured in sentryForBackend.disabledIntegrations: ${unknownIntegrations.join(', ')}`);
		}

		return [
			...defaults.filter((integration) => !disabledIntegrations.has(integration.name)),
			...(options.enableNodeProfiling && options.nodeProfilingIntegration != null ? [options.nodeProfilingIntegration()] : []),
		];
	};
}

export function buildSentryNodeOptions(
	config: SentryBackendConfig,
	nodeProfilingIntegration?: () => SentryIntegration,
	warn?: (message: string) => void,
): SentryNodeOptions {
	if ('sendDefaultPii' in config.options) {
		(warn ?? console.warn)('sentryForBackend.options.sendDefaultPii was removed in Sentry SDK v11 and is ignored. Use sentryForBackend.options.dataCollection instead (`dataCollection: {}` collects everything, as `sendDefaultPii: true` did).');
	}

	return {
		// Do not send Sentry trace headers to remote ActivityPub/Webhook/etc. hosts by default.
		// Admins can opt in for trusted internal services via sentryForBackend.options.
		tracePropagationTargets: [],

		// Performance Monitoring
		tracesSampleRate: 1.0, //  Capture 100% of the transactions

		// Profile every sampled trace (session-based profiling; relative to tracesSampleRate)
		profileSessionSampleRate: 1.0,
		profileLifecycle: 'trace',

		maxBreadcrumbs: 0,

		dataCollection: DEFAULT_SENTRY_DATA_COLLECTION,

		...config.options,

		integrations: buildSentryIntegrations({
			disabledIntegrations: config.disabledIntegrations,
			enableNodeProfiling: config.enableNodeProfiling,
			nodeProfilingIntegration,
			warn,
		}),
	};
}

type BuildSentryOpenTelemetryLinkedInitOptions = {
	sentryConfig: SentryBackendConfig;
	otelConfig: OtelBackendRuntimeConfig;
	openTelemetryIntegration: () => SentryIntegration;
	warn?: (message: string) => void;
};

/**
 * otelForBackend併用時のSentry.initオプションを組み立てる。
 *
 * Sentry SDK v11はOTel SDKのproviderを持たなくなったため、tracingはMisskeyのOTel providerに一本化する。
 * Sentry側はtracingを無効にしたうえでopenTelemetryIntegrationを入れ、エラー等をactiveなOTel spanへ紐付けるだけにする。
 * Sentryへのspan送信はOTel provider側からSentryのOTLP endpointへ行う(getSentryOtlpExportTarget)。
 */
export function buildSentryOpenTelemetryLinkedInitOptions(options: BuildSentryOpenTelemetryLinkedInitOptions): SentryNodeOptions {
	const warn = options.warn ?? ((message: string) => logger.warn(message));
	const { tracePropagationTargets, tracesSampleRate, tracesSampler, ...sentryOptions } = options.sentryConfig.options;
	// remoteへtrace headerを漏らさないデフォルトはSentry単体時と揃える。
	// propagateTraceToRemote: true か、options.tracePropagationTargets の明示指定がある場合のみ既定を上書きする。
	const propagateTraceToRemote = options.otelConfig.propagateTraceToRemote === true || tracePropagationTargets != null;

	if (tracesSampleRate != null || tracesSampler != null) {
		warn('sentryForBackend.options.tracesSampleRate / tracesSampler are ignored when otelForBackend is also configured; spans are sampled by OpenTelemetry, so configure otelForBackend.sampleRate instead.');
	}

	if (options.sentryConfig.enableNodeProfiling) {
		warn('sentryForBackend.enableNodeProfiling is ignored when otelForBackend is also configured, because trace-based profiling requires Sentry to own tracing.');
	}

	const nodeOptions = buildSentryNodeOptions({
		...options.sentryConfig,
		enableNodeProfiling: false,
		options: {
			...sentryOptions,
			...(propagateTraceToRemote ? { tracePropagationTargets } : {}),
		},
	}, undefined, warn);

	// tracesSampleRateを設定するとSentryが自前のspanを別traceとして発行し、OTelのspanと二重になるため未設定にする。
	delete nodeOptions.tracesSampleRate;
	delete nodeOptions.profileSessionSampleRate;
	delete nodeOptions.profileLifecycle;

	const integrations = nodeOptions.integrations as SentryIntegrationFactory;
	return {
		...nodeOptions,
		integrations: (defaults) => [
			...integrations(defaults),
			options.openTelemetryIntegration(),
		],
	};
}

/**
 * Sentry SDK v11がOTel provider側のspanを受け取る唯一の経路であるOTLP endpointの送信先を求める。
 * DSNが無い(Sentryが無効)か解釈できない場合はundefinedを返す。
 */
export function resolveSentryOtlpExportTarget(
	dsn: string | undefined,
	getOtlpTracesEndpoint: (dsn: string) => OtlpExportTarget | undefined,
	warn: (message: string) => void,
): OtlpExportTarget | undefined {
	if (dsn == null || dsn === '') return undefined;

	const target = getOtlpTracesEndpoint(dsn);
	if (target == null) {
		warn('Could not derive the Sentry OTLP traces endpoint from sentryForBackend.options.dsn; spans will be exported only to otelForBackend.');
	}
	return target;
}

export class SentryTelemetryAdapter implements TelemetryAdapter {
	private constructor(
		private readonly Sentry: typeof SentryNode,
		/** trueの場合、tracingはOTel adapterが所有し、Sentryはイベント通知だけを担う。 */
		private readonly linkedToOpenTelemetry = false,
	) {
	}

	public static async create(config: SentryBackendConfig, warn?: (message: string) => void): Promise<SentryTelemetryAdapter> {
		const Sentry = await import('@sentry/node');
		const { nodeProfilingIntegration } = await import('@sentry/profiling-node');

		Sentry.init(buildSentryNodeOptions(config, nodeProfilingIntegration, warn));

		return new SentryTelemetryAdapter(Sentry);
	}

	/** OTel provider へ追加する、Sentry の OTLP 送信先を返す。Sentry.init より前に OTel provider を作れるよう分けている。 */
	public static async getOtlpExportTarget(
		config: SentryBackendConfig,
		warn: (message: string) => void = message => logger.warn(message),
	): Promise<OtlpExportTarget | undefined> {
		const { getOtlpTracesEndpoint } = await import('@sentry/node');
		// Sentry.initと同様、dsn未指定時はSENTRY_DSN環境変数へfallbackする。
		return resolveSentryOtlpExportTarget(config.options.dsn ?? process.env.SENTRY_DSN, getOtlpTracesEndpoint, warn);
	}

	public static async createLinkedToOpenTelemetry(
		sentryConfig: SentryBackendConfig,
		otelConfig: OtelBackendRuntimeConfig,
		warn?: (message: string) => void,
	): Promise<SentryTelemetryAdapter> {
		const Sentry = await import('@sentry/node');

		Sentry.init(buildSentryOpenTelemetryLinkedInitOptions({
			sentryConfig,
			otelConfig,
			openTelemetryIntegration: Sentry.openTelemetryIntegration,
			warn,
		}));

		return new SentryTelemetryAdapter(Sentry, true);
	}

	public captureMessage(message: string, opts: TelemetryCaptureMessageOptions): void {
		this.Sentry.captureMessage(message, {
			level: opts.level,
			...(opts.userId != null ? { user: { id: opts.userId } } : {}),
			extra: opts.extra,
		});
	}

	/** activeなSpanの識別子を、Logging基盤で扱える形式へ変換します。 */
	public getActiveTraceContext(): LogTraceContext | undefined {
		// OTel併用時のtrace contextはOTel adapter側から取得する。
		if (this.linkedToOpenTelemetry) return undefined;

		const activeSpan = this.Sentry.getActiveSpan();
		if (activeSpan == null) return undefined;

		const { traceId, spanId, traceFlags } = activeSpan.spanContext();
		return { traceId, spanId, traceFlags };
	}

	public startSpan<T>(name: string, fn: () => T): T {
		// OTel併用時はOTel adapterがspanを作るため、ここで包むと非記録のSentry spanがOTel spanより優先されてしまう。
		if (this.linkedToOpenTelemetry) return fn();
		return this.Sentry.startSpan({ name }, fn);
	}

	public async shutdown(): Promise<void> {
		// timeout未指定だとtransportのflushが詰まった際にプロセス終了を妨げるため、上限時間を設ける。
		await this.Sentry.close(DEFAULT_SHUTDOWN_TIMEOUT);
	}
}
