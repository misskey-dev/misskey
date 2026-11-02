/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class UserFeaturedFixup1741424411879 {
    name = 'UserFeaturedFixup1741424411879'

    async up(queryRunner) {
        await queryRunner.query(`CREATE OR REPLACE FUNCTION pg_temp.extract_ap_id(text) RETURNS text AS $$
            SELECT
                CASE
                    WHEN $1 ~ '^https?://' THEN $1
                    WHEN $1 LIKE '{%' THEN COALESCE(jsonb_extract_path_text($1::jsonb, 'id'), null)
                    ELSE null
                END;
        $$ LANGUAGE sql IMMUTABLE;`);

        // "host" is NOT NULL is not needed but just in case add it to prevent overwriting irreplaceable data
        await queryRunner.query(`UPDATE "user" SET "featured" = pg_temp.extract_ap_id("featured") WHERE "host" IS NOT NULL`);
    }

    async down(queryRunner) {
        // fixup migration, no down migration
    }
}
