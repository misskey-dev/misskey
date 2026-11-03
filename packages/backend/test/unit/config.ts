/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as fs from 'node:fs';
import * as os from 'node:os';
import { join } from 'node:path';
import { afterAll, afterEach, beforeAll, describe, expect, test, vi } from 'vitest';
import type { Config } from '@/config.js';

// 設定ファイルのYAMLはワーカーでパースするので、メインスレッドでjs-yamlが読み込まれたらここで検知する
const jsYaml = vi.hoisted(() => ({ imported: false }));
vi.mock('js-yaml', () => {
	jsYaml.imported = true;
	return {
		load: () => {
			throw new Error('js-yaml must not be used in the main thread');
		},
	};
});

const baseSource = {
	url: 'https://example.com',
	port: 3000,
	db: {
		host: 'localhost',
		port: 5432,
		db: 'misskey',
		user: 'example-user',
		pass: 'example-pass',
	},
	redis: {
		host: 'localhost',
		port: 6379,
		pass: 'example-redis-pass',
	},
};

let tmpDir: string;
let fileCount = 0;

beforeAll(() => {
	tmpDir = fs.mkdtempSync(join(os.tmpdir(), 'misskey-config-test-'));
});

afterAll(() => {
	fs.rmSync(tmpDir, { recursive: true, force: true });
});

afterEach(() => {
	vi.unstubAllEnvs();
});

function writeConfigFile(yaml: string): string {
	const path = join(tmpDir, `config-${fileCount++}.yml`);
	fs.writeFileSync(path, yaml);
	return path;
}

/** 設定ファイルのパスはモジュール評価時に決まるため、環境変数を差し替えてから読み込み直す */
async function importLoadConfig(path: string): Promise<() => Config> {
	vi.stubEnv('MISSKEY_CONFIG_YML', path);
	vi.resetModules();
	const { loadConfig } = await import('@/config.js');
	return loadConfig;
}

/** baseSourceのトップレベルのキーを上書きした設定ファイルを作る。undefinedを渡したキーは出力しない */
function buildYaml(overrides: Record<string, unknown> = {}): string {
	return Object.entries({ ...baseSource, ...overrides })
		.filter(([, value]) => value !== undefined)
		// JSONはYAMLのフロースタイルとしてそのまま読める
		.map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
		.join('\n');
}

async function loadConfigWith(overrides: Record<string, unknown> = {}): Promise<Config> {
	const loadConfig = await importLoadConfig(writeConfigFile(buildYaml(overrides)));
	return loadConfig();
}

function catchError(fn: () => unknown): unknown {
	try {
		fn();
	} catch (err) {
		return err;
	}
	throw new Error('Expected function to throw');
}

