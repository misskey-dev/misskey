

export class userLang1613181457597 {
    constructor() {
        this.name = 'userLang1613181457597';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user_profile" ADD "lang" character varying(32)`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user_profile" DROP COLUMN "lang"`);
    }
}
