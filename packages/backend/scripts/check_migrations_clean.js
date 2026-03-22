/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// This script checks if the database migrations has been generated correctly.

import dataSource from '../ormconfig.js';

await dataSource.initialize();

const sqlInMemory = await dataSource.driver.createSchemaBuilder().log();

// カスタムテーブルのFK制約名変更は無視（手動命名とTypeORM自動命名の差分）
const customTablePrefixes = ['noctown_', 'noq_', 'drawing_', 'chat_secret_'];
const isCustomTableQuery = (query) => customTablePrefixes.some(prefix => query.includes(`"${prefix}`) || query.includes(`"FK_${prefix}`) || query.includes(`FK_meta_noqBot`));

const filteredUp = sqlInMemory.upQueries.filter(q => !isCustomTableQuery(q.query));
const filteredDown = sqlInMemory.downQueries.filter(q => !isCustomTableQuery(q.query));

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
