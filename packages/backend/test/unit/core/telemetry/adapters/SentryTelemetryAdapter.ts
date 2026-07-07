/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

process.env.NODE_ENV = 'test';

import { describe, expect, test } from 'vitest';
import { buildSentryNodeOptions } from '../../../../../src/core/telemetry/adapters/SentryTelemetryAdapter.js';

describe('buildSentryNodeOptions', () => {
	test('disables outbound trace propagation by default', () => {
		const options = buildSentryNodeOptions({
			enableNodeProfiling: false,
			options: {},
		});

		expect(options.tracePropagationTargets).toEqual([]);
	});

	test('allows explicit tracePropagationTargets to override the default', () => {
		const options = buildSentryNodeOptions({
			enableNodeProfiling: false,
			options: {
				tracePropagationTargets: ['^https://internal\\.example/'],
			},
		});

		expect(options.tracePropagationTargets).toEqual(['^https://internal\\.example/']);
	});
});
