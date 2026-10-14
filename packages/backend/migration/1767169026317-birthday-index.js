/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class BirthdayIndex1767169026317 {
    name = 'BirthdayIndex1767169026317'

    async up(queryRunner) {
        await queryRunner.query(`DROP INDEX "public"."IDX_de22cd2b445eee31ae51cdbe99"`);
        await queryRunner.query(`CREATE OR REPLACE FUNCTION get_birthday_date(birthday TEXT) RETURNS SMALLINT AS $$ BEGIN RETURN CAST((SUBSTR(birthday, 6, 2) || SUBSTR(birthday, 9, 2)) AS SMALLINT); END; $$ LANGUAGE plpgsql IMMUTABLE;`);
        await queryRunner.query(`CREATE INDEX "IDX_USERPROFILE_BIRTHDAY_DATE" ON "user_profile" (get_birthday_date("birthday"))`);
    }

    async down(queryRunner) {
        await queryRunner.query(`CREATE INDEX "IDX_de22cd2b445eee31ae51cdbe99" ON "user_profile" (substr("birthday", 6, 5))`);
        await queryRunner.query(`DROP INDEX "public"."IDX_USERPROFILE_BIRTHDAY_DATE"`);
        await queryRunner.query(`DROP FUNCTION IF EXISTS get_birthday_date(birthday TEXT)`);
    }
}
