import {MigrationInterface, QueryRunner} from "typeorm";

export class noteReactionLength1582875306439 implements MigrationInterface {
    name = 'noteReactionLength1582875306439'

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "note_reaction" ALTER COLUMN "reaction" TYPE character varying(130)`, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "note_reaction" ALTER COLUMN "reaction" TYPE character varying(128)`, undefined);
    }

}
