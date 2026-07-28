/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as fs from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, test, vi } from 'vitest';
import { load as loadYaml } from 'js-yaml';
import { parseConfigSource } from '@/config-schema.js';

function createValidSource() {
	return {
		_NOTE_: 'generated metadata',
		url: 'https://example.com/',
		port: 3000,
		db: {
			host: 'localhost',
			port: 5432,
			db: 'misskey',
			user: 'misskey',
			pass: 'password',
		},
		redis: {
			host: 'localhost',
			port: 6379,
		},
		id: 'aidx',
	} as const;
}

describe('config schema', () => {
	test.each([
		'.config/example.yml',
		'.config/docker_example.yml',
		'.config/playwright-devcontainer.yml',
		'.github/misskey/test.yml',
	])('parses the repository configuration example %s', relativePath => {
		const repositoryRoot = resolve(import.meta.dirname, '../../../..');
		const yaml = fs.readFileSync(resolve(repositoryRoot, relativePath), 'utf8');

		expect(() => parseConfigSource(loadYaml(yaml))).not.toThrow();
	});

	test('parses a valid source and removes compiler metadata', () => {
		const source = parseConfigSource({
			...createValidSource(),
			configValidation: 'strict',
			id: 'AIDX',
		});

		expect(source).not.toHaveProperty('_NOTE_');
		expect(source).not.toHaveProperty('configValidation');
		expect(source.db.port).toBe(5432);
		expect(source.redis.port).toBe(6379);
		expect(source.id).toBe('aidx');
	});

	test('preserves the legacy unvalidated behavior and reports a warning to the caller', () => {
		const onWarning = vi.fn();
		const source = parseConfigSource({
			...createValidSource(),
			configValidation: 'legacy',
			db: {
				host: 'localhost',
				port: 'not-a-port',
			},
			unknownOption: true,
		}, { onWarning });

		expect(onWarning).toHaveBeenCalledWith(expect.stringContaining('validate-config'));
		expect(source).not.toHaveProperty('configValidation');
		expect(source).not.toHaveProperty('_NOTE_');
		expect(source.db.port).toBe('not-a-port');
		expect(source).toHaveProperty('unknownOption', true);
	});

	test('does not write legacy warnings directly to the console', () => {
		const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

		parseConfigSource({
			...createValidSource(),
			configValidation: 'legacy',
		});

		expect(consoleWarn).not.toHaveBeenCalled();
	});

	test('forces strict validation regardless of the configured mode', () => {
		const onWarning = vi.fn();

		expect(() => parseConfigSource({
			...createValidSource(),
			configValidation: 'legacy',
			db: {
				host: 'localhost',
				port: 'not-a-port',
			},
		}, {
			forceValidation: true,
			onWarning,
		})).toThrowError(/db\.port/);
		expect(onWarning).not.toHaveBeenCalled();
	});

	test('rejects an invalid validation mode', () => {
		expect(() => parseConfigSource({
			...createValidSource(),
			configValidation: 'disabled',
		})).toThrowError(/configValidation: Must be either strict or legacy/);
	});

	test('retains options owned by Redis and Sentry', () => {
		const source = parseConfigSource({
			...createValidSource(),
			redis: {
				host: 'localhost',
				port: 6379,
				username: 'redis-user',
				connectTimeout: 5000,
			},
			sentryForBackend: {
				enableNodeProfiling: false,
				options: {
					dsn: 'https://public@example.com/1',
					tracesSampleRate: 0.5,
				},
			},
		});

		expect(source.redis.username).toBe('redis-user');
		expect(source.redis.connectTimeout).toBe(5000);
		expect(source.sentryForBackend?.options.tracesSampleRate).toBe(0.5);
	});

	test('normalizes a numeric Meilisearch port', () => {
		const source = parseConfigSource({
			...createValidSource(),
			fulltextSearch: {
				provider: 'meilisearch',
			},
			meilisearch: {
				host: 'localhost',
				port: 7700,
				apiKey: '',
				index: 'misskey',
			},
		});

		expect(source.meilisearch?.port).toBe('7700');
	});

	test('reports all invalid nested values with their paths', () => {
		expect(() => parseConfigSource({
			...createValidSource(),
			db: {
				host: 'localhost',
				port: '5432',
				unknownOption: true,
			},
			redis: {
				host: 'localhost',
				port: 70000,
				family: 5,
			},
			id: 'snowflake',
		})).toThrowError(expect.objectContaining({
			message: expect.stringMatching(
				/db\.port[\s\S]*db\.unknownOption[\s\S]*redis\.port[\s\S]*redis\.family[\s\S]*id/,
			),
		}));
	});

	test('rejects unknown Misskey configuration properties', () => {
		expect(() => parseConfigSource({
			...createValidSource(),
			proxyRemoteFiles: true,
		})).toThrowError(/proxyRemoteFiles: Unknown configuration property/);
	});

	test('distinguishes missing and invalid values from unknown properties', () => {
		expect(() => parseConfigSource({
			...createValidSource(),
			db: 'postgresql',
		})).toThrowError(expect.objectContaining({
			message: expect.stringMatching(/db: Must be an object/),
		}));

		expect(() => parseConfigSource({
			...createValidSource(),
			db: {
				host: 'localhost',
			},
		})).toThrowError(expect.objectContaining({
			message: expect.not.stringContaining('Unknown configuration property'),
		}));
	});

	test('rejects arrays used in place of configuration objects', () => {
		expect(() => parseConfigSource({
			...createValidSource(),
			logging: [],
			sentryForBackend: {
				options: [],
				enableNodeProfiling: false,
			},
		})).toThrowError(expect.objectContaining({
			message: expect.stringMatching(/sentryForBackend\.options: Must be an object[\s\S]*logging: Must be an object/),
		}));
	});

	test('validates job rate limits and allowed private network CIDRs', () => {
		expect(() => parseConfigSource({
			...createValidSource(),
			deliverJobPerSec: 0,
			inboxJobPerSec: -1,
			allowedPrivateNetworks: ['127.0.0.1', 'not-a-network'],
		})).toThrowError(expect.objectContaining({
			message: expect.stringMatching(
				/allowedPrivateNetworks\.0: Must be a valid CIDR[\s\S]*allowedPrivateNetworks\.1: Must be a valid CIDR[\s\S]*deliverJobPerSec: Must be a positive integer[\s\S]*inboxJobPerSec: Must be a positive integer/,
			),
		}));
	});

	test('requires Meilisearch options when it is the selected provider', () => {
		expect(() => parseConfigSource({
			...createValidSource(),
			fulltextSearch: {
				provider: 'meilisearch',
			},
		})).toThrowError(/meilisearch must be configured/);
	});

	test('requires a database slave when replication is enabled', () => {
		expect(() => parseConfigSource({
			...createValidSource(),
			dbReplications: true,
			dbSlaves: [],
		})).toThrowError(/dbSlaves must contain at least one replica/);
	});

	test('validates logging and telemetry boundaries', () => {
		expect(() => parseConfigSource({
			...createValidSource(),
			logging: {
				format: 'ndjson',
				access: {
					bodies: {
						maxBytes: 128 * 1024 + 1,
					},
				},
			},
			otelForBackend: {
				sampleRate: 1.1,
				jobTraceContextMode: 'child',
			},
		})).toThrowError(expect.objectContaining({
			message: expect.stringMatching(
				/otelForBackend\.sampleRate[\s\S]*otelForBackend\.jobTraceContextMode[\s\S]*logging\.format[\s\S]*logging\.access\.bodies\.maxBytes/,
			),
		}));
	});

	test('does not expose secret values in validation errors', () => {
		const secret = 'secret-token-that-must-not-be-logged';

		expect(() => parseConfigSource({
			...createValidSource(),
			proxy: secret,
			setupPassword: secret,
		})).toThrowError(expect.not.stringContaining(secret));
	});
});
