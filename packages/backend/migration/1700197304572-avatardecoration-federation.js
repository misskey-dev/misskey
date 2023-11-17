export class AvatardecorationFederation1700197304572 {
    name = 'AvatardecorationFederation1700197304572'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "avatar_decoration" ADD "localOnly" boolean NOT NULL DEFAULT false`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "avatar_decoration" DROP COLUMN "localOnly"`);
    }
}
