/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class FixMetaDisableRegistration1706791962000 {
    name = 'FixMetaDisableRegistration1706791962000'

    async up(queryRunner) {
        await queryRunner.query(`alter table meta alter column "disableRegistration" set default true;`);
    }

    async down(queryRunner) {
        await queryRunner.query(`alter table meta alter column "disableRegistration" set default false;`);
    }
}
