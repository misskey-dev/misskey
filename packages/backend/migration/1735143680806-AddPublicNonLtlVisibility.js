/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class AddPublicNonLtlVisibility1735143680806 {
    name = 'AddPublicNonLtlVisibility1735143680806'

    async up(queryRunner) {
      //Noteのvisibilityにpublic_non_ltlを追加
			await queryRunner.query(`ALTER TYPE "note_visibility_enum" ADD VALUE 'public_non_ltl'`);
    }

    async down(queryRunner) {
			//visibilityがpublic_non_ltlのNoteをvisibility: homeに変更
			await queryRunner.query(`UPDATE notes SET visibility = 'home' WHERE visibility = 'public_non_ltl'`);

			//Noteのvisibilityからpublic_non_ltlを削除
			await queryRunner.query(`ALTER TYPE "note_visibility_enum" DROP VALUE 'public_non_ltl'`);
    }
}
