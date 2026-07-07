/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as os from 'node:os';
import cluster from 'node:cluster';
import { diag, DiagLogLevel, SpanStatusCode, trace } from '@opentelemetry/api';
import { W3CTraceContextPropagator } from '@opentelemetry/core';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';
import { defaultResource, resourceFromAttributes } from '@opentelemetry/resources';
import { BatchSpanProcessor, ParentBasedSampler, TraceIdRatioBasedSampler } from '@opentelemetry/sdk-trace-base';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { ATTR_SERVICE_INSTANCE_ID, ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';
import type { Config } from '@/config.js';
import { envOption } from '@/env.js';
import Logger from '@/logger.js';
import type { DiagLogger, Span, Tracer } from '@opentelemetry/api';
import type { TelemetryAdapter, TelemetryCaptureMessageOptions } from './TelemetryAdapter.js';

const DEFAULT_SHUTDOWN_TIMEOUT = 5000;

type OpenTelemetryAdapterDeps = {
	tracer: Pick<Tracer, 'startActiveSpan'>;
	provider: {
		shutdown(): Promise<void>;
	};
	getActiveSpan: () => Span | undefined;
	shutdownTimeout: number;
};

export class OpenTelemetryAdapter implements TelemetryAdapter {
	public constructor(
		private readonly deps: OpenTelemetryAdapterDeps,
	) {
	}

	public static async create(config: NonNullable<Config['otelForBackend']>): Promise<OpenTelemetryAdapter> {
		// OTel SDK内部のexport失敗は既定だと見えにくいため、Misskeyのloggerへ橋渡しする。
		registerDiagLogger();

		// endpoint/headersを未指定にしておくと、OTEL_EXPORTER_OTLP_* 環境変数の標準fallbackが効く。
		const exporter = new OTLPTraceExporter({
			...(config.endpoint != null ? { url: config.endpoint } : {}),
			...(config.headers != null ? { headers: config.headers } : {}),
		});
		const spanProcessor = new BatchSpanProcessor(exporter);

		// SDK 2.xではSpanProcessorをprovider生成時に渡す。ここでOTel単体用のproviderを作る。
		// resourceを明示指定するとSDKのdefaultResource()は自動付与されなくなる(マージではなく上書き)ため、
		// telemetry.sdk.*等の標準属性を失わないよう明示的にmergeする。
		const provider = new NodeTracerProvider({
			resource: defaultResource().merge(resourceFromAttributes({
				[ATTR_SERVICE_NAME]: 'misskey-backend',
				[ATTR_SERVICE_INSTANCE_ID]: `${os.hostname()}:${process.pid}`,
				'misskey.process.role': getMisskeyProcessRole(),
				...(config.resourceAttributes ?? {}),
			})),
			...(config.sampleRate != null ? { sampler: createSampler(config.sampleRate) } : {}),
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
			shutdownTimeout: DEFAULT_SHUTDOWN_TIMEOUT,
		});
	}

	public captureMessage(message: string, _opts: TelemetryCaptureMessageOptions): void {
		// captureMessageは例外通知APIなので、OTelでは対象spanにエラー状態を付ける。
		// アクティブspanが無い場合(例: BullMQのjob処理が既に完了しspanが閉じた後の'failed'イベント)でも
		// 通知を握り潰さないよう、報告専用の短命spanを作ってそこに記録する。
		const span = this.deps.getActiveSpan();
		if (span != null) {
			recordError(span, new Error(message));
			return;
		}

		this.deps.tracer.startActiveSpan(`captureMessage: ${message}`, reportSpan => {
			recordError(reportSpan, new Error(message));
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
							recordError(span, error);
							span.end();
							throw error;
						},
					) as T;
				}

				// 同期成功はここでspanを閉じる。例外はcatch側で記録してから再throwする。
				span.end();
				return result;
			} catch (error) {
				recordError(span, error);
				span.end();
				throw error;
			}
		});
	}

	public async shutdown(): Promise<void> {
		// BatchSpanProcessorのflushが詰まってもプロセス終了を妨げないよう、上限時間を設ける。
		// タイムアウト側のtimerは、flushが先に終わった場合にイベントループを無駄に引き留めないようclearする。
		let timer: NodeJS.Timeout;
		await Promise.race([
			this.deps.provider.shutdown(),
			new Promise<void>(resolve => {
				timer = setTimeout(resolve, this.deps.shutdownTimeout);
			}),
		]).finally(() => clearTimeout(timer));
	}
}

export function createSampler(sampleRate: number): ParentBasedSampler {
	// 設定ミスを無言でAlwaysOn/AlwaysOffに倒さず、起動時に明確に失敗させる。
	// (YAMLでクォートされた数値文字列などnumber型の保証が無い値が来てもここで弾く)
	if (typeof sampleRate !== 'number' || !Number.isFinite(sampleRate) || sampleRate < 0 || sampleRate > 1) {
		throw new Error('otelForBackend.sampleRate must be a number between 0.0 and 1.0.');
	}

	return new ParentBasedSampler({
		root: new TraceIdRatioBasedSampler(sampleRate),
	});
}

function recordError(span: Span, error: unknown): void {
	// throw値がError以外でもOTel exporterへ渡せる例外表現に正規化する。
	const exception = error instanceof Error ? error : new Error(String(error));
	span.recordException(exception);
	span.setStatus({
		code: SpanStatusCode.ERROR,
		message: exception.message,
	});
}

function isPromiseLike<T>(value: T): value is T & PromiseLike<Awaited<T>> {
	return value != null && typeof (value as { then?: unknown }).then === 'function';
}

function registerDiagLogger(): void {
	// diagはプロセスグローバルなので、通常運用で必要なWARN以上だけをMisskeyのログに流す。
	const logger = new Logger('otel', 'green');
	const diagLogger: DiagLogger = {
		error: (message, ...args) => logger.error(formatDiagMessage(message, args)),
		warn: (message, ...args) => logger.warn(formatDiagMessage(message, args)),
		info: (message, ...args) => logger.info(formatDiagMessage(message, args)),
		debug: (message, ...args) => logger.debug(formatDiagMessage(message, args)),
		verbose: (message, ...args) => logger.debug(formatDiagMessage(message, args)),
	};

	diag.setLogger(diagLogger, {
		logLevel: DiagLogLevel.WARN,
		suppressOverrideMessage: true,
	});
}

function formatDiagMessage(message: string, args: unknown[]): string {
	if (args.length === 0) return message;
	return `${message} ${args.map(arg => {
		if (arg instanceof Error) return arg.stack ?? arg.message;
		if (typeof arg === 'string') return arg;
		try {
			return JSON.stringify(arg);
		} catch {
			return String(arg);
		}
	}).join(' ')}`;
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
