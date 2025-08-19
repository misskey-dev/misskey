/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class PageCountInNote1755168347001 {
    name = 'PageCountInNote1755168347001'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "note" ADD "pageCount" smallint NOT NULL DEFAULT '0'`);

        // Update existing notes
        // block_list CTE collects all page blocks on the pages including child blocks in the section blocks.
        // The clipped_notes CTE counts how many distinct pages each note block is referenced in.
        // Finally, we update the note table with the count of pages for each referenced note.
        await queryRunner.query(`
            WITH RECURSIVE block_list AS (
                (
                    SELECT
                        page.id as page_id,
                        block as block
                    FROM page
                        CROSS JOIN LATERAL jsonb_array_elements(page.content) block
                    WHERE block->>'type' = 'note' OR block->>'type' = 'section'
                )
                UNION ALL
                (
                    SELECT
                        block_list.page_id,
                        child_block AS block
                    FROM LATERAL (
                        SELECT page_id, block
                            FROM block_list
                            WHERE block_list.block->>'type' = 'section'
                        ) block_list
                        CROSS JOIN LATERAL jsonb_array_elements(block_list.block->'children') child_block
                    WHERE child_block->>'type' = 'note' OR child_block->>'type' = 'section'
                )
            ),
            clipped_notes AS (
                SELECT
                    (block->>'note') AS note_id,
                    COUNT(distinct block_list.page_id) AS count
                FROM block_list
                WHERE block_list.block->>'type' = 'note'
                GROUP BY block->>'note'
            )
            UPDATE note
            SET "pageCount" = clipped_notes.count
            FROM clipped_notes
            WHERE note.id = clipped_notes.note_id;
        `);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "note" DROP COLUMN "pageCount"`);
    }
}
