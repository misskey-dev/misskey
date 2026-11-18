/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

const isConcurrentIndexMigrationEnabled = process.env.MISSKEY_MIGRATION_CREATE_INDEX_CONCURRENTLY === '1';

// グループ付きチャートの一意索引を ("date", "group") から ("group", "date") に作り直す。
// チャートは「あるグループの最新のログ」「あるグループの期間内のログ」を引くため、group を先頭にしないと索引で絞り込めない。
// 索引名は TypeORM の命名規則 (列名をソートしてからハッシュ化する) により列順に依存しないので、同じ名前のまま作り直す。
// ("date", "group") の一意性と、date を先頭にした索引は、各テーブルの一意制約 (UQ_...) が引き続き提供する。
const indices = [
	['IDX_39ee857ab2f23493037c6b6631', '__chart__instance'],
	['IDX_fea7c0278325a1a2492f2d6acb', '__chart_day__instance'],
	['IDX_5048e9daccbbbc6d567bb142d3', '__chart__per_user_notes'],
	['IDX_c5545d4b31cdc684034e33b81c', '__chart_day__per_user_notes'],
	['IDX_f2a56da57921ca8439f45c1d95', '__chart__per_user_pv'],
	['IDX_f221e45cfac5bea0ce0f3149fb', '__chart_day__per_user_pv'],
	['IDX_229a41ad465f9205f1f5703291', '__chart__per_user_reaction'],
	['IDX_d54b653660d808b118e36c184c', '__chart_day__per_user_reaction'],
	['IDX_b77d4dd9562c3a899d9a286fcd', '__chart__per_user_following'],
	['IDX_e4849a3231f38281280ea4c0ee', '__chart_day__per_user_following'],
	['IDX_30bf67687f483ace115c5ca642', '__chart__per_user_drive'],
	['IDX_62aa5047b5aec92524f24c701d', '__chart_day__per_user_drive'],
];

export class ChartGroupDateIndex1794998148339 {
	name = 'ChartGroupDateIndex1794998148339';
	transaction = isConcurrentIndexMigrationEnabled ? false : undefined;

	async up(queryRunner) {
		for (const [indexName, tableName] of indices) {
			await this.recreateUniqueIndex(queryRunner, indexName, tableName, ['group', 'date']);
		}
	}

	async down(queryRunner) {
		for (const [indexName, tableName] of [...indices].reverse()) {
			await this.recreateUniqueIndex(queryRunner, indexName, tableName, ['date', 'group']);
		}
	}

	async recreateUniqueIndex(queryRunner, indexName, tableName, columns) {
		const columnList = columns.map(column => `"${column}"`).join(', ');

		// CONCURRENTLY はトランザクション内では使えない。
		// TypeORM の revert は migration ごとの transaction 設定を見ないため、down() がトランザクション内で呼ばれた場合は通常の方法で作り直す。
		if (isConcurrentIndexMigrationEnabled && !queryRunner.isTransactionActive) {
			// 途中で中断して再実行した場合に備え、既に目的の列順で有効な索引ができていれば作り直さない
			const current = await queryRunner.query(`SELECT pg_index.indisvalid AS "isValid", pg_attribute.attname AS "leadingColumn" FROM pg_index INNER JOIN pg_class ON pg_index.indexrelid = pg_class.oid INNER JOIN pg_attribute ON pg_attribute.attrelid = pg_index.indrelid AND pg_attribute.attnum = pg_index.indkey[0] WHERE pg_class.relname = '${indexName}'`);
			if (current.length > 0 && current[0].isValid === true && current[0].leadingColumn === columns[0]) return;

			await queryRunner.query(`DROP INDEX CONCURRENTLY IF EXISTS "public"."${indexName}"`);
			await queryRunner.query(`CREATE UNIQUE INDEX CONCURRENTLY "${indexName}" ON "${tableName}" (${columnList})`);
		} else {
			await queryRunner.query(`DROP INDEX "public"."${indexName}"`);
			await queryRunner.query(`CREATE UNIQUE INDEX "${indexName}" ON "${tableName}" (${columnList})`);
		}
	}
}
