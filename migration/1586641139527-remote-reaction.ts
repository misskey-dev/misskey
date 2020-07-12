import {MigrationInterface, QueryRunner} from "typeorm";

export class remoteReaction1586641139527 implements MigrationInterface {
    name = 'remoteReaction1586641139527'
    public async up(queryRunner: QueryRunner): Promise<any> {
      await queryRunner.query(`ALTER TABLE "note_reaction" ALTER COLUMN "reaction" TYPE character varying(260)`, undefined);
  }

  public async down(queryRunner: QueryRunner): Promise<any> {
      await queryRunner.query(`ALTER TABLE "note_reaction" ALTER COLUMN "reaction" TYPE character varying(130)`, undefined);
  }
}
