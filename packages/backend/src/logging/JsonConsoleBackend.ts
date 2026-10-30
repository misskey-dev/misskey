/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { LogBackend } from './LogBackend.js';
import type { AccessLogRecord, LogRecord } from './types.js';

/** JSON形式のログを1行で出力する処理が外部から受け取る依存関係です。 */
export type JsonConsoleBackendDependencies = {
	readonly output: (line: string) => void;
};

/** JSON形式で出力する項目を、運用上安定した形として定義します。 */
type JsonLogRecord = {
	readonly timestamp: string;
	readonly level: LogRecord['level'];
	readonly message: string;
	readonly loggerName: string;
	readonly eventName?: string;
	readonly attributes?: LogRecord['attributes'];
	readonly error?: LogRecord['error'];
	readonly processId: number;
	readonly isPrimary: boolean;
	readonly workerId: number | null;
	readonly trace_id?: string;
	readonly span_id?: string;
	readonly trace_flags?: number;
};

/** Access logのJSON出力項目です。通常ログと混同しない形を保ちます。 */
type JsonAccessLogRecord = {
	readonly type: 'access';
	readonly timestamp: string;
	readonly method: string;
	readonly route: string | null;
	readonly statusCode: number;
	readonly durationMs: number;
	readonly responseSizeBytes: number | null;
	readonly errorType?: string;
	readonly requestBody?: AccessLogRecord['requestBody'];
	readonly responseBody?: AccessLogRecord['responseBody'];
	readonly processId: number;
	readonly isPrimary: boolean;
	readonly workerId: number | null;
	readonly trace_id?: string;
	readonly span_id?: string;
	readonly trace_flags?: number;
};

const defaultDependencies: JsonConsoleBackendDependencies = {
	output: line => console.log(line),
};

/** LogRecordからJSONへ出す項目だけを選び、内部情報を誤って含めないようにします。 */
function createJsonLogRecord(record: LogRecord): JsonLogRecord {
	// 色や旧APIの生データは表示専用の情報なので、機械向け形式へは持ち込みません。
	return {
		timestamp: record.timestamp,
		level: record.level,
		message: record.message,
		loggerName: record.loggerName,
		// 任意項目は値がある場合だけ含め、空の項目を増やさないようにします。
		...(record.eventName != null ? { eventName: record.eventName } : {}),
		...(record.attributes != null ? { attributes: record.attributes } : {}),
		...(record.error != null ? { error: record.error } : {}),
		// 実行主体の情報は常に出し、ログを横断して検索できる形を保ちます。
		processId: record.processId,
		isPrimary: record.isPrimary,
		workerId: record.workerId,
		// active Spanの情報は値が存在するログだけ、標準のsnake_case名で出力します。
		...(record.traceId != null ? { trace_id: record.traceId } : {}),
		...(record.spanId != null ? { span_id: record.spanId } : {}),
		...(record.traceFlags != null ? { trace_flags: record.traceFlags } : {}),
	};
}

/** Access logから公開する項目だけを選び、1行JSONの形へ整えます。 */
function createJsonAccessLogRecord(record: AccessLogRecord): JsonAccessLogRecord {
	return {
		type: 'access',
		timestamp: record.timestamp,
		method: record.method,
		route: record.route,
		statusCode: record.statusCode,
		durationMs: record.durationMs,
		responseSizeBytes: record.responseSizeBytes,
		...(record.errorType != null ? { errorType: record.errorType } : {}),
		...(record.requestBody !== undefined ? { requestBody: record.requestBody } : {}),
		...(record.responseBody !== undefined ? { responseBody: record.responseBody } : {}),
		processId: record.processId,
		isPrimary: record.isPrimary,
		workerId: record.workerId,
		...(record.traceId != null ? { trace_id: record.traceId } : {}),
		...(record.spanId != null ? { span_id: record.spanId } : {}),
		...(record.traceFlags != null ? { trace_flags: record.traceFlags } : {}),
	};
}

/**
 * LogRecordを1行のJSONへ変換し、ログ収集基盤が扱える標準出力へ渡します。
 * LoggerやLogManagerから出力形式を切り離し、Pretty形式と同じ記録を共有します。
 */
export class JsonConsoleBackend implements LogBackend {
	private readonly dependencies: JsonConsoleBackendDependencies;

	/** 出力処理を受け取り、テストや起動環境ごとに出力先を差し替えます。 */
	constructor(dependencies: Partial<JsonConsoleBackendDependencies> = {}) {
		this.dependencies = {
			...defaultDependencies,
			...dependencies,
		};
	}

	/** 1件のログをJSON文字列へ変換し、改行を含まない1回の出力として渡します。 */
	public write(record: LogRecord): void {
		// JSON.stringifyが改行などをエスケープするため、1ログ1行の契約を保てます。
		this.dependencies.output(JSON.stringify(createJsonLogRecord(record)));
	}

	/** Access logを1行JSONとして出力します。本文は設定で有効化された場合のみ、秘匿処理済みで含まれます。 */
	public writeAccess(record: AccessLogRecord): void {
		// JSON.stringifyが改行をエスケープするため、1件を1物理行に保ちます。
		this.dependencies.output(JSON.stringify(createJsonAccessLogRecord(record)));
	}
}
