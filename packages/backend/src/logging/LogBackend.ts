/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { AccessLogRecord, LogRecord } from './types.js';

/**
 * 整形済みのログを実際の出力先へ渡すための共通窓口です。
 * Loggerを特定の出力形式へ依存させず、後から出力先を追加できるようにします。
 */
export interface LogBackend {
	/** ログを一件出力します。 */
	write(record: LogRecord): void;

	/** Access logを一件出力します。 */
	writeAccess?(record: AccessLogRecord): void;

	/** 保留中の出力がある場合に、すべて書き出します。 */
	flush?(): void | Promise<void>;

	/** 出力先が持つ資源を解放します。 */
	close?(): void | Promise<void>;
}
