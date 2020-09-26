import {MigrationInterface, QueryRunner} from "typeorm";

export class ChannelNoteIdDescIndex1597893996136 implements MigrationInterface {
    name = 'ChannelNoteIdDescIndex1597893996136'

    public async up(queryRunner: QueryRunner): Promise<void> {
				await queryRunner.query(`DROP INDEX "IDX_f22169eb10657bded6d875ac8f"`);
				await queryRunner.query(`CREATE INDEX "IDX_note_on_channelId_and_id_desc" ON "note" ("channelId", "id" desc)`);
		}

    public async down(queryRunner: QueryRunner): Promise<void> {
				await queryRunner.query(`DROP INDEX "IDX_note_on_channelId_and_id_desc"`);
        await queryRunner.query(`CREATE INDEX "IDX_f22169eb10657bded6d875ac8f" ON "note" ("channelId") `);
    }

}
