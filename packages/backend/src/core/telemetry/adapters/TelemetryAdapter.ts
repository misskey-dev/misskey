/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Config } from '@/config.js';

export type SentryBackendConfig = NonNullable<Config['sentryForBackend']>;
export type OtelBackendConfig = NonNullable<Config['otelForBackend']>;
export type OtelBackendRuntimeConfig = OtelBackendConfig & {
	serviceVersion: string;
};

export interface TelemetryCaptureMessageOptions {
	/** 現在はエラー通知用途だけに絞る。追加する場合は各adapterでの扱いを揃えること。 */
	level: 'error';

	/** Sentryではuser.idへ渡す。OTel adapterは現在span属性へ付与していないため、必要ならadapter側で拡張する。 */
	userId?: string;

	/** queue名やendpoint名など、通知先で調査に使う補助情報。 */
	extra?: Record<string, unknown>;
}

/**
 * Sentry・OpenTelemetryなど、エラートラッキング/APMサービスごとの実装差異を隠蔽するための抽象。
 * 新しいサービスを追加する場合はこのインターフェースを実装するアダプタをこのディレクトリに追加し、
 * telemetry-registry.tsのinitTelemetry内で登録する。
 */
export interface TelemetryAdapter {
	/**
	 * 実行中の処理で起きたエラー相当の事象を記録する。
	 * Sentryはmessage通知、OTelはactive spanまたは短命spanへの例外記録として扱う。
	 */
	captureMessage(message: string, opts: TelemetryCaptureMessageOptions): void;

	/**
	 * API endpointやqueue jobなど、呼び出し側の処理単位をspanで包む。
	 * fnの戻り値・例外はそのまま呼び出し側へ返し、Promiseの場合はsettleまでspanを閉じない。
	 */
	startSpan<T>(name: string, fn: () => T): T;

	/**
	 * プロセス終了時にtelemetry backendへ残りのデータをflushする。
	 * 実装側ではtransport停止に引きずられないよう、待機時間に上限を設ける。
	 */
	shutdown(): Promise<void>;
}
