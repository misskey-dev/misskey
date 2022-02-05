const RE2 = require('re2');
const { MigrationInterface, QueryRunner } = require("typeorm");

module.exports = class convertHardMutes1644010796173 {
    name = 'convertHardMutes1644010796173'

    async up(queryRunner) {
        (await queryRunner.query(`SELECT "userId", "mutedWords" FROM "user_profile"`)).forEach(entry => {
                let words = entry.mutedWords
                        .map(line => {
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

                queryRunner.query(`UPDATE "user_profile" SET "mutedWords" = '${JSON.stringify(words)}'::jsonb WHERE "userId" = '${entry.userId}'`);
        });
    }

    async down(queryRunner) {
        (await queryRunner.query(`SELECT "userId", "mutedWords" FROM "user_profile"`)).forEach(entry => {
                let words = entry.mutedWords
                        .map(line => {
                                if (Array.isArray(line)) {
                                        return line;
                                } else {
                                        return line.split(" ");
                                }
                        })
                        // remove empty lines
                        .filter(x => !(Array.isArray(x) && x.length === 0));

                queryRunner.query(`UPDATE "user_profile" SET "mutedWords" = '${JSON.stringify(words)}'::jsonb WHERE "userId" = '${entry.userId}'`);
        });
    }
}
