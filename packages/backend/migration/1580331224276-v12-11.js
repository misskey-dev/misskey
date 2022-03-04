

export class v12111580331224276 {
    constructor() {
        this.name = 'v12111580331224276';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "instance" DROP COLUMN "isMarkedAsClosed"`, undefined);
        await queryRunner.query(`ALTER TABLE "instance" ADD "isSuspended" boolean NOT NULL DEFAULT false`, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_34500da2e38ac393f7bb6b299c" ON "instance" ("isSuspended") `, undefined);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX "IDX_34500da2e38ac393f7bb6b299c"`, undefined);
        await queryRunner.query(`ALTER TABLE "instance" DROP COLUMN "isSuspended"`, undefined);
        await queryRunner.query(`ALTER TABLE "instance" ADD "isMarkedAsClosed" boolean NOT NULL DEFAULT false`, undefined);
    }
}
