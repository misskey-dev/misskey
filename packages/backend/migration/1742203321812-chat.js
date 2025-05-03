/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class Chat1742203321812 {
    name = 'Chat1742203321812'

    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE "chat_room" ("id" character varying(32) NOT NULL, "name" character varying(256) NOT NULL, "ownerId" character varying(32) NOT NULL, CONSTRAINT "PK_8aa3a52cf74c96469f0ef9fbe3e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_f0d8ad64243fa2ca2800da0dfd" ON "chat_room" ("ownerId") `);
        await queryRunner.query(`CREATE TABLE "chat_message" ("id" character varying(32) NOT NULL, "fromUserId" character varying(32) NOT NULL, "toUserId" character varying(32), "toRoomId" character varying(32), "text" character varying(4096), "uri" character varying(512), "reads" character varying(32) array NOT NULL DEFAULT '{}', "fileId" character varying(32), "reactions" character varying(1024) array NOT NULL DEFAULT '{}', CONSTRAINT "PK_3cc0d85193aade457d3077dd06b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_79a26e7a4d9afa5e4fc05f134e" ON "chat_message" ("fromUserId") `);
        await queryRunner.query(`CREATE INDEX "IDX_25e097b51d7622c249452c6f75" ON "chat_message" ("toUserId") `);
        await queryRunner.query(`CREATE INDEX "IDX_f006b8a76efd1abf9f221c175c" ON "chat_message" ("toRoomId") `);
        await queryRunner.query(`CREATE TABLE "chat_room_membership" ("id" character varying(32) NOT NULL, "userId" character varying(32) NOT NULL, "roomId" character varying(32) NOT NULL, CONSTRAINT "PK_2bd59c741e571b283c048beb69a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_d99c5279460fb77ef58c596ce5" ON "chat_room_membership" ("userId") `);
        await queryRunner.query(`CREATE INDEX "IDX_c25143ebab714e930aeca1c0e8" ON "chat_room_membership" ("roomId") `);
        await queryRunner.query(`ALTER TABLE "chat_room" ADD CONSTRAINT "FK_f0d8ad64243fa2ca2800da0dfd6" FOREIGN KEY ("ownerId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "chat_message" ADD CONSTRAINT "FK_79a26e7a4d9afa5e4fc05f134ed" FOREIGN KEY ("fromUserId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "chat_message" ADD CONSTRAINT "FK_25e097b51d7622c249452c6f757" FOREIGN KEY ("toUserId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "chat_message" ADD CONSTRAINT "FK_f006b8a76efd1abf9f221c175ce" FOREIGN KEY ("toRoomId") REFERENCES "chat_room"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "chat_message" ADD CONSTRAINT "FK_fd0f9a4879430239715ad4f8e2a" FOREIGN KEY ("fileId") REFERENCES "drive_file"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "chat_room_membership" ADD CONSTRAINT "FK_d99c5279460fb77ef58c596ce51" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "chat_room_membership" ADD CONSTRAINT "FK_c25143ebab714e930aeca1c0e8d" FOREIGN KEY ("roomId") REFERENCES "chat_room"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "chat_room_membership" DROP CONSTRAINT "FK_c25143ebab714e930aeca1c0e8d"`);
        await queryRunner.query(`ALTER TABLE "chat_room_membership" DROP CONSTRAINT "FK_d99c5279460fb77ef58c596ce51"`);
        await queryRunner.query(`ALTER TABLE "chat_message" DROP CONSTRAINT "FK_fd0f9a4879430239715ad4f8e2a"`);
        await queryRunner.query(`ALTER TABLE "chat_message" DROP CONSTRAINT "FK_f006b8a76efd1abf9f221c175ce"`);
        await queryRunner.query(`ALTER TABLE "chat_message" DROP CONSTRAINT "FK_25e097b51d7622c249452c6f757"`);
        await queryRunner.query(`ALTER TABLE "chat_message" DROP CONSTRAINT "FK_79a26e7a4d9afa5e4fc05f134ed"`);
        await queryRunner.query(`ALTER TABLE "chat_room" DROP CONSTRAINT "FK_f0d8ad64243fa2ca2800da0dfd6"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c25143ebab714e930aeca1c0e8"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d99c5279460fb77ef58c596ce5"`);
        await queryRunner.query(`DROP TABLE "chat_room_membership"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f006b8a76efd1abf9f221c175c"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_25e097b51d7622c249452c6f75"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_79a26e7a4d9afa5e4fc05f134e"`);
        await queryRunner.query(`DROP TABLE "chat_message"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f0d8ad64243fa2ca2800da0dfd"`);
        await queryRunner.query(`DROP TABLE "chat_room"`);
    }
}
