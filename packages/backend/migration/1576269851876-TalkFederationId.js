/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class TalkFederationId1576269851876 {
    constructor() {
        this.name = 'TalkFederationId1576269851876';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "messaging_message" ADD "uri" character varying(512)`, undefined);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "messaging_message" DROP COLUMN "uri"`, undefined);
    }
}
