import {MigrationInterface, QueryRunner} from "typeorm";

export class visibilityUsers1567337649930 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TYPE "public"."note_visibility_enum" RENAME TO "note_visibility_enum_old"`);
        await queryRunner.query(`CREATE TYPE "note_visibility_enum" AS ENUM('public', 'home', 'followers', 'specified', 'users')`);
        await queryRunner.query(`ALTER TABLE "note" ALTER COLUMN "visibility" TYPE "note_visibility_enum" USING "visibility"::"text"::"note_visibility_enum"`);
				await queryRunner.query(`ALTER TYPE "public"."poll_notevisibility_enum" RENAME TO "poll_notevisibility_enum_old"`);
        await queryRunner.query(`CREATE TYPE "poll_notevisibility_enum" AS ENUM('public', 'home', 'followers', 'specified', 'users')`);
        await queryRunner.query(`ALTER TABLE "poll" ALTER COLUMN "noteVisibility" TYPE "poll_notevisibility_enum" USING "noteVisibility"::"text"::"poll_notevisibility_enum"`);
        await queryRunner.query(`DROP TYPE "poll_notevisibility_enum_old"`);
        await queryRunner.query(`COMMENT ON COLUMN "poll"."noteVisibility" IS '[Denormalized]'`);
		}

    public async down(queryRunner: QueryRunner): Promise<any> {
	      await queryRunner.query(`COMMENT ON COLUMN "poll"."noteVisibility" IS ''`);
        await queryRunner.query(`CREATE TYPE "poll_notevisibility_enum_old" AS ENUM('public', 'home', 'followers', 'specified')`);
        await queryRunner.query(`ALTER TABLE "poll" ALTER COLUMN "noteVisibility" TYPE "poll_notevisibility_enum_old" USING "noteVisibility"::"text"::"poll_notevisibility_enum_old"`);
        await queryRunner.query(`DROP TYPE "poll_notevisibility_enum"`);
        await queryRunner.query(`ALTER TYPE "poll_notevisibility_enum_old" RENAME TO  "poll_notevisibility_enum"`);
				await queryRunner.query(`CREATE TYPE "note_visibility_enum_old" AS ENUM('public', 'home', 'followers', 'specified')`);
        await queryRunner.query(`ALTER TABLE "note" ALTER COLUMN "visibility" TYPE "note_visibility_enum_old" USING "visibility"::"text"::"note_visibility_enum_old"`);
        await queryRunner.query(`DROP TYPE "note_visibility_enum"`);
        await queryRunner.query(`ALTER TYPE "note_visibility_enum_old" RENAME TO  "note_visibility_enum"`);
    }

}
