/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class RevertHardMute1700880703631 {
	name = 'RevertHardMute1700880703631';

	async up(queryRunner) {
		// migrate hardMutedWords to mutedWords
		await queryRunner.query(`
			update "user_profile"
			set "mutedWords" = (
				select jsonb_agg(elem order by ord)
				from (
					select elem, ord
					from (
						select elem, row_number() over () as ord
						from jsonb_array_elements("mutedWords") as elem
					) as muted
					union
					select elem, 1000000 + row_number() over ()
					from jsonb_array_elements("hardMutedWords") as elem
					where elem not in (select jsonb_array_elements("mutedWords"))
				) as combined
			)
			where "hardMutedWords" <> '[]'
		`);
		await queryRunner.query(`ALTER TABLE "user_profile" DROP COLUMN "hardMutedWords"`);
	}

	async down(queryRunner) {
		await queryRunner.query(`ALTER TABLE "user_profile" ADD "hardMutedWords" jsonb NOT NULL DEFAULT '[]'`);
	}
}
