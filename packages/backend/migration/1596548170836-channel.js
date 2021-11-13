"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class channel1596548170836 {
    constructor() {
        this.name = 'channel1596548170836';
    }
    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE "channel" ("id" character varying(32) NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL, "lastNotedAt" TIMESTAMP WITH TIME ZONE, "userId" character varying(32) NOT NULL, "name" character varying(128) NOT NULL, "description" character varying(2048), "bannerId" character varying(32), "notesCount" integer NOT NULL DEFAULT 0, "usersCount" integer NOT NULL DEFAULT 0, CONSTRAINT "PK_590f33ee6ee7d76437acf362e39" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_71cb7b435b7c0d4843317e7e16" ON "channel" ("createdAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_29ef80c6f13bcea998447fce43" ON "channel" ("lastNotedAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_823bae55bd81b3be6e05cff438" ON "channel" ("userId") `);
        await queryRunner.query(`CREATE INDEX "IDX_0f58c11241e649d2a638a8de94" ON "channel" ("notesCount") `);
        await queryRunner.query(`CREATE INDEX "IDX_094b86cd36bb805d1aa1e8cc9a" ON "channel" ("usersCount") `);
        await queryRunner.query(`CREATE TABLE "channel_following" ("id" character varying(32) NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL, "followeeId" character varying(32) NOT NULL, "followerId" character varying(32) NOT NULL, CONSTRAINT "PK_8b104be7f7415113f2a02cd5bdd" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_11e71f2511589dcc8a4d3214f9" ON "channel_following" ("createdAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_0e43068c3f92cab197c3d3cd86" ON "channel_following" ("followeeId") `);
        await queryRunner.query(`CREATE INDEX "IDX_6d8084ec9496e7334a4602707e" ON "channel_following" ("followerId") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_2e230dd45a10e671d781d99f3e" ON "channel_following" ("followerId", "followeeId") `);
        await queryRunner.query(`CREATE TABLE "channel_note_pining" ("id" character varying(32) NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL, "channelId" character varying(32) NOT NULL, "noteId" character varying(32) NOT NULL, CONSTRAINT "PK_44f7474496bcf2e4b741681146d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_8125f950afd3093acb10d2db8a" ON "channel_note_pining" ("channelId") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_f36fed37d6d4cdcc68c803cd9c" ON "channel_note_pining" ("channelId", "noteId") `);
        await queryRunner.query(`ALTER TABLE "note" ADD "channelId" character varying(32) DEFAULT null`);
        await queryRunner.query(`CREATE INDEX "IDX_f22169eb10657bded6d875ac8f" ON "note" ("channelId") `);
        await queryRunner.query(`ALTER TABLE "channel" ADD CONSTRAINT "FK_823bae55bd81b3be6e05cff4383" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "channel" ADD CONSTRAINT "FK_999da2bcc7efadbfe0e92d3bc19" FOREIGN KEY ("bannerId") REFERENCES "drive_file"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "note" ADD CONSTRAINT "FK_f22169eb10657bded6d875ac8f9" FOREIGN KEY ("channelId") REFERENCES "channel"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "channel_following" ADD CONSTRAINT "FK_0e43068c3f92cab197c3d3cd86e" FOREIGN KEY ("followeeId") REFERENCES "channel"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "channel_following" ADD CONSTRAINT "FK_6d8084ec9496e7334a4602707e1" FOREIGN KEY ("followerId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "channel_note_pining" ADD CONSTRAINT "FK_8125f950afd3093acb10d2db8a8" FOREIGN KEY ("channelId") REFERENCES "channel"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "channel_note_pining" ADD CONSTRAINT "FK_10b19ef67d297ea9de325cd4502" FOREIGN KEY ("noteId") REFERENCES "note"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "channel_note_pining" DROP CONSTRAINT "FK_10b19ef67d297ea9de325cd4502"`);
        await queryRunner.query(`ALTER TABLE "channel_note_pining" DROP CONSTRAINT "FK_8125f950afd3093acb10d2db8a8"`);
        await queryRunner.query(`ALTER TABLE "channel_following" DROP CONSTRAINT "FK_6d8084ec9496e7334a4602707e1"`);
        await queryRunner.query(`ALTER TABLE "channel_following" DROP CONSTRAINT "FK_0e43068c3f92cab197c3d3cd86e"`);
        await queryRunner.query(`ALTER TABLE "note" DROP CONSTRAINT "FK_f22169eb10657bded6d875ac8f9"`);
        await queryRunner.query(`ALTER TABLE "channel" DROP CONSTRAINT "FK_999da2bcc7efadbfe0e92d3bc19"`);
        await queryRunner.query(`ALTER TABLE "channel" DROP CONSTRAINT "FK_823bae55bd81b3be6e05cff4383"`);
        await queryRunner.query(`DROP INDEX "IDX_f22169eb10657bded6d875ac8f"`);
        await queryRunner.query(`ALTER TABLE "note" DROP COLUMN "channelId"`);
        await queryRunner.query(`DROP INDEX "IDX_f36fed37d6d4cdcc68c803cd9c"`);
        await queryRunner.query(`DROP INDEX "IDX_8125f950afd3093acb10d2db8a"`);
        await queryRunner.query(`DROP TABLE "channel_note_pining"`);
        await queryRunner.query(`DROP INDEX "IDX_2e230dd45a10e671d781d99f3e"`);
        await queryRunner.query(`DROP INDEX "IDX_6d8084ec9496e7334a4602707e"`);
        await queryRunner.query(`DROP INDEX "IDX_0e43068c3f92cab197c3d3cd86"`);
        await queryRunner.query(`DROP INDEX "IDX_11e71f2511589dcc8a4d3214f9"`);
        await queryRunner.query(`DROP TABLE "channel_following"`);
        await queryRunner.query(`DROP INDEX "IDX_094b86cd36bb805d1aa1e8cc9a"`);
        await queryRunner.query(`DROP INDEX "IDX_0f58c11241e649d2a638a8de94"`);
        await queryRunner.query(`DROP INDEX "IDX_823bae55bd81b3be6e05cff438"`);
        await queryRunner.query(`DROP INDEX "IDX_29ef80c6f13bcea998447fce43"`);
        await queryRunner.query(`DROP INDEX "IDX_71cb7b435b7c0d4843317e7e16"`);
        await queryRunner.query(`DROP TABLE "channel"`);
    }
}
exports.channel1596548170836 = channel1596548170836;
