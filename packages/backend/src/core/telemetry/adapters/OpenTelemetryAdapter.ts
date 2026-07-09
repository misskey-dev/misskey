/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as os from 'node:os';
import cluster from 'node:cluster';
import { envOption } from '@/env.js';
import { registerDiagLogger } from '@/core/telemetry/telemetry-diag.js';
import type { Span, SpanStatusCode, Tracer } from '@opentelemetry/api';
import type { Resource, ResourceDetector } from '@opentelemetry/resources';
import type { ParentBasedSampler, Sampler } from '@opentelemetry/sdk-trace-base';
import type { OtelBackendRuntimeConfig, TelemetryAdapter, TelemetryCaptureMessageOptions } from './TelemetryAdapter.js';

const DEFAULT_SHUTDOWN_TIMEOUT = 5000;

type OpenTelemetryAdapterDeps = {
	tracer: Pick<Tracer, 'startActiveSpan'>;
	provider: {
		shutdown(): Promise<void>;
	};
	getActiveSpan: () => Span | undefined;
	spanStatusCodeError: SpanStatusCode;
	shutdownTimeout: number;
};

type CreateSamplerDeps = {
	ParentBasedSampler: new (config: { root: Sampler }) => ParentBasedSampler;
	TraceIdRatioBasedSampler: new (sampleRate: number) => Sampler;
};

type CreateResourceDeps = {
	defaultResource: () => Resource;
	resourceFromAttributes: (attributes: Record<string, string>) => Resource;
	detectResources: (config: { detectors: ResourceDetector[] }) => Resource;
	envDetector: ResourceDetector;
	serviceNameAttribute: string;
	serviceInstanceIdAttribute: string;
	serviceVersionAttribute: string;
	serviceVersion: string;
};

export class OpenTelemetryAdapter implements TelemetryAdapter {
	public constructor(
		private readonly deps: OpenTelemetryAdapterDeps,
	) {
	}

	public static async create(config: OtelBackendRuntimeConfig): Promise<OpenTelemetryAdapter> {
		const [
			{ diag, DiagLogLevel, SpanStatusCode, trace },
			{ W3CTraceContextPropagator },
			{ OTLPTraceExporter },
			{ defaultResource, detectResources, envDetector, resourceFromAttributes },
			{ BatchSpanProcessor, ParentBasedSampler, TraceIdRatioBasedSampler },
			{ NodeTracerProvider },
			{ ATTR_SERVICE_INSTANCE_ID, ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION },
		] = await Promise.all([
			import('@opentelemetry/api'),
			import('@opentelemetry/core'),
			import('@opentelemetry/exporter-trace-otlp-proto'),
			import('@opentelemetry/resources'),
			import('@opentelemetry/sdk-trace-base'),
			import('@opentelemetry/sdk-trace-node'),
			import('@opentelemetry/semantic-conventions'),
		]);

		// OTel SDK内部のexport失敗は既定だと見えにくいため、Misskeyのloggerへ橋渡しする。
		registerDiagLogger(diag, DiagLogLevel.WARN);

		// endpoint/headersを未指定にしておくと、OTEL_EXPORTER_OTLP_* 環境変数の標準fallbackが効く。
		const exporter = new OTLPTraceExporter({
			...(config.endpoint != null ? { url: config.endpoint } : {}),
			...(config.headers != null ? { headers: config.headers } : {}),
		});
		const spanProcessor = new BatchSpanProcessor(exporter);

		// SDK 2.xではSpanProcessorをprovider生成時に渡す。ここでOTel単体用のproviderを作る。
		const provider = new NodeTracerProvider({
			resource: createResource(config, {
				defaultResource,
				resourceFromAttributes,
				detectResources,
				envDetector,
				serviceNameAttribute: ATTR_SERVICE_NAME,
				serviceInstanceIdAttribute: ATTR_SERVICE_INSTANCE_ID,
				serviceVersionAttribute: ATTR_SERVICE_VERSION,
				serviceVersion: config.serviceVersion,
			}),
			...(config.sampleRate != null ? { sampler: createSampler(config.sampleRate, {
				ParentBasedSampler,
				TraceIdRatioBasedSampler,
			}) } : {}),
			spanProcessors: [spanProcessor],
		});

		// HTTP送信には注入しないが、将来のQueue連結でpropagation APIを使える状態にする。
		provider.register({
			propagator: new W3CTraceContextPropagator(),
		});

		// provider操作をdepsに閉じ込め、span wrapper本体をユニットテストしやすくする。
		return new OpenTelemetryAdapter({
			tracer: provider.getTracer('misskey-backend'),
			provider,
			getActiveSpan: () => trace.getActiveSpan(),
			spanStatusCodeError: SpanStatusCode.ERROR,
			shutdownTimeout: DEFAULT_SHUTDOWN_TIMEOUT,
		});
	}

