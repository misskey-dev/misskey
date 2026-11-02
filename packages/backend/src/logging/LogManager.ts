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
	normalizeLogValue,
	serializeLogError,
	type LogNormalizationProfile,
} from './LogNormalizer.js';
import type { LogBackend } from './LogBackend.js';
import type {
	AccessLogConfiguration,
	AccessLogRecord,
	AccessLogRecordInput,
	AccessLogStatusClass,
	LogLevel,
	LogLevelSetting,
	LogRecord,
	LogRecordInput,
	LogTraceContext,
	LogTraceContextProvider,
} from './types.js';

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
	readonly access?: AccessLogConfiguration;
};

/** 正規化済みのAccess log設定です。 */
export type ResolvedAccessLogConfiguration = {
	readonly statusClasses: readonly AccessLogStatusClass[];
	readonly bodies: {
		readonly request: boolean;
		readonly response: boolean;
		readonly maxBytes: number;
	};
};

const logLevelOrder: Readonly<Record<LogLevel, number>> = {
	debug: 0,
	info: 1,
	warn: 2,
	error: 3,
	fatal: 4,
};

const validLogLevels = new Set<LogLevelSetting>(['debug', 'info', 'warn', 'error', 'fatal', 'off']);
const validAccessStatusClasses = new Set<AccessLogStatusClass>(['2xx', '3xx', '4xx', '5xx']);
const defaultAccessBodyMaxBytes = 16 * 1024;
const maxAccessBodyBytes = 128 * 1024;

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

/** Access logを明示的に有効化していない場合の設定を作成します。 */
function createDisabledAccessLogConfiguration(): ResolvedAccessLogConfiguration {
	return {
		statusClasses: [],
		bodies: {
			request: false,
			response: false,
			maxBytes: defaultAccessBodyMaxBytes,
		},
	};
}

/** Access log設定を検証し、本番環境では本文だけを無効化します。 */
function resolveAccessConfiguration(configuration: unknown, nodeEnv: string | undefined): {
	readonly access: ResolvedAccessLogConfiguration;
	readonly warnings: readonly string[];
} {
	if (configuration == null) return { access: createDisabledAccessLogConfiguration(), warnings: [] };
	if (typeof configuration !== 'object' || Array.isArray(configuration)) {
		throw new Error('logging.access must be an object');
	}

	const raw = configuration as {
		statusClasses?: unknown;
		bodies?: unknown;
	};
	let statusClasses: AccessLogStatusClass[] = [];
	if (typeof raw.statusClasses !== 'undefined') {
		if (!Array.isArray(raw.statusClasses)) {
			throw new Error('logging.access.statusClasses must be an array');
		}
		statusClasses = [...new Set(raw.statusClasses.map((statusClass, index) => {
			if (typeof statusClass !== 'string' || !validAccessStatusClasses.has(statusClass as AccessLogStatusClass)) {
				throw new Error(`logging.access.statusClasses[${index}] must be one of 2xx, 3xx, 4xx, or 5xx`);
			}
			return statusClass as AccessLogStatusClass;
		}))];
	}

	let request = false;
	let response = false;
	let maxBytes = defaultAccessBodyMaxBytes;
	if (typeof raw.bodies !== 'undefined') {
		if (typeof raw.bodies !== 'object' || raw.bodies === null || Array.isArray(raw.bodies)) {
			throw new Error('logging.access.bodies must be an object');
		}
		const bodies = raw.bodies as { request?: unknown; response?: unknown; maxBytes?: unknown };
		if (typeof bodies.request !== 'undefined' && typeof bodies.request !== 'boolean') {
			throw new Error('logging.access.bodies.request must be a boolean');
		}
		if (typeof bodies.response !== 'undefined' && typeof bodies.response !== 'boolean') {
			throw new Error('logging.access.bodies.response must be a boolean');
		}
		const configuredMaxBytes = bodies.maxBytes;
		if (typeof configuredMaxBytes !== 'undefined' && (typeof configuredMaxBytes !== 'number' || !Number.isSafeInteger(configuredMaxBytes) || configuredMaxBytes <= 0 || configuredMaxBytes > maxAccessBodyBytes)) {
			throw new Error(`logging.access.bodies.maxBytes must be a positive integer no greater than ${maxAccessBodyBytes}`);
		}
		request = bodies.request ?? false;
		response = bodies.response ?? false;
		maxBytes = typeof configuredMaxBytes === 'number' ? configuredMaxBytes : defaultAccessBodyMaxBytes;
	}

	if (nodeEnv === 'production' && (request || response)) {
		return {
			access: {
				statusClasses,
				bodies: { request: false, response: false, maxBytes },
			},
			warnings: ['logging.access.bodies is disabled in production mode'],
		};
	}

	return {
		access: { statusClasses, bodies: { request, response, maxBytes } },
		warnings: [],
	};
}

