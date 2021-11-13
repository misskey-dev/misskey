"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class nodeinfo1572760203493 {
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "instance" DROP COLUMN "system"`, undefined);
        await queryRunner.query(`ALTER TABLE "instance" ADD "softwareName" character varying(64) DEFAULT null`, undefined);
        await queryRunner.query(`ALTER TABLE "instance" ADD "softwareVersion" character varying(64) DEFAULT null`, undefined);
        await queryRunner.query(`ALTER TABLE "instance" ADD "openRegistrations" boolean DEFAULT null`, undefined);
        await queryRunner.query(`ALTER TABLE "instance" ADD "name" character varying(256) DEFAULT null`, undefined);
        await queryRunner.query(`ALTER TABLE "instance" ADD "description" character varying(4096) DEFAULT null`, undefined);
        await queryRunner.query(`ALTER TABLE "instance" ADD "maintainerName" character varying(128) DEFAULT null`, undefined);
        await queryRunner.query(`ALTER TABLE "instance" ADD "maintainerEmail" character varying(256) DEFAULT null`, undefined);
        await queryRunner.query(`ALTER TABLE "instance" ADD "infoUpdatedAt" TIMESTAMP WITH TIME ZONE`, undefined);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "instance" DROP COLUMN "infoUpdatedAt"`, undefined);
        await queryRunner.query(`ALTER TABLE "instance" DROP COLUMN "maintainerEmail"`, undefined);
        await queryRunner.query(`ALTER TABLE "instance" DROP COLUMN "maintainerName"`, undefined);
        await queryRunner.query(`ALTER TABLE "instance" DROP COLUMN "description"`, undefined);
        await queryRunner.query(`ALTER TABLE "instance" DROP COLUMN "name"`, undefined);
        await queryRunner.query(`ALTER TABLE "instance" DROP COLUMN "openRegistrations"`, undefined);
        await queryRunner.query(`ALTER TABLE "instance" DROP COLUMN "softwareVersion"`, undefined);
        await queryRunner.query(`ALTER TABLE "instance" DROP COLUMN "softwareName"`, undefined);
        await queryRunner.query(`ALTER TABLE "instance" ADD "system" character varying(64)`, undefined);
    }
}
exports.nodeinfo1572760203493 = nodeinfo1572760203493;
