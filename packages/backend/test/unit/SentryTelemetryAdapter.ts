/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, test, vi } from 'vitest';
import { buildSentryIntegrations } from '@/core/telemetry/adapters/SentryTelemetryAdapter.js';

type TestIntegration = Parameters<ReturnType<typeof buildSentryIntegrations>>[0][number];

function testIntegration(name: string): TestIntegration {
	return { name };
}

describe('SentryTelemetryAdapter', () => {
	test('removes disabled integrations from Sentry defaults', () => {
		const integrations = buildSentryIntegrations({
			disabledIntegrations: ['Postgres'],
			enableNodeProfiling: false,
		});

		const result = integrations([
			testIntegration('Http'),
			testIntegration('Postgres'),
			testIntegration('Redis'),
		]);

		expect(result.map((integration: TestIntegration) => integration.name)).toEqual(['Http', 'Redis']);
	});

	test('keeps profiling integration when enabled', () => {
		const integrations = buildSentryIntegrations({
			disabledIntegrations: [],
			enableNodeProfiling: true,
			nodeProfilingIntegration: () => testIntegration('ProfilingIntegration'),
		});

		const result = integrations([
			testIntegration('Http'),
		]);

		expect(result.map((integration: TestIntegration) => integration.name)).toEqual(['Http', 'ProfilingIntegration']);
	});

	test('warns about unknown disabled integration names without removing defaults', () => {
		const warn = vi.fn();
		const integrations = buildSentryIntegrations({
			disabledIntegrations: ['Unknown'],
			enableNodeProfiling: false,
			warn,
		});

		const result = integrations([
			testIntegration('Http'),
		]);

		expect(result.map((integration: TestIntegration) => integration.name)).toEqual(['Http']);
		expect(warn).toHaveBeenCalledWith('Unknown Sentry integration configured in sentryForBackend.disabledIntegrations: Unknown');
	});
});
