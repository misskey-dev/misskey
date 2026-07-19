/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import cluster from 'node:cluster';
import process from 'node:process';
import { envOption } from '@/env.js';
import {
	findLegacyLogError,
	normalizeLogAttributes,
	serializeLogError,
	type LogNormalizationProfile,
} from './LogNormalizer.js';
import type { LogBackend } from './LogBackend.js';
import type { LogLevel, LogLevelSetting, LogRecord, LogRecordInput, LogTraceContextProvider } from './types.js';

/** ログを出力したプロセスを識別するための情報です。 */
export type LogProcessInfo = {
	readonly processId: number;
	readonly isPrimary: boolean;
	readonly workerId: number | null;
};

/**
 * 実行環境から取得する値をまとめた依存関係です。
 * テストでは固定値へ差し替え、時刻やプロセス状態に左右されないようにします。
 */
export type LogManagerDependencies = {
	readonly now: () => Date;
	readonly getProcessInfo: () => LogProcessInfo;
	readonly isQuiet: () => boolean;
	readonly isVerbose: () => boolean;
	readonly getNodeEnv: () => string | undefined;
};

/** ログ管理の初期化時に指定できる正規化設定です。 */
export type LogManagerOptions = {
	readonly normalizationProfile?: LogNormalizationProfile;
};

/** 起動時に適用するログ出力設定です。 */
export type LogManagerConfiguration = {
	readonly level?: LogLevelSetting;
	readonly domains?: Readonly<Record<string, LogLevelSetting>> | null;
};

const logLevelOrder: Readonly<Record<LogLevel, number>> = {
	debug: 0,
	info: 1,
	warn: 2,
	error: 3,
	fatal: 4,
};

const validLogLevels = new Set<LogLevelSetting>(['debug', 'info', 'warn', 'error', 'fatal', 'off']);

function validateLogLevel(value: unknown, path: string): LogLevelSetting | undefined {
	if (typeof value === 'undefined') return undefined;
	if (typeof value !== 'string' || !validLogLevels.has(value as LogLevelSetting)) {
		throw new Error(`${path} must be one of debug, info, warn, error, fatal, or off`);
	}
	return value as LogLevelSetting;
}

function validateDomainName(domain: string): void {
	if (domain.length === 0 || domain.trim() !== domain || domain.split('.').some(segment => segment.length === 0)) {
		throw new Error(`logging.domains contains an invalid domain name: ${JSON.stringify(domain)}`);
	}
}

function resolveConfiguration(configuration: LogManagerConfiguration | undefined): {
	readonly level: LogLevelSetting | undefined;
	readonly domains: readonly (readonly [string, LogLevelSetting])[];
} {
	if (configuration == null) return { level: undefined, domains: [] };

	const level = validateLogLevel(configuration.level, 'logging.level');
	if (configuration.domains == null) return { level, domains: [] };
	if (typeof configuration.domains !== 'object' || configuration.domains === null || Array.isArray(configuration.domains)) {
		throw new Error('logging.domains must be an object');
	}

	const domains = Object.entries(configuration.domains).map(([domain, value]) => {
		validateDomainName(domain);
		const level = validateLogLevel(value, `logging.domains.${domain}`);
		if (typeof level === 'undefined') {
			throw new Error(`logging.domains.${domain} must be configured`);
		}
		return [domain, level] as const;
	}).sort((left, right) => right[0].length - left[0].length);

	return { level, domains };
}

const defaultDependencies: LogManagerDependencies = {
	now: () => new Date(),
	getProcessInfo: () => ({
		processId: process.pid,
		isPrimary: cluster.isPrimary,
		workerId: cluster.isPrimary ? null : (cluster.worker?.id ?? null),
	}),
	isQuiet: () => envOption.quiet,
	isVerbose: () => envOption.verbose,
	getNodeEnv: () => process.env.NODE_ENV,
};

/**
 * ログの出力可否を判断し、すべての出力先で共通となる情報を付加します。
 * Loggerと出力先の間に置くことで、設定や共通情報の扱いを一か所へ集約します。
 */
export class LogManager {
	private backend: LogBackend;
	private readonly dependencies: LogManagerDependencies;
	private normalizationProfile: LogNormalizationProfile;
	private traceContextProvider: LogTraceContextProvider | undefined;
	private configuredLevel: LogLevelSetting | undefined;
	private configuredDomains: readonly (readonly [string, LogLevelSetting])[];
	private shutdownPromise: Promise<void> | undefined;

