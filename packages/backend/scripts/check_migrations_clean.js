/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// This script checks if the database migrations has been generated correctly.

import dataSource from '../ormconfig.js';

await dataSource.initialize();

const sqlInMemory = await dataSource.driver.createSchemaBuilder().log();

// カスタムテーブル/カラムの差分は無視（手動命名とTypeORM自動命名の差分）
const customPatterns = [
	'noctown_', 'noq_', 'drawing_', 'chat_secret_',
	'IDX_noctown', 'IDX_noq', 'IDX_drawing', 'IDX_chat_secret',
	'FK_noctown', 'FK_noq', 'FK_drawing', 'FK_chat_secret', 'FK_meta_noqBot',
	'excludedFromIllustrationHighlight', 'IDX_drive_file_excluded',
];
const isCustomTableQuery = (query) => customPatterns.some(p => query.includes(p));

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
