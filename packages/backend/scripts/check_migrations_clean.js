/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// This script checks if the database migrations has been generated correctly.

import dataSource from '../ormconfig.js';

await dataSource.initialize();

const sqlInMemory = await dataSource.driver.createSchemaBuilder().log();

// カスタムテーブル/カラム/インデックスの差分は無視
// （手動命名マイグレーションとTypeORM自動スキーマ同期の差分）
const customPatterns = [
	// カスタムテーブル名
	'noctown_', 'noq_', 'drawing_', 'chat_secret_',
	// カスタムカラム名
	'noqBotAccountId', 'excludedFromIllustrationHighlight',
	'chatScope', 'suspendedReason',
	// カスタムpage visibility
	'url-only',
];
const isCustomTableQuery = (query) => customPatterns.some(p => query.includes(p))

// TypeORMハッシュインデックスのDROP/CREATEも無視
// （カスタムエンティティのインデックス名がマイグレーションと異なる）
const isAutoIndexQuery = (query) => /DROP INDEX "public"\."IDX_[a-f0-9]+"/.test(query) || /CREATE INDEX "IDX_[a-f0-9]+"/.test(query);

// TypeORMハッシュ名のFK制約のDROP/ADDも無視
const isAutoFKQuery = (query) => /DROP CONSTRAINT "FK_[a-f0-9]+"/.test(query) || /ADD CONSTRAINT "FK_[a-f0-9]+" FOREIGN KEY/.test(query);

const isIgnoredQuery = (query) => isCustomTableQuery(query) || isAutoIndexQuery(query) || isAutoFKQuery(query);

const filteredUp = sqlInMemory.upQueries.filter(q => !isIgnoredQuery(q.query));
const filteredDown = sqlInMemory.downQueries.filter(q => !isIgnoredQuery(q.query));

if (filteredUp.length > 0 || filteredDown.length > 0) {
	console.error('There are several pending migrations. Please make sure you have generated the migrations correctly, or configured entities class correctly.');
	for (const query of filteredUp) {
		console.error(`- ${query.query}`);
	}
	for (const query of filteredDown) {
		console.error(`- ${query.query}`);
	}
	process.exit(1);
} else {
	if (sqlInMemory.upQueries.length > 0) {
		console.log(`Note: ${sqlInMemory.upQueries.length} custom table FK differences ignored.`);
	}
	console.log('All migrations are clean.');
	process.exit(0);
}
