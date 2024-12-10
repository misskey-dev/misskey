export class PageVisibility1733563840208 {
    name = 'PageVisibility1733563840208'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TYPE "public"."page_visibility_enum" RENAME TO "page_visibility_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."page_visibility_enum" AS ENUM('public', 'private')`);
        await queryRunner.query(`ALTER TABLE "page" ALTER COLUMN "visibility" TYPE "public"."page_visibility_enum" USING "visibility"::"text"::"public"."page_visibility_enum"`);
        await queryRunner.query(`DROP TYPE "public"."page_visibility_enum_old"`);
				await queryRunner.query(`ALTER TABLE "page" ALTER COLUMN "visibility" SET DEFAULT 'public'`);
    }

    async down(queryRunner) {
        await queryRunner.query(`CREATE TYPE "public"."page_visibility_enum_old" AS ENUM('followers', 'public', 'specified')`);
        await queryRunner.query(`ALTER TABLE "page" ALTER COLUMN "visibility" TYPE "public"."page_visibility_enum_old" USING "visibility"::"text"::"public"."page_visibility_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."page_visibility_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."page_visibility_enum_old" RENAME TO "page_visibility_enum"`);
				await queryRunner.query(`ALTER TABLE "page" ALTER COLUMN "visibility" DROP DEFAULT`);
    }
}
