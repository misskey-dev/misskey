export class HardMuteAndSoftMuteFromRegistory1700906353915 {
    async up(queryRunner) {
			// until 2023.9.3-kinel.4, `mutedWords` means hard muted words
			// since 2023.11.1-kinel.1, `mutedWords` means soft muted words and `hardMutedWords` means hard muted words
			// so migrate hard muted words to `hardMutedWords`
			await queryRunner.query(`UPDATE "user_profile" SET "hardMutedWords" = "mutedWords";`);

			// then, migrate soft muted words from registry
			let entries = await queryRunner.query(
				`SELECT "userId", "value" FROM "registry_item"
               WHERE "registry_item"."domain" IS NULL
               AND "registry_item"."key" = $1
               AND "registry_item"."scope" = $2;`,
				['mutedWords', ['client', 'base']]);

			for (let entry of entries) {
				await queryRunner.query(`UPDATE "user_profile" SET "mutedWords" = $1 WHERE "user_profile"."userId" = $2;`,
					[JSON.stringify(entry.value), entry.userId]);
			}
    }

    async down(queryRunner) {
			const entries = await queryRunner.query(`SELECT "userId", "mutedWords" FROM "user_profile";`);
			for (let entry of entries) {
				let existingEntry = await queryRunner.query(
					`SELECT "id", "userId", "value" FROM "registry_item"
               WHERE "registry_item"."domain" IS NULL
                 AND "registry_item"."key" = $1
								 AND "registry_item"."scope" = $2
								 AND "registry_item"."userId" = $3;`,
					['mutedWords', ['client', 'base'], entry.userId]);

				if (existingEntry.length > 0) {
					await queryRunner.connection.createQueryBuilder()
						.update('registry_item')
						.set({ value: entry.mutedWords })
						.where('id = :id', { id: existingEntry[0].id })
						.execute();
				} else {
					await queryRunner.connection.createQueryBuilder()
						.insert()
						.into('registry_item')
						.values({
							key: 'mutedWords',
							scope: ['client', 'base'],
							userId: entry.userId,
							domain: null,
							value: entry.mutedWords
						})
						.execute();
				}
			}

			await queryRunner.query(`UPDATE "user_profile" SET "mutedWords" = "hardMutedWords";`);
    }
}
