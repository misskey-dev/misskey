/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export interface TelemetryCaptureMessageOptions {
	level: 'error';
	userId?: string;
	extra?: Record<string, unknown>;
}

/**
 * Sentry・OpenTelemetryなど、エラートラッキング/APMサービスごとの実装差異を隠蔽するための抽象。
 * 新しいサービスを追加する場合はこのインターフェースを実装するアダプタをこのディレクトリに追加し、
 * telemetry-registry.tsのinitTelemetry内で登録する。
 */
export interface TelemetryAdapter {
	captureMessage(message: string, opts: TelemetryCaptureMessageOptions): void;
	startSpan<T>(name: string, fn: () => T): T;
	shutdown(): Promise<void>;
}
