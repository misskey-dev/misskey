import Bull from 'bull';
import { In } from 'typeorm';
import { Mutings } from '@/models/index.js';
import { queueLogger } from '../../logger.js';
import { publishUserEvent } from '@/services/stream.js';

const logger = queueLogger.createSubLogger('check-expired-mutings');

export async function checkExpiredMutings(job: Bull.Job<Record<string, unknown>>, done: any): Promise<void> {
	logger.info(`Checking expired mutings...`);

	const expired = await Mutings.createQueryBuilder('muting')
		.where('muting.expiresAt IS NOT NULL')
		.andWhere('muting.expiresAt < :now', { now: new Date() })
		.innerJoinAndSelect('muting.mutee', 'mutee')
		.getMany();

	if (expired.length > 0) {
		await Mutings.delete({
			id: In(expired.map(m => m.id)),
		});

		for (const m of expired) {
			publishUserEvent(m.muterId, 'unmute', m.mutee!);
		}
	}

	logger.succ(`All expired mutings checked.`);
	done();
}
