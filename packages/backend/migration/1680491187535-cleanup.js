export class cleanup1680491187535 {
    name = 'cleanup1680491187535'

    async up(queryRunner) {
        await queryRunner.query(`DROP TABLE "antenna_note" `);
    }

    async down(queryRunner) {
    }
}
