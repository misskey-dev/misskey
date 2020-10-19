import {MigrationInterface, QueryRunner} from "typeorm";

export class refineAbuseUserReport1603094348345 implements MigrationInterface {
    name = 'refineAbuseUserReport1603094348345'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "abuse_user_report" DROP CONSTRAINT "FK_d049123c413e68ca52abe734203"`);
        await queryRunner.query(`DROP INDEX "IDX_d049123c413e68ca52abe73420"`);
        await queryRunner.query(`DROP INDEX "IDX_5cd442c3b2e74fdd99dae20243"`);
        await queryRunner.query(`ALTER TABLE "abuse_user_report" DROP COLUMN "userId"`);
        await queryRunner.query(`ALTER TABLE "abuse_user_report" ADD "targetUserId" character varying(32) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "abuse_user_report" ADD "assigneeId" character varying(32)`);
        await queryRunner.query(`ALTER TABLE "abuse_user_report" ADD "resolved" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "abuse_user_report" DROP COLUMN "comment"`);
        await queryRunner.query(`ALTER TABLE "abuse_user_report" ADD "comment" character varying(2048) NOT NULL`);
        await queryRunner.query(`CREATE INDEX "IDX_a9021cc2e1feb5f72d3db6e9f5" ON "abuse_user_report" ("targetUserId") `);
        await queryRunner.query(`CREATE INDEX "IDX_2b15aaf4a0dc5be3499af7ab6a" ON "abuse_user_report" ("resolved") `);
        await queryRunner.query(`ALTER TABLE "abuse_user_report" ADD CONSTRAINT "FK_a9021cc2e1feb5f72d3db6e9f5f" FOREIGN KEY ("targetUserId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "abuse_user_report" ADD CONSTRAINT "FK_08b883dd5fdd6f9c4c1572b36de" FOREIGN KEY ("assigneeId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "abuse_user_report" DROP CONSTRAINT "FK_08b883dd5fdd6f9c4c1572b36de"`);
        await queryRunner.query(`ALTER TABLE "abuse_user_report" DROP CONSTRAINT "FK_a9021cc2e1feb5f72d3db6e9f5f"`);
        await queryRunner.query(`DROP INDEX "IDX_2b15aaf4a0dc5be3499af7ab6a"`);
        await queryRunner.query(`DROP INDEX "IDX_a9021cc2e1feb5f72d3db6e9f5"`);
        await queryRunner.query(`ALTER TABLE "abuse_user_report" DROP COLUMN "comment"`);
        await queryRunner.query(`ALTER TABLE "abuse_user_report" ADD "comment" character varying(512) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "abuse_user_report" DROP COLUMN "resolved"`);
        await queryRunner.query(`ALTER TABLE "abuse_user_report" DROP COLUMN "assigneeId"`);
        await queryRunner.query(`ALTER TABLE "abuse_user_report" DROP COLUMN "targetUserId"`);
        await queryRunner.query(`ALTER TABLE "abuse_user_report" ADD "userId" character varying(32) NOT NULL`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_5cd442c3b2e74fdd99dae20243" ON "abuse_user_report" ("userId", "reporterId") `);
        await queryRunner.query(`CREATE INDEX "IDX_d049123c413e68ca52abe73420" ON "abuse_user_report" ("userId") `);
        await queryRunner.query(`ALTER TABLE "abuse_user_report" ADD CONSTRAINT "FK_d049123c413e68ca52abe734203" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
