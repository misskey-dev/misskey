export class Proxycheckio1707888646527 {
    name = 'Proxycheckio1707888646527'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" ADD "enableProxyCheckio" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "meta" ADD "proxyCheckioApiKey" character varying(32)`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "proxyCheckioApiKey"`);
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "enableProxyCheckio"`);
    }
}
