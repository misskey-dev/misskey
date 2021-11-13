"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class remoteReaction1586641139527 {
    constructor() {
        this.name = 'remoteReaction1586641139527';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "note_reaction" ALTER COLUMN "reaction" TYPE character varying(260)`, undefined);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "note_reaction" ALTER COLUMN "reaction" TYPE character varying(130)`, undefined);
    }
}
exports.remoteReaction1586641139527 = remoteReaction1586641139527;
