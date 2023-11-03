export class Gorillamode1698907074200 {
    name = 'Gorillamode1698907074200'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user" ADD "isGorilla" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`COMMENT ON COLUMN "user"."isGorilla" IS 'Whether the User is a gorilla.'`);
    }

    async down(queryRunner) {
        await queryRunner.query(`COMMENT ON COLUMN "user"."isGorilla" IS 'Whether the User is a gorilla.'`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "isGorilla"`);
    }
}