describe('loadConfig', () => {
	describe('YAML parsing in worker', () => {
		test('parses YAML without loading js-yaml in the main thread', async () => {
			const config = await loadConfigWith();

			expect(config.url).toBe('https://example.com');
			expect(jsYaml.imported).toBe(false);
		});

		test('preserves YAML values across the worker boundary', async () => {
			const loadConfig = await importLoadConfig(writeConfigFile([
				'# comment',
				'url: https://example.com',
				'port: 3000',
				'socket: ~',
				'disableHsts: true',
				'trustProxy:',
				'  - 10.0.0.0/8',
				'  - 127.0.0.1/32',
				'db: &db',
				'  host: localhost',
				'  port: 5432',
				'  db: misskey',
				'  user: example-user',
				'  pass: example-pass',
				'  extra:',
				'    statement_timeout: "1000"',
				'dbSlaves:',
				'  - *db',
				'redis:',
				'  host: localhost',
				'  port: 6379',
				'  pass: example-redis-pass',
			].join('\n')));

			const config = loadConfig();

			expect(config.port).toBe(3000);
			expect(config.socket).toBeNull();
			expect(config.disableHsts).toBe(true);
			expect(config.trustProxy).toEqual(['10.0.0.0/8', '127.0.0.1/32']);
			expect(config.db.extra).toEqual({ statement_timeout: '1000' });
			expect(config.dbSlaves).toEqual([{
				host: 'localhost',
				port: 5432,
				db: 'misskey',
				user: 'example-user',
				pass: 'example-pass',
				extra: { statement_timeout: '1000' },
			}]);
		});

		test('returns the same result when loaded repeatedly', async () => {
			const loadConfig = await importLoadConfig(writeConfigFile(buildYaml()));

			expect(loadConfig()).toEqual(loadConfig());
		});

		test('throws a parse error with its position for invalid YAML', async () => {
			const loadConfig = await importLoadConfig(writeConfigFile('url: https://example.com\ndb:\n  host: [localhost\n'));

			expect(() => loadConfig()).toThrow(/\(\d+:\d+\)/);
		});

		test('throws ENOENT in the main thread when the file does not exist', async () => {
			const loadConfig = await importLoadConfig(join(tmpDir, 'not-found.yml'));

			// 起動処理はcodeを見て「設定ファイルが無い」旨を表示するので、ワーカーを経由させずに投げる必要がある
			expect(catchError(loadConfig)).toMatchObject({ code: 'ENOENT' });
		});
	});

	describe('url', () => {
		test('derives URL-related values from url', async () => {
			const config = await loadConfigWith({ url: 'http://localhost:3000/' });

			expect(config).toMatchObject({
				url: 'http://localhost:3000',
				host: 'localhost:3000',
				hostname: 'localhost',
				scheme: 'http',
				wsScheme: 'ws',
				wsUrl: 'ws://localhost:3000',
				apiUrl: 'http://localhost:3000/api',
				authUrl: 'http://localhost:3000/auth',
				driveUrl: 'http://localhost:3000/files',
			});
		});

		test('uses wss for https', async () => {
			const config = await loadConfigWith({ url: 'https://example.com' });

			expect(config.wsUrl).toBe('wss://example.com');
		});

		test('falls back to MISSKEY_URL when url is not set', async () => {
			vi.stubEnv('MISSKEY_URL', 'https://env.example.com');
			const config = await loadConfigWith({ url: undefined });

			expect(config.url).toBe('https://env.example.com');
		});

		test('prefers url in the file over MISSKEY_URL', async () => {
			vi.stubEnv('MISSKEY_URL', 'https://env.example.com');
			const config = await loadConfigWith({ url: 'https://example.com' });

			expect(config.url).toBe('https://example.com');
		});

		test('throws for an invalid url', async () => {
			const loadConfig = await importLoadConfig(writeConfigFile(buildYaml({ url: 'not a url' })));

			expect(() => loadConfig()).toThrow('url="not a url" is not a valid URL.');
		});

		test('includes version and url in userAgent', async () => {
			const config = await loadConfigWith();

			expect(config.userAgent).toBe(`Misskey/${config.version} (https://example.com)`);
		});
	});

	describe('environment variable fallbacks', () => {
		test('falls back to PORT when port is not set', async () => {
			vi.stubEnv('PORT', '8080');
			const config = await loadConfigWith({ port: undefined });

			expect(config.port).toBe(8080);
		});

		test('falls back to DATABASE_* when db credentials are not set', async () => {
			vi.stubEnv('DATABASE_DB', 'env-db');
			vi.stubEnv('DATABASE_USER', 'env-user');
			vi.stubEnv('DATABASE_PASSWORD', 'env-pass');
			const config = await loadConfigWith({ db: { host: 'localhost', port: 5432 } });

			expect(config.db).toEqual({ host: 'localhost', port: 5432, db: 'env-db', user: 'env-user', pass: 'env-pass' });
		});

		test('prefers db credentials in the file over DATABASE_*', async () => {
			vi.stubEnv('DATABASE_DB', 'env-db');
			vi.stubEnv('DATABASE_USER', 'env-user');
			vi.stubEnv('DATABASE_PASSWORD', 'env-pass');
			const config = await loadConfigWith();

			expect(config.db).toMatchObject({ db: 'misskey', user: 'example-user', pass: 'example-pass' });
		});
	});

	describe('defaults', () => {
		test('applies default values for omitted settings', async () => {
			const config = await loadConfigWith();

			expect(config).toMatchObject({
				enableIpRateLimit: true,
				maxFileSize: 262144000,
				threadPoolSize: 1,
				perChannelMaxNoteCacheCount: 1000,
				perUserNotificationsMaxCount: 500,
				deactivateAntennaThreshold: 1000 * 60 * 60 * 24 * 7,
				videoThumbnailGenerator: null,
				publishTarballInsteadOfProvideRepositoryUrl: false,
			});
			expect(config.trustProxy).toEqual([
				'10.0.0.0/8',
				'172.16.0.0/12',
				'192.168.0.0/16',
				'127.0.0.1/32',
				'::1/128',
				'fc00::/7',
			]);
		});
	});

	describe('mediaProxy', () => {
		test('uses the internal proxy when mediaProxy is not set', async () => {
			const config = await loadConfigWith();

			expect(config.mediaProxy).toBe('https://example.com/proxy');
			expect(config.externalMediaProxyEnabled).toBe(false);
		});

		test('removes the trailing slash from an external mediaProxy', async () => {
			const config = await loadConfigWith({ mediaProxy: 'https://media.example.com/' });

			expect(config.mediaProxy).toBe('https://media.example.com');
			expect(config.externalMediaProxyEnabled).toBe(true);
		});

		test('does not treat the internal proxy URL as an external one', async () => {
			const config = await loadConfigWith({ mediaProxy: 'https://example.com/proxy' });

			expect(config.externalMediaProxyEnabled).toBe(false);
		});
	});

	describe('videoThumbnailGenerator', () => {
		test('removes the trailing slash', async () => {
			const config = await loadConfigWith({ videoThumbnailGenerator: 'https://thumbnail.example.com/' });

			expect(config.videoThumbnailGenerator).toBe('https://thumbnail.example.com');
		});
	});

	describe('redis', () => {
		test('fills redis options from pass and host', async () => {
			const config = await loadConfigWith();

			expect(config.redis).toMatchObject({
				host: 'localhost',
				port: 6379,
				password: 'example-redis-pass',
				prefix: 'example.com',
				keyPrefix: 'example.com:',
				family: 0,
				db: 0,
			});
		});

		test('uses explicit prefix, family and db', async () => {
			const config = await loadConfigWith({
				redis: { ...baseSource.redis, prefix: 'custom', family: 6, db: 2 },
			});

			expect(config.redis).toMatchObject({ prefix: 'custom', keyPrefix: 'custom:', family: 6, db: 2 });
		});

		test('uses redis for purpose-specific connections that are not set', async () => {
			const config = await loadConfigWith();

			expect(config.redisForPubsub).toBe(config.redis);
			expect(config.redisForJobQueue).toBe(config.redis);
			expect(config.redisForTimelines).toBe(config.redis);
			expect(config.redisForReactions).toBe(config.redis);
		});

		test('converts purpose-specific connections that are set', async () => {
			const config = await loadConfigWith({
				redisForJobQueue: { host: 'queue.example.com', port: 6380, pass: 'queue-pass' },
			});

			expect(config.redisForJobQueue).toMatchObject({
				host: 'queue.example.com',
				port: 6380,
				password: 'queue-pass',
				keyPrefix: 'example.com:',
			});
			expect(config.redisForPubsub).toBe(config.redis);
		});
	});

	describe('job concurrency', () => {
		test.each([
			'deliverJobConcurrency',
			'inboxJobConcurrency',
			'relationshipJobConcurrency',
		])('accepts a valid %s', async (key) => {
			const config = await loadConfigWith({ [key]: 1 });

			expect(config[key as keyof Config]).toBe(1);
		});

		test('leaves concurrency undefined when not set', async () => {
			const config = await loadConfigWith();

			expect(config.deliverJobConcurrency).toBeUndefined();
			expect(config.inboxJobConcurrency).toBeUndefined();
			expect(config.relationshipJobConcurrency).toBeUndefined();
		});

		// YAMLでしか表現できない値も含めるため、値はYAMLの表記で渡す
		test.each([
			['0', '0'],
			['-1', '-1'],
			['0.5', '0.5'],
			['.inf', 'null'],
			['.nan', 'null'],
			['"4"', '"4"'],
		])('rejects deliverJobConcurrency: %s', async (yamlValue, printed) => {
			const loadConfig = await importLoadConfig(writeConfigFile(`${buildYaml()}\ndeliverJobConcurrency: ${yamlValue}`));

			expect(() => loadConfig()).toThrow(`deliverJobConcurrency=${printed} is invalid.`);
		});
	});
});