	/**
	 * 出力先と実行環境から値を取得する処理を受け取ります。
	 * 実行環境の取得処理は、必要な項目だけテスト用に差し替えられます。
	 */
	constructor(
		backend: LogBackend,
		dependencies: Partial<LogManagerDependencies> = {},
		options: LogManagerOptions = {},
	) {
		this.backend = backend;
		this.dependencies = {
			...defaultDependencies,
			...dependencies,
		};
		this.normalizationProfile = options.normalizationProfile ?? 'standard';
		this.traceContextProvider = undefined;
		this.configuredLevel = undefined;
		this.configuredDomains = [];
	}

	/**
	 * 以後のログを書き込む出力先を切り替えます。
	 * 作成済みのLoggerにも切り替えを反映するため、LogManager側で保持します。
	 */
	public setBackend(backend: LogBackend): void {
		this.backend = backend;
	}

	/** 起動時の既定levelとdomain別levelを適用します。 */
	public configure(configuration?: LogManagerConfiguration): void {
		const resolved = resolveConfiguration(configuration);
		this.configuredLevel = resolved.level;
		this.configuredDomains = resolved.domains;
	}

	/** 正規化方式を切り替え、既に作成済みのLoggerにも反映します。 */
	public setNormalizationProfile(profile: LogNormalizationProfile): void {
		this.normalizationProfile = profile;
	}

	/** ログ出力時にactiveなTrace Contextを取得する処理を登録します。 */
	public setTraceContextProvider(provider?: LogTraceContextProvider): void {
		this.traceContextProvider = provider;
	}

	/** backendに残っているログをflushしてから終了処理を行います。 */
	public shutdown(): Promise<void> {
		if (this.shutdownPromise != null) return this.shutdownPromise;

		this.shutdownPromise = (async () => {
			try {
				await this.backend.flush?.();
			} finally {
				await this.backend.close?.();
			}
		})();

		return this.shutdownPromise;
	}

	private getDefaultLevel(): LogLevel {
		if (this.dependencies.isVerbose()) return 'debug';
		return this.dependencies.getNodeEnv() === 'production' ? 'info' : 'debug';
	}

	private getThreshold(loggerName: string): LogLevelSetting {
		let threshold: LogLevelSetting | undefined;
		for (const [domain, level] of this.configuredDomains) {
			if (loggerName === domain || loggerName.startsWith(`${domain}.`)) {
				threshold = level;
				break;
			}
		}

		threshold ??= this.configuredLevel ?? this.getDefaultLevel();

		// verboseは障害調査用の緊急モードとして、明示されたoff以外をdebugまで下げる。
		// offは意図的な無効化なので、verboseでも再有効化しない。
		return threshold === 'off' || !this.dependencies.isVerbose() ? threshold : 'debug';
	}

	private shouldWrite(input: LogRecordInput, loggerName: string): boolean {
		const threshold = this.getThreshold(loggerName);
		if (threshold === 'off') return false;
		return logLevelOrder[input.level] >= logLevelOrder[threshold];
	}

	/**
	 * 出力条件を確認し、共通情報を付加して出力先へ渡します。
	 */
	public write(input: LogRecordInput): void {
		// `quiet`は他の条件より優先し、ログに付随する情報の取得も行いません。
		if (this.dependencies.isQuiet()) return;

		const loggerName = input.context.map(segment => segment.name).join('.');
		if (!this.shouldWrite(input, loggerName)) return;

		const processInfo = this.dependencies.getProcessInfo();
		// 呼び出し側の配列を共有せず、親から末端までの順序を固定します。
		const context = [...input.context];
		// 出力を実際に行う直前にだけ正規化し、捨てられるdebugログのコストを抑えます。
		const { attributes, error: inputError, ...inputWithoutStructuredValues } = input;
		const normalizedAttributes = typeof attributes !== 'undefined'
			? normalizeLogAttributes(attributes, { profile: this.normalizationProfile })
			: undefined;
		const error = inputError ?? findLegacyLogError(input.compatibility?.data);
		const normalizedError = typeof error !== 'undefined'
			? serializeLogError(error, { profile: this.normalizationProfile })
			: undefined;
		// 実際に出力するログだけ、TelemetryからactiveなTrace Contextを取得します。
		const traceContext = this.traceContextProvider?.();
		const record = {
			...inputWithoutStructuredValues,
			context,
			timestamp: this.dependencies.now().toISOString(),
			loggerName,
			processId: processInfo.processId,
			isPrimary: processInfo.isPrimary,
			workerId: processInfo.workerId,
			...(traceContext ?? {}),
			...(normalizedAttributes ? { attributes: normalizedAttributes } : {}),
			...(normalizedError ? { error: normalizedError } : {}),
		} as LogRecord;

		this.backend.write(record);
	}
}
