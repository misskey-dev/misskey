/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { beforeEach, describe, expect, test, vi } from 'vitest';
import type * as Bull from 'bullmq';
import { instrumentQueue } from '@/core/telemetry/queue-instrumentation.js';

const mocks = vi.hoisted(() => ({
	injectTraceContext: vi.fn((carrier: Record<string, string>) => {
		carrier['traceparent'] = '00-0123456789abcdef0123456789abcdef-0123456789abcdef-01';
	}),
}));

vi.mock('@/core/telemetry/telemetry-registry.js', () => ({
	injectTraceContext: mocks.injectTraceContext,
}));

describe('queue-instrumentation', () => {
	beforeEach(() => {
		mocks.injectTraceContext.mockClear();
	});

	test('injects the active trace context for add()', () => {
		const add = vi.fn();
		const queue = instrumentQueue({ add, addBulk: vi.fn() } as unknown as Bull.Queue<{ noteId: string }>);
		const data = { noteId: '9d6b9a65-46c9-4e1b-a640-9589693893c9' };

		queue.add('endedPollNotification', data);

		expect(mocks.injectTraceContext).toHaveBeenCalledTimes(1);
		expect(data).toMatchObject({
			__misskeyTraceContext: {
				traceparent: '00-0123456789abcdef0123456789abcdef-0123456789abcdef-01',
			},
		});
		expect(add).toHaveBeenCalledWith('endedPollNotification', data, undefined);
	});

	test('injects every job passed to addBulk()', () => {
		const addBulk = vi.fn();
		const queue = instrumentQueue({ add: vi.fn(), addBulk } as unknown as Bull.Queue<{ to: string }>);
		const jobs = [
			{ name: 'deliver', data: { to: 'https://remote.example/inbox' } },
			{ name: 'deliver', data: { to: 'https://remote2.example/inbox' } },
		];

		queue.addBulk(jobs);

		expect(mocks.injectTraceContext).toHaveBeenCalledTimes(2);
		expect(jobs).toEqual(expect.arrayContaining([
			expect.objectContaining({ data: expect.objectContaining({ __misskeyTraceContext: expect.any(Object) }) }),
		]));
		expect(addBulk).toHaveBeenCalledWith(jobs);
	});
});
