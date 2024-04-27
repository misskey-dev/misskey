/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import RE2 from 're2';

export class convertHardMutes1644010796173 {
    name = 'convertHardMutes1644010796173'

    async up(queryRunner) {
        let entries = await queryRunner.query(`SELECT "userId", "mutedWords" FROM "user_profile" WHERE "userHost" IS NULL`);
        for(let i = 0; i < entries.length; i++) {
            let words = entries[i].mutedWords
                .map(line => {
										if (typeof line === 'string') return [];
                    const regexp = line.join(" ").match(/^\/(.+)\/(.*)$/);
                    if (regexp) {
                        // convert regexp's
                        try {
                            new RE2(regexp[1], regexp[2]);
                            return `/${regexp[1]}/${regexp[2]}`;
                        } catch (err) {
                            // invalid regex, ignore it
                            return [];
                        }
                    } else {
                        // remove empty segments
                        return line.filter(x => x !== '');
                    }
                })
                // remove empty lines
                .filter(x => !(Array.isArray(x) && x.length === 0));

            await queryRunner.connection.createQueryBuilder()
                .update('user_profile')
                .set({
                    mutedWords: words
                })
                .where('userId = :id', { id: entries[i].userId })
                .execute();
        }
    }

    async down(queryRunner) {
        let entries = await queryRunner.query(`SELECT "userId", "mutedWords" FROM "user_profile"`);
        for(let i = 0; i < entries.length; i++) {
            let words = entries[i].mutedWords
                .map(line => {
                    if (Array.isArray(line)) {
                        return line;
                    } else {
                    	// do not split regex at spaces again
                        return [line];
                    }
                })
                // remove empty lines
                .filter(x => !(Array.isArray(x) && x.length === 0));

            await queryRunner.connection.createQueryBuilder()
                .update('user_profile')
                .set({
                    mutedWords: words
                })
                .where('userId = :id', { id: entries[i].userId })
                .execute();
        }
    }
}
