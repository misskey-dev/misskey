export class PollVotePoll1696604572677 {
		name = 'PollVotePoll1696604572677';

    async up(queryRunner) {
			await queryRunner.query(`ALTER TABLE "poll_vote" ADD CONSTRAINT "FK_poll_vote_poll" FOREIGN KEY ("noteId") REFERENCES "poll"("noteId") ON DELETE CASCADE`);
    }

    async down(queryRunner) {
			await queryRunner.query(`ALTER TABLE "poll_vote" DROP CONSTRAINT "FK_poll_vote_poll"`);
    }

}
