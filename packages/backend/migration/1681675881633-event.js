export class Event1681675881633 {
    name = 'Event1681675881633'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "note" RENAME COLUMN "isEvent" TO "hasEvent"`);
        await queryRunner.query(`CREATE TYPE "public"."event_notevisibility_enum" AS ENUM('public', 'home', 'followers', 'specified')`);
        await queryRunner.query(`ALTER TABLE "event" ADD "noteVisibility" "public"."event_notevisibility_enum" NOT NULL`);
        await queryRunner.query(`COMMENT ON COLUMN "event"."noteVisibility" IS '[Denormalized]'`);
        await queryRunner.query(`ALTER TABLE "event" ADD "userId" character varying(32) NOT NULL`);
        await queryRunner.query(`COMMENT ON COLUMN "event"."userId" IS '[Denormalized]'`);
        await queryRunner.query(`ALTER TABLE "event" ADD "userHost" character varying(128)`);
        await queryRunner.query(`COMMENT ON COLUMN "event"."userHost" IS '[Denormalized]'`);
        await queryRunner.query(`CREATE INDEX "IDX_01cd2b829e0263917bf570cb67" ON "event" ("userId") `);
        await queryRunner.query(`CREATE INDEX "IDX_f6ba57dff679ccbcfe004698ec" ON "event" ("userHost") `);
    }

    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX "public"."IDX_f6ba57dff679ccbcfe004698ec"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_01cd2b829e0263917bf570cb67"`);
        await queryRunner.query(`COMMENT ON COLUMN "event"."userHost" IS '[Denormalized]'`);
        await queryRunner.query(`ALTER TABLE "event" DROP COLUMN "userHost"`);
        await queryRunner.query(`COMMENT ON COLUMN "event"."userId" IS '[Denormalized]'`);
        await queryRunner.query(`ALTER TABLE "event" DROP COLUMN "userId"`);
        await queryRunner.query(`COMMENT ON COLUMN "event"."noteVisibility" IS '[Denormalized]'`);
        await queryRunner.query(`ALTER TABLE "event" DROP COLUMN "noteVisibility"`);
        await queryRunner.query(`DROP TYPE "public"."event_notevisibility_enum"`);
        await queryRunner.query(`ALTER TABLE "note" RENAME COLUMN "hasEvent" TO "isEvent"`);
    }
}