/** 通常ログとAccess logの設定をまとめて検証し、起動時警告も返します。 */
function resolveConfiguration(configuration: LogManagerConfiguration | undefined, nodeEnv: string | undefined): {
	readonly level: LogLevelSetting | undefined;
	readonly domains: readonly (readonly [string, LogLevelSetting])[];
	readonly access: ResolvedAccessLogConfiguration;
	readonly warnings: readonly string[];
} {
	if (configuration == null) return { level: undefined, domains: [], access: createDisabledAccessLogConfiguration(), warnings: [] };

	const level = validateLogLevel(configuration.level, 'logging.level');
	const access = resolveAccessConfiguration(configuration.access, nodeEnv);
	if (configuration.domains == null) return { level, domains: [], ...access };
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

	return { level, domains, ...access };
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
	private accessConfiguration: ResolvedAccessLogConfiguration;
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
		this.accessConfiguration = createDisabledAccessLogConfiguration();
	}

	/**
	 * 以後のログを書き込む出力先を切り替えます。
	 * 作成済みのLoggerにも切り替えを反映するため、LogManager側で保持します。
	 */
	public setBackend(backend: LogBackend): void {
		this.backend = backend;
	}

	/** 起動時の既定levelとdomain別levelを適用します。 */
	public configure(configuration?: LogManagerConfiguration): readonly string[] {
		const resolved = resolveConfiguration(configuration, this.dependencies.getNodeEnv());
		this.configuredLevel = resolved.level;
		this.configuredDomains = resolved.domains;
		this.accessConfiguration = resolved.access;
		return resolved.warnings;
	}

	/** Fastifyフックが参照する正規化済みのAccess log設定を返します。 */
	public getAccessLogConfiguration(): ResolvedAccessLogConfiguration {
		return this.accessConfiguration;
	}

	/** 正規化方式を切り替え、既に作成済みのLoggerにも反映します。 */
	public setNormalizationProfile(profile: LogNormalizationProfile): void {
		this.normalizationProfile = profile;
	}

	/** ログ出力時にactiveなTrace Contextを取得する処理を登録します。 */
	public setTraceContextProvider(provider?: LogTraceContextProvider): void {
		this.traceContextProvider = provider;
	}

	/** 現在の処理に紐付くTrace Contextを取得します。 */
	public getActiveTraceContext(): LogTraceContext | undefined {
		return this.traceContextProvider?.();
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

	/** status classの設定を確認し、Access logの出力対象か判断します。 */
	public shouldWriteAccess(statusCode: number): boolean {
		if (this.dependencies.isQuiet()) return false;
		const statusClass = `${Math.floor(statusCode / 100)}xx` as AccessLogStatusClass;
		return validAccessStatusClasses.has(statusClass) && this.accessConfiguration.statusClasses.includes(statusClass);
	}

	/** Access logのフック自体を登録してよい状態か、quietを含めて判定します。 */
	public isAccessLogEnabled(): boolean {
		return !this.dependencies.isQuiet() && this.accessConfiguration.statusClasses.length > 0;
	}

	/** HTTP応答へ共通情報と本文の安全な正規化を加えてAccess logを渡します。 */
	public writeAccess(input: AccessLogRecordInput): void {
		if (!this.shouldWriteAccess(input.statusCode)) return;

		const processInfo = this.dependencies.getProcessInfo();
		const { requestBody, responseBody, traceContext, ...inputWithoutOptionalValues } = input;
		const bodyOptions = {
			profile: this.normalizationProfile,
			limits: { maxBytes: this.accessConfiguration.bodies.maxBytes },
		} as const;
		const normalizedRequestBody = this.accessConfiguration.bodies.request && typeof requestBody !== 'undefined'
			? normalizeLogValue(requestBody, bodyOptions)
			: undefined;
		const normalizedResponseBody = this.accessConfiguration.bodies.response && typeof responseBody !== 'undefined'
			? normalizeLogValue(responseBody, bodyOptions)
			: undefined;
		// HTTPフックが開始時に保持したContextだけを使い、応答時に別のSpanを紐付けません。
		const resolvedTraceContext = traceContext;
		const record: AccessLogRecord = {
			type: 'access',
			...inputWithoutOptionalValues,
			timestamp: this.dependencies.now().toISOString(),
			processId: processInfo.processId,
			isPrimary: processInfo.isPrimary,
			workerId: processInfo.workerId,
			...(typeof normalizedRequestBody !== 'undefined' ? { requestBody: normalizedRequestBody } : {}),
			...(typeof normalizedResponseBody !== 'undefined' ? { responseBody: normalizedResponseBody } : {}),
			...(resolvedTraceContext ?? {}),
		};

		this.backend.writeAccess?.(record);
	}
}
