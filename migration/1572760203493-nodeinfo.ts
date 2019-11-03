import {MigrationInterface, QueryRunner} from "typeorm";

export class nodeinfo1572760203493 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "instance" DROP COLUMN "system"`, undefined);
        await queryRunner.query(`ALTER TABLE "instance" ADD "softwareName" character varying(64) DEFAULT null`, undefined);
        await queryRunner.query(`ALTER TABLE "instance" ADD "softwareVersion" character varying(64) DEFAULT null`, undefined);
        await queryRunner.query(`ALTER TABLE "instance" ADD "openRegistrations" boolean DEFAULT null`, undefined);
        await queryRunner.query(`ALTER TABLE "instance" ADD "metadata" jsonb DEFAULT null`, undefined);
        await queryRunner.query(`ALTER TABLE "instance" ADD "name" character varying(256) DEFAULT null`, undefined);
        await queryRunner.query(`ALTER TABLE "instance" ADD "description" character varying(4096) DEFAULT null`, undefined);
        await queryRunner.query(`ALTER TABLE "instance" ADD "maintainerName" character varying(128) DEFAULT null`, undefined);
        await queryRunner.query(`ALTER TABLE "instance" ADD "maintainerEmail" character varying(256) DEFAULT null`, undefined);
        await queryRunner.query(`ALTER TABLE "instance" ADD "infoUpdatedAt" TIMESTAMP WITH TIME ZONE`, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_c612de9031e0cc2cf77c2f6960" ON "instance" ("usersCount") `, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_9b5623babcdf9fb8dde78b4c45" ON "instance" ("notesCount") `, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_8261c0ab39a2088213bc17c14a" ON "instance" ("followingCount") `, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_b80d901e40fdef5e8a7ca7a183" ON "instance" ("followersCount") `, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_ffc1dcc92bfb4b8f7bc1bd3d55" ON "instance" ("driveUsage") `, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_0bca62062c3bf31b149d3ec0fe" ON "instance" ("driveFiles") `, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_16ca857fba8953a6e1473e1c0f" ON "instance" ("latestRequestSentAt") `, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_b8301ce78c9f04d6ad3b86acdd" ON "instance" ("latestRequestReceivedAt") `, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_11d6ef7d9f44165dba84b3260c" ON "instance" ("lastCommunicatedAt") `, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_b37cb1ae4e076dcc2e61b5dbba" ON "instance" ("isNotResponding") `, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_72afec01225081630253aeb977" ON "instance" ("isMarkedAsClosed") `, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_a376720fec48b4a0f21dbe3893" ON "instance" ("softwareName") `, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_905626c43e64b672b39ef46346" ON "instance" ("softwareVersion") `, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_3c43f1da59f99e6e50f2b69678" ON "instance" ("infoUpdatedAt") `, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`DROP INDEX "IDX_90148bbc2bf0854428786bfc15"`, undefined);
        await queryRunner.query(`DROP INDEX "IDX_3c43f1da59f99e6e50f2b69678"`, undefined);
        await queryRunner.query(`DROP INDEX "IDX_905626c43e64b672b39ef46346"`, undefined);
        await queryRunner.query(`DROP INDEX "IDX_a376720fec48b4a0f21dbe3893"`, undefined);
        await queryRunner.query(`DROP INDEX "IDX_72afec01225081630253aeb977"`, undefined);
        await queryRunner.query(`DROP INDEX "IDX_b37cb1ae4e076dcc2e61b5dbba"`, undefined);
        await queryRunner.query(`DROP INDEX "IDX_11d6ef7d9f44165dba84b3260c"`, undefined);
        await queryRunner.query(`DROP INDEX "IDX_b8301ce78c9f04d6ad3b86acdd"`, undefined);
        await queryRunner.query(`DROP INDEX "IDX_16ca857fba8953a6e1473e1c0f"`, undefined);
        await queryRunner.query(`DROP INDEX "IDX_0bca62062c3bf31b149d3ec0fe"`, undefined);
        await queryRunner.query(`DROP INDEX "IDX_ffc1dcc92bfb4b8f7bc1bd3d55"`, undefined);
        await queryRunner.query(`DROP INDEX "IDX_b80d901e40fdef5e8a7ca7a183"`, undefined);
        await queryRunner.query(`DROP INDEX "IDX_8261c0ab39a2088213bc17c14a"`, undefined);
        await queryRunner.query(`DROP INDEX "IDX_9b5623babcdf9fb8dde78b4c45"`, undefined);
        await queryRunner.query(`DROP INDEX "IDX_c612de9031e0cc2cf77c2f6960"`, undefined);
        await queryRunner.query(`ALTER TABLE "instance" DROP COLUMN "infoUpdatedAt"`, undefined);
        await queryRunner.query(`ALTER TABLE "instance" DROP COLUMN "maintainerEmail"`, undefined);
        await queryRunner.query(`ALTER TABLE "instance" DROP COLUMN "maintainerName"`, undefined);
        await queryRunner.query(`ALTER TABLE "instance" DROP COLUMN "description"`, undefined);
        await queryRunner.query(`ALTER TABLE "instance" DROP COLUMN "name"`, undefined);
        await queryRunner.query(`ALTER TABLE "instance" DROP COLUMN "metadata"`, undefined);
        await queryRunner.query(`ALTER TABLE "instance" DROP COLUMN "openRegistrations"`, undefined);
        await queryRunner.query(`ALTER TABLE "instance" DROP COLUMN "softwareVersion"`, undefined);
        await queryRunner.query(`ALTER TABLE "instance" DROP COLUMN "softwareName"`, undefined);
        await queryRunner.query(`ALTER TABLE "instance" ADD "system" character varying(64)`, undefined);
    }

}
