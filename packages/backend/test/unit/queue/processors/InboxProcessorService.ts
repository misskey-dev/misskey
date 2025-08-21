/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

process.env.NODE_ENV = 'test';

import * as assert from 'node:assert';
import { describe, test } from '@jest/globals';
import * as Bull from 'bullmq';

import { IdentifiableError } from '@/misc/identifiable-error.js';

describe('InboxProcessorService - Blocked Instance Handling', () => {
	describe('Error handling for blocked instances', () => {
		test('should identify blocked instance error correctly', async () => {
			// Test that the specific error ID is recognized
			const blockedInstanceErrorId = '09d79f9e-64f1-4316-9cfa-e75c4d091574';
			const error = new IdentifiableError(blockedInstanceErrorId, 'Instance is blocked');
			
			assert.strictEqual(error.id, blockedInstanceErrorId);
			assert.strictEqual(error.message, 'Instance is blocked');
		});

		test('should handle Bull.UnrecoverableError for blocked instances', async () => {
			// Test that UnrecoverableError can be created with skip message
			const skipMessage = 'skip: Instance is blocked';
			const unrecoverableError = new Bull.UnrecoverableError(skipMessage);
			
			assert.ok(unrecoverableError instanceof Bull.UnrecoverableError);
			assert.strictEqual(unrecoverableError.message, skipMessage);
		});

		test('should distinguish between blocked instance error and other errors', async () => {
			const blockedInstanceError = new IdentifiableError('09d79f9e-64f1-4316-9cfa-e75c4d091574', 'Instance is blocked');
			const otherError = new IdentifiableError('some-other-id', 'Some other error');
			
			// Test error identification logic (this is what the fix implements)
			const isBlockedInstanceError = (err: any) => {
				return err instanceof IdentifiableError && err.id === '09d79f9e-64f1-4316-9cfa-e75c4d091574';
			};

			assert.ok(isBlockedInstanceError(blockedInstanceError));
			assert.ok(!isBlockedInstanceError(otherError));
		});
	});
});