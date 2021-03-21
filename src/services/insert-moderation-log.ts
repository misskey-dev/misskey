import { ILocalUser } from '../models/entities/user';
import { ModerationLogs } from '../models';
import { genId } from '../misc/gen-id';

export async function insertModerationLog(moderator: ILocalUser, type: string, info?: Record<string, any>) {
	await ModerationLogs.insert({
		id: genId(),
		createdAt: new Date(),
		userId: moderator.id,
		type: type,
		info: info || {}
	});
}
