/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class SuspensionStateInsteadOfIsSspended1716345771510 {
    name = 'SuspensionStateInsteadOfIsSspended1716345771510'

    async up(queryRunner) {
        await queryRunner.query(`CREATE TYPE "public"."instance_suspensionstate_enum" AS ENUM('none', 'manuallySuspended', 'goneSuspended', 'autoSuspendedForNotResponding')`);

        await queryRunner.query(`DROP INDEX "public"."IDX_34500da2e38ac393f7bb6b299c"`);

        await queryRunner.query(`ALTER TABLE "instance" RENAME COLUMN "isSuspended" TO "suspensionState"`);

        await queryRunner.query(`ALTER TABLE "instance" ALTER COLUMN "suspensionState" DROP DEFAULT`);

        await queryRunner.query(`ALTER TABLE "instance" ALTER COLUMN "suspensionState" TYPE "public"."instance_suspensionstate_enum" USING (
            CASE "suspensionState"
               WHEN TRUE THEN 'manuallySuspended'::instance_suspensionstate_enum
               ELSE 'none'::instance_suspensionstate_enum
            END
        )`);

        await queryRunner.query(`ALTER TABLE "instance" ALTER COLUMN "suspensionState" SET DEFAULT 'none'`);

        await queryRunner.query(`CREATE INDEX "IDX_3ede46f507c87ad698051d56a8" ON "instance" ("suspensionState") `);
    }

    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX "public"."IDX_3ede46f507c87ad698051d56a8"`);

        await queryRunner.query(`ALTER TABLE "instance" ALTER COLUMN "suspensionState" DROP DEFAULT`);

        await queryRunner.query(`ALTER TABLE "instance" ALTER COLUMN "suspensionState" TYPE boolean USING (
            CASE "suspensionState"
               WHEN 'none'::instance_suspensionstate_enum THEN FALSE
               ELSE TRUE
            END
        )`);

        await queryRunner.query(`ALTER TABLE "instance" ALTER COLUMN "suspensionState" SET DEFAULT false`);

        await queryRunner.query(`ALTER TABLE "instance" RENAME COLUMN "suspensionState" TO "isSuspended"`);

        await queryRunner.query(`CREATE INDEX "IDX_34500da2e38ac393f7bb6b299c" ON "instance" ("isSuspended") `);

        await queryRunner.query(`DROP TYPE "public"."instance_suspensionstate_enum"`);
    }
}
