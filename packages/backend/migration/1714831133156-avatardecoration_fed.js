export class AvatardecorationFed1714831133156 {
    name = 'AvatardecorationFed1714831133156'

    async up(queryRunner) {
			await queryRunner.query(`ALTER TABLE "avatar_decoration" DROP COLUMN "host"`);
    }

    async down(queryRunner) {
			await queryRunner.query(`ALTER TABLE "avatar_decoration" ADD "host" character varying(256)`);
    }
}
