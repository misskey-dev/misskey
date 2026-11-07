/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class driveCapacityOverrideMb1655813815729 {
    name = 'driveCapacityOverrideMb1655813815729'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user" ADD "driveCapacityOverrideMb" integer`);
        await queryRunner.query(`COMMENT ON COLUMN "user"."driveCapacityOverrideMb" IS 'Overrides user drive capacity limit'`);
    }

    async down(queryRunner) {
        await queryRunner.query(`COMMENT ON COLUMN "user"."driveCapacityOverrideMb" IS 'Overrides user drive capacity limit'`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "driveCapacityOverrideMb"`);
    }
}
