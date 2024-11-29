export class  AddIsNoteInHanaModeColumnToMiNote1723664940877 {
  name = 'AddIsNoteInHanaModeColumnToMiNote1723664940877'

  async up(queryRunner) {
    await queryRunner.query(`ALTER TABLE "note" ADD "isNoteInHanaMode" boolean NOT NULL DEFAULT false`);
  }

  async down(queryRunner) {
    await queryRunner.query(`ALTER TABLE "note" DROP COLUMN "isNoteInHanaMode"`);
  }
}
