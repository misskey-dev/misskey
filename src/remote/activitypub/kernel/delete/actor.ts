import { apLogger } from '../../logger';
import { createDeleteAccountJob } from '@/queue';
import { IRemoteUser } from '@/models/entities/user';
import { Users } from '@/models/index';

const logger = apLogger;

export async function deleteActor(actor: IRemoteUser, uri: string): Promise<string> {
	logger.info(`Deleting the Actor: ${uri}`);

	if (actor.uri !== uri) {
		return `skip: delete actor ${actor.uri} !== ${uri}`;
	}

	if (actor.isDeleted) {
		logger.info(`skip: already deleted`);
	}

	const job = await createDeleteAccountJob(actor);

	await Users.update(actor.id, {
		isDeleted: true,
	});

	return `ok: queued ${job.name} ${job.id}`;
}
