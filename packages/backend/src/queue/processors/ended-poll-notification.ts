import Bull from 'bull';
import { In } from 'typeorm';
import { Notes, Polls, PollVotes } from '@/models/index.js';
import { queueLogger } from '../logger.js';
import { EndedPollNotificationJobData } from '@/queue/types.js';
import { createNotification } from '@/services/create-notification.js';

const logger = queueLogger.createSubLogger('ended-poll-notification');

export async function endedPollNotification(job: Bull.Job<EndedPollNotificationJobData>, done: any): Promise<void> {
	const note = await Notes.findOneBy({ id: job.data.noteId });
	if (note == null || !note.hasPoll) {
		done();
		return;
	}

	const votes = await PollVotes.createQueryBuilder('vote')
		.select('vote.userId')
		.where('vote.noteId = :noteId', { noteId: note.id })
		.innerJoinAndSelect('vote.user', 'user')
		.andWhere('user.host IS NULL')
		.getMany();

	const userIds = [...new Set([note.userId, ...votes.map(v => v.userId)])];

	for (const userId of userIds) {
		createNotification(userId, 'pollEnded', {
			noteId: note.id,
		});
	}

	done();
}
