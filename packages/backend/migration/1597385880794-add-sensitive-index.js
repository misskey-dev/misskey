/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class addSensitiveIndex1597385880794 {
    constructor() {
        this.name = 'addSensitiveIndex1597385880794';
    }
    async up(queryRunner) {
        await queryRunner.query(`CREATE INDEX "IDX_a7eba67f8b3fa27271e85d2e26" ON "drive_file" ("isSensitive") `);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX "IDX_a7eba67f8b3fa27271e85d2e26"`);
    }
}
