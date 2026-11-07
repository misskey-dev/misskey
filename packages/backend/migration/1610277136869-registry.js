/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class registry1610277136869 {
    constructor() {
        this.name = 'registry1610277136869';
    }
    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE "registry_item" ("id" character varying(32) NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL, "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL, "userId" character varying(32) NOT NULL, "key" character varying(1024) NOT NULL, "scope" character varying(1024) array NOT NULL DEFAULT '{}'::varchar[], "domain" character varying(512), CONSTRAINT "PK_64b3f7e6008b4d89b826cd3af95" PRIMARY KEY ("id")); COMMENT ON COLUMN "registry_item"."createdAt" IS 'The created date of the RegistryItem.'; COMMENT ON COLUMN "registry_item"."updatedAt" IS 'The updated date of the RegistryItem.'; COMMENT ON COLUMN "registry_item"."userId" IS 'The owner ID.'; COMMENT ON COLUMN "registry_item"."key" IS 'The key of the RegistryItem.'`);
        await queryRunner.query(`CREATE INDEX "IDX_fb9d21ba0abb83223263df6bcb" ON "registry_item" ("userId") `);
        await queryRunner.query(`CREATE INDEX "IDX_22baca135bb8a3ea1a83d13df3" ON "registry_item" ("scope") `);
        await queryRunner.query(`CREATE INDEX "IDX_0a72bdfcdb97c0eca11fe7ecad" ON "registry_item" ("domain") `);
        await queryRunner.query(`ALTER TABLE "registry_item" ADD CONSTRAINT "FK_fb9d21ba0abb83223263df6bcb3" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "registry_item" DROP CONSTRAINT "FK_fb9d21ba0abb83223263df6bcb3"`);
        await queryRunner.query(`DROP INDEX "IDX_0a72bdfcdb97c0eca11fe7ecad"`);
        await queryRunner.query(`DROP INDEX "IDX_22baca135bb8a3ea1a83d13df3"`);
        await queryRunner.query(`DROP INDEX "IDX_fb9d21ba0abb83223263df6bcb"`);
        await queryRunner.query(`DROP TABLE "registry_item"`);
    }
}
