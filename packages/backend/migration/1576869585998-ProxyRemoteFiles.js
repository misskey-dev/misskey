

export class ProxyRemoteFiles1576869585998 {
    constructor() {
        this.name = 'ProxyRemoteFiles1576869585998';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" ADD "proxyRemoteFiles" boolean NOT NULL DEFAULT false`, undefined);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "proxyRemoteFiles"`, undefined);
    }
}
