/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { test as base, expect } from '@playwright/test';
import { IGNORABLE_ERROR_MESSAGES, isIgnorableErrorMessage } from './ignorable-errors.js';

/** 通常のtestの代わりにこちらを使用する */
export const test = base.extend<{ _installIgnorableErrorHandlers: void }>({
	_installIgnorableErrorHandlers: [async ({ page }, use) => {
		await page.addInitScript((messages) => {
			function includesIgnorableMessage(message: unknown): boolean {
				if (typeof message !== 'string') return false;
				return messages.some((text) => message.includes(text));
			}

			window.addEventListener('error', (event) => {
				if (includesIgnorableMessage(event.message)) {
					event.preventDefault();
				}
			});

			window.addEventListener('unhandledrejection', (event) => {
				const reason = event.reason;
				const message = reason instanceof Error ? reason.message : String(reason);
				if (includesIgnorableMessage(message)) {
					event.preventDefault();
				}
			});

			//@ts-ignore
			window.isPlaywright = true;
		}, [...IGNORABLE_ERROR_MESSAGES]);

		// Playwright側で収集されるページエラーも同じ基準で握りつぶす。
		page.on('pageerror', (error) => {
			if (isIgnorableErrorMessage(error.message)) {
				return;
			}
		});

		await use();
	}, { auto: true }],
});

export { expect };
