

export class isUserDeleted1629512953000 {
    constructor() {
        this.name = 'isUserDeleted1629512953000';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user" ADD "isDeleted" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`COMMENT ON COLUMN "user"."isDeleted" IS 'Whether the User is deleted.'`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "isDeleted"`);
    }
}
