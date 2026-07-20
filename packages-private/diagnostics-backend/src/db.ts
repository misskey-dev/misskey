/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import Redis from 'ioredis';
import pg from 'pg';

/**
 * 計測ラウンド間で状態を持ち越さないよう、テスト用DBを作り直しRedisを空にする。
 * 接続先はCIのテスト用サービス (.github/misskey/test.yml) と揃えてある。
 */
export async function resetState() {
	const postgres = new pg.Client({
		host: '127.0.0.1',
		port: 54312,
		database: 'postgres',
		user: 'postgres',
	});

	await postgres.connect();
	try {
		await postgres.query('DROP DATABASE IF EXISTS "test-misskey" WITH (FORCE)');
		await postgres.query('CREATE DATABASE "test-misskey"');
	} finally {
		await postgres.end();
	}

	const redis = new Redis({ host: '127.0.0.1', port: 56312 });
	try {
		await redis.flushall();
	} finally {
		redis.disconnect();
	}
}
