export class SplitAppleTouchIcon1688457225937 {
    name = 'SplitAppleTouchIcon1688457225937'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" ADD "appleTouchIconUrl" character varying(1024)`);
		}

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "appleTouchIconUrl"`);
    }
}
