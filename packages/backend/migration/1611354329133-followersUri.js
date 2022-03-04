

export class followersUri1611354329133 {
    constructor() {
        this.name = 'followersUri1611354329133';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user" ADD "followersUri" varchar(512) DEFAULT NULL`);
        await queryRunner.query(`COMMENT ON COLUMN "user"."followersUri" IS 'The URI of the user Follower Collection. It will be null if the origin of the user is local.'`);
    }
    async down(queryRunner) {
        await queryRunner.query(`COMMENT ON COLUMN "user"."followersUri" IS 'The URI of the user Follower Collection. It will be null if the origin of the user is local.'`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "followersUri"`);
    }
}
