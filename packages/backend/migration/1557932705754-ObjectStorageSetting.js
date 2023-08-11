

export class ObjectStorageSetting1557932705754 {
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" ADD "useObjectStorage" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "meta" ADD "objectStorageBucket" character varying(512)`);
        await queryRunner.query(`ALTER TABLE "meta" ADD "objectStoragePrefix" character varying(512)`);
        await queryRunner.query(`ALTER TABLE "meta" ADD "objectStorageBaseUrl" character varying(512)`);
        await queryRunner.query(`ALTER TABLE "meta" ADD "objectStorageEndpoint" character varying(512)`);
        await queryRunner.query(`ALTER TABLE "meta" ADD "objectStorageRegion" character varying(512)`);
        await queryRunner.query(`ALTER TABLE "meta" ADD "objectStorageAccessKey" character varying(512)`);
        await queryRunner.query(`ALTER TABLE "meta" ADD "objectStorageSecretKey" character varying(512)`);
        await queryRunner.query(`ALTER TABLE "meta" ADD "objectStoragePort" integer`);
        await queryRunner.query(`ALTER TABLE "meta" ADD "objectStorageUseSSL" boolean NOT NULL DEFAULT true`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "objectStorageUseSSL"`);
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "objectStoragePort"`);
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "objectStorageSecretKey"`);
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "objectStorageAccessKey"`);
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "objectStorageRegion"`);
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "objectStorageEndpoint"`);
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "objectStorageBaseUrl"`);
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "objectStoragePrefix"`);
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "objectStorageBucket"`);
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "useObjectStorage"`);
    }
}