	public captureMessage(message: string, _opts: TelemetryCaptureMessageOptions): void {
		// captureMessageは例外通知APIなので、OTelでは対象spanにエラー状態を付ける。
		// アクティブspanが無い場合(例: BullMQのjob処理が既に完了しspanが閉じた後の'failed'イベント)でも
		// 通知を握り潰さないよう、報告専用の短命spanを作ってそこに記録する。
		const span = this.deps.getActiveSpan();
		if (span != null) {
			recordError(span, new Error(message), this.deps.spanStatusCodeError);
			return;
		}

		this.deps.tracer.startActiveSpan('captureMessage', reportSpan => {
			recordError(reportSpan, new Error(message), this.deps.spanStatusCodeError);
			reportSpan.end();
		});
	}

	public startSpan<T>(name: string, fn: () => T): T {
		// 既存のTelemetryAdapter契約に合わせ、同期/非同期どちらでも同じspan lifetimeを保証する。
		return this.deps.tracer.startActiveSpan(name, span => {
			try {
				const result = fn();
				if (isPromiseLike(result)) {
					// Promiseの場合は完了/失敗までspanを開いたままにし、失敗時はerror statusへ変換する。
					return result.then(
						value => {
							span.end();
							return value;
						},
						error => {
							recordError(span, error, this.deps.spanStatusCodeError);
							span.end();
							throw error;
						},
					) as T;
				}

				// 同期成功はここでspanを閉じる。例外はcatch側で記録してから再throwする。
				span.end();
				return result;
			} catch (error) {
				recordError(span, error, this.deps.spanStatusCodeError);
				span.end();
				throw error;
			}
		});
	}

	public async shutdown(): Promise<void> {
		// BatchSpanProcessorのflushが詰まってもプロセス終了を妨げないよう、上限時間を設ける。
		// タイムアウト側のtimerは、flushが先に終わった場合にイベントループを無駄に引き留めないようclearする。
		let timer: NodeJS.Timeout | undefined;
		await Promise.race([
			this.deps.provider.shutdown(),
			new Promise<void>(resolve => {
				timer = setTimeout(resolve, this.deps.shutdownTimeout);
			}),
		]).finally(() => {
			if (timer != null) clearTimeout(timer);
		});
	}
}

export function createResource(config: OtelBackendRuntimeConfig, deps: CreateResourceDeps): Resource {
	// resourceを明示指定するとSDKのdefaultResource()は自動付与されなくなる(マージではなく上書き)ため、
	// telemetry.sdk.*等の標準属性を失わないよう明示的にmergeする。
	const misskeyDefaultResource = deps.resourceFromAttributes({
		[deps.serviceNameAttribute]: 'misskey-backend',
		[deps.serviceInstanceIdAttribute]: `${os.hostname()}:${process.pid}`,
		[deps.serviceVersionAttribute]: deps.serviceVersion,
		'misskey.process.role': getMisskeyProcessRole(),
	});

	// OTel標準の OTEL_SERVICE_NAME / OTEL_RESOURCE_ATTRIBUTES を尊重する。
	// mergeは右辺が優先されるため、config.resourceAttributesを最優先にする。
	return deps.defaultResource()
		.merge(misskeyDefaultResource)
		.merge(deps.detectResources({ detectors: [deps.envDetector] }))
		.merge(deps.resourceFromAttributes(config.resourceAttributes ?? {}));
}

export function createSampler(sampleRate: number, deps: CreateSamplerDeps): ParentBasedSampler {
	// 設定ミスを無言でAlwaysOn/AlwaysOffに倒さず、起動時に明確に失敗させる。
	// (YAMLでクォートされた数値文字列などnumber型の保証が無い値が来てもここで弾く)
	if (typeof sampleRate !== 'number' || !Number.isFinite(sampleRate) || sampleRate < 0 || sampleRate > 1) {
		throw new Error('otelForBackend.sampleRate must be a number between 0.0 and 1.0.');
	}

	return new deps.ParentBasedSampler({
		root: new deps.TraceIdRatioBasedSampler(sampleRate),
	});
}

function recordError(span: Span, error: unknown, spanStatusCodeError: SpanStatusCode): void {
	// throw値がError以外でもOTel exporterへ渡せる例外表現に正規化する。
	const exception = error instanceof Error ? error : new Error(String(error));
	span.recordException(exception);
	span.setStatus({
		code: spanStatusCodeError,
		message: exception.message,
	});
}

function isPromiseLike<T>(value: T): value is T & PromiseLike<Awaited<T>> {
	return value != null && typeof (value as { then?: unknown }).then === 'function';
}

export function getMisskeyProcessRole(): string {
	// Trace backend上でserver/queue/workerを見分けられるよう、Misskey固有の役割をresourceに載せる。
	if (envOption.disableClustering) {
		if (envOption.onlyServer) return 'primary-server';
		if (envOption.onlyQueue) return 'primary-queue';
		return 'primary-server+queue';
	}

	if (cluster.isPrimary) {
		if (envOption.onlyServer) return 'fork-only';
		if (envOption.onlyQueue) return 'primary-queue';
		return 'primary-server';
	}

	// worker.tsのworkerMainに合わせる: onlyServerならserver()、それ以外はjobQueue()を実行する。
	if (envOption.onlyServer) return 'worker-server';
	return 'worker-queue';
}
