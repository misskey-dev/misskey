export class Hibernation1696331570827 {
    name = 'Hibernation1696331570827'

    async up(queryRunner) {
				await queryRunner.query(`DROP INDEX "public"."IDX_d74d8ab5efa7e3bb82825c0fa2"`);
        await queryRunner.query(`ALTER TABLE "user" ADD "isHibernated" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "following" ADD "isFollowerHibernated" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`CREATE INDEX "IDX_ce62b50d882d4e9dee10ad0d2f" ON "following" ("followeeId", "followerHost", "isFollowerHibernated") `);
    }

    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX "public"."IDX_ce62b50d882d4e9dee10ad0d2f"`);
        await queryRunner.query(`ALTER TABLE "following" DROP COLUMN "isFollowerHibernated"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "isHibernated"`);
        await queryRunner.query(`CREATE INDEX "IDX_d74d8ab5efa7e3bb82825c0fa2" ON "following" ("followeeId", "followerHost") `);
    }
}
