

export class instanceFavicon1603781553011 {
    constructor() {
        this.name = 'instanceFavicon1603781553011';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "instance" ADD "faviconUrl" character varying(256) DEFAULT null`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "instance" DROP COLUMN "faviconUrl"`);
    }
}
