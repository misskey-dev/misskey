/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { LogWriteInput } from '@/logging/types.js';

/** プロセス例外をロガーへ渡すために必要な最小の処理対象です。 */
export type ProcessErrorHandlerProcess = {
	on(event: 'unhandledRejection', listener: (reason: unknown) => void): unknown;
	on(event: 'uncaughtException', listener: (error: Error) => void): unknown;
};

/** 例外記録に必要なロガーの最小インターフェースです。 */
export type ProcessErrorHandlerLogger = {
	write(input: LogWriteInput): void;
};

/** プロセス例外ハンドラーの登録に使う依存関係です。 */
export type ProcessErrorHandlerOptions = {
	readonly process?: ProcessErrorHandlerProcess;
	readonly logger: ProcessErrorHandlerLogger;
	readonly quiet: boolean;
};

/** ログ記録の失敗が別の例外を起こさないよう、プロセス異常を安全に記録します。 */
function writeProcessError(
	logger: ProcessErrorHandlerLogger,
	eventName: 'process.unhandled_rejection' | 'process.uncaught_exception',
	message: string,
	error: unknown,
): void {
	try {
		// 元の値をerrorへ渡し、JSON形式の出力処理で安全な形へ正規化します。
		logger.write({
			level: 'error',
			eventName,
			message,
			error,
		});
	} catch {
		// 例外処理中のログ失敗で、さらにプロセスを不安定にしないよう握りつぶします。
	}
}

/** 未処理のPromise拒否と未捕捉例外を構造化ログへ接続します。 */
export function installProcessErrorHandlers(options: ProcessErrorHandlerOptions): void {
	const processLike: ProcessErrorHandlerProcess = options.process ?? (process as unknown as ProcessErrorHandlerProcess);

	if (!options.quiet) {
		processLike.on('unhandledRejection', reason => {
			writeProcessError(options.logger, 'process.unhandled_rejection', 'Unhandled promise rejection', reason);
		});
	}

	processLike.on('uncaughtException', error => {
		writeProcessError(options.logger, 'process.uncaught_exception', 'Uncaught exception', error);
	});
}
