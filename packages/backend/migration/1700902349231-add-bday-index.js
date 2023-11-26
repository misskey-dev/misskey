/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class AddBdayIndex1700902349231 {
    name = 'AddBdayIndex1700902349231'

    async up(queryRunner) {
      await queryRunner.query(`CREATE INDEX "IDX_de22cd2b445eee31ae51cdbe99" ON "user_profile" (SUBSTR("birthday", 6, 5))`);
    }

    async down(queryRunner) {
			await queryRunner.query(`DROP INDEX "public"."IDX_de22cd2b445eee31ae51cdbe99"`);
    }
}
