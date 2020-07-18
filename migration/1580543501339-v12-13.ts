import {MigrationInterface, QueryRunner} from "typeorm";

export class v12131580543501339 implements MigrationInterface {
    name = 'v12131580543501339'

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`CREATE INDEX "IDX_NOTE_TAGS" ON "note" USING gin ("tags")`, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`DROP INDEX "IDX_NOTE_TAGS"`, undefined);
    }

}
