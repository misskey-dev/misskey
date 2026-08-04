/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class Chat41742707840715 {
    name = 'Chat41742707840715'

    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE "chat_room_invitation" ("id" character varying(32) NOT NULL, "userId" character varying(32) NOT NULL, "roomId" character varying(32) NOT NULL, CONSTRAINT "PK_9d489521a312dd28225672de2dc" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_8552bb38e7ed038c5bdd398a38" ON "chat_room_invitation" ("userId") `);
        await queryRunner.query(`CREATE INDEX "IDX_5f265075b215fc390a57523b12" ON "chat_room_invitation" ("roomId") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_044f2a7962b8ee5bbfaa02e8a3" ON "chat_room_invitation" ("userId", "roomId") `);
        await queryRunner.query(`ALTER TABLE "chat_room_invitation" ADD CONSTRAINT "FK_8552bb38e7ed038c5bdd398a384" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "chat_room_invitation" ADD CONSTRAINT "FK_5f265075b215fc390a57523b12a" FOREIGN KEY ("roomId") REFERENCES "chat_room"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "chat_room_invitation" DROP CONSTRAINT "FK_5f265075b215fc390a57523b12a"`);
        await queryRunner.query(`ALTER TABLE "chat_room_invitation" DROP CONSTRAINT "FK_8552bb38e7ed038c5bdd398a384"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_044f2a7962b8ee5bbfaa02e8a3"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_5f265075b215fc390a57523b12"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8552bb38e7ed038c5bdd398a38"`);
        await queryRunner.query(`DROP TABLE "chat_room_invitation"`);
    }
}
