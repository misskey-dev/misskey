/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// This script checks if the database migrations has been generated correctly.

import dataSource from '../ormconfig.js';

await dataSource.initialize();

const sqlInMemory = await dataSource.driver.createSchemaBuilder().log();

if (sqlInMemory.upQueries.length > 0 || sqlInMemory.downQueries.length > 0) {
	console.error('There are several pending migrations. Please make sure you have generated the migrations correctly, or configured entities class correctly.');
	for (const query of sqlInMemory.upQueries) {
		console.error(`- ${query.query}`);
	}
	for (const query of sqlInMemory.downQueries) {
		console.error(`- ${query.query}`);
	}
	process.exit(1);
} else {
	console.log('All migrations are clean.');
	process.exit(0);
}
