export class UpdateNoteReactionsUniqueConstraint1710499309897 {
  name = 'UpdateNoteReactionsUniqueConstraint1710499309897'

  async up(queryRunner){
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_note_reaction_user_note_reaction" ON "note_reaction" ("userId", "noteId", "reaction")`);
    await queryRunner.query(`DROP INDEX "IDX_ad0c221b25672daf2df320a817"`);
  }

  async down(queryRunner){
    await queryRunner.query(`DROP INDEX "IDX_note_reaction_user_note_reaction"`);
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_ad0c221b25672daf2df320a817" ON "note_reaction" ("userId", "noteId")`);  }
}

