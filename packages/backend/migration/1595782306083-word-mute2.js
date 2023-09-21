

export class wordMute21595782306083 {
    constructor() {
        this.name = 'wordMute21595782306083';
    }
    async up(queryRunner) {
        await queryRunner.query(`CREATE TYPE "muted_note_reason_enum" AS ENUM('word', 'manual', 'spam', 'other')`);
        await queryRunner.query(`ALTER TABLE "muted_note" ADD "reason" "muted_note_reason_enum" NOT NULL`);
        await queryRunner.query(`CREATE INDEX "IDX_636e977ff90b23676fb5624b25" ON "muted_note" ("reason") `);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX "IDX_636e977ff90b23676fb5624b25"`);
        await queryRunner.query(`ALTER TABLE "muted_note" DROP COLUMN "reason"`);
        await queryRunner.query(`DROP TYPE "muted_note_reason_enum"`);
    }
}
