/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { tracingChannel } from 'node:diagnostics_channel';
import { context, trace } from '@opentelemetry/api';
import type { Span, SpanKind, SpanStatusCode, Tracer } from '@opentelemetry/api';

type IORedisCommandContext = {
	command: string;
	args: string[];
	database: number;
	serverAddress: string;
	serverPort: number | undefined;
};

type IORedisConnectContext = {
	serverAddress: string;
	serverPort: number | undefined;
};

type TracingChannelSubscribers<T extends object> = {
	start(message: T): void;
	end(message: T & { error?: unknown }): void;
	asyncStart(message: T & { error?: unknown }): void;
	asyncEnd(message: T & { error?: unknown }): void;
	error(message: T & { error: unknown }): void;
};

type TracingChannel<T extends object> = {
	subscribe(subscribers: TracingChannelSubscribers<T>): void;
	unsubscribe(subscribers: TracingChannelSubscribers<T>): void;
};

type RedisInstrumentationDeps = {
	tracingChannel<T extends object>(name: string): TracingChannel<T>;
	tracer: Pick<Tracer, 'startSpan'>;
	getActiveSpan(): Span | undefined;
	spanKindClient: SpanKind;
	spanStatusCodeError: SpanStatusCode;
};

type RedisInstrumentationOptions = {
	captureCommandSpans?: boolean;
	/** requireParentSpan is the official ioredis instrumentation's default. */
	requireParentSpan?: boolean;
	captureConnectionSpans?: boolean;
};

/**
 * ioredis 5.11以降が公開する native diagnostics channel を購読する。
 * バンドル後もioredis自身が発行するイベントを使うため、require hook に
 * 依存せず、ESM import 経路でもコマンド span を取得できる。
 */
export function installRedisInstrumentation(
	tracer: Pick<Tracer, 'startSpan'>,
	spanKindClient: SpanKind,
	spanStatusCodeError: SpanStatusCode,
	options: RedisInstrumentationOptions = {},
): () => void {
	return createRedisInstrumentation({
		tracingChannel,
		tracer,
		getActiveSpan: () => trace.getSpan(context.active()),
		spanKindClient,
		spanStatusCodeError,
	}, options);
}

export function createRedisInstrumentation(deps: RedisInstrumentationDeps, options: RedisInstrumentationOptions = {}): () => void {
	const requireParentSpan = options.requireParentSpan ?? true;
	const cleanup: Array<() => void> = [];
	if (options.captureCommandSpans === true) {
		const commandChannel = deps.tracingChannel<IORedisCommandContext>('ioredis:command');
		const commandSubscribers = createTracingChannelSubscribers(commandChannel, deps, requireParentSpan, message => ({
			name: message.command,
			attributes: {
				'db.system.name': 'redis',
				'db.namespace': message.database.toString(10),
				'db.operation.name': message.command,
				'server.address': message.serverAddress,
				...(message.serverPort != null ? { 'server.port': message.serverPort } : {}),
			},
		}));
		cleanup.push(() => commandChannel.unsubscribe(commandSubscribers));
	}
	if (options.captureConnectionSpans === true) {
		const connectChannel = deps.tracingChannel<IORedisConnectContext>('ioredis:connect');
		// Connection spans are explicitly opt-in and should include startup and reconnect attempts.
		const connectSubscribers = createTracingChannelSubscribers(connectChannel, deps, false, message => ({
			name: 'connect',
			attributes: {
				'db.system.name': 'redis',
				'db.operation.name': 'connect',
				'server.address': message.serverAddress,
				...(message.serverPort != null ? { 'server.port': message.serverPort } : {}),
			},
		}));
		cleanup.push(() => connectChannel.unsubscribe(connectSubscribers));
	}

	return () => {
		for (const unsubscribe of cleanup) {
			unsubscribe();
		}
	};
}

function createTracingChannelSubscribers<T extends object>(
	channel: TracingChannel<T>,
	deps: RedisInstrumentationDeps,
	requireParentSpan: boolean,
	getSpanOptions: (message: T) => { name: string; attributes: Record<string, string | number> },
): TracingChannelSubscribers<T> {
	const spans = new WeakMap<object, { span: Span; recordedError: boolean }>();

	const recordError = (state: { span: Span; recordedError: boolean }, value: unknown): void => {
		if (state.recordedError) return;
		const error = toError(value);
		state.span.recordException(error);
		state.span.setStatus({ code: deps.spanStatusCodeError, message: error.message });
		state.span.setAttribute('error.type', getErrorType(error));
		const statusCode = getRedisErrorStatusCode(error.message);
		if (statusCode != null) state.span.setAttribute('db.response.status_code', statusCode);
		state.recordedError = true;
	};

	const finish = (message: T & { error?: unknown }): void => {
		const state = spans.get(message);
		if (state == null) return;

		if (message.error != null) {
			recordError(state, message.error);
		}
		state.span.end();
		spans.delete(message);
	};

	const subscribers: TracingChannelSubscribers<T> = {
		start: (message) => {
			if (requireParentSpan && deps.getActiveSpan() == null) return;

			const options = getSpanOptions(message);
			const span = deps.tracer.startSpan(options.name, {
				kind: deps.spanKindClient,
				attributes: options.attributes,
			});
			spans.set(message, { span, recordedError: false });
		},
		// Promiseを返すコマンドでは完了前にもendイベントが来るため、同期例外だけここで閉じる。
		end: (message) => {
			if (message.error != null) finish(message);
		},
		asyncStart: () => {},
		asyncEnd: finish,
		error: (message) => {
			const state = spans.get(message);
			if (state == null) return;
			recordError(state, message.error);
		},
	};

	channel.subscribe(subscribers);
	return subscribers;
}

function toError(value: unknown): Error {
	return value instanceof Error ? value : new Error(String(value));
}

function getRedisErrorStatusCode(message: string): string | undefined {
	return message.match(/^([A-Z][A-Z0-9_]*)\b/)?.[1];
}

function getErrorType(error: Error): string {
	return (error as NodeJS.ErrnoException).code ?? error.name;
}
