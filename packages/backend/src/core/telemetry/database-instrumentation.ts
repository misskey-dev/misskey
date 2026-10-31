/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Span, TracerProvider } from '@opentelemetry/api';

type Instrumentation = {
	setTracerProvider(provider: TracerProvider): void;
	enable(): void;
	disable(): void;
};

type PgInstrumentationConfig = {
	enhancedDatabaseReporting: boolean;
	requireParentSpan: boolean;
	ignoreConnectSpans: boolean;
	requestHook?(span: Span): void;
};

type InstrumentationConstructor = new (config: PgInstrumentationConfig) => Instrumentation;

type InstrumentationDeps = {
	PgInstrumentation: InstrumentationConstructor;
};

type DatabaseInstrumentationOptions = {
	capturePgStatement: boolean;
	capturePgConnectionSpans: boolean;
};

type InstallDatabaseInstrumentationOptions = DatabaseInstrumentationOptions & {
	capturePgSpans: boolean;
};

/**
 * pg はアプリケーションが import する前に有効化しないと、require hook 型の
 * 自動計装がモジュールを patch できない。そのため、
 * telemetry provider の登録直後にこの関数を呼び出す。
 */
export async function installDatabaseInstrumentation(provider: TracerProvider, options: InstallDatabaseInstrumentationOptions): Promise<() => void> {
	if (!options.capturePgSpans) return () => {};

	const { PgInstrumentation } = await import('@opentelemetry/instrumentation-pg');

	return installInstrumentation(provider, { PgInstrumentation }, options);
}

export function installInstrumentation(provider: TracerProvider, deps: InstrumentationDeps, options: DatabaseInstrumentationOptions = {
	capturePgStatement: false,
	capturePgConnectionSpans: false,
}): () => void {
	const instrumentations = [
		new deps.PgInstrumentation({
			// SQLパラメータには投稿内容・認証情報などが含まれ得るため、常に記録しない。
			enhancedDatabaseReporting: false,
			requireParentSpan: true,
			ignoreConnectSpans: !options.capturePgConnectionSpans,
			// instrumentation-pgはSQL本文を無加工で属性へ追加する。明示opt-in時だけ残す。
			...(options.capturePgStatement ? {} : {
				requestHook: (span: Span) => {
					span.setAttribute('db.statement', '[REDACTED]');
					span.setAttribute('db.query.text', '[REDACTED]');
				},
			}),
		}),
	];

	try {
		for (const instrumentation of instrumentations) {
			instrumentation.setTracerProvider(provider);
			instrumentation.enable();
		}
	} catch (error) {
		for (const instrumentation of instrumentations) {
			instrumentation.disable();
		}
		throw error;
	}

	return () => {
		for (const instrumentation of instrumentations) {
			instrumentation.disable();
		}
	};
}
