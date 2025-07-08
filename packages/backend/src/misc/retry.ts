/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Logger } from '@/logger.js';

export interface RetryOptions {
	maxAttempts?: number;
	delayMs?: number;
	backoffMultiplier?: number;
	logger?: Logger;
}

export class RetryError extends Error {
	constructor(
		message: string,
		public readonly attempts: number,
		public readonly lastError: Error,
	) {
		super(message);
		this.name = 'RetryError';
	}
}

/**
 * 再試行ロジックを実行する
 * @param operation 実行する操作
 * @param options 再試行オプション
 * @returns 操作の結果
 */
export async function withRetry<T>(
	operation: () => Promise<T>,
	options: RetryOptions = {},
): Promise<T> {
	const {
		maxAttempts = 3,
		delayMs = 1000,
		backoffMultiplier = 2,
		logger,
	} = options;

	let lastError: Error;
	let currentDelay = delayMs;

	for (let attempt = 1; attempt <= maxAttempts; attempt++) {
		try {
			return await operation();
		} catch (error) {
			lastError = error instanceof Error ? error : new Error(String(error));
			
			if (attempt === maxAttempts) {
				logger?.error(`Operation failed after ${maxAttempts} attempts`, { error: lastError });
				throw new RetryError(
					`Operation failed after ${maxAttempts} attempts: ${lastError.message}`,
					attempt,
					lastError,
				);
			}

			logger?.warn(`Operation failed (attempt ${attempt}/${maxAttempts}), retrying in ${currentDelay}ms`, { error: lastError });
			
			// 最大遅延時間を制限（DoS攻撃防止）
			const maxDelay = 30000; // 30秒
			currentDelay = Math.min(currentDelay, maxDelay);
			
			await new Promise(resolve => setTimeout(resolve, currentDelay));
			currentDelay *= backoffMultiplier;
		}
	}

	// この行は到達しないはずだが、型安全性のため
	throw new Error('Unexpected end of retry loop');
} 