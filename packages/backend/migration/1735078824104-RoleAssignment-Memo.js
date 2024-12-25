export class RoleAssignmentMemo1735078824104 {
    name = 'RoleAssignmentMemo1735078824104'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "role_assignment" ADD "memo" character varying(256)`);
        await queryRunner.query(`COMMENT ON COLUMN "role_assignment"."memo" IS 'memo for the role assignment'`);
    }

    async down(queryRunner) {
        await queryRunner.query(`COMMENT ON COLUMN "role_assignment"."memo" IS 'memo for the role assignment'`);
        await queryRunner.query(`ALTER TABLE "role_assignment" DROP COLUMN "memo"`);
    }
}
