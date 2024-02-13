/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { DataSource } from 'typeorm';

export async function resetDb(db: DataSource) {
	const reset = async () => {
		const tables = await db.query(`SELECT relname AS "table"
		FROM pg_class C LEFT JOIN pg_namespace N ON (N.oid = C.relnamespace)
		WHERE nspname NOT IN ('pg_catalog', 'information_schema')
			AND C.relkind = 'r'
			AND nspname !~ '^pg_toast';`);
		for (const table of tables) {
			await db.query(`DELETE FROM "${table.table}" CASCADE`);
		}
	};

	for (let i = 1; i <= 3; i++) {
		try {
			await reset();
		} catch (e) {
			if (i === 3) {
				throw e;
			} else {
				await new Promise(resolve => setTimeout(resolve, 1000));
				continue;
			}
		}
		break;
	}
}
