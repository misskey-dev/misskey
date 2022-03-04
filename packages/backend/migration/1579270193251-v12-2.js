

export class v1221579270193251 {
    constructor() {
        this.name = 'v1221579270193251';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "announcement_read" ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL`, undefined);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "announcement_read" DROP COLUMN "createdAt"`, undefined);
    }
}
