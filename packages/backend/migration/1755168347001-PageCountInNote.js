/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class PageCountInNote1755168347001 {
    name = 'PageCountInNote1755168347001'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "note" ADD "pageCount" smallint NOT NULL DEFAULT '0'`);
        await queryRunner.query(`COMMENT ON COLUMN "note"."pageCount" IS 'The number of note page blocks referencing this note.'`);

        // Update existing notes
        // CTE to get the count of page blocks referencing each note,
        // and then update the note's pageCount with that value.
        await queryRunner.query(`
            WITH clipped_notes AS (
                SELECT
                    (block->>'note') AS note_id,
                    COUNT(distinct p.id) AS count
                FROM page p
                         CROSS JOIN LATERAL jsonb_array_elements(p.content) block
                WHERE block->>'type' = 'note'
                GROUP BY block->>'note'
            )
            UPDATE note
            SET "pageCount" = clipped_notes.count
            FROM clipped_notes
            WHERE note.id = clipped_notes.note_id;
        `);
    }

    async down(queryRunner) {
        await queryRunner.query(`COMMENT ON COLUMN "note"."pageCount" IS 'The number of note page blocks referencing this note.'`);
        await queryRunner.query(`ALTER TABLE "note" DROP COLUMN "pageCount"`);
    }
}
