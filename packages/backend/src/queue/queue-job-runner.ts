/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { OperationContextService } from '@/core/OperationContextService.js';
import type { TelemetryService } from '@/core/telemetry/TelemetryService.js';

type QueueOperationContextService = Pick<OperationContextService, 'runRoot'>;
type QueueTelemetryService = Pick<TelemetryService, 'startSpan'>;

export type RunQueueJobOptions<T> = {
	operationContext:
		| { mode: 'none' }
		| { mode: 'per-job'; service: QueueOperationContextService };
	telemetryService: QueueTelemetryService;
	spanName: string;
	processJob: () => T | Promise<T>;
	onError: (error: Error) => void;
};

/** Queueのprocessorを実行し、失敗処理をSpan内で行います。 */
export function runQueueJob<T>(options: RunQueueJobOptions<T>): Promise<T> {
	const {
		operationContext,
		telemetryService,
		spanName,
		processJob,
		onError,
	} = options;
	const run = () => {
		return telemetryService.startSpan(spanName, async (): Promise<T> => {
			try {
				return await processJob();
			} catch (error) {
				// 失敗イベントを待たず、processor Spanがactiveな間にログと通知を行います。
				const normalizedError = error instanceof Error ? error : new Error(String(error));
				try {
					onError(normalizedError);
				} catch {
					// 失敗ログの処理が例外を投げても、Queueへは元のエラーを返します。
				}
				throw error;
			}
		});
	};

	return operationContext.mode === 'none'
		? run()
		: operationContext.service.runRoot(run);
}
