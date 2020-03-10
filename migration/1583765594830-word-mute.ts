import {MigrationInterface, QueryRunner} from "typeorm";

export class wordMute1583765594830 implements MigrationInterface {
    name = 'wordMute1583765594830'

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`CREATE TABLE "muted_word" ("id" character varying(32) NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL, "condition" text NOT NULL, "userId" character varying(32) NOT NULL, CONSTRAINT "PK_c976cc52c3ba4843ce099c89891" PRIMARY KEY ("id"))`, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_d073fdc9863bb368bad4f2d798" ON "muted_word" ("userId") `, undefined);
        await queryRunner.query(`ALTER TABLE "muted_word" ADD CONSTRAINT "FK_d073fdc9863bb368bad4f2d7983" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "muted_word" DROP CONSTRAINT "FK_d073fdc9863bb368bad4f2d7983"`, undefined);
        await queryRunner.query(`DROP TABLE "muted_word"`, undefined);
    }

}
