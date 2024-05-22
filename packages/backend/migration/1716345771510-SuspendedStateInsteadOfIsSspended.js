/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class SuspendedStateInsteadOfIsSspended1716345771510 {
    name = 'SuspendedStateInsteadOfIsSspended1716345771510'

    async up(queryRunner) {
        await queryRunner.query(`CREATE TYPE "public"."instance_suspendedstate_enum" AS ENUM('none', 'manuallySuspended', 'goneSuspended', 'autoSuspendedForNotResponding')`);

        await queryRunner.query(`DROP INDEX "public"."IDX_34500da2e38ac393f7bb6b299c"`);

        await queryRunner.query(`ALTER TABLE "instance" RENAME COLUMN "isSuspended" TO "suspendedState"`);

        await queryRunner.query(`ALTER TABLE "instance" ALTER COLUMN "suspendedState" DROP DEFAULT`);

        await queryRunner.query(`ALTER TABLE "instance" ALTER COLUMN "suspendedState" TYPE "public"."instance_suspendedstate_enum" USING (
            CASE "suspendedState"
               WHEN TRUE THEN 'manuallySuspended'::instance_suspendedstate_enum
               ELSE 'none'::instance_suspendedstate_enum
            END
        )`);
        //await queryRunner.query(`ALTER TABLE "instance" ALTER COLUMN "suspendedState" TYPE "public"."instance_suspendedstate_enum" USING "suspendedState"::instance_suspendedstate_enum`);

        await queryRunner.query(`ALTER TABLE "instance" ALTER COLUMN "suspendedState" SET DEFAULT 'none'`);

        await queryRunner.query(`CREATE INDEX "IDX_f6d861bb95acd4639c5015d00c" ON "instance" ("suspendedState") `);
    }

    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX "public"."IDX_f6d861bb95acd4639c5015d00c"`);

        await queryRunner.query(`ALTER TABLE "instance" ALTER COLUMN "suspendedState" DROP DEFAULT`);

//        await queryRunner.query(`ALTER TABLE "instance" ALTER COLUMN "suspendedState" TYPE boolean`);
        await queryRunner.query(`ALTER TABLE "instance" ALTER COLUMN "suspendedState" TYPE boolean USING (
            CASE "suspendedState"
               WHEN 'none'::instance_suspendedstate_enum THEN FALSE
               ELSE TRUE
            END
        )`);

        await queryRunner.query(`ALTER TABLE "instance" ALTER COLUMN "suspendedState" SET DEFAULT false`);

        await queryRunner.query(`ALTER TABLE "instance" RENAME COLUMN "suspendedState" TO "isSuspended"`);

        await queryRunner.query(`CREATE INDEX "IDX_34500da2e38ac393f7bb6b299c" ON "instance" ("isSuspended") `);

        await queryRunner.query(`DROP TYPE "public"."instance_suspendedstate_enum"`);
    }
}
