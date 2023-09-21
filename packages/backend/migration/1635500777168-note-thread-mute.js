/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class noteThreadMute1635500777168 {
    constructor() {
        this.name = 'noteThreadMute1635500777168';
    }
    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE "note_thread_muting" ("id" character varying(32) NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL, "userId" character varying(32) NOT NULL, "threadId" character varying(256) NOT NULL, CONSTRAINT "PK_ec5936d94d1a0369646d12a3a47" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_29c11c7deb06615076f8c95b80" ON "note_thread_muting" ("userId") `);
        await queryRunner.query(`CREATE INDEX "IDX_c426394644267453e76f036926" ON "note_thread_muting" ("threadId") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_ae7aab18a2641d3e5f25e0c4ea" ON "note_thread_muting" ("userId", "threadId") `);
        await queryRunner.query(`ALTER TABLE "note" ADD "threadId" character varying(256)`);
        await queryRunner.query(`CREATE INDEX "IDX_d4ebdef929896d6dc4a3c5bb48" ON "note" ("threadId") `);
        await queryRunner.query(`ALTER TABLE "note_thread_muting" ADD CONSTRAINT "FK_29c11c7deb06615076f8c95b80a" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "note_thread_muting" DROP CONSTRAINT "FK_29c11c7deb06615076f8c95b80a"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d4ebdef929896d6dc4a3c5bb48"`);
        await queryRunner.query(`ALTER TABLE "note" DROP COLUMN "threadId"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ae7aab18a2641d3e5f25e0c4ea"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c426394644267453e76f036926"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_29c11c7deb06615076f8c95b80"`);
        await queryRunner.query(`DROP TABLE "note_thread_muting"`);
    }
}
